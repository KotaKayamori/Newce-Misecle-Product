-- Create user_videos table to store uploaded video metadata
-- Run this in Supabase SQL Editor (or supabase CLI)

-- 1) Table
create table if not exists public.user_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path text not null,
  public_url text not null,
  content_type text,
  size bigint,
  created_at timestamptz default now()
);

-- Optional metadata columns (idempotent)
alter table public.user_videos add column if not exists title text;
alter table public.user_videos add column if not exists description text;

-- 2) RLS
alter table public.user_videos enable row level security;

-- 3) Policies (owner-only)
drop policy if exists "uv-owner-select" on public.user_videos;
create policy "uv-owner-select"
on public.user_videos for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "uv-owner-insert" on public.user_videos;
create policy "uv-owner-insert"
on public.user_videos for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "uv-owner-update" on public.user_videos;
create policy "uv-owner-update"
on public.user_videos for update
to authenticated
using (user_id = auth.uid());

drop policy if exists "uv-owner-delete" on public.user_videos;
create policy "uv-owner-delete"
on public.user_videos for delete
to authenticated
using (user_id = auth.uid());
