-- Elsewhere reviewer operations and live-publication hardening.
--
-- Professional approval is an evidence-backed workflow, never a label that a
-- client may insert directly. Credential status changes and emergency claim
-- suppression also take effect on public reads immediately, including blocks.

do $$
begin
  if exists (
    select 1
    from public.editorial_reviews
    where review_kind = 'professional'
  ) then
    raise exception
      'Professional reviews already exist. Migrate them explicitly before applying reviewer hardening.';
  end if;
end;
$$;

create type public.professional_credential_status as enum (
  'pending',
  'verified',
  'suspended',
  'revoked'
);

create type public.professional_assignment_status as enum (
  'assigned',
  'completed',
  'cancelled'
);

create type public.professional_conflict_declaration as enum (
  'no_conflict',
  'disclosed',
  'recused'
);

alter table public.source_snapshots
  add constraint source_snapshots_evidence_identity_unique
  unique (id, source_document_id);

create table public.professional_reviewer_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  organization text check (organization is null or char_length(trim(organization)) between 2 and 160),
  public_bio text check (public_bio is null or char_length(trim(public_bio)) between 20 and 1000),
  attribution_consent boolean not null default false,
  active boolean not null default false,
  activated_by uuid references auth.users(id) on delete restrict,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (not active)
    or (activated_by is not null and activated_at is not null)
  )
);

create table public.professional_credentials (
  id uuid primary key default gen_random_uuid(),
  reviewer_user_id uuid not null references public.professional_reviewer_profiles(user_id) on delete restrict,
  credential_kind text not null check (char_length(trim(credential_kind)) between 2 and 120),
  specialty text not null check (char_length(trim(specialty)) between 2 and 160),
  public_label text not null check (
    char_length(trim(public_label)) between 2 and 160
    and public_label !~ '[0-9]{4,}'
  ),
  issuing_authority text not null check (char_length(trim(issuing_authority)) between 2 and 200),
  jurisdiction_country_id uuid references public.countries(id) on delete restrict,
  jurisdiction_region text check (
    jurisdiction_region is null
    or char_length(trim(jurisdiction_region)) between 2 and 160
  ),
  registry_url text check (registry_url is null or registry_url ~ '^https://'),
  verification_source_document_id uuid references public.source_documents(id) on delete restrict,
  verification_source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  status public.professional_credential_status not null default 'pending',
  status_reason text check (status_reason is null or char_length(trim(status_reason)) between 10 and 1000),
  valid_from date,
  expires_on date,
  issuer_attests_no_expiry boolean not null default false,
  review_due_at timestamptz,
  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, reviewer_user_id),
  check (expires_on is null or valid_from is null or expires_on >= valid_from),
  check (
    (issuer_attests_no_expiry and expires_on is null)
    or (not issuer_attests_no_expiry and expires_on is not null)
    or status = 'pending'
  ),
  check (verified_by is null or verified_by is distinct from reviewer_user_id),
  check (
    (status in ('pending', 'verified') and status_reason is null)
    or (status in ('suspended', 'revoked') and status_reason is not null)
  ),
  check (
    status = 'pending'
    or (
      verification_source_document_id is not null
      and verification_source_snapshot_id is not null
      and review_due_at is not null
      and verified_by is not null
      and verified_at is not null
    )
  )
);

create table public.professional_credential_category_scopes (
  credential_id uuid not null references public.professional_credentials(id) on delete cascade,
  category_id uuid not null references public.claim_categories(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (credential_id, category_id)
);

create table public.professional_credential_country_scopes (
  credential_id uuid not null references public.professional_credentials(id) on delete cascade,
  country_id uuid not null references public.countries(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (credential_id, country_id)
);

create table public.professional_credential_verifications (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null,
  reviewer_user_id uuid not null,
  verification_source_document_id uuid not null,
  verification_source_snapshot_id uuid not null,
  verification_source_review_id uuid not null references public.editorial_reviews(id) on delete restrict,
  valid_from date,
  expires_on date,
  issuer_attests_no_expiry boolean not null,
  review_due_at timestamptz not null,
  verified_by uuid not null references auth.users(id) on delete restrict,
  verified_at timestamptz not null default now(),
  category_scope_ids uuid[] not null check (cardinality(category_scope_ids) > 0),
  country_scope_ids uuid[] not null check (cardinality(country_scope_ids) > 0),
  created_at timestamptz not null default now(),
  unique (id, credential_id, reviewer_user_id),
  foreign key (credential_id, reviewer_user_id)
    references public.professional_credentials(id, reviewer_user_id)
    on delete restrict,
  foreign key (verification_source_snapshot_id, verification_source_document_id)
    references public.source_snapshots(id, source_document_id)
    on delete restrict,
  check (verified_by is distinct from reviewer_user_id),
  check (expires_on is null or valid_from is null or expires_on >= valid_from),
  check (
    (issuer_attests_no_expiry and expires_on is null)
    or (not issuer_attests_no_expiry and expires_on is not null)
  )
);

alter table public.professional_credentials
  add column current_verification_id uuid,
  add constraint professional_credentials_current_verification_fk
    foreign key (current_verification_id, id, reviewer_user_id)
    references public.professional_credential_verifications(id, credential_id, reviewer_user_id)
    on delete restrict,
  add constraint professional_credentials_evidence_identity_fk
    foreign key (verification_source_snapshot_id, verification_source_document_id)
    references public.source_snapshots(id, source_document_id)
    on delete restrict,
  add constraint professional_credentials_current_verification_check
    check (
      status = 'pending'
      or current_verification_id is not null
    );

create table public.professional_review_assignments (
  id uuid primary key default gen_random_uuid(),
  claim_version_id uuid not null references public.claim_versions(id) on delete restrict,
  credential_id uuid not null,
  credential_verification_id uuid not null,
  reviewer_user_id uuid not null,
  status public.professional_assignment_status not null default 'assigned',
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  assignment_notes text check (
    assignment_notes is null
    or char_length(trim(assignment_notes)) between 10 and 2000
  ),
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text check (
    cancellation_reason is null
    or char_length(trim(cancellation_reason)) between 10 and 1000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (credential_id, reviewer_user_id)
    references public.professional_credentials(id, reviewer_user_id)
    on delete restrict,
  foreign key (credential_verification_id, credential_id, reviewer_user_id)
    references public.professional_credential_verifications(id, credential_id, reviewer_user_id)
    on delete restrict,
  check (assigned_by is distinct from reviewer_user_id),
  check (due_at is null or due_at > assigned_at),
  check (
    (status = 'assigned' and completed_at is null and cancelled_at is null)
    or (status = 'completed' and completed_at is not null and cancelled_at is null)
    or (status = 'cancelled' and completed_at is null and cancelled_at is not null)
  )
);

create unique index professional_assignments_one_open_per_version_idx
  on public.professional_review_assignments (claim_version_id)
  where status = 'assigned';

create table public.professional_review_conflicts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.professional_review_assignments(id) on delete restrict,
  reviewer_user_id uuid not null references public.professional_reviewer_profiles(user_id) on delete restrict,
  declaration public.professional_conflict_declaration not null,
  disclosure text check (
    disclosure is null
    or char_length(trim(disclosure)) between 10 and 2000
  ),
  declared_at timestamptz not null default now(),
  check (
    (declaration = 'no_conflict' and disclosure is null)
    or (declaration in ('disclosed', 'recused') and disclosure is not null)
  )
);

alter table public.editorial_reviews
  add column professional_assignment_id uuid
    references public.professional_review_assignments(id) on delete restrict,
  add column professional_credential_verification_id uuid
    references public.professional_credential_verifications(id) on delete restrict,
  add column professional_credential_snapshot jsonb;

alter table public.editorial_reviews
  add constraint editorial_reviews_professional_evidence_check
  check (
    (
      review_kind = 'professional'
      and claim_version_id is not null
      and professional_assignment_id is not null
      and professional_credential_verification_id is not null
      and jsonb_typeof(professional_credential_snapshot) = 'object'
    )
    or (
      review_kind <> 'professional'
      and professional_assignment_id is null
      and professional_credential_verification_id is null
      and professional_credential_snapshot is null
    )
  );

create unique index editorial_reviews_one_professional_assignment_idx
  on public.editorial_reviews (professional_assignment_id)
  where professional_assignment_id is not null;

create index professional_profiles_active_idx
  on public.professional_reviewer_profiles (active, updated_at desc);
create index professional_credentials_reviewer_status_idx
  on public.professional_credentials (reviewer_user_id, status, review_due_at);
create index professional_credentials_expiry_idx
  on public.professional_credentials (expires_on)
  where status = 'verified' and expires_on is not null;
create index professional_assignments_reviewer_status_idx
  on public.professional_review_assignments (reviewer_user_id, status, due_at);
create index professional_assignments_claim_version_idx
  on public.professional_review_assignments (claim_version_id, created_at desc);
create index professional_credential_verifications_credential_idx
  on public.professional_credential_verifications (credential_id, verified_at desc);
create index professional_credential_verifications_evidence_idx
  on public.professional_credential_verifications (
    verification_source_document_id,
    verification_source_snapshot_id,
    verification_source_review_id
  );
create index professional_review_conflicts_current_idx
  on public.professional_review_conflicts (assignment_id, declared_at desc, id desc);

comment on table public.professional_credentials is
  'Verified professional scope. Never store a raw license number or a reversible/low-entropy credential secret here; retain exact evidence in private source snapshots.';
comment on column public.editorial_reviews.professional_credential_snapshot is
  'Immutable, non-secret credential metadata captured at the moment of a professional decision.';
comment on table public.professional_credential_verifications is
  'Append-only credential verification event with exact evidence and immutable category/country scopes.';

create trigger professional_reviewer_profiles_set_updated_at
before update on public.professional_reviewer_profiles
for each row execute function private.set_updated_at();

create trigger professional_credentials_set_updated_at
before update on public.professional_credentials
for each row execute function private.set_updated_at();

create trigger professional_review_assignments_set_updated_at
before update on public.professional_review_assignments
for each row execute function private.set_updated_at();

create trigger professional_credential_verifications_immutable
before update or delete on public.professional_credential_verifications
for each row execute function private.guard_review_immutable();

create function private.guard_professional_conflict_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Conflict declarations are immutable; create a new assignment after recusal.';
end;
$$;

revoke all on function private.guard_professional_conflict_immutable()
from public, anon, authenticated;

create trigger professional_review_conflicts_immutable
before update or delete on public.professional_review_conflicts
for each row execute function private.guard_professional_conflict_immutable();

create function private.guard_professional_review_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.review_kind = 'professional' then
    if auth.role() = 'service_role'
      or coalesce(current_setting('elsewhere.professional_review', true), '') <> 'allowed'
    then
      raise exception 'Professional reviews must be submitted by the assigned human reviewer.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_professional_review_insert()
from public, anon, authenticated;

create trigger editorial_reviews_guard_professional_insert
before insert on public.editorial_reviews
for each row execute function private.guard_professional_review_insert();

-- Current professional approval is evaluated on every publication and public
-- read. Suspension, revocation, expiry, conflict, or scope loss takes effect
-- immediately without rewriting immutable release history.
create function private.claim_version_has_valid_professional_review(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.claim_versions version
    join public.claims claim on claim.id = version.claim_id
    join public.claim_categories category on category.id = claim.category_id
    join public.editorial_reviews review
      on review.claim_version_id = version.id
      and review.review_kind = 'professional'
      and review.decision = 'approved'
    join public.professional_review_assignments assignment
      on assignment.id = review.professional_assignment_id
      and assignment.claim_version_id = version.id
      and assignment.reviewer_user_id = review.reviewer_id
      and assignment.status = 'completed'
      and assignment.completed_at is not null
    join public.professional_credentials credential
      on credential.id = assignment.credential_id
      and credential.reviewer_user_id = assignment.reviewer_user_id
      and credential.current_verification_id = assignment.credential_verification_id
    join public.professional_credential_verifications verification
      on verification.id = assignment.credential_verification_id
      and verification.credential_id = credential.id
      and verification.reviewer_user_id = assignment.reviewer_user_id
      and review.professional_credential_verification_id = verification.id
    join public.professional_reviewer_profiles profile
      on profile.user_id = assignment.reviewer_user_id
      and profile.active
    join public.staff_memberships membership
      on membership.user_id = assignment.reviewer_user_id
      and membership.active
      and membership.role in ('reviewer', 'publisher', 'admin')
    join lateral (
      select conflict_event.declaration
      from public.professional_review_conflicts conflict_event
      where conflict_event.assignment_id = assignment.id
        and conflict_event.reviewer_user_id = assignment.reviewer_user_id
      order by conflict_event.declared_at desc, conflict_event.id desc
      limit 1
    ) conflict on conflict.declaration = 'no_conflict'
    where version.id = target_version_id
      and credential.status = 'verified'
      and verification.review_due_at > now()
      and (verification.valid_from is null or verification.valid_from <= current_date)
      and (
        verification.issuer_attests_no_expiry
        or verification.expires_on >= current_date
      )
      and review.created_at >= version.updated_at
      and review.created_at >= claim.updated_at
      and review.created_at >= category.updated_at
      and review.created_at >= credential.updated_at
      and review.created_at >= verification.verified_at
      and review.reviewer_id is distinct from version.authored_by
      and review.reviewer_id is distinct from claim.created_by
      and not exists (
        select 1
        from public.professional_review_assignments prior_assignment
        join public.claim_versions prior_version
          on prior_version.id = prior_assignment.claim_version_id
        join public.professional_review_conflicts prior_conflict
          on prior_conflict.assignment_id = prior_assignment.id
          and prior_conflict.reviewer_user_id = prior_assignment.reviewer_user_id
          and prior_conflict.declaration in ('disclosed', 'recused')
        where prior_version.claim_id = claim.id
          and prior_assignment.reviewer_user_id = assignment.reviewer_user_id
      )
      and claim.category_id = any(verification.category_scope_ids)
      and claim.country_id = any(verification.country_scope_ids)
      and exists (
        select 1
        from public.source_documents evidence_source
        join public.source_snapshots evidence_snapshot
          on evidence_snapshot.id = verification.verification_source_snapshot_id
          and evidence_snapshot.source_document_id = evidence_source.id
        join public.editorial_reviews evidence_review
          on evidence_review.id = verification.verification_source_review_id
          and evidence_review.source_document_id = evidence_source.id
          and evidence_review.reviewed_snapshot_id = evidence_snapshot.id
          and evidence_review.review_kind = 'source_verification'
          and evidence_review.decision = 'approved'
        where evidence_source.id = verification.verification_source_document_id
          and evidence_source.state = 'verified'
          and evidence_source.review_due_at > now()
          and evidence_review.created_at >= evidence_source.updated_at
          and evidence_review.reviewer_id is distinct from verification.reviewer_user_id
          and evidence_review.reviewer_id is distinct from verification.verified_by
      )
      and exists (
        select 1
        from public.editorial_reviews editorial_review
        where editorial_review.id = (
            review.professional_credential_snapshot ->> 'editorialApprovalId'
          )::uuid
          and editorial_review.claim_version_id = version.id
          and editorial_review.review_kind = 'editorial'
          and editorial_review.decision = 'approved'
          and editorial_review.created_at >= version.updated_at
          and editorial_review.created_at >= claim.updated_at
          and editorial_review.created_at >= category.updated_at
          and editorial_review.reviewer_id is distinct from review.reviewer_id
      )
  );
$$;

revoke all on function private.claim_version_has_valid_professional_review(uuid)
from public, anon, authenticated;

grant execute on function private.claim_version_has_valid_professional_review(uuid)
to anon, authenticated, service_role;

create function private.claim_version_meets_publication_policy(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.claim_versions version
    join public.claims claim on claim.id = version.claim_id
    join public.claim_categories category on category.id = claim.category_id
    where version.id = target_version_id
      and claim.suppressed_at is null
      and version.workflow_state = 'approved'
      and version.review_due_at > now()
      and (version.effective_from is null or version.effective_from <= current_date)
      and (version.effective_until is null or version.effective_until >= current_date)
      and exists (
        select 1
        from public.editorial_reviews editorial_review
        where editorial_review.claim_version_id = version.id
          and editorial_review.review_kind = 'editorial'
          and editorial_review.decision = 'approved'
          and editorial_review.created_at >= greatest(
            version.updated_at,
            claim.updated_at,
            category.updated_at
          )
      )
      and exists (
        select 1
        from public.claim_version_citations citation
        join public.source_documents source
          on source.id = citation.source_document_id
        join public.source_snapshots snapshot
          on snapshot.id = citation.source_snapshot_id
          and snapshot.source_document_id = source.id
        where citation.claim_version_id = version.id
          and citation.role = 'primary'
          and source.state = 'verified'
          and source.review_due_at > now()
          and exists (
            select 1
            from public.editorial_reviews source_review
            where source_review.source_document_id = source.id
              and source_review.review_kind = 'source_verification'
              and source_review.decision = 'approved'
              and source_review.reviewed_snapshot_id = snapshot.id
              and source_review.created_at >= source.updated_at
          )
      )
      and (
        not category.requires_official_source
        or exists (
          select 1
          from public.claim_version_citations official_citation
          join public.source_documents official_source
            on official_source.id = official_citation.source_document_id
          join public.source_snapshots official_snapshot
            on official_snapshot.id = official_citation.source_snapshot_id
            and official_snapshot.source_document_id = official_source.id
          where official_citation.claim_version_id = version.id
            and official_citation.role = 'primary'
            and official_source.state = 'verified'
            and official_source.review_due_at > now()
            and official_source.authority_level in (
              'official_government',
              'embassy_consulate',
              'immigration_authority',
              'intergovernmental'
            )
            and exists (
              select 1
              from public.editorial_reviews official_review
              where official_review.source_document_id = official_source.id
                and official_review.review_kind = 'source_verification'
                and official_review.decision = 'approved'
                and official_review.reviewed_snapshot_id = official_snapshot.id
                and official_review.created_at >= official_source.updated_at
            )
        )
      )
      and (
        not (claim.requires_professional_review or category.requires_professional_review)
        or private.claim_version_has_valid_professional_review(version.id)
      )
  );
$$;

revoke all on function private.claim_version_meets_publication_policy(uuid)
from public, anon, authenticated;

grant execute on function private.claim_version_meets_publication_policy(uuid)
to anon, authenticated, service_role;

create function private.register_professional_reviewer_profile(
  profile_display_name text,
  profile_organization text default null,
  profile_public_bio text default null,
  profile_attribution_consent boolean default false
)
returns public.professional_reviewer_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_profile public.professional_reviewer_profiles%rowtype;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[])
  then
    raise exception 'Active reviewer staff access is required.' using errcode = '42501';
  end if;

  if profile_display_name is null
    or char_length(trim(profile_display_name)) not between 2 and 120
  then
    raise exception 'A display name between 2 and 120 characters is required.';
  end if;

  if profile_organization is not null
    and char_length(trim(profile_organization)) not between 2 and 160
  then
    raise exception 'Organization must be omitted or contain between 2 and 160 characters.';
  end if;

  if profile_public_bio is not null
    and char_length(trim(profile_public_bio)) not between 20 and 1000
  then
    raise exception 'Public bio must be omitted or contain between 20 and 1,000 characters.';
  end if;

  if profile_attribution_consent is null then
    raise exception 'Attribution consent must be explicitly accepted or declined.';
  end if;

  insert into public.professional_reviewer_profiles (
    user_id,
    display_name,
    organization,
    public_bio,
    attribution_consent
  ) values (
    actor,
    trim(profile_display_name),
    nullif(trim(profile_organization), ''),
    nullif(trim(profile_public_bio), ''),
    profile_attribution_consent
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      organization = excluded.organization,
      public_bio = excluded.public_bio,
      attribution_consent = excluded.attribution_consent
  returning * into target_profile;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_reviewer.profile_registered',
    'professional_reviewer_profile',
    actor,
    jsonb_build_object(
      'active', target_profile.active,
      'attributionConsent', target_profile.attribution_consent
    )
  );

  return target_profile;
end;
$$;

create function private.set_professional_reviewer_active(
  target_reviewer_user_id uuid,
  target_active boolean
)
returns public.professional_reviewer_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_profile public.professional_reviewer_profiles%rowtype;
begin
  if auth.role() = 'service_role' or not (
    private.has_staff_role(array['admin']::public.staff_role[])
    and private.has_mfa()
  ) then
    raise exception 'Admin access with MFA is required.' using errcode = '42501';
  end if;

  if target_reviewer_user_id is null or target_active is null then
    raise exception 'Reviewer identity and active status are required.';
  end if;

  if actor is not distinct from target_reviewer_user_id then
    raise exception 'A professional reviewer cannot activate their own profile.';
  end if;

  if target_active and not exists (
    select 1
    from public.staff_memberships membership
    where membership.user_id = target_reviewer_user_id
      and membership.active
      and membership.role in ('reviewer', 'publisher', 'admin')
  ) then
    raise exception 'The reviewer needs an active reviewer-capable staff membership.';
  end if;

  update public.professional_reviewer_profiles
  set active = target_active,
      activated_by = case when target_active then actor else activated_by end,
      activated_at = case when target_active then now() else activated_at end
  where user_id = target_reviewer_user_id
  returning * into target_profile;

  if not found then
    raise exception 'Professional reviewer profile not found.';
  end if;

  if not target_active then
    update public.professional_review_assignments
    set status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = 'Reviewer profile was deactivated.'
    where reviewer_user_id = target_reviewer_user_id
      and status = 'assigned';
  end if;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    case when target_active
      then 'professional_reviewer.activated'
      else 'professional_reviewer.deactivated'
    end,
    'professional_reviewer_profile',
    target_reviewer_user_id,
    jsonb_build_object('active', target_active)
  );

  return target_profile;
end;
$$;

create function private.submit_professional_credential(
  credential_kind_input text,
  specialty_input text,
  public_label_input text,
  issuing_authority_input text,
  jurisdiction_country_id_input uuid default null,
  jurisdiction_region_input text default null,
  registry_url_input text default null
)
returns public.professional_credentials
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target_credential public.professional_credentials%rowtype;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[])
  then
    raise exception 'Active reviewer staff access is required.' using errcode = '42501';
  end if;

  if credential_kind_input is null
    or char_length(trim(credential_kind_input)) not between 2 and 120
    or specialty_input is null
    or char_length(trim(specialty_input)) not between 2 and 160
    or public_label_input is null
    or char_length(trim(public_label_input)) not between 2 and 160
    or issuing_authority_input is null
    or char_length(trim(issuing_authority_input)) not between 2 and 200
  then
    raise exception 'Credential kind, specialty, public label, and issuing authority must use their supported lengths.';
  end if;

  if public_label_input ~ '[0-9]{4,}' then
    raise exception 'Do not place license numbers or other credential secrets in the public label.';
  end if;

  if jurisdiction_region_input is not null
    and char_length(trim(jurisdiction_region_input)) not between 2 and 160
  then
    raise exception 'Jurisdiction region must be omitted or contain between 2 and 160 characters.';
  end if;

  if registry_url_input is not null
    and char_length(trim(registry_url_input)) > 2048
  then
    raise exception 'Credential registry URLs cannot exceed 2,048 characters.';
  end if;

  if not exists (
    select 1
    from public.professional_reviewer_profiles profile
    where profile.user_id = actor
  ) then
    raise exception 'Register a professional reviewer profile first.';
  end if;

  if registry_url_input is not null and registry_url_input !~ '^https://' then
    raise exception 'Credential registry URLs must use HTTPS.';
  end if;

  insert into public.professional_credentials (
    reviewer_user_id,
    credential_kind,
    specialty,
    public_label,
    issuing_authority,
    jurisdiction_country_id,
    jurisdiction_region,
    registry_url
  ) values (
    actor,
    trim(credential_kind_input),
    trim(specialty_input),
    trim(public_label_input),
    trim(issuing_authority_input),
    jurisdiction_country_id_input,
    nullif(trim(jurisdiction_region_input), ''),
    nullif(trim(registry_url_input), '')
  )
  returning * into target_credential;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_credential.submitted',
    'professional_credential',
    target_credential.id,
    jsonb_build_object(
      'credentialKind', target_credential.credential_kind,
      'specialty', target_credential.specialty,
      'status', target_credential.status
    )
  );

  return target_credential;
end;
$$;

create function private.verify_professional_credential(
  target_credential_id uuid,
  target_source_document_id uuid,
  target_source_snapshot_id uuid,
  target_valid_from date,
  target_expires_on date,
  target_issuer_attests_no_expiry boolean,
  target_review_due_at timestamptz,
  target_category_scope_ids uuid[],
  target_country_scope_ids uuid[]
)
returns public.professional_credentials
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  reviewer uuid;
  current_status public.professional_credential_status;
  verification_id uuid;
  verification_source_review_id uuid;
  target_credential public.professional_credentials%rowtype;
begin
  if auth.role() = 'service_role' or not (
    private.has_staff_role(array['admin']::public.staff_role[])
    and private.has_mfa()
  ) then
    raise exception 'Admin access with MFA is required.' using errcode = '42501';
  end if;

  if target_credential_id is null
    or target_source_document_id is null
    or target_source_snapshot_id is null
  then
    raise exception 'Credential and exact verification evidence identifiers are required.';
  end if;

  select credential.reviewer_user_id, credential.status
  into reviewer, current_status
  from public.professional_credentials credential
  where credential.id = target_credential_id
  for update;

  if not found then
    raise exception 'Professional credential not found.';
  end if;

  if actor is not distinct from reviewer then
    raise exception 'A reviewer cannot verify their own credential.';
  end if;

  if current_status = 'revoked' then
    raise exception 'A revoked credential cannot be re-verified; submit a new credential record.';
  end if;

  if not exists (
    select 1
    from public.professional_reviewer_profiles profile
    where profile.user_id = reviewer and profile.active
  ) then
    raise exception 'The professional reviewer profile must be active before verification.';
  end if;

  if coalesce(cardinality(target_category_scope_ids), 0) = 0
    or coalesce(cardinality(target_country_scope_ids), 0) = 0
  then
    raise exception 'At least one category and one country scope are required.';
  end if;

  if exists (
    select 1
    from unnest(target_category_scope_ids) scope_id
    where scope_id is null
      or not exists (
        select 1 from public.claim_categories category
        where category.id = scope_id and category.is_active
      )
  ) then
    raise exception 'Every professional category scope must reference an active claim category.';
  end if;

  if exists (
    select 1
    from unnest(target_country_scope_ids) scope_id
    where scope_id is null
      or not exists (
        select 1 from public.countries country where country.id = scope_id
      )
  ) then
    raise exception 'Every professional country scope must reference an Elsewhere country.';
  end if;

  if target_valid_from is not null and target_valid_from > current_date then
    raise exception 'A credential cannot be verified before its validity begins.';
  end if;

  if target_issuer_attests_no_expiry is null then
    raise exception 'State whether the issuing authority attests that the credential does not expire.';
  end if;

  if target_issuer_attests_no_expiry and target_expires_on is not null then
    raise exception 'A non-expiring credential cannot also have an expiry date.';
  end if;

  if not target_issuer_attests_no_expiry and target_expires_on is null then
    raise exception 'An expiry date is required unless the issuer attests that the credential does not expire.';
  end if;

  if target_expires_on is not null and target_expires_on < current_date then
    raise exception 'An expired credential cannot be verified.';
  end if;

  if target_review_due_at is null
    or target_review_due_at <= now()
    or target_review_due_at > now() + interval '366 days'
  then
    raise exception 'Credential re-verification must be due within the next 366 days.';
  end if;

  select source_review.id
  into verification_source_review_id
  from public.source_documents source
  join public.source_snapshots snapshot
    on snapshot.source_document_id = source.id
    and snapshot.id = target_source_snapshot_id
  join public.editorial_reviews source_review
    on source_review.source_document_id = source.id
    and source_review.reviewed_snapshot_id = snapshot.id
    and source_review.review_kind = 'source_verification'
    and source_review.decision = 'approved'
    and source_review.created_at >= source.updated_at
    and source_review.reviewer_id is distinct from reviewer
    and source_review.reviewer_id is distinct from actor
  where source.id = target_source_document_id
    and source.state = 'verified'
    and source.review_due_at > now()
    and source.authority_level in (
      'official_government',
      'embassy_consulate',
      'immigration_authority',
      'licensed_professional',
      'reputable_institution'
    )
  order by source_review.created_at desc, source_review.id desc
  limit 1;

  if not found then
    raise exception 'Credential verification needs independently reviewed regulator or registry evidence.';
  end if;

  insert into public.professional_credential_verifications (
    credential_id,
    reviewer_user_id,
    verification_source_document_id,
    verification_source_snapshot_id,
    verification_source_review_id,
    valid_from,
    expires_on,
    issuer_attests_no_expiry,
    review_due_at,
    verified_by,
    category_scope_ids,
    country_scope_ids
  ) values (
    target_credential_id,
    reviewer,
    target_source_document_id,
    target_source_snapshot_id,
    verification_source_review_id,
    target_valid_from,
    target_expires_on,
    target_issuer_attests_no_expiry,
    target_review_due_at,
    actor,
    array(
      select distinct scope_id
      from unnest(target_category_scope_ids) scope_id
      order by scope_id
    ),
    array(
      select distinct scope_id
      from unnest(target_country_scope_ids) scope_id
      order by scope_id
    )
  ) returning id into verification_id;

  delete from public.professional_credential_category_scopes
  where credential_id = target_credential_id;
  insert into public.professional_credential_category_scopes (credential_id, category_id)
  select target_credential_id, scope_id
  from (
    select distinct unnest(target_category_scope_ids) as scope_id
  ) category_scopes;

  delete from public.professional_credential_country_scopes
  where credential_id = target_credential_id;
  insert into public.professional_credential_country_scopes (credential_id, country_id)
  select target_credential_id, scope_id
  from (
    select distinct unnest(target_country_scope_ids) as scope_id
  ) country_scopes;

  update public.professional_credentials
  set verification_source_document_id = target_source_document_id,
      verification_source_snapshot_id = target_source_snapshot_id,
      status = 'verified',
      status_reason = null,
      valid_from = target_valid_from,
      expires_on = target_expires_on,
      issuer_attests_no_expiry = target_issuer_attests_no_expiry,
      review_due_at = target_review_due_at,
      verified_by = actor,
      verified_at = now(),
      current_verification_id = verification_id
  where id = target_credential_id
  returning * into target_credential;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_credential.verified',
    'professional_credential',
    target_credential_id,
    jsonb_build_object(
      'reviewerUserId', reviewer,
      'verificationId', verification_id,
      'verificationSourceDocumentId', target_source_document_id,
      'verificationSourceSnapshotId', target_source_snapshot_id,
      'verificationSourceReviewId', verification_source_review_id,
      'verifiedBy', actor,
      'reviewDueAt', target_review_due_at,
      'categoryScopeIds', to_jsonb(target_category_scope_ids),
      'countryScopeIds', to_jsonb(target_country_scope_ids)
    )
  );

  return target_credential;
end;
$$;

create function private.set_professional_credential_status(
  target_credential_id uuid,
  target_status public.professional_credential_status,
  target_reason text
)
returns public.professional_credentials
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  reviewer uuid;
  current_status public.professional_credential_status;
  target_credential public.professional_credentials%rowtype;
begin
  if auth.role() = 'service_role' or not (
    private.has_staff_role(array['admin']::public.staff_role[])
    and private.has_mfa()
  ) then
    raise exception 'Admin access with MFA is required.' using errcode = '42501';
  end if;

  if target_status is null or target_status not in ('suspended', 'revoked') then
    raise exception 'Use full evidence verification to place a credential in verified status.';
  end if;

  if target_credential_id is null then
    raise exception 'A professional credential is required.';
  end if;

  if target_reason is null
    or char_length(trim(target_reason)) not between 10 and 1000
  then
    raise exception 'A credential status reason between 10 and 1,000 characters is required.';
  end if;

  select credential.reviewer_user_id, credential.status
  into reviewer, current_status
  from public.professional_credentials credential
  where credential.id = target_credential_id
  for update;

  if not found then
    raise exception 'Professional credential not found.';
  end if;

  if actor is not distinct from reviewer then
    raise exception 'A reviewer cannot change their own credential status.';
  end if;

  if current_status = 'revoked' then
    raise exception 'A revoked credential cannot be restored or suspended.';
  end if;

  update public.professional_credentials
  set status = target_status,
      status_reason = trim(target_reason)
  where id = target_credential_id
  returning * into target_credential;

  update public.professional_review_assignments
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = 'Credential became ' || target_status::text || '.'
  where credential_id = target_credential_id
    and status = 'assigned';

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    actor,
    'professional_credential.status_changed',
    'professional_credential',
    target_credential_id,
    jsonb_build_object('status', current_status),
    jsonb_build_object('status', target_status, 'reason', trim(target_reason))
  );

  return target_credential;
end;
$$;

create function private.assign_professional_review(
  target_claim_version_id uuid,
  target_credential_id uuid,
  target_due_at timestamptz default null,
  target_assignment_notes text default null
)
returns public.professional_review_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  reviewer uuid;
  verification_id uuid;
  effective_due_at timestamptz := coalesce(target_due_at, now() + interval '7 days');
  target_claim_id uuid;
  target_country_id uuid;
  target_category_id uuid;
  target_authored_by uuid;
  target_created_by uuid;
  target_claim_updated_at timestamptz;
  target_category_updated_at timestamptz;
  target_version_updated_at timestamptz;
  target_assignment public.professional_review_assignments%rowtype;
begin
  if auth.role() = 'service_role' or not (
    private.has_staff_role(array['publisher', 'admin']::public.staff_role[])
    and private.has_mfa()
  ) then
    raise exception 'Publisher access with MFA is required.' using errcode = '42501';
  end if;

  if target_claim_version_id is null or target_credential_id is null then
    raise exception 'Claim version and professional credential are required.';
  end if;

  if target_assignment_notes is not null
    and char_length(trim(target_assignment_notes)) not between 10 and 2000
  then
    raise exception 'Assignment notes must be omitted or contain between 10 and 2,000 characters.';
  end if;

  if effective_due_at <= now() or effective_due_at > now() + interval '30 days' then
    raise exception 'The professional review due date must be within the next 30 days.';
  end if;

  -- Lock order for credential-sensitive workflows is credential, assignment,
  -- then claim version. Status changes and review submission use the same order.
  select credential.reviewer_user_id, verification.id
  into reviewer, verification_id
  from public.professional_credentials credential
  join public.professional_credential_verifications verification
    on verification.id = credential.current_verification_id
    and verification.credential_id = credential.id
    and verification.reviewer_user_id = credential.reviewer_user_id
  join public.professional_reviewer_profiles profile
    on profile.user_id = credential.reviewer_user_id
    and profile.active
  join public.staff_memberships membership
    on membership.user_id = credential.reviewer_user_id
    and membership.active
    and membership.role in ('reviewer', 'publisher', 'admin')
  where credential.id = target_credential_id
    and credential.status = 'verified'
    and verification.review_due_at > now()
    and (verification.valid_from is null or verification.valid_from <= current_date)
    and (
      verification.issuer_attests_no_expiry
      or verification.expires_on >= current_date
    )
    and exists (
      select 1
      from public.source_documents evidence_source
      join public.source_snapshots evidence_snapshot
        on evidence_snapshot.id = verification.verification_source_snapshot_id
        and evidence_snapshot.source_document_id = evidence_source.id
      join public.editorial_reviews evidence_review
        on evidence_review.id = verification.verification_source_review_id
        and evidence_review.source_document_id = evidence_source.id
        and evidence_review.reviewed_snapshot_id = evidence_snapshot.id
        and evidence_review.review_kind = 'source_verification'
        and evidence_review.decision = 'approved'
      where evidence_source.id = verification.verification_source_document_id
        and evidence_source.state = 'verified'
        and evidence_source.review_due_at > now()
        and evidence_review.created_at >= evidence_source.updated_at
        and evidence_review.reviewer_id is distinct from verification.reviewer_user_id
        and evidence_review.reviewer_id is distinct from verification.verified_by
    )
  for update of credential;

  if not found then
    raise exception 'A current evidence-backed credential and active reviewer are required.';
  end if;

  -- Conflict declarations lock the reviewer profile before their assignment.
  -- Take the same profile lock before checking the permanent claim-level block,
  -- so a concurrent disclosure cannot race a replacement assignment through.
  perform 1
  from public.professional_reviewer_profiles profile
  where profile.user_id = reviewer
    and profile.active
  for update;

  if not found then
    raise exception 'The professional reviewer profile is no longer active.';
  end if;

  update public.professional_review_assignments
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = 'Assignment expired before completion.'
  where claim_version_id = target_claim_version_id
    and status = 'assigned'
    and due_at <= now();

  select
    version.claim_id,
    claim.country_id,
    claim.category_id,
    version.authored_by,
    claim.created_by,
    claim.updated_at,
    category.updated_at,
    version.updated_at
  into
    target_claim_id,
    target_country_id,
    target_category_id,
    target_authored_by,
    target_created_by,
    target_claim_updated_at,
    target_category_updated_at,
    target_version_updated_at
  from public.claim_versions version
  join public.claims claim on claim.id = version.claim_id
  join public.claim_categories category on category.id = claim.category_id
  where version.id = target_claim_version_id
    and version.workflow_state = 'approved'
    and version.review_due_at > now()
    and claim.suppressed_at is null
  for update of version;

  if not found then
    raise exception 'A current, approved claim version is required for assignment.';
  end if;

  if reviewer is not distinct from actor
    or reviewer is not distinct from target_authored_by
    or reviewer is not distinct from target_created_by
  then
    raise exception 'The professional reviewer must be independent from the assigner and claim author.';
  end if;

  if exists (
    select 1
    from public.professional_review_assignments prior_assignment
    join public.claim_versions prior_version
      on prior_version.id = prior_assignment.claim_version_id
    join public.professional_review_conflicts prior_conflict
      on prior_conflict.assignment_id = prior_assignment.id
      and prior_conflict.reviewer_user_id = prior_assignment.reviewer_user_id
      and prior_conflict.declaration in ('disclosed', 'recused')
    where prior_version.claim_id = target_claim_id
      and prior_assignment.reviewer_user_id = reviewer
  ) then
    raise exception 'This reviewer previously disclosed a conflict or recused from this claim; assign a different independent reviewer.';
  end if;

  if not exists (
    select 1
    from public.professional_credential_verifications verification
    where verification.id = verification_id
      and target_category_id = any(verification.category_scope_ids)
      and target_country_id = any(verification.country_scope_ids)
  ) then
    raise exception 'The credential is not verified for this claim category and country.';
  end if;

  if not exists (
    select 1
    from public.editorial_reviews editorial_review
    where editorial_review.claim_version_id = target_claim_version_id
      and editorial_review.review_kind = 'editorial'
      and editorial_review.decision = 'approved'
      and editorial_review.created_at >= greatest(
        target_version_updated_at,
        target_claim_updated_at,
        target_category_updated_at
      )
      and editorial_review.reviewer_id is distinct from reviewer
  ) then
    raise exception 'A current editorial approval by someone other than the professional reviewer is required.';
  end if;

  insert into public.professional_review_assignments (
    claim_version_id,
    credential_id,
    credential_verification_id,
    reviewer_user_id,
    assigned_by,
    due_at,
    assignment_notes
  ) values (
    target_claim_version_id,
    target_credential_id,
    verification_id,
    reviewer,
    actor,
    effective_due_at,
    nullif(trim(target_assignment_notes), '')
  )
  returning * into target_assignment;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_review.assigned',
    'professional_review_assignment',
    target_assignment.id,
    jsonb_build_object(
      'claimVersionId', target_claim_version_id,
      'credentialId', target_credential_id,
      'credentialVerificationId', verification_id,
      'reviewerUserId', reviewer,
      'dueAt', effective_due_at
    )
  );

  return target_assignment;
exception
  when unique_violation then
    raise exception 'This claim version already has an open professional review assignment.';
end;
$$;

create function private.cancel_professional_review_assignment(
  target_assignment_id uuid,
  target_reason text
)
returns public.professional_review_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  credential_id_hint uuid;
  target_assignment public.professional_review_assignments%rowtype;
begin
  if auth.role() = 'service_role' or not (
    private.has_staff_role(array['publisher', 'admin']::public.staff_role[])
    and private.has_mfa()
  ) then
    raise exception 'Publisher access with MFA is required.' using errcode = '42501';
  end if;

  if target_assignment_id is null then
    raise exception 'A professional review assignment is required.';
  end if;

  if target_reason is null
    or char_length(trim(target_reason)) not between 10 and 1000
  then
    raise exception 'A cancellation reason between 10 and 1,000 characters is required.';
  end if;

  select assignment.credential_id
  into credential_id_hint
  from public.professional_review_assignments assignment
  where assignment.id = target_assignment_id;

  if not found then
    raise exception 'Professional review assignment not found.';
  end if;

  -- Match the credential -> assignment lock order used by every other
  -- credential-sensitive workflow.
  perform 1
  from public.professional_credentials credential
  where credential.id = credential_id_hint
  for update;

  select * into target_assignment
  from public.professional_review_assignments assignment
  where assignment.id = target_assignment_id
    and assignment.credential_id = credential_id_hint
    and assignment.status = 'assigned'
  for update;

  if not found then
    raise exception 'Only an open professional review assignment may be cancelled.';
  end if;

  if actor is not distinct from target_assignment.reviewer_user_id then
    raise exception 'The assigned reviewer must disclose or recuse through the conflict workflow.';
  end if;

  update public.professional_review_assignments
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = trim(target_reason)
  where id = target_assignment_id
    and status = 'assigned'
  returning * into target_assignment;

  if not found then
    raise exception 'The assignment changed before it could be cancelled.';
  end if;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_review.cancelled',
    'professional_review_assignment',
    target_assignment_id,
    jsonb_build_object(
      'claimVersionId', target_assignment.claim_version_id,
      'credentialVerificationId', target_assignment.credential_verification_id,
      'reviewerUserId', target_assignment.reviewer_user_id,
      'reason', target_assignment.cancellation_reason
    )
  );

  return target_assignment;
end;
$$;

create function private.declare_professional_review_conflict(
  target_assignment_id uuid,
  target_declaration public.professional_conflict_declaration,
  target_disclosure text default null
)
returns public.professional_review_conflicts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  assigned_reviewer uuid;
  assignment_status public.professional_assignment_status;
  target_claim_id uuid;
  target_conflict public.professional_review_conflicts%rowtype;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[])
  then
    raise exception 'The assigned human reviewer must declare conflicts.' using errcode = '42501';
  end if;

  if target_assignment_id is null then
    raise exception 'A professional review assignment is required.';
  end if;

  select assignment.reviewer_user_id, assignment.status
  into assigned_reviewer, assignment_status
  from public.professional_review_assignments assignment
  where assignment.id = target_assignment_id
    and assignment.status in ('assigned', 'completed');

  if not found then
    raise exception 'Active or completed professional review assignment not found.';
  end if;

  if assigned_reviewer is distinct from actor then
    raise exception 'Only the assigned reviewer may declare a conflict.' using errcode = '42501';
  end if;

  -- Profile lifecycle changes lock profile -> assignment. Follow that same
  -- order here before the conflict FK takes its profile key-share lock.
  perform 1
  from public.professional_reviewer_profiles profile
  where profile.user_id = assigned_reviewer
  for update;

  select assignment.reviewer_user_id, assignment.status
  into assigned_reviewer, assignment_status
  from public.professional_review_assignments assignment
  where assignment.id = target_assignment_id
    and assignment.reviewer_user_id = actor
    and assignment.status in ('assigned', 'completed')
  for update;

  if not found then
    raise exception 'The assignment changed before the conflict could be recorded.';
  end if;

  select version.claim_id
  into target_claim_id
  from public.claim_versions version
  where version.id = (
    select assignment.claim_version_id
    from public.professional_review_assignments assignment
    where assignment.id = target_assignment_id
  );

  if not found then
    raise exception 'The assigned claim could not be resolved.';
  end if;

  if target_declaration is null then
    raise exception 'A conflict declaration is required.';
  end if;

  if target_declaration = 'no_conflict' and assignment_status <> 'assigned' then
    raise exception 'A no-conflict declaration must precede review completion.';
  end if;

  if target_declaration = 'no_conflict' and exists (
    select 1
    from public.professional_review_conflicts prior_conflict
    where prior_conflict.assignment_id = target_assignment_id
      and prior_conflict.declaration in ('disclosed', 'recused')
  ) then
    raise exception 'A disclosed conflict or recusal is permanent for this assignment; create a new assignment.';
  end if;

  if target_declaration = 'no_conflict' and target_disclosure is not null then
    raise exception 'No disclosure text is stored for a no-conflict declaration.';
  end if;

  if target_declaration in ('disclosed', 'recused')
    and char_length(trim(coalesce(target_disclosure, ''))) not between 10 and 2000
  then
    raise exception 'A conflict disclosure between 10 and 2,000 characters is required.';
  end if;

  insert into public.professional_review_conflicts (
    assignment_id,
    reviewer_user_id,
    declaration,
    disclosure
  ) values (
    target_assignment_id,
    actor,
    target_declaration,
    case
      when target_declaration = 'no_conflict' then null
      else trim(target_disclosure)
    end
  )
  returning * into target_conflict;

  if target_declaration <> 'no_conflict' then
    update public.professional_review_assignments
    set status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = case
          when target_declaration = 'recused'
            then 'Reviewer recused after conflict declaration.'
          else 'Conflict disclosed; leadership must create an independent assignment.'
        end
    where reviewer_user_id = actor
      and status = 'assigned'
      and exists (
        select 1
        from public.claim_versions version
        where version.id = professional_review_assignments.claim_version_id
          and version.claim_id = target_claim_id
      );
  end if;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_review.conflict_declared',
    'professional_review_assignment',
    target_assignment_id,
    jsonb_build_object('declaration', target_declaration)
  );

  return target_conflict;
end;
$$;

create function private.review_professional_assignment(
  target_assignment_id uuid,
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
  actor uuid := auth.uid();
  credential_id_hint uuid;
  target_assignment public.professional_review_assignments%rowtype;
  target_credential public.professional_credentials%rowtype;
  target_verification public.professional_credential_verifications%rowtype;
  target_profile public.professional_reviewer_profiles%rowtype;
  target_conflict public.professional_review_conflicts%rowtype;
  target_claim_id uuid;
  target_country_id uuid;
  target_category_id uuid;
  target_authored_by uuid;
  target_created_by uuid;
  target_version_updated_at timestamptz;
  target_claim_updated_at timestamptz;
  target_category_updated_at timestamptz;
  credential_evidence_review_id uuid;
  credential_evidence_content_hash text;
  credential_evidence_captured_at timestamptz;
  editorial_approval_id uuid;
  review_id uuid;
  credential_snapshot jsonb;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[])
    or not private.has_mfa()
  then
    raise exception 'The assigned human reviewer must sign in with MFA.' using errcode = '42501';
  end if;

  if target_assignment_id is null then
    raise exception 'A professional review assignment is required.';
  end if;

  if review_decision is null then
    raise exception 'A professional review decision is required.';
  end if;

  if review_checklist is null or jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Review checklist must be a JSON object.';
  end if;

  if review_notes is not null
    and char_length(trim(review_notes)) > 5000
  then
    raise exception 'Professional review notes cannot exceed 5,000 characters.';
  end if;

  if review_decision <> 'approved'
    and char_length(trim(coalesce(review_notes, ''))) < 10
  then
    raise exception 'Changes requested or rejected decisions require meaningful review notes.';
  end if;

  -- Read only the credential identity first. Every workflow that can change a
  -- credential or its assignments then locks credential -> assignment -> claim
  -- version, preventing stale decisions and avoiding lock-order deadlocks.
  select assignment.credential_id
  into credential_id_hint
  from public.professional_review_assignments assignment
  where assignment.id = target_assignment_id;

  if not found then
    raise exception 'Professional review assignment not found.';
  end if;

  select * into target_credential
  from public.professional_credentials credential
  where credential.id = credential_id_hint
  for update;

  if not found
    or target_credential.reviewer_user_id is distinct from actor
    or target_credential.status <> 'verified'
    or target_credential.current_verification_id is null
  then
    raise exception 'The assigned credential is no longer verified and current.';
  end if;

  select * into target_assignment
  from public.professional_review_assignments assignment
  where assignment.id = target_assignment_id
    and assignment.status = 'assigned'
    and assignment.credential_id = target_credential.id
    and assignment.credential_verification_id = target_credential.current_verification_id
    and assignment.reviewer_user_id = actor
  for update;

  if not found then
    raise exception 'The assignment is closed or no longer matches the credential verification that was assigned.';
  end if;

  if target_assignment.due_at is not null and target_assignment.due_at <= now() then
    raise exception 'This assignment has expired and must be reassigned.';
  end if;

  select * into target_verification
  from public.professional_credential_verifications verification
  where verification.id = target_assignment.credential_verification_id
    and verification.credential_id = target_credential.id
    and verification.reviewer_user_id = actor;

  if not found
    or target_verification.review_due_at <= now()
    or (target_verification.valid_from is not null and target_verification.valid_from > current_date)
    or (
      not target_verification.issuer_attests_no_expiry
      and target_verification.expires_on < current_date
    )
  then
    raise exception 'The exact credential verification assigned to this review is no longer current.';
  end if;

  select * into target_profile
  from public.professional_reviewer_profiles profile
  where profile.user_id = actor and profile.active;

  if not found then
    raise exception 'The professional reviewer profile is inactive.';
  end if;

  if not exists (
    select 1
    from public.staff_memberships membership
    where membership.user_id = actor
      and membership.active
      and membership.role in ('reviewer', 'publisher', 'admin')
  ) then
    raise exception 'An active reviewer-capable staff membership is required.' using errcode = '42501';
  end if;

  select
    version.claim_id,
    claim.country_id,
    claim.category_id,
    version.authored_by,
    claim.created_by,
    version.updated_at,
    claim.updated_at,
    category.updated_at
  into
    target_claim_id,
    target_country_id,
    target_category_id,
    target_authored_by,
    target_created_by,
    target_version_updated_at,
    target_claim_updated_at,
    target_category_updated_at
  from public.claim_versions version
  join public.claims claim on claim.id = version.claim_id
  join public.claim_categories category on category.id = claim.category_id
  where version.id = target_assignment.claim_version_id
    and version.workflow_state = 'approved'
    and version.review_due_at > now()
    and claim.suppressed_at is null
  for update of version;

  if not found then
    raise exception 'The assigned claim version is no longer current and approved.';
  end if;

  if actor is not distinct from target_authored_by
    or actor is not distinct from target_created_by
  then
    raise exception 'A professional reviewer cannot approve guidance they authored.';
  end if;

  select * into target_conflict
  from public.professional_review_conflicts conflict_event
  where conflict_event.assignment_id = target_assignment_id
    and conflict_event.reviewer_user_id = actor
  order by conflict_event.declared_at desc, conflict_event.id desc
  limit 1;

  if not found or target_conflict.declaration <> 'no_conflict' then
    raise exception 'The latest conflict declaration must affirm no conflict before review.';
  end if;

  if exists (
    select 1
    from public.professional_review_assignments prior_assignment
    join public.claim_versions prior_version
      on prior_version.id = prior_assignment.claim_version_id
    join public.professional_review_conflicts prior_conflict
      on prior_conflict.assignment_id = prior_assignment.id
      and prior_conflict.reviewer_user_id = prior_assignment.reviewer_user_id
      and prior_conflict.declaration in ('disclosed', 'recused')
    where prior_version.claim_id = target_claim_id
      and prior_assignment.reviewer_user_id = actor
  ) then
    raise exception 'A prior disclosed conflict or recusal permanently blocks this reviewer from the claim.';
  end if;

  if not target_category_id = any(target_verification.category_scope_ids)
    or not target_country_id = any(target_verification.country_scope_ids)
  then
    raise exception 'The immutable credential scope assigned to this review does not cover the claim.';
  end if;

  select
    evidence_review.id,
    evidence_snapshot.content_hash,
    evidence_snapshot.captured_at
  into
    credential_evidence_review_id,
    credential_evidence_content_hash,
    credential_evidence_captured_at
  from public.source_documents evidence_source
  join public.source_snapshots evidence_snapshot
    on evidence_snapshot.id = target_verification.verification_source_snapshot_id
    and evidence_snapshot.source_document_id = evidence_source.id
  join public.editorial_reviews evidence_review
    on evidence_review.id = target_verification.verification_source_review_id
    and evidence_review.source_document_id = evidence_source.id
    and evidence_review.reviewed_snapshot_id = evidence_snapshot.id
    and evidence_review.review_kind = 'source_verification'
    and evidence_review.decision = 'approved'
    and evidence_review.created_at >= evidence_source.updated_at
    and evidence_review.reviewer_id is distinct from actor
    and evidence_review.reviewer_id is distinct from target_verification.verified_by
  where evidence_source.id = target_verification.verification_source_document_id
    and evidence_source.state = 'verified'
    and evidence_source.review_due_at > now()
  limit 1;

  if not found then
    raise exception 'The exact regulator or registry evidence for this credential is no longer independently verified.';
  end if;

  select editorial_review.id
  into editorial_approval_id
  from public.editorial_reviews editorial_review
  where editorial_review.claim_version_id = target_assignment.claim_version_id
    and editorial_review.review_kind = 'editorial'
    and editorial_review.decision = 'approved'
    and editorial_review.created_at >= greatest(
      target_version_updated_at,
      target_claim_updated_at,
      target_category_updated_at
    )
    and editorial_review.reviewer_id is distinct from actor
  order by editorial_review.created_at desc, editorial_review.id desc
  limit 1;

  if not found then
    raise exception 'A current independent editorial approval is required.';
  end if;

  credential_snapshot := jsonb_build_object(
    'schemaVersion', 2,
    'credentialId', target_credential.id,
    'credentialVerificationId', target_verification.id,
    'credentialStatus', target_credential.status,
    'reviewerUserId', actor,
    'displayName', case
      when target_profile.attribution_consent then target_profile.display_name
      else 'Independent credentialed professional'
    end,
    'organization', case
      when target_profile.attribution_consent then target_profile.organization
      else null
    end,
    'attributionConsent', target_profile.attribution_consent,
    'credentialKind', target_credential.credential_kind,
    'specialty', target_credential.specialty,
    'publicLabel', target_credential.public_label,
    'issuingAuthority', target_credential.issuing_authority,
    'jurisdictionCountryId', target_credential.jurisdiction_country_id,
    'jurisdictionRegion', target_credential.jurisdiction_region,
    'validFrom', target_verification.valid_from,
    'expiresOn', target_verification.expires_on,
    'issuerAttestsNoExpiry', target_verification.issuer_attests_no_expiry,
    'verifiedBy', target_verification.verified_by,
    'verifiedAt', target_verification.verified_at,
    'reviewDueAt', target_verification.review_due_at,
    'categoryScopeIds', to_jsonb(target_verification.category_scope_ids),
    'countryScopeIds', to_jsonb(target_verification.country_scope_ids),
    'verificationSourceDocumentId', target_verification.verification_source_document_id,
    'verificationSourceSnapshotId', target_verification.verification_source_snapshot_id,
    'verificationSourceContentHash', credential_evidence_content_hash,
    'verificationSourceCapturedAt', credential_evidence_captured_at,
    'verificationSourceReviewId', credential_evidence_review_id,
    'editorialApprovalId', editorial_approval_id,
    'latestConflictDeclarationId', target_conflict.id,
    'latestConflictDeclaration', target_conflict.declaration,
    'latestConflictDeclaredAt', target_conflict.declared_at,
    'claimVersionUpdatedAt', target_version_updated_at,
    'claimUpdatedAt', target_claim_updated_at,
    'claimCategoryUpdatedAt', target_category_updated_at,
    'capturedAt', now()
  );

  perform set_config('elsewhere.professional_review', 'allowed', true);

  insert into public.editorial_reviews (
    claim_version_id,
    professional_assignment_id,
    professional_credential_verification_id,
    professional_credential_snapshot,
    review_kind,
    decision,
    checklist,
    notes,
    reviewer_id
  ) values (
    target_assignment.claim_version_id,
    target_assignment_id,
    target_verification.id,
    credential_snapshot,
    'professional',
    review_decision,
    review_checklist,
    nullif(trim(review_notes), ''),
    actor
  )
  returning id into review_id;

  update public.professional_review_assignments
  set status = 'completed',
      completed_at = now()
  where id = target_assignment_id
    and status = 'assigned'
    and credential_verification_id = target_verification.id;

  if not found then
    raise exception 'The assignment changed before the professional decision could be completed.';
  end if;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'professional_review.completed',
    'professional_review_assignment',
    target_assignment_id,
    jsonb_build_object(
      'claimVersionId', target_assignment.claim_version_id,
      'reviewId', review_id,
      'decision', review_decision,
      'credentialId', target_credential.id,
      'credentialVerificationId', target_verification.id,
      'editorialApprovalId', editorial_approval_id,
      'latestConflictDeclarationId', target_conflict.id
    )
  );

  return review_id;
end;
$$;

-- Exposed functions are invoker wrappers. Privileged implementations remain
-- in the private schema and independently enforce identity, role, and MFA.
create function public.register_professional_reviewer_profile(
  profile_display_name text,
  profile_organization text default null,
  profile_public_bio text default null,
  profile_attribution_consent boolean default false
)
returns public.professional_reviewer_profiles
language sql
security invoker
set search_path = ''
as $$
  select private.register_professional_reviewer_profile($1, $2, $3, $4);
$$;

create function public.set_professional_reviewer_active(
  target_reviewer_user_id uuid,
  target_active boolean
)
returns public.professional_reviewer_profiles
language sql
security invoker
set search_path = ''
as $$
  select private.set_professional_reviewer_active($1, $2);
$$;

create function public.submit_professional_credential(
  credential_kind_input text,
  specialty_input text,
  public_label_input text,
  issuing_authority_input text,
  jurisdiction_country_id_input uuid default null,
  jurisdiction_region_input text default null,
  registry_url_input text default null
)
returns public.professional_credentials
language sql
security invoker
set search_path = ''
as $$
  select private.submit_professional_credential($1, $2, $3, $4, $5, $6, $7);
$$;

create function public.verify_professional_credential(
  target_credential_id uuid,
  target_source_document_id uuid,
  target_source_snapshot_id uuid,
  target_valid_from date,
  target_expires_on date,
  target_issuer_attests_no_expiry boolean,
  target_review_due_at timestamptz,
  target_category_scope_ids uuid[],
  target_country_scope_ids uuid[]
)
returns public.professional_credentials
language sql
security invoker
set search_path = ''
as $$
  select private.verify_professional_credential($1, $2, $3, $4, $5, $6, $7, $8, $9);
$$;

create function public.set_professional_credential_status(
  target_credential_id uuid,
  target_status public.professional_credential_status,
  target_reason text
)
returns public.professional_credentials
language sql
security invoker
set search_path = ''
as $$
  select private.set_professional_credential_status($1, $2, $3);
$$;

create function public.assign_professional_review(
  target_claim_version_id uuid,
  target_credential_id uuid,
  target_due_at timestamptz default null,
  target_assignment_notes text default null
)
returns public.professional_review_assignments
language sql
security invoker
set search_path = ''
as $$
  select private.assign_professional_review($1, $2, $3, $4);
$$;

create function public.cancel_professional_review_assignment(
  target_assignment_id uuid,
  target_reason text
)
returns public.professional_review_assignments
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_professional_review_assignment($1, $2);
$$;

create function public.declare_professional_review_conflict(
  target_assignment_id uuid,
  target_declaration public.professional_conflict_declaration,
  target_disclosure text default null
)
returns public.professional_review_conflicts
language sql
security invoker
set search_path = ''
as $$
  select private.declare_professional_review_conflict($1, $2, $3);
$$;

create function public.review_professional_assignment(
  target_assignment_id uuid,
  review_decision public.editorial_review_decision,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.review_professional_assignment($1, $2, $3, $4);
$$;

alter table public.professional_review_assignments
  add constraint professional_assignments_reviewer_identity_unique
  unique (id, reviewer_user_id),
  add constraint professional_assignments_exact_review_identity_unique
  unique (id, claim_version_id, reviewer_user_id, credential_verification_id);

alter table public.professional_review_conflicts
  add constraint professional_conflicts_match_assignment_reviewer
  foreign key (assignment_id, reviewer_user_id)
  references public.professional_review_assignments(id, reviewer_user_id)
  on delete restrict;

alter table public.editorial_reviews
  add constraint editorial_professional_review_matches_assignment
  foreign key (
    professional_assignment_id,
    claim_version_id,
    reviewer_id,
    professional_credential_verification_id
  )
  references public.professional_review_assignments(
    id,
    claim_version_id,
    reviewer_user_id,
    credential_verification_id
  )
  on delete restrict;

-- Trust requirements are allowed to become stricter immediately, which only
-- hides guidance. Relaxing a requirement is a materially different action:
-- released history can never be relaxed in place, and pre-release relaxation
-- is available only through the audited MFA implementations below.
create function private.guard_claim_category_trust_relaxation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  relaxing_official boolean;
  relaxing_professional boolean;
begin
  relaxing_official := old.requires_official_source and not new.requires_official_source;
  relaxing_professional := old.requires_professional_review and not new.requires_professional_review;

  if not (relaxing_official or relaxing_professional) then
    return new;
  end if;

  if exists (
    select 1
    from public.claims claim
    join public.release_claim_versions item on item.claim_id = claim.id
    join public.country_releases release on release.id = item.release_id
    where claim.category_id = old.id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Trust requirements for a category used by released history cannot be relaxed in place.';
  end if;

  if auth.role() = 'service_role'
    or coalesce(current_setting('elsewhere.category_trust_relaxation', true), '') <> 'allowed'
    or not (
      private.has_staff_role(array['admin']::public.staff_role[])
      and private.has_mfa()
    )
  then
    raise exception 'Pre-release category trust relaxation requires the audited admin MFA workflow.'
      using errcode = '42501';
  end if;

  if (to_jsonb(new) - array[
        'requires_official_source',
        'requires_professional_review',
        'updated_at'
      ]) is distinct from
     (to_jsonb(old) - array[
        'requires_official_source',
        'requires_professional_review',
        'updated_at'
      ])
  then
    raise exception 'A trust-relaxation operation cannot change unrelated category fields.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_claim_category_trust_relaxation()
from public, anon, authenticated, service_role;

create trigger claim_categories_guard_trust_relaxation
before update of requires_official_source, requires_professional_review
on public.claim_categories
for each row execute function private.guard_claim_category_trust_relaxation();

create function private.guard_claim_professional_requirement_relaxation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_category_requires_official boolean;
  old_category_requires_professional boolean;
  new_category_requires_official boolean;
  new_category_requires_professional boolean;
begin
  if old.category_id is distinct from new.category_id then
    select category.requires_official_source, category.requires_professional_review
    into old_category_requires_official, old_category_requires_professional
    from public.claim_categories category
    where category.id = old.category_id;

    select category.requires_official_source, category.requires_professional_review
    into new_category_requires_official, new_category_requires_professional
    from public.claim_categories category
    where category.id = new.category_id;

    if (
      old_category_requires_official and not new_category_requires_official
    ) or (
      old_category_requires_professional and not new_category_requires_professional
    ) then
      raise exception 'A claim cannot be reclassified into a category with weaker official-source or professional-review requirements.';
    end if;
  end if;

  if not (old.requires_professional_review and not new.requires_professional_review) then
    return new;
  end if;

  if auth.role() = 'service_role'
    or coalesce(current_setting('elsewhere.claim_professional_relaxation', true), '') <> 'allowed'
    or not (
      private.has_staff_role(array['admin']::public.staff_role[])
      and private.has_mfa()
    )
  then
    raise exception 'Claim professional-review relaxation requires the audited admin MFA workflow.'
      using errcode = '42501';
  end if;

  if (to_jsonb(new) - array['requires_professional_review', 'updated_at'])
      is distinct from
     (to_jsonb(old) - array['requires_professional_review', 'updated_at'])
  then
    raise exception 'A professional-review relaxation cannot change unrelated claim fields.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_claim_professional_requirement_relaxation()
from public, anon, authenticated, service_role;

create trigger claims_guard_professional_requirement_relaxation
before update of requires_professional_review, category_id on public.claims
for each row execute function private.guard_claim_professional_requirement_relaxation();

create function private.set_claim_category_trust_requirements(
  target_category_id uuid,
  target_requires_official_source boolean,
  target_requires_professional_review boolean,
  change_reason text
)
returns public.claim_categories
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  prior_category public.claim_categories%rowtype;
  target_category public.claim_categories%rowtype;
  reset_release_count integer := 0;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not (
      private.has_staff_role(array['admin']::public.staff_role[])
      and private.has_mfa()
    )
  then
    raise exception 'Admin access with MFA is required.' using errcode = '42501';
  end if;

  if target_category_id is null
    or target_requires_official_source is null
    or target_requires_professional_review is null
  then
    raise exception 'Category and both trust requirements are required.';
  end if;

  if change_reason is null
    or char_length(trim(change_reason)) not between 10 and 1000
  then
    raise exception 'A trust-requirement change reason between 10 and 1,000 characters is required.';
  end if;

  select * into prior_category
  from public.claim_categories category
  where category.id = target_category_id
  for update;

  if not found then
    raise exception 'Claim category not found.';
  end if;

  if prior_category.requires_official_source = target_requires_official_source
    and prior_category.requires_professional_review = target_requires_professional_review
  then
    raise exception 'The requested category trust requirements are already active.';
  end if;

  if (
      (prior_category.requires_official_source and not target_requires_official_source)
      or (
        prior_category.requires_professional_review
        and not target_requires_professional_review
      )
    ) and exists (
      select 1
      from public.claims claim
      join public.release_claim_versions item on item.claim_id = claim.id
      join public.country_releases release on release.id = item.release_id
      where claim.category_id = target_category_id
        and release.state in ('published', 'superseded', 'withdrawn')
    )
  then
    raise exception 'Trust requirements for a category used by released history cannot be relaxed in place.';
  end if;

  perform set_config('elsewhere.category_trust_relaxation', 'allowed', true);

  update public.claim_categories
  set requires_official_source = target_requires_official_source,
      requires_professional_review = target_requires_professional_review
  where id = target_category_id
  returning * into target_category;

  update public.country_releases release
  set state = 'draft'
  where release.state = 'ready'
    and exists (
      select 1
      from public.release_claim_versions item
      join public.claims claim on claim.id = item.claim_id
      where item.release_id = release.id
        and claim.category_id = target_category_id
    );
  get diagnostics reset_release_count = row_count;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    actor,
    'claim_category.trust_requirements_changed',
    'claim_category',
    target_category_id,
    jsonb_build_object(
      'requiresOfficialSource', prior_category.requires_official_source,
      'requiresProfessionalReview', prior_category.requires_professional_review
    ),
    jsonb_build_object(
      'requiresOfficialSource', target_category.requires_official_source,
      'requiresProfessionalReview', target_category.requires_professional_review,
      'reason', trim(change_reason),
      'changedBy', actor,
      'readyReleasesResetToDraft', reset_release_count
    )
  );

  return target_category;
end;
$$;

create function private.relax_claim_professional_review_requirement(
  target_claim_id uuid,
  change_reason text
)
returns public.claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  prior_claim public.claims%rowtype;
  target_claim public.claims%rowtype;
  reset_release_count integer := 0;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not (
      private.has_staff_role(array['admin']::public.staff_role[])
      and private.has_mfa()
    )
  then
    raise exception 'Admin access with MFA is required.' using errcode = '42501';
  end if;

  if target_claim_id is null then
    raise exception 'A claim is required.';
  end if;

  if change_reason is null
    or char_length(trim(change_reason)) not between 10 and 1000
  then
    raise exception 'A professional-review relaxation reason between 10 and 1,000 characters is required.';
  end if;

  select * into prior_claim
  from public.claims claim
  where claim.id = target_claim_id
  for update;

  if not found then
    raise exception 'Claim not found.';
  end if;

  if not prior_claim.requires_professional_review then
    raise exception 'This claim does not have a claim-specific professional-review requirement.';
  end if;

  if exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.claim_id = target_claim_id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'A claim referenced by released history cannot relax its professional-review requirement.';
  end if;

  perform set_config('elsewhere.claim_professional_relaxation', 'allowed', true);

  update public.claims
  set requires_professional_review = false
  where id = target_claim_id
    and requires_professional_review
  returning * into target_claim;

  if not found then
    raise exception 'The claim changed before its professional-review requirement could be relaxed.';
  end if;

  update public.country_releases release
  set state = 'draft'
  where release.state = 'ready'
    and exists (
      select 1
      from public.release_claim_versions item
      where item.release_id = release.id
        and item.claim_id = target_claim_id
    );
  get diagnostics reset_release_count = row_count;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    actor,
    'claim.professional_review_requirement_relaxed',
    'claim',
    target_claim_id,
    jsonb_build_object('requiresProfessionalReview', true),
    jsonb_build_object(
      'requiresProfessionalReview', false,
      'reason', trim(change_reason),
      'changedBy', actor,
      'readyReleasesResetToDraft', reset_release_count
    )
  );

  return target_claim;
end;
$$;

create function public.set_claim_category_trust_requirements(
  target_category_id uuid,
  target_requires_official_source boolean,
  target_requires_professional_review boolean,
  change_reason text
)
returns public.claim_categories
language sql
security invoker
set search_path = ''
as $$
  select private.set_claim_category_trust_requirements($1, $2, $3, $4);
$$;

create function public.relax_claim_professional_review_requirement(
  target_claim_id uuid,
  change_reason text
)
returns public.claims
language sql
security invoker
set search_path = ''
as $$
  select private.relax_claim_professional_review_requirement($1, $2);
$$;

-- Release mappings freeze version rows, but the parent claim/block identities
-- and the block-to-claim links also shape what a reader sees and which policy
-- gates apply. Freeze all of them once any published history references them.
create function private.guard_released_claim_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  has_release_history boolean;
begin
  select exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.claim_id = old.id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) into has_release_history;

  if not has_release_history then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Released claim identity is immutable; retain the historical record.';
  end if;

  if coalesce(current_setting('elsewhere.emergency_claim_suppression', true), '') <> 'allowed'
  then
    raise exception 'Released claim identity is immutable; create and release a new claim version.';
  end if;

  if (to_jsonb(new) - array['suppressed_at', 'suppressed_reason', 'updated_at'])
      is distinct from
     (to_jsonb(old) - array['suppressed_at', 'suppressed_reason', 'updated_at'])
    or old.suppressed_at is not null
    or new.suppressed_at is null
    or new.suppressed_reason is null
    or char_length(trim(new.suppressed_reason)) not between 10 and 1000
  then
    raise exception 'Emergency suppression may only take an unsuppressed released claim offline with a meaningful reason.';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_released_claim_identity()
from public, anon, authenticated, service_role;

create trigger claims_guard_released_identity
before update or delete on public.claims
for each row execute function private.guard_released_claim_identity();

create function private.guard_released_content_block_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.release_block_versions item
    join public.country_releases release on release.id = item.release_id
    where item.content_block_id = old.id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Released content block identity is immutable; create a new version or block.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.guard_released_content_block_identity()
from public, anon, authenticated, service_role;

create trigger content_blocks_guard_released_identity
before update or delete on public.content_blocks
for each row execute function private.guard_released_content_block_identity();

create function private.guard_released_content_block_claim_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.release_block_versions item
    join public.country_releases release on release.id = item.release_id
    where item.content_block_version_id = case
      when tg_op = 'INSERT' then new.content_block_version_id
      else old.content_block_version_id
    end
      and release.state in ('published', 'superseded', 'withdrawn')
  ) or (
    tg_op = 'UPDATE'
    and exists (
      select 1
      from public.release_block_versions item
      join public.country_releases release on release.id = item.release_id
      where item.content_block_version_id = new.content_block_version_id
        and release.state in ('published', 'superseded', 'withdrawn')
    )
  ) then
    raise exception 'Claim links on released content block versions are immutable.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.guard_released_content_block_claim_link()
from public, anon, authenticated, service_role;

create trigger content_block_claims_guard_released_history
before insert or update or delete on public.content_block_claims
for each row execute function private.guard_released_content_block_claim_link();

create or replace function private.emergency_suppress_claim(
  target_claim_id uuid,
  suppression_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  prior_claim public.claims%rowtype;
begin
  if auth.role() = 'service_role'
    or actor is null
    or not (
      private.has_staff_role(array['publisher', 'admin']::public.staff_role[])
      and private.has_mfa()
    )
  then
    raise exception 'A human publisher or admin with MFA is required.' using errcode = '42501';
  end if;

  if target_claim_id is null then
    raise exception 'A claim is required.';
  end if;

  if suppression_reason is null
    or char_length(trim(suppression_reason)) not between 10 and 1000
  then
    raise exception 'A suppression reason between 10 and 1,000 characters is required.';
  end if;

  select * into prior_claim
  from public.claims claim
  where claim.id = target_claim_id
  for update;

  if not found then
    raise exception 'Claim not found.';
  end if;

  if prior_claim.suppressed_at is not null then
    raise exception 'Claim is already suppressed.';
  end if;

  perform set_config('elsewhere.emergency_claim_suppression', 'allowed', true);

  update public.claims
  set suppressed_at = now(),
      suppressed_reason = trim(suppression_reason)
  where id = target_claim_id
    and suppressed_at is null;

  if not found then
    raise exception 'Claim changed before it could be suppressed.';
  end if;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    actor,
    'claim.emergency_suppressed',
    'claim',
    target_claim_id,
    jsonb_build_object('suppressedAt', prior_claim.suppressed_at),
    jsonb_build_object('reason', trim(suppression_reason), 'suppressedBy', actor)
  );
end;
$$;

revoke all on function private.emergency_suppress_claim(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function private.emergency_suppress_claim(uuid, text)
to authenticated;

revoke all on function public.emergency_suppress_claim(uuid, text)
from public, anon, service_role;
grant execute on function public.emergency_suppress_claim(uuid, text)
to authenticated;

create function private.enforce_release_current_claim_policy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.state = 'published' and auth.role() = 'service_role' then
    raise exception 'A human publisher or admin with MFA is required to publish a release.'
      using errcode = '42501';
  end if;

  if new.state = 'published' and exists (
    select 1
    from public.release_claim_versions item
    where item.release_id = new.id
      and not private.claim_version_meets_publication_policy(item.claim_version_id)
  ) then
    raise exception
      'Release contains a claim that no longer satisfies Elsewhere publication policy.';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_release_current_claim_policy()
from public, anon, authenticated;

create trigger country_releases_enforce_current_claim_policy
before insert or update of state on public.country_releases
for each row execute function private.enforce_release_current_claim_policy();

-- Replace the original public helpers with the complete live policy. These
-- functions are the RLS boundary for claims, blocks, citations, and sources.
create function private.release_claim_mapping_is_public(
  target_release_id uuid,
  target_claim_id uuid,
  target_claim_version_id uuid,
  target_portal_section_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.release_id = target_release_id
      and item.claim_id = target_claim_id
      and item.claim_version_id = target_claim_version_id
      and item.portal_section_id = target_portal_section_id
      and release.state = 'published'
      and release.is_current
      and private.claim_version_meets_publication_policy(item.claim_version_id)
  );
$$;

create or replace function private.claim_version_is_public(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.release_claim_versions item
    where item.claim_version_id = target_version_id
      and private.release_claim_mapping_is_public(
        item.release_id,
        item.claim_id,
        item.claim_version_id,
        item.portal_section_id
      )
  );
$$;

create or replace function private.claim_is_public(target_claim_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.release_claim_versions item
    where item.claim_id = target_claim_id
      and private.release_claim_mapping_is_public(
        item.release_id,
        item.claim_id,
        item.claim_version_id,
        item.portal_section_id
      )
  );
$$;

create function private.release_block_mapping_is_public(
  target_release_id uuid,
  target_content_block_id uuid,
  target_content_block_version_id uuid,
  target_portal_section_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.release_block_versions item
    join public.country_releases release on release.id = item.release_id
    join public.content_block_versions version
      on version.id = item.content_block_version_id
    where item.release_id = target_release_id
      and item.content_block_id = target_content_block_id
      and item.content_block_version_id = target_content_block_version_id
      and item.portal_section_id = target_portal_section_id
      and release.state = 'published'
      and release.is_current
      and version.workflow_state = 'approved'
      and exists (
        select 1
        from public.editorial_reviews review
        where review.content_block_version_id = version.id
          and review.review_kind = 'editorial'
          and review.decision = 'approved'
          and review.created_at >= version.updated_at
      )
      and exists (
        select 1
        from public.content_block_claims linked_claim
        where linked_claim.content_block_version_id = version.id
      )
      and not exists (
        select 1
        from public.content_block_claims linked_claim
        where linked_claim.content_block_version_id = version.id
          and not exists (
            select 1
            from public.release_claim_versions released_claim
            where released_claim.release_id = item.release_id
              and released_claim.claim_version_id = linked_claim.claim_version_id
              and private.release_claim_mapping_is_public(
                released_claim.release_id,
                released_claim.claim_id,
                released_claim.claim_version_id,
                released_claim.portal_section_id
              )
          )
      )
  );
$$;

create or replace function private.content_block_version_is_public(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.release_block_versions item
    where item.content_block_version_id = target_version_id
      and private.release_block_mapping_is_public(
        item.release_id,
        item.content_block_id,
        item.content_block_version_id,
        item.portal_section_id
      )
  );
$$;

create or replace function private.content_block_is_public(target_block_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.release_block_versions item
    where item.content_block_id = target_block_id
      and private.release_block_mapping_is_public(
        item.release_id,
        item.content_block_id,
        item.content_block_version_id,
        item.portal_section_id
      )
  );
$$;

create or replace function private.source_document_is_public(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.claim_version_citations citation
    join public.source_documents source on source.id = citation.source_document_id
    where citation.source_document_id = target_source_id
      and source.state = 'verified'
      and source.review_due_at > now()
      and private.claim_version_is_public(citation.claim_version_id)
  );
$$;

revoke all on function private.release_claim_mapping_is_public(uuid, uuid, uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function private.release_block_mapping_is_public(uuid, uuid, uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function private.claim_is_public(uuid) from public;
revoke all on function private.claim_version_is_public(uuid) from public;
revoke all on function private.content_block_is_public(uuid) from public;
revoke all on function private.content_block_version_is_public(uuid) from public;
revoke all on function private.source_document_is_public(uuid) from public;

grant execute on function private.release_claim_mapping_is_public(uuid, uuid, uuid, uuid)
to anon, authenticated, service_role;
grant execute on function private.release_block_mapping_is_public(uuid, uuid, uuid, uuid)
to anon, authenticated, service_role;
grant execute on function private.claim_is_public(uuid) to anon, authenticated, service_role;
grant execute on function private.claim_version_is_public(uuid) to anon, authenticated, service_role;
grant execute on function private.content_block_is_public(uuid) to anon, authenticated, service_role;
grant execute on function private.content_block_version_is_public(uuid) to anon, authenticated, service_role;
grant execute on function private.source_document_is_public(uuid) to anon, authenticated, service_role;

-- Reviews are now RPC-only. In particular, no authenticated client can mint a
-- professional decision row by choosing review_kind = 'professional'.
revoke insert on table public.editorial_reviews from authenticated;
revoke insert, update, delete on table public.editorial_reviews from service_role;
drop policy if exists editorial_reviews_reviewer_insert on public.editorial_reviews;

alter table public.professional_reviewer_profiles enable row level security;
alter table public.professional_credentials enable row level security;
alter table public.professional_credential_verifications enable row level security;
alter table public.professional_credential_category_scopes enable row level security;
alter table public.professional_credential_country_scopes enable row level security;
alter table public.professional_review_assignments enable row level security;
alter table public.professional_review_conflicts enable row level security;

revoke all on table
  public.professional_reviewer_profiles,
  public.professional_credentials,
  public.professional_credential_verifications,
  public.professional_credential_category_scopes,
  public.professional_credential_country_scopes,
  public.professional_review_assignments,
  public.professional_review_conflicts
from anon, authenticated, service_role;

grant select on table
  public.professional_reviewer_profiles,
  public.professional_credentials,
  public.professional_credential_verifications,
  public.professional_credential_category_scopes,
  public.professional_credential_country_scopes,
  public.professional_review_assignments,
  public.professional_review_conflicts
to authenticated, service_role;

grant usage on type
  public.professional_credential_status,
  public.professional_assignment_status,
  public.professional_conflict_declaration
to authenticated, service_role;

create policy professional_profiles_scoped_read
on public.professional_reviewer_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy professional_credentials_scoped_read
on public.professional_credentials
for select
to authenticated
using (
  reviewer_user_id = (select auth.uid())
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy professional_credential_verifications_scoped_read
on public.professional_credential_verifications
for select
to authenticated
using (
  reviewer_user_id = (select auth.uid())
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy professional_category_scopes_scoped_read
on public.professional_credential_category_scopes
for select
to authenticated
using (
  exists (
    select 1
    from public.professional_credentials credential
    where credential.id = credential_id
      and credential.reviewer_user_id = (select auth.uid())
  )
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy professional_country_scopes_scoped_read
on public.professional_credential_country_scopes
for select
to authenticated
using (
  exists (
    select 1
    from public.professional_credentials credential
    where credential.id = credential_id
      and credential.reviewer_user_id = (select auth.uid())
  )
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy professional_assignments_scoped_read
on public.professional_review_assignments
for select
to authenticated
using (
  reviewer_user_id = (select auth.uid())
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy professional_conflicts_scoped_read
on public.professional_review_conflicts
for select
to authenticated
using (
  reviewer_user_id = (select auth.uid())
  or (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

drop policy if exists release_claim_versions_anon_read on public.release_claim_versions;
create policy release_claim_versions_anon_read
on public.release_claim_versions
for select
to anon
using ((select private.release_claim_mapping_is_public(
  release_id,
  claim_id,
  claim_version_id,
  portal_section_id
)));

drop policy if exists release_claim_versions_authenticated_read on public.release_claim_versions;
create policy release_claim_versions_authenticated_read
on public.release_claim_versions
for select
to authenticated
using (
  (select private.release_claim_mapping_is_public(
    release_id,
    claim_id,
    claim_version_id,
    portal_section_id
  ))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy if exists release_block_versions_anon_read on public.release_block_versions;
create policy release_block_versions_anon_read
on public.release_block_versions
for select
to anon
using ((select private.release_block_mapping_is_public(
  release_id,
  content_block_id,
  content_block_version_id,
  portal_section_id
)));

drop policy if exists release_block_versions_authenticated_read on public.release_block_versions;
create policy release_block_versions_authenticated_read
on public.release_block_versions
for select
to authenticated
using (
  (select private.release_block_mapping_is_public(
    release_id,
    content_block_id,
    content_block_version_id,
    portal_section_id
  ))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

-- Lock down both wrapper and implementation privileges explicitly. PostgreSQL
-- grants EXECUTE to PUBLIC by default on newly created functions.
revoke all on function private.register_professional_reviewer_profile(text, text, text, boolean)
from public, anon, authenticated, service_role;
revoke all on function private.set_professional_reviewer_active(uuid, boolean)
from public, anon, authenticated, service_role;
revoke all on function private.submit_professional_credential(text, text, text, text, uuid, text, text)
from public, anon, authenticated, service_role;
revoke all on function private.verify_professional_credential(uuid, uuid, uuid, date, date, boolean, timestamptz, uuid[], uuid[])
from public, anon, authenticated, service_role;
revoke all on function private.set_professional_credential_status(uuid, public.professional_credential_status, text)
from public, anon, authenticated, service_role;
revoke all on function private.assign_professional_review(uuid, uuid, timestamptz, text)
from public, anon, authenticated, service_role;
revoke all on function private.cancel_professional_review_assignment(uuid, text)
from public, anon, authenticated, service_role;
revoke all on function private.declare_professional_review_conflict(uuid, public.professional_conflict_declaration, text)
from public, anon, authenticated, service_role;
revoke all on function private.review_professional_assignment(uuid, public.editorial_review_decision, text, jsonb)
from public, anon, authenticated, service_role;

grant execute on function private.register_professional_reviewer_profile(text, text, text, boolean)
to authenticated;
grant execute on function private.set_professional_reviewer_active(uuid, boolean)
to authenticated;
grant execute on function private.submit_professional_credential(text, text, text, text, uuid, text, text)
to authenticated;
grant execute on function private.verify_professional_credential(uuid, uuid, uuid, date, date, boolean, timestamptz, uuid[], uuid[])
to authenticated;
grant execute on function private.set_professional_credential_status(uuid, public.professional_credential_status, text)
to authenticated;
grant execute on function private.assign_professional_review(uuid, uuid, timestamptz, text)
to authenticated;
grant execute on function private.cancel_professional_review_assignment(uuid, text)
to authenticated;
grant execute on function private.declare_professional_review_conflict(uuid, public.professional_conflict_declaration, text)
to authenticated;
grant execute on function private.review_professional_assignment(uuid, public.editorial_review_decision, text, jsonb)
to authenticated;

revoke all on function public.register_professional_reviewer_profile(text, text, text, boolean)
from public, anon, service_role;
revoke all on function public.set_professional_reviewer_active(uuid, boolean)
from public, anon, service_role;
revoke all on function public.submit_professional_credential(text, text, text, text, uuid, text, text)
from public, anon, service_role;
revoke all on function public.verify_professional_credential(uuid, uuid, uuid, date, date, boolean, timestamptz, uuid[], uuid[])
from public, anon, service_role;
revoke all on function public.set_professional_credential_status(uuid, public.professional_credential_status, text)
from public, anon, service_role;
revoke all on function public.assign_professional_review(uuid, uuid, timestamptz, text)
from public, anon, service_role;
revoke all on function public.cancel_professional_review_assignment(uuid, text)
from public, anon, service_role;
revoke all on function public.declare_professional_review_conflict(uuid, public.professional_conflict_declaration, text)
from public, anon, service_role;
revoke all on function public.review_professional_assignment(uuid, public.editorial_review_decision, text, jsonb)
from public, anon, service_role;

grant execute on function public.register_professional_reviewer_profile(text, text, text, boolean)
to authenticated;
grant execute on function public.set_professional_reviewer_active(uuid, boolean)
to authenticated;
grant execute on function public.submit_professional_credential(text, text, text, text, uuid, text, text)
to authenticated;
grant execute on function public.verify_professional_credential(uuid, uuid, uuid, date, date, boolean, timestamptz, uuid[], uuid[])
to authenticated;
grant execute on function public.set_professional_credential_status(uuid, public.professional_credential_status, text)
to authenticated;
grant execute on function public.assign_professional_review(uuid, uuid, timestamptz, text)
to authenticated;
grant execute on function public.cancel_professional_review_assignment(uuid, text)
to authenticated;
grant execute on function public.declare_professional_review_conflict(uuid, public.professional_conflict_declaration, text)
to authenticated;
grant execute on function public.review_professional_assignment(uuid, public.editorial_review_decision, text, jsonb)
to authenticated;

-- A server key may read editorial state for rendering and operational reports,
-- but it cannot author, review, reclassify, publish, suppress, or rewrite trust
-- history. User-submitted outdated-information reports are operational intake,
-- not publication authority, so the server retains only INSERT plus SELECT there.
revoke all on table
  public.staff_memberships,
  public.claim_categories,
  public.countries,
  public.country_portals,
  public.portal_sections,
  public.source_documents,
  public.source_snapshots,
  public.claims,
  public.claim_versions,
  public.content_blocks,
  public.content_block_versions,
  public.claim_version_citations,
  public.content_block_claims,
  public.country_releases,
  public.release_claim_versions,
  public.release_block_versions,
  public.editorial_reviews,
  public.editorial_audit_events,
  public.professional_reviewer_profiles,
  public.professional_credentials,
  public.professional_credential_verifications,
  public.professional_credential_category_scopes,
  public.professional_credential_country_scopes,
  public.professional_review_assignments,
  public.professional_review_conflicts
from service_role;

grant select on table
  public.staff_memberships,
  public.claim_categories,
  public.countries,
  public.country_portals,
  public.portal_sections,
  public.source_documents,
  public.source_snapshots,
  public.claims,
  public.claim_versions,
  public.content_blocks,
  public.content_block_versions,
  public.claim_version_citations,
  public.content_block_claims,
  public.country_releases,
  public.release_claim_versions,
  public.release_block_versions,
  public.editorial_reviews,
  public.editorial_audit_events,
  public.professional_reviewer_profiles,
  public.professional_credentials,
  public.professional_credential_verifications,
  public.professional_credential_category_scopes,
  public.professional_credential_country_scopes,
  public.professional_review_assignments,
  public.professional_review_conflicts
to service_role;

revoke all on table public.outdated_information_reports from service_role;
grant select, insert on table public.outdated_information_reports to service_role;
revoke all on sequence public.editorial_audit_events_id_seq from service_role;

-- Category trust columns are never directly writable by an authenticated
-- client. Non-trust metadata remains under the existing admin RLS policy.
revoke update on table public.claim_categories from authenticated;
grant update (
  slug,
  name,
  portal_section_slug,
  default_risk_level,
  review_interval_days,
  is_active
) on public.claim_categories to authenticated;

revoke all on function private.set_claim_category_trust_requirements(uuid, boolean, boolean, text)
from public, anon, authenticated, service_role;
revoke all on function private.relax_claim_professional_review_requirement(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function private.set_claim_category_trust_requirements(uuid, boolean, boolean, text)
to authenticated;
grant execute on function private.relax_claim_professional_review_requirement(uuid, text)
to authenticated;

revoke all on function public.set_claim_category_trust_requirements(uuid, boolean, boolean, text)
from public, anon, service_role;
revoke all on function public.relax_claim_professional_review_requirement(uuid, text)
from public, anon, service_role;
grant execute on function public.set_claim_category_trust_requirements(uuid, boolean, boolean, text)
to authenticated;
grant execute on function public.relax_claim_professional_review_requirement(uuid, text)
to authenticated;

-- Remove every legacy service-key route into human editorial actions. The
-- private functions retain authenticated execution only because the public
-- invoker wrappers call them after the implementations enforce role and MFA.
revoke all on function private.review_source_document(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function private.review_claim_version(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function private.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function private.review_country_release(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function private.publish_country_release(uuid)
from service_role;
revoke all on function private.emergency_suppress_claim(uuid, text)
from service_role;

revoke all on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb)
from service_role;
revoke all on function public.publish_country_release(uuid)
from service_role;
revoke all on function public.emergency_suppress_claim(uuid, text)
from service_role;

revoke all on function public.create_claim_draft_atomic(
  uuid, uuid, uuid, text, public.claim_risk_level, boolean, text, text, text,
  jsonb, text, public.claim_confidence_level, date, date, uuid, uuid, text,
  text, text
) from service_role;
revoke all on function public.create_content_block_draft_atomic(
  uuid, uuid, text, public.content_block_kind, public.claim_risk_level, text,
  jsonb, uuid
) from service_role;
revoke all on function public.create_country_release_draft_atomic(uuid, text)
from service_role;
