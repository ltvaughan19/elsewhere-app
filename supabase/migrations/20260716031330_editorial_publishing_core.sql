-- Elsewhere trust and publishing foundation.
-- Public guidance is selected only through an immutable, current release.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

create type public.staff_role as enum ('editor', 'reviewer', 'publisher', 'admin');
create type public.country_visibility as enum ('draft', 'preview', 'published', 'retired');
create type public.portal_coverage_level as enum ('preview', 'core', 'deep');
create type public.source_authority_level as enum (
  'official_government',
  'embassy_consulate',
  'immigration_authority',
  'intergovernmental',
  'licensed_professional',
  'reputable_institution',
  'editorial',
  'community'
);
create type public.source_document_state as enum (
  'draft',
  'verified',
  'superseded',
  'unavailable',
  'disputed'
);
create type public.claim_risk_level as enum ('low', 'medium', 'high', 'critical');
create type public.claim_confidence_level as enum ('low', 'medium', 'high');
create type public.editorial_workflow_state as enum (
  'draft',
  'in_review',
  'approved',
  'changes_requested',
  'deprecated',
  'disputed'
);
create type public.citation_role as enum ('primary', 'supporting', 'context', 'conflicting');
create type public.content_block_kind as enum (
  'rich_text',
  'key_facts',
  'claim_list',
  'steps',
  'watchouts',
  'stay_path_matrix',
  'city_grid',
  'budget_embed',
  'source_list',
  'change_log',
  'next_action'
);
create type public.country_release_state as enum (
  'draft',
  'ready',
  'published',
  'superseded',
  'withdrawn'
);
create type public.editorial_review_kind as enum (
  'editorial',
  'source_verification',
  'professional',
  'release_qa'
);
create type public.editorial_review_decision as enum (
  'approved',
  'changes_requested',
  'rejected'
);
create type public.outdated_report_status as enum (
  'open',
  'triaged',
  'investigating',
  'resolved',
  'rejected'
);

create table public.staff_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role not null,
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claim_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  portal_section_slug text not null,
  default_risk_level public.claim_risk_level not null default 'medium',
  requires_official_source boolean not null default false,
  requires_professional_review boolean not null default false,
  review_interval_days integer not null default 180 check (review_interval_days between 1 and 730),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  iso_code char(2) not null unique check (iso_code = upper(iso_code)),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  region text,
  flag_emoji text,
  summary text,
  visibility public.country_visibility not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.country_portals (
  country_id uuid primary key references public.countries(id) on delete cascade,
  coverage_level public.portal_coverage_level not null default 'preview',
  default_locale text not null default 'en',
  audience_scope jsonb not null default '{"schemaVersion":1,"citizenshipCountryCodes":[],"residenceCountryCodes":[],"purposes":[],"durationBands":[],"householdTags":[]}'::jsonb
    check (jsonb_typeof(audience_scope) = 'object'),
  overview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portal_sections (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_required boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, slug)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  canonical_url text not null unique check (canonical_url ~ '^https://'),
  title text not null,
  publisher text not null,
  authority_level public.source_authority_level not null,
  jurisdiction text,
  source_language text not null default 'en',
  translation_status text not null default 'not_needed'
    check (translation_status in ('not_needed', 'machine_draft', 'human_reviewed')),
  publication_date date,
  state public.source_document_state not null default 'draft',
  last_checked_at timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents(id) on delete restrict,
  captured_at timestamptz not null default now(),
  capture_method text not null default 'manual'
    check (capture_method in ('manual', 'url_monitor', 'api', 'partner_feed')),
  http_status integer check (http_status between 100 and 599),
  content_hash text not null check (char_length(content_hash) between 16 and 128),
  etag text,
  last_modified_header text,
  captured_title text,
  storage_path text,
  captured_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_document_id, content_hash)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  category_id uuid not null references public.claim_categories(id) on delete restrict,
  portal_section_id uuid references public.portal_sections(id) on delete set null,
  claim_slug text not null check (claim_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  risk_level public.claim_risk_level not null default 'medium',
  requires_professional_review boolean not null default false,
  suppressed_at timestamptz,
  suppressed_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, claim_slug),
  check ((suppressed_at is null and suppressed_reason is null) or suppressed_at is not null)
);

create table public.claim_versions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  precise_text text not null check (char_length(precise_text) between 10 and 10000),
  public_summary text not null check (char_length(public_summary) between 10 and 5000),
  user_meaning text,
  applicability jsonb not null default '{"schemaVersion":1,"citizenshipCountryCodes":[],"residenceCountryCodes":[],"purposes":[],"durationBands":[],"householdTags":[]}'::jsonb
    check (jsonb_typeof(applicability) = 'object' and applicability ? 'schemaVersion'),
  locale text not null default 'en',
  confidence_level public.claim_confidence_level not null default 'low',
  workflow_state public.editorial_workflow_state not null default 'draft',
  effective_from date,
  effective_until date,
  review_due_at timestamptz,
  authored_by uuid references auth.users(id) on delete set null,
  change_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (claim_id, version_number),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  portal_section_id uuid not null references public.portal_sections(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  kind public.content_block_kind not null,
  risk_level public.claim_risk_level not null default 'low',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, portal_section_id, slug)
);

create table public.content_block_versions (
  id uuid primary key default gen_random_uuid(),
  content_block_id uuid not null references public.content_blocks(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  title text,
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  workflow_state public.editorial_workflow_state not null default 'draft',
  authored_by uuid references auth.users(id) on delete set null,
  change_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_block_id, version_number)
);

create table public.claim_version_citations (
  id uuid primary key default gen_random_uuid(),
  claim_version_id uuid not null references public.claim_versions(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete restrict,
  source_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  role public.citation_role not null default 'supporting',
  exact_locator text,
  evidence_excerpt text check (evidence_excerpt is null or char_length(evidence_excerpt) <= 1000),
  support_note text,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (claim_version_id, source_document_id, role)
);

create table public.content_block_claims (
  content_block_version_id uuid not null references public.content_block_versions(id) on delete cascade,
  claim_version_id uuid not null references public.claim_versions(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (content_block_version_id, claim_version_id)
);

create table public.country_releases (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete restrict,
  release_number integer not null check (release_number > 0),
  state public.country_release_state not null default 'draft',
  release_notes text,
  is_current boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, release_number),
  check ((state = 'published' and is_current and published_at is not null) or state <> 'published')
);

create unique index country_releases_one_current_idx
  on public.country_releases (country_id)
  where is_current and state = 'published';

create table public.release_claim_versions (
  release_id uuid not null references public.country_releases(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete restrict,
  claim_version_id uuid not null references public.claim_versions(id) on delete restrict,
  portal_section_id uuid not null references public.portal_sections(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (release_id, claim_id),
  unique (release_id, claim_version_id)
);

create table public.release_block_versions (
  release_id uuid not null references public.country_releases(id) on delete cascade,
  content_block_id uuid not null references public.content_blocks(id) on delete restrict,
  content_block_version_id uuid not null references public.content_block_versions(id) on delete restrict,
  portal_section_id uuid not null references public.portal_sections(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (release_id, content_block_id),
  unique (release_id, content_block_version_id)
);

create table public.editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid references public.source_documents(id) on delete restrict,
  reviewed_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  claim_version_id uuid references public.claim_versions(id) on delete restrict,
  content_block_version_id uuid references public.content_block_versions(id) on delete restrict,
  release_id uuid references public.country_releases(id) on delete restrict,
  review_kind public.editorial_review_kind not null,
  decision public.editorial_review_decision not null,
  checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(checklist) = 'object'),
  notes text,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (num_nonnulls(source_document_id, claim_version_id, content_block_version_id, release_id) = 1),
  check (reviewed_snapshot_id is null or source_document_id is not null)
);

create table public.editorial_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.outdated_information_reports (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  claim_id uuid references public.claims(id) on delete set null,
  release_id uuid references public.country_releases(id) on delete set null,
  page_url text not null check (char_length(page_url) between 1 and 2048),
  description text not null check (char_length(description) between 10 and 5000),
  suggested_source_url text check (suggested_source_url is null or suggested_source_url ~ '^https://'),
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  status public.outdated_report_status not null default 'open',
  resolution_note text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index portal_sections_country_sort_idx
  on public.portal_sections (country_id, sort_order);
create index source_documents_country_state_idx
  on public.source_documents (country_id, state, review_due_at);
create index source_snapshots_source_captured_idx
  on public.source_snapshots (source_document_id, captured_at desc);
create index claims_country_category_idx
  on public.claims (country_id, category_id);
create index claim_versions_claim_state_idx
  on public.claim_versions (claim_id, workflow_state, version_number desc);
create index claim_versions_applicability_idx
  on public.claim_versions using gin (applicability);
create index citations_claim_version_sort_idx
  on public.claim_version_citations (claim_version_id, sort_order);
create index releases_country_state_idx
  on public.country_releases (country_id, state, release_number desc);
create index editorial_reviews_claim_idx
  on public.editorial_reviews (claim_version_id, created_at desc)
  where claim_version_id is not null;
create index editorial_reviews_source_idx
  on public.editorial_reviews (source_document_id, created_at desc)
  where source_document_id is not null;
create index editorial_reviews_release_idx
  on public.editorial_reviews (release_id, created_at desc)
  where release_id is not null;
create index outdated_reports_status_created_idx
  on public.outdated_information_reports (status, created_at desc);

comment on column public.claim_versions.applicability is
  'Schema v1. Empty arrays mean the claim is not restricted on that dimension.';
comment on column public.country_portals.audience_scope is
  'Schema v1. Empty arrays mean the portal is not restricted on that dimension.';
comment on table public.source_snapshots is
  'Immutable metadata for the exact source state a human reviewer inspected.';
comment on table public.country_releases is
  'Immutable publication boundary. Public guidance must come only from the current published release.';

-- Authorization and public-visibility helpers live outside the exposed API schema.
create function private.has_staff_role(required_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.active
      and membership.role = any(required_roles)
  );
$$;

create function private.has_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.role() = 'service_role', false)
    or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create function private.claim_is_public(target_claim_id uuid)
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
    join public.claims claim on claim.id = item.claim_id
    where item.claim_id = target_claim_id
      and release.state = 'published'
      and release.is_current
      and claim.suppressed_at is null
      and exists (
        select 1
        from public.claim_version_citations citation
        join public.source_documents source on source.id = citation.source_document_id
        where citation.claim_version_id = item.claim_version_id
          and citation.role = 'primary'
          and source.state = 'verified'
          and source.review_due_at > now()
      )
  );
$$;

create function private.claim_version_is_public(target_version_id uuid)
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
    join public.claims claim on claim.id = item.claim_id
    where item.claim_version_id = target_version_id
      and release.state = 'published'
      and release.is_current
      and claim.suppressed_at is null
      and exists (
        select 1
        from public.claim_version_citations citation
        join public.source_documents source on source.id = citation.source_document_id
        where citation.claim_version_id = item.claim_version_id
          and citation.role = 'primary'
          and source.state = 'verified'
          and source.review_due_at > now()
      )
  );
$$;

create function private.content_block_is_public(target_block_id uuid)
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
    where item.content_block_id = target_block_id
      and release.state = 'published'
      and release.is_current
  );
$$;

create function private.content_block_version_is_public(target_version_id uuid)
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
    where item.content_block_version_id = target_version_id
      and release.state = 'published'
      and release.is_current
  );
$$;

create function private.source_document_is_public(target_source_id uuid)
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
    join public.release_claim_versions item
      on item.claim_version_id = citation.claim_version_id
    join public.country_releases release on release.id = item.release_id
    join public.claims claim on claim.id = item.claim_id
    where citation.source_document_id = target_source_id
      and source.state = 'verified'
      and source.review_due_at > now()
      and release.state = 'published'
      and release.is_current
      and claim.suppressed_at is null
  );
$$;

revoke all on function private.has_staff_role(public.staff_role[]) from public;
revoke all on function private.has_mfa() from public;
revoke all on function private.claim_is_public(uuid) from public;
revoke all on function private.claim_version_is_public(uuid) from public;
revoke all on function private.content_block_is_public(uuid) from public;
revoke all on function private.content_block_version_is_public(uuid) from public;
revoke all on function private.source_document_is_public(uuid) from public;

grant execute on function private.has_staff_role(public.staff_role[]) to authenticated;
grant execute on function private.has_mfa() to authenticated;
grant execute on function private.claim_is_public(uuid) to anon, authenticated;
grant execute on function private.claim_version_is_public(uuid) to anon, authenticated;
grant execute on function private.content_block_is_public(uuid) to anon, authenticated;
grant execute on function private.content_block_version_is_public(uuid) to anon, authenticated;
grant execute on function private.source_document_is_public(uuid) to anon, authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staff_memberships_set_updated_at
before update on public.staff_memberships
for each row execute function private.set_updated_at();
create trigger claim_categories_set_updated_at
before update on public.claim_categories
for each row execute function private.set_updated_at();
create trigger countries_set_updated_at
before update on public.countries
for each row execute function private.set_updated_at();
create trigger country_portals_set_updated_at
before update on public.country_portals
for each row execute function private.set_updated_at();
create trigger portal_sections_set_updated_at
before update on public.portal_sections
for each row execute function private.set_updated_at();
create trigger source_documents_set_updated_at
before update on public.source_documents
for each row execute function private.set_updated_at();
create trigger claims_set_updated_at
before update on public.claims
for each row execute function private.set_updated_at();
create trigger claim_versions_set_updated_at
before update on public.claim_versions
for each row execute function private.set_updated_at();
create trigger content_blocks_set_updated_at
before update on public.content_blocks
for each row execute function private.set_updated_at();
create trigger content_block_versions_set_updated_at
before update on public.content_block_versions
for each row execute function private.set_updated_at();
create trigger country_releases_set_updated_at
before update on public.country_releases
for each row execute function private.set_updated_at();
create trigger outdated_reports_set_updated_at
before update on public.outdated_information_reports
for each row execute function private.set_updated_at();

create function private.guard_source_snapshot_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Source snapshots are immutable; capture a new snapshot instead.';
end;
$$;

create trigger source_snapshots_immutable
before update or delete on public.source_snapshots
for each row execute function private.guard_source_snapshot_immutable();

create function private.guard_review_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Editorial reviews are immutable; create a new review event.';
end;
$$;

create trigger editorial_reviews_immutable
before update or delete on public.editorial_reviews
for each row execute function private.guard_review_immutable();

create function private.guard_audit_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Editorial audit events are append-only.';
end;
$$;

create trigger editorial_audit_events_immutable
before update or delete on public.editorial_audit_events
for each row execute function private.guard_audit_immutable();

create function private.guard_release_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.state in ('published', 'superseded', 'withdrawn')
    and coalesce(current_setting('elsewhere.release_transition', true), '') <> 'allowed'
  then
    raise exception 'Published release history is immutable.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger country_releases_guard_history
before update or delete on public.country_releases
for each row execute function private.guard_release_mutation();

create function private.guard_release_composition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_release_id uuid;
  target_state public.country_release_state;
begin
  target_release_id := case when tg_op = 'DELETE' then old.release_id else new.release_id end;
  select state into target_state
  from public.country_releases
  where id = target_release_id;

  if target_state not in ('draft', 'ready') then
    raise exception 'Only draft or ready releases may be recomposed.';
  end if;

  if tg_op = 'UPDATE' and old.release_id <> new.release_id then
    select state into target_state
    from public.country_releases
    where id = old.release_id;
    if target_state not in ('draft', 'ready') then
      raise exception 'Only draft or ready releases may be recomposed.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger release_claim_versions_guard_composition
before insert or update or delete on public.release_claim_versions
for each row execute function private.guard_release_composition();
create trigger release_block_versions_guard_composition
before insert or update or delete on public.release_block_versions
for each row execute function private.guard_release_composition();

create function private.touch_release_composition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_release_id uuid;
begin
  target_release_id := case when tg_op = 'DELETE' then old.release_id else new.release_id end;
  update public.country_releases
  set updated_at = now(), state = 'draft'
  where id = target_release_id;
  return null;
end;
$$;

create trigger release_claim_versions_touch_release
after insert or update or delete on public.release_claim_versions
for each row execute function private.touch_release_composition();
create trigger release_block_versions_touch_release
after insert or update or delete on public.release_block_versions
for each row execute function private.touch_release_composition();

create function private.guard_claim_version_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.claim_version_id = old.id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Released claim versions are immutable; create a new version.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger claim_versions_guard_history
before update or delete on public.claim_versions
for each row execute function private.guard_claim_version_history();

create function private.guard_block_version_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.release_block_versions item
    join public.country_releases release on release.id = item.release_id
    where item.content_block_version_id = old.id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Released content block versions are immutable; create a new version.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger content_block_versions_guard_history
before update or delete on public.content_block_versions
for each row execute function private.guard_block_version_history();

create function private.guard_citation_history()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_version_id uuid;
  snapshot_source_id uuid;
begin
  target_version_id := case when tg_op = 'DELETE' then old.claim_version_id else new.claim_version_id end;
  if exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.claim_version_id = target_version_id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Citations on released claim versions are immutable.';
  end if;

  if tg_op <> 'DELETE' and new.source_snapshot_id is not null then
    select source_document_id into snapshot_source_id
    from public.source_snapshots
    where id = new.source_snapshot_id;
    if snapshot_source_id is distinct from new.source_document_id then
      raise exception 'Citation snapshot must belong to the cited source document.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger claim_version_citations_guard_history
before insert or update or delete on public.claim_version_citations
for each row execute function private.guard_citation_history();

create function private.guard_release_claim_consistency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  release_country_id uuid;
  claim_country_id uuid;
  version_claim_id uuid;
  section_country_id uuid;
begin
  select country_id into release_country_id from public.country_releases where id = new.release_id;
  select country_id into claim_country_id from public.claims where id = new.claim_id;
  select claim_id into version_claim_id from public.claim_versions where id = new.claim_version_id;
  select country_id into section_country_id from public.portal_sections where id = new.portal_section_id;

  if release_country_id is distinct from claim_country_id
    or release_country_id is distinct from section_country_id
    or version_claim_id is distinct from new.claim_id
  then
    raise exception 'Release, claim, version, and section must belong to the same country and claim.';
  end if;
  return new;
end;
$$;

create trigger release_claim_versions_guard_consistency
before insert or update on public.release_claim_versions
for each row execute function private.guard_release_claim_consistency();

create function private.guard_release_block_consistency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  release_country_id uuid;
  block_country_id uuid;
  version_block_id uuid;
  section_country_id uuid;
begin
  select country_id into release_country_id from public.country_releases where id = new.release_id;
  select country_id into block_country_id from public.content_blocks where id = new.content_block_id;
  select content_block_id into version_block_id from public.content_block_versions where id = new.content_block_version_id;
  select country_id into section_country_id from public.portal_sections where id = new.portal_section_id;

  if release_country_id is distinct from block_country_id
    or release_country_id is distinct from section_country_id
    or version_block_id is distinct from new.content_block_id
  then
    raise exception 'Release, block, version, and section must belong to the same country and block.';
  end if;
  return new;
end;
$$;

create trigger release_block_versions_guard_consistency
before insert or update on public.release_block_versions
for each row execute function private.guard_release_block_consistency();

create function private.guard_content_block_claim_consistency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  block_country_id uuid;
  claim_country_id uuid;
begin
  select block.country_id into block_country_id
  from public.content_block_versions version
  join public.content_blocks block on block.id = version.content_block_id
  where version.id = new.content_block_version_id;

  select claim.country_id into claim_country_id
  from public.claim_versions version
  join public.claims claim on claim.id = version.claim_id
  where version.id = new.claim_version_id;

  if block_country_id is distinct from claim_country_id then
    raise exception 'Content blocks may reference only claim versions from the same country.';
  end if;
  return new;
end;
$$;

create trigger content_block_claims_guard_consistency
before insert or update on public.content_block_claims
for each row execute function private.guard_content_block_claim_consistency();

create function private.enforce_claim_category_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  category_risk public.claim_risk_level;
  category_requires_professional boolean;
  section_country_id uuid;
begin
  select default_risk_level, requires_professional_review
  into category_risk, category_requires_professional
  from public.claim_categories
  where id = new.category_id and is_active;

  if not found then
    raise exception 'Claim category is missing or inactive.';
  end if;

  if new.risk_level < category_risk then
    raise exception 'Claim risk level cannot be lower than its category policy.';
  end if;

  if category_requires_professional then
    new.requires_professional_review = true;
  end if;

  if new.portal_section_id is not null then
    select country_id into section_country_id
    from public.portal_sections
    where id = new.portal_section_id;
    if section_country_id is distinct from new.country_id then
      raise exception 'Claim and portal section must belong to the same country.';
    end if;
  end if;

  return new;
end;
$$;

create trigger claims_enforce_category_rules
before insert or update on public.claims
for each row execute function private.enforce_claim_category_rules();

create function private.enforce_content_block_country()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  section_country_id uuid;
begin
  select country_id into section_country_id
  from public.portal_sections
  where id = new.portal_section_id;
  if section_country_id is distinct from new.country_id then
    raise exception 'Content block and portal section must belong to the same country.';
  end if;
  return new;
end;
$$;

create trigger content_blocks_enforce_country
before insert or update on public.content_blocks
for each row execute function private.enforce_content_block_country();

-- Review operations are atomic: the immutable review event and workflow state
-- can never disagree because they are written in the same transaction.
create function public.review_source_document(
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
  reviewer uuid := auth.uid();
  review_id uuid;
  snapshot_id uuid;
  source_last_edited_at timestamptz;
begin
  if not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[]) then
    raise exception 'Reviewer access required.' using errcode = '42501';
  end if;

  if jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Review checklist must be a JSON object.';
  end if;

  select updated_at into source_last_edited_at
  from public.source_documents
  where id = target_source_document_id
  for update;
  if not found then
    raise exception 'Source document not found.';
  end if;

  if review_decision = 'approved' then
    select snapshot.id into snapshot_id
    from public.source_snapshots snapshot
    where snapshot.source_document_id = target_source_document_id
      and snapshot.captured_at >= source_last_edited_at
    order by snapshot.captured_at desc
    limit 1;

    if snapshot_id is null then
      raise exception 'An exact source snapshot is required before approval.';
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
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    reviewer,
    'source.reviewed',
    'source_document',
    target_source_document_id,
    jsonb_build_object('decision', review_decision, 'reviewId', review_id)
  );

  return review_id;
end;
$$;

create function public.review_claim_version(
  target_claim_version_id uuid,
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
  reviewer uuid := auth.uid();
  review_id uuid;
  review_interval integer;
begin
  if not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[]) then
    raise exception 'Reviewer access required.' using errcode = '42501';
  end if;

  if jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Review checklist must be a JSON object.';
  end if;

  select category.review_interval_days
  into review_interval
  from public.claim_versions version
  join public.claims claim on claim.id = version.claim_id
  join public.claim_categories category on category.id = claim.category_id
  where version.id = target_claim_version_id
  for update of version;

  if not found then
    raise exception 'Claim version not found.';
  end if;

  update public.claim_versions
  set workflow_state = case
        when review_decision = 'approved' then 'approved'::public.editorial_workflow_state
        when review_decision = 'rejected' then 'deprecated'::public.editorial_workflow_state
        else 'changes_requested'::public.editorial_workflow_state
      end,
      review_due_at = case
        when review_decision = 'approved' then now() + make_interval(days => review_interval)
        else review_due_at
      end
  where id = target_claim_version_id;

  insert into public.editorial_reviews (
    claim_version_id,
    review_kind,
    decision,
    checklist,
    notes,
    reviewer_id
  ) values (
    target_claim_version_id,
    'editorial',
    review_decision,
    review_checklist,
    review_notes,
    reviewer
  ) returning id into review_id;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    reviewer,
    'claim_version.reviewed',
    'claim_version',
    target_claim_version_id,
    jsonb_build_object('decision', review_decision, 'reviewId', review_id)
  );

  return review_id;
end;
$$;

create function public.review_content_block_version(
  target_content_block_version_id uuid,
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
  reviewer uuid := auth.uid();
  review_id uuid;
begin
  if not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[]) then
    raise exception 'Reviewer access required.' using errcode = '42501';
  end if;

  if jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Review checklist must be a JSON object.';
  end if;

  perform 1
  from public.content_block_versions
  where id = target_content_block_version_id
  for update;
  if not found then
    raise exception 'Content block version not found.';
  end if;

  update public.content_block_versions
  set workflow_state = case
        when review_decision = 'approved' then 'approved'::public.editorial_workflow_state
        when review_decision = 'rejected' then 'deprecated'::public.editorial_workflow_state
        else 'changes_requested'::public.editorial_workflow_state
      end
  where id = target_content_block_version_id;

  insert into public.editorial_reviews (
    content_block_version_id,
    review_kind,
    decision,
    checklist,
    notes,
    reviewer_id
  ) values (
    target_content_block_version_id,
    'editorial',
    review_decision,
    review_checklist,
    review_notes,
    reviewer
  ) returning id into review_id;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    reviewer,
    'content_block_version.reviewed',
    'content_block_version',
    target_content_block_version_id,
    jsonb_build_object('decision', review_decision, 'reviewId', review_id)
  );

  return review_id;
end;
$$;

create function public.review_country_release(
  target_release_id uuid,
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
  reviewer uuid := auth.uid();
  review_id uuid;
begin
  if not private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[]) then
    raise exception 'Reviewer access required.' using errcode = '42501';
  end if;

  if jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Review checklist must be a JSON object.';
  end if;

  perform 1
  from public.country_releases
  where id = target_release_id and state in ('draft', 'ready')
  for update;
  if not found then
    raise exception 'Editable country release not found.';
  end if;

  update public.country_releases
  set state = case
        when review_decision = 'approved' then 'ready'::public.country_release_state
        else 'draft'::public.country_release_state
      end
  where id = target_release_id;

  insert into public.editorial_reviews (
    release_id,
    review_kind,
    decision,
    checklist,
    notes,
    reviewer_id
  ) values (
    target_release_id,
    'release_qa',
    review_decision,
    review_checklist,
    review_notes,
    reviewer
  ) returning id into review_id;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    reviewer,
    'country_release.reviewed',
    'country_release',
    target_release_id,
    jsonb_build_object('decision', review_decision, 'reviewId', review_id)
  );

  return review_id;
end;
$$;

create function public.publish_country_release(target_release_id uuid)
returns public.country_releases
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_release public.country_releases%rowtype;
  publisher uuid := auth.uid();
begin
  if not (
    auth.role() = 'service_role'
    or (
      private.has_staff_role(array['publisher', 'admin']::public.staff_role[])
      and private.has_mfa()
    )
  ) then
    raise exception 'Publisher access with MFA is required.' using errcode = '42501';
  end if;

  select * into target_release
  from public.country_releases
  where id = target_release_id
  for update;

  if not found then
    raise exception 'Country release not found.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_release.country_id::text, 0));

  if target_release.state <> 'ready' then
    raise exception 'Release must pass release QA before publication.';
  end if;

  if not exists (
    select 1 from public.release_claim_versions where release_id = target_release_id
  ) or not exists (
    select 1 from public.release_block_versions where release_id = target_release_id
  ) then
    raise exception 'Release must contain at least one approved claim and one approved content block.';
  end if;

  if exists (
    select 1
    from public.release_claim_versions item
    join public.claims claim on claim.id = item.claim_id
    join public.claim_versions version on version.id = item.claim_version_id
    where item.release_id = target_release_id
      and (
        claim.suppressed_at is not null
        or version.workflow_state <> 'approved'
        or version.review_due_at is null
        or version.review_due_at <= now()
        or (version.effective_from is not null and version.effective_from > current_date)
        or (version.effective_until is not null and version.effective_until < current_date)
      )
  ) then
    raise exception 'Release contains a suppressed, unapproved, stale, or not-yet-effective claim version.';
  end if;

  if exists (
    select 1
    from public.release_claim_versions item
    join public.claim_versions version on version.id = item.claim_version_id
    where item.release_id = target_release_id
      and not exists (
        select 1
        from public.editorial_reviews review
        where review.claim_version_id = version.id
          and review.review_kind = 'editorial'
          and review.decision = 'approved'
          and review.created_at >= version.updated_at
      )
  ) then
    raise exception 'Every claim version needs a current approved editorial review.';
  end if;

  if exists (
    select 1
    from public.release_claim_versions item
    where item.release_id = target_release_id
      and not exists (
        select 1
        from public.claim_version_citations citation
        join public.source_documents source on source.id = citation.source_document_id
        join public.source_snapshots snapshot on snapshot.id = citation.source_snapshot_id
          and snapshot.source_document_id = source.id
        where citation.claim_version_id = item.claim_version_id
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
  ) then
    raise exception 'Every claim needs a current verified primary citation and exact source snapshot.';
  end if;

  if exists (
    select 1
    from public.release_claim_versions item
    join public.claims claim on claim.id = item.claim_id
    join public.claim_categories category on category.id = claim.category_id
    where item.release_id = target_release_id
      and category.requires_official_source
      and not exists (
        select 1
        from public.claim_version_citations citation
        join public.source_documents source on source.id = citation.source_document_id
        join public.source_snapshots snapshot on snapshot.id = citation.source_snapshot_id
          and snapshot.source_document_id = source.id
        where citation.claim_version_id = item.claim_version_id
          and citation.role = 'primary'
          and source.state = 'verified'
          and source.review_due_at > now()
          and source.authority_level in (
            'official_government',
            'embassy_consulate',
            'immigration_authority',
            'intergovernmental'
          )
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
  ) then
    raise exception 'This release has a claim that requires a verified official primary source.';
  end if;

  if exists (
    select 1
    from public.release_claim_versions item
    join public.claims claim on claim.id = item.claim_id
    join public.claim_categories category on category.id = claim.category_id
    where item.release_id = target_release_id
      and (claim.requires_professional_review or category.requires_professional_review)
      and not exists (
        select 1
        from public.editorial_reviews review
        where review.claim_version_id = item.claim_version_id
          and review.review_kind = 'professional'
          and review.decision = 'approved'
      )
  ) then
    raise exception 'A professional review is required for one or more high-impact claims.';
  end if;

  if exists (
    select 1
    from public.release_block_versions item
    join public.content_block_versions version on version.id = item.content_block_version_id
    where item.release_id = target_release_id
      and (
        version.workflow_state <> 'approved'
        or not exists (
          select 1
          from public.editorial_reviews review
          where review.content_block_version_id = version.id
            and review.review_kind = 'editorial'
            and review.decision = 'approved'
            and review.created_at >= version.updated_at
        )
      )
  ) then
    raise exception 'Every content block version needs a current approved editorial review.';
  end if;

  if exists (
    select 1
    from public.release_block_versions block_item
    join public.content_block_claims block_claim
      on block_claim.content_block_version_id = block_item.content_block_version_id
    left join public.release_claim_versions claim_item
      on claim_item.release_id = block_item.release_id
      and claim_item.claim_version_id = block_claim.claim_version_id
    where block_item.release_id = target_release_id
      and claim_item.claim_version_id is null
  ) then
    raise exception 'A released content block references a claim version that is not pinned to the same release.';
  end if;

  if exists (
    select 1
    from public.release_block_versions item
    join public.content_blocks block on block.id = item.content_block_id
    where item.release_id = target_release_id
      and block.risk_level in ('high', 'critical')
      and not exists (
        select 1
        from public.content_block_claims block_claim
        where block_claim.content_block_version_id = item.content_block_version_id
      )
  ) then
    raise exception 'High-impact content blocks must cite at least one claim version pinned to the release.';
  end if;

  if not exists (
    select 1
    from public.editorial_reviews review
    where review.release_id = target_release_id
      and review.review_kind = 'release_qa'
      and review.decision = 'approved'
      and review.created_at >= target_release.updated_at
  ) then
    raise exception 'Release QA approval is missing or older than the latest composition change.';
  end if;

  perform set_config('elsewhere.release_transition', 'allowed', true);

  update public.country_releases
  set state = 'superseded', is_current = false
  where country_id = target_release.country_id
    and is_current
    and state = 'published'
    and id <> target_release_id;

  update public.country_releases
  set state = 'published',
      is_current = true,
      published_by = publisher,
      published_at = now()
  where id = target_release_id
  returning * into target_release;

  update public.countries
  set visibility = 'published'
  where id = target_release.country_id;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    publisher,
    'country_release.published',
    'country_release',
    target_release_id,
    jsonb_build_object(
      'countryId', target_release.country_id,
      'releaseNumber', target_release.release_number,
      'publishedAt', target_release.published_at
    )
  );

  return target_release;
end;
$$;

create function public.emergency_suppress_claim(
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
begin
  if not (
    auth.role() = 'service_role'
    or (
      private.has_staff_role(array['publisher', 'admin']::public.staff_role[])
      and private.has_mfa()
    )
  ) then
    raise exception 'Publisher access with MFA is required.' using errcode = '42501';
  end if;

  if char_length(trim(suppression_reason)) < 10 then
    raise exception 'A meaningful suppression reason is required.';
  end if;

  update public.claims
  set suppressed_at = now(), suppressed_reason = trim(suppression_reason)
  where id = target_claim_id;
  if not found then
    raise exception 'Claim not found.';
  end if;

  insert into public.editorial_audit_events (
    actor_user_id, action, entity_type, entity_id, after_data
  ) values (
    actor,
    'claim.emergency_suppressed',
    'claim',
    target_claim_id,
    jsonb_build_object('reason', trim(suppression_reason))
  );
end;
$$;

revoke all on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.publish_country_release(uuid) from public, anon;
revoke all on function public.emergency_suppress_claim(uuid, text) from public, anon;

grant execute on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb) to authenticated;
grant execute on function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb) to authenticated;
grant execute on function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb) to authenticated;
grant execute on function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb) to authenticated;
grant execute on function public.publish_country_release(uuid) to authenticated;
grant execute on function public.emergency_suppress_claim(uuid, text) to authenticated;

grant execute on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb) to service_role;
grant execute on function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb) to service_role;
grant execute on function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb) to service_role;
grant execute on function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb) to service_role;
grant execute on function public.publish_country_release(uuid) to service_role;
grant execute on function public.emergency_suppress_claim(uuid, text) to service_role;

-- Every API-visible table has RLS. Grants describe available operations; policies
-- then constrain rows and workflow state.
alter table public.staff_memberships enable row level security;
alter table public.claim_categories enable row level security;
alter table public.countries enable row level security;
alter table public.country_portals enable row level security;
alter table public.portal_sections enable row level security;
alter table public.source_documents enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.claims enable row level security;
alter table public.claim_versions enable row level security;
alter table public.content_blocks enable row level security;
alter table public.content_block_versions enable row level security;
alter table public.claim_version_citations enable row level security;
alter table public.content_block_claims enable row level security;
alter table public.country_releases enable row level security;
alter table public.release_claim_versions enable row level security;
alter table public.release_block_versions enable row level security;
alter table public.editorial_reviews enable row level security;
alter table public.editorial_audit_events enable row level security;
alter table public.outdated_information_reports enable row level security;

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
  public.outdated_information_reports
from anon, authenticated;

grant all on table
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
  public.outdated_information_reports
to service_role;
grant usage, select on sequence public.editorial_audit_events_id_seq to service_role;

grant select on table
  public.claim_categories,
  public.countries,
  public.country_portals,
  public.portal_sections,
  public.source_documents,
  public.claims,
  public.claim_versions,
  public.content_blocks,
  public.content_block_versions,
  public.claim_version_citations,
  public.content_block_claims,
  public.country_releases,
  public.release_claim_versions,
  public.release_block_versions
to anon, authenticated;

grant select, insert, update, delete on table public.staff_memberships to authenticated;
grant insert, update, delete on table public.claim_categories to authenticated;
grant insert, update, delete on table public.countries to authenticated;
grant insert, update, delete on table public.country_portals to authenticated;
grant insert, update, delete on table public.portal_sections to authenticated;
grant insert, update, delete on table public.source_documents to authenticated;
grant select, insert on table public.source_snapshots to authenticated;
grant insert, update, delete on table public.claims to authenticated;
grant insert, update, delete on table public.claim_versions to authenticated;
grant insert, update, delete on table public.content_blocks to authenticated;
grant insert, update, delete on table public.content_block_versions to authenticated;
grant insert, update, delete on table public.claim_version_citations to authenticated;
grant insert, update, delete on table public.content_block_claims to authenticated;
grant insert, update, delete on table public.country_releases to authenticated;
grant insert, update, delete on table public.release_claim_versions to authenticated;
grant insert, update, delete on table public.release_block_versions to authenticated;
grant select, insert on table public.editorial_reviews to authenticated;
grant select on table public.editorial_audit_events to authenticated;
grant select, update on table public.outdated_information_reports to authenticated;

create policy staff_memberships_read_own_or_admin
on public.staff_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_staff_role(array['admin']::public.staff_role[]))
);

create policy staff_memberships_admin_insert
on public.staff_memberships
for insert
to authenticated
with check ((select private.has_staff_role(array['admin']::public.staff_role[])));
create policy staff_memberships_admin_update
on public.staff_memberships
for update
to authenticated
using ((select private.has_staff_role(array['admin']::public.staff_role[])))
with check ((select private.has_staff_role(array['admin']::public.staff_role[])));
create policy staff_memberships_admin_delete
on public.staff_memberships
for delete
to authenticated
using ((select private.has_staff_role(array['admin']::public.staff_role[])));

create policy claim_categories_public_read
on public.claim_categories
for select
to anon, authenticated
using (is_active);
create policy claim_categories_staff_read
on public.claim_categories
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy claim_categories_admin_insert
on public.claim_categories
for insert
to authenticated
with check ((select private.has_staff_role(array['admin']::public.staff_role[])));
create policy claim_categories_admin_update
on public.claim_categories
for update
to authenticated
using ((select private.has_staff_role(array['admin']::public.staff_role[])))
with check ((select private.has_staff_role(array['admin']::public.staff_role[])));
create policy claim_categories_admin_delete
on public.claim_categories
for delete
to authenticated
using ((select private.has_staff_role(array['admin']::public.staff_role[])));

create policy countries_public_read
on public.countries
for select
to anon, authenticated
using (visibility in ('preview', 'published'));
create policy countries_staff_read
on public.countries
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy countries_author_insert
on public.countries
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and visibility <> 'published'
);
create policy countries_author_update
on public.countries
for update
to authenticated
using (
  visibility <> 'published'
  and (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
)
with check (visibility <> 'published');
create policy countries_author_delete
on public.countries
for delete
to authenticated
using (
  visibility in ('draft', 'preview')
  and (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy country_portals_public_read
on public.country_portals
for select
to anon, authenticated
using (exists (
  select 1 from public.countries country
  where country.id = country_id and country.visibility in ('preview', 'published')
));
create policy country_portals_staff_read
on public.country_portals
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy country_portals_author_insert
on public.country_portals
for insert
to authenticated
with check ((select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[])));
create policy country_portals_author_update
on public.country_portals
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.countries country where country.id = country_id and country.visibility <> 'published')
)
with check ((select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[])));
create policy country_portals_author_delete
on public.country_portals
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.countries country where country.id = country_id and country.visibility <> 'published')
);

create policy portal_sections_public_read
on public.portal_sections
for select
to anon, authenticated
using (
  is_public
  and exists (
    select 1 from public.countries country
    where country.id = country_id and country.visibility in ('preview', 'published')
  )
);
create policy portal_sections_staff_read
on public.portal_sections
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy portal_sections_author_insert
on public.portal_sections
for insert
to authenticated
with check ((select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[])));
create policy portal_sections_author_update
on public.portal_sections
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.countries country where country.id = country_id and country.visibility <> 'published')
)
with check ((select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[])));
create policy portal_sections_author_delete
on public.portal_sections
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.countries country where country.id = country_id and country.visibility <> 'published')
);

create policy source_documents_public_read
on public.source_documents
for select
to anon, authenticated
using ((select private.source_document_is_public(id)));
create policy source_documents_staff_read
on public.source_documents
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy source_documents_author_insert
on public.source_documents
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and created_by = (select auth.uid())
  and state = 'draft'
);
create policy source_documents_author_update
on public.source_documents
for update
to authenticated
using ((select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[])))
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and state <> 'verified'
);
create policy source_documents_author_delete
on public.source_documents
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.source_document_is_public(id))
);

create policy source_snapshots_staff_read
on public.source_snapshots
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy source_snapshots_author_insert
on public.source_snapshots
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and captured_by = (select auth.uid())
);

create policy claims_public_read
on public.claims
for select
to anon, authenticated
using ((select private.claim_is_public(id)));
create policy claims_staff_read
on public.claims
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy claims_author_insert
on public.claims
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and created_by = (select auth.uid())
);
create policy claims_author_update
on public.claims
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.claim_is_public(id))
)
with check (not (select private.claim_is_public(id)));
create policy claims_author_delete
on public.claims
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.claim_is_public(id))
);

create policy claim_versions_public_read
on public.claim_versions
for select
to anon, authenticated
using ((select private.claim_version_is_public(id)));
create policy claim_versions_staff_read
on public.claim_versions
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy claim_versions_author_insert
on public.claim_versions
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and authored_by = (select auth.uid())
  and workflow_state in ('draft', 'in_review')
);
create policy claim_versions_author_update
on public.claim_versions
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.claim_version_is_public(id))
)
with check (
  not (select private.claim_version_is_public(id))
  and workflow_state in ('draft', 'in_review', 'changes_requested')
);
create policy claim_versions_author_delete
on public.claim_versions
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.claim_version_is_public(id))
);

create policy content_blocks_public_read
on public.content_blocks
for select
to anon, authenticated
using ((select private.content_block_is_public(id)));
create policy content_blocks_staff_read
on public.content_blocks
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy content_blocks_author_insert
on public.content_blocks
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and created_by = (select auth.uid())
);
create policy content_blocks_author_update
on public.content_blocks
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_is_public(id))
)
with check (not (select private.content_block_is_public(id)));
create policy content_blocks_author_delete
on public.content_blocks
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_is_public(id))
);

create policy content_block_versions_public_read
on public.content_block_versions
for select
to anon, authenticated
using ((select private.content_block_version_is_public(id)));
create policy content_block_versions_staff_read
on public.content_block_versions
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy content_block_versions_author_insert
on public.content_block_versions
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and authored_by = (select auth.uid())
  and workflow_state in ('draft', 'in_review')
);
create policy content_block_versions_author_update
on public.content_block_versions
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_version_is_public(id))
)
with check (
  not (select private.content_block_version_is_public(id))
  and workflow_state in ('draft', 'in_review', 'changes_requested')
);
create policy content_block_versions_author_delete
on public.content_block_versions
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_version_is_public(id))
);

create policy claim_version_citations_public_read
on public.claim_version_citations
for select
to anon, authenticated
using ((select private.claim_version_is_public(claim_version_id)));
create policy claim_version_citations_staff_read
on public.claim_version_citations
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy claim_version_citations_author_insert
on public.claim_version_citations
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and created_by = (select auth.uid())
  and not (select private.claim_version_is_public(claim_version_id))
);
create policy claim_version_citations_author_update
on public.claim_version_citations
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.claim_version_is_public(claim_version_id))
)
with check (not (select private.claim_version_is_public(claim_version_id)));
create policy claim_version_citations_author_delete
on public.claim_version_citations
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.claim_version_is_public(claim_version_id))
);

create policy content_block_claims_public_read
on public.content_block_claims
for select
to anon, authenticated
using (
  (select private.content_block_version_is_public(content_block_version_id))
  and (select private.claim_version_is_public(claim_version_id))
);
create policy content_block_claims_staff_read
on public.content_block_claims
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy content_block_claims_author_insert
on public.content_block_claims
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_version_is_public(content_block_version_id))
);
create policy content_block_claims_author_update
on public.content_block_claims
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_version_is_public(content_block_version_id))
)
with check (not (select private.content_block_version_is_public(content_block_version_id)));
create policy content_block_claims_author_delete
on public.content_block_claims
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and not (select private.content_block_version_is_public(content_block_version_id))
);

create policy country_releases_public_read
on public.country_releases
for select
to anon, authenticated
using (state = 'published' and is_current);
create policy country_releases_staff_read
on public.country_releases
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy country_releases_author_insert
on public.country_releases
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and created_by = (select auth.uid())
  and state = 'draft'
  and not is_current
);
create policy country_releases_author_update
on public.country_releases
for update
to authenticated
using (
  state in ('draft', 'ready')
  and (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
)
with check (state in ('draft', 'ready') and not is_current);
create policy country_releases_author_delete
on public.country_releases
for delete
to authenticated
using (
  state = 'draft'
  and (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
);

create policy release_claim_versions_public_read
on public.release_claim_versions
for select
to anon, authenticated
using (exists (
  select 1 from public.country_releases release
  where release.id = release_id and release.state = 'published' and release.is_current
));
create policy release_claim_versions_staff_read
on public.release_claim_versions
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy release_claim_versions_author_insert
on public.release_claim_versions
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready'))
);
create policy release_claim_versions_author_update
on public.release_claim_versions
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready'))
)
with check (exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready')));
create policy release_claim_versions_author_delete
on public.release_claim_versions
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready'))
);

create policy release_block_versions_public_read
on public.release_block_versions
for select
to anon, authenticated
using (exists (
  select 1 from public.country_releases release
  where release.id = release_id and release.state = 'published' and release.is_current
));
create policy release_block_versions_staff_read
on public.release_block_versions
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy release_block_versions_author_insert
on public.release_block_versions
for insert
to authenticated
with check (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready'))
);
create policy release_block_versions_author_update
on public.release_block_versions
for update
to authenticated
using (
  (select private.has_staff_role(array['editor', 'publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready'))
)
with check (exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready')));
create policy release_block_versions_author_delete
on public.release_block_versions
for delete
to authenticated
using (
  (select private.has_staff_role(array['publisher', 'admin']::public.staff_role[]))
  and exists (select 1 from public.country_releases release where release.id = release_id and release.state in ('draft', 'ready'))
);

create policy editorial_reviews_staff_read
on public.editorial_reviews
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy editorial_reviews_reviewer_insert
on public.editorial_reviews
for insert
to authenticated
with check (
  (select private.has_staff_role(array['reviewer', 'publisher', 'admin']::public.staff_role[]))
  and reviewer_id = (select auth.uid())
);

create policy editorial_audit_events_leadership_read
on public.editorial_audit_events
for select
to authenticated
using ((select private.has_staff_role(array['publisher', 'admin']::public.staff_role[])));

create policy outdated_reports_staff_read
on public.outdated_information_reports
for select
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));
create policy outdated_reports_staff_update
on public.outdated_information_reports
for update
to authenticated
using ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])))
with check ((select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[])));

-- Policy-driven category rules keep an editor from lowering publication gates on
-- a single claim. Category changes are admin-only and audited operationally.
insert into public.claim_categories (
  slug,
  name,
  portal_section_slug,
  default_risk_level,
  requires_official_source,
  requires_professional_review,
  review_interval_days
) values
  ('entry-requirements', 'Entry requirements', 'entry-and-stay', 'critical', true, false, 30),
  ('stay-options', 'Legal stay options', 'entry-and-stay', 'critical', true, false, 30),
  ('visa-fees', 'Government fees', 'entry-and-stay', 'high', true, false, 30),
  ('work-rights', 'Work rights', 'work-and-tax', 'critical', true, true, 30),
  ('tax-residency', 'Tax residency', 'work-and-tax', 'critical', true, true, 30),
  ('property-ownership', 'Property ownership', 'housing', 'critical', true, true, 30),
  ('housing-process', 'Housing process', 'housing', 'high', false, false, 90),
  ('healthcare-access', 'Healthcare access', 'healthcare', 'high', true, false, 90),
  ('insurance-requirements', 'Insurance requirements', 'healthcare', 'high', true, true, 90),
  ('cost-of-living', 'Cost of living', 'money', 'medium', false, false, 90),
  ('banking-and-payments', 'Banking and payments', 'money', 'high', true, false, 90),
  ('safety-and-laws', 'Safety and local laws', 'safety', 'high', true, false, 30),
  ('internet-and-connectivity', 'Internet and connectivity', 'cities', 'medium', false, false, 180),
  ('arrival-and-setup', 'Arrival and local setup', 'moving-and-arrival', 'medium', false, false, 90),
  ('renewals-and-compliance', 'Renewals and compliance', 'living-and-renewals', 'critical', true, false, 30),
  ('editorial-context', 'Editorial context', 'overview', 'low', false, false, 180)
on conflict (slug) do nothing;

insert into public.countries (iso_code, slug, name, region, flag_emoji, visibility)
values
  ('PH', 'philippines', 'Philippines', 'Southeast Asia', '🇵🇭', 'preview'),
  ('TH', 'thailand', 'Thailand', 'Southeast Asia', '🇹🇭', 'preview'),
  ('MX', 'mexico', 'Mexico', 'North America', '🇲🇽', 'preview')
on conflict (slug) do nothing;

insert into public.country_portals (country_id, coverage_level, overview)
select
  country.id,
  'preview',
  'This portal is being assembled through Elsewhere''s source and review workflow. Unreleased sections are clearly labeled.'
from public.countries country
where country.slug in ('philippines', 'thailand', 'mexico')
on conflict (country_id) do nothing;

insert into public.portal_sections (
  country_id,
  slug,
  title,
  description,
  sort_order,
  is_required
)
select
  country.id,
  section.slug,
  section.title,
  section.description,
  section.sort_order,
  section.is_required
from public.countries country
cross join (
  values
    ('overview', 'Overview and fit', 'Start with fit, major watchouts, and the safest next research step.', 10, true),
    ('entry-and-stay', 'Entry and legal stay', 'Understand applicable entry rules and legal-stay paths.', 20, true),
    ('money', 'Money and affordability', 'Plan a realistic budget and local money setup.', 30, true),
    ('cities', 'Cities, climate, and daily life', 'Compare where daily life may fit your priorities.', 40, true),
    ('housing', 'Housing', 'Research rentals, contracts, deposits, utilities, and scams.', 50, true),
    ('healthcare', 'Healthcare and insurance', 'Plan access, coverage, medications, and emergencies.', 60, true),
    ('work-and-tax', 'Work, business, and tax cautions', 'Separate immigration, work-right, and tax questions.', 70, true),
    ('safety', 'Safety, laws, hazards, and scams', 'Prepare for destination-specific risks and local laws.', 80, true),
    ('moving-and-arrival', 'Moving and arrival', 'Turn research into a practical arrival checklist.', 90, true),
    ('living-and-renewals', 'Living, renewals, and long-term settlement', 'Maintain legal status and build stable local routines.', 100, true),
    ('sources-and-changes', 'Sources, corrections, and change history', 'Inspect evidence, freshness, corrections, and release history.', 110, true)
) as section(slug, title, description, sort_order, is_required)
where country.slug in ('philippines', 'thailand', 'mexico')
on conflict (country_id, slug) do nothing;

insert into public.country_releases (country_id, release_number, state, release_notes)
select country.id, 1, 'draft', 'Initial source-backed portal release.'
from public.countries country
where country.slug in ('philippines', 'thailand', 'mexico')
on conflict (country_id, release_number) do nothing;

create view public.published_country_portals
with (security_invoker = true)
as
select
  country.id as country_id,
  country.iso_code,
  country.slug as country_slug,
  country.name as country_name,
  country.region,
  country.flag_emoji,
  country.summary,
  portal.coverage_level,
  portal.default_locale,
  portal.audience_scope,
  portal.overview,
  release.id as release_id,
  release.release_number,
  release.published_at,
  release.updated_at as reviewed_at
from public.countries country
join public.country_portals portal on portal.country_id = country.id
join public.country_releases release on release.country_id = country.id
where country.visibility = 'published'
  and release.state = 'published'
  and release.is_current;

create view public.published_country_claims
with (security_invoker = true)
as
select
  country.slug as country_slug,
  release.id as release_id,
  release.release_number,
  section.slug as section_slug,
  section.title as section_title,
  item.sort_order,
  claim.id as claim_id,
  claim.claim_slug,
  claim.risk_level,
  claim.requires_professional_review,
  version.id as claim_version_id,
  version.version_number,
  version.public_summary,
  version.user_meaning,
  version.applicability,
  version.locale,
  version.confidence_level,
  version.review_due_at,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'citationId', citation.id,
        'role', citation.role,
        'sourceId', source.id,
        'sourceTitle', source.title,
        'publisher', source.publisher,
        'authorityLevel', source.authority_level,
        'canonicalUrl', source.canonical_url,
        'exactLocator', citation.exact_locator,
        'supportNote', citation.support_note,
        'lastVerifiedAt', source.last_verified_at
      ) order by citation.sort_order, citation.created_at
    ) filter (where citation.id is not null),
    '[]'::jsonb
  ) as citations
from public.country_releases release
join public.countries country on country.id = release.country_id
join public.release_claim_versions item on item.release_id = release.id
join public.portal_sections section on section.id = item.portal_section_id
join public.claims claim on claim.id = item.claim_id and claim.suppressed_at is null
join public.claim_versions version on version.id = item.claim_version_id
left join public.claim_version_citations citation on citation.claim_version_id = version.id
left join public.source_documents source on source.id = citation.source_document_id
where release.state = 'published' and release.is_current
group by
  country.slug,
  release.id,
  release.release_number,
  section.slug,
  section.title,
  item.sort_order,
  claim.id,
  claim.claim_slug,
  claim.risk_level,
  claim.requires_professional_review,
  version.id,
  version.version_number,
  version.public_summary,
  version.user_meaning,
  version.applicability,
  version.locale,
  version.confidence_level,
  version.review_due_at;

create view public.published_country_blocks
with (security_invoker = true)
as
select
  country.slug as country_slug,
  release.id as release_id,
  release.release_number,
  section.slug as section_slug,
  section.title as section_title,
  item.sort_order,
  block.id as content_block_id,
  block.slug as content_block_slug,
  block.kind,
  block.risk_level,
  version.id as content_block_version_id,
  version.version_number,
  version.title,
  version.body,
  coalesce(
    jsonb_agg(block_claim.claim_version_id order by block_claim.sort_order)
      filter (where block_claim.claim_version_id is not null),
    '[]'::jsonb
  ) as claim_version_ids
from public.country_releases release
join public.countries country on country.id = release.country_id
join public.release_block_versions item on item.release_id = release.id
join public.portal_sections section on section.id = item.portal_section_id
join public.content_blocks block on block.id = item.content_block_id
join public.content_block_versions version on version.id = item.content_block_version_id
left join public.content_block_claims block_claim
  on block_claim.content_block_version_id = version.id
where release.state = 'published' and release.is_current
group by
  country.slug,
  release.id,
  release.release_number,
  section.slug,
  section.title,
  item.sort_order,
  block.id,
  block.slug,
  block.kind,
  block.risk_level,
  version.id,
  version.version_number,
  version.title,
  version.body;

revoke all on table
  public.published_country_portals,
  public.published_country_claims,
  public.published_country_blocks
from public, anon, authenticated;
grant select on table
  public.published_country_portals,
  public.published_country_claims,
  public.published_country_blocks
to anon, authenticated;
