-- =====================================================================
-- Plexus: trusted Race matches, rewards and power-ups (migration 0006)
-- =====================================================================
-- Run once in the Supabase SQL editor, after 0001-0005. Safe to re-run.
--
-- Who can do what
--   * Players (the browser, anon/authenticated keys) can only READ their own
--     rows: matches they are in, both players' match rows, the match's
--     events, and their own inventory/progress/reward log. There are no
--     insert/update/delete policies, so the browser cannot write any of it.
--   * Every write goes through the functions below, which only the
--     service role can execute. The service role is used only by the Vercel
--     function api/race.js (key stored as a Vercel environment variable,
--     never shipped to the browser). That function verifies the player's
--     session, scores answers itself, and passes the player's id here.
--   * Each function locks the match row (FOR UPDATE), so simultaneous
--     actions (two attacks, an attack and an arm, both players finishing)
--     are applied one at a time in a consistent order.
--
-- Nothing here touches puzzle content, accounts, XP or other progress.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---- settings (playtest values; change here, no code change needed) ----
create table if not exists public.race_config (
  key   text primary key,
  value numeric not null
);
insert into public.race_config (key, value) values
  ('rounds', 10),
  ('countdown_ms', 3000),
  ('min_correct', 3),            -- qualification: each player
  ('min_run_ms', 20000),         -- qualification: each player's run time
  ('max_disconnect_ms', 60000),  -- qualification: longest gap in contact
  ('presence_timeout_ms', 15000),-- target counts as disconnected after this
  ('abandon_after_ms', 900000),  -- an unfinished race is abandoned after this
  ('mutation_every_wins', 5),
  ('crispr_every_races', 10),
  ('item_cap', 3),
  ('per_opponent_per_day', 3),
  ('per_day', 6),
  ('effect_ms', 2000),
  ('immunity_ms', 5000)
on conflict (key) do nothing;

create or replace function public.race_cfg(p_key text) returns numeric
language sql stable as $$ select value from public.race_config where key = p_key $$;

-- ---- tables ----
create table if not exists public.race_matches (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  status      text not null default 'lobby' check (status in ('lobby','active','finished','abandoned')),
  chaos       boolean not null default false,
  created_by  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  start_at    timestamptz,
  finished_at timestamptz,
  settled     boolean not null default false,
  result      jsonb,
  next_code   text
);
alter table public.race_matches add column if not exists next_code text;
-- One open match per code at a time (finished codes can be reused).
create unique index if not exists uniq_race_open_code on public.race_matches (code) where status in ('lobby','active');

create table if not exists public.race_participants (
  match_id        uuid not null references public.race_matches (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  seat            int  not null check (seat in (1, 2)),
  joined_at       timestamptz not null default now(),
  chaos_accepted  boolean not null default false,
  equip_mutation  boolean not null default false,
  equip_crispr    boolean not null default false,
  crispr_armed    boolean not null default false,
  crispr_spent    boolean not null default false,
  mutation_spent  boolean not null default false,
  answers         jsonb not null default '{}'::jsonb,
  answered        int  not null default 0,
  correct         int  not null default 0,
  finished_at     timestamptz,
  run_ms          int,
  last_seen       timestamptz not null default now(),
  max_gap_ms      int  not null default 0,
  left_at         timestamptz,
  qualified       boolean,
  outcome         text check (outcome in ('win','lose','tie','abandoned')),
  primary key (match_id, user_id),
  unique (match_id, seat)
);
create index if not exists idx_race_participants_user on public.race_participants (user_id);

-- The time zone a player's device reports, used only to decide which
-- calendar day a race counts toward. Stored per player (not per match) and
-- changeable at most once a week, so switching zones can't stretch the daily
-- limits. Readable by that player alone.
create table if not exists public.race_user_tz (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  tz         text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create table if not exists public.race_events (
  id         bigserial primary key,
  match_id   uuid not null references public.race_matches (id) on delete cascade,
  kind       text not null check (kind in ('chaos','accept','armed','mutation','blocked')),
  from_user  uuid,
  to_user    uuid,
  created_at timestamptz not null default now(),
  starts_at  timestamptz,
  ends_at    timestamptz,
  data       jsonb not null default '{}'::jsonb
);
create index if not exists idx_race_events_match on public.race_events (match_id, id);

create table if not exists public.race_inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  item    text not null check (item in ('mutation','crispr')),
  qty     int  not null default 0 check (qty >= 0),
  pending int  not null default 0 check (pending >= 0),
  primary key (user_id, item)
);

create table if not exists public.race_progress (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  qualifying_wins   int not null default 0,
  qualifying_races  int not null default 0,
  standard_races    int not null default 0,
  standard_wins     int not null default 0,
  chaos_races       int not null default 0,
  chaos_wins        int not null default 0
);

-- One row per player per match once it is settled: the idempotency key for
-- every reward, and the record of why a race did or did not count.
create table if not exists public.race_reward_log (
  match_id   uuid not null references public.race_matches (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  opponent   uuid,
  pair_key   text,
  reward_day date not null,
  chaos      boolean not null,
  outcome    text,
  qualified  boolean not null,
  counted    boolean not null,
  reason     text,
  granted    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);
create index if not exists idx_race_log_day on public.race_reward_log (user_id, reward_day);

-- ---- row level security: read your own, write nothing ----
alter table public.race_config       enable row level security;
alter table public.race_matches      enable row level security;
alter table public.race_participants enable row level security;
alter table public.race_events       enable row level security;
alter table public.race_inventory    enable row level security;
alter table public.race_progress     enable row level security;
alter table public.race_reward_log   enable row level security;
alter table public.race_user_tz      enable row level security;

create or replace function public.race_is_member(p_match uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.race_participants where match_id = p_match and user_id = auth.uid())
$$;

drop policy if exists race_config_read on public.race_config;
create policy race_config_read on public.race_config for select using (true);
drop policy if exists race_matches_read on public.race_matches;
create policy race_matches_read on public.race_matches for select using (public.race_is_member(id));
drop policy if exists race_participants_read on public.race_participants;
create policy race_participants_read on public.race_participants for select using (public.race_is_member(match_id));
drop policy if exists race_events_read on public.race_events;
create policy race_events_read on public.race_events for select using (public.race_is_member(match_id));
drop policy if exists race_inventory_read on public.race_inventory;
create policy race_inventory_read on public.race_inventory for select using (user_id = auth.uid());
drop policy if exists race_progress_read on public.race_progress;
create policy race_progress_read on public.race_progress for select using (user_id = auth.uid());
drop policy if exists race_tz_read on public.race_user_tz;
create policy race_tz_read on public.race_user_tz for select using (user_id = auth.uid());
drop policy if exists race_log_read on public.race_reward_log;
create policy race_log_read on public.race_reward_log for select using (user_id = auth.uid());

-- ---- helpers ----
create or replace function public.race_err(p_reason text) returns jsonb
language sql immutable as $$ select jsonb_build_object('ok', false, 'reason', p_reason) $$;

create or replace function public.race_qty(p_user uuid, p_item text) returns int
language sql stable as $$ select coalesce((select qty from public.race_inventory where user_id = p_user and item = p_item), 0) $$;

-- Spend one item. False (and nothing changes) when none is held. A pending
-- claim moves in to fill the freed slot.
create or replace function public.race_consume(p_user uuid, p_item text) returns boolean
language plpgsql as $$
declare v_ok boolean;
begin
  update public.race_inventory set qty = qty - 1 where user_id = p_user and item = p_item and qty > 0 returning true into v_ok;
  if not coalesce(v_ok, false) then return false; end if;
  update public.race_inventory set qty = qty + 1, pending = pending - 1
   where user_id = p_user and item = p_item and pending > 0 and qty < public.race_cfg('item_cap');
  return true;
end $$;

-- Add one item; past the cap it waits as a pending claim.
create or replace function public.race_grant(p_user uuid, p_item text) returns text
language plpgsql as $$
declare v_qty int;
begin
  insert into public.race_inventory (user_id, item) values (p_user, p_item) on conflict do nothing;
  select qty into v_qty from public.race_inventory where user_id = p_user and item = p_item for update;
  if v_qty < public.race_cfg('item_cap') then
    update public.race_inventory set qty = qty + 1 where user_id = p_user and item = p_item;
    return 'granted';
  end if;
  update public.race_inventory set pending = pending + 1 where user_id = p_user and item = p_item;
  return 'pending';
end $$;

create or replace function public.race_valid_tz(p_tz text) returns text
language plpgsql stable as $$
begin
  if p_tz is null or length(p_tz) > 64 then return 'UTC'; end if;
  perform now() at time zone p_tz;
  return p_tz;
exception when others then
  return 'UTC';
end $$;

create or replace function public.race_note_tz(p_user uuid, p_tz text) returns void
language plpgsql as $$
declare v_tz text := public.race_valid_tz(p_tz);
begin
  insert into public.race_user_tz (user_id, tz) values (p_user, v_tz)
  on conflict (user_id) do update set tz = excluded.tz, updated_at = now()
   where public.race_user_tz.tz <> excluded.tz and public.race_user_tz.updated_at < now() - interval '7 days';
end $$;

create or replace function public.race_user_zone(p_user uuid) returns text
language sql stable as $$ select coalesce((select tz from public.race_user_tz where user_id = p_user), 'UTC') $$;

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
    'match', to_jsonb(m) - 'settled',
    'players', coalesce((select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'seat', p.seat, 'chaos_accepted', p.chaos_accepted,
        'equip_mutation', p.equip_mutation, 'equip_crispr', p.equip_crispr,
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
create or replace function public.race_create(p_user uuid, p_code text, p_tz text) returns jsonb
language plpgsql as $$
declare v_id uuid;
begin
  if p_code !~ '^[A-Z2-9]{4}$' then return public.race_err('bad-code'); end if;
  begin
    insert into public.race_matches (code, created_by) values (p_code, p_user) returning id into v_id;
  exception when unique_violation then
    return public.race_err('code-taken');
  end;
  insert into public.race_participants (match_id, user_id, seat) values (v_id, p_user, 1);
  perform public.race_note_tz(p_user, p_tz);
  return public.race_state(p_user, v_id);
end $$;

create or replace function public.race_join(p_user uuid, p_code text, p_tz text) returns jsonb
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
  insert into public.race_participants (match_id, user_id, seat) values (m.id, p_user, 2);
  perform public.race_note_tz(p_user, p_tz);
  return public.race_state(p_user, m.id);
end $$;

-- Race again: the first player to ask opens a new match with a new code (new
-- questions) and records it on the old one; the other player's request joins
-- that same new match. Under the old match's lock, so both can tap at once.
create or replace function public.race_rematch(p_user uuid, p_match uuid, p_code text, p_tz text) returns jsonb
language plpgsql as $$
declare m public.race_matches; v jsonb;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status not in ('finished','abandoned') then return public.race_err('not-finished'); end if;
  if m.next_code is not null and exists (select 1 from public.race_matches where code = m.next_code and status = 'lobby') then
    return public.race_join(p_user, m.next_code, p_tz);
  end if;
  v := public.race_create(p_user, p_code, p_tz);
  if (v->>'ok')::boolean then
    update public.race_matches set next_code = p_code where id = p_match;
  end if;
  return v;
end $$;

-- Either player turns Chaos on or off. Any change clears both players'
-- consent and loadouts, so nobody starts under terms they did not accept.
create or replace function public.race_set_chaos(p_user uuid, p_match uuid, p_on boolean) returns jsonb
language plpgsql as $$
declare m public.race_matches;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  update public.race_matches set chaos = p_on where id = p_match;
  update public.race_participants set chaos_accepted = false, equip_mutation = false, equip_crispr = false where match_id = p_match;
  insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'chaos', p_user, jsonb_build_object('on', p_on));
  return public.race_state(p_user, p_match);
end $$;

-- Accept Chaos with a loadout: at most one Mutation and one CRISPR, and only
-- items the player actually holds. Equipping spends nothing.
create or replace function public.race_accept_chaos(p_user uuid, p_match uuid, p_mutation boolean, p_crispr boolean) returns jsonb
language plpgsql as $$
declare m public.race_matches;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  if not m.chaos then return public.race_err('chaos-off'); end if;
  if p_mutation and public.race_qty(p_user, 'mutation') < 1 then return public.race_err('no-mutation'); end if;
  if p_crispr and public.race_qty(p_user, 'crispr') < 1 then return public.race_err('no-crispr'); end if;
  update public.race_participants set chaos_accepted = true, equip_mutation = p_mutation, equip_crispr = p_crispr
   where match_id = p_match and user_id = p_user;
  insert into public.race_events (match_id, kind, from_user, data) values (p_match, 'accept', p_user, jsonb_build_object('mutation', p_mutation, 'crispr', p_crispr));
  return public.race_state(p_user, p_match);
end $$;

create or replace function public.race_start(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare m public.race_matches; v_n int; v_acc int;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status = 'active' then return public.race_state(p_user, p_match); end if; -- the other player already started it
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  select count(*), count(*) filter (where chaos_accepted) into v_n, v_acc from public.race_participants where match_id = p_match;
  if v_n < 2 then return public.race_err('need-opponent'); end if;
  if m.chaos and v_acc < 2 then return public.race_err('chaos-not-accepted'); end if;
  update public.race_matches set status = 'active', start_at = now() + make_interval(secs => public.race_cfg('countdown_ms') / 1000.0) where id = p_match;
  update public.race_participants set last_seen = now(), max_gap_ms = 0 where match_id = p_match;
  return public.race_state(p_user, p_match);
end $$;

-- ---- settlement ----
-- Decides the result once, under the match lock, and applies rewards.
-- Qualification (owner-approved rule, thresholds in race_config): both
-- players are different signed-in accounts in a server-started match, both
-- answered every round, each scored at least min_correct, each run took at
-- least min_run_ms, and neither lost contact for more than max_disconnect_ms.
-- A tie completes the race but is not a win.
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
  -- Wait while anyone is still legitimately racing.
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

-- Per-player reward bookkeeping for one settled match (idempotent by
-- match + player). Daily limits use the player's own calendar day.
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
  insert into public.race_progress (user_id) values (p_user) on conflict do nothing;
  -- Results by mode, kept apart (Chaos never mixes into standard records).
  if p_outcome in ('win','lose','tie') then
    if p_chaos then
      update public.race_progress set chaos_races = chaos_races + 1, chaos_wins = chaos_wins + (p_outcome = 'win')::int where user_id = p_user;
    else
      update public.race_progress set standard_races = standard_races + 1, standard_wins = standard_wins + (p_outcome = 'win')::int where user_id = p_user;
    end if;
  end if;
  perform pg_advisory_xact_lock(hashtext('race-reward:' || p_user::text));
  if not p_qual then
    v_reason := case when p_outcome = 'abandoned' then 'abandoned' when p_outcome is null then 'opponent-left' else 'not-qualifying' end;
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

-- ---- racing ----
-- Answers arrive in order, one per round. Correctness is decided by the
-- server function (which rebuilds the round from the race code) before it
-- reaches here; the browser never reports its own score.
create or replace function public.race_answer(p_user uuid, p_match uuid, p_round int, p_correct boolean) returns jsonb
language plpgsql as $$
declare m public.race_matches; p public.race_participants; v_rounds int := public.race_cfg('rounds');
begin
  select * into m from public.race_matches where id = p_match for update;
  select * into p from public.race_participants where match_id = p_match and user_id = p_user;
  if not found then return public.race_err('not-in-match'); end if;
  if m.status <> 'active' then return public.race_err('not-active'); end if;
  if now() < m.start_at then return public.race_err('not-started'); end if;
  if p.finished_at is not null or p.left_at is not null then return public.race_err('finished'); end if;
  if p_round <> p.answered then return public.race_err('out-of-order'); end if;
  update public.race_participants
     set answers = answers || jsonb_build_object(p_round::text, jsonb_build_object('correct', p_correct, 'at', now())),
         answered = answered + 1,
         correct = correct + p_correct::int,
         max_gap_ms = greatest(max_gap_ms, (extract(epoch from (now() - greatest(last_seen, m.start_at))) * 1000)::int),
         last_seen = now(),
         finished_at = case when answered + 1 >= v_rounds then now() else null end,
         run_ms = case when answered + 1 >= v_rounds then (extract(epoch from (now() - m.start_at)) * 1000)::int else null end
   where match_id = p_match and user_id = p_user;
  perform public.race_try_settle(p_match);
  return public.race_state(p_user, p_match);
end $$;

create or replace function public.race_heartbeat(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare m public.race_matches;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  if m.status = 'active' then
    update public.race_participants
       set max_gap_ms = greatest(max_gap_ms, (extract(epoch from (now() - greatest(last_seen, m.start_at))) * 1000)::int),
           last_seen = now()
     where match_id = p_match and user_id = p_user and finished_at is null and now() > m.start_at;
    update public.race_participants set last_seen = now() where match_id = p_match and user_id = p_user and (finished_at is not null or now() <= m.start_at);
  else
    update public.race_participants set last_seen = now() where match_id = p_match and user_id = p_user;
  end if;
  perform public.race_try_settle(p_match);
  return public.race_state(p_user, p_match);
end $$;

create or replace function public.race_leave(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare m public.race_matches;
begin
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then return public.race_err('not-in-match'); end if;
  update public.race_participants set left_at = coalesce(left_at, now()) where match_id = p_match and user_id = p_user and finished_at is null;
  if m.status = 'lobby' then
    update public.race_matches set status = 'abandoned', finished_at = now(), settled = true where id = p_match;
  else
    perform public.race_try_settle(p_match);
  end if;
  return public.race_state(p_user, p_match);
end $$;

-- ---- power-ups ----
-- Arm CRISPR: needs Chaos, an equipped CRISPR not yet spent, and one held.
-- Arming spends nothing; the charge is used only when it blocks.
create or replace function public.race_arm(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare m public.race_matches; p public.race_participants;
begin
  select * into m from public.race_matches where id = p_match for update;
  select * into p from public.race_participants where match_id = p_match and user_id = p_user;
  if not found then return public.race_err('not-in-match'); end if;
  if m.status <> 'active' or not m.chaos then return public.race_err('not-available'); end if;
  if not p.equip_crispr or p.crispr_spent then return public.race_err('not-equipped'); end if;
  if p.crispr_armed then return public.race_state(p_user, p_match); end if;
  if public.race_qty(p_user, 'crispr') < 1 then return public.race_err('no-crispr'); end if;
  update public.race_participants set crispr_armed = true where match_id = p_match and user_id = p_user;
  insert into public.race_events (match_id, kind, from_user) values (p_match, 'armed', p_user);
  return public.race_state(p_user, p_match);
end $$;

-- Mutation. Rejected (nothing spent) unless: Chaos is on and active, the
-- attacker equipped an unspent Mutation and holds one, the target is still
-- racing, connected and past the countdown, and no effect is running on the
-- target or within its immunity window. An armed CRISPR blocks it: both items
-- are spent. Otherwise the effect runs for effect_ms from now; its start and
-- end are stored, so a reconnect shows the remaining time, never a restart.
create or replace function public.race_attack(p_user uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare
  m public.race_matches; me public.race_participants; t public.race_participants;
  v_last timestamptz; v_ev public.race_events;
begin
  select * into m from public.race_matches where id = p_match for update;
  select * into me from public.race_participants where match_id = p_match and user_id = p_user;
  if not found then return public.race_err('not-in-match'); end if;
  if m.status <> 'active' or not m.chaos then return public.race_err('not-available'); end if;
  if now() < m.start_at then return public.race_err('not-started'); end if;
  if not me.equip_mutation or me.mutation_spent then return public.race_err('not-equipped'); end if;
  if public.race_qty(p_user, 'mutation') < 1 then return public.race_err('no-mutation'); end if;
  select * into t from public.race_participants where match_id = p_match and user_id <> p_user;
  if not found then return public.race_err('no-target'); end if;
  if t.finished_at is not null then return public.race_err('target-finished'); end if;
  if t.left_at is not null or now() - t.last_seen > make_interval(secs => public.race_cfg('presence_timeout_ms') / 1000.0) then return public.race_err('target-disconnected'); end if;
  if t.answered >= public.race_cfg('rounds') then return public.race_err('target-no-challenge'); end if;
  -- Overlap and immunity: the latest effect on the target must have resolved
  -- at least immunity_ms ago.
  select max(coalesce(ends_at, created_at)) into v_last from public.race_events where match_id = p_match and to_user = t.user_id and kind in ('mutation','blocked');
  if v_last is not null and now() < v_last + make_interval(secs => public.race_cfg('immunity_ms') / 1000.0) then
    return public.race_err(case when now() < v_last then 'effect-active' else 'target-immune' end);
  end if;
  if not public.race_consume(p_user, 'mutation') then return public.race_err('no-mutation'); end if;
  update public.race_participants set mutation_spent = true where match_id = p_match and user_id = p_user;
  if t.crispr_armed and not t.crispr_spent and public.race_consume(t.user_id, 'crispr') then
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

-- ---- player summary ----
create or replace function public.race_me(p_user uuid, p_tz text) returns jsonb
language plpgsql stable as $$
declare v_day date := (now() at time zone public.race_user_zone(p_user))::date;
begin
  return jsonb_build_object(
    'ok', true,
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
    'race_state(uuid,uuid)', 'race_create(uuid,text,text)', 'race_join(uuid,text,text)',
    'race_set_chaos(uuid,uuid,boolean)', 'race_accept_chaos(uuid,uuid,boolean,boolean)', 'race_start(uuid,uuid)',
    'race_try_settle(uuid)', 'race_reward(uuid,uuid,uuid,text,boolean,boolean,text,timestamptz)',
    'race_answer(uuid,uuid,int,boolean)', 'race_heartbeat(uuid,uuid)', 'race_leave(uuid,uuid)',
    'race_arm(uuid,uuid)', 'race_attack(uuid,uuid)', 'race_me(uuid,text)',
    'race_consume(uuid,text)', 'race_grant(uuid,text)', 'race_note_tz(uuid,text)', 'race_rematch(uuid,uuid,text,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
  end loop;
end $$;

-- ---- realtime: players receive their match's row changes (RLS applies) ----
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin execute 'alter publication supabase_realtime add table public.race_matches'; exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.race_participants'; exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.race_events'; exception when duplicate_object then null; end;
  end if;
end $$;
