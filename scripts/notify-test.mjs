// Email notifications: secret check, only INSERTs on the two tables send, the
// email text, reply-to, and failures reported. No network: a fake sender.
//   node scripts/notify-test.mjs
import { handleNotify, buildEmail, resendSender, DEFAULT_TO } from '../server/notifyCore.js'
let failed = 0, passed = 0
const ok = (c, m) => (c ? passed++ : (failed++, console.log('  FAIL -', m)))
const env = { NOTIFY_WEBHOOK_SECRET: 's3cret-value', RESEND_API_KEY: 're_test' }
let sent = []
const send = async (m) => (sent.push(m), { ok: true })
const report = { id: 'r1', created_at: '2026-10-13T20:00:00Z', kind: 'connection', reason: 'medical', description: 'Pica is not specific <b>enough</b>.', contact_email: 'player@example.com', puzzle_id: 'daily-2026-10-13', category_id: 'PLX-HEM-016', connection_title: 'Clinical clues to iron deficiency', tiles: ['Koilonychia', 'Pica', 'Atrophic glossitis', 'Plummer-Vinson syndrome'], game_mode: 'daily', puzzle_date: '2026-10-13', app_version: '1.0' }
const sub = { id: 's1', created_at: '2026-10-13T20:05:00Z', title: 'Drugs that cause gingival hyperplasia', tiles: ['Phenytoin', 'Cyclosporine', 'Nifedipine', 'Verapamil'], explanation: 'Each can cause gum overgrowth.', system: 'Pharmacology', source: 'First Aid' }
const call = (body, headers = { 'x-plexus-webhook-secret': env.NOTIFY_WEBHOOK_SECRET }, e = env) => handleNotify({ headers, body }, { env: e, send })

ok((await call({ type: 'INSERT', schema: 'public', table: 'reports', record: report }, {}, {})).status === 503, 'not configured: 503, nothing sent')
ok((await call({ type: 'INSERT', schema: 'public', table: 'reports', record: report }, { 'x-plexus-webhook-secret': 'wrong' })).status === 401 && sent.length === 0, 'wrong secret: 401, nothing sent')
ok((await call({ type: 'INSERT', schema: 'public', table: 'reports', record: report }, {})).status === 401, 'missing secret: 401')
let r = await call({ type: 'INSERT', schema: 'public', table: 'reports', record: report })
ok(r.status === 200 && sent.length === 1, 'a new report sends one email')
const m = sent[0]
ok(m.to.join() === DEFAULT_TO && m.subject === 'Plexus report: Medical accuracy · Clinical clues to iron deficiency', 'to the contact address, with a clear subject: ' + m.subject)
ok(m.reply_to === 'player@example.com' && /Tiles: Koilonychia, Pica, Atrophic glossitis, Plummer-Vinson syndrome/.test(m.text) && /Connection id: PLX-HEM-016/.test(m.text), 'reply goes to the player; tiles and ids included')
ok(!('html' in m) && m.text.includes('<b>enough</b>'), 'plain text only (player text is never rendered as HTML)')
r = await call({ type: 'INSERT', schema: 'public', table: 'connection_submissions', record: sub })
ok(r.status === 200 && sent[1].subject === 'Plexus suggestion: Drugs that cause gingival hyperplasia' && /1\. Phenytoin/.test(sent[1].text) && /Organ system: Pharmacology/.test(sent[1].text) && !sent[1].reply_to, 'a new suggestion sends one email with all four concepts')
r = await call({ type: 'INSERT', schema: 'public', table: 'reports', record: { ...report, kind: 'support', reason: 'account', contact_email: null } })
ok(sent[2].subject === 'Plexus support: Account or progress' && !sent[2].reply_to && /\(no email given\)/.test(sent[2].text), 'support messages too; no reply-to without an email')
r = await call({ type: 'UPDATE', schema: 'public', table: 'reports', record: report })
ok(r.json.skipped === 'not-an-insert' && sent.length === 3, 'updates (for example marking reviewed) send nothing')
r = await call({ type: 'INSERT', schema: 'public', table: 'race_matches', record: {} })
ok(r.json.skipped === 'other-table' && sent.length === 3, 'other tables send nothing')
r = await call({ type: 'INSERT', schema: 'public', table: 'reports', record: report }, undefined, { ...env, NOTIFY_TO: 'a@x.com, b@y.com', NOTIFY_FROM: 'Plexus <hello@playplexus.com>' })
ok(JSON.stringify(sent[3].to) === '["a@x.com","b@y.com"]' && sent[3].from === 'Plexus <hello@playplexus.com>', 'NOTIFY_TO (comma list) and NOTIFY_FROM are honoured')
r = await handleNotify({ headers: { 'x-plexus-webhook-secret': env.NOTIFY_WEBHOOK_SECRET }, body: { type: 'INSERT', schema: 'public', table: 'reports', record: report } }, { env, send: async () => ({ ok: false, error: 'HTTP 403' }) })
ok(r.status === 502 && r.json.error === 'HTTP 403', 'a provider failure is reported (the webhook shows it as failed)')
ok(buildEmail('reports', { ...report, description: 'x'.repeat(5000) }).text.length < 3200, 'long text is clipped')
const seen = []
const fake = async (url, opts) => (seen.push([url, opts]), { ok: true, text: async () => '' })
ok((await resendSender('re_key', fake)({ to: ['a@x.com'] })).ok && seen[0][0] === 'https://api.resend.com/emails' && seen[0][1].headers.authorization === 'Bearer re_key', 'Resend request uses the key from the environment')
console.log(`\n${failed ? `${failed} FAILED` : 'ALL NOTIFY CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
