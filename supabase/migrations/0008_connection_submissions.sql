-- =====================================================================
-- Plexus: player-suggested connections (migration 0008)
-- =====================================================================
-- "Submit a Connection" on the Systems page writes here. Suggestions are a
-- review queue only: nothing in this table is ever read by the app or served
-- as a puzzle. A suggestion can reach the library only after a person reviews
-- it for medical accuracy and ambiguity and adds it through the normal
-- library import (scripts/library), which this table is not part of.
--
-- Who can do what:
--   * Anyone using the app (signed in or not) can SUBMIT through the
--     submit_connection() function. Nobody can insert into the table directly.
--   * Nobody can READ, change or delete suggestions through the public API:
--     RLS is on with no policies. Review them in Supabase (Table Editor >
--     connection_submissions, or SQL Editor). A future moderation screen
--     should use a server-side role, never the browser's key.
--
-- Validation and abuse protection (in the function, so it cannot be skipped):
--   * title 3-120 characters; exactly four different concepts, 1-80 each;
--     explanation 20-1500; system from the list below or 'Other'; source
--     optional, at most 500
--   * the same four concepts (any order, any case) can be suggested once:
--     a repeat is refused as a duplicate
--   * at most 5 suggestions per browser and 5 per signed-in account per hour,
--     and 200 from everyone per hour
--
-- If a player deletes their account, their suggestions stay but the link to
-- the account is removed.
--
-- Run this in: Supabase Dashboard > SQL Editor > New query > paste > Run.
-- Safe to run more than once.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.connection_submissions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  title        text not null check (char_length(title) between 3 and 120),
  tiles        text[] not null check (cardinality(tiles) = 4),
  explanation  text not null check (char_length(explanation) between 20 and 1500),
  system       text not null check (char_length(system) <= 60),
  source       text check (source is null or char_length(source) <= 500),
  fingerprint  text not null,
  client_id    text check (client_id is null or char_length(client_id) <= 64),
  user_id      uuid references auth.users (id) on delete set null,
  app_version  text check (app_version is null or char_length(app_version) <= 60),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'duplicate', 'needs_changes')),
  review_note  text,
  reviewed_at  timestamptz
);

create unique index if not exists connection_submissions_fingerprint_key on public.connection_submissions (fingerprint);
create index if not exists connection_submissions_created_idx on public.connection_submissions (created_at desc);
create index if not exists connection_submissions_status_idx on public.connection_submissions (status, created_at desc);
create index if not exists connection_submissions_client_idx on public.connection_submissions (client_id, created_at desc);
create index if not exists connection_submissions_user_idx on public.connection_submissions (user_id, created_at desc);

alter table public.connection_submissions enable row level security;
revoke all on table public.connection_submissions from anon, authenticated;

-- Same four concepts in any order or case = same fingerprint.
create or replace function public.connection_fingerprint(p_tiles text[]) returns text
language sql immutable as $$
  select md5(string_agg(t, '|' order by t))
  from (select lower(regexp_replace(btrim(x), '\s+', ' ', 'g')) as t from unnest(p_tiles) as x) s
$$;

create or replace function public.submit_connection(
  p_title text,
  p_tiles text[],
  p_explanation text,
  p_system text,
  p_source text default null,
  p_client_id text default null,
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_expl text := btrim(coalesce(p_explanation, ''));
  v_source text := nullif(btrim(coalesce(p_source, '')), '');
  v_tiles text[];
  v_fp text;
  v_id uuid;
  -- The Systems subjects (src/data/library NEW_LIBRARY.subjects) plus 'Other'.
  v_systems text[] := array[
    'Cardiology','Pulmonary','Renal','Neurology','GI','Endocrine','Heme/Onc','MSK','Reproductive',
    'Psychiatry','Microbiology','Immunology','Dermatology','Pharmacology','Biochemistry/Genetics','Genetics','Other'];
begin
  select array_agg(regexp_replace(btrim(x), '\s+', ' ', 'g')) into v_tiles from unnest(coalesce(p_tiles, array[]::text[])) as x;
  if char_length(v_title) < 3 or char_length(v_title) > 120 then return jsonb_build_object('ok', false, 'reason', 'title'); end if;
  if v_tiles is null or cardinality(v_tiles) <> 4 then return jsonb_build_object('ok', false, 'reason', 'tiles'); end if;
  if exists (select 1 from unnest(v_tiles) t where char_length(t) < 1 or char_length(t) > 80) then return jsonb_build_object('ok', false, 'reason', 'tiles'); end if;
  if (select count(distinct lower(t)) from unnest(v_tiles) t) <> 4 then return jsonb_build_object('ok', false, 'reason', 'tiles-repeat'); end if;
  if char_length(v_expl) < 20 or char_length(v_expl) > 1500 then return jsonb_build_object('ok', false, 'reason', 'explanation'); end if;
  if p_system is null or not (p_system = any(v_systems)) then return jsonb_build_object('ok', false, 'reason', 'system'); end if;
  if v_source is not null and char_length(v_source) > 500 then return jsonb_build_object('ok', false, 'reason', 'source'); end if;

  if p_client_id is not null and (select count(*) from public.connection_submissions where client_id = p_client_id and created_at > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'rate');
  end if;
  if uid is not null and (select count(*) from public.connection_submissions where user_id = uid and created_at > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'rate');
  end if;
  if (select count(*) from public.connection_submissions where created_at > now() - interval '1 hour') >= 200 then
    return jsonb_build_object('ok', false, 'reason', 'rate');
  end if;

  v_fp := public.connection_fingerprint(v_tiles);
  begin
    insert into public.connection_submissions (title, tiles, explanation, system, source, fingerprint, client_id, user_id, app_version)
    values (v_title, v_tiles, v_expl, p_system, v_source, v_fp, left(p_client_id, 64), uid, left(p_app_version, 60))
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'duplicate');
  end;
  return jsonb_build_object('ok', true, 'id', v_id, 'status', 'pending');
end;
$$;

revoke all on function public.submit_connection(text, text[], text, text, text, text, text) from public;
grant execute on function public.submit_connection(text, text[], text, text, text, text, text) to anon, authenticated;
revoke all on function public.connection_fingerprint(text[]) from public, anon, authenticated;
