-- =====================================================================
-- Plexus: power-up rules, CRISPR level unlock, race link states (0009)
-- =====================================================================
-- Run after 0003 and 0006–0008. Safe to run more than once.
--
--   * Mutation lasts 10 seconds (race_config effect_ms). Immunity after an
--     effect stays 5 seconds, counted from the effect's end.
--   * CRISPR is a level reward, not a starter item:
--       - it unlocks at Level 12 (race_config crispr_unlock_level) and the
--         player receives one charge then, and one more every 4 levels after
--         (16, 20, 24 ...; crispr_level_every). Mutation stays the common
--         item (every 5 qualifying wins), so CRISPR is the rarer one;
--       - races no longer award CRISPR (the every-10-races grant is gone);
--       - the Chaos introductory loadout now gives a temporary Mutation only.
--         A player at Level 12 or above may also bring an earned CRISPR;
--       - equipping, arming and solo use all check the level on the server,
--         so no setting, loadout or default can bypass it.
--     The level is read from the player's synced progress (user_progress,
--     migration 0003) with the same curve as the app (progression/config.js
--     levelCost). Guests have no level and never get CRISPR.
--   * race_join tells a finished race apart from a missing one.
--   * race_use_solo spends one earned item in 3 Minutes (the app applies the
--     solo effect; see Challenge.jsx).
-- =====================================================================

insert into public.race_config (key, value) values
  ('crispr_unlock_level', 12),
  ('crispr_level_every', 4)
on conflict (key) do nothing;
update public.race_config set value = 10000 where key = 'effect_ms';

-- Level reward bookkeeping: one row per level reward given, so a reward is
-- never paid twice. Only the server reads or writes it.
create table if not exists public.race_level_grants (
  user_id    uuid not null references auth.users (id) on delete cascade,
  level      int  not null,
  item       text not null check (item in ('mutation','crispr')),
  granted_at timestamptz not null default now(),
  primary key (user_id, level, item)
);
alter table public.race_level_grants enable row level security;

-- The player's level from their synced XP (same curve as the app:
-- cost of level L = round((150 + 60n + 6n^2) / 10) * 10 with n = L - 1).
create or replace function public.race_player_level(p_user uuid) returns int
language plpgsql stable as $$
declare
  v_xp numeric := 0;
  v_level int := 1;
  v_start numeric := 0;
  v_cost numeric;
  n int;
begin
  if to_regclass('public.user_progress') is null then return 1; end if;
  execute $q$
    select coalesce(sum((e.value->>'xp')::numeric), 0)
      from public.user_progress up,
           jsonb_each(coalesce(up.data->'progression'->'ledger', '{}'::jsonb)) e
     where up.user_id = $1 and jsonb_typeof(e.value->'xp') = 'number'
  $q$ into v_xp using p_user;
  loop
    n := v_level - 1;
    v_cost := round((150 + 60 * n + 6 * n * n) / 10.0) * 10;
    exit when v_xp < v_start + v_cost or v_level >= 1000;
    v_start := v_start + v_cost;
    v_level := v_level + 1;
  end loop;
  return v_level;
end $$;

create or replace function public.race_crispr_unlocked(p_user uuid) returns boolean
language sql stable as $$
  select not exists (select 1 from auth.users u where u.id = p_user and coalesce(u.is_anonymous, false))
     and public.race_player_level(p_user) >= public.race_cfg('crispr_unlock_level')
$$;

-- Pay any CRISPR level rewards due (12, 16, 20 ...), each once.
create or replace function public.race_claim_level_items(p_user uuid) returns jsonb
language plpgsql as $$
declare
  v_level int;
  v_unlock int := public.race_cfg('crispr_unlock_level');
  v_every int := greatest(1, public.race_cfg('crispr_level_every')::int);
  v_out jsonb := '[]'::jsonb;
  l int;
begin
  if exists (select 1 from auth.users u where u.id = p_user and coalesce(u.is_anonymous, false)) then return v_out; end if;
  v_level := public.race_player_level(p_user);
  if v_level < v_unlock then return v_out; end if;
  perform pg_advisory_xact_lock(hashtext('race-level:' || p_user::text));
  l := v_unlock;
  while l <= v_level loop
    insert into public.race_level_grants (user_id, level, item) values (p_user, l, 'crispr') on conflict do nothing;
    if found then
      v_out := v_out || jsonb_build_object('item', 'crispr', 'level', l, 'as', public.race_grant(p_user, 'crispr'));
    end if;
    l := l + v_every;
  end loop;
  return v_out;
end $$;

-- ---- state: adds the CRISPR unlock level and each player's unlock ----
create or replace function public.race_state(p_user uuid, p_match uuid) returns jsonb
language plpgsql stable as $$
declare v jsonb;
begin
  if not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then
    return public.race_err('not-in-match');
  end if;
  select jsonb_build_object(
    'ok', true,
    'now', now(),
    'free_loadout', public.race_free_loadout(),
    'effect_ms', public.race_cfg('effect_ms'),
    'crispr_unlock_level', public.race_cfg('crispr_unlock_level'),
    'match', to_jsonb(m) - 'settled',
    'players', coalesce((select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'seat', p.seat, 'guest', p.guest, 'chaos_accepted', p.chaos_accepted,
        'equip_mutation', p.equip_mutation, 'equip_crispr', p.equip_crispr,
        'temp_mutation', p.temp_mutation, 'temp_crispr', p.temp_crispr,
        'crispr_armed', p.crispr_armed, 'crispr_spent', p.crispr_spent, 'mutation_spent', p.mutation_spent,
        'answered', p.answered, 'correct', p.correct, 'finished_at', p.finished_at, 'run_ms', p.run_ms,
        'last_seen', p.last_seen, 'left_at', p.left_at, 'qualified', p.qualified, 'outcome', p.outcome,
        'has_mutation', public.race_qty(p.user_id, 'mutation') > 0,
        'has_crispr', public.race_qty(p.user_id, 'crispr') > 0,
        'crispr_unlocked', not p.guest and public.race_crispr_unlocked(p.user_id)
      ) order by p.seat) from public.race_participants p where p.match_id = p_match), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from public.race_events e where e.match_id = p_match), '[]'::jsonb),
    'log', (select to_jsonb(l) from public.race_reward_log l where l.match_id = p_match and l.user_id = p_user)
  ) into v
  from public.race_matches m where m.id = p_match;
  return v;
end $$;

-- ---- join: a finished race is reported as finished ----
create or replace function public.race_join(p_user uuid, p_code text, p_tz text, p_guest boolean default false) returns jsonb
language plpgsql as $$
declare m public.race_matches; v_n int;
begin
  select * into m from public.race_matches where code = p_code and status in ('lobby','active') for update;
  if not found then
    if exists (select 1 from public.race_matches where code = p_code and status in ('finished','abandoned')) then
      return public.race_err('race-finished');
    end if;
    return public.race_err('no-such-race');
  end if;
  if exists (select 1 from public.race_participants where match_id = m.id and user_id = p_user) then
    return public.race_state(p_user, m.id); -- rejoin (reconnect)
  end if;
  if m.status <> 'lobby' then return public.race_err('already-started'); end if;
  select count(*) into v_n from public.race_participants where match_id = m.id;
  if v_n >= 2 then return public.race_err('race-full'); end if;
  insert into public.race_participants (match_id, user_id, seat, guest) values (m.id, p_user, 2, coalesce(p_guest, false));
  if not coalesce(p_guest, false) then perform public.race_note_tz(p_user, p_tz); end if;
  return public.race_state(p_user, m.id);
end $$;

-- ---- Chaos: temporary Mutation only; CRISPR needs the level and a charge ----
create or replace function public.race_accept_chaos(p_user uuid, p_match uuid, p_mutation boolean, p_crispr boolean) returns jsonb
language plpgsql as $$
declare
  m public.race_matches;
  v_free boolean := public.race_free_loadout();
  v_crispr boolean := coalesce(p_crispr, false);
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  if not m.chaos then return public.race_err('chaos-off'); end if;
  if v_crispr then
    if not public.race_crispr_unlocked(p_user) then return public.race_err('crispr-locked'); end if;
    perform public.race_claim_level_items(p_user);
    if public.race_qty(p_user, 'crispr') < 1 then return public.race_err('no-crispr'); end if;
  end if;
  if v_free then
    update public.race_participants set chaos_accepted = true, equip_mutation = false, equip_crispr = v_crispr, temp_mutation = true, temp_crispr = false
     where match_id = p_match and user_id = p_user;
    insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'accept', p_user, jsonb_build_object('mutation', true, 'crispr', v_crispr, 'temporary', true));
  else
    if p_mutation and public.race_qty(p_user, 'mutation') < 1 then return public.race_err('no-mutation'); end if;
    update public.race_participants set chaos_accepted = true, equip_mutation = p_mutation, equip_crispr = v_crispr, temp_mutation = false, temp_crispr = false
     where match_id = p_match and user_id = p_user;
    insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'accept', p_user, jsonb_build_object('mutation', p_mutation, 'crispr', v_crispr));
  end if;
  return public.race_state(p_user, p_match);
end $$;

-- ---- arm CRISPR: an earned one also needs the level ----
create or replace function public.race_arm(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare m public.race_matches; p public.race_participants;
begin
  select * into m from public.race_matches where id = p_match for update;
  select * into p from public.race_participants where match_id = p_match and user_id = p_user;
  if not found then return public.race_err('not-in-match'); end if;
  if m.status <> 'active' or not m.chaos then return public.race_err('not-available'); end if;
  if p.crispr_spent or not (p.temp_crispr or p.equip_crispr) then return public.race_err('not-equipped'); end if;
  if p.crispr_armed then return public.race_state(p_user, p_match); end if;
  if not p.temp_crispr then
    if not public.race_crispr_unlocked(p_user) then return public.race_err('crispr-locked'); end if;
    if public.race_qty(p_user, 'crispr') < 1 then return public.race_err('no-crispr'); end if;
  end if;
  update public.race_participants set crispr_armed = true where match_id = p_match and user_id = p_user;
  insert into public.race_events (match_id, kind, from_user) values (p_match, 'armed', p_user);
  return public.race_state(p_user, p_match);
end $$;

-- ---- rewards: races give Mutation only (CRISPR comes from levels) ----
create or replace function public.race_reward(p_match uuid, p_user uuid, p_opp uuid, p_outcome text, p_qual boolean, p_chaos boolean, p_tz text, p_now timestamptz) returns void
language plpgsql as $$
declare
  v_day date := (p_now at time zone public.race_valid_tz(p_tz))::date;
  v_pair text := least(p_user::text, p_opp::text) || ':' || greatest(p_user::text, p_opp::text);
  v_counted boolean := false;
  v_reason text;
  v_granted jsonb := '[]'::jsonb;
  pr public.race_progress;
begin
  if exists (select 1 from public.race_reward_log where match_id = p_match and user_id = p_user) then return; end if;
  if exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user and guest) then
    insert into public.race_reward_log (match_id, user_id, opponent, pair_key, reward_day, chaos, outcome, qualified, counted, reason, granted)
    values (p_match, p_user, p_opp, v_pair, v_day, p_chaos, p_outcome, false, false, 'guest', '[]'::jsonb);
    return;
  end if;
  insert into public.race_progress (user_id) values (p_user) on conflict do nothing;
  if p_outcome in ('win','lose','tie') then
    if p_chaos then
      update public.race_progress set chaos_races = chaos_races + 1, chaos_wins = chaos_wins + (p_outcome = 'win')::int where user_id = p_user;
    else
      update public.race_progress set standard_races = standard_races + 1, standard_wins = standard_wins + (p_outcome = 'win')::int where user_id = p_user;
    end if;
  end if;
  perform pg_advisory_xact_lock(hashtext('race-reward:' || p_user::text));
  if not p_qual then
    v_reason := case
      when p_outcome = 'abandoned' then 'abandoned'
      when p_outcome is null then 'opponent-left'
      when exists (select 1 from public.race_participants where match_id = p_match and user_id = p_opp and guest) then 'opponent-guest'
      else 'not-qualifying' end;
  elsif (select count(*) from public.race_reward_log where user_id = p_user and reward_day = v_day and counted) >= public.race_cfg('per_day') then
    v_reason := 'daily-limit';
  elsif (select count(*) from public.race_reward_log where user_id = p_user and reward_day = v_day and pair_key = v_pair and counted) >= public.race_cfg('per_opponent_per_day') then
    v_reason := 'opponent-limit';
  else
    v_counted := true;
    update public.race_progress
       set qualifying_races = qualifying_races + 1,
           qualifying_wins = qualifying_wins + (p_outcome = 'win')::int
     where user_id = p_user returning * into pr;
    if p_outcome = 'win' and pr.qualifying_wins % public.race_cfg('mutation_every_wins') = 0 then
      v_granted := v_granted || jsonb_build_object('item', 'mutation', 'as', public.race_grant(p_user, 'mutation'));
    end if;
  end if;
  insert into public.race_reward_log (match_id, user_id, opponent, pair_key, reward_day, chaos, outcome, qualified, counted, reason, granted)
  values (p_match, p_user, p_opp, v_pair, v_day, p_chaos, p_outcome, p_qual, v_counted, v_reason, v_granted);
end $$;

-- ---- me: pays due level rewards, then reports level and the unlock ----
drop function if exists public.race_me(uuid, text);
create or replace function public.race_me(p_user uuid, p_tz text) returns jsonb
language plpgsql as $$
declare
  v_day date := (now() at time zone public.race_user_zone(p_user))::date;
  v_claimed jsonb := public.race_claim_level_items(p_user);
  v_level int := public.race_player_level(p_user);
  v_unlock int := public.race_cfg('crispr_unlock_level');
  v_every int := greatest(1, public.race_cfg('crispr_level_every')::int);
begin
  return jsonb_build_object(
    'ok', true,
    'level', v_level,
    'crisprUnlockLevel', v_unlock,
    'crisprUnlocked', public.race_crispr_unlocked(p_user),
    'nextCrisprLevel', case when v_level < v_unlock then v_unlock else v_unlock + ((v_level - v_unlock) / v_every + 1) * v_every end,
    'claimed', v_claimed,
    'effectMs', public.race_cfg('effect_ms'),
    'inventory', jsonb_build_object('mutation', public.race_qty(p_user, 'mutation'), 'crispr', public.race_qty(p_user, 'crispr')),
    'pending', jsonb_build_object(
      'mutation', coalesce((select pending from public.race_inventory where user_id = p_user and item = 'mutation'), 0),
      'crispr', coalesce((select pending from public.race_inventory where user_id = p_user and item = 'crispr'), 0)),
    'progress', coalesce((select jsonb_build_object(
        'qualifyingWins', qualifying_wins, 'qualifyingRaces', qualifying_races,
        'standardRaces', standard_races, 'standardWins', standard_wins,
        'chaosRaces', chaos_races, 'chaosWins', chaos_wins)
      from public.race_progress where user_id = p_user), jsonb_build_object('qualifyingWins', 0, 'qualifyingRaces', 0, 'standardRaces', 0, 'standardWins', 0, 'chaosRaces', 0, 'chaosWins', 0)),
    'today', jsonb_build_object('counted', (select count(*) from public.race_reward_log where user_id = p_user and reward_day = v_day and counted), 'limit', public.race_cfg('per_day'))
  );
end $$;

-- ---- 3 Minutes: spend one earned item for a solo effect ----
-- Same inventory and the same CRISPR unlock as Race. The app applies the
-- solo version of the effect for effect_ms (Challenge.jsx).
create or replace function public.race_use_solo(p_user uuid, p_item text) returns jsonb
language plpgsql as $$
begin
  if p_item not in ('mutation','crispr') then return public.race_err('bad-item'); end if;
  if exists (select 1 from auth.users u where u.id = p_user and coalesce(u.is_anonymous, false)) then return public.race_err('guest'); end if;
  if p_item = 'crispr' then
    if not public.race_crispr_unlocked(p_user) then return public.race_err('crispr-locked'); end if;
    perform public.race_claim_level_items(p_user);
  end if;
  if not public.race_consume(p_user, p_item) then return public.race_err('no-' || p_item); end if;
  return jsonb_build_object('ok', true, 'item', p_item, 'effectMs', public.race_cfg('effect_ms'),
    'inventory', jsonb_build_object('mutation', public.race_qty(p_user, 'mutation'), 'crispr', public.race_qty(p_user, 'crispr')));
end $$;

-- ---- only the server may call these ----
do $$
declare f text;
begin
  foreach f in array array[
    'race_player_level(uuid)', 'race_crispr_unlocked(uuid)', 'race_claim_level_items(uuid)',
    'race_state(uuid,uuid)', 'race_join(uuid,text,text,boolean)', 'race_accept_chaos(uuid,uuid,boolean,boolean)',
    'race_arm(uuid,uuid)', 'race_reward(uuid,uuid,uuid,text,boolean,boolean,text,timestamptz)',
    'race_me(uuid,text)', 'race_use_solo(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end $$;
