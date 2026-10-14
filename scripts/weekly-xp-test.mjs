// This Week (Dailies, timed, a Daily without a tool), the shared timed-XP budget and
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
function daily(key, { won = true, late = false, time = '12:00:00', mistakes = won ? 0 : 4, tools = 0, archive = false, playedOn = null } = {}) {
  at(`${playedOn || key}T${time}-07:00`)
  const h = history()
  h[key] = { date: key, completed: true, won, mistakes, completedDay: late ? 'later' : key }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  return S.recordDailyFinish({ dateKey: key, isToday: !archive && !late, puzzle: puzzle(`daily-${key}`), won, mistakes, guessLog: won ? gl : [], toolsUsed: tools, history: h })
}
const goal = (id, now = Date.now()) => E.roundsProgress(load(), now, history()).goals.find((g) => g.id === id)
const week = (now = Date.now()) => E.roundsProgress(load(), now, history())
const days = (from, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${from}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10))

console.log('[1] The three goals are three different kinds of play')
{
  ok(JSON.stringify(C.WEEKLY_GOALS.map((g) => [g.id, g.label, g.target])) === JSON.stringify([['dailies', 'Complete 3 Daily Challenges', 3], ['timed', 'Finish 2 timed sessions', 2], ['unaided', 'Solve a Daily without using a tool', 1]]), 'Dailies, timed sessions, a Daily solved without a tool (no Systems, no every-day goal)')
}

console.log('[2] Solve a Daily without using a tool')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const wk = days('2026-10-12', 7) // Mon 12 .. Sun 18
  daily(wk[0], { won: false })
  ok(goal('unaided').count === 0 && goal('dailies').count === 1, 'a lost Daily counts for Dailies but is not solved')
  daily(wk[1], { tools: 1, mistakes: 1 })
  ok(goal('unaided').count === 0 && goal('dailies').count === 2, 'a Daily solved with a tool does not count')
  ok(!week().complete, 'no goal done yet')
  const r = daily(wk[2], { mistakes: 2 })
  ok(goal('unaided').done && goal('dailies').done, 'a Daily solved with mistakes but no tool counts; 3 Dailies done too')
  ok(week().paid && r.lines.some((l) => l[0] === 'This Week' && l[1] === C.XP.rounds), 'two goals pay the existing 250 XP weekly reward')
  daily(wk[3])
  ok(goal('unaided').count === 1, 'the goal is complete at 1 (it does not run past its target)')
}

console.log('[3] Archive and late Dailies, Coverage and opening the app')
{
  reset()
  at('2026-09-28T08:00:00-07:00')
  S.ensureProgression()
  for (const d of days('2026-09-28', 14)) daily(d)
  ok(E.kitCounts(load()).shield === 2, 'two Coverage held')
  at('2026-10-12T08:00:00-07:00')
  ok(goal('unaided').count === 0 && goal('dailies').count === 0, 'a new week starts empty (last week never counts)')
  daily('2026-10-01', { archive: true, playedOn: '2026-10-12' })
  ok(goal('unaided').count === 0 && goal('dailies').count === 0, 'an Archive Daily (not on its day) counts for neither')
  daily('2026-10-12')
  daily('2026-10-14') // Tuesday missed; Coverage may cover it
  ok(goal('dailies').count === 2, 'Coverage is never a Daily')
  at('2026-10-15T09:00:00-07:00')
  S.ensureProgression()
  ok(goal('dailies').count === 2 && goal('unaided').count === 1, 'opening the app adds nothing')
}

console.log('[4] Perfect Dailies from before the marker existed still count')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const st = load()
  st.ledger['perfect:2026-10-12'] = { xp: 25, base: 25, kind: 'perfect', at: Date.parse('2026-10-12T12:00:00-07:00'), d: '2026-10-12' }
  save(st)
  ok(goal('unaided').done, 'a Perfect Daily (won, no mistakes, no tools) this week completes the goal')
}

console.log('[5] Outlook: what is still possible this week')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  const sun = Date.parse('2026-10-18T10:00:00-07:00')
  const p = E.roundsProgress(load(), sun, history())
  let o = E.weekOutlook(p, '2026-10-18')
  ok(o.possible.unaided && o.possible.timed && !o.possible.dailies && o.attainable, "Sunday with nothing done: today's Daily can still be solved without a tool, so the reward is reachable with timed sessions")
  at('2026-10-18T12:00:00-07:00')
  daily('2026-10-18', { tools: 1 })
  o = E.weekOutlook(E.roundsProgress(load(), Date.now(), history()), '2026-10-18')
  ok(!o.possible.unaided && !o.attainable, "Sunday's Daily solved with a tool: that goal is out of reach this week")
}

console.log('[6] Time zone boundaries')
{
  reset()
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  daily('2026-10-18', { time: '23:58:00' }) // Sunday 11:58 PM local
  ok(goal('unaided', Date.parse('2026-10-18T23:59:00-07:00')).done, 'Sunday 11:58 PM local still counts for this week')
  at('2026-10-19T00:01:00-07:00')
  ok(goal('unaided').count === 0 && !week().paid, 'Monday 12:01 AM starts a fresh week')
}

console.log('[7] Timed XP: one shared daily budget (150 full, then half, cap 225)')
{
  reset()
  at('2026-10-12T09:00:00-07:00')
  S.ensureProgression()
  const s = (n, correct = 20, answers = 20) => S.recordChallengeSession({ completedAt: `c${n}`, roundsCorrect: correct, actions: answers })
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
  S.recordChallengeSession({ completedAt: 'a', roundsCorrect: 20, actions: 20 })
  S.recordChallengeSession({ completedAt: 'b', roundsCorrect: 20, actions: 20 })
  const st = E.timedXpStatus(load())
  ok(st.tier === 'full' && st.fullLeft === 30 && st.left === 105, 'status shows what is left: ' + JSON.stringify(st))
  S.recordChallengeSession({ completedAt: 'c', roundsCorrect: 20, actions: 20 })
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

console.log('[9] Systems XP by attempt, no taper')
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
  ok(r3.gained === 100, 'no daily taper any more: a board pays what its chip says, however much was played that day')
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
  ok(m.kit.grants['coverage:3'].item === 'lab' && !m.ledger['coverage:3:xp']?.xp, 'after a merge only one alternative remains (the tool; the XP entry is voided)')
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
