-- =====================================================================
-- Plexus: Chaos introductory loadout and guest racers (migration 0007)
-- =====================================================================
-- Run once in the Supabase SQL editor, after 0006. Safe to re-run.
--
-- What changes
--   * Chaos races give EVERY player (guests included) one temporary Mutation
--     and one temporary CRISPR for that race only. They live on the player's
--     row for that match (temp_mutation / temp_crispr), so they end with the
--     race and never touch race_inventory. Same loadout for both players.
--   * While the introductory loadout is on (race_config 'chaos_free_loadout'
--     = 1), earned Mutations and CRISPRs are NOT equipped or spent in Chaos:
--     earned inventory stays exactly as it is and keeps accruing from
--     qualifying races. Set the value to 0 to return to the 0006 behaviour
--     (equip earned items only) without a code change.
--   * CRISPR itself is unchanged: arm it once, it blocks the next Mutation
--     and is then spent. One Mutation and one CRISPR per player per race.
--   * Guests: anonymous Supabase sessions may create, join and play races.
--     Their participant row is marked guest. Guests never earn Race rewards
--     and a race with a guest never qualifies (the 0006 rule already required
--     two signed-in accounts). Classic Race stays free of power-ups.
--
-- Every write still goes through these service-role-only functions, called
-- by the Vercel function api/race.js, which verifies the session first.
-- =====================================================================

alter table public.race_participants add column if not exists guest boolean not null default false;
alter table public.race_participants add column if not exists temp_mutation boolean not null default false;
alter table public.race_participants add column if not exists temp_crispr boolean not null default false;

insert into public.race_config (key, value) values ('chaos_free_loadout', 1)
on conflict (key) do nothing;

create or replace function public.race_free_loadout() returns boolean
language sql stable as $$ select coalesce(public.race_cfg('chaos_free_loadout'), 0) = 1 $$;

-- The 0006 versions without the guest argument are replaced (dropping them
-- avoids two overloads with the same named arguments).
drop function if exists public.race_create(uuid, text, text);
drop function if exists public.race_join(uuid, text, text);
drop function if exists public.race_rematch(uuid, uuid, text, text);

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
    'match', to_jsonb(m) - 'settled',
    'players', coalesce((select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'seat', p.seat, 'guest', p.guest, 'chaos_accepted', p.chaos_accepted,
        'equip_mutation', p.equip_mutation, 'equip_crispr', p.equip_crispr,
        'temp_mutation', p.temp_mutation, 'temp_crispr', p.temp_crispr,
        'crispr_armed', p.crispr_armed, 'crispr_spent', p.crispr_spent, 'mutation_spent', p.mutation_spent,
        'answered', p.answered, 'correct', p.correct, 'finished_at', p.finished_at, 'run_ms', p.run_ms,
        'last_seen', p.last_seen, 'left_at', p.left_at, 'qualified', p.qualified, 'outcome', p.outcome,
        'has_mutation', public.race_qty(p.user_id, 'mutation') > 0,
        'has_crispr', public.race_qty(p.user_id, 'crispr') > 0
      ) order by p.seat) from public.race_participants p where p.match_id = p_match), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from public.race_events e where e.match_id = p_match), '[]'::jsonb),
    'log', (select to_jsonb(l) from public.race_reward_log l where l.match_id = p_match and l.user_id = p_user)
  ) into v
  from public.race_matches m where m.id = p_match;
  return v;
end $$;

-- ---- lobby ----
create or replace function public.race_create(p_user uuid, p_code text, p_tz text, p_guest boolean default false) returns jsonb
language plpgsql as $$
declare v_id uuid;
begin
  if p_code !~ '^[A-Z2-9]{4}$' then return public.race_err('bad-code'); end if;
  begin
    insert into public.race_matches (code, created_by) values (p_code, p_user) returning id into v_id;
  exception when unique_violation then
    return public.race_err('code-taken');
  end;
  insert into public.race_participants (match_id, user_id, seat, guest) values (v_id, p_user, 1, coalesce(p_guest, false));
  if not coalesce(p_guest, false) then perform public.race_note_tz(p_user, p_tz); end if;
  return public.race_state(p_user, v_id);
end $$;

create or replace function public.race_join(p_user uuid, p_code text, p_tz text, p_guest boolean default false) returns jsonb
language plpgsql as $$
declare m public.race_matches; v_n int;
begin
  select * into m from public.race_matches where code = p_code and status in ('lobby','active') for update;
  if not found then return public.race_err('no-such-race'); end if;
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

create or replace function public.race_rematch(p_user uuid, p_match uuid, p_code text, p_tz text, p_guest boolean default false) returns jsonb
language plpgsql as $$
declare m public.race_matches; v jsonb;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status not in ('finished','abandoned') then return public.race_err('not-finished'); end if;
  if m.next_code is not null and exists (select 1 from public.race_matches where code = m.next_code and status = 'lobby') then
    return public.race_join(p_user, m.next_code, p_tz, p_guest);
  end if;
  v := public.race_create(p_user, p_code, p_tz, p_guest);
  if (v->>'ok')::boolean then
    update public.race_matches set next_code = p_code where id = p_match;
  end if;
  return v;
end $$;

create or replace function public.race_set_chaos(p_user uuid, p_match uuid, p_on boolean) returns jsonb
language plpgsql as $$
declare m public.race_matches;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  update public.race_matches set chaos = p_on where id = p_match;
  update public.race_participants set chaos_accepted = false, equip_mutation = false, equip_crispr = false, temp_mutation = false, temp_crispr = false where match_id = p_match;
  insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'chaos', p_user, jsonb_build_object('on', p_on));
  return public.race_state(p_user, p_match);
end $$;

-- Accept Chaos. With the introductory loadout on, accepting gives this player
-- one temporary Mutation and one temporary CRISPR for this race; earned items
-- are not equipped (p_mutation / p_crispr are ignored). With it off, 0006
-- rules apply: equip at most one of each, only items actually held.
create or replace function public.race_accept_chaos(p_user uuid, p_match uuid, p_mutation boolean, p_crispr boolean) returns jsonb
language plpgsql as $$
declare m public.race_matches; v_free boolean := public.race_free_loadout();
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  if not m.chaos then return public.race_err('chaos-off'); end if;
  if v_free then
    update public.race_participants set chaos_accepted = true, equip_mutation = false, equip_crispr = false, temp_mutation = true, temp_crispr = true
     where match_id = p_match and user_id = p_user;
    insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'accept', p_user, jsonb_build_object('mutation', true, 'crispr', true, 'temporary', true));
  else
    if p_mutation and public.race_qty(p_user, 'mutation') < 1 then return public.race_err('no-mutation'); end if;
    if p_crispr and public.race_qty(p_user, 'crispr') < 1 then return public.race_err('no-crispr'); end if;
    update public.race_participants set chaos_accepted = true, equip_mutation = p_mutation, equip_crispr = p_crispr, temp_mutation = false, temp_crispr = false
     where match_id = p_match and user_id = p_user;
    insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'accept', p_user, jsonb_build_object('mutation', p_mutation, 'crispr', p_crispr));
  end if;
  return public.race_state(p_user, p_match);
end $$;

-- ---- settlement ----
-- Same as 0006, plus: a race with a guest never qualifies (both players must
-- be signed-in accounts, as the approved rule already said).
create or replace function public.race_try_settle(p_match uuid) returns void
language plpgsql as $$
declare
  m public.race_matches;
  a public.race_participants;
  b public.race_participants;
  v_now timestamptz := now();
  v_gone_a boolean; v_gone_b boolean;
  v_rounds int := public.race_cfg('rounds');
  v_qual boolean;
  v_out_a text; v_out_b text;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or m.settled or m.status <> 'active' then return; end if;
  select * into a from public.race_participants where match_id = p_match and seat = 1;
  select * into b from public.race_participants where match_id = p_match and seat = 2;
  if b.user_id is null then return; end if;
  v_gone_a := a.finished_at is null and (a.left_at is not null or v_now - greatest(a.last_seen, m.start_at) > make_interval(secs => public.race_cfg('max_disconnect_ms') / 1000.0));
  v_gone_b := b.finished_at is null and (b.left_at is not null or v_now - greatest(b.last_seen, m.start_at) > make_interval(secs => public.race_cfg('max_disconnect_ms') / 1000.0));
  if v_now - m.start_at > make_interval(secs => public.race_cfg('abandon_after_ms') / 1000.0) then
    v_gone_a := v_gone_a or a.finished_at is null;
    v_gone_b := v_gone_b or b.finished_at is null;
  end if;
  if (a.finished_at is null and not v_gone_a) or (b.finished_at is null and not v_gone_b) then return; end if;

  if v_gone_a or v_gone_b then
    v_out_a := case when v_gone_a then 'abandoned' else null end;
    v_out_b := case when v_gone_b then 'abandoned' else null end;
    v_qual := false;
  else
    if a.correct <> b.correct then
      v_out_a := case when a.correct > b.correct then 'win' else 'lose' end;
    elsif a.run_ms <> b.run_ms then
      v_out_a := case when a.run_ms < b.run_ms then 'win' else 'lose' end;
    else
      v_out_a := 'tie';
    end if;
    v_out_b := case v_out_a when 'win' then 'lose' when 'lose' then 'win' else 'tie' end;
    v_qual := a.user_id <> b.user_id
      and not a.guest and not b.guest
      and a.answered >= v_rounds and b.answered >= v_rounds
      and a.correct >= public.race_cfg('min_correct') and b.correct >= public.race_cfg('min_correct')
      and a.run_ms >= public.race_cfg('min_run_ms') and b.run_ms >= public.race_cfg('min_run_ms')
      and a.max_gap_ms <= public.race_cfg('max_disconnect_ms') and b.max_gap_ms <= public.race_cfg('max_disconnect_ms');
  end if;

  update public.race_participants set outcome = v_out_a, qualified = v_qual where match_id = p_match and seat = 1;
  update public.race_participants set outcome = v_out_b, qualified = v_qual where match_id = p_match and seat = 2;
  update public.race_matches
     set status = case when v_gone_a or v_gone_b then 'abandoned' else 'finished' end,
         finished_at = v_now, settled = true,
         result = jsonb_build_object('qualified', v_qual, 'seat1', v_out_a, 'seat2', v_out_b)
   where id = p_match;

  perform public.race_reward(p_match, a.user_id, b.user_id, v_out_a, v_qual, m.chaos, public.race_user_zone(a.user_id), v_now);
  perform public.race_reward(p_match, b.user_id, a.user_id, v_out_b, v_qual, m.chaos, public.race_user_zone(b.user_id), v_now);
end $$;

-- Rewards: unchanged for signed-in players. A guest gets a log row (so the
-- results screen can say why) and nothing else: no records, no progress, no
-- items. Temporary Chaos charges never reach this function or the inventory.
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
    if pr.qualifying_races % public.race_cfg('crispr_every_races') = 0 then
      v_granted := v_granted || jsonb_build_object('item', 'crispr', 'as', public.race_grant(p_user, 'crispr'));
    end if;
  end if;
  insert into public.race_reward_log (match_id, user_id, opponent, pair_key, reward_day, chaos, outcome, qualified, counted, reason, granted)
  values (p_match, p_user, p_opp, v_pair, v_day, p_chaos, p_outcome, p_qual, v_counted, v_reason, v_granted);
end $$;

-- ---- power-ups ----
-- Arm CRISPR: the race's temporary CRISPR, or (loadout off) an equipped and
-- held earned one. Arming spends nothing; the charge is used when it blocks.
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
  if not p.temp_crispr and public.race_qty(p_user, 'crispr') < 1 then return public.race_err('no-crispr'); end if;
  update public.race_participants set crispr_armed = true where match_id = p_match and user_id = p_user;
  insert into public.race_events (match_id, kind, from_user) values (p_match, 'armed', p_user);
  return public.race_state(p_user, p_match);
end $$;

-- Mutation: same checks and timing as 0006. A temporary charge is spent by
-- marking it used on this match only; an earned one comes out of inventory.
-- An armed CRISPR blocks it and both charges are spent (temporary CRISPRs
-- on the match row, earned ones from inventory).
create or replace function public.race_attack(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare
  m public.race_matches; me public.race_participants; t public.race_participants;
  v_last timestamptz; v_ev public.race_events; v_block boolean := false;
begin
  select * into m from public.race_matches where id = p_match for update;
  select * into me from public.race_participants where match_id = p_match and user_id = p_user;
  if not found then return public.race_err('not-in-match'); end if;
  if m.status <> 'active' or not m.chaos then return public.race_err('not-available'); end if;
  if now() < m.start_at then return public.race_err('not-started'); end if;
  if me.mutation_spent or not (me.temp_mutation or me.equip_mutation) then return public.race_err('not-equipped'); end if;
  if not me.temp_mutation and public.race_qty(p_user, 'mutation') < 1 then return public.race_err('no-mutation'); end if;
  select * into t from public.race_participants where match_id = p_match and user_id <> p_user;
  if not found then return public.race_err('no-target'); end if;
  if t.finished_at is not null then return public.race_err('target-finished'); end if;
  if t.left_at is not null or now() - t.last_seen > make_interval(secs => public.race_cfg('presence_timeout_ms') / 1000.0) then return public.race_err('target-disconnected'); end if;
  if t.answered >= public.race_cfg('rounds') then return public.race_err('target-no-challenge'); end if;
  select max(coalesce(ends_at, created_at)) into v_last from public.race_events where match_id = p_match and to_user = t.user_id and kind in ('mutation','blocked');
  if v_last is not null and now() < v_last + make_interval(secs => public.race_cfg('immunity_ms') / 1000.0) then
    return public.race_err(case when now() < v_last then 'effect-active' else 'target-immune' end);
  end if;
  if not me.temp_mutation and not public.race_consume(p_user, 'mutation') then return public.race_err('no-mutation'); end if;
  update public.race_participants set mutation_spent = true where match_id = p_match and user_id = p_user;
  if t.crispr_armed and not t.crispr_spent then
    v_block := t.temp_crispr or public.race_consume(t.user_id, 'crispr');
  end if;
  if v_block then
    update public.race_participants set crispr_spent = true, crispr_armed = false where match_id = p_match and user_id = t.user_id;
    insert into public.race_events (match_id, kind, from_user, to_user, starts_at, ends_at)
    values (p_match, 'blocked', p_user, t.user_id, now(), now()) returning * into v_ev;
  else
    insert into public.race_events (match_id, kind, from_user, to_user, starts_at, ends_at, data)
    values (p_match, 'mutation', p_user, t.user_id, now(), now() + make_interval(secs => public.race_cfg('effect_ms') / 1000.0),
            jsonb_build_object('round', t.answered, 'seed', floor(random() * 1000000)::int)) returning * into v_ev;
  end if;
  return public.race_state(p_user, p_match) || jsonb_build_object('event', to_jsonb(v_ev));
end $$;

-- ---- only the server may call these ----
do $$
declare f text;
begin
  foreach f in array array[
    'race_state(uuid,uuid)', 'race_create(uuid,text,text,boolean)', 'race_join(uuid,text,text,boolean)',
    'race_rematch(uuid,uuid,text,text,boolean)', 'race_set_chaos(uuid,uuid,boolean)', 'race_accept_chaos(uuid,uuid,boolean,boolean)',
    'race_try_settle(uuid)', 'race_reward(uuid,uuid,uuid,text,boolean,boolean,text,timestamptz)',
    'race_arm(uuid,uuid)', 'race_attack(uuid,uuid)', 'race_free_loadout()'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end $$;
