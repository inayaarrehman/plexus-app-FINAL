// Your Tools economy checks: node scripts/tools-test.mjs
// Runs the real progression store against an in-memory localStorage with a
// pinned time zone, so day and week boundaries are exact.
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
const K = await import('../src/progression/streak.js')
const { mergeSnapshots } = await import('../src/utils/progressSync.js')

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
const reset = () => {
  for (const k of Object.keys(store)) delete store[k]
}
const save = (st) => localStorage.setItem('plexus.progression.v1', JSON.stringify(st))
const load = () => S.loadProgression()
const realNow = Date.now
const at = (iso) => {
  const t = Date.parse(iso)
  Date.now = () => t
  return t
}
const puzzle = (id) => ({ id, categories: [{ level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }] })
const gl = [0, 1, 2, 3].map((i) => ({ correct: true, catIndexes: [i, i, i, i] }))
const finishDaily = (key, extra = {}) => {
  const h = extra.history || { [key]: { completed: true, won: true, mistakes: 0, completedDay: key } }
  return S.recordDailyFinish({ dateKey: key, isToday: true, puzzle: puzzle(`daily-${key}`), won: true, mistakes: extra.mistakes ?? 0, guessLog: gl, toolsUsed: extra.toolsUsed ?? 0, history: h })
}

console.log('[1] New player: starter Consult once, level schedule, unlocks')
{
  reset()
  at('2026-10-12T10:00:00-07:00')
  S.ensureProgression()
  ok(E.kitCounts(load()).curbside === 1, 'a new player starts with one Consult')
  S.ensureProgression()
  ok(E.kitCounts(load()).curbside === 1, 'the starter Consult is given once')
  // Push through levels with plain XP (Archive-style awards).
  const st = load()
  E.award(st, { id: 'x1', xp: 13000, kind: 'archive', at: Date.now() })
  save(st)
  const r = S.recordChallengeSession({ completedAt: 'c1', roundsCorrect: 0 })
  const lvl = r.after.level
  const got = Object.entries(load().kit.grants).filter(([id]) => id.startsWith('lvl2:'))
  const byLevel = Object.fromEntries(got.map(([id, g]) => [id.split(':')[1], g.item]))
  ok(byLevel['2'] === 'curbside' && byLevel['3'] === 'lab' && !byLevel['4'] && byLevel['5'] === 'second-opinion', 'Level 2 Consult, 3 Rule Out, 5 Second Opinion')
  ok(byLevel['6'] === 'curbside' && byLevel['7'] === 'lab' && byLevel['8'] === 'second-opinion' && byLevel['9'] === 'curbside', 'from Level 6 one tool per level, cycling')
  ok(lvl >= 15, `reached level ${lvl}`)
  const c = E.kitCounts(load())
  ok(c.curbside === 5, `Consult capped at 5 (held ${c.curbside})`)
  const pend = E.pendingClaims(load())
  ok((pend.curbside || []).length >= 1, 'awards past the cap wait as pending claims')
  // Unlocks.
  ok(!E.itemOpen('lab', 2) && E.itemOpen('lab', 3) && !E.itemOpen('second-opinion', 4) && E.itemOpen('second-opinion', 5), 'Rule Out opens at 3, Second Opinion at 5')
  // Claim: refused at cap, allowed after spending.
  ok(S.claimTool('curbside') === false, 'a pending claim cannot be taken in at the cap')
  ok(S.spendTool('curbside', 'daily-2026-10-12:1', { mode: 'daily' }) === true, 'spend a Consult')
  ok(S.claimTool('curbside') === true && E.kitCounts(load()).curbside === 5, 'after spending, a pending claim fills the slot')
}

console.log('[2] One tool per attempt; locked or empty tools spend nothing')
{
  reset()
  at('2026-10-12T10:00:00-07:00')
  S.ensureProgression()
  ok(S.spendTool('curbside', 'daily-2026-10-12:1', { mode: 'daily' }) === true, 'first tool in an attempt is spent')
  ok(S.spendTool('curbside', 'daily-2026-10-12:1', { mode: 'daily' }) === false, 'a second tool in the same attempt is refused')
  ok(S.spendTool('curbside', 'daily-2026-10-12:2', { mode: 'daily' }) === false, 'an empty tool cannot be spent (nothing changes)')
  const st = load()
  st.kit.grants.g1 = { item: 'lab', qty: 1, source: 'test', at: Date.now() }
  save(st)
  ok(S.spendTool('lab', 'daily-2026-10-12:3', { mode: 'daily' }) === false && E.kitCounts(load()).lab === 1, 'Rule Out below Level 3 is refused and not spent')
  ok(S.spendTool('imaging', 'x') === false, 'a removed tool can never be spent')
  // Explicit replay is a new attempt and spends inventory again.
  const st2 = load()
  st2.kit.grants.g2 = { item: 'curbside', qty: 2, source: 'test', at: Date.now() }
  save(st2)
  ok(S.spendTool('curbside', 'daily-2026-10-12:4', { mode: 'daily' }) && S.spendTool('curbside', 'daily-2026-10-12:5', { mode: 'daily' }), 'a replay (new attempt id) can use a tool again, spending it')
}

console.log('[2b] Tools are for Dailies only: Systems, timed modes and stale routes spend nothing')
{
  reset()
  at('2026-10-12T10:00:00-07:00')
  S.ensureProgression()
  const st = load()
  st.kit.grants.g9 = { item: 'curbside', qty: 3, source: 'sysweek', at: Date.now() }
  save(st)
  const held = E.kitCounts(load()).curbside
  ok(S.spendTool('curbside', 'sys-cardiology-1:1', { mode: 'system' }) === false, 'a Systems board cannot use a tool')
  ok(S.spendTool('curbside', 'daily-2026-10-12:7', { mode: 'system' }) === false, 'a Systems caller with a Daily-looking id is refused')
  ok(S.spendTool('curbside', 'sys-cardiology-1:2', { mode: 'daily' }) === false, 'a non-Daily attempt id claiming Daily is refused')
  ok(S.spendTool('curbside', 'challenge:1', { mode: 'challenge' }) === false && S.spendTool('curbside', 'race:abc', { mode: 'race' }) === false, '3 Minutes and Race cannot use a tool')
  ok(S.spendTool('curbside', 'daily-2026-10-12:8') === false, 'a caller that does not say Daily is refused')
  ok(S.spendTool('curbside', 'daily-2026-10-11:1', { mode: 'archive' }) === false, 'an Archive board cannot use a tool')
  ok(E.kitCounts(load()).curbside === held && Object.keys(load().kit.uses).length === 0, 'nothing was consumed by any refused use')
  ok(S.spendTool('curbside', 'daily-2026-10-12:9', { mode: 'daily' }) === true && E.kitCounts(load()).curbside === held - 1, 'tools earned outside Dailies still work in a Daily')
  ok(S.toolsAllowedIn('daily') && !S.toolsAllowedIn('system') && !S.toolsAllowedIn('archive') && !S.toolsAllowedIn('challenge') && !S.toolsAllowedIn('race'), 'only Daily boards show tools')
}

console.log('[3] Perfect, assisted solves and first-completion credit')
{
  reset()
  at('2026-10-12T10:00:00-07:00')
  const r = finishDaily('2026-10-12', { toolsUsed: 1 })
  ok(r.lines.some((l) => l[0] === 'Daily') && !r.lines.some((l) => l[0] === 'Perfect'), 'an assisted Daily earns normal completion credit but not Perfect')
  reset()
  const r2 = finishDaily('2026-10-12', { mistakes: 1, toolsUsed: 1 })
  ok(!r2.lines.some((l) => l[0] === 'Perfect'), 'a mistake restored by Second Opinion is still not perfect')
  reset()
  const r3 = finishDaily('2026-10-12')
  ok(r3.lines.some((l) => l[0] === 'Perfect' && l[1] === C.XP.perfect), 'no mistakes and no tools: Perfect bonus kept at ' + C.XP.perfect)
  ok(!Object.values(load().kit.grants).some((g) => g.source === 'perfect'), 'perfect Dailies no longer grant tools')
}

console.log('[4] Coverage: earned every 7 scheduled Dailies from this version, cap 2, used once per missed day')
{
  reset()
  at('2026-10-01T09:00:00-07:00')
  // Dailies completed before this version: not counted (owner's decision).
  const pre = E.emptyState()
  for (let d = 1; d <= 9; d++) E.award(pre, { id: `daily:2026-09-${String(d).padStart(2, '0')}`, xp: 100, kind: 'daily', at: Date.parse(`2026-09-${String(d).padStart(2, '0')}T12:00:00-07:00`) })
  save(pre)
  at('2026-10-12T08:00:00-07:00')
  S.ensureProgression()
  ok(E.kitCounts(load()).shield === 0, 'past Dailies are not back-paid as Coverage')
  const history = {}
  for (let d = 12; d <= 25; d++) {
    const key = `2026-10-${d}`
    at(`${key}T12:00:00-07:00`)
    history[key] = { completed: true, won: true, mistakes: 0, completedDay: key }
    finishDaily(key, { history })
  }
  ok(E.kitCounts(load()).shield === 2, 'two Coverage after 14 Dailies')
  const archive = S.recordDailyFinish({ dateKey: '2026-10-01', isToday: false, puzzle: puzzle('daily-2026-10-01'), won: true, mistakes: 0, guessLog: gl, history })
  ok(S.coverageProgress(load()).count === 14 && archive, 'Archive replays do not count toward Coverage')
  for (let d = 26; d <= 28; d++) {
    const key = `2026-10-${d}`
    at(`${key}T12:00:00-07:00`)
    history[key] = { completed: true, won: true, mistakes: 0, completedDay: key }
    finishDaily(key, { history })
  }
  // 17 Dailies: still 2 held (cap), nothing pending yet (third due at 21).
  ok(E.kitCounts(load()).shield === 2, 'Coverage capped at 2')
  for (let d = 29; d <= 31; d++) {
    const key = `2026-10-${d}`
    at(`${key}T12:00:00-07:00`)
    history[key] = { completed: true, won: true, mistakes: 0, completedDay: key }
    finishDaily(key, { history })
  }
  at('2026-11-01T12:00:00-07:00')
  history['2026-11-01'] = { completed: true, won: true, mistakes: 0, completedDay: '2026-11-01' }
  finishDaily('2026-11-01', { history })
  ok((E.pendingClaims(load()).shield || []).length === 1, 'a third Coverage past the cap waits as a pending claim')
  // Miss Nov 2 and Nov 3, finish Nov 4: two charges cover two missed days.
  at('2026-11-04T12:00:00-07:00')
  history['2026-11-04'] = { completed: true, won: true, mistakes: 0, completedDay: '2026-11-04' }
  const before = load().ledger
  const xpBefore = E.totalXp(load())
  const r = finishDaily('2026-11-04', { history })
  ok(JSON.stringify(r.coverageUsed) === JSON.stringify(['2026-11-02', '2026-11-03']), 'each missed day uses one Coverage, reported to the player: ' + JSON.stringify(r.coverageUsed))
  ok(S.streakInfo(load(), history, '2026-11-04').current === 22, 'streak continues across covered days (covered days add nothing)')
  ok(!Object.keys(load().ledger).some((id) => id.includes('2026-11-02') || id.includes('2026-11-03')) && Object.keys(before).length >= 0 && E.totalXp(load()) - xpBefore === r.gained, 'Coverage awards no solve or completion XP')
  // Sync from another device that also covered Nov 2: no double spend.
  const other = load()
  const merged = E.mergeStates(load(), other)
  ok(Object.values(merged.kit.uses).filter((u) => u.item === 'shield' && u.m?.date === '2026-11-02').length === 1, 'a covered day is spent once across devices and syncs')
  // Not enough charges for the whole gap: nothing is spent.
  ok(K.coverGaps({ '2026-11-01': { completed: true, won: true, completedDay: '2026-11-01' } }, '2026-11-05', new Set(), 2).length === 0, 'a gap longer than the charges held spends nothing')
}

console.log('[5] This Week: any 2 of 3, counted once, Monday reset in local time')
{
  reset()
  at('2026-10-12T09:00:00-07:00') // Monday
  S.ensureProgression()
  const wk = E.weekOf(Date.now()).key
  for (const [i, key] of ['2026-10-12', '2026-10-13'].entries()) {
    at(`${key}T12:00:00-07:00`)
    finishDaily(key)
    void i
  }
  // Systems: the same board twice counts once; a lost board does not count.
  const sp = puzzle('cardiology-starter-1')
  S.recordSystemFinish({ puzzle: sp, system: 'Cardiology', won: true, guessLog: gl, boardId: 'cardiology-starter-1' })
  const replay = S.recordSystemFinish({ puzzle: sp, system: 'Cardiology', won: true, guessLog: gl, boardId: 'cardiology-starter-1' })
  ok(replay.gained === 0, 'a replayed board earns no repeat first-completion XP')
  S.recordSystemFinish({ puzzle: puzzle('gi-starter-1'), system: 'GI', won: false, guessLog: [], boardId: 'gi-starter-1' })
  let rp = E.roundsProgress(load())
  ok(rp.goals.find((g) => g.id === 'systems').count === 1, 'replays count once per board per week; lost boards do not count')
  ok(rp.goals.find((g) => g.id === 'dailies').count === 2 && !rp.complete, 'two Dailies, no goal complete yet')
  const r3 = finishDaily('2026-10-14')
  void r3
  rp = E.roundsProgress(load())
  ok(rp.done === 1 && !rp.complete && !rp.paid, 'one goal done is not enough')
  S.recordChallengeSession({ completedAt: 'cs1', roundsCorrect: 4 })
  const r = S.recordRaceFinish({ raceId: 'race-1', solo: true })
  rp = E.roundsProgress(load())
  ok(rp.done === 2 && rp.complete && rp.paid, 'two goals complete the week')
  ok(r.lines.some((l) => l[0] === 'This Week' && l[1] === 250) && r.weeklyChoice === wk, '250 XP paid and a tool choice offered')
  ok(E.weeklyChoicesDue(load()).includes(wk), 'the chosen-tool reward waits for the player')
  ok(S.chooseWeeklyTool(wk, 'second-opinion') === false, 'a locked tool cannot be chosen')
  ok(!!S.chooseWeeklyTool(wk, 'curbside') && !E.weeklyChoicesDue(load()).includes(wk), 'choose Consult; the choice is made once')
  ok(S.chooseWeeklyTool(wk, 'curbside') === false, 'the weekly tool cannot be claimed twice')
  const more = S.recordChallengeSession({ completedAt: 'cs2', roundsCorrect: 4 })
  ok(!more.lines.some((l) => l[0] === 'This Week'), 'the weekly reward is paid once per week')
  // Sunday 23:30 local still this week; Monday 00:10 local is a new week.
  at('2026-10-18T23:30:00-07:00')
  ok(E.roundsProgress(load()).paid, 'Sunday night is still the same week')
  at('2026-10-19T00:10:00-07:00')
  const nw = E.roundsProgress(load())
  ok(!nw.paid && nw.done === 0 && nw.week.key !== wk, 'resets Monday 00:00 local time')
  // An inactive 3-Minute session (no answers) does not count; an abandoned
  // 3-Minute or Race is never recorded at all.
  S.recordChallengeSession({ completedAt: 'idle', roundsCorrect: 0, actions: 0 })
  ok(E.roundsProgress(load()).goals.find((g) => g.id === 'timed').count === 0, 'an inactive 3-Minute session does not count')
  ok(nw.goals.find((g) => g.id === 'timed').count === 0, 'nothing carried into the new week')
}

console.log('[6] Removed tools convert 1:1 and log the old balance; levels are not paid twice')
{
  reset()
  at('2026-10-01T09:00:00-07:00')
  const old = E.emptyState()
  E.award(old, { id: 'bf', xp: 2000, kind: 'bf-daily', at: Date.now() })
  old.kit.grants['level:6:1'] = { item: 'imaging', qty: 1, source: 'level', at: Date.now() }
  old.kit.grants['level:8:0'] = { item: 'readout', qty: 1, source: 'level', at: Date.now() }
  old.kit.grants['level:14:0'] = { item: 'time-out', qty: 1, source: 'level', at: Date.now() }
  old.kit.grants['rounds:x:item'] = { item: 'time-out', qty: 1, source: 'rounds', at: Date.now() }
  old.kit.grants['level:5:0'] = { item: 'lab', qty: 1, source: 'level', at: Date.now() }
  save(old)
  at('2026-10-12T09:00:00-07:00')
  S.ensureProgression()
  const st = load()
  const c = E.kitCounts(st)
  ok(c.curbside === 1 && c.lab === 2 && c['second-opinion'] === 2, `converted: Consult ${c.curbside}, Rule Out ${c.lab}, Second Opinion ${c['second-opinion']}`)
  ok(st.v2.converted.imaging === 1 && st.v2.converted.readout === 1 && st.v2.converted['time-out'] === 2, 'old balances logged: ' + JSON.stringify(st.v2.converted))
  ok(st.kit.grants['level:6:1'].item === 'imaging', 'original grants kept as a record')
  S.ensureProgression()
  ok(JSON.stringify(E.kitCounts(load())) === JSON.stringify(c), 'conversion runs once (repeat is harmless)')
  const lvl = E.levelInfo(E.totalXp(st)).level
  ok(st.v2.levelFrom === lvl && !Object.keys(st.kit.grants).some((id) => id.startsWith('lvl2:') || id.startsWith('starter:')), 'levels reached before the update are not paid again')
  // Fresh device: empty save gets v2 now, then syncs the older cloud save.
  reset()
  at('2026-10-13T09:00:00-07:00')
  const fresh = E.emptyState()
  fresh.v2 = { at: Date.now(), coverageFrom: Date.now(), levelFrom: 1, converted: {} }
  const merged = E.mergeStates(fresh, old)
  save(merged)
  S.ensureProgression()
  ok(!Object.keys(load().kit.grants).some((id) => id.startsWith('lvl2:')), 'a new device that syncs an older save does not repay old levels')
  const snapMerge = mergeSnapshots({ progression: load() }, { progression: load() })
  ok(E.totalXp(snapMerge.progression) === E.totalXp(load()), 'progress sync merges without double counting')
}

Date.now = realNow
console.log(`\n${failed ? `${failed} FAILED` : 'ALL TOOLS CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
