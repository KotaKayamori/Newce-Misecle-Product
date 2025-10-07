-- Reels feature schema: allowed_uploaders, videos, video_likes, user_profiles extension
-- Run in Supabase SQL Editor

-- 1) Upload allowlist
create table if not exists public.allowed_uploaders (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 2) Public videos (feed)
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  playback_url text not null,
  storage_path text not null,
  title text,
  caption text,
  created_at timestamptz default now()
);
create unique index if not exists uq_videos_storage_path on public.videos(storage_path);
create index if not exists idx_videos_created_at on public.videos(created_at desc);

alter table public.videos enable row level security;
drop policy if exists videos_public_select on public.videos;
create policy videos_public_select on public.videos for select using (true);
drop policy if exists videos_owner_insert on public.videos;
create policy videos_owner_insert on public.videos for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists videos_owner_update on public.videos;
create policy videos_owner_update on public.videos for update to authenticated using (owner_id = auth.uid());
drop policy if exists videos_owner_delete on public.videos;
create policy videos_owner_delete on public.videos for delete to authenticated using (owner_id = auth.uid());

-- 3) Likes
create table if not exists public.video_likes (
  id bigserial primary key,
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (video_id, user_id)
);
alter table public.video_likes enable row level security;
drop policy if exists video_likes_select on public.video_likes;
create policy video_likes_select on public.video_likes for select to authenticated using (true);
drop policy if exists video_likes_owner_insert on public.video_likes;
create policy video_likes_owner_insert on public.video_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists video_likes_owner_delete on public.video_likes;
create policy video_likes_owner_delete on public.video_likes for delete to authenticated using (user_id = auth.uid());

-- 4) Profiles extension (reuse user_profiles table)
alter table public.user_profiles add column if not exists username text unique;
alter table public.user_profiles add column if not exists display_name text;
alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles enable row level security;
drop policy if exists user_profiles_public_select on public.user_profiles;
create policy user_profiles_public_select on public.user_profiles for select using (true);
drop policy if exists user_profiles_owner_upsert on public.user_profiles;
create policy user_profiles_owner_upsert on public.user_profiles for update to authenticated using (id = auth.uid());

