-- =====================================================================
-- Plexus: privacy pass (0012) - deletion, retention, acceptance records
-- =====================================================================
-- Run after 0001-0011. Safe to run more than once.
--
-- 1. Profiles are private. 0001 let anyone read every profile, and new
--    profiles took a display name from the part of the email before the @.
--    Now each account reads only its own profile (admins can read all), new
--    profiles get no derived name, and names that were derived from an
--    email are cleared.
-- 2. Deleting an account (or a guest race ID) no longer deletes other
--    players' races. A match keeps its row when the player who opened it
--    leaves (created_by becomes null), and that player's ID is removed from
--    the other player's records (opponent, pair key, race events).
-- 3. Account deletion also handles what the 0004 cascade left behind:
--    the player's support messages are deleted; their connection reports
--    lose the reply email, browser ID and account link; suggestions that
--    were not accepted are deleted and accepted ones are unlinked (kept
--    under the submission license in the Terms).
-- 4. Terms acceptance records: which Terms and Privacy Policy version an
--    account agreed to and acknowledged, and when (server time). Written at
--    sign-up from the version the app sends, and again when someone accepts
--    an updated version.
-- 5. Submit a Connection records which submission terms were acknowledged.
-- 6. Retention: privacy_cleanup() applies the periods in privacy_settings.
--    It is scheduled daily with pg_cron when that extension is enabled
--    (Supabase Dashboard > Integrations > Cron). Without it, nothing runs on
--    its own: enable Cron and run this file again, or run
--    `select public.privacy_cleanup();` yourself.
-- =====================================================================

-- ---- 1. profiles ----
drop policy if exists profiles_select_all on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id = auth.uid() or public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_terms text := left(nullif(btrim(coalesce(new.raw_user_meta_data->>'terms_version', '')), ''), 40);
  v_privacy text := left(nullif(btrim(coalesce(new.raw_user_meta_data->>'privacy_version', '')), ''), 40);
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(nullif(btrim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''), 60))
  on conflict (id) do nothing;
  if v_terms is not null then
    insert into public.terms_acceptances (user_id, terms_version, privacy_version, source)
    values (new.id, v_terms, v_privacy, 'signup');
  end if;
  return new;
end;
$$;

-- Clear display names that 0001 copied from the email address.
update public.profiles p
   set display_name = null
  from auth.users u
 where u.id = p.id
   and p.display_name is not null
   and u.email is not null
   and p.display_name = split_part(u.email, '@', 1);

-- ---- 4. acceptance records ----
create table if not exists public.terms_acceptances (
  id              bigserial primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  terms_version   text not null check (char_length(terms_version) <= 40),
  privacy_version text check (privacy_version is null or char_length(privacy_version) <= 40),
  source          text not null check (source in ('signup', 'update')),
  accepted_at     timestamptz not null default now()
);
create index if not exists terms_acceptances_user_idx on public.terms_acceptances (user_id, accepted_at desc);
alter table public.terms_acceptances enable row level security;
revoke all on table public.terms_acceptances from anon, authenticated;
grant select on table public.terms_acceptances to authenticated;
drop policy if exists terms_acceptances_read_own on public.terms_acceptances;
create policy terms_acceptances_read_own on public.terms_acceptances for select using (user_id = auth.uid());

-- A signed-in (not guest) account records that it accepted these versions.
create or replace function public.record_terms_acceptance(p_terms_version text, p_privacy_version text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  v_terms text := left(nullif(btrim(coalesce(p_terms_version, '')), ''), 40);
  v_privacy text := left(nullif(btrim(coalesce(p_privacy_version, '')), ''), 40);
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'signed-out'); end if;
  if exists (select 1 from auth.users u where u.id = uid and coalesce(u.is_anonymous, false)) then
    return jsonb_build_object('ok', false, 'reason', 'guest');
  end if;
  if v_terms is null then return jsonb_build_object('ok', false, 'reason', 'version'); end if;
  if exists (select 1 from public.terms_acceptances where user_id = uid and terms_version = v_terms and coalesce(privacy_version, '') = coalesce(v_privacy, '')) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  insert into public.terms_acceptances (user_id, terms_version, privacy_version, source) values (uid, v_terms, v_privacy, 'update');
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.record_terms_acceptance(text, text) from public, anon;
grant execute on function public.record_terms_acceptance(text, text) to authenticated;

-- The latest versions this account accepted (for the app's update notice).
create or replace function public.my_terms_acceptance()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select jsonb_build_object('terms_version', terms_version, 'privacy_version', privacy_version, 'accepted_at', accepted_at)
      from public.terms_acceptances where user_id = auth.uid() order by accepted_at desc, id desc limit 1
  ), 'null'::jsonb)
$$;
revoke all on function public.my_terms_acceptance() from public, anon;
grant execute on function public.my_terms_acceptance() to authenticated;

-- ---- 2. matches survive the other player's deletion ----
alter table public.race_matches alter column created_by drop not null;
alter table public.race_matches drop constraint if exists race_matches_created_by_fkey;
alter table public.race_matches add constraint race_matches_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null;

-- Removes a user's ID from records that belong to other players. Called
-- before the user's auth row is deleted (account deletion, guest cleanup).
create or replace function public.privacy_scrub_user_refs(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then return; end if;
  update public.race_reward_log
     set opponent = null,
         pair_key = replace(pair_key, p_user::text, 'deleted')
   where opponent = p_user and user_id <> p_user;
  update public.race_events set from_user = null where from_user = p_user;
  update public.race_events set to_user = null where to_user = p_user;
end;
$$;
revoke all on function public.privacy_scrub_user_refs(uuid) from public, anon, authenticated;

-- ---- 5. submission acknowledgment ----
alter table public.connection_submissions add column if not exists terms_version text check (terms_version is null or char_length(terms_version) <= 40);

create or replace function public.submit_connection(
  p_title text,
  p_tiles text[],
  p_explanation text,
  p_system text,
  p_source text,
  p_client_id text,
  p_app_version text,
  p_terms_version text
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
  v_terms text := left(nullif(btrim(coalesce(p_terms_version, '')), ''), 40);
  v_tiles text[];
  v_fp text;
  v_id uuid;
  v_systems text[] := array[
    'Cardiology','Pulmonary','Renal','Neurology','GI','Endocrine','Heme/Onc','MSK','Reproductive',
    'Psychiatry','Microbiology','Immunology','Dermatology','Pharmacology','Biochemistry/Genetics','Genetics','Other'];
begin
  -- The contributor must have acknowledged the submission terms.
  if v_terms is null then return jsonb_build_object('ok', false, 'reason', 'terms'); end if;
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
    insert into public.connection_submissions (title, tiles, explanation, system, source, fingerprint, client_id, user_id, app_version, terms_version)
    values (v_title, v_tiles, v_expl, p_system, v_source, v_fp, left(p_client_id, 64), uid, left(p_app_version, 60), v_terms)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'duplicate');
  end;
  return jsonb_build_object('ok', true, 'id', v_id, 'status', 'pending');
end;
$$;
revoke all on function public.submit_connection(text, text[], text, text, text, text, text, text) from public;
grant execute on function public.submit_connection(text, text[], text, text, text, text, text, text) to anon, authenticated;

-- The 0008 version (no acknowledgment) now asks the app to update.
create or replace function public.submit_connection(
  p_title text, p_tiles text[], p_explanation text, p_system text,
  p_source text default null, p_client_id text default null, p_app_version text default null
)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('ok', false, 'reason', 'terms')
$$;
revoke all on function public.submit_connection(text, text[], text, text, text, text, text) from public;
grant execute on function public.submit_connection(text, text[], text, text, text, text, text) to anon, authenticated;

-- ---- 3. account deletion ----
-- privacy_delete_user does the work. Players reach it only through
-- delete_my_account (their own ID). The owner can run it in the SQL editor for
-- a request that cannot use the app (for example a child's account found by
-- its email): select public.privacy_delete_user((select id from auth.users where email = '...'));
create or replace function public.privacy_delete_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_user is null then
    raise exception 'no user';
  end if;
  -- Support messages are about the person: deleted.
  delete from public.reports where user_id = p_user and kind = 'support';
  -- Connection reports are about the content: kept without the reply
  -- email, browser ID or account link. Free text is kept as written.
  update public.reports set contact_email = null, client_id = null, user_id = null where user_id = p_user;
  -- Suggestions: deleted unless already accepted into the library; accepted
  -- ones stay under the submission license, unlinked.
  delete from public.connection_submissions where user_id = p_user and status <> 'accepted';
  update public.connection_submissions set user_id = null, client_id = null where user_id = p_user;
  -- Other players' race records keep their result but lose this ID.
  perform public.privacy_scrub_user_refs(p_user);
  -- The account itself; cascades to profile, progress, acceptance records,
  -- race participation, inventory, progress and reward logs.
  delete from auth.users where id = p_user;
end;
$$;
revoke all on function public.privacy_delete_user(uuid) from public, anon, authenticated;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  perform public.privacy_delete_user(uid);
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---- 6. retention ----
create table if not exists public.privacy_settings (
  key   text primary key,
  days  int  not null check (days >= 1),
  note  text
);
alter table public.privacy_settings enable row level security;
revoke all on table public.privacy_settings from anon, authenticated;
insert into public.privacy_settings (key, days, note) values
  ('guest_race_ids', 30, 'Guest race IDs with no race in this many days are deleted, with their race rows.'),
  ('race_details', 30, 'Per-round answers and in-race events are cleared this many days after a race ends.'),
  ('stale_lobbies', 7, 'Lobbies that never started are deleted after this many days.'),
  ('browser_ids', 7, 'The random browser ID on reports and suggestions (used only for rate limits) is cleared after this many days.'),
  ('report_emails', 365, 'Reply emails on connection reports are cleared after this many days.'),
  ('support_messages', 730, 'Support messages are deleted after this many days.'),
  ('closed_suggestions', 365, 'Suggestions that were rejected or duplicates are deleted this many days after they were sent.')
on conflict (key) do nothing;

create or replace function public.privacy_days(p_key text) returns int
language sql stable security definer set search_path = public as $$
  select days from public.privacy_settings where key = p_key
$$;
revoke all on function public.privacy_days(text) from public, anon, authenticated;

-- Applies every period above. Returns what it changed. Touches only rows
-- that match a rule, and never signed-in accounts.
create or replace function public.privacy_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_guest int := 0;
  v_details int := 0;
  v_events int := 0;
  v_lobbies int := 0;
  v_ids int := 0;
  v_emails int := 0;
  v_support int := 0;
  v_suggestions int := 0;
  g uuid;
  n int;
begin
  -- Guest race IDs: anonymous auth users, older than the period, with no race
  -- started in the period.
  for g in
    select u.id from auth.users u
     where coalesce(u.is_anonymous, false)
       and u.created_at < now() - make_interval(days => public.privacy_days('guest_race_ids'))
       and not exists (
         select 1 from public.race_participants p join public.race_matches m on m.id = p.match_id
          where p.user_id = u.id and m.created_at >= now() - make_interval(days => public.privacy_days('guest_race_ids')))
  loop
    perform public.privacy_scrub_user_refs(g);
    delete from auth.users where id = g and coalesce(is_anonymous, false);
    v_guest := v_guest + 1;
  end loop;

  -- Per-round answers and in-race events of races that ended.
  update public.race_participants p set answers = '{}'::jsonb
    from public.race_matches m
   where m.id = p.match_id and m.status in ('finished', 'abandoned')
     and coalesce(m.finished_at, m.created_at) < now() - make_interval(days => public.privacy_days('race_details'))
     and p.answers <> '{}'::jsonb;
  get diagnostics v_details = row_count;
  delete from public.race_events e using public.race_matches m
   where m.id = e.match_id and m.status in ('finished', 'abandoned')
     and coalesce(m.finished_at, m.created_at) < now() - make_interval(days => public.privacy_days('race_details'));
  get diagnostics v_events = row_count;

  -- Lobbies that never started (no results, no rewards).
  delete from public.race_matches m
   where m.status = 'lobby' and m.created_at < now() - make_interval(days => public.privacy_days('stale_lobbies'))
     and not exists (select 1 from public.race_reward_log l where l.match_id = m.id);
  get diagnostics v_lobbies = row_count;
  -- Matches nobody is left in (every player deleted).
  delete from public.race_matches m
   where m.status in ('finished', 'abandoned', 'lobby') and m.created_at < now() - make_interval(days => public.privacy_days('race_details'))
     and not exists (select 1 from public.race_participants p where p.match_id = m.id);
  get diagnostics n = row_count;
  v_lobbies := v_lobbies + n;

  -- Browser IDs (rate limits only need minutes).
  update public.reports set client_id = null
   where client_id is not null and created_at < now() - make_interval(days => public.privacy_days('browser_ids'));
  get diagnostics n = row_count;
  v_ids := n;
  update public.connection_submissions set client_id = null
   where client_id is not null and created_at < now() - make_interval(days => public.privacy_days('browser_ids'));
  get diagnostics n = row_count;
  v_ids := v_ids + n;

  -- Reply emails on connection reports.
  update public.reports set contact_email = null
   where kind = 'connection' and contact_email is not null
     and created_at < now() - make_interval(days => public.privacy_days('report_emails'));
  get diagnostics v_emails = row_count;

  -- Support messages.
  delete from public.reports
   where kind = 'support' and created_at < now() - make_interval(days => public.privacy_days('support_messages'));
  get diagnostics v_support = row_count;

  -- Closed suggestions.
  delete from public.connection_submissions
   where status in ('rejected', 'duplicate')
     and created_at < now() - make_interval(days => public.privacy_days('closed_suggestions'));
  get diagnostics v_suggestions = row_count;

  return jsonb_build_object('guest_ids', v_guest, 'race_answers', v_details, 'race_events', v_events, 'lobbies', v_lobbies,
    'browser_ids', v_ids, 'report_emails', v_emails, 'support_messages', v_support, 'suggestions', v_suggestions, 'ran_at', now());
end;
$$;
revoke all on function public.privacy_cleanup() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.privacy_cleanup() to service_role';
  end if;
end $$;

-- Daily schedule, when pg_cron is enabled. Re-running replaces the job.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('plexus-privacy-cleanup');
    exception when others then
      null;
    end;
    perform cron.schedule('plexus-privacy-cleanup', '17 10 * * *', 'select public.privacy_cleanup()');
  else
    raise notice 'pg_cron is not enabled: privacy_cleanup() is installed but not scheduled. Enable Cron in Supabase and run this file again.';
  end if;
end $$;
