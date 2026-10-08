-- =====================================================================
-- Plexus: content reports and support messages (migration 0005)
-- =====================================================================
-- "Report this connection" and the Help & Support form write here.
--
-- Who can do what:
--   • Anyone using the app (signed in or not) can SUBMIT through the
--     submit_report() function. They cannot insert into the table directly.
--   • Nobody can READ, change or delete reports through the public API.
--     There are no RLS policies on the table, so the anon and authenticated
--     roles see nothing. You read them in Supabase: Table Editor > reports,
--     or SQL Editor (`select * from public.reports order by created_at desc`).
--
-- Validation and abuse protection (in the function, so it cannot be skipped):
--   • reason, kind and game mode must be one of the known values
--   • description 5 to 2000 characters, email optional and well-formed,
--     every other field length-limited, at most 8 tiles
--   • at most 5 reports per browser (client id) and 5 per signed-in account
--     in any 10 minutes, and at most 300 from everyone in 10 minutes
--
-- If a player deletes their account, their reports stay (they are about the
-- content, not the person) but the link to the account is removed.
--
-- Run this in: Supabase Dashboard > SQL Editor > New query > paste > Run.
-- Safe to run more than once.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  kind             text not null check (kind in ('connection', 'support')),
  reason           text not null check (reason in ('medical', 'ambiguous', 'typo', 'technical', 'other', 'account', 'feedback')),
  description      text not null check (char_length(description) between 5 and 2000),
  contact_email    text check (contact_email is null or (char_length(contact_email) <= 254 and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$')),
  puzzle_id        text check (puzzle_id is null or char_length(puzzle_id) <= 120),
  category_id      text check (category_id is null or char_length(category_id) <= 200),
  connection_title text check (connection_title is null or char_length(connection_title) <= 300),
  tiles            text[] check (tiles is null or cardinality(tiles) <= 8),
  game_mode        text check (game_mode is null or game_mode in ('daily', 'archive', 'system', 'challenge', 'race')),
  puzzle_date      date,
  app_version      text check (app_version is null or char_length(app_version) <= 60),
  client_id        text check (client_id is null or char_length(client_id) <= 64),
  user_id          uuid references auth.users (id) on delete set null,
  status           text not null default 'new' check (status in ('new', 'reviewed', 'fixed', 'dismissed'))
);

create index if not exists reports_created_idx on public.reports (created_at desc);
create index if not exists reports_client_recent_idx on public.reports (client_id, created_at desc);
create index if not exists reports_user_recent_idx on public.reports (user_id, created_at desc);
create index if not exists reports_category_idx on public.reports (category_id);

-- Row Level Security on, and no policies: the public API cannot read or write.
alter table public.reports enable row level security;
revoke all on table public.reports from anon, authenticated;

create or replace function public.submit_report(
  p_kind text,
  p_reason text,
  p_description text,
  p_contact_email text default null,
  p_puzzle_id text default null,
  p_category_id text default null,
  p_connection_title text default null,
  p_tiles text[] default null,
  p_game_mode text default null,
  p_puzzle_date date default null,
  p_app_version text default null,
  p_client_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  descr text := btrim(coalesce(p_description, ''));
  mail text := nullif(btrim(coalesce(p_contact_email, '')), '');
begin
  if p_kind not in ('connection', 'support') then raise exception 'invalid kind'; end if;
  if p_kind = 'connection' and p_reason not in ('medical', 'ambiguous', 'typo', 'technical', 'other') then raise exception 'invalid reason'; end if;
  if p_kind = 'support' and p_reason not in ('technical', 'account', 'feedback', 'other') then raise exception 'invalid reason'; end if;
  if char_length(descr) < 5 or char_length(descr) > 2000 then raise exception 'invalid description'; end if;
  if p_kind = 'connection' and (p_puzzle_id is null or p_connection_title is null) then raise exception 'missing connection'; end if;

  -- Rate limits.
  if p_client_id is not null and (select count(*) from public.reports where client_id = p_client_id and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'rate limit: too many reports';
  end if;
  if uid is not null and (select count(*) from public.reports where user_id = uid and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'rate limit: too many reports';
  end if;
  if (select count(*) from public.reports where created_at > now() - interval '10 minutes') >= 300 then
    raise exception 'rate limit: too many reports';
  end if;

  insert into public.reports (kind, reason, description, contact_email, puzzle_id, category_id, connection_title, tiles, game_mode, puzzle_date, app_version, client_id, user_id)
  values (p_kind, p_reason, descr, mail, left(p_puzzle_id, 120), left(p_category_id, 200), left(p_connection_title, 300), p_tiles[1:8], p_game_mode, p_puzzle_date, left(p_app_version, 60), left(p_client_id, 64), uid)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.submit_report(text, text, text, text, text, text, text, text[], text, date, text, text) from public;
grant execute on function public.submit_report(text, text, text, text, text, text, text, text[], text, date, text, text) to anon, authenticated;
