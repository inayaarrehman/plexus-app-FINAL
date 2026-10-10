// Node checks for the launch UX pass: what This Week says is still possible
// (players arriving partway through a week), and that signing in after guest
// play merges progress without losing or duplicating anything.
// Run: npx tsx scripts/ux-flow-test.mjs
import { weekOutlook, weekProgress, weekOf, totalXp, kitCounts } from '../src/progression/engine.js'
import { mergeSnapshots } from '../src/utils/progressSync.js'

let pass = 0
let fail = 0
const ok = (c, m) => {
  console.log(`${c ? 'ok  ' : 'FAIL'} - ${m}`)
  c ? pass++ : fail++
}

// A week: Monday 2026-10-05 to Sunday 2026-10-11.
const wk = { key: '2026-W41', startKey: '2026-10-05', endKey: '2026-10-11' }
const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']
const prog = ({ dailies = 0, timed = 0, kept = [] } = {}) => {
  const goals = [
    { id: 'dailies', target: 3, count: Math.min(dailies, 3), done: dailies >= 3 },
    { id: 'timed', target: 2, count: Math.min(timed, 2), done: timed >= 2 },
    { id: 'streak', target: 7, count: Math.min(kept.length, 7), done: kept.length >= 7 },
  ]
  const done = goals.filter((g) => g.done).length
  return { week: wk, goals, done, need: 2, complete: done >= 2, keptDays: kept }
}

// Sunday arrival, nothing played yet.
{
  const o = weekOutlook(prog(), days[6], days[6])
  ok(o.joinedMidWeek, 'Sunday arrival: joined partway through the week')
  ok(o.possible.dailies === false && o.possible.streak === false && o.possible.timed === true, 'Sunday arrival: only the timed goal is still possible')
  ok(o.attainable === false, 'Sunday arrival: the weekly reward is honestly out of reach')
}
// Sunday arrival after finishing today's Daily: still only one Daily possible.
{
  const o = weekOutlook(prog({ dailies: 1, kept: [days[6]] }), days[6], days[6])
  ok(o.possible.dailies === false && o.attainable === false, 'Sunday arrival who played: still out of reach (1 of 3 Dailies at most)')
}
// Friday arrival: 3 Dailies still possible (Fri, Sat, Sun) plus timed.
{
  const o = weekOutlook(prog(), days[4], days[4])
  ok(o.possible.dailies === true && o.possible.streak === false && o.attainable === true, 'Friday arrival: Dailies and timed can still earn the reward')
}
// Saturday arrival: only 2 Dailies left.
{
  const o = weekOutlook(prog(), days[5], days[5])
  ok(o.possible.dailies === false && o.attainable === false, 'Saturday arrival: 2 Dailies left, reward out of reach')
}
// A regular player on Wednesday who kept Monday and Tuesday.
{
  const o = weekOutlook(prog({ dailies: 2, kept: [days[0], days[1]] }), days[2], '2026-09-01')
  ok(!o.joinedMidWeek && o.possible.streak && o.possible.dailies && o.attainable, 'regular player on Wednesday: everything still possible')
}
// A regular player who missed Tuesday without Coverage.
{
  const o = weekOutlook(prog({ dailies: 1, kept: [days[0]] }), days[2], '2026-09-01')
  ok(o.possible.streak === false && o.attainable === true && !o.joinedMidWeek, 'missed Tuesday: streak goal gone, reward still reachable')
}
// Coverage keeps the streak goal alive (a covered day is a kept day).
{
  const o = weekOutlook(prog({ dailies: 1, kept: [days[0], days[1]] }), days[2], '2026-09-01')
  ok(o.possible.streak === true, 'a Coverage-protected day keeps the streak goal possible')
}
// A finished week stays complete whatever the outlook.
{
  const o = weekOutlook(prog({ dailies: 3, timed: 2 }), days[6], days[6])
  ok(o.attainable === true, 'a completed week reads as complete')
}
// The real weekProgress shape works with weekOutlook.
{
  const state = { ledger: {}, kit: { grants: {}, uses: {}, claims: {} } }
  const p = weekProgress(state, weekOf(Date.UTC(2026, 9, 11, 19)), {})
  const o = weekOutlook(p, p.week.endKey, p.week.endKey)
  ok(o.possible && typeof o.attainable === 'boolean', `weekOutlook reads engine.weekProgress output (week ${p.week.startKey} to ${p.week.endKey})`)
}

// ---- guest progress then signing in ----
const now = Date.UTC(2026, 9, 9, 18)
const guest = {
  stats: { gamesPlayed: 3, gamesWon: 2, currentStreak: 2, maxStreak: 2 },
  dailyHistory: {
    '2026-10-08': { date: '2026-10-08', completed: true, won: true, mistakes: 1, completedDay: '2026-10-08' },
    '2026-10-09': { date: '2026-10-09', completed: true, won: false, mistakes: 4, completedDay: '2026-10-09' },
  },
  progression: {
    version: 1,
    ledger: {
      'daily:2026-10-08': { xp: 100, base: 100, kind: 'daily', at: now - 86400000, d: '2026-10-08' },
      'daily:2026-10-09': { xp: 100, base: 100, kind: 'daily', at: now, d: '2026-10-09' },
      'challenge:a1': { xp: 30, base: 30, kind: 'challenge', at: now, d: '2026-10-09', m: { q: true } },
    },
    kit: { grants: { 'starter:curbside': { item: 'curbside', qty: 1, source: 'starter', at: now - 86400000 } }, uses: {}, claims: {} },
    seen: { level: 1, stages: {} },
    migrated: now - 86400000,
  },
  systemsBoards: { 'cardiology-1': { won: true, finishedAt: '2026-10-09T10:00:00Z' } },
}
const snapXp = (s) => totalXp(s.progression)
const merged1 = mergeSnapshots(guest, {})
ok(snapXp(merged1) === snapXp(guest) && Object.keys(merged1.dailyHistory).length === 2, `new account: guest progress carried over unchanged (${snapXp(merged1)} XP, 2 Dailies)`)
ok(kitCounts(merged1.progression).curbside === 1 && merged1.systemsBoards['cardiology-1']?.won, 'new account: tools and solved boards carried over')
// The same guest data merged again (a second sign-in, or the cloud copy of
// this very device) adds nothing.
const merged2 = mergeSnapshots(merged1, merged1)
ok(snapXp(merged2) === snapXp(guest), 'merging the same progress twice does not duplicate XP')
ok(kitCounts(merged2.progression).curbside === 1, 'merging twice does not duplicate tools')
// An existing account with its own history on another device.
const cloud = {
  stats: { gamesPlayed: 10, gamesWon: 9, currentStreak: 1, maxStreak: 6 },
  dailyHistory: { '2026-10-01': { date: '2026-10-01', completed: true, won: true, mistakes: 0, completedDay: '2026-10-01' }, '2026-10-08': guest.dailyHistory['2026-10-08'] },
  progression: {
    version: 1,
    ledger: { 'daily:2026-10-01': { xp: 100, base: 100, kind: 'daily', at: now - 8 * 86400000, d: '2026-10-01' }, 'daily:2026-10-08': guest.progression.ledger['daily:2026-10-08'] },
    kit: { grants: { 'level:2': { item: 'curbside', qty: 1, source: 'level', at: now - 7 * 86400000 } }, uses: {}, claims: {} },
    seen: { level: 2, stages: {} },
    migrated: now - 30 * 86400000,
  },
}
const merged3 = mergeSnapshots(guest, cloud)
ok(snapXp(merged3) === 330, `existing account: union of both, the shared Daily counted once (${snapXp(merged3)} XP, expected 330)`)
ok(Object.keys(merged3.dailyHistory).length === 3, 'existing account: 3 distinct Dailies')
ok(kitCounts(merged3.progression).curbside === 2, 'existing account: tools from both, none duplicated')
ok((merged3.stats?.maxStreak || 0) >= 6, 'existing account: the longer best streak is kept')

console.log(fail ? `${fail} FAILED (${pass} passed)` : `ALL UX FLOW CHECKS PASSED (${pass} passed)`)
process.exit(fail ? 1 : 0)
