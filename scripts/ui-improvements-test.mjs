// October 2026 UI pass: tool descriptions per mode, tile wrapping, Race sign-in,
// Home Screen install and support wording. Static checks; the browser checks
// cover layout and behavior.
//   node scripts/ui-improvements-test.mjs
import fs from 'node:fs'
import { KIT, TOOL_WHERE } from '../src/progression/config.js'

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

console.log('[1] Consult, Rule Out and Second Opinion explain Daily and 3 Minutes separately')
for (const id of ['curbside', 'lab', 'second-opinion']) {
  const m = KIT[id].modes
  ok(m && typeof m.daily === 'string' && typeof m.timed === 'string' && m.daily !== m.timed, `${KIT[id].name}: a Daily and a 3 Minutes description`)
  ok(!/—/.test(m.daily + m.timed), `${KIT[id].name}: no em dashes`)
}
ok(/one away/.test(KIT.lab.modes.daily) && /wrong choice/.test(KIT.lab.modes.timed), 'Rule Out: one-away tile in the Daily, a wrong choice in 3 Minutes')
ok(/restores your streak/.test(KIT['second-opinion'].modes.timed) && /accuracy/.test(KIT['second-opinion'].modes.timed), 'Second Opinion in 3 Minutes: points and streak back, the miss still counts toward accuracy')
ok(/mistake allowance/.test(KIT['second-opinion'].modes.daily), 'Second Opinion in the Daily: one mistake allowance')
ok(/Not in the Archive, Systems or Race/.test(TOOL_WHERE), 'where tools work is stated once')
{
  const record = read('src/components/Record.jsx')
  ok(/kit-modes/.test(record) && /<dt>Daily<\/dt>/.test(record) && /<dt>3 Minutes<\/dt>/.test(record), 'Your Tools shows both labels')
  ok(/modes\.timed/.test(read('src/components/ChallengeTools.jsx')), '3 Minutes tooltips use the 3 Minutes description')
  ok(/modes\.daily/.test(read('src/components/Game.jsx')) && /In 3 Minutes/.test(read('src/components/Game.jsx')), 'the Daily info panel shows both')
  ok(/Only in pick or group rounds/.test(read('src/components/Challenge.jsx')) && /Right after a wrong answer/.test(read('src/components/Challenge.jsx')), '3 Minutes disabled states say when the tool works')
  const how = read('src/components/HowToModal.jsx')
  ok(/modes\.daily/.test(how) && /modes\.timed/.test(how), 'How to play uses the same descriptions')
}

console.log('[2] Tile labels wrap between words')
{
  const tt = read('src/components/TileText.jsx')
  ok(/split\.has\(w\)/.test(tt) && /FLOOR_PX = 11/.test(tt), 'break points inside a word only for words that cannot fit at the 11 px floor')
  const css = read('src/styles.css')
  const block = css.slice(css.indexOf('.tile-text {'), css.indexOf('}', css.indexOf('.tile-text {')))
  ok(/overflow-wrap: normal/.test(block) && /hyphens: manual/.test(block), '.tile-text: no arbitrary breaks, no automatic hyphenation')
  ok(/\.tile-text\.is-split \{ overflow-wrap: anywhere; \}/.test(css), 'an arbitrary break only as a last resort')
  ok(!/softHyphenate/.test(read('src/components/SolvedGroup.jsx')), 'solved groups show the terms as written')
  ok(/<TileText>/.test(read('src/components/ServerRace.jsx')) && /<TileText>/.test(read('src/components/Race.jsx')), 'Race answer options use the same tile text')
}

console.log('[3] Race: Plexus room, Sign in beside the guest message, seat kept')
{
  const sr = read('src/components/ServerRace.jsx')
  ok(/race-signin-btn/.test(sr) && /Guest races don’t earn Race rewards/.test(sr), 'Sign in sits beside the guest rewards message')
  ok(/upgradeGuestSeat/.test(sr) && /saveRaceResume/.test(sr), 'the lobby seat and code are kept through sign-in')
  ok(/'upgrade'/.test(read('server/raceCore.js')) && /guestToken/.test(read('server/raceCore.js')), 'the server checks both sessions before moving a seat')
  const mig = read('supabase/migrations/0013_race_guest_sign_in.sql')
  ok(/m\.status <> 'lobby'/.test(mig) && /grant execute on function public\.%s to service_role/.test(mig), '0013: lobby only, server only')
  ok(/env-race/.test(read('src/App.jsx')) && /body\.env-race \{/.test(read('src/styles.css')), 'Race has its own room')
  ok(/accountModal/.test(read('src/App.jsx')), 'the account dialog opens over Race')
}

console.log('[3b] Race links: Join the race popup')
{
  const app = read('src/App.jsx')
  ok(/RaceInvitePrompt/.test(app) && /offerRaceInvite\(code\)/.test(app), 'a race link opens the Join the race popup')
  ok(/!\(view === 'race' && invitePass\)/.test(app), 'joining from a link skips the Daily gate for that race only')
  ok(/autoJoin/.test(read('src/components/ServerRace.jsx')), 'Join goes straight to the lobby')
  ok(!read('src/components/RaceInvitePrompt.jsx').includes('—'), 'no em dashes in the popup')
}

console.log('[4] Home Screen install')
{
  const m = JSON.parse(read('public/manifest.webmanifest'))
  ok(m.id === '/' && m.display === 'standalone' && m.start_url && m.icons.some((i) => i.sizes === '192x192') && m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'), 'manifest has an id, standalone display and the icon sizes')
  for (const i of m.icons) ok(fs.existsSync('public' + i.src), `icon exists: ${i.src}`)
  ok(/Add Plexus to your Home Screen/.test(read('src/components/HowToModal.jsx')), 'How to play offers the guide')
  const guide = read('src/components/InstallGuide.jsx')
  ok(/promptInstall/.test(guide) && /isStandalone/.test(guide), 'the guide uses the native prompt when offered and knows standalone mode')
  ok(/Add to Home Screen/.test(guide) && /Install app/.test(guide) && /Add to Dock/.test(guide), 'iPhone and iPad, Android and computer steps')
  ok(/initInstall\(\)/.test(read('src/main.jsx')), 'the install offer is captured at startup')
}

console.log('[5] Support wording matches the results button')
{
  const files = ['src/components/SupportPage.jsx', 'src/components/HowToModal.jsx', 'src/components/Legal.jsx', 'src/components/Home.jsx', 'src/components/Game.jsx', 'src/components/InstallGuide.jsx']
  ok(files.every((f) => !/Show connections/i.test(read(f))), 'no “Show connections” left')
  ok(/Review connections/.test(read('src/components/SupportPage.jsx')) && /<span>Review connections<\/span>/.test(read('src/components/Game.jsx')), 'Help & Support names Review connections, the label on the button')
}

console.log('[6] No em dashes in the new copy')
for (const f of ['src/components/InstallGuide.jsx', 'src/components/RaceArt.jsx', 'src/components/ServerRace.jsx', 'src/components/HowToModal.jsx', 'src/components/SupportPage.jsx', 'src/lib/install.js', 'supabase/migrations/0013_race_guest_sign_in.sql']) {
  ok(!read(f).includes('—'), `no em dashes in ${f}`)
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL UI IMPROVEMENT CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
