// Progression rules and abuse cases (October 2026 pass), against the real store.
//   node scripts/progression-test.mjs
const store = {}
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k], key: (i) => Object.keys(store)[i], get length() { return Object.keys(store).length } }
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { pinTimeZoneForTesting } = await import('../src/utils/calendar.js')
pinTimeZoneForTesting('America/Los_Angeles')
const S = await import('../src/progression/store.js')
const E = await import('../src/progression/engine.js')
const C = await import('../src/progression/config.js')
const PS = await import('../src/utils/progressSync.js')

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
let now = Date.parse('2026-10-20T10:00:00-07:00')
Date.now = () => now
const reset = () => {
  for (const k of Object.keys(store)) delete store[k]
  S.ensureProgression()
}
const xp = () => E.totalXp(S.loadProgression())
const linesMatch = (r) => r.lines.reduce((a, l) => a + l[1], 0) === r.gained
const puzzle = (id) => ({ id, categories: [{ level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }] })
const groups = (n) => [0, 1, 2, 3].slice(0, n).map((ci) => ({ correct: true, catIndexes: [ci, ci, ci, ci] }))
const daily = (date, { isToday = true, won = true, mistakes = 0, solved = 4, tools = 0 } = {}) =>
  S.recordDailyFinish({ dateKey: date, isToday, puzzle: puzzle(`daily-${date}`), won, mistakes, guessLog: groups(solved), toolsUsed: tools, history: { [date]: { completed: true, won, mistakes, completedDay: date } } })

console.log('[1] Daily: showing up, solving, perfect')
{
  reset()
  const lost = daily('2026-10-20', { won: false, mistakes: 4, solved: 0 })
  ok(lost.gained === C.XP.daily && linesMatch(lost), `a quick loss pays ${C.XP.daily} (was 100)`)
  reset()
  const won = daily('2026-10-20', { won: true, mistakes: 0, solved: 4 })
  ok(won.gained === 75 + 25 + 50 + 25 && linesMatch(won), 'a perfect solve still pays 175: 75 + 25 win + 50 groups + 25 perfect')
  ok(daily('2026-10-20').gained === 0, 'the same date never pays twice')
  reset()
  const two = daily('2026-10-20', { won: false, mistakes: 4, solved: 2 })
  ok(two.gained === 75 + 15 && linesMatch(two), 'a loss with two groups solved pays 75 + their groups')
}

console.log('[2] Archive: solved Dailies only')
{
  reset()
  const lost = daily('2026-10-12', { isToday: false, won: false, mistakes: 4, solved: 0 })
  ok(lost.gained === 0, 'losing an Archive Daily on purpose earns nothing')
  const won = daily('2026-10-13', { isToday: false, won: true, mistakes: 1, solved: 4 })
  ok(won.gained === C.XP.archive + 50 && linesMatch(won), `a solved Archive Daily pays ${C.XP.archive} + its groups`)
  ok(daily('2026-10-13', { isToday: false }).gained === 0, 'an Archive date pays once')
  const st = S.loadProgression()
  ok(!Object.values(st.ledger).some((e) => e.kind === 'daily' && e.d !== '2026-10-20'), 'Archive Dailies never count as scheduled Dailies (Coverage, This Week)')
}

console.log('[3] 3 Minutes: accuracy counts')
{
  reset()
  const sess = (id, correct, answers, best = false) => S.recordChallengeSession({ completedAt: id, roundsCorrect: correct, actions: answers, isNewBest: best })
  const honest = sess('a', 15, 20)
  ok(honest.gained === 15 * 3 - 5 && linesMatch(honest), 'honest play: 3 per correct minus 1 per wrong (15 right, 5 wrong = 40)')
  const spam = sess('b', 12, 80)
  ok(spam.gained === 0 && spam.qualified === true && spam.timedNote === 'accuracy', 'tapping through (12 right, 68 wrong) earns nothing but still counts toward This Week')
  ok(sess('a', 15, 20).gained === 0, 'the same session never pays twice')
  const best = sess('c', 20, 20, true)
  ok(best.gained === 60 + 15, 'a clean maxed session with a new best pays 60 + 15')
  ok(C.challengeXp({ correct: 0, wrong: 0, newBest: true }) === 0, 'no correct answers: nothing, not even the best bonus')
}

console.log('[4] Race: a real run, once')
{
  reset()
  const tap = S.recordRaceFinish({ raceId: 'm1', answered: 10, correct: 2, runMs: 6000 })
  ok(tap.gained === 0 && tap.qualified === false, 'tapping through every round in 6 seconds earns nothing')
  ok(S.recordRaceWin({ raceId: 'm1' }).gained === 0, 'and its win bonus is not paid either')
  const fast = S.recordRaceFinish({ raceId: 'm2', answered: 10, correct: 9, runMs: 15000 })
  ok(fast.gained === 0, 'under 20 seconds of play is not a qualifying run')
  const real = S.recordRaceFinish({ raceId: 'm3', answered: 10, correct: 7, runMs: 70000 })
  ok(real.gained === C.XP.raceFinish && linesMatch(real), `a qualifying run pays ${C.XP.raceFinish}`)
  ok(S.recordRaceWin({ raceId: 'm3' }).gained === C.XP.raceWin, `a win adds ${C.XP.raceWin}`)
  ok(S.recordRaceFinish({ raceId: 'm3', answered: 10, correct: 7, runMs: 70000 }).gained === 0 && S.recordRaceWin({ raceId: 'm3' }).gained === 0, 'a reconnect or refresh never pays a race twice')
  const part = S.recordRaceFinish({ raceId: 'm4', answered: 7, correct: 7, runMs: 70000 })
  ok(part.gained === 0, 'quitting before the last round earns nothing')
  ok(S.recordRaceFinish({ raceId: 'm5', answered: 10, correct: 7 }).gained > 0, 'older callers without a run time still qualify on answers and correct')
}

console.log('[5] Timed budget: modes share it, midnight resets it')
{
  reset()
  let paid = 0
  for (let i = 0; i < 14; i++) paid += S.recordRaceFinish({ raceId: `b${i}`, answered: 10, correct: 8, runMs: 60000 }).gained
  ok(paid === C.TIMED_XP.cap, `fourteen qualifying races in a day pay ${C.TIMED_XP.cap} in all (${paid})`)
  now = Date.parse('2026-10-21T00:02:00-07:00')
  ok(S.recordRaceFinish({ raceId: 'b-next', answered: 10, correct: 8, runMs: 60000 }).gained === C.XP.raceFinish, 'after local midnight the budget is fresh')
  now = Date.parse('2026-10-20T10:00:00-07:00')
}

console.log('[6] Two tabs and a sync in flight never lose an award')
{
  reset()
  const tabA = S.loadProgression()
  const tabB = S.loadProgression()
  E.award(tabA, { id: 'challenge:A', xp: 30, kind: 'challenge', at: now })
  E.award(tabB, { id: 'daily:2026-10-20', xp: 75, kind: 'daily', at: now })
  S.saveProgression(tabA)
  S.saveProgression(tabB)
  const st = S.loadProgression()
  ok(st.ledger['challenge:A'] && st.ledger['daily:2026-10-20'] && E.totalXp(st) === 105, 'both tabs keep their award (saving merges with what is stored)')
  // A cloud snapshot taken before a Daily finished is applied afterwards.
  const old = PS.snapshotLocal()
  daily('2026-10-19', { won: true })
  const before = xp()
  PS.applySnapshot(old)
  ok(xp() === before, 'applying an older cloud snapshot keeps what was earned meanwhile')
}

console.log('[7] Levels and the next reward')
{
  ok(C.levelCost(1) === 100 && C.levelCost(2) === 180 && E.levelInfo(7260).level === 12, 'curve: Level 2 at 100 XP, Level 12 at 7260')
  ok(C.nextMilestone(2).level === 3 && C.nextMilestone(2).items[0] === 'Rule Out (new)', 'next reward names a new tool')
  ok(C.nextMilestone(11).items.includes('CRISPR (new)') && C.nextMilestone(15).items.includes('CRISPR +1'), 'next reward names CRISPR at 12 and 16')
  let gap = 0
  for (let L = 1; L < 60; L++) gap = Math.max(gap, C.nextMilestone(L).level - L)
  ok(gap <= 2, 'never more than two levels without a reward')
}

console.log('[8] This Week pays once')
{
  reset()
  daily('2026-10-19', { won: true })
  const r = daily('2026-10-20', { won: true })
  const t1 = S.recordChallengeSession({ completedAt: 'w1', roundsCorrect: 10, actions: 12 })
  const t2 = S.recordChallengeSession({ completedAt: 'w2', roundsCorrect: 10, actions: 12 })
  const all = [r, t1, t2].reduce((a, x) => a + (x.lines.find((l) => l[0] === 'This Week')?.[1] || 0), 0)
  ok(all === C.XP.rounds && linesMatch(t2), 'the weekly reward is paid once, with its real amount in the breakdown')
  ok(S.recordChallengeSession({ completedAt: 'w3', roundsCorrect: 10, actions: 12 }).lines.every((l) => l[0] !== 'This Week'), 'never again that week')
}

console.log('[9] Cloud saves from two devices at once never overwrite each other')
{
  const { mergeWrite } = await import('../src/lib/progressRepo.js')
  // A tiny stand-in for the user_progress table: conditional updates on
  // updated_at, like Postgres would apply them.
  const table = new Map()
  let tick = 0
  const sb = {
    from: () => {
      const q = { filters: {} }
      const api = {
        select: () => api,
        eq: (k, v) => ((q.filters[k] = v), api),
        maybeSingle: async () => {
          await new Promise((r) => setTimeout(r, Math.random() * 5))
          const row = table.get(q.filters.user_id)
          return { data: row ? JSON.parse(JSON.stringify(row)) : null, error: null }
        },
        insert: async (row) => {
          if (table.has(row.user_id)) return { error: { message: 'duplicate' } }
          table.set(row.user_id, { ...row, updated_at: `t${++tick}` })
          return { error: null }
        },
        update: (patch) => {
          q.patch = patch
          return api
        },
      }
      api.then = undefined
      const origSelect = api.select
      api.select = (...a) => {
        if (q.patch) {
          return (async () => {
            await new Promise((r) => setTimeout(r, Math.random() * 5))
            const row = table.get(q.filters.user_id)
            if (!row || row.updated_at !== q.filters.updated_at) return { data: [], error: null }
            table.set(q.filters.user_id, { ...row, ...q.patch, updated_at: `t${++tick}` })
            return { data: [{ user_id: q.filters.user_id }], error: null }
          })()
        }
        return origSelect(...a)
      }
      return api
    },
  }
  const snap = (id, xp) => ({ epoch: PS.snapshotLocal().epoch, progression: { ledger: { [id]: { xp, kind: 'daily', at: now, d: '2026-10-20' } }, kit: { grants: {}, uses: {}, claims: {} } } })
  const results = await Promise.all([mergeWrite(sb, 'u1', snap('x:a', 10)), mergeWrite(sb, 'u1', snap('x:b', 20)), mergeWrite(sb, 'u1', snap('x:c', 30))])
  const led = table.get('u1').data.progression.ledger
  ok(results.every((r) => r.ok) && led['x:a'] && led['x:b'] && led['x:c'], 'three simultaneous saves all land in the cloud copy')
}

console.log('[10] Milestones: 10, 20, 30, then every 5')
{
  ok([10, 20, 30, 35, 40, 45].every(C.isMilestone) && ![9, 11, 25, 31, 36].some(C.isMilestone), 'milestone levels are 10, 20, 30, then every 5')
  ok(JSON.stringify(C.milestoneList(47)) === '[10,20,30,35,40,45]' && C.nextMilestoneLevel(23) === 30 && C.nextMilestoneLevel(30) === 35 && C.lastMilestoneLevel(9) === null, 'list, next and last milestone')
  ok(C.toolCap('curbside', 9) === 5 && C.toolCap('lab', 10) === 6 && C.toolCap('second-opinion', 35) === 9 && C.toolCap('shield', 50) === C.KIT.shield.max, 'puzzle tool limits rise by one per milestone, no maximum; Coverage stays')
  ok(C.milestoneRewards(10).crispr === 0 && C.milestoneRewards(20).crispr === 1 && C.milestoneRewards(11) === null, 'no CRISPR at Level 10, one from Level 20')
  ok(C.nextMilestone(9).items.includes('Milestone: one of each tool') && C.nextMilestone(19).items.includes('Milestone CRISPR'), 'next reward names the milestone')
  ok(C.nextCrisprLevel(17) === 20 && C.nextCrisprLevel(20) === 24, 'next CRISPR counts milestone CRISPRs')
  reset()
  const st = S.loadProgression()
  E.award(st, { id: 'test:xp', xp: 4600, kind: 'test', at: now - 86400000 })
  S.saveProgression(st)
  const r = daily('2026-10-20', { won: true })
  const ms = r.milestones.find((m) => m.level === 10)
  ok(r.after.level === 10 && ms && ms.tools.length === 3 && ms.tools.every((t) => t.as === 'granted'), 'crossing Level 10 pays the bundle: one of each puzzle tool')
  ok(r.caps.curbside === 6 && r.caps.shield === C.KIT.shield.max, 'limits are 6 at Level 10')
  const counts = E.kitCounts(S.loadProgression())
  ok(counts.curbside <= 6 && Object.keys(S.loadProgression().kit.grants).filter((k) => k.startsWith('ms:10:')).length === 3, 'bundle grants are keyed by level')
  ok(daily('2026-10-21', { won: true }).milestones.length === 0, 'a milestone pays once')
  // Two tabs both crossing Level 10 still pay it once.
  reset()
  const base = S.loadProgression()
  E.award(base, { id: 'test:xp', xp: 4600, kind: 'test', at: now - 86400000 })
  S.saveProgression(base)
  daily('2026-10-20', { won: true })
  const again = S.loadProgression()
  ok(Object.keys(again.kit.grants).filter((k) => k.startsWith('ms:')).length === 3, 'the merged save keeps exactly one bundle')
}

console.log(failed ? `\n${failed} FAILED (${passed} passed)` : `\nALL PROGRESSION CHECKS PASSED (${passed} passed)`)
process.exit(failed ? 1 : 0)
