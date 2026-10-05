-- =====================================================================
-- Plexus — cloud player progress (migration 0003)
-- =====================================================================
-- Adds ONE table, user_progress, that stores each signed-in player's progress
-- snapshot (streaks, daily history, challenge bests) as a JSON blob — the
-- merged snapshot produced by src/utils/progressSync.js. This is all that the
-- "accounts + cloud streaks" feature needs. Requires 0001_library.sql to have
-- been run (it created the profiles table + the handle_new_user trigger that
-- makes a profile row for every new auth user).
--
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- You do NOT need to run 0002_daily_race.sql for this feature.
-- =====================================================================

create table if not exists public.user_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

-- A player can only ever see and change their OWN row.
drop policy if exists user_progress_select_own on public.user_progress;
create policy user_progress_select_own on public.user_progress
  for select using (user_id = auth.uid());

drop policy if exists user_progress_insert_own on public.user_progress;
create policy user_progress_insert_own on public.user_progress
  for insert with check (user_id = auth.uid());

drop policy if exists user_progress_update_own on public.user_progress;
create policy user_progress_update_own on public.user_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
