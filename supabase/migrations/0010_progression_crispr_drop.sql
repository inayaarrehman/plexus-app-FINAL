-- =====================================================================
-- Plexus: trusted level, CRISPR unlock, CRISPR drop after Race wins (0010)
-- =====================================================================
-- Run after 0001-0009. Safe to run more than once.
--
--   * Level curve: the app's new curve (progression/config.js levelCost):
--     cost of level L = round((100 + 70n + 6n^2) / 10) * 10, n = L - 1.
--     The numbers live in race_config (level_base, level_linear,
--     level_square) so the two can be kept in step.
--   * Trusted level. XP is recorded by the app and synced to user_progress,
--     which the player's own browser writes. Before the server uses that XP
--     for anything it hands out (CRISPR), it now ignores entries dated in
--     the future or before the account existed, caps a single entry at
--     trusted_xp_max_entry and a single day at trusted_xp_per_day. A save
--     edited by hand can therefore move a level no faster than real play.
--   * CRISPR unlock: Level 12 (crispr_unlock_level) AND at least
--     crispr_unlock_races races that counted toward Race rewards (server
--     records only). Both are needed for the level charges (12, 16, 20 ...)
--     and for the drop below.
--   * CRISPR drop: after an eligible Race win the server rolls once, with
--     probability crispr_drop_chance (0.02), for one CRISPR. Eligible win:
--       - the race was settled as finished (not abandoned) and qualified
--         (both players distinct signed-in accounts, every round answered,
--         at least min_correct each, at least min_run_ms each, contact kept);
--       - it counted toward Race rewards (within per_day and
--         per_opponent_per_day for this player);
--       - the outcome was a win (a tie is not);
--       - CRISPR is unlocked for the winner (counting this race).
--     The roll happens inside race_reward, in the same transaction that
--     writes the reward log row, and race_reward returns at once if that
--     row exists, so a refresh, retry, reconnect or a second request can
--     never roll again, and the item and the record of the roll are saved
--     together or not at all. There is no pity timer or guarantee: every
--     eligible win is an independent 2% roll. Over the cap (item_cap) the
--     CRISPR waits as a pending claim, like every other Race item.
-- =====================================================================

insert into public.race_config (key, value) values
  ('level_base', 100),
  ('level_linear', 70),
  ('level_square', 6),
  ('trusted_xp_per_day', 3000),
  ('trusted_xp_max_entry', 1000),
  ('crispr_unlock_races', 5),
  ('crispr_drop_chance', 0.02)
on conflict (key) do nothing;

alter table public.race_reward_log add column if not exists crispr_roll numeric;
alter table public.race_reward_log add column if not exists crispr_drop boolean not null default false;

-- XP the server is willing to rely on, from the synced ledger.
create or replace function public.race_trusted_xp(p_user uuid) returns numeric
language plpgsql stable as $$
declare
  v_xp numeric := 0;
  v_created date;
  v_max_entry numeric := public.race_cfg('trusted_xp_max_entry');
  v_per_day numeric := public.race_cfg('trusted_xp_per_day');
begin
  if to_regclass('public.user_progress') is null then return 0; end if;
  select (created_at at time zone 'UTC')::date into v_created from auth.users where id = p_user;
  execute $q$
    with entries as (
      select (e.value->>'xp')::numeric as xp,
             case when e.value->>'d' ~ '^\d{4}-\d{2}-\d{2}$' then (e.value->>'d')::date
                  when jsonb_typeof(e.value->'at') = 'number' then (to_timestamp((e.value->>'at')::numeric / 1000.0) at time zone 'UTC')::date
                  else null end as d
        from public.user_progress up,
             jsonb_each(coalesce(up.data->'progression'->'ledger', '{}'::jsonb)) e
       where up.user_id = $1 and jsonb_typeof(e.value->'xp') = 'number'
    ),
    valid as (
      select least(greatest(xp, 0), $2) as xp, d from entries
       where d is not null
         and d <= (now() at time zone 'UTC')::date + 1
         and ($4::date is null or d >= $4::date - 1)
    )
    select coalesce(sum(least(t, $3)), 0) from (select d, sum(xp) as t from valid group by d) per_day
  $q$ into v_xp using p_user, v_max_entry, v_per_day, v_created;
  return v_xp;
end $$;

-- The player's level from trusted XP, on the app's curve.
create or replace function public.race_player_level(p_user uuid) returns int
language plpgsql stable as $$
declare
  v_xp numeric := public.race_trusted_xp(p_user);
  v_level int := 1;
  v_start numeric := 0;
  v_cost numeric;
  n int;
  b numeric := public.race_cfg('level_base');
  li numeric := public.race_cfg('level_linear');
  sq numeric := public.race_cfg('level_square');
begin
  loop
    n := v_level - 1;
    v_cost := round((b + li * n + sq * n * n) / 10.0) * 10;
    exit when v_xp < v_start + v_cost or v_level >= 1000;
    v_start := v_start + v_cost;
    v_level := v_level + 1;
  end loop;
  return v_level;
end $$;

-- Counted races (server records only).
create or replace function public.race_counted_races(p_user uuid) returns int
language sql stable as $$ select count(*)::int from public.race_reward_log where user_id = p_user and counted $$;

-- The one-argument version from 0009 is replaced by a two-argument one (its
-- second argument defaults to 0, so existing callers are unchanged).
drop function if exists public.race_crispr_unlocked(uuid);
-- CRISPR is unlocked at the level AND after enough counted races.
-- `p_extra` counts a race being settled right now.
create or replace function public.race_crispr_unlocked(p_user uuid, p_extra int default 0) returns boolean
language sql stable as $$
  select not exists (select 1 from auth.users u where u.id = p_user and coalesce(u.is_anonymous, false))
     and public.race_player_level(p_user) >= public.race_cfg('crispr_unlock_level')
     and public.race_counted_races(p_user) + coalesce(p_extra, 0) >= public.race_cfg('crispr_unlock_races')
$$;

-- Level charges (12, 16, 20 ...), each once, only once CRISPR is unlocked.
create or replace function public.race_claim_level_items(p_user uuid) returns jsonb
language plpgsql as $$
declare
  v_level int;
  v_unlock int := public.race_cfg('crispr_unlock_level');
  v_every int := greatest(1, public.race_cfg('crispr_level_every')::int);
  v_out jsonb := '[]'::jsonb;
  l int;
begin
  if not public.race_crispr_unlocked(p_user) then return v_out; end if;
  v_level := public.race_player_level(p_user);
  perform pg_advisory_xact_lock(hashtext('race-level:' || p_user::text));
  l := v_unlock;
  while l <= v_level loop
    insert into public.race_level_grants (user_id, level, item) values (p_user, l, 'crispr') on conflict do nothing;
    if found then
      v_out := v_out || jsonb_build_object('item', 'crispr', 'level', l, 'source', 'level', 'as', public.race_grant(p_user, 'crispr'));
    end if;
    l := l + v_every;
  end loop;
  return v_out;
end $$;

-- ---- rewards: Mutation every 5 counted wins; CRISPR drop on eligible wins ----
create or replace function public.race_reward(p_match uuid, p_user uuid, p_opp uuid, p_outcome text, p_qual boolean, p_chaos boolean, p_tz text, p_now timestamptz) returns void
language plpgsql as $$
declare
  v_day date := (p_now at time zone public.race_valid_tz(p_tz))::date;
  v_pair text := least(p_user::text, p_opp::text) || ':' || greatest(p_user::text, p_opp::text);
  v_counted boolean := false;
  v_reason text;
  v_granted jsonb := '[]'::jsonb;
  v_roll numeric := null;
  v_drop boolean := false;
  pr public.race_progress;
begin
  -- One settlement per player per match: this row is the idempotency key for
  -- every reward below, the roll included.
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
      v_granted := v_granted || jsonb_build_object('item', 'mutation', 'source', 'wins', 'as', public.race_grant(p_user, 'mutation'));
    end if;
    -- The CRISPR drop: one roll per eligible win, never more.
    if p_outcome = 'win' and public.race_crispr_unlocked(p_user, 1) then
      v_roll := random();
      if v_roll < public.race_cfg('crispr_drop_chance') then
        v_drop := true;
        v_granted := v_granted || jsonb_build_object('item', 'crispr', 'source', 'drop', 'as', public.race_grant(p_user, 'crispr'));
      end if;
    end if;
  end if;
  insert into public.race_reward_log (match_id, user_id, opponent, pair_key, reward_day, chaos, outcome, qualified, counted, reason, granted, crispr_roll, crispr_drop)
  values (p_match, p_user, p_opp, v_pair, v_day, p_chaos, p_outcome, p_qual, v_counted, v_reason, v_granted, v_roll, v_drop);
end $$;

-- ---- me: level, unlock state and drop settings ----
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
    'crisprUnlockRaces', public.race_cfg('crispr_unlock_races'),
    'countedRaces', public.race_counted_races(p_user),
    'crisprUnlocked', public.race_crispr_unlocked(p_user),
    'crisprDropChance', public.race_cfg('crispr_drop_chance'),
    'crisprDrops', (select count(*) from public.race_reward_log where user_id = p_user and crispr_drop),
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

-- ---- only the server may call these ----
do $$
declare f text;
begin
  foreach f in array array[
    'race_trusted_xp(uuid)', 'race_player_level(uuid)', 'race_counted_races(uuid)', 'race_crispr_unlocked(uuid,integer)',
    'race_claim_level_items(uuid)', 'race_reward(uuid,uuid,uuid,text,boolean,boolean,text,timestamptz)', 'race_me(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end $$;
