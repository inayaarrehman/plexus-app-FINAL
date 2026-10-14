// Privacy behaviour (migration 0012) against a real Postgres with every
// migration (0001-0012) applied on Supabase-like stubs.
//   PGTEST="psql -h <host> -p <port> -U postgres -d <db>" node scripts/privacy-sql-test.mjs
// Uses only made-up test accounts it creates itself.
import { execFileSync } from 'node:child_process'

const PG = (process.env.PGTEST || 'psql -h /tmp/pgtest -p 5544 -U postgres -d priv').split(' ')
const run = (sql) => execFileSync(PG[0], [...PG.slice(1), '-v', 'ON_ERROR_STOP=1', '-At', '-q', '-c', sql], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
const tryRun = (sql) => {
  try {
    return run(sql)
  } catch (e) {
    return 'ERROR ' + String(e.stderr || e.message).split('\n')[0]
  }
}
// Runs `sql` as a signed-in user (or anon when uid is null).
const as = (uid, sql) => {
  const out = tryRun(`select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${uid ? 'authenticated' : 'anon'}; ${sql}`)
  return out.startsWith('ERROR') ? out : out.split('\n').filter((l) => l !== 'SET').slice(uid ? 1 : 0).join('\n')
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
const id = (n) => `00000000-0000-0000-0000-00000000${String(n).padStart(4, '0')}`
const A = id(1)
const B = id(2)
const G = id(3) // guest
const OLDG = id(4) // old guest
const OLDU = id(5) // old signed-in account

run(`set client_min_messages = warning;
  truncate public.race_matches, public.race_inventory, public.race_progress, public.reports, public.connection_submissions cascade;
  delete from auth.users;`)

console.log('[1] Sign-up: acceptance record, no name taken from the email')
{
  run(`insert into auth.users (id, email, raw_user_meta_data) values
    ('${A}', 'alex.test@example.com', '{"terms_version":"2026-10-14","privacy_version":"2026-10-14"}'),
    ('${B}', 'bea.test@example.com', '{"terms_version":"2026-10-14","privacy_version":"2026-10-14"}')`)
  run(`insert into auth.users (id, is_anonymous) values ('${G}', true)`)
  ok(run(`select coalesce(display_name, 'NULL') from public.profiles where id = '${A}'`) === 'NULL', 'a new profile has no display name taken from the email')
  ok(run(`select terms_version || '|' || privacy_version || '|' || source from public.terms_acceptances where user_id = '${A}'`) === '2026-10-14|2026-10-14|signup', 'sign-up records the accepted Terms and Privacy versions')
  ok(as(A, `select public.record_terms_acceptance('2026-11-01', '2026-11-01')`).includes('"ok": true'), 'an account records acceptance of an update')
  ok(run(`select count(*) from public.terms_acceptances where user_id = '${A}'`) === '2', 'both acceptances are kept')
  ok(as(A, `select public.record_terms_acceptance('2026-11-01', '2026-11-01')`).includes('already'), 'accepting the same version twice adds nothing')
  ok(as(G, `select public.record_terms_acceptance('2026-11-01')`).includes('guest'), 'a guest race ID cannot record acceptance')
  ok(as(A, `select public.my_terms_acceptance()`).includes('2026-11-01'), 'an account reads its latest acceptance')
  ok(as(A, `select count(*) from public.terms_acceptances`) === '2', 'an account sees only its own acceptance records')
  ok(as(null, `select count(*) from public.terms_acceptances`).startsWith('ERROR') || as(null, `select count(*) from public.terms_acceptances`) === '0', 'anon sees no acceptance records')
  // A display name copied from the email by the old trigger is cleared.
  run(`update public.profiles set display_name = 'bea.test' where id = '${B}'`)
  run(execFileSync('cat', ['supabase/migrations/0012_privacy_deletion_retention.sql'], { encoding: 'utf8' }))
  ok(run(`select coalesce(display_name, 'NULL') from public.profiles where id = '${B}'`) === 'NULL', 'rerunning 0012 clears a name derived from the email')
}

console.log('[2] Access: profiles, reports and suggestions are private')
{
  ok(as(A, `select count(*) from public.profiles`) === '1', 'an account reads only its own profile')
  ok(as(null, `select count(*) from public.profiles`) === '0', 'anon reads no profiles')
  as(null, `select public.submit_report('support', 'account', 'Please help with my account', 'reply.test@example.com', null, null, null, null, null, null, '1.0', 'browser-1')`)
  ok(run(`select count(*) from public.reports`) === '1', 'anyone can send a support message')
  ok(as(null, `select count(*) from public.reports`).startsWith('ERROR'), 'anon cannot read reports')
  ok(as(A, `select count(*) from public.reports`).startsWith('ERROR'), 'an account cannot read reports')
  ok(as(A, `select count(*) from public.connection_submissions`).startsWith('ERROR'), 'an account cannot read suggestions')
  ok(as(A, `select count(*) from public.privacy_settings`).startsWith('ERROR'), 'retention settings are private')
  ok(as(A, `select public.privacy_cleanup()`).startsWith('ERROR'), 'a player cannot run the cleanup')
  ok(as(A, `select public.privacy_scrub_user_refs('${B}')`).startsWith('ERROR'), 'a player cannot scrub another player')
  ok(as(A, `select public.privacy_delete_user('${B}')`).startsWith('ERROR'), 'a player cannot delete another account')
  ok(as(null, `select public.delete_my_account()`).startsWith('ERROR'), 'deleting needs a signed-in session')
}

console.log('[3] Submit a Connection needs the submission terms')
{
  const sub = (uid, terms, tiles) => as(uid, `select public.submit_connection('Test connection ${tiles[0]}', array[${tiles.map((t) => `'${t}'`).join(',')}]::text[], 'Four test concepts that belong together for a reason.', 'Cardiology', null, 'browser-2', '1.0'${terms === undefined ? '' : `, ${terms === null ? 'null' : `'${terms}'`}`})`)
  ok(sub(A, null, ['a1', 'a2', 'a3', 'a4']).includes('"terms"'), 'without an acknowledged version it is refused')
  ok(sub(A, undefined, ['b1', 'b2', 'b3', 'b4']).includes('"terms"'), 'the old call (no acknowledgment) asks the app to update')
  ok(sub(A, 'sub-2026-10-14', ['c1', 'c2', 'c3', 'c4']).includes('"ok": true'), 'with the acknowledged version it is saved')
  ok(run(`select terms_version from public.connection_submissions where user_id = '${A}'`) === 'sub-2026-10-14', 'the acknowledged version is stored with it')
  sub(A, 'sub-2026-10-14', ['d1', 'd2', 'd3', 'd4'])
  run(`update public.connection_submissions set status = 'accepted' where tiles[1] = 'd1'`)
}

console.log('[4] Account deletion, end to end')
{
  // A's data: progress, a support message, a connection report with email,
  // a pending and an accepted suggestion, a race A opened against B.
  run(`insert into public.user_progress (user_id, data) values ('${A}', '{"x":1}'), ('${B}', '{"y":1}')`)
  run(`select set_config('request.jwt.claim.sub', '${A}', false); select public.submit_report('support', 'feedback', 'Message from A with my name', 'alex.reply@example.com', null, null, null, null, null, null, '1.0', 'browser-a')`)
  run(`select set_config('request.jwt.claim.sub', '${A}', false); select public.submit_report('connection', 'typo', 'Typo in a tile', 'alex.reply@example.com', 'p1', 'c1', 'Title', array['x'], 'daily', null, '1.0', 'browser-a')`)
  const m = run(`insert into public.race_matches (code, created_by, status, finished_at) values ('ZZZZ', '${A}', 'finished', now()) returning id`).split('\n')[0]
  run(`insert into public.race_participants (match_id, user_id, seat, answers) values ('${m}', '${A}', 1, '{"1":true}'), ('${m}', '${B}', 2, '{"1":false}')`)
  run(`insert into public.race_reward_log (match_id, user_id, opponent, pair_key, reward_day, chaos, outcome, qualified, counted) values
    ('${m}', '${A}', '${B}', '${A}:${B}', current_date, false, 'win', true, true),
    ('${m}', '${B}', '${A}', '${A}:${B}', current_date, false, 'lose', true, true)`)
  run(`insert into public.race_events (match_id, kind, from_user, to_user) values ('${m}', 'mutation', '${A}', '${B}')`)
  const r = as(A, `select public.delete_my_account()`)
  ok(!r.startsWith('ERROR'), 'an account deletes itself: ' + r)
  ok(run(`select count(*) from auth.users where id = '${A}'`) === '0', 'the auth account is gone')
  ok(run(`select count(*) from public.profiles where id = '${A}'`) === '0' && run(`select count(*) from public.user_progress where user_id = '${A}'`) === '0', 'profile and cloud progress are gone')
  ok(run(`select count(*) from public.terms_acceptances where user_id = '${A}'`) === '0', 'acceptance records are gone')
  ok(run(`select count(*) from public.reports where description like 'Message from A%'`) === '0', 'their support message is deleted')
  ok(run(`select coalesce(contact_email, 'NULL') || '|' || coalesce(client_id, 'NULL') || '|' || coalesce(user_id::text, 'NULL') from public.reports where kind = 'connection'`) === 'NULL|NULL|NULL', 'their connection report keeps no email, browser ID or account link')
  ok(run(`select count(*) from public.connection_submissions where tiles[1] = 'c1'`) === '0', 'a suggestion not yet accepted is deleted')
  ok(run(`select coalesce(user_id::text, 'NULL') || '|' || coalesce(client_id, 'NULL') from public.connection_submissions where tiles[1] = 'd1'`) === 'NULL|NULL', 'an accepted suggestion stays, unlinked')
  ok(run(`select count(*) from public.race_matches where id = '${m}'`) === '1', "the other player's race is kept")
  ok(run(`select count(*) from public.race_participants where match_id = '${m}' and user_id = '${B}'`) === '1', "the other player's result is kept")
  ok(run(`select count(*) from public.race_participants where user_id = '${A}'`) === '0', 'their answers are deleted')
  ok(run(`select coalesce(opponent::text, 'NULL') || '|' || pair_key from public.race_reward_log where user_id = '${B}'`) === `NULL|deleted:${B}`, "their ID is removed from the other player's reward record")
  ok(run(`select coalesce(from_user::text, 'NULL') from public.race_events where match_id = '${m}'`) === 'NULL', 'and from the race events')
  ok(run(`select count(*) from public.user_progress where user_id = '${B}'`) === '1', "the other player's own data is untouched")
}

console.log('[5] Guest race IDs can be deleted too')
{
  const m = run(`insert into public.race_matches (code, created_by, status) values ('GGGG', '${G}', 'finished') returning id`).split('\n')[0]
  run(`insert into public.race_participants (match_id, user_id, seat, guest) values ('${m}', '${G}', 1, true), ('${m}', '${B}', 2, false)`)
  ok(!as(G, `select public.delete_my_account()`).startsWith('ERROR'), 'a guest deletes its race ID')
  ok(run(`select count(*) from auth.users where id = '${G}'`) === '0' && run(`select count(*) from public.race_participants where user_id = '${G}'`) === '0', 'the guest ID and its race rows are gone')
  ok(run(`select count(*) from public.race_participants where match_id = '${m}' and user_id = '${B}'`) === '1', "the signed-in opponent's result stays")
}

console.log('[6] Retention cleanup removes only what its rules name')
{
  run(`insert into auth.users (id, is_anonymous, created_at) values ('${OLDG}', true, now() - interval '40 days')`)
  run(`insert into auth.users (id, email, created_at) values ('${OLDU}', 'old.test@example.com', now() - interval '400 days')`)
  const recentG = id(6)
  run(`insert into auth.users (id, is_anonymous, created_at) values ('${recentG}', true, now() - interval '40 days')`)
  const oldM = run(`insert into public.race_matches (code, created_by, status, created_at, finished_at) values ('OLD1', '${OLDU}', 'finished', now() - interval '40 days', now() - interval '40 days') returning id`).split('\n')[0]
  run(`insert into public.race_participants (match_id, user_id, seat, answers) values ('${oldM}', '${OLDU}', 1, '{"1":true}'), ('${oldM}', '${OLDG}', 2, '{"1":false}')`)
  run(`insert into public.race_events (match_id, kind, from_user) values ('${oldM}', 'mutation', '${OLDG}')`)
  const newM = run(`insert into public.race_matches (code, created_by, status, finished_at) values ('NEW1', '${recentG}', 'finished', now()) returning id`).split('\n')[0]
  run(`insert into public.race_participants (match_id, user_id, seat, answers) values ('${newM}', '${recentG}', 1, '{"1":true}'), ('${newM}', '${B}', 2, '{"1":true}')`)
  run(`insert into public.race_matches (code, created_by, status, created_at) values ('LOB1', '${OLDU}', 'lobby', now() - interval '10 days')`)
  run(`insert into public.reports (kind, reason, description, contact_email, client_id, created_at) values
    ('support', 'other', 'old support message', 'a.test@example.com', 'b1', now() - interval '800 days'),
    ('support', 'other', 'recent support message', 'b.test@example.com', 'b2', now() - interval '20 days'),
    ('connection', 'typo', 'old report', 'c.test@example.com', 'b3', now() - interval '400 days'),
    ('connection', 'typo', 'recent report', 'd.test@example.com', 'b4', now() - interval '2 days')`)
  run(`insert into public.connection_submissions (title, tiles, explanation, system, fingerprint, status, client_id, created_at) values
    ('Old rejected', array['r1','r2','r3','r4'], 'An old rejected suggestion text.', 'Renal', 'fp-r', 'rejected', 'b5', now() - interval '400 days'),
    ('Old accepted', array['s1','s2','s3','s4'], 'An old accepted suggestion text.', 'Renal', 'fp-s', 'accepted', 'b6', now() - interval '400 days')`)
  const out = run(`select public.privacy_cleanup()`)
  ok(/"guest_ids": 1/.test(out), 'one old guest ID removed: ' + out)
  ok(run(`select count(*) from auth.users where id = '${OLDG}'`) === '0', 'the guest ID with no race in 30 days is deleted')
  ok(run(`select count(*) from auth.users where id = '${recentG}'`) === '1', 'a guest ID that raced recently is kept')
  ok(run(`select count(*) from auth.users where id = '${OLDU}'`) === '1', 'a signed-in account is never removed by the cleanup')
  ok(run(`select answers::text from public.race_participants where match_id = '${oldM}' and user_id = '${OLDU}'`) === '{}', 'answers of a race that ended over 30 days ago are cleared')
  ok(run(`select count(*) from public.race_events where match_id = '${oldM}'`) === '0', 'and its events are deleted')
  ok(run(`select answers::text from public.race_participants where match_id = '${newM}' and user_id = '${B}'`) !== '{}', 'a recent race keeps its answers')
  ok(run(`select count(*) from public.race_matches where code = 'LOB1'`) === '0', 'a lobby that never started is deleted after 7 days')
  ok(run(`select count(*) from public.race_matches where id = '${oldM}'`) === '1', 'an old finished race with a remaining player keeps its result')
  ok(run(`select count(*) from public.reports where description = 'old support message'`) === '0' && run(`select count(*) from public.reports where description = 'recent support message'`) === '1', 'support messages past 24 months are deleted, recent ones kept')
  ok(run(`select coalesce(contact_email, 'NULL') from public.reports where description = 'old report'`) === 'NULL' && run(`select contact_email from public.reports where description = 'recent report'`) === 'd.test@example.com', 'report emails past 12 months are cleared, recent ones kept')
  ok(run(`select count(*) from public.reports where client_id is not null and created_at < now() - interval '7 days'`) === '0' && run(`select client_id from public.reports where description = 'recent report'`) === 'b4', 'browser IDs older than 7 days are cleared')
  ok(run(`select count(*) from public.connection_submissions where title = 'Old rejected'`) === '0' && run(`select count(*) from public.connection_submissions where title = 'Old accepted'`) === '1', 'old rejected suggestions are deleted, accepted ones kept')
  const again = run(`select public.privacy_cleanup()`)
  ok(/"guest_ids": 0/.test(again) && /"support_messages": 0/.test(again), 'a second run changes nothing')
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL PRIVACY CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
