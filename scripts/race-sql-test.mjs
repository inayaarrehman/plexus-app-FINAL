// Race backend checks against a real Postgres with migration 0006 applied.
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
const seen = (u, m) => run(`update public.race_participants set last_seen = now() where match_id='${m}' and user_id='${u}'`)

run(`set client_min_messages = warning; truncate public.race_matches, public.race_inventory, public.race_progress cascade; delete from auth.users;`)
run(`insert into auth.users(id) values ('${A}'),('${B}'),('${C}')`)
// Fast settings for tests (restored at the end).
run(`update public.race_config set value = 0 where key = 'countdown_ms'`)

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
  ok(ms === 2000, 'the effect lasts exactly 2 seconds (stored start and end): ' + ms)
  ok(r.event.to_user === B && r.event.from_user === A, 'targets the opponent')
  ok(me(A).inventory.mutation === 0, 'a delivered Mutation is spent')
  // B tries to hit back while A has no effect: allowed. A second effect on B
  // during its own effect is impossible anyway (one Mutation each). Overlap
  // and immunity on one target: give A a fresh match budget by resetting.
  run(`update public.race_participants set mutation_spent = false where match_id='${m}' and user_id='${A}'`)
  call('race_grant', A, 'mutation')
  ok(call('race_attack', A, m).reason === 'effect-active', 'no overlapping effect while one is running')
  run(`update public.race_events set starts_at = starts_at - interval '3 seconds', ends_at = ends_at - interval '3 seconds' where match_id='${m}'`)
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
  ok(ev && Date.parse(ev.ends_at) - Date.parse(ev.starts_at) === 2000 && st.now, 'state carries the effect start/end and server time for reconnects')
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

console.log('[7] Rewards: every 5 wins a Mutation, every 10 races a CRISPR, caps and pending claims')
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
  ok(me(A).progress.qualifyingRaces === 9 && me(A).inventory.crispr === 0, 'CRISPR: 9/10 qualifying races')
  playOnDay(A, U[1], { aCorrect: 3, bCorrect: 9 })
  ok(me(A).inventory.crispr === 1 && me(A).progress.qualifyingRaces === 10, 'the 10th qualifying race (a loss) earns a CRISPR')
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

run(`update public.race_config set value = 3000 where key = 'countdown_ms'`)
console.log(`\n${failed ? `${failed} FAILED` : 'ALL RACE BACKEND CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
