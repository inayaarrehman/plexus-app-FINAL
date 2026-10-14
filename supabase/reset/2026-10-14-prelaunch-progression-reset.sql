-- =====================================================================
-- Plexus: prelaunch reset of Race rewards and synced progress (2026-10-14)
-- =====================================================================
-- PRELAUNCH ONLY. Run once in the Supabase SQL editor, AFTER migration 0010,
-- while you are the only player. It resets every account, not just one.
--
-- 1. Backup (the restorable checkpoint): copies every affected table into
--    tables named backup_20261014_<table>. Nothing is deleted before the
--    copies exist; the whole script runs as one transaction.
-- 2. Reset: clears test races, Race inventories, Race progress, reward logs,
--    level reward bookkeeping and the cloud copy of progress. Accounts,
--    profiles, reports and submissions are untouched, so you stay signed in
--    and the account keeps working. Your devices clear their own saved
--    progress the first time they load this build (the progress epoch in
--    src/utils/contentEpoch.js), and the next sync writes a fresh cloud copy.
--
-- To restore instead (only if you need the old data back), see the RESTORE
-- block at the end.
-- =====================================================================
begin;

create table if not exists public.backup_20261014_user_progress as table public.user_progress;
create table if not exists public.backup_20261014_race_inventory as table public.race_inventory;
create table if not exists public.backup_20261014_race_progress as table public.race_progress;
create table if not exists public.backup_20261014_race_reward_log as table public.race_reward_log;
create table if not exists public.backup_20261014_race_level_grants as table public.race_level_grants;
create table if not exists public.backup_20261014_race_matches as table public.race_matches;
create table if not exists public.backup_20261014_race_participants as table public.race_participants;

-- Backups are private: no one but the database owner can read them.
alter table public.backup_20261014_user_progress enable row level security;
alter table public.backup_20261014_race_inventory enable row level security;
alter table public.backup_20261014_race_progress enable row level security;
alter table public.backup_20261014_race_reward_log enable row level security;
alter table public.backup_20261014_race_level_grants enable row level security;
alter table public.backup_20261014_race_matches enable row level security;
alter table public.backup_20261014_race_participants enable row level security;

-- Reset. race_matches cascades to participants, events and reward logs.
truncate public.race_matches cascade;
truncate public.race_inventory, public.race_progress, public.race_level_grants;
delete from public.user_progress;

commit;

-- Check: every count below should be 0.
select (select count(*) from public.race_matches) as matches,
       (select count(*) from public.race_inventory) as inventory,
       (select count(*) from public.race_reward_log) as reward_log,
       (select count(*) from public.user_progress) as cloud_progress;

-- ---- RESTORE (run only to undo the reset) ----
-- begin;
-- insert into public.race_matches select * from public.backup_20261014_race_matches on conflict do nothing;
-- insert into public.race_participants select * from public.backup_20261014_race_participants on conflict do nothing;
-- insert into public.race_inventory select * from public.backup_20261014_race_inventory on conflict do nothing;
-- insert into public.race_progress select * from public.backup_20261014_race_progress on conflict do nothing;
-- insert into public.race_reward_log select * from public.backup_20261014_race_reward_log on conflict do nothing;
-- insert into public.race_level_grants select * from public.backup_20261014_race_level_grants on conflict do nothing;
-- insert into public.user_progress select * from public.backup_20261014_user_progress on conflict do nothing;
-- commit;
