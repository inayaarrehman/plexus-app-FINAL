// Activation checks: run after scripts/library/activate.mjs.
//   node scripts/library/activation-test.mjs [--pre <path to pre-activation tree>]
// Verifies that every mode reads its own library, held and excluded content
// cannot be served, starter reservations hold, Daily and Systems boards are
// stable, Systems expansion waits for Daily release, and saved progress still
// works. Exits 1 on any failure.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href)
let failed = 0
let passed = 0
const ok = (cond, msg) => {
  if (cond) passed++
  else {
    failed++
    console.log('  FAIL -', msg)
  }
}
const section = (t) => console.log(`\n${t}`)

const NL = await imp('src/utils/newLibrary.js')
const { default: NEW_LIBRARY } = await imp('src/data/library/newLibrary.js')
const TL = await imp('src/utils/timedLibrary.js')
const { default: connectionBank } = await imp('src/data/connectionBank.js')
const { getDailyPuzzleForDate, getPlayableDailyForDate } = await imp('src/utils/dailyPuzzle.js')
const { validatePuzzle } = await imp('src/puzzles.js')
const { composeNextRound, roundRelationships, ROUND_TYPES } = await imp('src/utils/challengeEngine.js')
const { buildRaceChallenge } = await imp('src/utils/raceEngine.js')
const { makeRng } = await imp('src/utils/puzzleAssembler.js')
const { mergeSnapshots, mergeSystemsBoards } = await imp('src/utils/progressSync.js')
const { addDays } = await imp('src/utils/calendar.js')
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/library/library.json'), 'utf8'))
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/library/activation/ledger.json'), 'utf8'))

const START = NL.NEW_DAILY_START
const served = new Set(Object.keys(NEW_LIBRARY.connections))
const starterIds = new Set(Object.values(NEW_LIBRARY.starterBoards).flat().flatMap((b) => b.ids))
const dailyIds = new Set(NEW_LIBRARY.dailyBoards.flatMap((b) => b.ids))
const timedIds = new Set(TL.timedBank.map((c) => c.id))
const N = NEW_LIBRARY.dailyBoards.length

section('[1] Daily reads only the new library from its start date')
{
  for (let n = 0; n < N + 20; n++) {
    const key = addDays(START, n)
    const p = getDailyPuzzleForDate(key)
    ok(p && p.library === 'new' && p.id === `daily-${key}`, `${key}: new-library Daily with a date id`)
    ok(p.categories.every((c) => served.has(c.bankCategoryId) && dailyIds.has(c.bankCategoryId)), `${key}: every group is a scheduled Daily connection`)
    ok(p.categories.every((c) => !starterIds.has(c.bankCategoryId) && !timedIds.has(c.bankCategoryId)), `${key}: no starter or timed content`)
    const errs = validatePuzzle(p)
    ok(errs.length === 0, `${key}: valid puzzle ${errs.join('; ')}`)
    ok(JSON.stringify(p) === JSON.stringify(getDailyPuzzleForDate(key)), `${key}: same date gives the identical puzzle`)
    ok(new Set(p.categories.flatMap((c) => c.items.map((i) => i.term.toLowerCase()))).size === 16, `${key}: 16 distinct tiles`)
    ok(new Set(p.categories.map((c) => c.level)).size === 4, `${key}: four distinct colours`)
  }
  // No canonical relationship repeats within the first pass of the schedule.
  const seen = new Set()
  let repeat = false
  for (const b of NEW_LIBRARY.dailyBoards)
    for (const id of b.ids) {
      const c = NEW_LIBRARY.connections[id].canonicalId
      if (seen.has(c)) repeat = true
      seen.add(c)
    }
  ok(!repeat, 'no canonical relationship repeats before the pool is exhausted')
  ok(getDailyPuzzleForDate(addDays(START, N)).boardId === NEW_LIBRARY.dailyBoards[0].id, 'after the runway the schedule replays from board 1 (exhaustion policy)')
}

section('[2] Today keeps its puzzle until the switch; retired Dailies are not playable')
{
  const pre = process.argv.includes('--pre') ? process.argv[process.argv.indexOf('--pre') + 1] : null
  const before = addDays(START, -1)
  const legacy = getDailyPuzzleForDate(before)
  ok(legacy && legacy.library !== 'new', `${before} still resolves to the existing Daily`)
  if (pre) {
    const old = await import(pathToFileURL(path.join(pre, 'src/utils/dailyPuzzle.js')).href)
    for (let d = -6; d < 0; d++) {
      const key = addDays(START, d)
      ok(JSON.stringify(old.getDailyPuzzleForDate(key)) === JSON.stringify(getDailyPuzzleForDate(key)), `${key}: identical to the pre-activation Daily`)
    }
  }
  ok(getPlayableDailyForDate(addDays(START, -3), addDays(START, 2)) === null, 'a pre-switch Daily cannot be opened from the Archive')
  ok(getPlayableDailyForDate(before, before)?.id === `daily-${before}`, "today's Daily stays playable on the last pre-switch day")
  ok(getPlayableDailyForDate(addDays(START, 1), addDays(START, 2))?.library === 'new', 'a past new-library Daily is playable from the Archive')
  ok(getPlayableDailyForDate(addDays(START, 3), addDays(START, 2)) === null, 'a future Daily is never playable')
}

section('[3] Systems: fixed starter boards, reserved connections, expansion waits for release')
{
  for (const s of NL.LIBRARY_SUBJECTS) {
    const before = NL.systemsBoardsFor(s, addDays(START, -1))
    ok(before.every((b) => b.kind === 'starter'), `${s}: only starter boards before the first Daily`)
  }
  ok([...starterIds].every((id) => !dailyIds.has(id)), 'starter connections never appear in the Daily schedule')
  ok([...starterIds].every((id) => !timedIds.has(id)), 'starter connections never appear in the timed library')
  const expIds = NEW_LIBRARY.expansionBoards.flatMap((b) => b.ids)
  ok(new Set(expIds).size === expIds.length, 'no connection is used by two Systems boards')
  ok(expIds.every((id) => !starterIds.has(id)), 'expansion boards never reuse starter connections')
  for (const b of NEW_LIBRARY.expansionBoards) {
    const days = b.ids.map((id) => NEW_LIBRARY.dailyBoards.findIndex((d) => d.ids.includes(id)))
    ok(days.every((d) => d >= 0 && d <= b.releaseDay), `${b.id}: built only from Dailies released by day ${b.releaseDay}`)
    ok(b.ids.every((id) => NEW_LIBRARY.connections[id].subject === b.subject), `${b.id}: every connection's primary subject is ${b.subject}`)
    const visibleEarly = NL.systemsBoardsFor(b.subject, addDays(START, b.releaseDay - 1)).some((x) => x.id === b.id)
    const visibleOnDay = NL.systemsBoardsFor(b.subject, addDays(START, b.releaseDay)).some((x) => x.id === b.id)
    ok(!visibleEarly && visibleOnDay, `${b.id}: hidden until its Daily's date, shown from then`)
  }
  for (const s of NL.LIBRARY_SUBJECTS)
    for (const [i, b] of NL.systemsBoardsFor(s, addDays(START, N)).entries()) {
      const p = NL.systemsBoardPuzzle(b, i)
      ok(validatePuzzle(p).length === 0 && p.id === b.id, `${b.id}: valid, id is the fixed board id`)
      ok(JSON.stringify(p) === JSON.stringify(NL.systemsBoardPuzzle(b, i)), `${b.id}: identical on every build`)
    }
  // Caught up.
  const subj = NL.LIBRARY_SUBJECTS[0]
  const all = Object.fromEntries(NL.systemsBoardsFor(subj, START).map((b) => [b.id, { finishedAt: 'x' }]))
  ok(NL.subjectProgress(subj, START, all).next === null, 'a player who finished every available board has no next board')
  ok(NL.CAUGHT_UP_COPY === 'You’re caught up! Check back for more puzzles soon.', 'caught-up copy matches the requested text')
}

section('[4] Held, duplicate and unreviewed content cannot be served')
{
  for (const r of Object.values(state.records)) {
    const activeLike = r.verification.approved && !r.problems.length && !r.heldFor.length && !r.duplicateOf && ['daily', 'systemsStarter'].includes(r.pool)
    if (!activeLike) ok(!served.has(r.id), `${r.id} (${r.pool}, ${r.verification.state}) is not served`)
  }
  ok(Object.values(NEW_LIBRARY.connections).every((c) => !c.review.humanVerified && /^AI_REVIEWED_/.test(c.review.status)), 'served rows keep their AI review label; none marked human verified')
  for (const id of Object.keys(ledger.timedExclusions)) ok(!timedIds.has(id), `excluded timed entry ${id} is not in the timed library`)
}

section('[5] 3 Minutes and Race read only the timed library, never repeat a relationship')
{
  const canon = TL.timedCanonicalId
  ok(TL.timedBank.every((c) => !served.has(c.id)), 'timed library holds no new-library connection')
  const excludedTitles = new Set(Object.keys(ledger.timedExclusions).map((id) => connectionBank.find((c) => c.id === id)?.title?.toLowerCase()))
  for (let s = 1; s <= 60; s++) {
    const rng = makeRng(s)
    const used = new Set()
    let rounds = 0
    let repeat = false
    let excluded = false
    for (let i = 0; i < 30; i++) {
      const r = composeNextRound(TL.timedBank, { rng, roundTypes: ROUND_TYPES, recent: [], used, canonicalOf: canon })
      if (!r) break
      const rel = roundRelationships(r, TL.timedBank, canon)
      if ([...rel].some((x) => used.has(x))) repeat = true
      if ((r.conceptTags || []).some((t) => excludedTitles.has(String(t).toLowerCase()) && !TL.timedBank.some((c) => c.title.toLowerCase() === String(t).toLowerCase()))) excluded = true
      rel.forEach((x) => used.add(x))
      rounds++
    }
    ok(!repeat, `3-Minute session ${s}: no relationship repeated over ${rounds} rounds`)
    ok(!excluded, `3-Minute session ${s}: no excluded timed entry served`)
    ok(rounds >= 20, `3-Minute session ${s}: at least 20 fresh rounds available (${rounds})`)
  }
  for (const code of ['ABCD', 'MNPQ', 'RSTU', 'ZZ22', 'K7P3', 'H4XY']) {
    const a = buildRaceChallenge(TL.timedBank, { code, canonicalOf: canon })
    const b = buildRaceChallenge(TL.timedBank, { code, canonicalOf: canon })
    ok(JSON.stringify(a) === JSON.stringify(b), `race ${code}: identical set for both players`)
    ok(a.length === 10, `race ${code}: full 10 rounds`)
    const used = new Set()
    let repeat = false
    for (const r of a) {
      const rel = roundRelationships(r, TL.timedBank, canon)
      if ([...rel].some((x) => used.has(x))) repeat = true
      rel.forEach((x) => used.add(x))
    }
    ok(!repeat, `race ${code}: no relationship repeated`)
  }
}

section('[6] Existing progress still works')
{
  const oldSnap = { version: 1, stats: { currentStreak: 12, maxStreak: 20, lastCompletedDailyKey: '2026-10-08' }, dailyHistory: { '2026-10-08': { completed: true, won: true, mistakes: 1, puzzleId: 'daily-2026-10-08' } }, challenge: {}, progression: null }
  const merged = mergeSnapshots(oldSnap, {})
  ok(merged.stats.currentStreak === 12 && merged.dailyHistory['2026-10-08'].completed, 'a pre-activation snapshot (no Systems boards) merges unchanged')
  ok(JSON.stringify(merged.systemsBoards) === '{}', 'Systems board progress starts empty for existing players')
  const m = mergeSystemsBoards({ a: { finishedAt: '2026-10-11', won: false } }, { a: { finishedAt: '2026-10-10', won: true }, b: { finishedAt: '2026-10-12', won: true } })
  ok(m.a.finishedAt === '2026-10-10' && m.a.won && m.b, 'board progress merges across devices (earliest finish, won if either won)')
}

section('[7] Activation is reproducible and safe to rerun')
{
  let up = true
  try {
    execFileSync('node', [path.join(ROOT, 'scripts/library/activate.mjs'), '--check'], { stdio: 'pipe' })
  } catch {
    up = false
  }
  ok(up, 'rerunning activation changes nothing (ledger reused, identical outputs)')
  ok(JSON.stringify(ledger.dailyBoards.map((b) => b.ids)) === JSON.stringify(NEW_LIBRARY.dailyBoards.map((b) => b.ids)), 'app schedule matches the persisted ledger')
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL ACTIVATION CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
