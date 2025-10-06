-- Supabase Storage initial setup for Misecle videos
-- Usage: Run in Supabase SQL Editor (or supabase CLI) on your project.

-- 1) Ensure RLS is enabled on storage.objects
alter table storage.objects enable row level security;

-- 2) Create public bucket `videos` if it does not exist
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- 3) Row Level Security policies
-- Policy model: allow authenticated users to insert/update/delete ONLY under
--               their own top-level folder: videos/{auth.uid()}/...
-- SELECT policy is intentionally omitted for now because public playback
-- uses the public URL and does not go through RLS. Add SELECT later only if
-- you need to list objects via the Storage API.

-- INSERT: allow put into own folder only
drop policy if exists "videos-owner-insert" on storage.objects;
create policy "videos-owner-insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: allow updating own folder only
drop policy if exists "videos-owner-update" on storage.objects;
create policy "videos-owner-update"
on storage.objects for update to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: allow deleting own folder only
drop policy if exists "videos-owner-delete" on storage.objects;
create policy "videos-owner-delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Optional: add SELECT policy ONLY if you need to list objects via API
-- drop policy if exists "videos-owner-select" on storage.objects;
-- create policy "videos-owner-select"
-- on storage.objects for select to authenticated
-- using (
--   bucket_id = 'videos'
--   and (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Notes
-- - Path convention (recommended): videos/{user_id}/{yyyy}/{mm}/{uuid}.{ext}
-- - Keep cacheControl long-lived (e.g. 31536000) and do NOT upsert; upload a
--   new path for updates to avoid cache invalidation issues.

