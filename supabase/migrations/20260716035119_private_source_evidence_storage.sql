-- Retain exact reviewed evidence in a private, immutable storage workflow.
-- A hash alone proves equality only when the original material is still
-- available; this bucket makes source reviews reproducible later.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'source-evidence',
  'source-evidence',
  false,
  5242880,
  array['text/plain']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy source_evidence_staff_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'source-evidence'
  and (select private.has_staff_role(
    array['editor', 'reviewer', 'publisher', 'admin']::public.staff_role[]
  ))
);

create policy source_evidence_staff_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'source-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select private.has_staff_role(
    array['editor', 'publisher', 'admin']::public.staff_role[]
  ))
);

create policy source_evidence_owner_delete_orphan
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'source-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (select private.has_staff_role(
    array['editor', 'publisher', 'admin']::public.staff_role[]
  ))
  and not exists (
    select 1
    from public.source_snapshots snapshot
    where snapshot.storage_path = storage.objects.name
  )
);

alter table public.source_snapshots
  add constraint source_snapshots_sha256_hash_check
  check (content_hash ~ '^[0-9a-f]{64}$') not valid;

alter table public.source_snapshots
  add constraint source_snapshots_private_storage_path_check
  check (
    storage_path is not null
    and storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{64}[.]txt$'
  ) not valid;

alter table public.source_snapshots
  validate constraint source_snapshots_sha256_hash_check;

alter table public.source_snapshots
  validate constraint source_snapshots_private_storage_path_check;

comment on column public.source_snapshots.storage_path is
  'Required path in the private source-evidence bucket for the exact captured evidence.';
