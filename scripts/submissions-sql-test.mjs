// Connection suggestions (migration 0008) against a real Postgres.
//   PGTEST="psql -h /tmp/pgtest -p 5544 -U postgres -d t" node scripts/submissions-sql-test.mjs
// Needs the Supabase-like stubs from scripts/race-sql-setup.sql.
import { execFileSync } from 'node:child_process'

const PG = (process.env.PGTEST || 'psql -h /tmp/pgtest -p 5544 -U postgres -d t').split(' ')
const run = (sql) => execFileSync(PG[0], [...PG.slice(1), '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', sql], { encoding: 'utf8' }).trim()
const as = (role, sql) => {
  try {
    return run(`set role ${role}; ${sql}`)
  } catch (e) {
    return 'ERROR ' + String(e.stderr || e.message).split('\n')[0]
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
const q = (s) => (s === null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`
const submit = (o, role = 'anon') => {
  const out = as(role, `select public.submit_connection(${q(o.title)}, ${o.tiles ? arr(o.tiles) : 'null'}, ${q(o.explanation)}, ${q(o.system)}, ${q(o.source ?? null)}, ${q(o.client ?? 'client-1')}, null)`)
  try {
    return JSON.parse(out)
  } catch {
    return { raw: out }
  }
}
const good = { title: 'Causes of a widened pulse pressure', tiles: ['Aortic regurgitation', 'Hyperthyroidism', 'Anemia', 'Arteriovenous fistula'], explanation: 'Each raises stroke volume or lowers diastolic pressure, widening the gap between systolic and diastolic.', system: 'Cardiology' }

run(`set client_min_messages = warning; truncate public.connection_submissions;`)
console.log('[1] Valid suggestion is stored as pending, by anyone')
{
  const r = submit(good)
  ok(r.ok === true && r.status === 'pending', 'a signed-out player can submit: ' + JSON.stringify(r))
  ok(run(`select status from public.connection_submissions`) === 'pending', 'stored as pending review')
}
console.log('[2] Blank, malformed and duplicate suggestions are refused')
ok(submit({ ...good, title: '  ' }).reason === 'title', 'blank title')
ok(submit({ ...good, tiles: good.tiles.slice(0, 3) }).reason === 'tiles', 'three concepts')
ok(submit({ ...good, tiles: [...good.tiles, 'Beriberi'] }).reason === 'tiles', 'five concepts')
ok(submit({ ...good, tiles: ['A', 'B', ' ', 'D'] }).reason === 'tiles', 'a blank concept')
ok(submit({ ...good, tiles: ['Anemia', 'anemia', 'B', 'C'] }).reason === 'tiles-repeat', 'the same concept twice')
ok(submit({ ...good, explanation: 'too short' }).reason === 'explanation', 'explanation required (20+ characters)')
ok(submit({ ...good, system: 'Astrology' }).reason === 'system', 'unknown system')
ok(submit({ ...good, title: 'Different title', tiles: ['anemia', 'ARTERIOVENOUS   fistula', 'Hyperthyroidism', 'Aortic regurgitation'] }).reason === 'duplicate', 'same four concepts in another order or case is a duplicate')
console.log('[3] Rate limit: 5 per browser per hour')
for (let i = 0; i < 4; i++) submit({ ...good, tiles: [`x${i}a`, `x${i}b`, `x${i}c`, `x${i}d`] })
ok(submit({ ...good, tiles: ['y1', 'y2', 'y3', 'y4'] }).reason === 'rate', 'the sixth from one browser in an hour is refused')
ok(submit({ ...good, tiles: ['z1', 'z2', 'z3', 'z4'], client: 'client-2' }).ok === true, 'another browser can still submit')
console.log('[4] The public API cannot read or write the queue')
ok(/ERROR/.test(as('anon', `select count(*) from public.connection_submissions`)) || as('anon', `select count(*) from public.connection_submissions`) === '0', 'anon cannot read suggestions')
ok(/ERROR/.test(as('authenticated', `insert into public.connection_submissions (title, tiles, explanation, system, fingerprint) values ('t', array['a','b','c','d'], 'xxxxxxxxxxxxxxxxxxxxxxxx', 'Cardiology', 'f')`)), 'no direct inserts')
ok(/ERROR/.test(as('authenticated', `update public.connection_submissions set status = 'accepted'`)) || run(`select count(*) from public.connection_submissions where status <> 'pending'`) === '0', 'players cannot approve suggestions')
ok(/ERROR/.test(as('anon', `select public.connection_fingerprint(array['a'])`)), 'helper function not callable by players')
ok(run(`select count(*) from information_schema.tables where table_name in ('connection_submissions')`) === '1', 'separate table from the puzzle library')

console.log(`\n${failed ? `${failed} FAILED` : 'ALL SUBMISSION CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
