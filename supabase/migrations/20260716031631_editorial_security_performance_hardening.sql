-- Follow-up to the first advisor pass: keep privileged implementations out of
-- the exposed API schema, remove duplicate permissive policies, and cover FKs.

create policy email_subscribers_server_only
on public.email_subscribers
for all
to anon, authenticated
using (false)
with check (false);

grant usage on schema private to service_role;

alter function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb)
  set schema private;
alter function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb)
  set schema private;
alter function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb)
  set schema private;
alter function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb)
  set schema private;
alter function public.publish_country_release(uuid)
  set schema private;
alter function public.emergency_suppress_claim(uuid, text)
  set schema private;

create function public.review_source_document(
  target_source_document_id uuid,
  review_decision public.editorial_review_decision,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.review_source_document($1, $2, $3, $4);
$$;

create function public.review_claim_version(
  target_claim_version_id uuid,
  review_decision public.editorial_review_decision,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.review_claim_version($1, $2, $3, $4);
$$;

create function public.review_content_block_version(
  target_content_block_version_id uuid,
  review_decision public.editorial_review_decision,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.review_content_block_version($1, $2, $3, $4);
$$;

create function public.review_country_release(
  target_release_id uuid,
  review_decision public.editorial_review_decision,
  review_notes text default null,
  review_checklist jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.review_country_release($1, $2, $3, $4);
$$;

create function public.publish_country_release(target_release_id uuid)
returns public.country_releases
language sql
security invoker
set search_path = ''
as $$
  select private.publish_country_release($1);
$$;

create function public.emergency_suppress_claim(
  target_claim_id uuid,
  suppression_reason text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.emergency_suppress_claim($1, $2);
$$;

revoke all on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb) from public, anon;
revoke all on function public.publish_country_release(uuid) from public, anon;
revoke all on function public.emergency_suppress_claim(uuid, text) from public, anon;

grant execute on function public.review_source_document(uuid, public.editorial_review_decision, text, jsonb) to authenticated, service_role;
grant execute on function public.review_claim_version(uuid, public.editorial_review_decision, text, jsonb) to authenticated, service_role;
grant execute on function public.review_content_block_version(uuid, public.editorial_review_decision, text, jsonb) to authenticated, service_role;
grant execute on function public.review_country_release(uuid, public.editorial_review_decision, text, jsonb) to authenticated, service_role;
grant execute on function public.publish_country_release(uuid) to authenticated, service_role;
grant execute on function public.emergency_suppress_claim(uuid, text) to authenticated, service_role;

-- Anonymous users see released rows. Signed-in users see the same rows plus all
-- drafts when they have an active staff membership, expressed as one policy.
drop policy claim_categories_public_read on public.claim_categories;
drop policy claim_categories_staff_read on public.claim_categories;
create policy claim_categories_anon_read on public.claim_categories
for select to anon using (is_active);
create policy claim_categories_authenticated_read on public.claim_categories
for select to authenticated using (
  is_active or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy countries_public_read on public.countries;
drop policy countries_staff_read on public.countries;
create policy countries_anon_read on public.countries
for select to anon using (visibility in ('preview', 'published'));
create policy countries_authenticated_read on public.countries
for select to authenticated using (
  visibility in ('preview', 'published')
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy country_portals_public_read on public.country_portals;
drop policy country_portals_staff_read on public.country_portals;
create policy country_portals_anon_read on public.country_portals
for select to anon using (exists (
  select 1 from public.countries country
  where country.id = country_id and country.visibility in ('preview', 'published')
));
create policy country_portals_authenticated_read on public.country_portals
for select to authenticated using (
  exists (
    select 1 from public.countries country
    where country.id = country_id and country.visibility in ('preview', 'published')
  )
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy portal_sections_public_read on public.portal_sections;
drop policy portal_sections_staff_read on public.portal_sections;
create policy portal_sections_anon_read on public.portal_sections
for select to anon using (
  is_public and exists (
    select 1 from public.countries country
    where country.id = country_id and country.visibility in ('preview', 'published')
  )
);
create policy portal_sections_authenticated_read on public.portal_sections
for select to authenticated using (
  (
    is_public and exists (
      select 1 from public.countries country
      where country.id = country_id and country.visibility in ('preview', 'published')
    )
  )
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy source_documents_public_read on public.source_documents;
drop policy source_documents_staff_read on public.source_documents;
create policy source_documents_anon_read on public.source_documents
for select to anon using ((select private.source_document_is_public(id)));
create policy source_documents_authenticated_read on public.source_documents
for select to authenticated using (
  (select private.source_document_is_public(id))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy claims_public_read on public.claims;
drop policy claims_staff_read on public.claims;
create policy claims_anon_read on public.claims
for select to anon using ((select private.claim_is_public(id)));
create policy claims_authenticated_read on public.claims
for select to authenticated using (
  (select private.claim_is_public(id))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy claim_versions_public_read on public.claim_versions;
drop policy claim_versions_staff_read on public.claim_versions;
create policy claim_versions_anon_read on public.claim_versions
for select to anon using ((select private.claim_version_is_public(id)));
create policy claim_versions_authenticated_read on public.claim_versions
for select to authenticated using (
  (select private.claim_version_is_public(id))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy content_blocks_public_read on public.content_blocks;
drop policy content_blocks_staff_read on public.content_blocks;
create policy content_blocks_anon_read on public.content_blocks
for select to anon using ((select private.content_block_is_public(id)));
create policy content_blocks_authenticated_read on public.content_blocks
for select to authenticated using (
  (select private.content_block_is_public(id))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy content_block_versions_public_read on public.content_block_versions;
drop policy content_block_versions_staff_read on public.content_block_versions;
create policy content_block_versions_anon_read on public.content_block_versions
for select to anon using ((select private.content_block_version_is_public(id)));
create policy content_block_versions_authenticated_read on public.content_block_versions
for select to authenticated using (
  (select private.content_block_version_is_public(id))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy claim_version_citations_public_read on public.claim_version_citations;
drop policy claim_version_citations_staff_read on public.claim_version_citations;
create policy claim_version_citations_anon_read on public.claim_version_citations
for select to anon using ((select private.claim_version_is_public(claim_version_id)));
create policy claim_version_citations_authenticated_read on public.claim_version_citations
for select to authenticated using (
  (select private.claim_version_is_public(claim_version_id))
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy content_block_claims_public_read on public.content_block_claims;
drop policy content_block_claims_staff_read on public.content_block_claims;
create policy content_block_claims_anon_read on public.content_block_claims
for select to anon using (
  (select private.content_block_version_is_public(content_block_version_id))
  and (select private.claim_version_is_public(claim_version_id))
);
create policy content_block_claims_authenticated_read on public.content_block_claims
for select to authenticated using (
  (
    (select private.content_block_version_is_public(content_block_version_id))
    and (select private.claim_version_is_public(claim_version_id))
  )
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy country_releases_public_read on public.country_releases;
drop policy country_releases_staff_read on public.country_releases;
create policy country_releases_anon_read on public.country_releases
for select to anon using (state = 'published' and is_current);
create policy country_releases_authenticated_read on public.country_releases
for select to authenticated using (
  (state = 'published' and is_current)
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy release_claim_versions_public_read on public.release_claim_versions;
drop policy release_claim_versions_staff_read on public.release_claim_versions;
create policy release_claim_versions_anon_read on public.release_claim_versions
for select to anon using (exists (
  select 1 from public.country_releases release
  where release.id = release_id and release.state = 'published' and release.is_current
));
create policy release_claim_versions_authenticated_read on public.release_claim_versions
for select to authenticated using (
  exists (
    select 1 from public.country_releases release
    where release.id = release_id and release.state = 'published' and release.is_current
  )
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

drop policy release_block_versions_public_read on public.release_block_versions;
drop policy release_block_versions_staff_read on public.release_block_versions;
create policy release_block_versions_anon_read on public.release_block_versions
for select to anon using (exists (
  select 1 from public.country_releases release
  where release.id = release_id and release.state = 'published' and release.is_current
));
create policy release_block_versions_authenticated_read on public.release_block_versions
for select to authenticated using (
  exists (
    select 1 from public.country_releases release
    where release.id = release_id and release.state = 'published' and release.is_current
  )
  or (select private.has_staff_role(array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]))
);

create index claim_version_citations_created_by_idx on public.claim_version_citations (created_by);
create index claim_version_citations_source_document_idx on public.claim_version_citations (source_document_id);
create index claim_version_citations_source_snapshot_idx on public.claim_version_citations (source_snapshot_id);
create index claim_versions_authored_by_idx on public.claim_versions (authored_by);
create index claims_category_idx on public.claims (category_id);
create index claims_created_by_idx on public.claims (created_by);
create index claims_portal_section_idx on public.claims (portal_section_id);
create index content_block_claims_claim_version_idx on public.content_block_claims (claim_version_id);
create index content_block_versions_authored_by_idx on public.content_block_versions (authored_by);
create index content_blocks_created_by_idx on public.content_blocks (created_by);
create index content_blocks_portal_section_idx on public.content_blocks (portal_section_id);
create index country_releases_created_by_idx on public.country_releases (created_by);
create index country_releases_published_by_idx on public.country_releases (published_by);
create index editorial_audit_events_actor_idx on public.editorial_audit_events (actor_user_id);
create index editorial_reviews_block_version_idx on public.editorial_reviews (content_block_version_id);
create index editorial_reviews_reviewed_snapshot_idx on public.editorial_reviews (reviewed_snapshot_id);
create index editorial_reviews_reviewer_idx on public.editorial_reviews (reviewer_id);
create index outdated_reports_claim_idx on public.outdated_information_reports (claim_id);
create index outdated_reports_country_idx on public.outdated_information_reports (country_id);
create index outdated_reports_release_idx on public.outdated_information_reports (release_id);
create index outdated_reports_reporter_idx on public.outdated_information_reports (reporter_user_id);
create index outdated_reports_resolved_by_idx on public.outdated_information_reports (resolved_by);
create index release_block_versions_block_idx on public.release_block_versions (content_block_id);
create index release_block_versions_block_version_idx on public.release_block_versions (content_block_version_id);
create index release_block_versions_section_idx on public.release_block_versions (portal_section_id);
create index release_claim_versions_claim_idx on public.release_claim_versions (claim_id);
create index release_claim_versions_claim_version_idx on public.release_claim_versions (claim_version_id);
create index release_claim_versions_section_idx on public.release_claim_versions (portal_section_id);
create index source_documents_created_by_idx on public.source_documents (created_by);
create index source_snapshots_captured_by_idx on public.source_snapshots (captured_by);
create index staff_memberships_granted_by_idx on public.staff_memberships (granted_by);
