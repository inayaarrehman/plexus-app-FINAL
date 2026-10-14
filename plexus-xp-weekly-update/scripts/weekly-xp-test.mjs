// This Week (Dailies, timed, 7-day streak), the shared timed-XP budget and
// Coverage past its cap. Runs the real progression store against an
// in-memory localStorage with a pinned time zone.
//   node scripts/weekly-xp-test.mjs
import { pinTimeZoneForTesting } from '../src/utils/calendar.js'

const store = {}
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v)
  },
  removeItem: (k) => delete store[k],
}
pinTimeZoneForTesting('America/Los_Angeles')
const C = await import('../src/progression/config.js')
const E = await import('../src/progression/engine.js')
const S = await import('../src/progression/store.js')

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
const HISTORY_KEY = 'medconnections.dailyHistory.v1'
const reset = () => {
  for (const k of Object.keys(store)) delete store[k]
}
const load = () => S.loadProgression()
const save = (st) => localStorage.setItem('plexus.progression.v1', JSON.stringify(st))
const history = () => JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
const at = (iso) => {
  const t = Date.parse(iso)
  Date.now = () => t
  return t
}
const puzzle = (id) => ({ id, categories: [{ level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }] })
const gl = [0, 1, 2, 3].map((i) => ({ correct: true, catIndexes: [i, i, i, i] }))
// Finish `key`'s Daily at noon local (or `time`), writing Daily history the way
// the app does before progression is recorded.
function daily(key, { won = true, late = false, time = '12:00:00' } = {}) {
  at(`${key}T${time}-07:00`)
  const h = history()
  h[key] = { date: key, completed: true, won, mistakes: won ? 0 : 4, completedDay: late ? 'later' : key }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  return S.recordDailyFinish({ dateKey: key, isToday: true, puzzle: puzzle(`daily-${key}`), won, mistakes: won ? 0 : 4, guessLog: won ? gl : [], history: h })
}
const goal = (id, now = Date.now()) => E.roundsProgress(load(), now, history()).goals.find((g) => g.id === id)
const week = (now = Date.now()) => E.roundsProgress(load(), now, history())
const days = (from, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${from}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10))

console.log('[1] Every-day goal: each day Monday to Sunday kept')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const wk = days('2026-10-12', 7) // Mon 12 .. Sun 18
  for (const d of wk.slice(0, 6)) daily(d)
  ok(goal('streak').count === 6 && !goal('streak').done, 'six days kept by Saturday: 6/7, not done')
  ok(goal('dailies').done && !week().complete, 'Dailies goal done alone does not pay')
  const r = daily(wk[6], { won: false })
  ok(goal('streak').done && week().paid, 'Sunday completes 7/7 even with a loss, and pays the week (Dailies + every day)')
  ok(r.lines.some((l) => l[0] === 'This Week' && l[1] === C.XP.rounds), 'the existing 250 XP weekly reward')
}

console.log('[2] A streak carried in from last week does not complete this week')
{
  reset()
  at('2026-10-05T08:00:00-07:00')
  S.ensureProgression()
  for (const d of days('2026-10-05', 7)) daily(d) // full week before
  daily('2026-10-12') // Monday of the new week
  ok(S.streakInfo(load(), history(), '2026-10-12').current === 8, 'the streak itself is 8 days')
  ok(goal('streak').count === 1 && !goal('streak').done, 'but this week has only 1 of 7 days')
  const prior = E.roundsProgress(load(), Date.parse('2026-10-11T20:00:00-07:00'), history())
  ok(prior.goals.find((g) => g.id === 'streak').done && prior.paid, 'last week completed and was paid in its own week')
  ok(!week().paid, 'this week is unpaid')
}

console.log('[3] Lost, late and missed days')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  daily('2026-10-12')
  daily('2026-10-13', { won: false })
  ok(goal('streak').count === 2 && goal('dailies').count === 2, 'a lost Daily, finished on its day, keeps the day (any finished Daily counts)')
  ok(S.streakInfo(load(), history(), '2026-10-14').current === 0, 'while the win streak on Home still ends on a loss (unchanged)')
  daily('2026-10-14', { late: true })
  ok(goal('streak').count === 2, 'a Daily finished after its date does not keep the day')
  // Opening the app (no Daily finished) does nothing.
  at('2026-10-15T09:00:00-07:00')
  S.ensureProgression()
  ok(goal('streak').count === 2 && goal('dailies').count === 3, 'opening the app keeps nothing')
}

console.log('[4] Coverage protects a day for the streak goal but is not a Daily')
{
  reset()
  at('2026-09-28T08:00:00-07:00')
  S.ensureProgression()
  // 14 Dailies before the week: 2 Coverage held.
  for (const d of days('2026-09-28', 14)) daily(d)
  ok(E.kitCounts(load()).shield === 2, 'two Coverage held')
  const wk = days('2026-10-12', 7)
  daily(wk[0])
  daily(wk[1])
  // Miss Wednesday; Thursday's Daily uses one Coverage for it.
  const r = daily(wk[3])
  ok(JSON.stringify(r.coverageUsed) === JSON.stringify([wk[2]]), 'Thursday covers Wednesday')
  ok(goal('streak').count === 4 && goal('dailies').count === 3, 'Wednesday counts for the streak (4/7) but Dailies stay at 3')
  for (const d of wk.slice(4)) daily(d)
  ok(goal('streak').done && week().paid, 'covered week completes the streak goal')
}

console.log('[5] A missed Sunday covered on Monday pays last week, once, in last week')
{
  // Dailies done, no timed sessions: the week needs the streak goal.
  reset()
  at('2026-09-28T08:00:00-07:00')
  S.ensureProgression()
  for (const d of days('2026-09-28', 14)) daily(d)
  const wk = days('2026-10-12', 7)
  for (const d of wk.slice(0, 6)) daily(d)
  // Dailies (6) is done; give no timed sessions, so the week needs the streak.
  const pw = E.weekOf(Date.parse(`${wk[0]}T12:00:00-07:00`))
  ok(!E.weekProgress(load(), pw, history()).paid, 'Saturday night: 1 goal (Dailies), unpaid')
  const r = daily('2026-10-19') // Monday: covers Sunday the 18th
  ok(r.coverageUsed.includes('2026-10-18'), "Monday's Daily covers Sunday")
  const last = E.weekProgress(load(), pw, history())
  ok(last.paid && last.goals.find((g) => g.id === 'streak').done, 'last week now has 7/7 and is paid')
  const entry = load().ledger[`rounds:${pw.key}`]
  ok(entry && E.inWeek(entry, pw), 'the payment is dated inside last week')
  ok(!week().paid, 'and does not count as this week being paid')
  daily('2026-10-20')
  ok(Object.values(load().ledger).filter((e) => e.kind === 'rounds' && E.inWeek(e, pw)).length === 1, 'never paid twice')
}

console.log('[6] Time zone boundaries')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const wk = days('2026-10-12', 7)
  for (const d of wk.slice(0, 6)) daily(d)
  daily(wk[6], { time: '23:58:00' }) // Sunday 11:58 PM local
  ok(goal('streak', Date.parse('2026-10-18T23:59:00-07:00')).done, 'Sunday 11:58 PM local still counts for this week')
  at('2026-10-19T00:01:00-07:00')
  ok(goal('streak').count === 0 && !week().paid, 'Monday 12:01 AM starts a fresh week')
}

console.log('[7] Timed XP: one shared daily budget (150 full, then half, cap 225)')
{
  reset()
  at('2026-10-12T09:00:00-07:00')
  S.ensureProgression()
  const s = (n, correct = 20, answers = 22) => S.recordChallengeSession({ completedAt: `c${n}`, roundsCorrect: correct, actions: answers })
  ok(E.timedXpStatus(load()).tier === 'full', 'fresh day: full XP')
  const paid = [s(1), s(2), s(3), s(4), s(5), s(6)].map((r) => r.gained)
  ok(JSON.stringify(paid) === JSON.stringify([60, 60, 45, 30, 30, 0]), 'maxed sessions pay 60, 60, 45, 30, 30, 0: ' + paid)
  ok(E.timedEarnedOn(load(), '2026-10-12') === 225, 'exactly 225 timed XP today')
  ok(E.timedXpStatus(load()).tier === 'done', 'status: no more timed XP today')
  const race = S.recordRaceFinish({ raceId: 'r1', answered: 10, correct: 6 })
  const win = S.recordRaceWin({ raceId: 'r1' })
  ok(race.gained === 0 && win.gained === 0 && race.timedNote === 'limit', 'Race draws on the same budget (switching modes does not reset it)')
  ok(goal('timed').done, 'sessions past the limit still count toward This Week')
  at('2026-10-13T00:05:00-07:00')
  ok(E.timedXpStatus(load()).tier === 'full' && s(7).gained === 60, 'the budget resets at local midnight')
}
{
  reset()
  at('2026-10-12T09:00:00-07:00')
  S.ensureProgression()
  S.recordChallengeSession({ completedAt: 'a', roundsCorrect: 20, actions: 22 })
  S.recordChallengeSession({ completedAt: 'b', roundsCorrect: 20, actions: 22 })
  const st = E.timedXpStatus(load())
  ok(st.tier === 'full' && st.fullLeft === 30 && st.left === 105, 'status shows what is left: ' + JSON.stringify(st))
  S.recordChallengeSession({ completedAt: 'c', roundsCorrect: 20, actions: 22 })
  const st2 = E.timedXpStatus(load())
  ok(st2.tier === 'reduced' && st2.left === 60, 'reduced tier with 60 XP left at half rate')
}

console.log('[8] Qualifying sessions')
{
  reset()
  at('2026-10-12T09:00:00-07:00')
  S.ensureProgression()
  const idle = S.recordChallengeSession({ completedAt: 'idle', roundsCorrect: 0, actions: 0 })
  const wrong = S.recordChallengeSession({ completedAt: 'wrong', roundsCorrect: 0, actions: 9 })
  ok(idle.gained === 0 && wrong.gained === 0 && goal('timed').count === 0, 'an idle run or no correct answers: no XP, does not count')
  const two = S.recordChallengeSession({ completedAt: 'two', roundsCorrect: 2, actions: 2 })
  ok(two.gained === 6 && goal('timed').count === 0, 'two answers: XP for the 2 correct answers, but it does not count toward This Week')
  const shortRace = S.recordRaceFinish({ raceId: 'short', answered: 2, correct: 2 })
  const shortWin = S.recordRaceWin({ raceId: 'short' })
  ok(shortRace.gained === 0 && shortWin.gained === 0 && goal('timed').count === 0, 'a race that does not qualify earns nothing and does not count')
  const zeroRace = S.recordRaceFinish({ raceId: 'zero', answered: 10, correct: 0 })
  ok(zeroRace.gained === 0 && goal('timed').count === 0, 'a race with nothing correct does not count')
  const good = S.recordChallengeSession({ completedAt: 'good', roundsCorrect: 3, actions: 3 })
  ok(good.gained === 9 && goal('timed').count === 1, 'three answers with one or more correct qualifies')
  const again = S.recordChallengeSession({ completedAt: 'good', roundsCorrect: 3, actions: 3 })
  ok(again.gained === 0 && goal('timed').count === 1, 'recording the same session again (refresh) changes nothing')
  S.recordRaceFinish({ raceId: 'good-race', answered: 10, correct: 4 })
  S.recordRaceFinish({ raceId: 'good-race', answered: 10, correct: 4 })
  ok(goal('timed').count === 2, 'a qualifying race counts once')
}

console.log('[9] Systems XP is unchanged')
{
  reset()
  at('2026-10-12T09:00:00-07:00')
  S.ensureProgression()
  const r1 = S.recordSystemFinish({ puzzle: puzzle('b1'), system: 'Cardiology', won: true, guessLog: gl, boardId: 'b1', attempts: 1 })
  const r2 = S.recordSystemFinish({ puzzle: puzzle('b2'), system: 'Cardiology', won: true, guessLog: gl, boardId: 'b2', attempts: 3 })
  ok(r1.gained === 100 && r2.gained === 50, 'Systems pay 100 / 75 / 50 / 25 by attempt')
  const st = load()
  for (let i = 0; i < 6; i++) E.award(st, { id: `sp${i}`, xp: 100, kind: 'syspuzzle', at: Date.now() })
  save(st)
  const r3 = S.recordSystemFinish({ puzzle: puzzle('b3'), system: 'Cardiology', won: true, guessLog: gl, boardId: 'b3', attempts: 1 })
  ok(r3.gained === 50, 'past 600 practice XP in a day, Systems still taper to half (unchanged)')
  ok(!goal('timed').count && !E.roundsProgress(load(), Date.now(), history()).goals.some((g) => g.id === 'systems'), 'Systems boards are not a weekly goal')
}

console.log('[10] Coverage past the cap: a puzzle tool, or 50 XP, once')
{
  reset()
  at('2026-09-01T08:00:00-07:00')
  S.ensureProgression()
  for (const d of days('2026-09-01', 21)) daily(d)
  const g3 = load().kit.grants['coverage:3']
  ok(E.kitCounts(load()).shield === 2 && g3?.source === 'coverage-alt' && C.PUZZLE_TOOLS.includes(g3.item), 'third Coverage at the cap became ' + g3?.item)
  ok(!(E.pendingClaims(load()).shield || []).length, 'no Coverage claim is left waiting')
  // Fill every unlocked puzzle tool, then earn the fourth.
  const st = load()
  for (const it of C.PUZZLE_TOOLS) st.kit.grants[`fill:${it}`] = { item: it, qty: 5, source: 'test', at: Date.now() }
  save(st)
  const xpBefore = E.totalXp(load())
  let got = null
  for (const d of days('2026-09-22', 7)) {
    const r = daily(d)
    if (r.coverageAlt.length) got = r
  }
  ok(got && got.coverageAlt[0].xp === C.XP.coverageAlt && got.lines.some((l) => l[0] === 'Coverage full' && l[1] === 50), 'every tool full: 50 XP instead, shown to the player')
  ok(load().ledger['coverage:4:xp']?.xp === 50 && load().kit.grants['coverage:4']?.item === 'coverage-xp', 'recorded under the Coverage id')
  const again = S.ensureProgression()
  void again
  ok(Object.keys(load().ledger).filter((k) => k.startsWith('coverage:4')).length === 1 && E.totalXp(load()) > xpBefore, 'paid once; reopening does not pay again')
  // Using Coverage frees room: the next one is Coverage again.
  const st2 = load()
  st2.kit.uses['shield:x'] = { item: 'shield', at: Date.now(), m: { date: '2026-01-01' } }
  save(st2)
  for (const d of days('2026-09-29', 7)) daily(d)
  ok(load().kit.grants['coverage:5']?.item === 'shield' && E.kitCounts(load()).shield === 2, 'with room again, the next one is Coverage')
}

console.log('[11] Older saves: overflow claims are settled once, nothing duplicated')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const st = load()
  st.kit.grants['coverage:1'] = { item: 'shield', qty: 1, source: 'coverage', at: Date.now() }
  st.kit.grants['coverage:2'] = { item: 'shield', qty: 1, source: 'coverage', at: Date.now() }
  st.kit.grants['coverage:3'] = { item: 'shield', qty: 1, source: 'coverage', at: Date.now(), pending: true }
  st.kit.grants['coverage:4'] = { item: 'shield', qty: 1, source: 'coverage', at: Date.now(), pending: true }
  save(st)
  const toolsBefore = C.PUZZLE_TOOLS.reduce((a, it) => a + E.kitCounts(load())[it], 0)
  S.ensureProgression()
  const after = load()
  ok(E.kitCounts(after).shield === 2 && !(E.pendingClaims(after).shield || []).length, 'two held Coverage kept; the two waiting claims are gone')
  const toolsAfter = C.PUZZLE_TOOLS.reduce((a, it) => a + E.kitCounts(after)[it], 0)
  ok(toolsAfter === toolsBefore + 2 && after.kit.grants['coverage:3'].source === 'coverage-alt', 'each became one puzzle tool')
  S.ensureProgression()
  S.ensureProgression()
  ok(C.PUZZLE_TOOLS.reduce((a, it) => a + E.kitCounts(load())[it], 0) === toolsAfter, 'running again changes nothing')
  // A save with room: the waiting claim is taken in as Coverage.
  const st2 = load()
  st2.kit.uses['shield:a'] = { item: 'shield', at: Date.now(), m: { date: '2026-09-01' } }
  st2.kit.grants['coverage:9'] = { item: 'shield', qty: 1, source: 'coverage', at: Date.now(), pending: true }
  save(st2)
  S.ensureProgression()
  ok(E.kitCounts(load()).shield === 2 && !!load().kit.claims['coverage:9'], 'with room, a waiting claim becomes Coverage')
}
{
  // Two devices settle the same Coverage differently (one a tool, one XP).
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const a = load()
  a.kit.grants['coverage:3'] = { item: 'lab', qty: 1, source: 'coverage-alt', at: Date.now() }
  const b = load()
  b.kit.grants['coverage:3'] = { item: 'coverage-xp', qty: 0, source: 'coverage-alt', at: Date.now() }
  E.award(b, { id: 'coverage:3:xp', xp: 50, kind: 'coverage-alt', at: Date.now() })
  save(E.mergeStates(a, b))
  S.ensureProgression()
  const m = load()
  ok(m.kit.grants['coverage:3'].item === 'lab' && !m.ledger['coverage:3:xp'], 'after a merge only one alternative remains (the tool)')
}

console.log('[12] Switching rules mid-week keeps progress and claimed rewards')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const st = load()
  // Under the old rules: 2 Dailies, 2 Systems boards, the reward paid, tool not yet chosen.
  E.award(st, { id: 'daily:2026-10-12', xp: 100, kind: 'daily', at: Date.parse('2026-10-12T12:00:00-07:00') })
  E.award(st, { id: 'daily:2026-10-13', xp: 100, kind: 'daily', at: Date.parse('2026-10-13T12:00:00-07:00') })
  E.mark(st, { id: 'sysweek:W:b1', kind: 'sysweek', at: Date.parse('2026-10-13T13:00:00-07:00'), m: { board: 'b1' } })
  E.mark(st, { id: 'sysweek:W:b2', kind: 'sysweek', at: Date.parse('2026-10-13T13:10:00-07:00'), m: { board: 'b2' } })
  E.award(st, { id: 'challenge:old1', xp: 30, kind: 'challenge', at: Date.parse('2026-10-13T14:00:00-07:00') })
  const wk = E.weekOf(Date.parse('2026-10-13T12:00:00-07:00')).key
  E.award(st, { id: `rounds:${wk}`, xp: 250, kind: 'rounds', at: Date.parse('2026-10-13T13:10:00-07:00') })
  save(st)
  at('2026-10-14T09:00:00-07:00')
  const xp0 = E.totalXp(load())
  S.ensureProgression()
  ok(E.totalXp(load()) === xp0, 'no XP added or removed by the update')
  ok(goal('dailies').count === 2 && goal('timed').count === 1, 'Daily and timed progress carry over (older timed entries count)')
  ok(week().paid && E.weeklyChoicesDue(load()).includes(wk), 'the reward already paid stays paid; its tool choice still waits')
  daily('2026-10-14')
  S.recordChallengeSession({ completedAt: 'new1', roundsCorrect: 5, actions: 6 })
  ok(Object.keys(load().ledger).filter((k) => k.startsWith('rounds:')).length === 1, 'completing goals again this week does not pay twice')
}

console.log(failed ? `\n${failed} FAILED (${passed} passed)` : `\nALL WEEKLY AND TIMED XP CHECKS PASSED (${passed} passed)`)
process.exit(failed ? 1 : 0)
