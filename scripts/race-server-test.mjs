// Race server checks: server/raceCore.js against the real database functions.
//   PGTEST="psql -h /tmp/pgtest -p 5544 -U postgres -d t" node scripts/race-server-test.mjs
import { execFileSync } from 'node:child_process'
import { handleRace, roundsFor, scoreAnswer } from '../server/raceCore.js'

const PG = (process.env.PGTEST || 'psql -h /tmp/pgtest -p 5544 -U postgres -d t').split(' ')
const sql = (q) => execFileSync(PG[0], [...PG.slice(1), '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', q], { encoding: 'utf8' }).trim()
const lit = (v) => (v === null || v === undefined ? 'null' : typeof v === 'boolean' || typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
const rpc = async (fn, args) => {
  const out = sql(`select public.${fn}(${Object.entries(args).map(([k, v]) => `${k} => ${lit(v)}`).join(', ')})`)
  return JSON.parse(out)
}
const USERS = { 'tok-a': { id: '00000000-0000-0000-0000-0000000000a1' }, 'tok-b': { id: '00000000-0000-0000-0000-0000000000b2' }, 'tok-anon': { id: '00000000-0000-0000-0000-0000000000c3', is_anonymous: true } }
const getUser = async (t) => USERS[t] || null
let codes = ['QRST', 'QRST', 'WXYZ', 'MNPQ', 'HJKM']
const deps = { rpc, getUser, makeCode: () => codes.shift() || 'ZZZZ' }
const call = (token, body) => handleRace({ token, body }, deps)

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}

sql(`set client_min_messages = warning; truncate public.race_matches, public.race_inventory, public.race_progress cascade; delete from auth.users where id in (${Object.values(USERS).map((u) => `'${u.id}'`).join(',')}); insert into auth.users(id, is_anonymous) values ${Object.values(USERS).map((u) => `('${u.id}', ${u.is_anonymous ? 'true' : 'false'})`).join(',')}; update public.race_config set value = 0 where key = 'countdown_ms'; update public.race_config set value = 0 where key = 'chaos_free_loadout';`)

console.log('[1] A verified session is required (an anonymous guest session counts)')
ok((await call(null, { action: 'me' })).status === 401, 'no token: 401')
ok((await call('tok-x', { action: 'me' })).status === 401, 'bad token: 401')
{
  const gm = await call('tok-anon', { action: 'me' })
  ok(gm.status === 200 && gm.json.guest === true && gm.json.inventory.mutation === 0, 'a guest session is accepted and has no Race inventory')
}
ok((await call('tok-a', { action: 'drop-tables' })).status === 400, 'unknown action refused')
ok((await call('tok-a', { action: 'state', matchId: "1'; drop table x; --" })).json.reason === 'bad-match', 'malformed match id refused')

console.log('[2] Create retries a taken code; join by code')
sql(`insert into public.race_matches (code, created_by) values ('QRST', '${USERS['tok-b'].id}')`)
const c = await call('tok-a', { action: 'create', tz: 'America/Los_Angeles' })
ok(c.status === 200 && c.json.match.code === 'WXYZ', 'a taken code is skipped: ' + c.json.match?.code)
sql(`delete from public.race_matches where code = 'QRST'`)
const m = c.json.match.id
const jn = await call('tok-b', { action: 'join', code: 'wxyz', tz: 'Europe/London' })
ok(jn.json.players.length === 2, 'join normalizes the code')
ok((await call('tok-b', { action: 'state', matchId: m })).json.ok, 'players can read state')

console.log('[3] Answers are scored by the server from the race code')
await call('tok-a', { action: 'start', matchId: m })
sql(`update public.race_matches set start_at = now() - interval '2 minutes' where id = '${m}'`)
const rounds = roundsFor('WXYZ')
ok(rounds.length === 10, 'server rebuilds the same 10 rounds from the code')
const right = (r) => (r.type === 'rapidAssociation' ? r.correctAnswers.slice() : r.correctAnswer)
const wrong = (r) => (r.type === 'rapidAssociation' ? r.options.filter((o) => !o.correct).slice(0, 4).map((o) => o.text) : r.options.find((o) => !o.correct).text)
ok(scoreAnswer(rounds[0], right(rounds[0])) === true && scoreAnswer(rounds[0], wrong(rounds[0])) === false, 'scoring accepts the right answer only')
let last
for (let i = 0; i < 10; i++) last = await call('tok-a', { action: 'answer', matchId: m, round: i, answer: i < 7 ? right(rounds[i]) : wrong(rounds[i]), correct: true, score: 10 })
ok(last.json.players.find((p) => p.user_id === USERS['tok-a'].id).correct === 7, 'the browser cannot claim a result: 7 right of 10 recorded, extra "correct"/"score" fields ignored')
ok((await call('tok-a', { action: 'answer', matchId: m, round: 3, answer: right(rounds[3]) })).json.reason === 'finished', 'no re-answering after finishing')
for (let i = 0; i < 10; i++) await call('tok-b', { action: 'answer', matchId: m, round: i, answer: i < 4 ? right(rounds[i]) : wrong(rounds[i]) })
const st = (await call('tok-a', { action: 'state', matchId: m })).json
ok(st.match.status === 'finished' && st.players.find((p) => p.user_id === USERS['tok-a'].id).outcome === 'win', 'the server decides the winner')
ok(st.match.result.qualified === true && st.log.counted === true, 'a proper match qualifies and counts')

console.log('[4] Chaos power-ups through the server')
const c2 = await call('tok-b', { action: 'create', tz: 'UTC' })
const m2 = c2.json.match.id
await call('tok-a', { action: 'join', code: c2.json.match.code })
await call('tok-a', { action: 'chaos', matchId: m2, on: true })
ok((await call('tok-a', { action: 'accept', matchId: m2, mutation: true })).json.reason === 'no-mutation', 'cannot equip an item you do not hold')
sql(`select public.race_grant('${USERS['tok-a'].id}', 'mutation'); select public.race_grant('${USERS['tok-b'].id}', 'crispr');`)
await call('tok-a', { action: 'accept', matchId: m2, mutation: true })
ok((await call('tok-a', { action: 'start', matchId: m2 })).json.reason === 'chaos-not-accepted', 'both must accept Chaos')
await call('tok-b', { action: 'accept', matchId: m2, crispr: true })
await call('tok-a', { action: 'start', matchId: m2 })
await call('tok-b', { action: 'heartbeat', matchId: m2 })
const armed = await call('tok-b', { action: 'arm', matchId: m2 })
ok(armed.json.players.find((p) => p.user_id === USERS['tok-b'].id).crispr_armed, 'B arms CRISPR')
const atk = await call('tok-a', { action: 'attack', matchId: m2 })
ok(atk.json.event?.kind === 'blocked', 'A attacks; CRISPR blocks it')
const me = (await call('tok-a', { action: 'me' })).json
ok(me.inventory.mutation === 0, 'the blocked Mutation is spent')
ok((await call('tok-a', { action: 'attack', matchId: m2 })).status === 409, 'second attack refused (one Mutation per race)')

console.log('[4b] Race again opens one new match for both players')
codes = ['RSTU', 'VWXY']
const r1 = await call('tok-b', { action: 'rematch', matchId: m })
const r2 = await call('tok-a', { action: 'rematch', matchId: m })
ok(r1.json.match.code === 'RSTU' && r2.json.match.id === r1.json.match.id && r2.json.players.length === 2, 'both "Race again" taps land in the same new match with a new code')
ok(JSON.stringify(roundsFor('RSTU')) !== JSON.stringify(roundsFor('WXYZ')), 'the new match has different questions')

console.log('[4c] Guests: introductory Chaos loadout, no rewards')
sql(`update public.race_config set value = 1 where key = 'chaos_free_loadout'`)
codes = ['GSTA']
{
  const g = await call('tok-anon', { action: 'create', tz: 'UTC' })
  ok(g.status === 200 && g.json.guest === true && g.json.players[0].guest === true, 'a guest can create a race (seat marked guest)')
  const gid = g.json.match.id
  await call('tok-b', { action: 'join', code: 'GSTA' })
  await call('tok-b', { action: 'chaos', matchId: gid, on: true })
  const ga = await call('tok-anon', { action: 'accept', matchId: gid, mutation: true, crispr: true })
  ok(ga.json.players.find((p) => p.guest).temp_mutation && ga.json.players.find((p) => p.guest).temp_crispr, 'the guest receives the temporary loadout')
  const binv = (await call('tok-b', { action: 'me' })).json.inventory
  await call('tok-b', { action: 'accept', matchId: gid })
  await call('tok-b', { action: 'start', matchId: gid })
  sql(`update public.race_matches set start_at = now() - interval '40 seconds' where id='${gid}'`)
  await call('tok-anon', { action: 'heartbeat', matchId: gid })
  const hit = await call('tok-b', { action: 'attack', matchId: gid })
  ok(hit.json.event?.kind === 'mutation', 'a temporary Mutation is applied by the server')
  ok(JSON.stringify((await call('tok-b', { action: 'me' })).json.inventory) === JSON.stringify(binv), "the signed-in player's earned inventory is untouched")
  const rr = roundsFor('GSTA')
  const right = (r) => (r.type === 'rapidAssociation' ? r.correctAnswers : r.correctAnswer)
  for (let i = 0; i < 10; i++) {
    await call('tok-anon', { action: 'answer', matchId: gid, round: i, answer: right(rr[i]) })
    await call('tok-b', { action: 'answer', matchId: gid, round: i, answer: right(rr[i]) })
  }
  const fin = (await call('tok-b', { action: 'state', matchId: gid })).json
  ok(fin.match.status === 'finished' && fin.match.result.qualified === false && fin.log.reason === 'opponent-guest', 'a race against a guest finishes but does not count toward rewards')
}

console.log('[5] Unauthorized actions')
const c3 = await call('tok-a', { action: 'create' })
ok((await call('tok-b', { action: 'attack', matchId: c3.json.match.id })).json.reason === 'not-in-match', 'a non-player cannot act on a match')
ok((await call('tok-b', { action: 'answer', matchId: c3.json.match.id, round: 0, answer: 'x' })).json.reason === 'not-in-match', 'a non-player cannot answer')

sql(`update public.race_config set value = 3000 where key = 'countdown_ms'; update public.race_config set value = 1 where key = 'chaos_free_loadout'`)
console.log(`\n${failed ? `${failed} FAILED` : 'ALL RACE SERVER CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
