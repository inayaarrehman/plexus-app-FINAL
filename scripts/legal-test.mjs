// Checks that the policy pages and the code agree (October 2026 privacy pass).
//   node scripts/legal-test.mjs
// Static checks only: they catch a page that drifts from the code, not
// whether the law is satisfied.
import fs from 'node:fs'

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
const read = (f) => fs.readFileSync(f, 'utf8')
const legal = read('src/components/Legal.jsx')
const config = read('src/legal/config.js')
const mig = read('supabase/migrations/0012_privacy_deletion_retention.sql')

console.log('[1] Every outside service the code calls is named')
{
  if (/api\.resend\.com/.test(read('server/notifyCore.js'))) ok(/<b>Resend<\/b>/.test(legal), 'Resend (report and suggestion emails) is named')
  ok(/<b>Supabase<\/b>/.test(legal) && /<b>Vercel<\/b>/.test(legal), 'Supabase and Vercel are named')
  ok(/Supabase Realtime/.test(legal), 'the fallback live race channel is described')
  if (/cloudflareinsights\.com/.test(read('index.html'))) {
    ok(/<b>Cloudflare<\/b>/.test(legal) && /Visit counts/.test(legal), 'Cloudflare Web Analytics (index.html) is named and described')
    ok(!/no analytics service/.test(legal), 'no claim that Plexus has no analytics')
    ok(/playplexus\\\.com\$/.test(read('index.html')), 'analytics load only on playplexus.com')
  }
  const code = ['src', 'api', 'server'].flatMap((d) => walk(d)).filter((f) => !f.startsWith('src/data/')).map(read).join('\n')
  const hosts = new Set([...code.matchAll(/https:\/\/([a-z0-9.-]+)\//gi)].map((m) => m[1].toLowerCase()))
  const known = ['playplexus.com', 'api.resend.com', 'resend.com', 'www.w3.org']
  ok([...hosts].every((h) => known.includes(h)), 'no other outside hosts in the code: ' + [...hosts].join(', '))
}
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : /\.(jsx?|mjs)$/.test(e.name) ? [`${d}/${e.name}`] : []))
}

console.log('[2] Retention periods on the page match the cleanup settings')
{
  const days = Object.fromEntries([...mig.matchAll(/\('([a-z_]+)', (\d+), '/g)].map((m) => [m[1], Number(m[2])]))
  ok(days.guest_race_ids === 30 && /Guest race IDs:<\/b> deleted, with their races, after 30 days without a race/.test(legal), 'guest race IDs: 30 days')
  ok(days.race_details === 30 && /cleared 30 days after the race ends/.test(legal), 'race answers and events: 30 days')
  ok(days.stale_lobbies === 7 && /never started:<\/b> deleted after 7 days/.test(legal), 'stale lobbies: 7 days')
  ok(days.browser_ids === 7 && /removed after 7 days/.test(legal), 'browser IDs: 7 days')
  ok(days.report_emails === 365 && /removed after 12 months/.test(legal), 'report emails: 12 months')
  ok(days.support_messages === 730 && /deleted after 24 months/.test(legal), 'support messages: 24 months')
  ok(days.closed_suggestions === 365 && /deleted after 12 months, and suggestions not yet accepted/.test(legal), 'closed suggestions: 12 months')
}

console.log('[3] Deletion on the page matches delete_my_account')
{
  const fn = mig.slice(mig.indexOf('create or replace function public.privacy_delete_user'))
  ok(/delete from public\.reports where user_id = p_user and kind = 'support'/.test(fn) && /support messages/.test(legal), 'support messages are deleted with the account')
  ok(/contact_email = null, client_id = null, user_id = null/.test(fn), 'connection reports lose email, browser ID and account link')
  ok(/delete from public\.connection_submissions where user_id = p_user and status <> 'accepted'/.test(fn), 'suggestions not accepted are deleted')
  ok(/privacy_scrub_user_refs\(p_user\)/.test(fn) && /removes your account ID from other players' race records/.test(legal), "the ID leaves other players' race records")
  ok(/on delete set null/.test(mig) && /race_matches_created_by_fkey/.test(mig), "a deleted player no longer deletes the other player's race")
}

console.log('[4] Versions, acceptance and point-of-use wording')
{
  ok(/export const TERMS_VERSION = '\d{4}-\d{2}-\d{2}'/.test(config) && /export const PRIVACY_VERSION/.test(config) && /export const SUBMISSION_TERMS_VERSION/.test(config), 'policy versions are defined')
  ok(/terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION/.test(read('src/lib/auth.js')), 'sign-up sends the accepted versions')
  ok(/p_terms_version: SUBMISSION_TERMS_VERSION/.test(read('src/lib/submissionRepo.js')), 'a suggestion sends the confirmed submission terms version')
  const auth = read('src/components/AuthModal.jsx')
  ok(/you agree to the <PolicyLink page="terms">Terms of Use<\/PolicyLink> and acknowledge the <PolicyLink page="privacy">Privacy Policy<\/PolicyLink>/.test(auth), 'sign-up: agree to the Terms, acknowledge the Privacy Policy')
  ok(!/confirm you are 13/.test(auth), 'no "confirm you are 13" checkbox wording')
  ok(/I wrote this or have permission to share it/.test(read('src/components/SubmitConnectionModal.jsx')), 'Submit a Connection asks for the acknowledgment')
  ok(/patient details/.test(read('src/components/ReportForm.jsx')), 'free-text warning on reports and support messages')
  ok(!/Plexus does not receive it/.test(legal), 'no blanket claim that guest data never reaches Plexus')
  ok(!/true for a board exam/.test(legal), 'board-exam wording removed from the Disclaimer')
  for (const f of ['src/components/Legal.jsx', 'src/components/PolicyNotice.jsx', 'src/components/PolicyLink.jsx', 'src/components/AuthModal.jsx', 'src/components/SubmitConnectionModal.jsx', 'src/components/ReportForm.jsx', 'src/components/SupportPage.jsx', 'src/legal/config.js']) {
    ok(!read(f).includes('—'), `no em dashes in ${f}`)
  }
  ok(!/®|100\s*%|fully secure|completely secure\b(?! so)/.test(legal.replace('No way of storing or sending information is completely secure', '')), 'no absolute security claims or ®')
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL LEGAL CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
