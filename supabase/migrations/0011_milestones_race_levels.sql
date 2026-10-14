-- =====================================================================
-- Plexus: milestones and levels in the Race lobby (0011)
-- =====================================================================
-- Run after 0001-0010. Safe to run more than once.
--
--   * Milestones: Level 10, 20 and 30, then every 5 levels (35, 40 ...).
--     The app pays the puzzle tools and the higher tool limits. The server
--     pays one CRISPR per milestone from Level 20 (milestone_crispr_from),
--     under the same rules as the level CRISPRs: the trusted level
--     (race_player_level) and CRISPR unlocked (Level 12 and 5 counted
--     races). A milestone that falls on a CRISPR level (20, 40 ...) pays
--     both. Each one is keyed in race_level_grants (item 'crispr-ms'), so it
--     is paid once.
--   * Race lobby levels: each signed-in player's trusted level is stored on
--     their race_participants row when they join, and race_state reports it,
--     so both players see each other's level and milestone badge. Guests
--     have none.
-- =====================================================================

insert into public.race_config (key, value) values
  ('milestone_every_after', 5),
  ('milestone_crispr_from', 20)
on conflict (key) do nothing;

-- Milestone CRISPRs are recorded beside level CRISPRs.
alter table public.race_level_grants drop constraint if exists race_level_grants_item_check;
alter table public.race_level_grants add constraint race_level_grants_item_check check (item in ('mutation','crispr','crispr-ms'));

create or replace function public.race_is_milestone(p_level int) returns boolean
language sql immutable as $$
  select p_level in (10, 20, 30) or (p_level > 30 and (p_level - 30) % 5 = 0)
$$;

-- The next level above p_level that pays a CRISPR: a level CRISPR (12, 16,
-- 20 ...) or a milestone CRISPR (20, 30, 35 ...).
create or replace function public.race_next_crispr_level(p_level int) returns int
language plpgsql stable as $$
declare
  v_unlock int := public.race_cfg('crispr_unlock_level');
  v_every int := greatest(1, public.race_cfg('crispr_level_every')::int);
  v_from int := public.race_cfg('milestone_crispr_from');
  v_lvl int := case when p_level < v_unlock then v_unlock else v_unlock + ((p_level - v_unlock) / v_every + 1) * v_every end;
  l int := p_level + 1;
begin
  while not (public.race_is_milestone(l) and l >= v_from) loop l := l + 1; end loop;
  return least(v_lvl, l);
end $$;

-- ---- level and milestone CRISPRs ----
create or replace function public.race_claim_level_items(p_user uuid) returns jsonb
language plpgsql as $$
declare
  v_level int;
  v_unlock int := public.race_cfg('crispr_unlock_level');
  v_every int := greatest(1, public.race_cfg('crispr_level_every')::int);
  v_from int := public.race_cfg('milestone_crispr_from');
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
  l := v_from;
  while l <= v_level loop
    if public.race_is_milestone(l) then
      insert into public.race_level_grants (user_id, level, item) values (p_user, l, 'crispr-ms') on conflict do nothing;
      if found then
        v_out := v_out || jsonb_build_object('item', 'crispr', 'level', l, 'source', 'milestone', 'as', public.race_grant(p_user, 'crispr'));
      end if;
    end if;
    l := l + 1;
  end loop;
  return v_out;
end $$;

-- ---- each player's level, stored when they join ----
alter table public.race_participants add column if not exists level int;

create or replace function public.race_participant_level() returns trigger
language plpgsql as $$
begin
  if coalesce(new.guest, false) then
    new.level := null;
  else
    new.level := public.race_player_level(new.user_id);
  end if;
  return new;
end $$;

drop trigger if exists race_participant_level on public.race_participants;
create trigger race_participant_level before insert on public.race_participants
  for each row execute function public.race_participant_level();

-- ---- state: the 0009 payload plus each player's level ----
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
        'crispr_unlocked', not p.guest and public.race_crispr_unlocked(p.user_id),
        'level', case when p.guest then null else p.level end
      ) order by p.seat) from public.race_participants p where p.match_id = p_match), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from public.race_events e where e.match_id = p_match), '[]'::jsonb),
    'log', (select to_jsonb(l) from public.race_reward_log l where l.match_id = p_match and l.user_id = p_user)
  ) into v
  from public.race_matches m where m.id = p_match;
  return v;
end $$;

-- ---- me: next CRISPR counts milestone CRISPRs ----
drop function if exists public.race_me(uuid, text);
create or replace function public.race_me(p_user uuid, p_tz text) returns jsonb
language plpgsql as $$
declare
  v_day date := (now() at time zone public.race_user_zone(p_user))::date;
  v_claimed jsonb := public.race_claim_level_items(p_user);
  v_level int := public.race_player_level(p_user);
  v_unlock int := public.race_cfg('crispr_unlock_level');
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
    'nextCrisprLevel', public.race_next_crispr_level(v_level),
    'milestoneCrisprFrom', public.race_cfg('milestone_crispr_from'),
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
    'race_is_milestone(integer)', 'race_next_crispr_level(integer)', 'race_claim_level_items(uuid)',
    'race_participant_level()', 'race_state(uuid,uuid)', 'race_me(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end $$;
