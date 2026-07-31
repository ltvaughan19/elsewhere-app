-- Solo MFA publisher exception: admins may self-approve source evidence they authored.
-- Non-admin reviewers remain blocked from approving their own sources.
-- Audit events record selfAttestedByAdmin when that path is used.

create or replace function public.review_source_document(
  target_source_document_id uuid,
  review_decision public.editorial_review_decision,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewer uuid := (select auth.uid());
  review_id uuid;
  snapshot_id uuid;
  verification_required_at timestamptz;
  target_source public.source_documents%rowtype;
  self_attested_by_admin boolean := false;
begin
  if (select auth.role()) = 'service_role'
    or reviewer is null
    or not (select private.has_staff_role(
      array['reviewer', 'publisher', 'admin']::public.staff_role[]
    ))
  then
    raise exception 'Reviewer access required.' using errcode = '42501';
  end if;

  if review_decision is null then
    raise exception 'A source review decision is required.';
  end if;

  if review_checklist is null or jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Review checklist must be a JSON object.';
  end if;

  select *
  into target_source
  from public.source_documents source
  where source.id = target_source_document_id
  for update;

  if not found then
    raise exception 'Source document not found.';
  end if;

  verification_required_at := (
    select private.source_verification_required_at(target_source_document_id)
  );

  if review_decision = 'approved' then
    if reviewer is not distinct from target_source.created_by then
      if not (select private.has_staff_role(array['admin']::public.staff_role[])) then
        raise exception 'Source authors cannot approve their own source evidence.';
      end if;
      self_attested_by_admin := true;
    end if;

    select snapshot.id
    into snapshot_id
    from public.source_snapshots snapshot
    where snapshot.source_document_id = target_source_document_id
      and snapshot.captured_at >= verification_required_at
    order by snapshot.captured_at desc, snapshot.id desc
    limit 1;

    if snapshot_id is null then
      raise exception 'A new exact source snapshot captured after the latest freshness boundary is required before approval.';
    end if;
  end if;

  update public.source_documents
  set state = case
        when review_decision = 'approved' then 'verified'::public.source_document_state
        when review_decision = 'rejected' then 'disputed'::public.source_document_state
        else 'draft'::public.source_document_state
      end,
      last_verified_at = case when review_decision = 'approved' then now() else last_verified_at end,
      review_due_at = case when review_decision = 'approved' then now() + interval '90 days' else review_due_at end
  where id = target_source_document_id;

  insert into public.editorial_reviews (
    source_document_id,
    reviewed_snapshot_id,
    review_kind,
    decision,
    checklist,
    notes,
    reviewer_id
  ) values (
    target_source_document_id,
    snapshot_id,
    'source_verification',
    review_decision,
    review_checklist,
    review_notes,
    reviewer
  ) returning id into review_id;

  insert into public.editorial_audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_data
  ) values (
    reviewer,
    'source.reviewed',
    'source_document',
    target_source_document_id,
    jsonb_build_object(
      'decision', review_decision,
      'reviewId', review_id,
      'snapshotId', snapshot_id,
      'verificationRequiredAt', verification_required_at,
      'selfAttestedByAdmin', self_attested_by_admin
    )
  );

  return review_id;
end;
$$;

comment on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb) is
  'Records source verification. Non-admin authors cannot approve their own sources; admins may self-attest (solo MFA publisher) with selfAttestedByAdmin in the audit event.';
