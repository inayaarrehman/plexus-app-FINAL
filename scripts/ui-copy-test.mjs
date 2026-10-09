// Checks for the Daily countdown copy (the weekly line is checked in the
// browser test).
//   node scripts/ui-copy-test.mjs
import { formatCountdown, nextPuzzleInfo } from '../src/utils/resetCountdown.js'
import { dayKey } from '../src/utils/calendar.js'

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
const H = 3600000
const M = 60000
const LA = 'America/Los_Angeles'

console.log('[1] Countdown wording')
ok(formatCountdown(3 * H + 24 * M) === '3h 24m', '3h 24m')
ok(formatCountdown(3 * H + 23 * M + 1000) === '3h 24m', 'partial minutes round up (never shows a minute early)')
ok(formatCountdown(2 * H) === '2h', 'whole hours drop the minutes')
ok(formatCountdown(59 * M) === '59m', 'under an hour shows minutes only')
ok(formatCountdown(30 * 1000) === 'under a minute', 'last minute')
ok(formatCountdown(0) === 'now', 'zero')

console.log('[2] Countdown comes from the real reset (local midnight), DST-safe')
{
  // 8:36 PM PDT on Oct 8 2026 -> 3h 24m to midnight.
  const t = Date.parse('2026-10-08T20:36:00-07:00')
  const i = nextPuzzleInfo(t, LA)
  ok(i.text === 'Next puzzle in 3h 24m', 'normal evening: ' + i.text)
  ok(dayKey(i.at, LA) === '2026-10-09' && /12:00\s?AM Los Angeles time \(Fri, Oct 9\)/.test(i.detail), 'detail names the exact time and zone: ' + i.detail)
}
{
  // Fall back: Nov 1 2026 has 25 hours in Los Angeles. From 12:30 AM PDT
  // the real time to the next midnight is 24h 30m.
  const t = Date.parse('2026-11-01T00:30:00-07:00')
  const i = nextPuzzleInfo(t, LA)
  ok(i.text === 'Next puzzle in 24h 30m', 'fall-back day counts the extra hour: ' + i.text)
  ok(dayKey(i.at, LA) === '2026-11-02', 'still resets at the next local midnight')
}
{
  // Spring forward: Mar 14 2027 is 23 hours. At 12:30 AM PST: 22h 30m.
  const i = nextPuzzleInfo(Date.parse('2027-03-14T00:30:00-08:00'), LA)
  ok(i.text === 'Next puzzle in 22h 30m', 'spring-forward day is one hour shorter: ' + i.text)
}
{
  // Midnight rollover: one second before and at midnight.
  const before = Date.parse('2026-10-08T23:59:59-07:00')
  ok(nextPuzzleInfo(before, LA).text === 'Next puzzle in under a minute', 'one second before midnight')
  const at = Date.parse('2026-10-09T00:00:00-07:00')
  const i = nextPuzzleInfo(at, LA)
  ok(i.text === 'Next puzzle in 24h' && dayKey(i.at, LA) === '2026-10-10', 'exactly at midnight it counts to the following midnight')
}
{
  // Other zones use their own midnight.
  const t = Date.parse('2026-10-08T20:36:00-07:00') // 04:36 BST on Oct 9
  ok(nextPuzzleInfo(t, 'Europe/London').text === 'Next puzzle in 19h 24m', 'London player counts to London midnight')
  ok(/London time/.test(nextPuzzleInfo(t, 'Europe/London').detail), 'London detail')
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL UI COPY CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
