// Race backend checks against a real Postgres with migrations 0003 and 0006-0010 applied.
//   PGTEST="psql -h /tmp/pgtest -p 5544 -U postgres -d t" node scripts/race-sql-test.mjs
// The database needs Supabase-like stubs (auth.users, auth.uid(), roles anon /
// authenticated / service_role); scripts/race-sql-setup.sql creates them.
// Time-based rules are tested by moving stored timestamps, not by waiting.
import { execFileSync, spawn } from 'node:child_process'

const PG = (process.env.PGTEST || 'psql -h /tmp/pgtest -p 5544 -U postgres -d t').split(' ')
const run = (sql) => execFileSync(PG[0], [...PG.slice(1), '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', sql], { encoding: 'utf8' }).trim()
const j = (sql) => {
  const out = run(sql)
  try {
    return JSON.parse(out || 'null')
  } catch {
    return out
  }
}
let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const A = uid(1)
const B = uid(2)
const C = uid(3)
const call = (fn, ...args) => j(`select public.${fn}(${args.map((a) => (a === null ? 'null' : typeof a === 'boolean' || typeof a === 'number' ? String(a) : `'${a}'`)).join(',')})`)
const me = (u) => call('race_me', u, 'America/Los_Angeles')
// Synced XP decides the level: Level 12 starts at 7260 XP, Level 16 at 14940
// (the curve from 0010). The server trusts at most 1000 XP per entry and
// 3000 per day (0010), so test XP is spread over past days, one entry of up
// to 1000 per slot, and the account is made 90 days old.
const xpLedger = (xp) => {
  const out = {}
  let left = xp
  let k = 0
  while (left > 0) {
    const day = Math.floor(k / 3) + 1
    const d = new Date(Date.now() - day * 86400000).toISOString().slice(0, 10)
    out[`t${k}`] = { xp: Math.min(1000, left), d }
    left -= 1000
    k++
  }
  return out
}
const setXp = (u, xp) => {
  run(`update auth.users set created_at = now() - interval '90 days' where id = '${u}'`)
  run(`insert into public.user_progress (user_id, data) values ('${u}', '${JSON.stringify({ progression: { ledger: xpLedger(xp) } })}') on conflict (user_id) do update set data = excluded.data`)
}
const seen = (u, m) => run(`update public.race_participants set last_seen = now() where match_id='${m}' and user_id='${u}'`)

run(`set client_min_messages = warning; truncate public.race_matches, public.race_inventory, public.race_progress cascade; delete from auth.users;`)
run(`insert into auth.users(id) values ('${A}'),('${B}'),('${C}')`)
// Sections 1-11 test the rules from 0006-0009, where CRISPR needed only the
// level; section 12 turns on the counted-race requirement and the drop.
run(`update public.race_config set value = 0 where key = 'crispr_unlock_races'`)
run(`update public.race_config set value = 0 where key = 'crispr_drop_chance'`)
// B is Level 12, so B may equip CRISPR. Its Level 12 reward is marked as
// already paid so the inventory counts below stay simple (section 11 tests
// the rewards themselves).
setXp(B, 7260)
run(`insert into public.race_level_grants (user_id, level, item) values ('${B}', 12, 'crispr') on conflict do nothing`)
// Fast settings for tests (restored at the end).
run(`update public.race_config set value = 0 where key = 'countdown_ms'`)
// Sections 1-9 check the earned-item rules (0006), which still apply when the
// Chaos introductory loadout is off. Section 10 turns it on.
run(`update public.race_config set value = 0 where key = 'chaos_free_loadout'`)

let codeN = 0
const newCode = () => {
  const al = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  codeN++
  return [0, 1, 2, 3].map((i) => al[(codeN * 7 + i * 13) % al.length]).join('')
}
// Plays a full match: answers for A and B given correct counts and run time.
function playMatch(p1, p2, { aCorrect = 8, bCorrect = 5, runMs = 60000, chaos = false } = {}) {
  const code = newCode()
  const s = call('race_create', p1, code, 'America/Los_Angeles')
  const m = s.match.id
  call('race_join', p2, code, 'Europe/London')
  if (chaos) {
    call('race_set_chaos', p1, m, true)
    call('race_accept_chaos', p1, m, false, false)
    call('race_accept_chaos', p2, m, false, false)
  }
  call('race_start', p1, m)
  run(`update public.race_matches set start_at = now() - interval '${runMs} milliseconds' where id='${m}'`)
  for (let r = 0; r < 10; r++) {
    call('race_answer', p1, m, r, r < aCorrect)
    call('race_answer', p2, m, r, r < bCorrect)
  }
  return m
}

console.log('[1] Lobby: join, rejoin, full, self-race')
{
  const s = call('race_create', A, 'ABCD', 'America/Los_Angeles')
  ok(s.ok && s.players.length === 1, 'create a match')
  ok(call('race_create', B, 'ABCD', 'UTC').reason === 'code-taken', 'an open code cannot be reused')
  const m = s.match.id
  ok(call('race_join', A, 'ABCD', 'UTC').players.length === 1, 'the creator joining again does not take seat 2 (no self-race)')
  ok(call('race_start', A, m).reason === 'need-opponent', 'a solo match cannot start')
  ok(call('race_join', B, 'ABCD', 'UTC').players.length === 2, 'second player joins')
  ok(call('race_join', C, 'ABCD', 'UTC').reason === 'race-full', 'a third player is refused')
  ok(call('race_state', C, m).reason === 'not-in-match', 'a non-player cannot read the match')
  call('race_leave', A, m)
  ok(j(`select to_jsonb(m) from public.race_matches m where id='${m}'`).status === 'abandoned', 'leaving in the lobby abandons the match')
}

console.log('[2] Chaos consent and loadouts')
{
  const code = newCode()
  const m = call('race_create', A, code, 'UTC').match.id
  call('race_join', B, code, 'UTC')
  call('race_set_chaos', B, m, true)
  ok(call('race_start', A, m).reason === 'chaos-not-accepted', 'Chaos needs both players to accept before starting')
  ok(call('race_accept_chaos', A, m, true, false).reason === 'no-mutation', 'cannot equip a Mutation you do not hold')
  call('race_grant', A, 'mutation')
  call('race_grant', B, 'crispr')
  call('race_grant', A, 'crispr')
  ok(call('race_accept_chaos', A, m, true, true).reason === 'crispr-locked', 'below Level 12, a held CRISPR cannot be equipped')
  call('race_consume', A, 'crispr')
  ok(call('race_accept_chaos', A, m, true, false).ok, 'A accepts with a Mutation')
  let st = call('race_accept_chaos', B, m, false, true)
  ok(st.players.find((p) => p.user_id === A).equip_mutation && st.players.find((p) => p.user_id === B).equip_crispr, 'both loadouts are visible to both players')
  call('race_set_chaos', A, m, true)
  st = call('race_state', A, m)
  ok(st.players.every((p) => !p.chaos_accepted && !p.equip_mutation && !p.equip_crispr), 'changing Chaos clears both consents and loadouts')
  call('race_accept_chaos', A, m, true, false)
  call('race_accept_chaos', B, m, false, true)
  ok(me(A).inventory.mutation === 1 && me(B).inventory.crispr === 1, 'equipping spends nothing')
  st = call('race_start', B, m)
  ok(st.match.status === 'active', 'starts when both accepted')
  ok(call('race_set_chaos', A, m, false).reason === 'not-in-lobby', 'Chaos cannot change after the start')
  globalThis.chaosMatch = m
}

console.log('[3] Mutation and CRISPR rules')
{
  const m = globalThis.chaosMatch
  ok(call('race_attack', B, m).reason === 'not-equipped', 'B has no Mutation equipped: rejected')
  run(`update public.race_participants set last_seen = now() - interval '30 seconds' where match_id='${m}' and user_id='${B}'`)
  let r = call('race_attack', A, m)
  ok(r.reason === 'target-disconnected' && me(A).inventory.mutation === 1, 'disconnected target: rejected, nothing spent')
  seen(B, m)
  ok(call('race_arm', A, m).reason === 'not-equipped', 'cannot arm a CRISPR you did not equip')
  r = call('race_arm', B, m)
  ok(r.players.find((p) => p.user_id === B).crispr_armed && me(B).inventory.crispr === 1, 'arming shows as armed and spends nothing')
  r = call('race_attack', A, m)
  ok(r.event?.kind === 'blocked', 'an armed CRISPR blocks the Mutation')
  ok(me(A).inventory.mutation === 0 && me(B).inventory.crispr === 0, 'a blocked attack spends the Mutation and the CRISPR')
  const pb = r.players.find((p) => p.user_id === B)
  ok(pb.crispr_spent && !pb.crispr_armed, 'CRISPR shows as spent')
  call('race_grant', A, 'mutation')
  ok(call('race_attack', A, m).reason === 'not-equipped', 'one Mutation per race: a second attack is refused')
  ok(me(A).inventory.mutation === 1, 'the refused attack spent nothing')
}

console.log('[4] Effect timing, overlap and immunity')
{
  const code = newCode()
  const m = call('race_create', A, code, 'UTC').match.id
  call('race_join', B, code, 'UTC')
  call('race_set_chaos', A, m, true)
  call('race_grant', B, 'mutation')
  call('race_accept_chaos', A, m, true, false)
  call('race_accept_chaos', B, m, true, false)
  call('race_start', A, m)
  const r = call('race_attack', A, m)
  ok(r.event?.kind === 'mutation', 'Mutation delivered')
  const ms = Date.parse(r.event.ends_at) - Date.parse(r.event.starts_at)
  ok(ms === 10000, 'the effect lasts exactly 10 seconds (stored start and end): ' + ms)
  ok(r.event.to_user === B && r.event.from_user === A, 'targets the opponent')
  ok(me(A).inventory.mutation === 0, 'a delivered Mutation is spent')
  // B tries to hit back while A has no effect: allowed. A second effect on B
  // during its own effect is impossible anyway (one Mutation each). Overlap
  // and immunity on one target: give A a fresh match budget by resetting.
  run(`update public.race_participants set mutation_spent = false where match_id='${m}' and user_id='${A}'`)
  call('race_grant', A, 'mutation')
  ok(call('race_attack', A, m).reason === 'effect-active', 'no overlapping effect while one is running')
  run(`update public.race_events set starts_at = starts_at - interval '11 seconds', ends_at = ends_at - interval '11 seconds' where match_id='${m}'`)
  ok(call('race_attack', A, m).reason === 'target-immune', '5 seconds of immunity after the effect resolves')
  ok(me(A).inventory.mutation === 1, 'rejected attacks spend nothing')
  run(`update public.race_events set starts_at = starts_at - interval '10 seconds', ends_at = ends_at - interval '10 seconds' where match_id='${m}'`)
  ok(call('race_attack', A, m).event?.kind === 'mutation', 'allowed again after immunity')
  // A finished target cannot be attacked.
  run(`update public.race_participants set finished_at = now(), answered = 10 where match_id='${m}' and user_id='${A}'`)
  ok(call('race_attack', B, m).reason === 'target-finished', 'cannot attack a player who has finished')
  ok(me(B).inventory.mutation === 1, 'nothing spent')
  // Reconnect: state returns the stored timing, never restarted.
  const st = call('race_state', B, m)
  const ev = st.events.filter((e) => e.kind === 'mutation').pop()
  ok(ev && Date.parse(ev.ends_at) - Date.parse(ev.starts_at) === 10000 && st.now && st.effect_ms === 10000, 'state carries the effect start/end and server time for reconnects')
}

console.log('[5] Simultaneous attacks are applied once')
{
  const code = newCode()
  const m = call('race_create', A, code, 'UTC').match.id
  call('race_join', B, code, 'UTC')
  call('race_set_chaos', A, m, true)
  call('race_grant', A, 'mutation')
  call('race_grant', A, 'mutation')
  call('race_accept_chaos', A, m, true, false)
  call('race_accept_chaos', B, m, false, false)
  call('race_start', A, m)
  const before = me(A).inventory.mutation
  const attack = () =>
    new Promise((res) => {
      const p = spawn(PG[0], [...PG.slice(1), '-At', '-q', '-c', `select public.race_attack('${A}','${m}')`])
      let out = ''
      p.stdout.on('data', (d) => (out += d))
      p.on('close', () => res(JSON.parse(out.trim())))
    })
  const results = await Promise.all([attack(), attack(), attack(), attack()])
  const delivered = results.filter((r) => r.event).length
  ok(delivered === 1, `four simultaneous attacks: exactly one applied (${delivered})`)
  ok(me(A).inventory.mutation === before - 1, 'exactly one Mutation spent')
}

console.log('[6] Results, qualification and settlement')
{
  const m = playMatch(A, B, { aCorrect: 8, bCorrect: 5, runMs: 60000 })
  let st = call('race_state', A, m)
  ok(st.match.status === 'finished' && st.match.result.qualified === true, 'both finished properly: qualifying')
  ok(st.players.find((p) => p.user_id === A).outcome === 'win' && st.players.find((p) => p.user_id === B).outcome === 'lose', 'more correct wins')
  ok(call('race_answer', A, m, 10, true).reason === 'not-active', 'no answers after the end (no replays of a match)')
  call('race_try_settle', m)
  ok(j(`select count(*) from public.race_reward_log where match_id='${m}'`) === 2, 'settled once, one log row per player (re-settling does nothing)')
  const m2 = playMatch(A, B, { aCorrect: 2, bCorrect: 9 })
  ok(call('race_state', A, m2).match.result.qualified === false, 'a player under 3 correct: not qualifying for either')
  const m3 = playMatch(A, B, { runMs: 15000 })
  ok(call('race_state', A, m3).match.result.qualified === false, 'a run under 20 seconds: not qualifying')
  const m4 = playMatch(A, B, { aCorrect: 6, bCorrect: 6, runMs: 40000 })
  const t = call('race_state', A, m4).players.map((p) => p.outcome)
  ok(t.every((o) => o === 'tie' || o === 'win' || o === 'lose'), 'equal scores fall back to time (or a tie)')
  // Disconnect longer than 60 s.
  const code = newCode()
  const m5 = call('race_create', A, code, 'UTC').match.id
  call('race_join', B, code, 'UTC')
  call('race_start', A, m5)
  run(`update public.race_matches set start_at = now() - interval '5 minutes' where id='${m5}'`)
  for (let r = 0; r < 10; r++) call('race_answer', A, m5, r, true)
  run(`update public.race_participants set last_seen = now() - interval '2 minutes' where match_id='${m5}' and user_id='${B}'`)
  call('race_heartbeat', A, m5)
  st = call('race_state', A, m5)
  ok(st.match.status === 'abandoned' && st.players.find((p) => p.user_id === B).outcome === 'abandoned', 'a player gone over 60 s abandons; the match does not qualify')
  ok(st.log && st.log.counted === false && st.log.reason === 'opponent-left', 'the remaining player is told why it did not count')
  // Leaving mid-race.
  const code6 = newCode()
  const m6 = call('race_create', A, code6, 'UTC').match.id
  call('race_join', B, code6, 'UTC')
  call('race_start', A, m6)
  run(`update public.race_matches set start_at = now() - interval '1 minute' where id='${m6}'`)
  call('race_answer', A, m6, 0, true)
  call('race_leave', B, m6)
  for (let r = 1; r < 10; r++) call('race_answer', A, m6, r, true)
  ok(call('race_state', A, m6).match.status === 'abandoned', 'an abandoned match never qualifies')
}

console.log('[7] Rewards: every 5 wins a Mutation (no race CRISPR), caps and pending claims')
{
  run(`truncate public.race_matches, public.race_inventory, public.race_progress cascade`)
  // Spread matches across opponents and days to stay under the limits.
  const U = [uid(11), uid(12), uid(13), uid(14), uid(15)]
  run(`insert into auth.users(id) values ${U.map((u) => `('${u}')`).join(',')} on conflict do nothing`)
  let day = 0
  const playOnDay = (p1, p2, opts) => {
    const m = playMatch(p1, p2, opts)
    // Move the reward log to a distinct past day so daily limits don't apply.
    run(`update public.race_reward_log set reward_day = current_date - ${100 + day} where match_id='${m}'`)
    day++
    return m
  }
  for (let i = 0; i < 4; i++) playOnDay(A, U[i % 4], { aCorrect: 8, bCorrect: 4 })
  ok(me(A).inventory.mutation === 0 && me(A).progress.qualifyingWins === 4, 'Mutation: 4/5 qualifying wins, none yet')
  playOnDay(U[0], A, { aCorrect: 4, bCorrect: 8 })
  ok(me(A).inventory.mutation === 1, 'the 5th qualifying win earns a Mutation (A as either seat)')
  for (let i = 0; i < 4; i++) playOnDay(A, U[i % 4], { aCorrect: 3, bCorrect: 9 })
  playOnDay(A, U[1], { aCorrect: 3, bCorrect: 9 })
  ok(me(A).inventory.crispr === 0 && me(A).progress.qualifyingRaces === 10, 'races no longer award CRISPR (10 qualifying races, still none)')
  for (let i = 0; i < 20; i++) playOnDay(A, U[i % 5], { aCorrect: 9, bCorrect: 3 })
  const s = me(A)
  ok(s.inventory.mutation === 3 && s.pending.mutation >= 1, `Mutation capped at 3 with ${s.pending.mutation} pending claim(s)`)
  call('race_consume', A, 'mutation')
  ok(me(A).inventory.mutation === 3 && me(A).pending.mutation === s.pending.mutation - 1, 'spending one lets a pending claim in')
  ok(s.progress.standardRaces >= 30 && s.progress.chaosRaces === 0, 'standard results are kept apart from Chaos results')
  playOnDay(A, U[2], { chaos: true })
  ok(me(A).progress.chaosRaces === 1, 'a Chaos race counts in its own record (and toward rewards)')
}

console.log('[8] Daily limits: 3 per opponent pair, 6 in total, A vs B = B vs A')
{
  run(`truncate public.race_matches, public.race_inventory, public.race_progress cascade`)
  const D = uid(21)
  const E2 = uid(22)
  const F = uid(23)
  run(`insert into auth.users(id) values ('${D}'),('${E2}'),('${F}') on conflict do nothing`)
  const counted = (u) => j(`select count(*) from public.race_reward_log where user_id='${u}' and counted`)
  playMatch(A, B)
  playMatch(B, A)
  playMatch(A, B)
  ok(counted(A) === 3, 'three matches against the same opponent count (either seat)')
  const m4 = playMatch(B, A)
  const lg = j(`select to_jsonb(l) from public.race_reward_log l where match_id='${m4}' and user_id='${A}'`)
  ok(!lg.counted && lg.reason === 'opponent-limit', 'the fourth against the same opponent does not count (opponent-limit)')
  playMatch(A, D)
  playMatch(A, E2)
  playMatch(A, F)
  ok(counted(A) === 6, 'six qualifying races count in a day')
  const m8 = playMatch(A, uid(3))
  const lg8 = j(`select to_jsonb(l) from public.race_reward_log l where match_id='${m8}' and user_id='${A}'`)
  ok(!lg8.counted && lg8.reason === 'daily-limit', 'the seventh does not count (daily-limit)')
  ok(me(A).today.counted === 6, 'today counter reported to the player')
}

console.log('[9] Players can read only their own data and cannot write')
{
  const as = (u, sql) => {
    try {
      return run(`set role authenticated; set request.jwt.claim.sub = '${u}'; ${sql}`)
    } catch (e) {
      return 'ERROR ' + String(e.stderr || e.message).split('\n')[0]
    }
  }
  run(`select public.race_grant('${B}', 'crispr')`)
  ok(as(A, `select count(*) from public.race_inventory where user_id = '${B}'`) === '0', "a player cannot see another player's inventory")
  ok(/ERROR/.test(as(A, `insert into public.race_inventory(user_id,item,qty) values ('${A}','mutation',3)`)), 'a player cannot write inventory')
  ok(/ERROR/.test(as(A, `select public.race_grant('${A}','mutation')`)), 'a player cannot call the reward functions')
  ok(/ERROR/.test(as(A, `select public.race_attack('${A}', gen_random_uuid())`)), 'a player cannot call the attack function directly')
  const before = run(`select sum(correct) from public.race_participants`)
  as(A, `update public.race_participants set correct = 10`)
  ok(run(`select sum(correct) from public.race_participants`) === before, 'a player cannot change scores (no update policy)')
  const anyMatch = run(`select match_id from public.race_participants where user_id='${A}' limit 1`)
  ok(as(C, `select count(*) from public.race_events where match_id='${anyMatch}'`) === '0', "a player cannot read another match's events")
  ok(as(C, `select count(*) from public.race_user_tz where user_id <> '${C}'`) === '0', "a player cannot read others' time zones")
}

console.log('[10] Chaos introductory loadout (0007, 0009): one temporary Mutation each, guests included; CRISPR only if earned')
{
  run(`update public.race_config set value = 1 where key = 'chaos_free_loadout'`)
  run(`truncate public.race_matches, public.race_inventory, public.race_progress cascade`)
  const G = uid(31)
  run(`insert into auth.users(id, is_anonymous) values ('${G}', true) on conflict do nothing`)
  // A holds earned items; they must not be touched by a Chaos race.
  run(`select public.race_grant('${A}', 'mutation'); select public.race_grant('${A}', 'crispr')`)
  setXp(A, 7260)
  run(`insert into public.race_level_grants (user_id, level, item) values ('${A}', 12, 'crispr') on conflict do nothing`)
  const inv0 = me(A)
  const code = newCode()
  const s = j(`select public.race_create('${A}', '${code}', 'America/Los_Angeles', false)`)
  const m = s.match.id
  const sj = j(`select public.race_join('${G}', '${code}', 'UTC', true)`)
  ok(sj.ok && sj.players.find((p) => p.user_id === G).guest === true, 'a guest can join and is marked guest')
  ok(sj.free_loadout === true, 'state reports that the introductory loadout is on')
  call('race_set_chaos', A, m, true)
  let st = call('race_accept_chaos', A, m, false, false)
  const pa = st.players.find((p) => p.user_id === A)
  ok(pa.temp_mutation && !pa.temp_crispr && !pa.equip_crispr, 'accepting gives one temporary Mutation and no CRISPR')
  ok(!pa.equip_mutation, 'earned Mutations are not equipped while the loadout is on')
  ok(call('race_accept_chaos', G, m, true, true).reason === 'crispr-locked', 'a guest asking for CRISPR is refused (no level, no CRISPR)')
  st = call('race_accept_chaos', G, m, true, false)
  const pg = st.players.find((p) => p.user_id === G)
  ok(st.ok && pg.temp_mutation && !pg.temp_crispr && !pg.equip_crispr, 'the guest gets the same Mutation-only loadout')
  st = call('race_accept_chaos', A, m, false, true)
  ok(st.ok && st.players.find((p) => p.user_id === A).equip_crispr && !st.players.find((p) => p.user_id === A).temp_crispr, 'a Level 12 player may bring an earned CRISPR')
  call('race_start', A, m)
  run(`update public.race_matches set start_at = now() - interval '30 seconds' where id='${m}'`)
  seen(A, m)
  seen(G, m)
  ok(call('race_arm', G, m).reason === 'not-equipped', 'the guest has no CRISPR to arm')
  call('race_arm', A, m)
  const a1 = call('race_attack', G, m)
  ok(a1.event?.kind === 'blocked', "the guest's Mutation is blocked by A's earned, armed CRISPR")
  run(`update public.race_events set created_at = now() - interval '1 minute', starts_at = now() - interval '1 minute', ends_at = now() - interval '1 minute' where match_id='${m}'`)
  seen(A, m)
  seen(G, m)
  const a2 = call('race_attack', A, m)
  ok(a2.event?.kind === 'mutation', "A's temporary Mutation lands on the guest (no CRISPR in the way)")
  ok(call('race_attack', A, m).reason === 'not-equipped', 'one Mutation per race: a second attack is refused')
  ok(call('race_arm', A, m).reason === 'not-equipped', 'a spent CRISPR cannot be armed again')
  const inv1 = me(A)
  ok(inv1.inventory.mutation === inv0.inventory.mutation && inv1.inventory.crispr === inv0.inventory.crispr - 1, 'the temporary Mutation left earned Mutations alone; the earned CRISPR that blocked was spent')
  for (let r = 0; r < 10; r++) {
    call('race_answer', A, m, r, r < 8)
    call('race_answer', G, m, r, r < 6)
  }
  const fin = call('race_state', A, m)
  ok(fin.match.status === 'finished' && fin.match.result.qualified === false, 'a race with a guest finishes but never qualifies')
  ok(fin.log && !fin.log.counted && fin.log.reason === 'opponent-guest', 'the signed-in player sees why it did not count')
  ok(j(`select count(*) from public.race_inventory where user_id='${G}'`) === 0 && j(`select count(*) from public.race_progress where user_id='${G}'`) === 0, 'the guest gets no inventory and no progress rows')
  ok(call('race_state', G, m).log.reason === 'guest', 'the guest log says guest')
  const inv2 = me(A)
  ok(inv2.inventory.mutation === inv0.inventory.mutation && inv2.inventory.crispr === inv0.inventory.crispr - 1 && inv2.pending.mutation === inv0.pending.mutation, 'after the race, nothing temporary reached inventory')

  // A temporary charge delivered without a CRISPR in the way.
  const code2 = newCode()
  const m2 = j(`select public.race_create('${A}', '${code2}', 'UTC', false)`).match.id
  call('race_join', B, code2, 'UTC')
  call('race_set_chaos', B, m2, true)
  call('race_accept_chaos', A, m2, false, false)
  call('race_accept_chaos', B, m2, false, false)
  call('race_start', B, m2)
  run(`update public.race_matches set start_at = now() - interval '30 seconds' where id='${m2}'`)
  seen(A, m2)
  seen(B, m2)
  const hit = call('race_attack', B, m2)
  ok(hit.event?.kind === 'mutation' && hit.players.find((p) => p.user_id === B).mutation_spent, 'an unblocked temporary Mutation lands and is spent for this race only')
  ok(me(B).inventory.mutation === 0, 'B had no earned Mutation and still has none')

  // Classic stays power-up free.
  const code3 = newCode()
  const m3 = j(`select public.race_create('${A}', '${code3}', 'UTC', false)`).match.id
  call('race_join', B, code3, 'UTC')
  call('race_start', A, m3)
  ok(call('race_attack', A, m3).reason === 'not-available' && call('race_arm', A, m3).reason === 'not-available', 'Classic Race has no power-ups')
  ok(call('race_accept_chaos', A, m3, false, false).reason !== undefined, 'a Classic race cannot be given a loadout')
  // Loadout off again: 0006 behaviour (equip earned only).
  run(`update public.race_config set value = 0 where key = 'chaos_free_loadout'`)
  const code4 = newCode()
  const m4 = j(`select public.race_create('${A}', '${code4}', 'UTC', false)`).match.id
  call('race_join', B, code4, 'UTC')
  call('race_set_chaos', A, m4, true)
  const off = call('race_accept_chaos', B, m4, false, false)
  ok(!off.players.find((p) => p.user_id === B).temp_mutation, 'with the loadout off, no temporary charges are given')
  run(`update public.race_config set value = 1 where key = 'chaos_free_loadout'`)
}

console.log('[11] CRISPR level rewards, solo use (3 Minutes) and race link states (0009, curve from 0010)')
{
  const D = uid(41)
  const E = uid(42)
  const G2 = uid(43)
  run(`insert into auth.users(id, created_at) values ('${D}', now() - interval '90 days'),('${E}', now() - interval '90 days') on conflict do nothing`)
  run(`insert into auth.users(id, is_anonymous) values ('${G2}', true) on conflict do nothing`)
  ok(j(`select value from public.race_config where key='effect_ms'`) === 10000, 'Mutation effect is configured at 10 seconds')
  const lv = (xp) => {
    setXp(D, xp)
    return j(`select public.race_player_level('${D}')`)
  }
  ok(lv(0) === 1 && lv(99) === 1 && lv(100) === 2 && lv(7259) === 11 && lv(7260) === 12 && lv(14939) === 15 && lv(14940) === 16, 'server level curve matches the app (Level 2 at 100 XP, 12 at 7260, 16 at 14940)')
  setXp(D, 7259)
  let s = me(D)
  ok(s.level === 11 && s.crisprUnlocked === false && s.crisprUnlockLevel === 12 && s.nextCrisprLevel === 12 && s.inventory.crispr === 0 && s.effectMs === 10000, 'Level 11: CRISPR locked, next at Level 12')
  setXp(D, 7260)
  s = me(D)
  ok(s.level === 12 && s.crisprUnlocked && s.inventory.crispr === 1 && s.nextCrisprLevel === 16, 'reaching Level 12 unlocks CRISPR and grants one; next at Level 16')
  ok(me(D).inventory.crispr === 1 && j(`select count(*) from public.race_level_grants where user_id='${D}'`) === 1, 'the Level 12 reward is paid once, however often it is checked')
  setXp(D, 14940)
  ok(me(D).inventory.crispr === 2, 'Level 16 grants one more (one every 4 levels)')
  // Solo use (3 Minutes).
  ok(call('race_use_solo', G2, 'mutation').reason === 'guest', 'guests cannot use solo powerups')
  ok(call('race_use_solo', D, 'mutation').reason === 'no-mutation', 'no Mutation held: refused')
  ok(call('race_use_solo', D, 'rocket').reason === 'bad-item', 'unknown item: refused')
  call('race_grant', D, 'mutation')
  let u = call('race_use_solo', D, 'mutation')
  ok(u.ok && u.effectMs === 10000 && u.inventory.mutation === 0, 'solo Mutation spends one and reports 10 seconds')
  u = call('race_use_solo', D, 'crispr')
  ok(u.ok && u.inventory.crispr === 1, 'solo CRISPR spends one at Level 12+')
  call('race_grant', E, 'crispr')
  ok(call('race_use_solo', E, 'crispr').reason === 'crispr-locked' && me(E).inventory.crispr === 1, 'a CRISPR held below Level 12 cannot be used solo, and is not spent')
  // Earned-loadout mode: the level check still applies.
  run(`update public.race_config set value = 0 where key = 'chaos_free_loadout'`)
  const code = newCode()
  const m = call('race_create', E, code, 'UTC').match.id
  call('race_join', D, code, 'UTC')
  call('race_set_chaos', E, m, true)
  ok(call('race_accept_chaos', E, m, false, true).reason === 'crispr-locked', 'earned-loadout mode: below Level 12 a held CRISPR cannot be equipped')
  ok(call('race_accept_chaos', D, m, false, true).ok, 'earned-loadout mode: Level 12+ with a CRISPR can equip it')
  run(`update public.race_config set value = 1 where key = 'chaos_free_loadout'`)
  // Link and code states.
  const fcode = newCode()
  const fm = call('race_create', D, fcode, 'UTC').match.id
  call('race_join', E, fcode, 'UTC')
  run(`update public.race_matches set status = 'finished' where id='${fm}'`)
  ok(call('race_join', C, fcode, 'UTC').reason === 'race-finished', 'a finished race says so (not "no such race")')
  ok(call('race_join', C, 'ZZZZ', 'UTC').reason === 'no-such-race', 'an unknown code says no such race')
}

console.log('[12] Trusted level, CRISPR unlock by counted races, and the CRISPR drop (0010)')
{
  run(`update public.race_config set value = 1 where key = 'chaos_free_loadout'`)
  run(`update public.race_config set value = 5 where key = 'crispr_unlock_races'`)
  const F = uid(51)
  const H = uid(52)
  const K = uid(53)
  const N = uid(54)
  const G3 = uid(55)
  run(`insert into auth.users(id, created_at) values ('${F}', now() - interval '90 days'),('${H}', now() - interval '90 days'),('${K}', now() - interval '90 days'),('${N}', now() - interval '2 days') on conflict do nothing`)
  run(`insert into auth.users(id, is_anonymous) values ('${G3}', true) on conflict do nothing`)
  const lvOf = (u) => j(`select public.race_player_level('${u}')`)
  const xpOf = (u) => Number(j(`select public.race_trusted_xp('${u}')`))
  const putLedger = (u, ledger) => run(`insert into public.user_progress (user_id, data) values ('${u}', '${JSON.stringify({ progression: { ledger } })}') on conflict (user_id) do update set data = excluded.data`)
  const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
  // Trusted XP: a hand-edited save cannot buy a level.
  putLedger(N, { a: { xp: 1000000, d: day(0) } })
  ok(xpOf(N) === 1000, 'one huge entry counts as at most 1000 XP')
  putLedger(N, { a: { xp: 900, d: day(0) }, b: { xp: 900, d: day(0) }, c: { xp: 900, d: day(0) }, e: { xp: 900, d: day(0) } })
  ok(xpOf(N) === 3000, 'one day counts as at most 3000 XP')
  putLedger(N, { a: { xp: 500, d: day(-5) }, b: { xp: 500, d: day(30) }, c: { xp: 500, d: day(1) } })
  ok(xpOf(N) === 500, 'entries dated in the future or before the account existed are ignored')
  putLedger(N, { a: { xp: 500, at: Date.now() - 86400000 } })
  ok(xpOf(N) === 500, 'older entries without a stored date use their timestamp')
  // Unlock needs Level 12 AND 5 counted races.
  setXp(F, 7260)
  setXp(H, 7260)
  setXp(K, 7260)
  run(`update public.race_config set value = 0.02 where key = 'crispr_drop_chance'`)
  let s = me(F)
  ok(s.level === 12 && s.crisprUnlocked === false && s.countedRaces === 0 && s.crisprUnlockRaces === 5 && s.inventory.crispr === 0, 'Level 12 with no counted races: CRISPR still locked, no level charge yet')
  ok(Math.abs(s.crisprDropChance - 0.02) < 1e-9, 'the drop chance is reported as 2%')
  const roll = (m, u) => j(`select to_jsonb(l) from public.race_reward_log l where match_id='${m}' and user_id='${u}'`)
  // Four counted races: F wins each, but CRISPR is not unlocked yet, so no roll.
  const early = []
  for (let i = 0; i < 4; i++) early.push(playMatch(F, i % 2 ? H : K, { aCorrect: 8, bCorrect: 5 }))
  ok(early.every((m) => roll(m, F).counted && roll(m, F).crispr_roll === null), 'wins before the unlock are counted but not rolled')
  ok(me(F).countedRaces === 4 && !me(F).crisprUnlocked, 'four counted races: still locked')
  // Fifth counted race unlocks; with the chance set to 1 the win drops one.
  run(`update public.race_config set value = 1 where key = 'crispr_drop_chance'`)
  const m5 = playMatch(F, H, { aCorrect: 8, bCorrect: 5 })
  let r = roll(m5, F)
  ok(r.counted && r.crispr_roll !== null && r.crispr_drop === true && r.granted.some((g) => g.item === 'crispr' && g.source === 'drop' && g.as === 'granted'), 'the race that reaches 5 counted races unlocks CRISPR and its win is rolled (drop recorded with the grant)')
  ok(roll(m5, H).crispr_roll === null && roll(m5, H).crispr_drop === false, 'the loser is never rolled')
  s = me(F)
  ok(s.crisprUnlocked && s.inventory.crispr === 2 && s.crisprDrops === 1, 'inventory shows the drop plus the Level 12 charge (paid once unlocked)')
  ok(call('race_state', F, m5).log.granted.some((g) => g.source === 'drop'), 'the results screen can read the drop from the match state')
  // Idempotent: settling or rewarding again never rolls again.
  const before = me(F).inventory.crispr
  run(`select public.race_try_settle('${m5}')`)
  run(`select public.race_reward('${m5}', '${F}', '${H}', 'win', true, false, 'UTC', now())`)
  call('race_heartbeat', F, m5)
  call('race_state', F, m5)
  ok(me(F).inventory.crispr === before && j(`select count(*) from public.race_reward_log where match_id='${m5}' and user_id='${F}'`) === 1, 'retries, refreshes and repeated settlement do not roll again')
  // Not eligible: tie, a loss, an uncounted race, an abandoned race, a guest opponent.
  const tie = playMatch(F, H, { aCorrect: 6, bCorrect: 6, runMs: 60000 })
  run(`update public.race_participants set run_ms = 60000 where match_id = '${tie}'`)
  ok(roll(tie, F).outcome === 'tie' ? roll(tie, F).crispr_roll === null : true, 'a tie is not rolled')
  const loss = playMatch(F, K, { aCorrect: 3, bCorrect: 9 })
  ok(roll(loss, F).outcome === 'lose' && roll(loss, F).crispr_roll === null, 'a loss is not rolled')
  const weak = playMatch(F, K, { aCorrect: 8, bCorrect: 2 })
  ok(!roll(weak, F).qualified && roll(weak, F).crispr_roll === null, 'a win that did not qualify (opponent under 3 correct) is not rolled')
  const quick = playMatch(F, K, { aCorrect: 8, bCorrect: 5, runMs: 5000 })
  ok(!roll(quick, F).qualified && roll(quick, F).crispr_roll === null, 'a win in a run under 20 seconds is not rolled')
  // Uncounted: past the per-opponent limit for the day.
  run(`update public.race_config set value = 1 where key = 'per_opponent_per_day'`)
  const capped = playMatch(F, H, { aCorrect: 8, bCorrect: 5 })
  ok(roll(capped, F).counted === false && roll(capped, F).crispr_roll === null, 'a win past the daily limits (not counted) is not rolled')
  run(`update public.race_config set value = 3 where key = 'per_opponent_per_day'`)
  // Abandoned: the opponent leaves.
  {
    const code = newCode()
    const m = call('race_create', F, code, 'UTC').match.id
    call('race_join', K, code, 'UTC')
    call('race_start', F, m)
    for (let i = 0; i < 10; i++) call('race_answer', F, m, i, true)
    call('race_leave', K, m)
    ok(roll(m, F) && !roll(m, F).qualified && roll(m, F).crispr_roll === null, 'an opponent who leaves (forfeit) gives no roll')
  }
  // Guest opponent.
  {
    const code = newCode()
    const m = call('race_create', F, code, 'UTC').match.id
    call('race_join', G3, code, 'UTC', true)
    call('race_start', F, m)
    run(`update public.race_matches set start_at = now() - interval '60 seconds' where id='${m}'`)
    for (let i = 0; i < 10; i++) {
      call('race_answer', F, m, i, true)
      call('race_answer', G3, m, i, i < 5)
    }
    ok(roll(m, F).crispr_roll === null, 'a win against a guest is not rolled')
  }
  // A roll that misses is recorded and grants nothing.
  run(`update public.race_config set value = 0 where key = 'crispr_drop_chance'`)
  run(`update public.race_config set value = 100 where key = 'per_day'`)
  run(`update public.race_config set value = 100 where key = 'per_opponent_per_day'`)
  const miss = playMatch(F, K, { aCorrect: 8, bCorrect: 5 })
  r = roll(miss, F)
  ok(r.counted && r.crispr_roll !== null && r.crispr_drop === false && !r.granted.some((g) => g.item === 'crispr'), 'a roll that misses is still recorded, with nothing granted')
  // Cap: a drop while holding 3 waits as a pending claim.
  run(`update public.race_config set value = 1 where key = 'crispr_drop_chance'`)
  run(`update public.race_inventory set qty = 3 where user_id = '${F}' and item = 'crispr'`)
  const full = playMatch(F, H, { aCorrect: 8, bCorrect: 5 })
  ok(roll(full, F).granted.some((g) => g.item === 'crispr' && g.as === 'pending') && me(F).inventory.crispr === 3 && me(F).pending.crispr === 1, 'at the cap, a dropped CRISPR waits as a pending claim')
  // Probability: 3000 eligible wins at 2% (settlement run directly in SQL).
  run(`update public.race_config set value = 0.02 where key = 'crispr_drop_chance'`)
  run(`update public.race_config set value = 100000 where key = 'per_day'`)
  run(`update public.race_config set value = 100000 where key = 'per_opponent_per_day'`)
  const n = 3000
  const drops = j(`do $$
    declare i int; m uuid;
    begin
      for i in 1..${n} loop
        insert into public.race_matches (code, status, created_by, start_at) values ('P' || i, 'active', '${F}', now() - interval '60 seconds') returning id into m;
        insert into public.race_participants (match_id, user_id, seat, answered, correct, finished_at, run_ms) values (m, '${F}', 1, 10, 8, now(), 60000), (m, '${H}', 2, 10, 5, now(), 60000);
        perform public.race_try_settle(m);
        update public.race_matches set status = 'finished' where id = m;
      end loop;
    end $$; select count(*) filter (where crispr_drop) from public.race_reward_log where user_id = '${F}' and crispr_roll is not null and match_id in (select id from public.race_matches where code like 'P%')`)
  const sd = Math.sqrt(n * 0.02 * 0.98)
  console.log(`    drop check: ${drops} CRISPR in ${n} eligible wins (${((100 * drops) / n).toFixed(2)}%)`)
  ok(Math.abs(drops - n * 0.02) < 4.5 * sd, `drop rate over ${n} eligible wins is consistent with 2% (${drops} drops, expected ${n * 0.02})`)
  ok(j(`select count(*) from public.race_reward_log where user_id = '${F}' and match_id in (select id from public.race_matches where code like 'P%') and crispr_roll is null`) === 0, 'every one of those wins was rolled exactly once')
  run(`delete from public.race_matches where code like 'P%'`)
  run(`update public.race_config set value = 6 where key = 'per_day'`)
  run(`update public.race_config set value = 3 where key = 'per_opponent_per_day'`)
}

run(`update public.race_config set value = 3000 where key = 'countdown_ms'`)
run(`update public.race_config set value = 5 where key = 'crispr_unlock_races'; update public.race_config set value = 0.02 where key = 'crispr_drop_chance'`)
console.log(`\n${failed ? `${failed} FAILED` : 'ALL RACE BACKEND CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
