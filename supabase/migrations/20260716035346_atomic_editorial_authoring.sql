-- Authoring is transactional: a claim cannot exist without its first version
-- and primary citation, and a content block cannot exist without its first
-- version and supporting claim link.

create function public.create_claim_draft_atomic(
  target_country_id uuid,
  target_category_id uuid,
  target_portal_section_id uuid,
  target_claim_slug text,
  target_risk_level public.claim_risk_level,
  target_requires_professional_review boolean,
  version_precise_text text,
  version_public_summary text,
  version_user_meaning text,
  version_applicability jsonb,
  version_locale text,
  version_confidence_level public.claim_confidence_level,
  version_effective_from date,
  version_effective_until date,
  citation_source_document_id uuid,
  citation_source_snapshot_id uuid,
  citation_exact_locator text,
  citation_evidence_excerpt text,
  citation_support_note text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  author uuid := auth.uid();
  created_claim_id uuid;
  created_version_id uuid;
  source_country_id uuid;
  snapshot_source_id uuid;
begin
  if author is null or not private.has_staff_role(
    array['editor', 'publisher', 'admin']::public.staff_role[]
  ) then
    raise exception 'Editorial author access required.' using errcode = '42501';
  end if;

  select source.country_id
  into source_country_id
  from public.source_documents source
  where source.id = citation_source_document_id;

  if not found then
    raise exception 'Source document not found.';
  end if;

  if source_country_id is not null and source_country_id <> target_country_id then
    raise exception 'The source document belongs to a different country.';
  end if;

  select snapshot.source_document_id
  into snapshot_source_id
  from public.source_snapshots snapshot
  where snapshot.id = citation_source_snapshot_id;

  if not found or snapshot_source_id <> citation_source_document_id then
    raise exception 'The exact evidence snapshot does not belong to the selected source.';
  end if;

  insert into public.claims (
    country_id, category_id, portal_section_id, claim_slug, risk_level,
    requires_professional_review, created_by
  ) values (
    target_country_id, target_category_id, target_portal_section_id,
    target_claim_slug, target_risk_level,
    target_requires_professional_review, author
  )
  returning id into created_claim_id;

  insert into public.claim_versions (
    claim_id, version_number, precise_text, public_summary, user_meaning,
    applicability, locale, confidence_level, workflow_state, effective_from,
    effective_until, authored_by, change_summary
  ) values (
    created_claim_id, 1, version_precise_text, version_public_summary,
    version_user_meaning, version_applicability, version_locale,
    version_confidence_level, 'draft', version_effective_from,
    version_effective_until, author, 'Initial evidence-backed draft.'
  )
  returning id into created_version_id;

  insert into public.claim_version_citations (
    claim_version_id, source_document_id, source_snapshot_id, role,
    exact_locator, evidence_excerpt, support_note, sort_order, created_by
  ) values (
    created_version_id, citation_source_document_id,
    citation_source_snapshot_id, 'primary', citation_exact_locator,
    citation_evidence_excerpt, citation_support_note, 0, author
  );

  return created_version_id;
end;
$$;

create function public.create_content_block_draft_atomic(
  target_country_id uuid,
  target_portal_section_id uuid,
  target_block_slug text,
  target_kind public.content_block_kind,
  target_risk_level public.claim_risk_level,
  version_title text,
  version_body jsonb,
  supporting_claim_version_id uuid
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  author uuid := auth.uid();
  created_block_id uuid;
  created_version_id uuid;
  supporting_claim_country_id uuid;
begin
  if author is null or not private.has_staff_role(
    array['editor', 'publisher', 'admin']::public.staff_role[]
  ) then
    raise exception 'Editorial author access required.' using errcode = '42501';
  end if;

  select claim.country_id
  into supporting_claim_country_id
  from public.claim_versions claim_version
  join public.claims claim on claim.id = claim_version.claim_id
  where claim_version.id = supporting_claim_version_id;

  if not found or supporting_claim_country_id <> target_country_id then
    raise exception 'The supporting claim version must belong to this country.';
  end if;

  insert into public.content_blocks (
    country_id, portal_section_id, slug, kind, risk_level, created_by
  ) values (
    target_country_id, target_portal_section_id, target_block_slug,
    target_kind, target_risk_level, author
  )
  returning id into created_block_id;

  insert into public.content_block_versions (
    content_block_id, version_number, title, body, workflow_state,
    authored_by, change_summary
  ) values (
    created_block_id, 1, version_title, version_body, 'draft', author,
    'Initial content draft.'
  )
  returning id into created_version_id;

  insert into public.content_block_claims (
    content_block_version_id, claim_version_id, sort_order
  ) values (
    created_version_id, supporting_claim_version_id, 0
  );

  return created_version_id;
end;
$$;

create function public.create_country_release_draft_atomic(
  target_country_id uuid,
  target_release_notes text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  author uuid := auth.uid();
  created_release_id uuid;
  next_release_number integer;
begin
  if author is null or not private.has_staff_role(
    array['editor', 'publisher', 'admin']::public.staff_role[]
  ) then
    raise exception 'Editorial author access required.' using errcode = '42501';
  end if;

  perform 1
  from public.countries country
  where country.id = target_country_id
  for update;

  if not found then
    raise exception 'Country not found.';
  end if;

  select coalesce(max(release.release_number), 0) + 1
  into next_release_number
  from public.country_releases release
  where release.country_id = target_country_id;

  insert into public.country_releases (
    country_id, release_number, state, is_current, release_notes, created_by
  ) values (
    target_country_id, next_release_number, 'draft', false,
    target_release_notes, author
  )
  returning id into created_release_id;

  return created_release_id;
end;
$$;

revoke all on function public.create_claim_draft_atomic(
  uuid, uuid, uuid, text, public.claim_risk_level, boolean, text, text, text,
  jsonb, text, public.claim_confidence_level, date, date, uuid, uuid, text,
  text, text
) from public, anon;
revoke all on function public.create_content_block_draft_atomic(
  uuid, uuid, text, public.content_block_kind, public.claim_risk_level, text,
  jsonb, uuid
) from public, anon;
revoke all on function public.create_country_release_draft_atomic(uuid, text)
from public, anon;

grant execute on function public.create_claim_draft_atomic(
  uuid, uuid, uuid, text, public.claim_risk_level, boolean, text, text, text,
  jsonb, text, public.claim_confidence_level, date, date, uuid, uuid, text,
  text, text
) to authenticated, service_role;
grant execute on function public.create_content_block_draft_atomic(
  uuid, uuid, text, public.content_block_kind, public.claim_risk_level, text,
  jsonb, uuid
) to authenticated, service_role;
grant execute on function public.create_country_release_draft_atomic(uuid, text)
to authenticated, service_role;

comment on function public.create_claim_draft_atomic(
  uuid, uuid, uuid, text, public.claim_risk_level, boolean, text, text, text,
  jsonb, text, public.claim_confidence_level, date, date, uuid, uuid, text,
  text, text
) is 'Atomically creates a claim, first version, and exact primary citation under caller RLS.';
comment on function public.create_content_block_draft_atomic(
  uuid, uuid, text, public.content_block_kind, public.claim_risk_level, text,
  jsonb, uuid
) is 'Atomically creates a content block, first version, and required supporting claim link under caller RLS.';
comment on function public.create_country_release_draft_atomic(uuid, text)
is 'Serializes release numbering per country and atomically creates an empty draft release under caller RLS.';
