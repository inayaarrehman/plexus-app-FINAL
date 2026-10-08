// Date, reset and travel checks for utils/calendar.js and everything built on
// it. Run under different zones, for example:
//   TZ=America/Los_Angeles node scripts/datetest.mjs
//   TZ=Asia/Tokyo node scripts/datetest.mjs
// Every check states the zone it assumes, so the file passes in any TZ.
import * as C from '../src/utils/calendar.js'
import { dayNumber, dateKeyFromDayNumber } from '../src/utils/game.js'
import { getDailyPuzzleForDate } from '../src/utils/dailyPuzzle.js'
import { evaluateGate } from '../src/utils/dailyGate.js'
import * as E from '../src/progression/engine.js'
import * as K from '../src/progression/streak.js'

let fails = 0
let n = 0
const ok = (c, m) => {
  n++
  if (!c) {
    fails++
    console.log('  FAIL - ' + m)
  } else console.log('  ok   - ' + m)
}
const LA = 'America/Los_Angeles'
const TOKYO = 'Asia/Tokyo'
const H = 3600000
console.log(`\n[dates] device zone ${C.detectTimeZone()}`)

// 1. Wednesday 10 PM in California while UTC is already Thursday.
const wed10pm = Date.parse('2026-10-08T05:00:00Z')
ok(C.dayKey(wed10pm, LA) === '2026-10-07', 'California at 10 PM Wed Oct 7 (UTC Thu 05:00) is 2026-10-07')
ok(C.dayKey(wed10pm, 'UTC') === '2026-10-08', 'the same instant is Oct 8 in UTC')
ok(C.formatDayKey('2026-10-07', undefined, 'en-US') === 'Wednesday, October 7', 'label reads Wednesday, October 7')
ok(C.dayKey(wed10pm, TOKYO) === '2026-10-08', 'and Thursday Oct 8 in Tokyo')
ok(C.timeZoneLabel(LA) === 'Los Angeles time' && C.timeZoneLabel('Etc/UTC') === 'UTC' && C.timeZoneLabel('America/Argentina/Buenos_Aires') === 'Buenos Aires time', 'time zone labels read naturally')

// 2. Same puzzle per calendar date worldwide; a date key never shifts.
const pLA = getDailyPuzzleForDate('2026-10-07')
const pTokyoNextDay = getDailyPuzzleForDate('2026-10-07')
ok(pLA.id === 'daily-2026-10-07' && JSON.stringify(pLA.categories.map((c) => c.title)) === JSON.stringify(pTokyoNextDay.categories.map((c) => c.title)), 'the Daily for 2026-10-07 is the same puzzle everywhere')
ok(dayNumber('2026-10-07') === 1010, 'Daily number for 2026-10-07 is still No. 1010')
let roundTrip = true
for (let i = 0; i < 1200; i++) {
  const k = C.addDays('2025-01-01', i)
  if (dateKeyFromDayNumber(dayNumber(k)) !== k) roundTrip = false
}
ok(roundTrip, 'challenge links: day number and date round-trip for 1,200 days across DST changes')

// 3. Local midnight resets.
ok(C.nextMidnight(wed10pm, LA) === Date.parse('2026-10-08T07:00:00Z'), 'next local midnight in LA is 07:00 UTC Oct 8')
ok(C.msUntilNextMidnight(wed10pm, LA) === 2 * H, 'two hours until the LA reset at 10 PM')
ok(C.dayKey(Date.parse('2026-10-08T06:59:59Z'), LA) === '2026-10-07' && C.dayKey(Date.parse('2026-10-08T07:00:00Z'), LA) === '2026-10-08', 'the date changes exactly at LA midnight')

// 4. Daylight saving: days are calendar days, not 24-hour blocks.
const len = (k, tz) => C.startOfDay(C.addDays(k, 1), tz) - C.startOfDay(k, tz)
ok(len('2026-03-08', LA) === 23 * H, 'spring forward day in LA is 23 hours')
ok(len('2026-11-01', LA) === 25 * H, 'fall back day in LA is 25 hours')
ok(len('2026-03-29', 'Europe/London') === 23 * H && len('2026-10-25', 'Europe/London') === 25 * H, 'London DST days are 23 and 25 hours')
ok(C.nextMidnight(Date.parse('2026-03-08T12:00:00Z'), LA) === Date.parse('2026-03-09T07:00:00Z'), 'midnight after spring forward lands at 07:00 UTC (PDT)')
ok(C.nextMidnight(Date.parse('2026-11-01T12:00:00Z'), LA) === Date.parse('2026-11-02T08:00:00Z'), 'midnight after fall back lands at 08:00 UTC (PST)')
const santiago = C.startOfDay('2026-09-06', 'America/Santiago')
ok(C.dayKey(santiago, 'America/Santiago') === '2026-09-06' && C.dayKey(santiago - 1, 'America/Santiago') === '2026-09-05', 'a zone whose midnight is skipped (Santiago) starts the day at its first instant')
let allDays = true
for (const tz of [LA, 'Europe/London', TOKYO, 'Australia/Lord_Howe', 'America/Santiago', 'Pacific/Kiritimati']) {
  for (let i = 0; i < 800; i++) {
    const k = C.addDays('2025-06-01', i)
    const s = C.startOfDay(k, tz)
    if (C.dayKey(s, tz) !== k || C.dayKey(s - 1, tz) !== C.addDays(k, -1)) allDays = false
  }
}
ok(allDays, 'start of day is exact for 800 days in six zones, including half-hour DST (Lord Howe)')

// 5. Weekly goals reset Monday 00:00 local.
const wk = C.weekOfKey('2026-10-07', LA)
ok(wk.startKey === '2026-10-05' && wk.endKey === '2026-10-12' && wk.key === '2026-W41', 'week of Wed Oct 7 runs Mon Oct 5 to Mon Oct 12 (2026-W41)')
ok(wk.start === Date.parse('2026-10-05T07:00:00Z') && wk.end === Date.parse('2026-10-12T07:00:00Z'), 'This Week starts and ends at Monday midnight in LA')
ok(C.weekOfKey('2026-10-11', LA).key === '2026-W41' && C.weekOfKey('2026-10-12', LA).key === '2026-W42', 'Sunday is still this week, Monday starts the next')
ok(C.weekOfKey('2026-03-11', LA).end - C.weekOfKey('2026-03-11', LA).start === 7 * 24 * H && C.weekOfKey('2026-03-04', LA).end - C.weekOfKey('2026-03-04', LA).start === 7 * 24 * H - H, 'the DST week is 167 hours and still ends at Monday midnight')
// Weekly reward: paid once per week however the label or zone moves.
const st = E.normalize({ ledger: { 'rounds:2026-W40': { xp: 250, kind: 'rounds', at: Date.parse('2026-10-06T18:00:00Z'), d: '2026-10-06' } } })
ok(E.weekRewardPaid(st, C.weekOfKey('2026-10-07')), 'a weekly reward saved under the old week label still counts as paid this week')
ok(!E.weekRewardPaid(st, C.weekOfKey('2026-10-14')), 'next week is not marked paid')
// Events keep the local date they were earned on.
const st2 = E.normalize({})
E.award(st2, { id: 'daily:2026-10-07', xp: 100, kind: 'daily', at: wed10pm })
ok(typeof st2.ledger['daily:2026-10-07'].d === 'string', 'each XP event records the local date it was earned on')
ok(E.entryDay({ at: wed10pm, d: '2026-10-07' }) === '2026-10-07', 'an event keeps its earned date in any zone')
ok(E.award(st2, { id: 'daily:2026-10-07', xp: 100, kind: 'daily', at: wed10pm + 20 * H }) === 0, 'the same dated Daily never pays twice')

// 6. Streaks and travel.
const fin = (iso, day, offset, won = true) => ({ completed: true, won, mistakes: 0, completedAt: iso, completedDay: day, completedOffset: offset })
// Flew LA to Tokyo: finished Oct 5 in LA, next finish is Oct 7 in Tokyo, 19 hours later. Oct 6 never happened locally.
const flew = { '2026-10-05': fin('2026-10-06T04:00:00Z', '2026-10-05', -420), '2026-10-07': fin('2026-10-06T23:00:00Z', '2026-10-07', 540) }
ok(K.currentStreak(flew, '2026-10-07') === 2 && K.longestStreak(flew) === 2, 'a date lost flying east does not break the streak')
ok(K.needsShield(flew, '2026-10-07') === null, 'no Streak Shield is spent on a date lost to travel')
// Same dates without travel: a real miss.
const missed = { '2026-10-05': fin('2026-10-06T04:00:00Z', '2026-10-05', -420), '2026-10-07': fin('2026-10-07T20:00:00Z', '2026-10-07', -420) }
ok(K.currentStreak(missed, '2026-10-07') === 1, 'a skipped day without travel still ends the streak')
// Skipped day across a DST change (1 hour east) is still a skip.
const dst = { '2026-03-07': fin('2026-03-08T06:30:00Z', '2026-03-07', -480), '2026-03-09': fin('2026-03-09T20:00:00Z', '2026-03-09', -420) }
ok(K.currentStreak(dst, '2026-03-09') === 1, 'a daylight-saving change never counts as travel')
// Finished on time in LA, viewed later from Tokyo: still a streak day.
const legacy = { '2026-10-07': { completed: true, won: true, mistakes: 0, completedAt: '2026-10-08T05:00:00.000Z' } }
ok(K.isStreakDay(legacy['2026-10-07'], '2026-10-07'), 'an older result finished at 10 PM in LA stays on time when viewed from any zone')
ok(K.isStreakDay(fin('2026-10-08T05:00:00Z', '2026-10-07', -420), '2026-10-07'), 'a new result carries its own finishing date')
ok(!K.isStreakDay(fin('2026-10-09T18:00:00Z', '2026-10-09', -420), '2026-10-07'), 'a Daily finished two days late is not a streak day')
// Today not played yet, last finish yesterday: streak alive. Travel east overnight: also alive.
const now = Date.parse('2026-10-07T15:00:00Z')
ok(K.currentStreak({ '2026-10-06': fin('2026-10-06T20:00:00Z', '2026-10-06', -420) }, '2026-10-07', { now }) === 1, 'today not played yet keeps the streak')

// 7. Daily gate and travel west.
const cur = { key: '2026-10-07', day: dayNumber('2026-10-07'), puzzleId: 'daily-2026-10-07' }
const newer = { key: '2026-10-08', day: dayNumber('2026-10-08'), puzzleId: 'daily-2026-10-08' }
const doneNewer = { '2026-10-08': { completed: true, won: true, puzzleId: 'daily-2026-10-08' } }
ok(evaluateGate({ history: doneNewer, current: cur, latest: newer }).unlocked, 'travel west after finishing the newer Daily keeps modes open')
const doneOlderOnly = { '2026-10-07': { completed: true, won: true, puzzleId: 'daily-2026-10-07' } }
ok(!evaluateGate({ history: doneOlderOnly, current: cur, latest: newer }).unlocked, 'turning the clock back to a finished date does not unlock an unfinished newer Daily')
ok(evaluateGate({ history: doneOlderOnly, current: cur, latest: cur }).unlocked, "finishing today's Daily unlocks as before")

// 8. Week rotation index is unchanged from before (no goals change on upgrade).
const oldIndex = (ts) => {
  const d = new Date(ts)
  const day = (d.getDay() + 6) % 7
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  return Math.round(start.getTime() / (7 * 86400000))
}
let same = true
for (let t = Date.parse('2025-01-01T00:00:00Z'); t < Date.parse('2027-12-31T00:00:00Z'); t += 7 * H) if (E.weekOf(t).index !== oldIndex(t)) same = false
ok(same, `weekly goal rotation matches the previous version in ${C.detectTimeZone()}`)

console.log(`\n${fails ? fails + ' DATE CHECK(S) FAILED' : 'ALL ' + n + ' DATE CHECKS PASSED'} (${C.detectTimeZone()})`)
process.exit(fails ? 1 : 0)
