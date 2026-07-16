-- Safe official-source monitoring.
--
-- Trust boundary:
--   * the network worker may record bounded response metadata and hashes;
--   * it never stores an unreviewed body, interprets a rule, verifies a source,
--     approves a claim, clears a claim impact, or publishes guidance;
--   * a source change creates an immutable impact for every citing claim
--     version. Source re-verification alone cannot clear those impacts.

create type public.source_monitor_job_status as enum (
  'queued',
  'running',
  'baseline',
  'unchanged',
  'changed',
  'blocked',
  'unavailable',
  'failed'
);

create type public.source_monitor_resolution as enum (
  'source_reverified',
  'source_superseded',
  'monitoring_adjusted',
  'acknowledged',
  'dismissed'
);

-- The monitor uses a dedicated Postgres/Data API role instead of the broad
-- service_role. A server-only, short-lived JWT with role=source_monitor_worker
-- can call only the two leased-queue RPCs granted at the end of this migration.
do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_roles where rolname = 'source_monitor_worker'
  ) then
    create role source_monitor_worker nologin noinherit;
  end if;
end;
$$;

-- Hidden current rows are still immutable release history. Check both sides of
-- a citation move so a monitor-triggered public-read cutoff can never make an
-- old released citation writable.
create or replace function private.guard_citation_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot_source_id uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.claim_version_id = old.claim_version_id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Citations on released claim versions are immutable.';
  end if;

  if tg_op in ('INSERT', 'UPDATE') and exists (
    select 1
    from public.release_claim_versions item
    join public.country_releases release on release.id = item.release_id
    where item.claim_version_id = new.claim_version_id
      and release.state in ('published', 'superseded', 'withdrawn')
  ) then
    raise exception 'Citations on released claim versions are immutable.';
  end if;

  if tg_op <> 'DELETE' and new.source_snapshot_id is not null then
    select snapshot.source_document_id
    into snapshot_source_id
    from public.source_snapshots snapshot
    where snapshot.id = new.source_snapshot_id;

    if not found or snapshot_source_id is distinct from new.source_document_id then
      raise exception 'Citation snapshot must belong to the cited source document.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.guard_citation_history()
from public, anon, authenticated, service_role, source_monitor_worker;

-- Source approval always chooses a snapshot captured after the newest content
-- edit, detected evidence change, or repeated-failure review boundary.
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
      raise exception 'Source authors cannot approve their own source evidence.';
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
      'verificationRequiredAt', verification_required_at
    )
  );

  return review_id;
end;
$$;

alter role source_monitor_worker nologin noinherit nobypassrls;
revoke anon, authenticated, service_role from source_monitor_worker;
grant source_monitor_worker to authenticator;

-- Monitoring state is intentionally isolated from source_documents. Staff
-- and the network worker cannot bypass its RPC workflow with direct writes.
create table public.source_monitor_state (
  source_document_id uuid primary key
    references public.source_documents(id) on delete cascade,
  monitoring_enabled boolean not null default false,
  monitor_frequency_hours integer not null default 168
    check (monitor_frequency_hours between 24 and 2160),
  configuration_version integer not null default 1
    check (configuration_version > 0),
  next_monitor_at timestamptz,
  last_success_at timestamptz,
  last_final_url text check (
    last_final_url is null
    or (last_final_url ~ '^https://' and char_length(last_final_url) <= 4096)
  ),
  last_content_type text check (
    last_content_type is null
    or last_content_type in (
      'text/html',
      'application/xhtml+xml',
      'text/plain',
      'application/pdf'
    )
  ),
  last_content_length_bytes bigint check (
    last_content_length_bytes is null
    or last_content_length_bytes between 1 and 5242880
  ),
  last_raw_hash text check (
    last_raw_hash is null or last_raw_hash ~ '^[a-f0-9]{64}$'
  ),
  last_semantic_hash text check (
    last_semantic_hash is null or last_semantic_hash ~ '^[a-f0-9]{64}$'
  ),
  last_etag text check (
    last_etag is null
    or (
      char_length(last_etag) between 2 and 1000
      and last_etag !~ '[[:cntrl:]]'
    )
  ),
  last_modified_header text check (
    last_modified_header is null
    or (
      char_length(last_modified_header) between 29 and 100
      and last_modified_header !~ '[[:cntrl:]]'
    )
  ),
  normalization_algorithm_version text check (
    normalization_algorithm_version is null
    or normalization_algorithm_version ~ '^[a-z0-9]+(?:[._-][a-z0-9]+){0,7}$'
  ),
  evidence_changed_at timestamptz,
  failure_review_required_at timestamptz,
  consecutive_failures integer not null default 0
    check (consecutive_failures between 0 and 1000000),
  configured_by uuid references auth.users(id) on delete set null,
  configured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not monitoring_enabled or next_monitor_at is not null),
  check (
    (
      last_success_at is null
      and last_final_url is null
      and last_content_type is null
      and last_content_length_bytes is null
      and last_raw_hash is null
      and last_semantic_hash is null
      and last_etag is null
      and last_modified_header is null
      and normalization_algorithm_version is null
    )
    or (
      last_success_at is not null
      and last_final_url is not null
      and last_content_type is not null
      and last_content_length_bytes is not null
      and last_raw_hash is not null
      and last_semantic_hash is not null
      and normalization_algorithm_version is not null
    )
  )
);

create table public.source_monitor_origins (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null
    references public.source_documents(id) on delete cascade,
  configuration_version integer not null check (configuration_version > 0),
  hostname text not null check (
    hostname = lower(hostname)
    and char_length(hostname) between 4 and 253
    and hostname ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
    and hostname !~ '^[0-9.]+$'
    and hostname !~ '(^|\.)(localhost|local|localdomain|internal|home\.arpa|test|invalid|example|onion)$'
  ),
  active boolean not null default true,
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_document_id, hostname)
);

create table public.source_monitor_jobs (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null
    references public.source_documents(id) on delete restrict,
  configuration_version integer not null check (configuration_version > 0),
  status public.source_monitor_job_status not null default 'queued',
  scheduled_for timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  lease_token uuid,
  lease_expires_at timestamptz,
  completion_token uuid,
  started_at timestamptz,
  completed_at timestamptz,
  http_status integer check (http_status between 100 and 599),
  final_url text check (
    final_url is null
    or (final_url ~ '^https://' and char_length(final_url) <= 4096)
  ),
  content_type text check (
    content_type is null
    or content_type in (
      'text/html',
      'application/xhtml+xml',
      'text/plain',
      'application/pdf'
    )
  ),
  content_length_bytes bigint check (
    content_length_bytes is null
    or content_length_bytes between 1 and 5242880
  ),
  etag text check (
    etag is null
    or (char_length(etag) between 2 and 1000 and etag !~ '[[:cntrl:]]')
  ),
  last_modified_header text check (
    last_modified_header is null
    or (
      char_length(last_modified_header) between 29 and 100
      and last_modified_header !~ '[[:cntrl:]]'
    )
  ),
  previous_final_url text check (
    previous_final_url is null
    or (previous_final_url ~ '^https://' and char_length(previous_final_url) <= 4096)
  ),
  previous_content_type text check (
    previous_content_type is null
    or previous_content_type in (
      'text/html',
      'application/xhtml+xml',
      'text/plain',
      'application/pdf'
    )
  ),
  previous_content_length_bytes bigint check (
    previous_content_length_bytes is null
    or previous_content_length_bytes between 1 and 5242880
  ),
  previous_raw_hash text check (
    previous_raw_hash is null or previous_raw_hash ~ '^[a-f0-9]{64}$'
  ),
  current_raw_hash text check (
    current_raw_hash is null or current_raw_hash ~ '^[a-f0-9]{64}$'
  ),
  previous_semantic_hash text check (
    previous_semantic_hash is null or previous_semantic_hash ~ '^[a-f0-9]{64}$'
  ),
  current_semantic_hash text check (
    current_semantic_hash is null or current_semantic_hash ~ '^[a-f0-9]{64}$'
  ),
  previous_etag text check (
    previous_etag is null
    or (char_length(previous_etag) between 2 and 1000 and previous_etag !~ '[[:cntrl:]]')
  ),
  previous_last_modified_header text check (
    previous_last_modified_header is null
    or (
      char_length(previous_last_modified_header) between 29 and 100
      and previous_last_modified_header !~ '[[:cntrl:]]'
    )
  ),
  previous_normalization_algorithm_version text check (
    previous_normalization_algorithm_version is null
    or previous_normalization_algorithm_version ~ '^[a-z0-9]+(?:[._-][a-z0-9]+){0,7}$'
  ),
  current_normalization_algorithm_version text check (
    current_normalization_algorithm_version is null
    or current_normalization_algorithm_version ~ '^[a-z0-9]+(?:[._-][a-z0-9]+){0,7}$'
  ),
  validator_etag_sent boolean not null default false,
  validator_last_modified_sent boolean not null default false,
  error_code text check (
    error_code is null
    or (
      char_length(error_code) between 1 and 64
      and error_code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
    )
  ),
  error_detail text check (
    error_detail is null or char_length(error_detail) between 1 and 2000
  ),
  resolution public.source_monitor_resolution,
  resolution_note text check (
    resolution_note is null or char_length(trim(resolution_note)) between 10 and 2000
  ),
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, source_document_id),
  check (
    (
      status = 'queued'
      and lease_token is null
      and lease_expires_at is null
      and started_at is null
      and completed_at is null
      and completion_token is null
    )
    or (
      status = 'running'
      and lease_token is not null
      and lease_expires_at is not null
      and started_at is not null
      and completed_at is null
      and completion_token is null
    )
    or (
      status not in ('queued', 'running')
      and lease_token is null
      and lease_expires_at is null
      and completed_at is not null
    )
  ),
  check (
    (
      resolution is null
      and resolution_note is null
      and resolved_by is null
      and resolved_at is null
    )
    or (
      resolution is not null
      and resolution_note is not null
      and resolved_by is not null
      and resolved_at is not null
      and status not in ('queued', 'running', 'unchanged')
    )
  )
);

-- One immutable event exists for each exact claim version citing the source at
-- the moment a baseline/provenance/semantic change is detected.
create table public.source_change_claim_impacts (
  id uuid primary key default gen_random_uuid(),
  source_monitor_job_id uuid not null,
  source_document_id uuid not null,
  claim_version_id uuid not null
    references public.claim_versions(id) on delete restrict,
  change_kind public.source_monitor_job_status not null
    check (change_kind in ('baseline', 'changed')),
  detected_at timestamptz not null,
  previous_final_url text,
  current_final_url text not null,
  previous_content_type text,
  current_content_type text not null,
  previous_semantic_hash text,
  current_semantic_hash text not null,
  previous_normalization_algorithm_version text,
  current_normalization_algorithm_version text not null,
  citation_ids uuid[] not null check (cardinality(citation_ids) > 0),
  cited_snapshot_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  foreign key (source_monitor_job_id, source_document_id)
    references public.source_monitor_jobs(id, source_document_id) on delete restrict,
  unique (source_monitor_job_id, claim_version_id)
);

-- These are append-only claim-level decisions. An approved event captures the
-- exact post-change source review and, when required, professional review.
create table public.source_change_claim_impact_reviews (
  id uuid primary key default gen_random_uuid(),
  source_change_claim_impact_id uuid not null
    references public.source_change_claim_impacts(id) on delete restrict,
  decision public.editorial_review_decision not null,
  source_verification_review_id uuid
    references public.editorial_reviews(id) on delete restrict,
  professional_review_id uuid
    references public.editorial_reviews(id) on delete restrict,
  checklist jsonb not null default '{}'::jsonb
    check (jsonb_typeof(checklist) = 'object'),
  notes text not null check (char_length(trim(notes)) between 20 and 2000),
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (
    (decision = 'approved' and source_verification_review_id is not null)
    or (
      decision <> 'approved'
      and source_verification_review_id is null
      and professional_review_id is null
    )
  )
);

create unique index source_monitor_jobs_one_active_per_source_idx
  on public.source_monitor_jobs (source_document_id)
  where status in ('queued', 'running');
create index source_monitor_jobs_queue_idx
  on public.source_monitor_jobs (status, scheduled_for, created_at);
create index source_monitor_jobs_source_history_idx
  on public.source_monitor_jobs (source_document_id, created_at desc);
create index source_monitor_jobs_open_changes_idx
  on public.source_monitor_jobs (status, completed_at desc)
  where status in ('baseline', 'changed', 'blocked', 'unavailable', 'failed')
    and resolution is null;
create index source_monitor_jobs_resolved_by_idx
  on public.source_monitor_jobs (resolved_by)
  where resolved_by is not null;
create index source_monitor_origins_source_active_idx
  on public.source_monitor_origins (
    source_document_id,
    configuration_version,
    active,
    hostname
  );
create index source_monitor_origins_approved_by_idx
  on public.source_monitor_origins (approved_by);
create index source_monitor_state_due_idx
  on public.source_monitor_state (next_monitor_at, source_document_id)
  where monitoring_enabled;
create index source_change_claim_impacts_claim_idx
  on public.source_change_claim_impacts (claim_version_id, detected_at desc);
create index source_change_claim_impacts_source_idx
  on public.source_change_claim_impacts (source_document_id, detected_at desc);
create index source_change_claim_impact_reviews_impact_idx
  on public.source_change_claim_impact_reviews (
    source_change_claim_impact_id,
    created_at desc,
    id desc
  );
create index source_change_claim_impact_reviews_reviewer_idx
  on public.source_change_claim_impact_reviews (reviewer_id);

comment on table public.source_monitor_state is
  'Protected operational source-monitor configuration and hash baseline, separate from editorial source identity.';
comment on table public.source_monitor_jobs is
  'Durable leased queue and bounded metadata/hash history. Unreviewed response bodies are never stored.';
comment on column public.source_monitor_state.evidence_changed_at is
  'Freshness boundary advanced only by a new baseline or provenance/semantic change, never by an unchanged check.';
comment on column public.source_monitor_state.failure_review_required_at is
  'Freshness boundary advanced when repeated monitor failures require a new manual source snapshot and review.';
comment on table public.source_change_claim_impacts is
  'Immutable per-claim-version evidence-change events. Source review alone cannot clear them.';

create trigger source_monitor_state_set_updated_at
before update on public.source_monitor_state
for each row execute function private.set_updated_at();

create trigger source_monitor_jobs_set_updated_at
before update on public.source_monitor_jobs
for each row execute function private.set_updated_at();

create trigger source_change_claim_impacts_immutable
before update or delete on public.source_change_claim_impacts
for each row execute function private.guard_review_immutable();

create trigger source_change_claim_impact_reviews_immutable
before update or delete on public.source_change_claim_impact_reviews
for each row execute function private.guard_review_immutable();

-- Operational last_checked_at changes do not invalidate a source review. A
-- true evidence change has its own evidence_changed_at boundary above.
drop trigger source_documents_set_updated_at on public.source_documents;

create function private.source_verification_required_at(target_source_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    source.updated_at,
    coalesce(state.evidence_changed_at, '-infinity'::timestamptz),
    coalesce(state.failure_review_required_at, '-infinity'::timestamptz)
  )
  from public.source_documents source
  left join public.source_monitor_state state
    on state.source_document_id = source.id
  where source.id = target_source_id;
$$;

revoke all on function private.source_verification_required_at(uuid)
from public, anon, authenticated, service_role, source_monitor_worker;

create function private.set_source_document_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if row(
    new.country_id,
    new.canonical_url,
    new.title,
    new.publisher,
    new.authority_level,
    new.jurisdiction,
    new.source_language,
    new.translation_status,
    new.publication_date,
    new.state,
    new.created_by
  ) is distinct from row(
    old.country_id,
    old.canonical_url,
    old.title,
    old.publisher,
    old.authority_level,
    old.jurisdiction,
    old.source_language,
    old.translation_status,
    old.publication_date,
    old.state,
    old.created_by
  ) then
    new.updated_at = greatest(
      now(),
      coalesce(
        (select private.source_verification_required_at(old.id)),
        old.updated_at
      )
    );
  else
    new.updated_at = greatest(
      old.updated_at,
      coalesce(
        (select private.source_verification_required_at(old.id)),
        old.updated_at
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function private.set_source_document_updated_at()
from public, anon, authenticated, service_role, source_monitor_worker;

create trigger source_documents_set_updated_at
before update on public.source_documents
for each row execute function private.set_source_document_updated_at();

create function private.source_monitor_worker_authorized()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt()) ->> 'role', '') = 'source_monitor_worker';
$$;

create function private.valid_monitor_etag(target_value text)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select target_value is null
    or (
      char_length(target_value) between 2 and 1000
      and target_value !~ '[[:cntrl:]]'
      and target_value ~ '^(W/)?"[^"[:cntrl:]]*"$'
    );
$$;

create function private.valid_monitor_http_date(target_value text)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select target_value is null
    or target_value ~ '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (0[1-9]|[12][0-9]|3[01]) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9] GMT$';
$$;

revoke all on function private.source_monitor_worker_authorized()
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.valid_monitor_etag(text)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.valid_monitor_http_date(text)
from public, anon, authenticated, service_role, source_monitor_worker;

-- Caller must already hold source_document then source_monitor_state locks.
-- Both worker failures and expired leases use this one backoff/cutoff path.
create function private.apply_source_monitor_failure(
  target_source_document_id uuid,
  target_failure_increment integer default 1
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prior_failures integer;
  new_failures integer;
  backoff_hours integer;
begin
  if target_failure_increment is null or target_failure_increment not between 1 and 20 then
    raise exception 'Failure increment must be between 1 and 20.';
  end if;

  select state.consecutive_failures
  into prior_failures
  from public.source_monitor_state state
  where state.source_document_id = target_source_document_id;

  if not found then
    raise exception 'Source monitor state not found.';
  end if;

  new_failures := prior_failures + target_failure_increment;
  backoff_hours := least(
    24,
    power(2::numeric, least(greatest(new_failures - 1, 0), 5))::integer
  );

  update public.source_monitor_state
  set consecutive_failures = new_failures,
      failure_review_required_at = case
        when prior_failures < 3 and new_failures >= 3 then now()
        else failure_review_required_at
      end,
      next_monitor_at = now() + make_interval(hours => backoff_hours)
  where source_document_id = target_source_document_id;

  update public.source_documents
  set last_checked_at = now(),
      review_due_at = case
        when new_failures >= 3 and state = 'verified'
          then least(coalesce(review_due_at, now()), now())
        else review_due_at
      end
  where id = target_source_document_id;

  if prior_failures < 3 and new_failures >= 3 then
    insert into public.editorial_audit_events (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      after_data
    ) values (
      null,
      'source_monitor.failure_cutoff_reached',
      'source_document',
      target_source_document_id,
      jsonb_build_object(
        'consecutiveFailures', new_failures,
        'nextMonitorAt', now() + make_interval(hours => backoff_hours),
        'sourceReviewExpired', true
      )
    );
  end if;

  return new_failures;
end;
$$;

revoke all on function private.apply_source_monitor_failure(uuid, integer)
from public, anon, authenticated, service_role, source_monitor_worker;

-- A canonical URL edit is an editorial identity change. It invalidates the
-- operational baseline, origin approvals, and any active fetch lease. The
-- source's normal updated_at/source-review boundary handles the editorial edit.
create function private.cleanup_source_monitoring_on_url_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.canonical_url is distinct from old.canonical_url then
    update public.source_monitor_state
    set monitoring_enabled = false,
        configuration_version = configuration_version + 1,
        next_monitor_at = null,
        last_success_at = null,
        last_final_url = null,
        last_content_type = null,
        last_content_length_bytes = null,
        last_raw_hash = null,
        last_semantic_hash = null,
        last_etag = null,
        last_modified_header = null,
        normalization_algorithm_version = null,
        evidence_changed_at = now(),
        failure_review_required_at = null,
        consecutive_failures = 0,
        configured_by = (select auth.uid()),
        configured_at = now()
    where source_document_id = new.id;

    delete from public.source_monitor_origins
    where source_document_id = new.id;

    update public.source_monitor_jobs
    set status = 'blocked',
        completed_at = now(),
        lease_token = null,
        lease_expires_at = null,
        error_code = 'canonical_url_changed',
        error_detail = 'Canonical URL changed while this monitoring job was active.'
    where source_document_id = new.id
      and status in ('queued', 'running');

    insert into public.editorial_audit_events (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      before_data,
      after_data
    ) values (
      (select auth.uid()),
      'source_monitor.reset_after_url_change',
      'source_document',
      new.id,
      jsonb_build_object('canonicalUrl', old.canonical_url),
      jsonb_build_object(
        'canonicalUrl', new.canonical_url,
        'monitoringEnabled', false,
        'baselineCleared', true
      )
    );
  end if;

  return null;
end;
$$;

revoke all on function private.cleanup_source_monitoring_on_url_change()
from public, anon, authenticated, service_role, source_monitor_worker;

create trigger source_documents_cleanup_monitoring_on_url_change
after update of canonical_url on public.source_documents
for each row execute function private.cleanup_source_monitoring_on_url_change();

create function private.configure_source_monitoring(
  target_source_document_id uuid,
  target_enabled boolean,
  target_frequency_hours integer,
  target_approved_hostnames text[]
)
returns public.source_monitor_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  canonical_authority text;
  target_source public.source_documents%rowtype;
  target_state public.source_monitor_state%rowtype;
  next_configuration_version integer;
begin
  if actor is null
    or not (
      (select private.has_staff_role(
        array['publisher', 'admin']::public.staff_role[]
      ))
      and (select private.has_mfa())
    )
  then
    raise exception 'Publisher access with MFA is required.' using errcode = '42501';
  end if;

  if target_enabled is null then
    raise exception 'Monitoring enabled must be true or false.';
  end if;

  if target_frequency_hours is null or target_frequency_hours not between 24 and 2160 then
    raise exception 'Monitor frequency must be between 24 and 2160 hours.';
  end if;

  if coalesce(cardinality(target_approved_hostnames), 0) > 10 then
    raise exception 'No more than 10 exact hostnames may be approved for one source.';
  end if;

  select * into target_source
  from public.source_documents source
  where source.id = target_source_document_id
  for update;

  if not found then
    raise exception 'Source document not found.';
  end if;

  insert into public.source_monitor_state (
    source_document_id,
    monitoring_enabled,
    monitor_frequency_hours,
    next_monitor_at,
    configured_by
  ) values (
    target_source_document_id,
    false,
    target_frequency_hours,
    null,
    actor
  )
  on conflict (source_document_id) do nothing;

  select * into target_state
  from public.source_monitor_state state
  where state.source_document_id = target_source_document_id
  for update;

  next_configuration_version := target_state.configuration_version + 1;

  canonical_authority := lower(
    split_part(
      split_part(
        split_part(
          split_part(target_source.canonical_url, '://', 2),
          '/',
          1
        ),
        '?',
        1
      ),
      '#',
      1
    )
  );

  if target_enabled then
    if coalesce(cardinality(target_approved_hostnames), 0) = 0 then
      raise exception 'At least the exact canonical hostname must be approved.';
    end if;

    if cardinality(target_approved_hostnames) <> (
      select count(distinct approved_hostname)
      from unnest(target_approved_hostnames) approved_hostname
    ) then
      raise exception 'Approved hostname entries must be unique.';
    end if;

    if canonical_authority like '%@%'
      or canonical_authority like '%:%'
      or canonical_authority !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
      or canonical_authority ~ '^[0-9.]+$'
    then
      raise exception 'The canonical source URL must use a normal HTTPS DNS hostname without credentials or a custom port.';
    end if;

    if not canonical_authority = any(target_approved_hostnames) then
      raise exception 'The canonical source hostname must appear exactly in the approved hostname list.';
    end if;

    if exists (
      select 1
      from unnest(target_approved_hostnames) approved_hostname
      where approved_hostname is null
        or approved_hostname <> lower(approved_hostname)
        or approved_hostname <> trim(approved_hostname)
        or approved_hostname ~ '\.$'
        or approved_hostname !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
        or approved_hostname ~ '^[0-9.]+$'
        or approved_hostname ~ '(^|\.)(localhost|local|localdomain|internal|home\.arpa|test|invalid|example|onion)$'
    ) then
      raise exception 'Approved monitor origins must be exact lowercase public DNS hostnames.';
    end if;
  end if;

  -- Source -> state -> jobs is the lock order used by every workflow here.
  update public.source_monitor_jobs
  set status = 'blocked',
      completed_at = now(),
      lease_token = null,
      lease_expires_at = null,
      error_code = case
        when target_enabled then 'monitoring_configuration_changed'
        else 'monitoring_disabled'
      end,
      error_detail = case
        when target_enabled
          then 'Monitoring configuration changed while this job was active.'
        else 'Monitoring was disabled while this job was active.'
      end
  where source_document_id = target_source_document_id
    and status in ('queued', 'running');

  delete from public.source_monitor_origins
  where source_document_id = target_source_document_id;

  if target_enabled then
    insert into public.source_monitor_origins (
      source_document_id,
      configuration_version,
      hostname,
      approved_by
    )
    select
      target_source_document_id,
      next_configuration_version,
      approved_hostname,
      actor
    from unnest(target_approved_hostnames) approved_hostname;
  end if;

  update public.source_monitor_state
  set monitoring_enabled = target_enabled,
      monitor_frequency_hours = target_frequency_hours,
      configuration_version = next_configuration_version,
      next_monitor_at = case when target_enabled then now() else null end,
      consecutive_failures = 0,
      configured_by = actor,
      configured_at = now()
  where source_document_id = target_source_document_id
  returning * into target_state;

  insert into public.editorial_audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_data
  ) values (
    actor,
    'source_monitor.configured',
    'source_document',
    target_source_document_id,
    jsonb_build_object(
      'enabled', target_enabled,
      'frequencyHours', target_frequency_hours,
      'configurationVersion', next_configuration_version,
      'approvedHostnames', coalesce(to_jsonb(target_approved_hostnames), '[]'::jsonb)
    )
  );

  return target_state;
end;
$$;

create function private.claim_source_monitor_jobs(target_batch_size integer default 5)
returns table (
  job_id uuid,
  lease_token uuid,
  source_document_id uuid,
  canonical_url text,
  approved_hostnames text[],
  configuration_version integer,
  previous_final_url text,
  previous_content_type text,
  previous_content_length_bytes bigint,
  previous_raw_hash text,
  previous_semantic_hash text,
  previous_etag text,
  previous_last_modified text,
  previous_normalization_algorithm_version text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_source_id uuid;
  expired_job_count integer;
begin
  if not (select private.source_monitor_worker_authorized()) then
    raise exception 'Dedicated source monitor worker access required.'
      using errcode = '42501';
  end if;

  if target_batch_size is null or target_batch_size not between 1 and 20 then
    raise exception 'Monitor batch size must be between 1 and 20.';
  end if;

  -- Reap abandoned work source-first. An expired lease is a real failed check:
  -- it advances failure count, exponential backoff, and the three-failure
  -- editorial cutoff exactly like an explicit worker failure.
  for expired_source_id in
    select distinct job.source_document_id
    from public.source_monitor_jobs job
    where job.status = 'running'
      and job.lease_expires_at <= now()
    order by job.source_document_id
  loop
    perform 1
    from public.source_documents source
    where source.id = expired_source_id
    for update;

    perform 1
    from public.source_monitor_state state
    where state.source_document_id = expired_source_id
    for update;

    update public.source_monitor_jobs job
    set status = 'failed',
        completed_at = now(),
        lease_token = null,
        lease_expires_at = null,
        error_code = 'lease_expired',
        error_detail = 'A monitor worker did not complete before its lease expired.'
    where job.source_document_id = expired_source_id
      and job.status = 'running'
      and job.lease_expires_at <= now();

    get diagnostics expired_job_count = row_count;

    if expired_job_count > 0 then
      perform private.apply_source_monitor_failure(
        expired_source_id,
        expired_job_count
      );

      insert into public.editorial_audit_events (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        after_data
      ) values (
        null,
        'source_monitor.lease_expired',
        'source_document',
        expired_source_id,
        jsonb_build_object('expiredJobCount', expired_job_count)
      );
    end if;
  end loop;

  insert into public.source_monitor_jobs (
    source_document_id,
    configuration_version,
    status,
    scheduled_for
  )
  select
    state.source_document_id,
    state.configuration_version,
    'queued',
    coalesce(state.next_monitor_at, now())
  from public.source_monitor_state state
  where state.monitoring_enabled
    and state.next_monitor_at <= now()
    and exists (
      select 1
      from public.source_monitor_origins origin
      where origin.source_document_id = state.source_document_id
        and origin.configuration_version = state.configuration_version
        and origin.active
    )
    and not exists (
      select 1
      from public.source_monitor_jobs active_job
      where active_job.source_document_id = state.source_document_id
        and active_job.status in ('queued', 'running')
    )
  order by state.next_monitor_at, state.source_document_id
  limit target_batch_size
  on conflict do nothing;

  return query
  with candidates as (
    select
      queued.id,
      state.last_final_url,
      state.last_content_type,
      state.last_content_length_bytes,
      state.last_raw_hash,
      state.last_semantic_hash,
      state.last_etag,
      state.last_modified_header,
      state.normalization_algorithm_version
    from public.source_monitor_jobs queued
    join public.source_monitor_state state
      on state.source_document_id = queued.source_document_id
      and state.configuration_version = queued.configuration_version
    where queued.status = 'queued'
      and queued.scheduled_for <= now()
      and state.monitoring_enabled
    order by queued.scheduled_for, queued.created_at, queued.id
    for update of queued skip locked
    limit target_batch_size
  ), claimed as (
    update public.source_monitor_jobs job
    set status = 'running',
        attempt_count = job.attempt_count + 1,
        lease_token = gen_random_uuid(),
        lease_expires_at = now() + interval '4 minutes',
        started_at = now(),
        previous_final_url = candidates.last_final_url,
        previous_content_type = candidates.last_content_type,
        previous_content_length_bytes = candidates.last_content_length_bytes,
        previous_raw_hash = candidates.last_raw_hash,
        previous_semantic_hash = candidates.last_semantic_hash,
        previous_etag = candidates.last_etag,
        previous_last_modified_header = candidates.last_modified_header,
        previous_normalization_algorithm_version = candidates.normalization_algorithm_version
    from candidates
    where job.id = candidates.id
    returning job.*
  )
  select
    claimed.id,
    claimed.lease_token,
    source.id,
    source.canonical_url,
    array(
      select origin.hostname
      from public.source_monitor_origins origin
      where origin.source_document_id = source.id
        and origin.configuration_version = claimed.configuration_version
        and origin.active
      order by origin.hostname
    ),
    claimed.configuration_version,
    claimed.previous_final_url,
    claimed.previous_content_type,
    claimed.previous_content_length_bytes,
    claimed.previous_raw_hash,
    claimed.previous_semantic_hash,
    claimed.previous_etag,
    claimed.previous_last_modified_header,
    claimed.previous_normalization_algorithm_version
  from claimed
  join public.source_documents source
    on source.id = claimed.source_document_id;
end;
$$;

create function private.complete_source_monitor_job(
  target_job_id uuid,
  target_lease_token uuid,
  target_status public.source_monitor_job_status,
  target_http_status integer default null,
  target_final_url text default null,
  target_content_type text default null,
  target_content_length_bytes bigint default null,
  target_etag text default null,
  target_last_modified_header text default null,
  target_current_raw_hash text default null,
  target_current_semantic_hash text default null,
  target_normalization_algorithm_version text default null,
  target_validator_etag_sent boolean default false,
  target_validator_last_modified_sent boolean default false,
  target_error_code text default null,
  target_error_detail text default null
)
returns public.source_monitor_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_id_hint uuid;
  target_job public.source_monitor_jobs%rowtype;
  target_source public.source_documents%rowtype;
  target_state public.source_monitor_state%rowtype;
  derived_status public.source_monitor_job_status;
  normalized_final_url text;
  normalized_content_type text;
  normalized_content_length_bytes bigint;
  normalized_raw_hash text;
  normalized_semantic_hash text;
  normalized_etag text;
  normalized_last_modified_header text;
  normalized_algorithm_version text;
  final_authority text;
  completion_time timestamptz := now();
  impact_count integer := 0;
begin
  if not (select private.source_monitor_worker_authorized()) then
    raise exception 'Dedicated source monitor worker access required.'
      using errcode = '42501';
  end if;

  if target_job_id is null or target_lease_token is null or target_status is null then
    raise exception 'Job, lease, and terminal status are required.';
  end if;

  if target_validator_etag_sent is null
    or target_validator_last_modified_sent is null
  then
    raise exception 'Validator-sent flags must be true or false.';
  end if;

  select job.source_document_id
  into source_id_hint
  from public.source_monitor_jobs job
  where job.id = target_job_id;

  if not found then
    raise exception 'Source monitor job not found.';
  end if;

  -- Source -> state -> job is the universal mutation lock order.
  select * into target_source
  from public.source_documents source
  where source.id = source_id_hint
  for update;

  if not found then
    raise exception 'Monitored source document not found.';
  end if;

  select * into target_state
  from public.source_monitor_state state
  where state.source_document_id = source_id_hint
  for update;

  if not found then
    raise exception 'Source monitor state not found.';
  end if;

  select * into target_job
  from public.source_monitor_jobs job
  where job.id = target_job_id
  for update;

  -- The lease token doubles as the completion idempotency key. A retry after a
  -- successful commit returns the first durable result without applying state,
  -- impacts, backoff, or audit events a second time.
  if target_job.status not in ('queued', 'running')
    and target_job.completion_token is not distinct from target_lease_token
  then
    if target_job.status is distinct from target_status then
      raise exception 'Idempotent completion retry has a different terminal status.';
    end if;

    return target_job;
  end if;

  if target_job.status <> 'running'
    or target_job.lease_token is distinct from target_lease_token
    or target_job.lease_expires_at <= completion_time
  then
    raise exception 'Active source monitor lease not found.';
  end if;

  if not target_state.monitoring_enabled
    or target_job.configuration_version <> target_state.configuration_version
  then
    raise exception 'Source monitoring configuration changed before completion.';
  end if;

  if target_etag is not null
    and not (select private.valid_monitor_etag(target_etag))
  then
    raise exception 'ETag is not a bounded RFC-style entity tag.';
  end if;

  if target_last_modified_header is not null
    and not (select private.valid_monitor_http_date(target_last_modified_header))
  then
    raise exception 'Last-Modified must use IMF-fixdate format.';
  end if;

  if target_final_url is not null then
    final_authority := lower(
      split_part(
        split_part(
          split_part(
            split_part(target_final_url, '://', 2),
            '/',
            1
          ),
          '?',
          1
        ),
        '#',
        1
      )
    );

    if target_final_url !~ '^https://'
      or char_length(target_final_url) > 4096
      or final_authority like '%@%'
      or final_authority like '%:%'
      or not exists (
        select 1
        from public.source_monitor_origins origin
        where origin.source_document_id = target_source.id
          and origin.configuration_version = target_job.configuration_version
          and origin.hostname = final_authority
          and origin.active
      )
    then
      raise exception 'Final URL must use an approved exact HTTPS hostname.';
    end if;
  end if;

  if target_status in ('baseline', 'unchanged', 'changed') then
    if target_http_status = 200 then
      if target_final_url is null
        or target_content_type not in (
          'text/html',
          'application/xhtml+xml',
          'text/plain',
          'application/pdf'
        )
        or target_content_length_bytes is null
        or target_content_length_bytes not between 1 and 5242880
        or target_current_raw_hash is null
        or target_current_raw_hash !~ '^[a-f0-9]{64}$'
        or target_current_semantic_hash is null
        or target_current_semantic_hash !~ '^[a-f0-9]{64}$'
        or target_normalization_algorithm_version is null
        or target_normalization_algorithm_version !~ '^[a-z0-9]+(?:[._-][a-z0-9]+){0,7}$'
        or target_error_code is not null
        or target_error_detail is not null
        or (target_validator_etag_sent and target_job.previous_etag is null)
        or (
          target_validator_last_modified_sent
          and target_job.previous_last_modified_header is null
        )
      then
        raise exception 'HTTP 200 completion requires wholly new bounded response metadata, measured length, hashes, and normalization version.';
      end if;

      normalized_final_url := target_final_url;
      normalized_content_type := target_content_type;
      normalized_content_length_bytes := target_content_length_bytes;
      normalized_raw_hash := target_current_raw_hash;
      normalized_semantic_hash := target_current_semantic_hash;
      normalized_etag := target_etag;
      normalized_last_modified_header := target_last_modified_header;
      normalized_algorithm_version := target_normalization_algorithm_version;

      derived_status := case
        when target_job.previous_semantic_hash is null then 'baseline'
        when target_job.previous_final_url is distinct from normalized_final_url
          then 'changed'
        when target_job.previous_content_type is distinct from normalized_content_type
          then 'changed'
        when target_job.previous_normalization_algorithm_version
          is distinct from normalized_algorithm_version
          then 'changed'
        when target_job.previous_semantic_hash is distinct from normalized_semantic_hash
          then 'changed'
        else 'unchanged'
      end;
    elsif target_http_status = 304 then
      if target_status <> 'unchanged'
        or target_job.previous_final_url is null
        or target_job.previous_content_type is null
        or target_job.previous_content_length_bytes is null
        or target_job.previous_raw_hash is null
        or target_job.previous_semantic_hash is null
        or target_job.previous_normalization_algorithm_version is null
        or target_final_url is distinct from target_job.previous_final_url
        or not (target_validator_etag_sent or target_validator_last_modified_sent)
        or (target_validator_etag_sent and target_job.previous_etag is null)
        or (
          target_validator_last_modified_sent
          and target_job.previous_last_modified_header is null
        )
        or target_content_type is not null
        or target_content_length_bytes is not null
        or target_current_raw_hash is not null
        or target_current_semantic_hash is not null
        or target_normalization_algorithm_version is not null
        or target_error_code is not null
        or target_error_detail is not null
      then
        raise exception 'HTTP 304 is valid only for the exact prior final URL with a complete baseline and at least one recorded sent validator.';
      end if;

      normalized_final_url := target_job.previous_final_url;
      normalized_content_type := target_job.previous_content_type;
      normalized_content_length_bytes := target_job.previous_content_length_bytes;
      normalized_raw_hash := target_job.previous_raw_hash;
      normalized_semantic_hash := target_job.previous_semantic_hash;
      normalized_etag := coalesce(target_etag, target_job.previous_etag);
      normalized_last_modified_header := coalesce(
        target_last_modified_header,
        target_job.previous_last_modified_header
      );
      normalized_algorithm_version := target_job.previous_normalization_algorithm_version;
      derived_status := 'unchanged';
    else
      raise exception 'Successful completion requires HTTP 200 or a strictly validated HTTP 304.';
    end if;

    if target_status is distinct from derived_status then
      raise exception 'Monitor completion status does not match the database-derived baseline comparison.';
    end if;
  elsif target_status in ('blocked', 'unavailable', 'failed') then
    if target_error_code is null
      or char_length(target_error_code) not between 1 and 64
      or target_error_code !~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
      or target_error_detail is null
      or char_length(target_error_detail) not between 1 and 2000
      or target_content_type is not null
      or target_content_length_bytes is not null
      or target_etag is not null
      or target_last_modified_header is not null
      or target_current_raw_hash is not null
      or target_current_semantic_hash is not null
      or target_normalization_algorithm_version is not null
      or (target_validator_etag_sent and target_job.previous_etag is null)
      or (
        target_validator_last_modified_sent
        and target_job.previous_last_modified_header is null
      )
    then
      raise exception 'Failed completion requires only bounded diagnostic metadata; content fields and hashes must be absent.';
    end if;
  else
    raise exception 'A running source monitor job may complete only to a terminal status.';
  end if;

  update public.source_monitor_jobs
  set status = target_status,
      completed_at = completion_time,
      lease_token = null,
      lease_expires_at = null,
      completion_token = target_lease_token,
      http_status = target_http_status,
      final_url = target_final_url,
      content_type = normalized_content_type,
      content_length_bytes = normalized_content_length_bytes,
      etag = normalized_etag,
      last_modified_header = normalized_last_modified_header,
      current_raw_hash = normalized_raw_hash,
      current_semantic_hash = normalized_semantic_hash,
      current_normalization_algorithm_version = normalized_algorithm_version,
      validator_etag_sent = target_validator_etag_sent,
      validator_last_modified_sent = target_validator_last_modified_sent,
      error_code = target_error_code,
      error_detail = target_error_detail
  where id = target_job_id
  returning * into target_job;

  if target_status in ('baseline', 'unchanged', 'changed') then
    update public.source_monitor_state
    set next_monitor_at = completion_time + make_interval(hours => monitor_frequency_hours),
        last_success_at = completion_time,
        last_final_url = normalized_final_url,
        last_content_type = normalized_content_type,
        last_content_length_bytes = normalized_content_length_bytes,
        last_raw_hash = normalized_raw_hash,
        last_semantic_hash = normalized_semantic_hash,
        last_etag = normalized_etag,
        last_modified_header = normalized_last_modified_header,
        normalization_algorithm_version = normalized_algorithm_version,
        evidence_changed_at = case
          when target_status in ('baseline', 'changed') then completion_time
          else evidence_changed_at
        end,
        failure_review_required_at = null,
        consecutive_failures = 0
    where source_document_id = target_source.id;

    if target_status in ('baseline', 'changed') then
      -- Fail closed at the source level immediately. The impact rows below are
      -- a separate claim-level gate and survive later source re-verification.
      update public.source_documents
      set state = case
            when state = 'verified' then 'draft'::public.source_document_state
            else state
          end,
          last_checked_at = completion_time,
          review_due_at = least(coalesce(review_due_at, completion_time), completion_time)
      where id = target_source.id;

      insert into public.source_change_claim_impacts (
        source_monitor_job_id,
        source_document_id,
        claim_version_id,
        change_kind,
        detected_at,
        previous_final_url,
        current_final_url,
        previous_content_type,
        current_content_type,
        previous_semantic_hash,
        current_semantic_hash,
        previous_normalization_algorithm_version,
        current_normalization_algorithm_version,
        citation_ids,
        cited_snapshot_ids
      )
      select
        target_job.id,
        target_source.id,
        citation.claim_version_id,
        target_status,
        completion_time,
        target_job.previous_final_url,
        normalized_final_url,
        target_job.previous_content_type,
        normalized_content_type,
        target_job.previous_semantic_hash,
        normalized_semantic_hash,
        target_job.previous_normalization_algorithm_version,
        normalized_algorithm_version,
        array_agg(citation.id order by citation.id),
        coalesce(
          array_agg(citation.source_snapshot_id order by citation.source_snapshot_id)
            filter (where citation.source_snapshot_id is not null),
          '{}'::uuid[]
        )
      from public.claim_version_citations citation
      where citation.source_document_id = target_source.id
      group by citation.claim_version_id
      on conflict (source_monitor_job_id, claim_version_id) do nothing;

      get diagnostics impact_count = row_count;

      -- Draft/unreleased versions are also made due for editorial review. Rows
      -- in immutable release history are left untouched and blocked by impacts.
      update public.claim_versions version
      set review_due_at = least(coalesce(version.review_due_at, completion_time), completion_time)
      where exists (
        select 1
        from public.claim_version_citations citation
        where citation.claim_version_id = version.id
          and citation.source_document_id = target_source.id
      )
        and not exists (
          select 1
          from public.release_claim_versions release_item
          join public.country_releases release
            on release.id = release_item.release_id
          where release_item.claim_version_id = version.id
            and release.state in ('published', 'superseded', 'withdrawn')
        );

      insert into public.editorial_audit_events (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        after_data
      ) values (
        null,
        case
          when target_status = 'baseline'
            then 'source_monitor.baseline_requires_review'
          else 'source_monitor.semantic_or_provenance_change_detected'
        end,
        'source_document',
        target_source.id,
        jsonb_build_object(
          'jobId', target_job_id,
          'status', target_status,
          'evidenceChangedAt', completion_time,
          'previousFinalUrl', target_job.previous_final_url,
          'currentFinalUrl', normalized_final_url,
          'previousContentType', target_job.previous_content_type,
          'currentContentType', normalized_content_type,
          'previousSemanticHash', target_job.previous_semantic_hash,
          'currentSemanticHash', normalized_semantic_hash,
          'previousNormalizationVersion', target_job.previous_normalization_algorithm_version,
          'currentNormalizationVersion', normalized_algorithm_version,
          'affectedClaimVersionCount', impact_count
        )
      );
    else
      update public.source_documents
      set last_checked_at = completion_time
      where id = target_source.id;
    end if;
  else
    perform private.apply_source_monitor_failure(target_source.id, 1);
  end if;

  return target_job;
end;
$$;

-- Validate one exact professional decision dynamically. Credential status,
-- immutable verification scope, conflict disclosure, independent editorial
-- approval, and regulator evidence all remain live publication conditions.
create function private.professional_review_is_current_for_claim(
  target_review_id uuid,
  target_claim_version_id uuid,
  target_not_before timestamptz
)
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
    join public.editorial_reviews review
      on review.id = target_review_id
      and review.claim_version_id = version.id
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
    where version.id = target_claim_version_id
      and target_not_before is not null
      and assignment.assigned_at >= target_not_before
      and assignment.completed_at >= target_not_before
      and review.created_at >= target_not_before
      and credential.status = 'verified'
      and verification.review_due_at > now()
      and (verification.valid_from is null or verification.valid_from <= current_date)
      and (
        verification.issuer_attests_no_expiry
        or verification.expires_on >= current_date
      )
      and review.created_at >= version.updated_at
      and review.created_at >= credential.updated_at
      and review.created_at >= verification.verified_at
      and review.reviewer_id is distinct from version.authored_by
      and review.reviewer_id is distinct from claim.created_by
      and claim.category_id = any(verification.category_scope_ids)
      and claim.country_id = any(verification.country_scope_ids)
      and exists (
        select 1
        from public.source_documents evidence_source
        join public.source_snapshots evidence_snapshot
          on evidence_snapshot.id = verification.verification_source_snapshot_id
          and evidence_snapshot.source_document_id = evidence_source.id
        where evidence_source.id = verification.verification_source_document_id
          and evidence_source.state = 'verified'
          and evidence_source.review_due_at > now()
          and exists (
            select 1
            from public.editorial_reviews evidence_review
            where evidence_review.source_document_id = evidence_source.id
              and evidence_review.reviewed_snapshot_id = evidence_snapshot.id
              and evidence_review.review_kind = 'source_verification'
              and evidence_review.decision = 'approved'
              and evidence_review.created_at >= (
                select private.source_verification_required_at(evidence_source.id)
              )
              and evidence_review.reviewer_id is distinct from evidence_source.created_by
              and evidence_review.reviewer_id is distinct from verification.reviewer_user_id
              and evidence_review.reviewer_id is distinct from verification.verified_by
          )
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
          and editorial_review.created_at >= greatest(
            version.updated_at,
            claim.updated_at,
            category.updated_at
          )
          and editorial_review.reviewer_id is distinct from review.reviewer_id
      )
  );
$$;

create function private.source_change_impact_review_is_current(target_impact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.source_change_claim_impacts impact
    join public.claim_versions version on version.id = impact.claim_version_id
    join public.claims claim on claim.id = version.claim_id
    join public.claim_categories category on category.id = claim.category_id
    join lateral (
      select impact_review.*
      from public.source_change_claim_impact_reviews impact_review
      where impact_review.source_change_claim_impact_id = impact.id
      order by impact_review.created_at desc, impact_review.id desc
      limit 1
    ) latest_review on latest_review.decision = 'approved'
    join public.editorial_reviews source_review
      on source_review.id = latest_review.source_verification_review_id
      and source_review.source_document_id = impact.source_document_id
      and source_review.review_kind = 'source_verification'
      and source_review.decision = 'approved'
    join public.source_documents source
      on source.id = impact.source_document_id
      and source.state = 'verified'
      and source.review_due_at > now()
    join public.source_snapshots source_snapshot
      on source_snapshot.id = source_review.reviewed_snapshot_id
      and source_snapshot.source_document_id = source.id
    left join public.editorial_reviews professional_review
      on professional_review.id = latest_review.professional_review_id
    where impact.id = target_impact_id
      and version.workflow_state = 'approved'
      and version.review_due_at > now()
      and claim.suppressed_at is null
      and latest_review.created_at >= impact.detected_at
      and source_snapshot.captured_at >= impact.detected_at
      and source_review.created_at >= impact.detected_at
      and source_review.created_at >= (
        select private.source_verification_required_at(source.id)
      )
      and latest_review.reviewer_id is distinct from version.authored_by
      and latest_review.reviewer_id is distinct from claim.created_by
      and latest_review.reviewer_id is distinct from source.created_by
      and latest_review.reviewer_id is distinct from source_review.reviewer_id
      and source_review.reviewer_id is distinct from version.authored_by
      and source_review.reviewer_id is distinct from claim.created_by
      and source_review.reviewer_id is distinct from source.created_by
      and exists (
        select 1
        from public.editorial_reviews editorial_review
        where editorial_review.claim_version_id = version.id
          and editorial_review.review_kind = 'editorial'
          and editorial_review.decision = 'approved'
          and editorial_review.created_at >= version.updated_at
          and editorial_review.reviewer_id is distinct from latest_review.reviewer_id
          and editorial_review.reviewer_id is distinct from source_review.reviewer_id
      )
      and (
        (
          not (claim.requires_professional_review or category.requires_professional_review)
          and latest_review.professional_review_id is null
        )
        or (
          (claim.requires_professional_review or category.requires_professional_review)
          and latest_review.professional_review_id is not null
          and professional_review.claim_version_id = version.id
          and professional_review.review_kind = 'professional'
          and professional_review.decision = 'approved'
          and professional_review.created_at >= impact.detected_at
          and professional_review.reviewer_id is distinct from latest_review.reviewer_id
          and professional_review.reviewer_id is distinct from source_review.reviewer_id
          and professional_review.reviewer_id is distinct from source.created_by
          and private.professional_review_is_current_for_claim(
            professional_review.id,
            version.id,
            impact.detected_at
          )
        )
      )
  );
$$;

create function private.source_citation_is_current(
  target_claim_version_id uuid,
  target_source_document_id uuid,
  target_source_snapshot_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.source_documents source
    join public.source_snapshots snapshot
      on snapshot.id = target_source_snapshot_id
      and snapshot.source_document_id = source.id
    where source.id = target_source_document_id
      and source.state = 'verified'
      and source.review_due_at > now()
      and (
        exists (
          select 1
          from public.editorial_reviews source_review
          where source_review.source_document_id = source.id
            and source_review.reviewed_snapshot_id = snapshot.id
            and source_review.review_kind = 'source_verification'
            and source_review.decision = 'approved'
            and source_review.created_at >= (
              select private.source_verification_required_at(source.id)
            )
        )
        or exists (
          select 1
          from public.source_change_claim_impacts impact
          where impact.claim_version_id = target_claim_version_id
            and impact.source_document_id = source.id
            and private.source_change_impact_review_is_current(impact.id)
        )
      )
  );
$$;

-- Preserve the prior policy as the non-monitor base, then layer immutable
-- impacts over it. Existing helpers continue calling the original function
-- name and therefore receive the new fail-closed monitor gate.
alter function private.claim_version_meets_publication_policy(uuid)
rename to claim_version_meets_publication_policy_without_monitor_impacts;

create or replace function private.claim_version_meets_publication_policy_without_monitor_impacts(
  target_version_id uuid
)
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
          and editorial_review.created_at >= version.updated_at
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
          and private.source_citation_is_current(
            version.id,
            source.id,
            snapshot.id
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
            and official_source.authority_level in (
              'official_government',
              'embassy_consulate',
              'immigration_authority',
              'intergovernmental'
            )
            and private.source_citation_is_current(
              version.id,
              official_source.id,
              official_snapshot.id
            )
        )
      )
      and (
        not (claim.requires_professional_review or category.requires_professional_review)
        or private.claim_version_has_valid_professional_review(version.id)
      )
  );
$$;

create function private.claim_version_meets_publication_policy(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.claim_version_meets_publication_policy_without_monitor_impacts(
      target_version_id
    )
    and not exists (
      select 1
      from public.source_change_claim_impacts impact
      where impact.claim_version_id = target_version_id
        and not private.source_change_impact_review_is_current(impact.id)
    );
$$;

create function private.review_source_change_claim_impact(
  target_impact_id uuid,
  review_decision public.editorial_review_decision,
  target_source_verification_review_id uuid default null,
  target_professional_review_id uuid default null,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  source_id_hint uuid;
  target_impact public.source_change_claim_impacts%rowtype;
  impact_review_id uuid;
begin
  if (select auth.role()) = 'service_role'
    or actor is null
    or not (select private.has_staff_role(
      array['reviewer', 'publisher', 'admin']::public.staff_role[]
    ))
  then
    raise exception 'Reviewer access required.' using errcode = '42501';
  end if;

  if target_impact_id is null or review_decision is null then
    raise exception 'Impact and review decision are required.';
  end if;

  if review_notes is null
    or char_length(trim(review_notes)) not between 20 and 2000
  then
    raise exception 'Impact review notes must be between 20 and 2000 characters.';
  end if;

  if review_checklist is null or jsonb_typeof(review_checklist) <> 'object' then
    raise exception 'Impact review checklist must be a JSON object.';
  end if;

  if review_decision = 'approved' then
    if not (
      (select private.has_staff_role(
        array['publisher', 'admin']::public.staff_role[]
      ))
      and (select private.has_mfa())
    ) then
      raise exception 'Publisher access with MFA is required to approve a source-change impact.'
        using errcode = '42501';
    end if;

    if target_source_verification_review_id is null then
      raise exception 'An exact post-change source verification review is required.';
    end if;
  elsif target_source_verification_review_id is not null
    or target_professional_review_id is not null
  then
    raise exception 'Non-approval impact decisions cannot attach approval evidence.';
  end if;

  select impact.source_document_id
  into source_id_hint
  from public.source_change_claim_impacts impact
  where impact.id = target_impact_id;

  if not found then
    raise exception 'Source-change claim impact not found.';
  end if;

  -- Source -> impact is the mutation lock order for impact decisions.
  perform 1
  from public.source_documents source
  where source.id = source_id_hint
  for update;

  select *
  into target_impact
  from public.source_change_claim_impacts impact
  where impact.id = target_impact_id
  for update;

  insert into public.source_change_claim_impact_reviews (
    source_change_claim_impact_id,
    decision,
    source_verification_review_id,
    professional_review_id,
    checklist,
    notes,
    reviewer_id,
    created_at
  ) values (
    target_impact.id,
    review_decision,
    target_source_verification_review_id,
    target_professional_review_id,
    review_checklist,
    trim(review_notes),
    actor,
    clock_timestamp()
  ) returning id into impact_review_id;

  if review_decision = 'approved'
    and not (select private.source_change_impact_review_is_current(target_impact.id))
  then
    raise exception 'Impact approval must use exact, independent, current post-change source and professional evidence.';
  end if;

  insert into public.editorial_audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_data
  ) values (
    actor,
    'source_monitor.claim_impact_reviewed',
    'source_change_claim_impact',
    target_impact.id,
    jsonb_build_object(
      'impactReviewId', impact_review_id,
      'decision', review_decision,
      'sourceVerificationReviewId', target_source_verification_review_id,
      'professionalReviewId', target_professional_review_id,
      'detectedAt', target_impact.detected_at
    )
  );

  return impact_review_id;
end;
$$;

create function private.resolve_source_monitor_job(
  target_job_id uuid,
  target_resolution public.source_monitor_resolution,
  target_resolution_note text
)
returns public.source_monitor_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  source_id_hint uuid;
  target_source public.source_documents%rowtype;
  target_state public.source_monitor_state%rowtype;
  target_job public.source_monitor_jobs%rowtype;
begin
  if (select auth.role()) = 'service_role'
    or actor is null
    or not (
      (select private.has_staff_role(
        array['publisher', 'admin']::public.staff_role[]
      ))
      and (select private.has_mfa())
    )
  then
    raise exception 'Publisher access with MFA is required.' using errcode = '42501';
  end if;

  if target_job_id is null or target_resolution is null then
    raise exception 'Monitor job and resolution are required.';
  end if;

  if target_resolution_note is null
    or char_length(trim(target_resolution_note)) not between 10 and 2000
  then
    raise exception 'Resolution notes must be between 10 and 2000 characters.';
  end if;

  select job.source_document_id
  into source_id_hint
  from public.source_monitor_jobs job
  where job.id = target_job_id;

  if not found then
    raise exception 'Source monitor job not found.';
  end if;

  -- Source -> state -> job matches configuration, reaping, and completion.
  select * into target_source
  from public.source_documents source
  where source.id = source_id_hint
  for update;

  if not found then
    raise exception 'Monitored source document not found.';
  end if;

  select * into target_state
  from public.source_monitor_state state
  where state.source_document_id = source_id_hint
  for update;

  if not found then
    raise exception 'Source monitor state not found.';
  end if;

  select * into target_job
  from public.source_monitor_jobs job
  where job.id = target_job_id
  for update;

  if target_job.resolution is not null then
    if target_job.resolution = target_resolution
      and target_job.resolution_note = trim(target_resolution_note)
      and target_job.resolved_by = actor
    then
      return target_job;
    end if;

    raise exception 'Source monitor job already has an immutable resolution.';
  end if;

  if target_job.status in ('queued', 'running', 'unchanged') then
    raise exception 'Only a completed monitor exception or detected change may be resolved.';
  end if;

  if target_resolution = 'source_reverified' and not exists (
    select 1
    from public.editorial_reviews source_review
    join public.source_snapshots snapshot
      on snapshot.id = source_review.reviewed_snapshot_id
      and snapshot.source_document_id = target_source.id
    where source_review.source_document_id = target_source.id
      and source_review.review_kind = 'source_verification'
      and source_review.decision = 'approved'
      and target_source.state = 'verified'
      and target_source.review_due_at > now()
      and source_review.created_at >= target_job.completed_at
      and source_review.created_at >= (
        select private.source_verification_required_at(target_source.id)
      )
      and snapshot.captured_at >= target_job.completed_at
      and source_review.reviewer_id is distinct from target_source.created_by
      and source_review.reviewer_id is distinct from actor
  ) then
    raise exception 'Source re-verification resolution requires a current snapshot and independent review after this job completed.';
  end if;

  if target_resolution = 'source_superseded'
    and target_source.state <> 'superseded'
  then
    raise exception 'Source superseded resolution requires the source to be marked superseded.';
  end if;

  if target_resolution = 'monitoring_adjusted'
    and target_state.monitoring_enabled
    and target_state.configuration_version = target_job.configuration_version
  then
    raise exception 'Monitoring-adjusted resolution requires a disabled or newer monitoring configuration.';
  end if;

  update public.source_monitor_jobs
  set resolution = target_resolution,
      resolution_note = trim(target_resolution_note),
      resolved_by = actor,
      resolved_at = clock_timestamp()
  where id = target_job.id
  returning * into target_job;

  insert into public.editorial_audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_data
  ) values (
    actor,
    'source_monitor.job_resolved',
    'source_monitor_job',
    target_job.id,
    jsonb_build_object(
      'sourceDocumentId', target_source.id,
      'resolution', target_resolution,
      'note', trim(target_resolution_note),
      'claimImpactsUnaffected', true
    )
  );

  return target_job;
end;
$$;

create function public.configure_source_monitoring(
  target_source_document_id uuid,
  target_enabled boolean,
  target_frequency_hours integer,
  target_approved_hostnames text[]
)
returns public.source_monitor_state
language sql
security definer
set search_path = ''
as $$
  select private.configure_source_monitoring($1, $2, $3, $4);
$$;

create function public.review_source_change_claim_impact(
  target_impact_id uuid,
  review_decision public.editorial_review_decision,
  target_source_verification_review_id uuid default null,
  target_professional_review_id uuid default null,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.review_source_change_claim_impact($1, $2, $3, $4, $5, $6);
$$;

create function public.resolve_source_monitor_job(
  target_job_id uuid,
  target_resolution public.source_monitor_resolution,
  target_resolution_note text
)
returns public.source_monitor_jobs
language sql
security definer
set search_path = ''
as $$
  select private.resolve_source_monitor_job($1, $2, $3);
$$;

create function public.claim_source_monitor_jobs(target_batch_size integer default 5)
returns table (
  job_id uuid,
  lease_token uuid,
  source_document_id uuid,
  canonical_url text,
  approved_hostnames text[],
  configuration_version integer,
  previous_final_url text,
  previous_content_type text,
  previous_content_length_bytes bigint,
  previous_raw_hash text,
  previous_semantic_hash text,
  previous_etag text,
  previous_last_modified text,
  previous_normalization_algorithm_version text
)
language sql
security definer
set search_path = ''
as $$
  select * from private.claim_source_monitor_jobs($1);
$$;

create function public.complete_source_monitor_job(
  target_job_id uuid,
  target_lease_token uuid,
  target_status public.source_monitor_job_status,
  target_http_status integer default null,
  target_final_url text default null,
  target_content_type text default null,
  target_content_length_bytes bigint default null,
  target_etag text default null,
  target_last_modified_header text default null,
  target_current_raw_hash text default null,
  target_current_semantic_hash text default null,
  target_normalization_algorithm_version text default null,
  target_validator_etag_sent boolean default false,
  target_validator_last_modified_sent boolean default false,
  target_error_code text default null,
  target_error_detail text default null
)
returns public.source_monitor_jobs
language sql
security definer
set search_path = ''
as $$
  select private.complete_source_monitor_job(
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
  );
$$;

create index source_monitor_jobs_running_lease_idx
  on public.source_monitor_jobs (lease_expires_at, source_document_id)
  where status = 'running';

alter table public.source_monitor_state enable row level security;
alter table public.source_monitor_origins enable row level security;
alter table public.source_monitor_jobs enable row level security;
alter table public.source_change_claim_impacts enable row level security;
alter table public.source_change_claim_impact_reviews enable row level security;

revoke all on table
  public.source_monitor_state,
  public.source_monitor_origins,
  public.source_monitor_jobs,
  public.source_change_claim_impacts,
  public.source_change_claim_impact_reviews
from public, anon, authenticated, service_role, source_monitor_worker;

grant select on table
  public.source_monitor_state,
  public.source_monitor_origins,
  public.source_monitor_jobs,
  public.source_change_claim_impacts,
  public.source_change_claim_impact_reviews
to authenticated, service_role;

create policy source_monitor_state_staff_read
on public.source_monitor_state
for select
to authenticated
using ((select private.has_staff_role(
  array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]
)));

create policy source_monitor_origins_staff_read
on public.source_monitor_origins
for select
to authenticated
using ((select private.has_staff_role(
  array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]
)));

create policy source_monitor_jobs_staff_read
on public.source_monitor_jobs
for select
to authenticated
using ((select private.has_staff_role(
  array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]
)));

create policy source_change_claim_impacts_staff_read
on public.source_change_claim_impacts
for select
to authenticated
using ((select private.has_staff_role(
  array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]
)));

create policy source_change_claim_impact_reviews_staff_read
on public.source_change_claim_impact_reviews
for select
to authenticated
using ((select private.has_staff_role(
  array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]
)));

-- The custom PostgREST role can reach only the two public worker RPCs. It has
-- no table privileges and no review, resolution, configuration, or release RPC.
grant usage on schema public, private to source_monitor_worker;
grant usage on type public.source_monitor_job_status to source_monitor_worker;
grant usage on type public.source_monitor_job_status, public.source_monitor_resolution
to authenticated, service_role;

revoke all on function private.configure_source_monitoring(uuid, boolean, integer, text[])
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.claim_source_monitor_jobs(integer)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.complete_source_monitor_job(
  uuid, uuid, public.source_monitor_job_status, integer, text, text, bigint,
  text, text, text, text, text, boolean, boolean, text, text
)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.professional_review_is_current_for_claim(uuid, uuid, timestamptz)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.source_change_impact_review_is_current(uuid)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.source_citation_is_current(uuid, uuid, uuid)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.claim_version_meets_publication_policy_without_monitor_impacts(uuid)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.claim_version_meets_publication_policy(uuid)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.review_source_change_claim_impact(
  uuid, public.editorial_review_decision, uuid, uuid, text, jsonb
)
from public, anon, authenticated, service_role, source_monitor_worker;
revoke all on function private.resolve_source_monitor_job(
  uuid, public.source_monitor_resolution, text
)
from public, anon, authenticated, service_role, source_monitor_worker;

-- Public app RPCs retain their own authorization checks and are not available
-- to service_role or the network worker.
revoke all on function public.review_source_document(
  uuid, public.editorial_review_decision, text, jsonb
)
from public, anon, authenticated, service_role, source_monitor_worker;
grant execute on function public.review_source_document(
  uuid, public.editorial_review_decision, text, jsonb
)
to authenticated;

revoke all on function public.configure_source_monitoring(uuid, boolean, integer, text[])
from public, anon, authenticated, service_role, source_monitor_worker;
grant execute on function public.configure_source_monitoring(uuid, boolean, integer, text[])
to authenticated;

revoke all on function public.review_source_change_claim_impact(
  uuid, public.editorial_review_decision, uuid, uuid, text, jsonb
)
from public, anon, authenticated, service_role, source_monitor_worker;
grant execute on function public.review_source_change_claim_impact(
  uuid, public.editorial_review_decision, uuid, uuid, text, jsonb
)
to authenticated;

revoke all on function public.resolve_source_monitor_job(
  uuid, public.source_monitor_resolution, text
)
from public, anon, authenticated, service_role, source_monitor_worker;
grant execute on function public.resolve_source_monitor_job(
  uuid, public.source_monitor_resolution, text
)
to authenticated;

revoke all on function public.claim_source_monitor_jobs(integer)
from public, anon, authenticated, service_role, source_monitor_worker;
grant execute on function public.claim_source_monitor_jobs(integer)
to source_monitor_worker;

revoke all on function public.complete_source_monitor_job(
  uuid, uuid, public.source_monitor_job_status, integer, text, text, bigint,
  text, text, text, text, text, boolean, boolean, text, text
)
from public, anon, authenticated, service_role, source_monitor_worker;
grant execute on function public.complete_source_monitor_job(
  uuid, uuid, public.source_monitor_job_status, integer, text, text, bigint,
  text, text, text, text, text, boolean, boolean, text, text
)
to source_monitor_worker;

-- Public-read policy helpers are callable only by roles that already use them
-- through RLS; the non-monitor base remains private to the database owner.
grant execute on function private.claim_version_meets_publication_policy(uuid)
to anon, authenticated, service_role;

comment on function public.claim_source_monitor_jobs(integer) is
  'Worker-only leased queue claim. Returns bounded fetch instructions and the exact prior validator provenance.';
comment on function public.complete_source_monitor_job(
  uuid, uuid, public.source_monitor_job_status, integer, text, text, bigint,
  text, text, text, text, text, boolean, boolean, text, text
) is
  'Worker-only idempotent completion. Records bounded metadata/hashes and can only create fail-closed source impacts.';
comment on function public.review_source_change_claim_impact(
  uuid, public.editorial_review_decision, uuid, uuid, text, jsonb
) is
  'Human-only append-only claim-impact decision requiring exact post-change source and professional evidence.';
