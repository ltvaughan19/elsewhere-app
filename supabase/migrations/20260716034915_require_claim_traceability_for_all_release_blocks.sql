-- Content blocks are user-facing guidance, regardless of their risk label.
-- Require every block in a published release to trace to at least one claim
-- version pinned to that same release. The publication function then applies
-- the existing source-verification gate to every pinned claim version.

create function private.require_release_block_claim_traceability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.state = 'published' and exists (
    select 1
    from public.release_block_versions block_item
    where block_item.release_id = new.id
      and not exists (
        select 1
        from public.content_block_claims block_claim
        join public.release_claim_versions claim_item
          on claim_item.release_id = block_item.release_id
          and claim_item.claim_version_id = block_claim.claim_version_id
        where block_claim.content_block_version_id = block_item.content_block_version_id
      )
  ) then
    raise exception
      'Every released content block must reference a claim version pinned to the same release.';
  end if;

  return new;
end;
$$;

revoke all on function private.require_release_block_claim_traceability()
from public, anon, authenticated;

create trigger country_releases_require_block_claim_traceability
before insert or update of state on public.country_releases
for each row execute function private.require_release_block_claim_traceability();
