// Headless functional self-test for MedConnections.
// Validates the puzzle data set and exercises the core game-logic functions
// (no browser/DOM required). Run with: node scripts/selftest.mjs

// Minimal localStorage polyfill so storage.js functions work under plain Node.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

import allPuzzles, {
  validatePuzzle,
  dailyPuzzles,
  systemPuzzles,
  generatedPuzzles,
  getPuzzleById,
  getPublishedPuzzles,
  SYSTEMS,
} from '../src/puzzles.js'
import connectionBank, { validateBankCategory, DIFFICULTY_TIERS, BANK_STATUS, CONNECTION_TYPES } from '../src/data/connectionBank.js'
import {
  categoriesCompatible,
  assemblePuzzleFromCategories,
  autoGeneratePuzzles,
  scoreCombo,
  assembleSystemPuzzle,
  categoriesNearDuplicate,
  comboUsable,
  seededRng,
  hashStringToSeed,
} from '../src/utils/puzzleAssembler.js'
import { generateRound as genChallengeRound } from '../src/utils/challengeEngine.js'
import { buildRaceChallenge, makeJoinCode, isValidJoinCode, normalizeJoinCode, RACE_ROUND_TYPES } from '../src/utils/raceEngine.js'
import connectionBankExtra from '../src/data/connectionBankExtra.js'
import { dateKey, dayNumber, getDailyPuzzleIndex, buildTiles, isFullMatch, isOneAway, shuffle, attemptKey, isDuplicateAttempt, dateFromDayNumber } from '../src/utils/game.js'
import { assessModes, validateRound as validateChallengeRound } from '../src/utils/challengeEngine.js'
import { getDailyPuzzleForDate, isFutureDateKey } from '../src/utils/dailyPuzzle.js'
import {
  categoriesForSystem,
  systemMasteryCounts,
  systemMasterySummary,
  systemsWithContent,
} from '../src/utils/mastery.js'
import { getCompletionPhrase, PHRASES } from '../src/utils/completionPhrases.js'
import { deriveThreads, getPrototypeThread } from '../src/utils/threads.js'
import { buildShareText } from '../src/utils/shareText.js'
import { computeDailyMicroStat } from '../src/utils/dailyMicroStat.js'
import { pickConnectionPhrase, CONNECTION_PHRASES } from '../src/utils/connectionMicrocopy.js'
import { pickConnectionOfDay } from '../src/utils/connectionOfDay.js'
import {
  ROUND_TYPES,
  CORE_ROUND_TYPES,
  BASE_POINTS,
  WRONG_PENALTY,
  getMultiplier,
  speedBonus,
  computeActionPoints,
  generateRound,
  validateRound,
  composeNextRound,
} from '../src/utils/challengeEngine.js'
import { categoryArchetype, ARCHETYPES, archetypeDistribution } from '../src/utils/archetypes.js'
import { puzzleQualityScore, analyzeOverlap, puzzleVerdict } from '../src/utils/puzzleQuality.js'
import { curateDailyCandidates } from '../src/utils/dailyCuration.js'
import {
  recordResult,
  loadStats,
  saveProgress,
  loadProgress,
  clearProgress,
  recordDailyHistory,
  getDailyHistory,
  recordSystemAttempt,
  getSystemProgress,
  recordWeakSpots,
  getWeakSpots,
  getConceptMastery,
  recordConceptMastery,
  getMasteryState,
  isSolved,
  getChallengeStats,
  recordChallengeResult,
  recordKnowledgeSignal,
  recordNearMissConfusions,
  getNearMissConfusions,
} from '../src/utils/storage.js'

let failures = 0
const ok = (label) => console.log(`  ok  - ${label}`)
const fail = (label, detail) => {
  failures += 1
  console.log(`FAIL  - ${label}${detail ? `\n        ${detail}` : ''}`)
}
const assert = (cond, label, detail) => (cond ? ok(label) : fail(label, detail))

console.log(`\nMedConnections self-test\n${'='.repeat(40)}`)

// ---------------------------------------------------------------
console.log('\n[1] Puzzle bank structure (daily + system, data-driven schema)')
assert(Array.isArray(allPuzzles) && allPuzzles.length >= 1, `puzzle bank is non-empty (${allPuzzles.length} puzzles)`)
assert(dailyPuzzles.length >= 1, `daily puzzles present (${dailyPuzzles.length})`)
assert(systemPuzzles.length >= 1, `system puzzles present (${systemPuzzles.length})`)

const seenIds = new Set()
allPuzzles.forEach((p, i) => {
  const errors = validatePuzzle(p)
  assert(errors.length === 0, `puzzle[${i}] "${p.title}" (${p.id}) is structurally valid`, errors.join('; '))
  assert(!seenIds.has(p.id), `puzzle[${i}] id "${p.id}" is unique`)
  seenIds.add(p.id)
  assert(SYSTEMS.length === 17, 'SYSTEMS list has 17 named organ systems (Genetics is its own subject)')
})

allPuzzles.forEach((p, i) => {
  const total = p.categories.reduce((sum, c) => sum + c.items.length, 0)
  assert(total === 16, `puzzle[${i}] has 16 total items`, `got ${total}`)
})

assert(getPuzzleById(dailyPuzzles[0].id)?.id === dailyPuzzles[0].id, 'getPuzzleById resolves a known daily puzzle')
assert(getPuzzleById('does-not-exist') === null, 'getPuzzleById returns null for unknown id')
assert(getPublishedPuzzles().every((p) => p.status === 'published'), 'getPublishedPuzzles only returns published puzzles')

// ---------------------------------------------------------------
console.log('\n[2] Tile building & shuffling')
const testPuzzle = allPuzzles[0]
const tiles = buildTiles(testPuzzle)
assert(tiles.length === 16, 'buildTiles returns 16 tiles')
const textSet = new Set(tiles.map((t) => t.text))
assert(textSet.size === 16, 'all built tiles have unique text')
tiles.forEach((t) => {
  assert(
    typeof t.catIndex === 'number' && t.catIndex >= 0 && t.catIndex < 4,
    `tile "${t.text}" has a valid catIndex`
  )
})

const arr = Array.from({ length: 20 }, (_, i) => i)
const shuffled = shuffle(arr)
assert(shuffled.length === arr.length, 'shuffle preserves length')
assert(
  JSON.stringify(shuffled.slice().sort((a, b) => a - b)) === JSON.stringify(arr),
  'shuffle preserves the same set of elements'
)

// ---------------------------------------------------------------
console.log('\n[3] Match-detection logic')
const cat0Tiles = tiles.filter((t) => t.catIndex === 0)
assert(cat0Tiles.length === 4, 'found 4 tiles for category 0')
assert(isFullMatch(cat0Tiles), 'isFullMatch true for 4 same-category tiles')

const mixed = [...tiles.filter((t) => t.catIndex === 0).slice(0, 3), tiles.find((t) => t.catIndex === 1)]
assert(!isFullMatch(mixed), 'isFullMatch false for a 3+1 mix')
assert(isOneAway(mixed), 'isOneAway true for a 3+1 mix')

const twoAndTwo = [
  ...tiles.filter((t) => t.catIndex === 0).slice(0, 2),
  ...tiles.filter((t) => t.catIndex === 1).slice(0, 2),
]
assert(!isFullMatch(twoAndTwo), 'isFullMatch false for a 2+2 mix')
assert(!isOneAway(twoAndTwo), 'isOneAway false for a 2+2 mix')

// ---------------------------------------------------------------
console.log('\n[4] Simulated full playthrough (win path)')
{
  const p = allPuzzles[1]
  const t = buildTiles(p)
  let solved = []
  for (let cat = 0; cat < 4; cat++) {
    const group = t.filter((x) => x.catIndex === cat)
    if (isFullMatch(group)) solved.push(cat)
  }
  assert(solved.length === 4, 'every category in a fresh shuffle is internally consistent and matchable')
}

console.log('\n[5] Simulated full playthrough (loss path: 4 wrong guesses)')
{
  const p = allPuzzles[2]
  const t = buildTiles(p)
  let mistakes = 0
  for (let i = 0; i < 4; i++) {
    const a = t.filter((x) => x.catIndex === i % 4).slice(0, 2)
    const b = t.filter((x) => x.catIndex === (i + 1) % 4).slice(0, 2)
    const guess = [...a, ...b]
    if (!isFullMatch(guess)) mistakes++
  }
  assert(mistakes === 4, 'four deliberately-wrong guesses register as four mistakes')
}

// ---------------------------------------------------------------
console.log('\n[6] Daily puzzle resolution (date-determined, same for everyone)')
const d1 = new Date(2026, 8, 19) // Sep 19, 2026 - matches an explicit dailyPuzzles date
const d2 = new Date(2026, 8, 20)
assert(dateKey(d1) === '2026-09-19', 'dateKey formats correctly', dateKey(d1))
assert(typeof dayNumber(d1) === 'number' && dayNumber(d2) === dayNumber(d1) + 1, 'dayNumber increments by 1 per day')

const daily1 = getDailyPuzzleForDate(d1)
const daily1Again = getDailyPuzzleForDate(new Date(2026, 8, 19))
assert(!!daily1, 'getDailyPuzzleForDate resolves a puzzle for an explicit daily date')
assert(daily1?.id === daily1Again?.id, 'getDailyPuzzleForDate is deterministic for the same date')

// Far-future date with no explicit entry should still resolve via rotation fallback.
const farFuture = new Date(2027, 5, 15)
const fallback = getDailyPuzzleForDate(farFuture)
assert(!!fallback, 'getDailyPuzzleForDate falls back to rotation for a date with no explicit daily')
assert(!isFutureDateKey(dateKey(new Date())), "today's date is never considered a future date")
assert(isFutureDateKey('2099-01-01'), 'a date far in the future is correctly detected as a future date')

// Old index-based rotation helper still used as the daily fallback mechanism.
const idx1 = getDailyPuzzleIndex(getPublishedPuzzles().length, d1)
assert(idx1 >= 0 && idx1 < getPublishedPuzzles().length, 'getDailyPuzzleIndex stays in range')

// ---------------------------------------------------------------
console.log('\n[7] Storage: stats, streak-gaming prevention, progress round-trip')
{
  localStorage.clear()
  let stats = recordResult({ won: true, mistakes: 1, isDaily: true, dailyKey: '2026-01-01', countsTowardStreak: true })
  assert(stats.currentStreak === 1, 'winning a counted daily increments the streak')
  stats = recordResult({ won: true, mistakes: 0, isDaily: true, dailyKey: '2020-01-01', countsTowardStreak: false })
  assert(stats.currentStreak === 1, 'winning a backfilled Archive day (countsTowardStreak=false) does NOT move the streak')
  assert(stats.gamesPlayed === 2, 'gamesPlayed still increments for every finished game, streak or not')

  saveProgress('daily-2026-01-02', { gameOver: true, won: true })
  assert(loadProgress('daily-2026-01-02')?.gameOver === true, 'saveProgress/loadProgress round-trip works')
  clearProgress('daily-2026-01-02')
  assert(loadProgress('daily-2026-01-02') === null, 'clearProgress removes saved progress')

  // Perfect-streak tracking (feeds the "3-day perfect streak." daily
  // micro-stat) — separate from the ordinary win streak: a win WITH
  // mistakes keeps the regular streak alive but resets the perfect one.
  localStorage.clear()
  stats = recordResult({ won: true, mistakes: 0, isDaily: true, dailyKey: '2026-03-01', countsTowardStreak: true })
  assert(stats.currentPerfectStreak === 1, 'a zero-mistake counted win starts a perfect streak')
  stats = recordResult({ won: true, mistakes: 0, isDaily: true, dailyKey: '2026-03-02', countsTowardStreak: true })
  assert(stats.currentPerfectStreak === 2, 'a second consecutive zero-mistake win extends the perfect streak')
  stats = recordResult({ won: true, mistakes: 1, isDaily: true, dailyKey: '2026-03-03', countsTowardStreak: true })
  assert(stats.currentPerfectStreak === 0, 'a win WITH mistakes resets the perfect streak even though the regular streak continues')
  assert(stats.currentStreak === 3, 'the regular win streak is unaffected by mistakes')
}

console.log('\n[8] Storage: Daily history (Archive), System progress, Weak Spots')
{
  localStorage.clear()
  recordDailyHistory({ date: '2026-02-01', puzzleId: 'daily-0001', puzzleNumber: 1, completed: true, won: true, mistakes: 2 })
  const history = getDailyHistory()
  assert(history['2026-02-01']?.won === true, 'recordDailyHistory/getDailyHistory round-trip works')

  recordSystemAttempt({
    puzzleId: 'sys-cardio-0001',
    system: 'Cardiology',
    won: true,
    mistakes: 1,
    correctGuesses: 4,
    totalGuesses: 5,
    categoriesMissed: 0,
  })
  const sysProgress = getSystemProgress()
  assert(sysProgress.lastPlayedSystem === 'Cardiology', 'recordSystemAttempt sets lastPlayedSystem (for Continue Studying)')
  assert(sysProgress.perPuzzle['sys-cardio-0001']?.completions === 1, 'recordSystemAttempt tracks per-puzzle completions')
  assert(sysProgress.perSystem['Cardiology']?.attempted === 1, 'recordSystemAttempt tracks per-system aggregates')

  recordWeakSpots([
    { tag: 'QT-prolonging drugs', solved: false },
    { tag: 'QT-prolonging drugs', solved: false },
    { tag: 'Nephritic syndromes', solved: true },
  ])
  const weakSpots = getWeakSpots()
  assert(weakSpots['QT-prolonging drugs']?.timesEncountered === 2, 'recordWeakSpots aggregates repeated misses on the same concept')
  assert(weakSpots['QT-prolonging drugs']?.timesMissed === 2, 'recordWeakSpots tracks timesMissed correctly')
  assert(weakSpots['Nephritic syndromes']?.timesSolved === 1, 'recordWeakSpots tracks timesSolved correctly')
}

// ---------------------------------------------------------------
console.log('\n[9] Connection Bank structure & validation')
{
  assert(Array.isArray(connectionBank) && connectionBank.length >= 1, `connection bank is non-empty (${connectionBank.length} categories)`)
  const bankIds = new Set()
  connectionBank.forEach((c, i) => {
    const errors = validateBankCategory(c)
    assert(errors.length === 0, `bank[${i}] "${c.title}" (${c.id}) is structurally valid`, errors.join('; '))
    assert(!bankIds.has(c.id), `bank[${i}] id "${c.id}" is unique`)
    bankIds.add(c.id)
    assert(DIFFICULTY_TIERS.includes(c.difficulty), `bank[${i}] has a valid difficulty tier`, c.difficulty)
    assert(BANK_STATUS.includes(c.status), `bank[${i}] has a valid status`, c.status)
    assert(CONNECTION_TYPES.includes(c.connectionType), `bank[${i}] has a valid connectionType`, c.connectionType)
  })

  const verified = connectionBank.filter((c) => c.status === 'verified')
  const needsReview = connectionBank.filter((c) => c.status === 'needs_review')
  assert(verified.length > 0, `at least one verified bank category exists (${verified.length})`)
  assert(needsReview.length >= 1, 'at least one category is intentionally flagged needs_review (kept, not deleted)')

  // Invalid category should be rejected with specific errors, not silently accepted.
  const badCategory = { id: 'bad', title: 'x', tiles: ['a', 'a', 'b', 'c'], difficulty: 'nope' }
  const badErrors = validateBankCategory(badCategory)
  assert(badErrors.length > 0, 'validateBankCategory rejects a structurally invalid category', badErrors.join('; '))
}

console.log('\n[10] Puzzle Assembler: compatibility, scoring, generation')
{
  const easy = connectionBank.find((c) => c.id === 'bank-easy-01')
  const medium = connectionBank.find((c) => c.id === 'bank-medium-01')
  const hard = connectionBank.find((c) => c.id === 'bank-hard-01')
  const expert = connectionBank.find((c) => c.id === 'bank-expert-01')
  assert(categoriesCompatible([easy, medium, hard, expert]), 'four categories with no shared tile text are compatible')

  const dupCategory = { ...easy, id: 'dup', tiles: [...easy.tiles] } // shares all 4 tiles with `easy`
  assert(!categoriesCompatible([easy, dupCategory]), 'two categories sharing tile text are correctly flagged incompatible')

  const assembled = assemblePuzzleFromCategories([easy, medium, hard, expert], {
    id: 'test-assembled-0001',
    number: 9001,
    title: 'Test Assembled Puzzle',
  })
  const assembledErrors = validatePuzzle(assembled)
  assert(assembledErrors.length === 0, 'assemblePuzzleFromCategories produces a puzzle that passes validatePuzzle', assembledErrors.join('; '))
  assert(assembled.categories.map((c) => c.level).sort().join(',') === '1,2,3,4', 'assembled puzzle maps easy/medium/hard/expert to levels 1-4')

  let threw = false
  try {
    assemblePuzzleFromCategories([easy, medium, hard], { id: 'x', number: 1, title: 'x' })
  } catch {
    threw = true
  }
  assert(threw, 'assemblePuzzleFromCategories throws when given fewer than 4 categories')

  assert(
    scoreCombo([easy, medium, hard, expert]) > 0,
    'scoreCombo returns a positive internal quality score for a valid combo'
  )

  assert(generatedPuzzles.length >= 1, `at least one puzzle was auto-generated from the bank (${generatedPuzzles.length})`)
  generatedPuzzles.forEach((p, i) => {
    const errors = validatePuzzle(p)
    assert(errors.length === 0, `generatedPuzzles[${i}] "${p.title}" passes validatePuzzle`, errors.join('; '))
    assert(p.source.includes('connection bank'), `generatedPuzzles[${i}] records its bank provenance in source`)
  })

  // Regenerating with the same seed must reproduce the same puzzle set
  // (content-review reproducibility).
  const regenerated = autoGeneratePuzzles(connectionBank, { count: generatedPuzzles.length, seed: 20260919, startNumber: 1 })
  assert(
    regenerated.map((p) => p.id).join(',') === generatedPuzzles.map((p) => p.id).join(','),
    'autoGeneratePuzzles is deterministic for a fixed seed (reproducible regeneration)'
  )

  // The needs_review category must never be selected into a generated puzzle.
  const usedBankIds = new Set(generatedPuzzles.flatMap((p) => p.categories.map((c) => c.bankCategoryId)))
  assert(!usedBankIds.has('bank-easy-04'), 'the needs_review bank category is never used in auto-generated puzzles')
}

console.log('\n[11] Organ System Library: live assembly is organ-pure, no unrelated-category fallback')
{
  assert(SYSTEMS.length === 17, 'organ system library lists 17 named systems')

  // Organ purity, by construction: for whichever systems currently have
  // full 4-tier coverage (primary or a defensible secondary tag in every
  // tier), assembleSystemPuzzle must produce a puzzle where every single
  // category is either primarySystem === system, or has `system` listed
  // in its secondarySystems (an intentionally-labeled cross-system
  // category) — NEVER a category unrelated to the chosen system by either
  // field. This is the direct regression test for the reported bug (an
  // unrelated Neurology cranial-nerve-palsy category appearing inside an
  // Endocrine puzzle): that could only happen via the old "fall back to
  // the entire unrelated verified pool" behavior, which no longer exists.
  let anyProduced = false
  let anyImpure = 0
  SYSTEMS.forEach((system) => {
    const puzzle = assembleSystemPuzzle(connectionBank, system, { mastery: {} })
    // A thin system (missing verified content in some tier, even via a
    // defensible secondary tag) is EXPECTED to return null now rather than
    // ever padding the puzzle with an unrelated category — so no puzzle is
    // not a failure by itself; purity is what's asserted when one exists.
    if (!puzzle) return
    anyProduced = true
    const errors = validatePuzzle(puzzle)
    assert(errors.length === 0, `assembled "${system}" puzzle passes validatePuzzle`, errors.join('; '))
    const levels = puzzle.categories.map((c) => c.level).sort().join(',')
    assert(levels === '1,2,3,4', `assembled "${system}" puzzle has exactly one easy/medium/hard/expert category each`)

    puzzle.categories.forEach((cat) => {
      const bankCat = connectionBank.find((c) => c.id === cat.bankCategoryId)
      const pure = !!bankCat && (bankCat.primarySystem === system || (bankCat.secondarySystems || []).includes(system))
      if (!pure) anyImpure += 1
      assert(pure, `assembled "${system}" puzzle category "${cat.title}" is primary or defensible-secondary for "${system}", never an unrelated category`)
    })
  })
  assert(anyProduced, 'at least one system (e.g. Cardiology) has enough content to produce a live-assembled puzzle')
  assert(anyImpure === 0, 'no assembled system puzzle ever contains a category unrelated to the chosen system (organ-purity regression test)')

  // The specific reported bug: an Endocrine puzzle, if one can be
  // assembled at all, must never include the unrelated cranial-nerve-palsy
  // Neurology category.
  const endocrinePuzzle = assembleSystemPuzzle(connectionBank, 'Endocrine', { mastery: {} })
  if (endocrinePuzzle) {
    assert(
      !endocrinePuzzle.categories.some((c) => c.bankCategoryId === 'bank-neuro-02'),
      'an assembled Endocrine puzzle never includes the unrelated cranial-nerve-palsy Neurology category (the originally reported bug)'
    )
  }

  // Live assembly must be non-deterministic run-to-run (uses Math.random by
  // default) but every run must still validate.
  const runA = assembleSystemPuzzle(connectionBank, 'Cardiology', { mastery: {} })
  const runB = assembleSystemPuzzle(connectionBank, 'Cardiology', { mastery: {} })
  assert(!!runA && !!runB, 'assembleSystemPuzzle can be called repeatedly for the same system')

  const withContent = systemsWithContent(connectionBank, SYSTEMS)
  assert(withContent.includes('Cardiology'), 'systemsWithContent reports Cardiology has dedicated bank categories')
}

console.log('\n[12] Concept mastery: "solved" counts immediately, "mastery" is streak-based, storage round-trip')
{
  localStorage.clear()
  assert(getMasteryState({}, 'bank-easy-01') === 'unseen', 'a never-seen bank category defaults to "unseen"')
  assert(isSolved({}, 'bank-easy-01') === false, 'a never-seen bank category is not "solved"')

  let mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  assert(isSolved(mastery, 'bank-easy-01') === true, 'a single correct solve immediately counts as "solved" (this is the organ-progress bug fix)')
  assert(getMasteryState(mastery, 'bank-easy-01') === 'learning', 'a single clean solve moves internal mastery to "learning", not "mastered"')

  mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  assert(getMasteryState(mastery, 'bank-easy-01') === 'learning', 'a second consecutive clean solve is still "learning" (mastery requires a streak of 3)')

  mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  assert(getMasteryState(mastery, 'bank-easy-01') === 'mastered', 'a third consecutive clean solve reaches "mastered" (not from a single exposure)')
  assert(isSolved(mastery, 'bank-easy-01') === true, '"solved" stays true once achieved, independent of mastery streak')

  // Replaying an already-solved category again (still correct) must NOT be
  // able to move the still-true "solved" flag, and a subsequent miss must
  // reset the mastery streak without ever un-solving the category — this is
  // the explicit "replay a previously solved connection does not double
  // count / does not regress" scenario from the spec.
  mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: false, cleanSolve: false }])
  assert(getMasteryState(mastery, 'bank-easy-01') === 'learning', 'any missed/dirty solve resets the mastery streak (mastered -> learning), never stays "mastered" on a miss')
  assert(isSolved(mastery, 'bank-easy-01') === true, 'a later miss never un-solves a category that was already solved')

  const reloaded = getConceptMastery()
  assert(getMasteryState(reloaded, 'bank-easy-01') === 'learning', 'concept mastery persists to localStorage and reloads correctly')
  assert(isSolved(reloaded, 'bank-easy-01') === true, '"solved" state persists to localStorage and reloads correctly')
}

console.log('\n[13] Mastery derivation helpers (per-system counts & summaries)')
{
  localStorage.clear()
  const mastery = recordConceptMastery([
    { bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true },
    { bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true },
    { bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true },
  ])
  const cardioCats = categoriesForSystem(connectionBank, 'Cardiology')
  assert(cardioCats.every((c) => c.status === 'verified'), 'categoriesForSystem only returns verified categories')
  assert(cardioCats.every((c) => c.primarySystem === 'Cardiology'), 'categoriesForSystem is organ-pure: only primarySystem matches, not any systems[] mention')

  const counts = systemMasteryCounts(connectionBank, 'Cardiology', mastery)
  assert(
    typeof counts.total === 'number' && typeof counts.solved === 'number' && typeof counts.mastered === 'number',
    'systemMasteryCounts returns {total, solved, mastered}'
  )
  assert(counts.total >= counts.solved && counts.total >= counts.mastered, 'solved/mastered counts never exceed total verified categories for a system')
  assert(counts.solved >= counts.mastered, 'solved count is always >= mastered count (mastery implies solved, not vice versa)')
  assert(counts.solved >= 1, 'the category solved above is reflected in the headline "solved" count immediately')

  const summary = systemMasterySummary(connectionBank, 'Cardiology', mastery)
  assert(
    Array.isArray(summary.strong) && Array.isArray(summary.needsWork) && Array.isArray(summary.recent),
    'systemMasterySummary returns {strong, needsWork, recent} arrays'
  )
}

console.log('\n[13b] Organ-system progress bug scenario: solve, persist, replay, no double-count')
{
  localStorage.clear()
  const before = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(before.solved === 0, 'Cardiology starts at 0 solved with no history (reproduces the reported "0 / 14" starting state)')

  // Simulate finishing a Cardiology puzzle with 4 unique, correctly solved
  // categories (as buildMasteryResults() in App.jsx would produce).
  const fourUnique = categoriesForSystem(connectionBank, 'Cardiology').slice(0, 4)
  assert(fourUnique.length === 4, 'at least 4 verified Cardiology categories exist to run this scenario')
  recordConceptMastery(fourUnique.map((c) => ({ bankCategoryId: c.id, solved: true, cleanSolve: true })))

  const afterSolve = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(afterSolve.solved === 4, 'progress updates immediately after solving 4 unique Cardiology connections')

  // "Refresh" / "close and reopen" is just re-reading from localStorage.
  const afterReload = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(afterReload.solved === 4, 'progress remains after a simulated refresh/relaunch (re-reading localStorage)')

  // Replaying one already-solved connection (still correct) must not
  // increase the count further.
  recordConceptMastery([{ bankCategoryId: fourUnique[0].id, solved: true, cleanSolve: true }])
  const afterReplay = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(afterReplay.solved === 4, 'replaying a previously solved connection does not incorrectly increase progress')

  // Solving one brand-new (5th) Cardiology connection increases the count.
  const fifth = categoriesForSystem(connectionBank, 'Cardiology')[4]
  if (fifth) {
    recordConceptMastery([{ bankCategoryId: fifth.id, solved: true, cleanSolve: true }])
    const afterFifth = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
    assert(afterFifth.solved === 5, 'solving a genuinely new connection increases progress')
  }
}

console.log('\n[13c] Polish-pass features: completion phrases, share text, daily micro-stat, Connection of the Day')
{
  const perfectPhrase = getCompletionPhrase({ puzzleId: 'daily-0001', mistakes: 0 })
  assert(perfectPhrase === 'Perfectly connected.', 'a zero-mistake solve always gets the distinct "Perfectly connected." phrase')

  const normalPhrase = getCompletionPhrase({ puzzleId: 'daily-0001', mistakes: 2 })
  assert(PHRASES.includes(normalPhrase), 'a non-perfect solve gets one of the rotating restrained phrases')
  assert(
    !['Amazing!!!', "You're a genius!", 'Great job!'].includes(normalPhrase),
    'completion phrases never use hype language'
  )
  const samePhraseAgain = getCompletionPhrase({ puzzleId: 'daily-0001', mistakes: 2 })
  assert(normalPhrase === samePhraseAgain, 'the same puzzle id + mistake count deterministically returns the same phrase')

  const sample = dailyPuzzles[0]
  const guessLog = sample.categories.map((c, i) => ({ levels: [c.level, c.level, c.level, c.level], catIndexes: [i, i, i, i], correct: true }))
  const share = buildShareText({ isDaily: true, dailyNumber: 5, puzzleTitle: sample.title, guessLog, won: true, mistakes: 0, dailyStreak: 4 })
  assert(share.includes('PLEXUS'), 'share text identifies the app by its own name')
  assert(!share.includes('🟨') && !share.includes('🟩') && !share.includes('🟦') && !share.includes('🟪'), 'share text never uses the NYT-style colored-square emoji grid')
  assert(/🟠/.test(share) && /🟢/.test(share) && /🔵/.test(share) && /🟣/.test(share), 'share text draws each concept as a node in its group colour')
  assert(!/[●▲◆■]/.test(share), 'share text no longer uses the old shape glyphs')

  const microStatPerfect = computeDailyMicroStat({ mistakes: 0, guessLog: [], dailyPerfectStreak: 0 })
  assert(microStatPerfect === 'No mistakes today.', 'a zero-mistake day with no streak yet reports "No mistakes today."')

  const microStatStreak = computeDailyMicroStat({ mistakes: 0, guessLog: [], dailyPerfectStreak: 3 })
  assert(microStatStreak === '3-day perfect streak.', 'a 3+ day perfect streak takes priority over the plain "no mistakes" stat')

  const expertFirstLog = [{ levels: [4, 4, 4, 4], catIndexes: [3, 3, 3, 3], correct: true }]
  const microStatExpert = computeDailyMicroStat({ mistakes: 1, guessLog: expertFirstLog, dailyPerfectStreak: 0 })
  assert(microStatExpert === 'Solved Expert first.', 'solving the Expert category first is called out when the day was not otherwise perfect')

  const cod = pickConnectionOfDay(sample)
  assert(!!cod && !!cod.title && !!cod.explanation, 'pickConnectionOfDay returns a title + one-sentence explanation from the Hard/Expert tier')
  const codCategory = sample.categories.find((c) => c.title === cod.title)
  assert(codCategory.level === 4 || codCategory.level === 3, 'Connection of the Day is always a Hard or Expert category, preferring Expert')
}

console.log('\n[13d] Knowledge signal ("Knew it"/"Review later") and Near Miss Memory storage')
{
  localStorage.clear()
  const afterSignal = recordKnowledgeSignal('Causes of elevated JVP', 'knew-it')
  assert(afterSignal['Causes of elevated JVP'].knewItCount === 1, 'a "knew it" signal is recorded per category tag')
  recordKnowledgeSignal('Causes of elevated JVP', 'review-later')
  const reloadedSpots = getWeakSpots()
  assert(reloadedSpots['Causes of elevated JVP'].reviewLaterCount === 1, 'a "review later" signal is recorded independently of "knew it"')
  assert(reloadedSpots['Causes of elevated JVP'].knewItCount === 1, 'recording a second, different signal does not erase the first')

  localStorage.clear()
  recordNearMissConfusions([{ a: 'Sarcoidosis features', b: 'Caseating granuloma diseases' }])
  recordNearMissConfusions([{ a: 'Caseating granuloma diseases', b: 'Sarcoidosis features' }]) // order-independent, should aggregate
  const confusions = getNearMissConfusions()
  const key = Object.keys(confusions)[0]
  assert(Object.keys(confusions).length === 1, 'a confused pair aggregates into one record regardless of which category is listed first')
  assert(confusions[key].count === 2, 'repeated confusion of the same pair increments the same record')
}

console.log('\n[14] 3-Minute Challenge: round generation, distractor plausibility, verified-only content')
{
  assert(CORE_ROUND_TYPES.length === 4, 'the 4 required round types are defined (Mini Connections, Impostor, Rapid Association, Complete the Connection)')
  assert(ROUND_TYPES.includes('commonLink'), 'the optional 5th mode (Common Link) is defined without disturbing the core 4')

  // Every round type must be independently buildable from the real bank.
  ROUND_TYPES.forEach((type) => {
    const round = generateRound(connectionBank, { roundTypes: [type] })
    assert(!!round, `generateRound can build a "${type}" round from the live connection bank`)
    if (round) {
      assert(round.type === type, `"${type}" round reports its own type`)
    }
  })

  // needs_review content must never reach a challenge round: check every
  // round's own categoryId(s) (never a text/tile match, since two
  // unrelated verified categories can innocently share a tile string,
  // e.g. "Tuberculosis" appearing in more than one category — that's not
  // leakage, so the check has to be identity-based, not text-based).
  const flaggedCategory = connectionBank.find((c) => c.status === 'needs_review')
  let sawFlaggedContent = false
  for (let i = 0; i < 200; i++) {
    const round = generateRound(connectionBank, { rng: Math.random })
    if (!round) continue
    const categoryIds = []
    if (round.categoryId) categoryIds.push(round.categoryId)
    if (round.groups) categoryIds.push(round.groups.a.categoryId, round.groups.b.categoryId)
    if (categoryIds.includes(flaggedCategory.id)) sawFlaggedContent = true
  }
  assert(!sawFlaggedContent, 'the needs_review category is never selected as an anchor/group in 200 sampled challenge rounds')

  // Impostor: exactly 5 options, exactly 1 marked correct (the impostor).
  const impostorRound = generateRound(connectionBank, { roundTypes: ['impostor'] })
  assert(impostorRound.options.length === 5, 'an Impostor round shows exactly 5 options')
  assert(impostorRound.options.filter((o) => o.correct).length === 1, 'an Impostor round has exactly 1 correct (impostor) option')

  // Rapid Association: 8 options, exactly 4 correct, matching the anchor category's tiles.
  const rapidRound = generateRound(connectionBank, { roundTypes: ['rapidAssociation'] })
  assert(rapidRound.options.length === 8, 'a Rapid Association round shows exactly 8 options')
  assert(rapidRound.correctAnswers.length === 4, 'a Rapid Association round has exactly 4 correct answers')
  assert(
    rapidRound.options.filter((o) => o.correct).length === 4,
    'exactly 4 of the 8 Rapid Association options are marked correct'
  )

  // Complete the Connection: 3 shown + 4 options, exactly 1 correct.
  const completeRound = generateRound(connectionBank, { roundTypes: ['completeConnection'] })
  assert(completeRound.shown.length === 3, 'a Complete the Connection round shows 3 of the 4 tiles')
  assert(completeRound.options.length === 4, 'a Complete the Connection round offers 4 possible 4th members')
  assert(completeRound.options.filter((o) => o.correct).length === 1, 'exactly 1 Complete the Connection option is correct')

  // Mini Connections: 8 tiles from 2 categories with no shared tile text
  // (categoriesCompatible already guarantees a single valid partition).
  const miniRound = generateRound(connectionBank, { roundTypes: ['miniConnections'] })
  assert(miniRound.tiles.length === 8, 'a Mini Connections round shows 8 tiles')
  const miniTextSet = new Set(miniRound.tiles.map((t) => t.text.toLowerCase()))
  assert(miniTextSet.size === 8, 'Mini Connections tiles are all unique (no duplicate/ambiguous tile)')

  // Distractor plausibility: for a rapid-association anchor, no distractor
  // should literally be one of the anchor's own correct tiles.
  const anchorTiles = new Set(rapidRound.correctAnswers.map((t) => t.toLowerCase()))
  const distractorTexts = rapidRound.options.filter((o) => !o.correct).map((o) => o.text.toLowerCase())
  assert(distractorTexts.every((t) => !anchorTiles.has(t)), 'Rapid Association distractors never duplicate a correct answer')
}

console.log('\n[15] 3-Minute Challenge: scoring math')
{
  assert(getMultiplier(0) === 1 && getMultiplier(1) === 1, 'no multiplier until a streak of 2 consecutive correct answers')
  assert(getMultiplier(2) === 1.1, '2 consecutive correct -> x1.1')
  assert(getMultiplier(3) === 1.2, '3 consecutive correct -> x1.2')
  assert(getMultiplier(4) === 1.3 && getMultiplier(9) === 1.3, '4+ consecutive correct caps at x1.3')

  assert(speedBonus(0) > 0, 'an instant correct answer earns a nonzero speed bonus')
  assert(speedBonus(60000) === 0, 'a very slow answer earns no speed bonus')

  assert(
    computeActionPoints({ correct: false, basePoints: 150, multiplier: 1.3, responseMs: 100 }) === WRONG_PENALTY,
    'an incorrect answer always costs the flat penalty, regardless of multiplier or speed'
  )
  const fastCorrect = computeActionPoints({ correct: true, basePoints: BASE_POINTS.impostor, multiplier: 1, responseMs: 0 })
  assert(fastCorrect > BASE_POINTS.impostor, 'an instant correct answer scores above the base points (speed bonus applied)')
}

console.log('\n[16] 3-Minute Challenge: storage (personal best + history, independent of the daily streak)')
{
  localStorage.clear()
  const empty = getChallengeStats()
  assert(empty.personalBest === 0 && Array.isArray(empty.history), 'a fresh player has personalBest=0 and an empty history')

  let { stats, isNewBest } = recordChallengeResult({
    score: 1200,
    roundsAttempted: 10,
    roundsCorrect: 8,
    accuracy: 80,
    avgResponseMs: 2500,
    conceptTagsMissed: ['QT prolongation'],
    organSystemsMissed: ['Cardiology'],
    highestMultiplier: 1.2,
    completedAt: new Date().toISOString(),
  })
  assert(isNewBest === true, 'the first-ever run is reported as a new personal best')
  assert(stats.personalBest === 1200, 'personalBest is recorded correctly')

  ;({ stats, isNewBest } = recordChallengeResult({ score: 800, roundsAttempted: 6, roundsCorrect: 4, accuracy: 66 }))
  assert(isNewBest === false, 'a lower-scoring run is NOT reported as a new personal best')
  assert(stats.personalBest === 1200, 'personalBest is unaffected by a lower-scoring run')
  assert(stats.history.length === 2, 'challenge history accumulates across runs')

  // Independence from the Daily Puzzle streak: recording challenge runs
  // must never touch medconnections.stats.v1's streak fields.
  const dailyStatsBefore = loadStats()
  recordChallengeResult({ score: 50, roundsAttempted: 1, roundsCorrect: 1, accuracy: 100 })
  const dailyStatsAfter = loadStats()
  assert(
    dailyStatsAfter.currentStreak === dailyStatsBefore.currentStreak && dailyStatsAfter.gamesPlayed === dailyStatsBefore.gamesPlayed,
    'recording a 3-Minute Challenge result never changes the Daily Puzzle streak/stats (no second streak introduced)'
  )
}

console.log('\n[17] Threads foundation: derived only from VERIFIED bank content')
{
  const verifiedIds = new Set(connectionBank.filter((c) => c.status === 'verified').map((c) => c.id))
  const threads = deriveThreads()
  assert(threads.length > 0, 'deriveThreads() finds at least one cross-system concept thread')
  const spansSystems = threads.every((t) => t.systems.length >= 2 && t.categories.length >= 3)
  assert(spansSystems, 'every derived thread spans >= 2 systems and >= 3 categories')
  const allVerified = threads.every((t) => t.categories.every((c) => verifiedIds.has(c.id)))
  assert(allVerified, 'every thread member is a VERIFIED bank category (no unverified content)')

  const proto = getPrototypeThread()
  assert(proto !== null, 'the shipped prototype thread resolves against the current bank')
  assert(proto.categories.every((c) => verifiedIds.has(c.id)), 'the prototype thread references only verified categories')
}

console.log('\n[18] Quality engine: archetypes, quality score, overlap validator')
{
  // Archetypes resolve to the known enum, and obvious titles map sensibly.
  const sampleCat = connectionBank.find((c) => /^causes of/i.test(c.title))
  if (sampleCat) assert(categoryArchetype(sampleCat) === 'CAUSES', 'a "Causes of…" category maps to the CAUSES archetype')
  const wordplay = connectionBank.find((c) => /starts with|_{2,}/i.test(c.title))
  if (wordplay) assert(['WORD_COMPLETION', 'PREFIX_SUFFIX'].includes(categoryArchetype(wordplay)), 'a wordplay title maps to a lexical archetype')
  assert(connectionBank.every((c) => ARCHETYPES.includes(categoryArchetype(c))), 'every bank category maps to a valid archetype')

  // A real assembled puzzle scores in range with a defensible partition.
  const sys = assembleSystemPuzzle(connectionBank, 'Renal', {})
  const q = puzzleQualityScore(sys)
  assert(q.score >= 0 && q.score <= 100, `quality score is within 0–100 (got ${q.score})`)
  assert(q.dimensions.fairness === 1, 'an assembled puzzle has exactly one defensible partition (fairness = 1)')
  const ov = analyzeOverlap(sys)
  assert(['intentional', 'acceptable', 'problematic'].includes(ov.classification), 'overlap is classified into one of the three buckets')
  assert(ov.distinctTiles === true, 'assembled puzzle tiles are all distinct (no second complete partition)')

  // A puzzle with a duplicated tile across categories is gated to a low
  // score and flagged problematic (medical/fairness gate).
  const broken = JSON.parse(JSON.stringify(sys))
  broken.categories[1].items[0].term = broken.categories[0].items[0].term // force a duplicate tile
  const bq = puzzleQualityScore(broken)
  assert(analyzeOverlap(broken).classification === 'problematic', 'a duplicate-tile puzzle is classified problematic')
  assert(bq.score < q.score, 'the broken puzzle scores strictly lower than the clean one (fairness gate applied)')

  const dist = archetypeDistribution(connectionBank)
  assert(Object.keys(dist).length >= 3, 'the bank spans at least three archetypes')
}

console.log('\n[19] Round-level validation (only valid rounds enter play)')
{
  let rng = (() => { let s = 7; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) })()
  for (const type of ROUND_TYPES) {
    let validated = 0
    for (let i = 0; i < 20; i++) {
      const round = generateRound(connectionBank, { rng, roundTypes: [type] })
      if (!round) continue
      const v = validateRound(round, connectionBank)
      if (v.valid) validated += 1
      assert(v.valid, `generated ${type} round passes validateRound`, v.reason)
      assert(round.roundValidationStatus === 'valid', `${type} round is marked roundValidationStatus:valid`)
      if (validated >= 3) break
    }
  }
  // A deliberately-broken impostor round (impostor is actually a member) is rejected.
  const anchor = connectionBank.find((c) => c.status === 'verified')
  const badImpostor = {
    type: 'impostor',
    categoryId: anchor.id,
    options: [...anchor.tiles.map((t) => ({ text: t, correct: false })), { text: anchor.tiles[0], correct: true }],
    correctAnswer: anchor.tiles[0],
  }
  assert(!validateRound(badImpostor, connectionBank).valid, 'an impostor that is genuinely a member is rejected')

  // The composer returns a valid round and never immediately repeats a type.
  const r1 = composeNextRound(connectionBank, { rng, recent: [{ type: 'impostor', systems: [], conceptTags: [] }] })
  assert(r1 && validateRound(r1, connectionBank).valid, 'composeNextRound returns a validated round')
}

console.log('\n[20] Daily curation: ranked, verified-only candidates')
{
  const cands = curateDailyCandidates(connectionBank, { count: 5, seed: 3 })
  assert(cands.length > 0, 'curateDailyCandidates produces candidates')
  assert(cands.every((c) => c.verdict.dimensions.medicalAccuracy === 1), 'every candidate is medically defensible (verified categories)')
  const scores = cands.map((c) => c.verdict.score)
  assert(scores.every((s, i) => i === 0 || scores[i - 1] >= s), 'candidates are returned best-first by score')
}

console.log('\n[21] Duplicate-attempt detection (keyed on stable tile ids, not category indexes)')
{
  // Stand-in tiles: text is the stable per-puzzle id; catIndex included to
  // prove it is NOT what drives duplicate detection.
  const A = { text: 'Aspirin', catIndex: 0 }
  const B = { text: 'Warfarin', catIndex: 1 }
  const C = { text: 'Heparin', catIndex: 2 }
  const D = { text: 'Clopidogrel', catIndex: 3 }
  const E = { text: 'Enoxaparin', catIndex: 3 }

  // Order-independence of the canonical key.
  assert(attemptKey([A, B, C, D]) === attemptKey([D, B, A, C]), 'attemptKey is order-independent (A B C D === D C B A)')
  assert(attemptKey([A, B, C, D]) !== attemptKey([A, B, C, E]), 'attemptKey differs when one tile differs (ABCD ≠ ABCE)')

  const log = [{ correct: false, catIndexes: [0, 1, 2, 3], attemptKey: attemptKey([A, B, C, D]) }]
  assert(isDuplicateAttempt(log, [D, C, B, A]), 'D C B A is a duplicate of a prior A B C D')
  assert(!isDuplicateAttempt(log, [A, B, C, E]), 'A B C E is NOT a duplicate (one concept changed)')
  assert(!isDuplicateAttempt(log, [A, B, D, E]), 'A B D E is NOT a duplicate')

  // The actual bug: two DIFFERENT tile sets that each span the same four
  // categories must not collide. (Old code compared sorted catIndexes.)
  const A2 = { text: 'Ibuprofen', catIndex: 0 }
  const B2 = { text: 'Apixaban', catIndex: 1 }
  const C2 = { text: 'Dabigatran', catIndex: 2 }
  const D2 = { text: 'Ticagrelor', catIndex: 3 }
  assert(
    !isDuplicateAttempt(log, [A2, B2, C2, D2]),
    'a different tile-set spanning the same four categories is NOT a duplicate (root-cause regression)'
  )

  // Correct guesses never count as prior attempts (their tiles leave the board).
  const solvedLog = [{ correct: true, catIndexes: [0, 0, 0, 0], attemptKey: attemptKey([A, B, C, D]) }]
  assert(!isDuplicateAttempt(solvedLog, [A, B, C, D]), 'a correct group never triggers a duplicate warning')

  // A fresh puzzle (empty log) never reports duplicates.
  assert(!isDuplicateAttempt([], [A, B, C, D]), 'an empty guess log never reports a duplicate (no cross-puzzle leak)')

  // Legacy entries without a stored key are skipped, never false-positive.
  const legacyLog = [{ correct: false, catIndexes: [0, 1, 2, 3] }]
  assert(!isDuplicateAttempt(legacyLog, [A, B, C, D]), 'a legacy guess entry with no attemptKey never false-positives')
}

console.log('\n[22] Connection microcopy (individual-Strand feedback)')
{
  // Never uses the reserved whole-puzzle words, and no corny praise.
  assert(!CONNECTION_PHRASES.includes('Connected.'), '"Connected." is reserved for full completion, not individual groups')
  assert(!CONNECTION_PHRASES.includes('Perfectly connected.'), '"Perfectly connected." is not an individual-group phrase')
  const banned = ['Amazing!', 'Awesome!', 'Great job!', 'Nailed it!', 'Genius!']
  assert(CONNECTION_PHRASES.every((p) => !banned.includes(p) && !p.includes('!')), 'microcopy avoids corny praise and exclamation marks')

  // Always returns a real phrase and never repeats the immediately previous one.
  let last = null
  let noRepeat = true
  let allInPool = true
  const seq = [0.05, 0.4, 0.7, 0.99, 0.2, 0.55, 0.85, 0.33, 0.11, 0.66]
  let k = 0
  for (let i = 0; i < 40; i++) {
    const phrase = pickConnectionPhrase(last, () => seq[k++ % seq.length])
    if (!CONNECTION_PHRASES.includes(phrase)) allInPool = false
    if (phrase === last) noRepeat = false
    last = phrase
  }
  assert(allInPool, 'pickConnectionPhrase always returns a phrase from the curated pool')
  assert(noRepeat, 'pickConnectionPhrase never repeats the immediately previous phrase')
}

console.log('\n[23] Challenge-a-friend day-number round-trip (spoiler-free link)')
{
  for (const n of [0, 1, 42, 993, 1500]) {
    assert(dayNumber(dateFromDayNumber(n)) === n, `dateFromDayNumber(${n}) resolves back to day number ${n}`)
  }
  // The same day number resolves to the same deterministic Daily.
  const a = getDailyPuzzleForDate(dateFromDayNumber(700))
  const b = getDailyPuzzleForDate(dateFromDayNumber(700))
  assert(a && b && a.id === b.id, 'a challenge day number resolves to one deterministic Daily')
}

console.log('\n[24] Expanded 3-Minute mode gate + validity (verified content only)')
{
  const report = assessModes(connectionBank)
  const ready = Object.entries(report).filter(([, v]) => v.status === 'READY').map(([m]) => m)
  assert(ready.length >= 3, `mode gate classifies several modes READY (${ready.join(', ')})`)
  assert(report.matchTheLink.status === 'READY', 'Match the Link is READY')
  assert(report.doubleAgent.status === 'READY', 'Double Agent is READY')
  // Every mode that produces rounds produces VALID rounds only.
  let seed = 99
  const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (const mode of ['matchTheLink', 'doubleAgent', 'linkTwo', 'sameOrDifferent', 'split', 'chain', 'completeTheChain']) {
    let checked = 0
    for (let i = 0; i < 30 && checked < 3; i++) {
      const round = generateRound(connectionBank, { rng, roundTypes: [mode] })
      if (!round) continue
      assert(validateChallengeRound(round, connectionBank).valid, `${mode} generates only valid rounds`, JSON.stringify(round).slice(0, 120))
      checked += 1
    }
  }
}

// ---------------------------------------------------------------
console.log('\n[25] Content expansion — every new group is structurally valid')
{
  let bad = 0
  for (const c of connectionBankExtra) {
    const errs = validateBankCategory(c)
    if (errs.length) {
      bad += 1
      assert(false, `extra category ${c.id} invalid`, errs.join('; '))
    }
  }
  assert(bad === 0, `all ${connectionBankExtra.length} expansion groups valid`)
  // No expansion title collides (case-insensitively) with a pre-existing one.
  const norm = (s) => String(s).trim().toLowerCase()
  const extraIds = new Set(connectionBankExtra.map((c) => c.id))
  const existing = new Set(connectionBank.filter((c) => !extraIds.has(c.id)).map((c) => norm(c.title)))
  const collide = connectionBankExtra.filter((c) => existing.has(norm(c.title)))
  assert(collide.length === 0, 'no expansion title duplicates an existing group', collide.map((c) => c.title).join(', '))
}

console.log('\n[26] Generation guard — near-duplicate categories never share a puzzle')
{
  const dup1 = { title: 'Causes of X', tiles: ['a', 'b', 'c', 'd'], tags: ['t1', 't2'] }
  const dup2 = { title: 'causes of x', tiles: ['e', 'f', 'g', 'h'], tags: ['x'] }
  assert(categoriesNearDuplicate([dup1, dup2]), 'identical titles flagged as near-duplicate')
  const shareTags1 = { title: 'One', tiles: ['a', 'b', 'c', 'd'], tags: ['shared1', 'shared2', 'z'] }
  const shareTags2 = { title: 'Two', tiles: ['e', 'f', 'g', 'h'], tags: ['shared1', 'shared2'] }
  assert(categoriesNearDuplicate([shareTags1, shareTags2]), '>=2 shared tags flagged as near-duplicate')
  const fine1 = { title: 'One', tiles: ['a', 'b', 'c', 'd'], tags: ['p', 'q'] }
  const fine2 = { title: 'Two', tiles: ['e', 'f', 'g', 'h'], tags: ['r', 's'] }
  assert(!categoriesNearDuplicate([fine1, fine2]), 'distinct categories are not near-duplicates')
  assert(comboUsable([fine1, fine2]), 'comboUsable true for distinct, tile-compatible categories')
  // Every auto-generated puzzle is free of near-duplicate categories.
  const gen = autoGeneratePuzzles(connectionBank, { count: 12, seed: 7 })
  let clean = true
  for (const p of gen) {
    const cats = p.categories.map((c) => ({ title: c.title, tiles: c.items.map((i) => i.term), tags: c.tags }))
    if (categoriesNearDuplicate(cats)) clean = false
  }
  assert(clean, 'no generated puzzle contains near-duplicate categories')
}

console.log('\n[27] Seeded reproducibility — same seed string → same sequence')
{
  const a = seededRng('plexus-seed-xyz')
  const b = seededRng('plexus-seed-xyz')
  const seqA = Array.from({ length: 5 }, () => a())
  const seqB = Array.from({ length: 5 }, () => b())
  assert(seqA.every((v, i) => v === seqB[i]), 'seededRng is reproducible for one seed string')
  assert(hashStringToSeed('abc') === hashStringToSeed('abc'), 'hashStringToSeed is stable')
  assert(hashStringToSeed('abc') !== hashStringToSeed('abd'), 'different strings → different seeds')
}

console.log('\n[28] Race Mode — seeded challenge is deterministic and renderable')
{
  const codeOk = isValidJoinCode(makeJoinCode())
  assert(codeOk, 'makeJoinCode produces a valid join code')
  assert(normalizeJoinCode('ab2d!!') === 'AB2D', 'normalizeJoinCode uppercases and strips')
  const r1 = buildRaceChallenge(connectionBank, { code: 'MNPQ' })
  const r2 = buildRaceChallenge(connectionBank, { code: 'MNPQ' })
  const r3 = buildRaceChallenge(connectionBank, { code: 'RSTU' })
  const sig = (r) => r.map((x) => `${x.type}:${x.categoryId || x.anchor || ''}`).join('|')
  assert(r1.length === 10, 'race set has 10 rounds')
  assert(sig(r1) === sig(r2), 'same code → identical race set (seeded)')
  assert(sig(r1) !== sig(r3), 'different code → different race set')
  assert(r1.every((x) => RACE_ROUND_TYPES.includes(x.type)), 'race rounds are all renderable single-screen types')
}

console.log('\n[29] 3-Minute distractors are curated near misses, never fragments or random tiles')
{
  let seed = 123
  const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const wordplayTiles = new Set(
    connectionBank.filter((c) => c.title.includes('___')).flatMap((c) => c.tiles.map((t) => t.toLowerCase()))
  )
  let checked = 0
  for (const type of ['rapidAssociation', 'impostor', 'completeConnection', 'linkTwo', 'sameOrDifferent']) {
    for (let i = 0; i < 30; i++) {
      const r = genChallengeRound(connectionBank, { rng, roundTypes: [type] })
      assert(r, type + ' round builds')
      if (!r) continue
      const title = r.anchor || r.categoryTitle || r.anchorLabel
      const anchor = (r.categoryId && connectionBank.find((c) => c.id === r.categoryId)) || connectionBank.find((c) => c.title === title && c.status === 'verified')
      const near = new Set(connectionBank.filter((c) => c.title === title).flatMap((c) => c.nearMisses || []).map((n) => n.text.toLowerCase()))
      const wrong = type === 'impostor' ? [r.correctAnswer] : type === 'sameOrDifferent' ? (r.outsider ? [r.outsider] : []) : r.options.filter((o) => !o.correct).map((o) => o.text)
      for (const w of wrong) {
        checked++
        assert(near.has(w.toLowerCase()), type + ': "' + w + '" is a curated near miss of ' + title)
        assert(!wordplayTiles.has(w.toLowerCase()), type + ': no wordplay fragment as an option')
      }
      assert(!(anchor && (anchor.connectionType === 'language' || anchor.title.includes('___'))), type + ': never built on a wordplay group')
    }
  }
  assert(checked > 100, 'checked ' + checked + ' distractors')
  // every curated near miss has a reason and is not one of its own tiles
  for (const c of connectionBank.filter((c) => c.nearMisses)) {
    for (const n of c.nearMisses) assert(n.why && n.why.length > 10 && !c.tiles.map((t) => t.toLowerCase()).includes(n.text.toLowerCase()), 'near miss has a reason and is not a member: ' + c.id)
  }
  // "Same connection?" is gone: every Yes/No round names its group
  for (let i = 0; i < 20; i++) {
    const r = genChallengeRound(connectionBank, { rng, roundTypes: ['sameOrDifferent'] })
    assert(r.prompt !== 'Same connection?' && r.anchorLabel && r.prompt === r.anchorLabel, 'Yes/No round names its group')
  }
}


console.log('\n[30] Supabase layer is additive — app runs in local mode when unconfigured')
{
  const { isSupabaseConfigured } = await import('../src/lib/supabaseClient.js')
  assert(isSupabaseConfigured() === false, 'isSupabaseConfigured() is false with no env (→ local fallback)')
  // Repos import cleanly without statically requiring @supabase/supabase-js.
  const lib = await import('../src/lib/libraryRepo.js')
  assert(typeof lib.listConnections === 'function', 'libraryRepo loads without the supabase package installed')
  const auth = await import('../src/lib/auth.js')
  assert(typeof auth.signInWithMagicLink === 'function', 'auth loads without the supabase package installed')
  // Read paths return null when unconfigured (caller falls back to local bank).
  const conns = await lib.listConnections({})
  assert(conns === null, 'listConnections() returns null when Supabase is unconfigured')
}

console.log('\n[31] Daily seed is canonical and deterministic (PLEXUS-YYYY-MM-DD)')
{
  const { dailySeedString, buildDailyFromSeed } = await import('../src/utils/dailySeed.js')
  const seed = dailySeedString('2026-10-03')
  assert(seed === 'PLEXUS-2026-10-03', `seed string format is canonical (${seed})`)
  const a = buildDailyFromSeed(connectionBank, seed)
  const b = buildDailyFromSeed(connectionBank, seed)
  assert(a && b, 'buildDailyFromSeed produces a puzzle')
  const sig = (p) => p.categories.map((c) => c.title).join('|')
  assert(sig(a) === sig(b), 'same seed → identical daily puzzle')
  const c = buildDailyFromSeed(connectionBank, dailySeedString('2026-10-04'))
  assert(sig(a) !== sig(c), 'different date seed → different daily puzzle')
  assert(validatePuzzle(a).length === 0, 'seeded daily passes puzzle validation')
}

// ---------------------------------------------------------------
console.log('\n[32] Daily board changes every day (regression: not stuck on one puzzle)')
{
  const sig = (p) => p.categories.map((c) => c.title).join('|')
  const seen = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(2026, 9, 4 + i) // 14 consecutive dates
    const p = getDailyPuzzleForDate(d)
    assert(!!p, `daily resolves for ${dateKey(d)}`)
    assert(validatePuzzle(p).length === 0, `daily for ${dateKey(d)} is a valid puzzle`)
    seen.push(sig(p))
  }
  const unique = new Set(seen).size
  assert(unique >= 12, `14 consecutive days give mostly distinct boards (got ${unique}/14 unique)`)
  // Determinism: the same date must always resolve to the same board.
  const d = new Date(2026, 10, 2)
  assert(sig(getDailyPuzzleForDate(d)) === sig(getDailyPuzzleForDate(d)), 'same date → identical board (deterministic)')
}

// ---------------------------------------------------------------
console.log('\n[33] Cloud progress merge is monotonic (never loses a streak)')
{
  const { mergeStats, mergeDailyHistory, mergeChallenge, mergeSnapshots } = await import('../src/utils/progressSync.js')

  // Two devices: one has a longer historical max, the other has the more
  // recent (and higher) current streak. Merge must keep the best of each.
  const deviceA = { maxStreak: 12, currentStreak: 3, lastCompletedDailyKey: '2026-10-01', gamesPlayed: 20, gamesWon: 18, maxPerfectStreak: 5, currentPerfectStreak: 1, mistakeDistribution: [10, 4, 2, 1, 3] }
  const deviceB = { maxStreak: 7, currentStreak: 6, lastCompletedDailyKey: '2026-10-04', gamesPlayed: 15, gamesWon: 14, maxPerfectStreak: 3, currentPerfectStreak: 4, mistakeDistribution: [12, 2, 1, 0, 0] }
  const m = mergeStats(deviceA, deviceB)
  assert(m.maxStreak === 12, `merge keeps the higher max streak (got ${m.maxStreak})`)
  assert(m.currentStreak === 6 && m.lastCompletedDailyKey === '2026-10-04', 'current streak follows the most recent day')
  assert(m.gamesPlayed === 20 && m.gamesWon === 18, 'lifetime counts never shrink')
  assert(m.mistakeDistribution[0] === 12, 'mistake distribution is element-wise max')

  // Symmetry of the protective guarantee: neither order can reduce a max.
  const m2 = mergeStats(deviceB, deviceA)
  assert(m2.maxStreak === 12 && m2.currentStreak === 6, 'merge is order-independent for the protected fields')

  // Daily history union: completed beats incomplete; fewer mistakes wins.
  const hA = { '2026-10-01': { date: '2026-10-01', completed: true, won: true, mistakes: 2 }, '2026-10-02': { date: '2026-10-02', completed: false } }
  const hB = { '2026-10-02': { date: '2026-10-02', completed: true, won: true, mistakes: 1 }, '2026-10-03': { date: '2026-10-03', completed: true, won: true, mistakes: 0 } }
  const hm = mergeDailyHistory(hA, hB)
  assert(Object.keys(hm).length === 3, 'daily history is unioned across devices')
  assert(hm['2026-10-02'].completed && hm['2026-10-02'].mistakes === 1, 'the better (completed, fewer mistakes) daily entry wins')

  // Challenge bests take the max; history de-dupes and caps.
  const cm = mergeChallenge({ personalBest: 800, history: [{ completedAt: 'a', score: 800 }] }, { personalBest: 950, history: [{ completedAt: 'a', score: 800 }, { completedAt: 'b', score: 950 }] })
  assert(cm.personalBest === 950, 'challenge personal best takes the max')
  assert(cm.history.length === 2, 'challenge history de-duplicates by completedAt')

  // Whole-snapshot merge never lowers the headline streak, in either direction.
  const snapA = { stats: deviceA, dailyHistory: hA, challenge: {} }
  const snapB = { stats: deviceB, dailyHistory: hB, challenge: {} }
  const sm = mergeSnapshots(snapA, snapB)
  assert(sm.stats.maxStreak >= Math.max(deviceA.maxStreak, deviceB.maxStreak), 'snapshot merge preserves the highest max streak')
}

// ---------------------------------------------------------------
console.log('\n[34] Every new-library subject has fixed Systems starter boards that build valid puzzles')
{
  const NL = await import('../src/utils/newLibrary.js')
  for (const subject of NL.LIBRARY_SUBJECTS) {
    const boards = NL.systemsBoardsFor(subject, '2026-10-09')
    assert(boards.length >= 3, `"${subject}" has starter boards (${boards.length})`)
    for (const [i, b] of boards.entries()) {
      const p = NL.systemsBoardPuzzle(b, i)
      const errs = validatePuzzle(p)
      if (errs.length) assert(false, `${b.id}: ${errs.join('; ')}`)
    }
  }
  assert(true, 'every starter board validates')
}

console.log('\n[35] No merged-bank path: the app never mixes Supabase rows into either library')
{
  const fs = await import('node:fs')
  assert(!fs.existsSync(new URL('../src/lib/contentSource.js', import.meta.url)), 'the Supabase merge module (contentSource.js) is gone')
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert(!/mergeBank|loadExtraConnections/.test(app), 'App.jsx does not merge extra connections into a bank')
}

console.log('\n[36] Daily gate: today\'s Daily unlocks the other modes')
{
  const { evaluateGate, isDailyFinished, isGatedView } = await import('../src/utils/dailyGate.js')
  const cur = { key: '2026-10-05', day: 1008, puzzleId: 'daily-2026-10-05' }
  const prev = { key: '2026-10-04', day: 1007, puzzleId: 'daily-2026-10-04' }
  const done = (k, id, extra = {}) => ({ [k]: { date: k, puzzleId: id, completed: true, won: true, ...extra } })
  assert(!evaluateGate({ history: {}, current: cur, latest: cur }).unlocked, 'locked before today\'s Daily is finished')
  assert(!evaluateGate({ history: done(prev.key, prev.puzzleId), current: cur, latest: cur }).unlocked, 'yesterday\'s completion does not unlock today')
  assert(evaluateGate({ history: done(cur.key, cur.puzzleId), current: cur, latest: cur }).unlocked, 'finishing today\'s Daily unlocks')
  assert(evaluateGate({ history: done(cur.key, cur.puzzleId, { won: false }), current: cur, latest: cur }).unlocked, 'a finished-but-lost Daily still unlocks (it cannot be replayed for credit)')
  assert(!isDailyFinished(done(cur.key, 'daily-other'), cur.key, cur.puzzleId), 'a history entry for a different puzzle id does not count')
  assert(isDailyFinished({ [cur.key]: { date: cur.key, completed: true } }, cur.key, cur.puzzleId), 'older entries without a puzzle id still count')
  // Clock turned back one day to a completed Daily while the newer one is unfinished.
  assert(!evaluateGate({ history: done(prev.key, prev.puzzleId), current: prev, latest: cur }).unlocked, 'turning the clock back to a completed day does not unlock')
  assert(evaluateGate({ history: { ...done(prev.key, prev.puzzleId), ...done(cur.key, cur.puzzleId) }, current: prev, latest: cur }).unlocked, 'it does once the newest Daily is finished too')
  assert(isGatedView('systems') && isGatedView('challenge') && isGatedView('race') && isGatedView('archive'), 'Systems, 3-Minute, Race and Review are gated')
  assert(!isGatedView('home') && !isGatedView('game', 'daily'), 'Today and the Daily board are never gated')
  assert(isGatedView('game', 'system') && isGatedView('game', 'archive'), 'system boards and past Dailies are gated')
}

console.log('\n[37] No em dashes in any bundled Plexus copy')
{
  const files = ['connectionBank', 'connectionBankExtra', 'connectionBankExtra2', 'migratedBankCategories', 'dailyPuzzles', 'generatedPuzzles', 'systemPuzzles']
  const offenders = []
  const walk = (v, path) => {
    if (typeof v === 'string') { if (v.includes('\u2014')) offenders.push(`${path}: ${v.slice(0, 80)}`) }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`))
  }
  for (const f of files) {
    const mod = await import(`../src/data/${f}.js`)
    walk(mod, f)
  }
  assert(offenders.length === 0, `no em dash in any bundled content string${offenders.length ? ': ' + offenders.slice(0, 3).join(' | ') : ''}`)
  const { GROUP_META } = await import('../src/components/GroupMotif.jsx').catch(() => ({ GROUP_META: null }))
  if (GROUP_META) {
    const motifs = new Set(Object.values(GROUP_META).map((g) => g.motif))
    assert(motifs.size === 4, 'each of the four groups has its own connection pattern')
  }
}

console.log('\n[38] Progression engine: XP, levels, streaks, This Week, Kit, merge, backfill, no ranks')
{
  const _store = {}
  const _prevLS = globalThis.localStorage
  globalThis.localStorage = { getItem: (k) => _store[k] ?? null, setItem: (k, v) => { _store[k] = v }, removeItem: (k) => { delete _store[k] } }
  const E = await import('../src/progression/engine.js')
  const S = await import('../src/progression/store.js')
  const K = await import('../src/progression/streak.js')
  const C = await import('../src/progression/config.js')
  const store = _store
  // levels
  const li=E.levelInfo(6520); assert(li.level===11&&li.toNext===740,'level 11 at 6520')
  assert(E.levelInfo(19690).level===18&&E.levelInfo(51150).level===26,'level curve unchanged'); assert(E.levelInfo(10_000_000).level>60,'no maximum level')
  assert(!('stage' in li)&&!('milestone' in li)&&C.STAGES===undefined&&C.MILESTONES===undefined,'no ranks or rank milestones in the model')
  // idempotent + taper
  let s=E.emptyState(); const at=new Date(2026,9,5,12).getTime()
  assert(E.award(s,{id:'a',xp:100,kind:'daily',at})===100 && E.award(s,{id:'a',xp:100,kind:'daily',at})===0,'idempotent')
  let p=0; for(let i=0;i<14;i++) p+=E.award(s,{id:'sp'+i,xp:50,kind:'syspuzzle',at})
  assert(p===600+Math.floor(100*0.5),'taper after 600 practice: '+p)
  assert(E.award(s,{id:'next',xp:50,kind:'syspuzzle',at:at+86400000})===50,'taper resets next day')
  // streak
  const h={'2026-10-01':{completed:true,won:true,completedAt:'2026-10-01T15:00:00'},'2026-10-02':{completed:true,won:true,completedAt:'2026-10-02T15:00:00'},'2026-10-04':{completed:true,won:true,completedAt:'2026-10-04T15:00:00'}}
  assert(K.currentStreak(h,'2026-10-05')===1,'missed day breaks streak (yesterday counts)')
  assert(K.currentStreak(h,'2026-10-05',{shielded:new Set(['2026-10-03'])})===3,'shield bridges a covered day')
  assert(K.currentStreak(h,'2026-10-12')===0,'long gap: streak 0')
  assert(K.needsShield({...h,'2026-10-06':{completed:true,won:true}},'2026-10-06')==='2026-10-05','shield needed for yesterday')
  assert(K.longestStreak(h)===2,'longest real streak')
  const late={'2026-10-01':{completed:true,won:true,completedAt:'2026-10-03T10:00:00'}}; assert(K.currentStreak(late,'2026-10-02')===0,'archive late finish is not a streak day')
  // store: daily flow
  const puzzle={id:'daily-2026-10-05',categories:[{level:1},{level:2},{level:3},{level:4}]}
  const gl=[0,1,2,3].map(i=>({correct:true,catIndexes:[i,i,i,i]}))
  const hist={'2026-10-05':{completed:true,won:true,mistakes:0,completedAt:new Date().toISOString()}}
  const today=E.localDayKey(Date.now())
  const r=S.recordDailyFinish({dateKey:today,isToday:true,puzzle:{...puzzle,id:'daily-'+today},won:true,mistakes:0,guessLog:gl,history:{[today]:hist['2026-10-05']}})
  assert(r.gained===175,'daily + perfect + connections = 175, got '+r.gained)
  const r2=S.recordDailyFinish({dateKey:today,isToday:true,puzzle:{...puzzle,id:'daily-'+today},won:true,mistakes:0,guessLog:gl,history:{[today]:hist['2026-10-05']}})
  assert(r2.gained===0,'same Daily twice pays nothing')
  assert(r.levelUp && r.after.level===2,'level up to 2'); assert(r.grants.includes('curbside'),'level 2 grants Curbside')
  assert(S.spendCurbside('x')===true,'curbside usable'); 
  // system complete one-time
  const sp={id:'system-live-cardio-1',categories:[{level:1},{level:2},{level:3},{level:4}]}
  const rs=S.recordSystemFinish({puzzle:sp,system:'Cardiology',won:true,guessLog:gl,systemComplete:true}); assert(rs.gained===50+50+300,'system finish + complete = 400, got '+rs.gained)
  const rs2=S.recordSystemFinish({puzzle:{...sp,id:'system-live-cardio-2'},system:'Cardiology',won:true,guessLog:gl,systemComplete:true}); assert(!rs2.lines.some(l=>l[0].includes('complete')),'system bonus only once')
  // merge
  const A=S.loadProgression(); const B=E.emptyState(); E.award(B,{id:'daily:2020-01-01',xp:100,kind:'daily',at}); const M=E.mergeStates(A,B); assert(E.totalXp(M)===E.totalXp(A)+100,'merge unions ledgers')
  assert(E.totalXp(E.mergeStates(A,A))===E.totalXp(A),'merging the same state does not double')
  // backfill
  for(const k of Object.keys(store)) delete store[k]
  const bh={'2026-09-01':{completed:true,won:true,mistakes:0,completedAt:'2026-09-01T10:00:00'},'2026-09-02':{completed:true,won:false,mistakes:4,completedAt:'2026-09-02T10:00:00'},'2026-08-01':{completed:true,won:true,mistakes:1,completedAt:'2026-09-03T10:00:00'}}
  const bf=S.backfillIfNeeded({history:bh,mastery:{c1:{timesSolved:2}},bankById:{c1:{difficulty:'hard'}},systems:[],challenge:{history:[{completedAt:'x',roundsCorrect:10}],personalBest:500},systemWins:3})
  const tot=E.totalXp(S.loadProgression())
  assert(tot===(100+50+25)+(100)+(50+50)+30+150+30+15,'backfill total '+tot)
  assert(S.backfillIfNeeded({history:bh})===null,'backfill runs once')
  // rounds goals rotate and differ week to week
  for(let w=0;w<12;w++){const a=E.roundsGoals(w).map(g=>g.id).join(),b=E.roundsGoals(w+1).map(g=>g.id).join();assert(a!==b,'weeks differ '+w)}
  assert(!C.ROUNDS_POOL.some(g=>/race/i.test(g.label)),'no live-race weekly goal')
  const allNames = Object.values(C.KIT).map((k) => k.name + ' ' + k.desc).join(' ')
  assert(!/\b(Dr\.|MD|DO)\b/.test(allNames) && !allNames.includes('\u2014'), 'no credential language or em dashes in Kit names')
  // Kit opens by level; each tool is first granted at the level it unlocks
  for (const [item, def] of Object.entries(C.KIT)) {
    assert(Number.isInteger(def.unlock) && !('stage' in def), item+' has a level unlock')
    assert(!E.itemOpen(item, def.unlock - 1) && E.itemOpen(item, def.unlock), item+' opens at level '+def.unlock)
    if (item !== 'shield') { let first=null; for (let L=2;L<40&&first===null;L++) if (C.levelRewards(L).includes(item)) first=L; assert(first!==null && first>=def.unlock && first<=Math.max(def.unlock,2), item+' first granted at level '+first) }
  }
  assert(C.KIT['time-out'].unlock<=14 && C.KIT['second-opinion'].unlock<=12, 'core tools within weeks, not months')
  // same number of items per level as before, so no level ever adds a grant
  const oldCount=(L)=>L<2?0:(L===6||L===18)?3:L===26?6:1
  for (let L=1;L<=60;L++) assert(C.levelRewards(L).length===oldCount(L),'reward count unchanged at level '+L)
  // migration: a save from the rank system keeps every point, item and flag
  for(const k of Object.keys(store)) delete store[k]
  const old=E.emptyState(); old.seen={level:7,stages:{student:true}}
  E.award(old,{id:'bf-daily',xp:2200,kind:'bf-daily',at})
  const oldItems={2:'curbside',3:'curbside',4:'curbside',5:'curbside',6:['lab','imaging','curbside'],7:'curbside'}
  for (const [L,v] of Object.entries(oldItems)) [].concat(v).forEach((item,i)=>E.grant(old,{id:`level:${L}:${i}`,item,source:'level',at}))
  E.grant(old,{id:'rounds:2026-W40:item',item:'time-out',source:'rounds',at})
  old.migrated=at
  localStorage.setItem('plexus.progression.v1', JSON.stringify(old))
  const beforeCounts=E.kitCounts(E.normalize(old))
  const mr=S.recordChallengeSession({completedAt:'mig-1',roundsCorrect:0,personalBest:false})
  const after=S.loadProgression()
  assert(E.totalXp(after)===2200,'migration keeps XP: '+E.totalXp(after))
  assert(E.levelInfo(E.totalXp(after)).level===7,'migration keeps level 7')
  assert(JSON.stringify(E.kitCounts(after))===JSON.stringify(beforeCounts),'migration keeps Kit exactly, no new or duplicate grants')
  assert(after.kit.grants['level:5:0'].item==='curbside','a grant from the old schedule stays as it was')
  assert(after.seen.stages.student===true && !('promotion' in mr),'legacy stage flag kept, no promotion in results')
  assert(E.mergeStates(after,old).seen.stages.student===true,'legacy field survives a merge')
  // no rank language left in the progression UI or engine
  const fs = await import('node:fs')
  const progFiles=['src/components/Record.jsx','src/components/RecordParts.jsx','src/components/XpResult.jsx','src/components/Home.jsx','src/App.jsx','src/progression/config.js','src/progression/engine.js','src/progression/store.js']
  const rank=/Premed|Medical Student|Resident|Attending|First Shadow|Interview Season|White Coat|Preclinical|Clerkships|Match Season|\bIntern\b|PGY|\bChief\b|Promot|\bCareer\b/
  for (const f of progFiles) { const t=fs.readFileSync(f,'utf8'); const m=t.match(rank); assert(!m, f+' has no rank language'+(m?': '+m[0]:'')) }
  assert(!fs.existsSync('src/components/Career.jsx')&&!fs.existsSync('src/components/CareerParts.jsx'),'old Career components removed')
  globalThis.localStorage = _prevLS
}

console.log('\n[39] Name the connection is removed; earned XP is kept')
{
  const fs = await import('node:fs')
  const C = await import('../src/progression/config.js')
  const E = await import('../src/progression/engine.js')
  assert(!('categoryBonus' in C.XP), 'no naming bonus in the XP config')
  assert(!fs.existsSync('src/recall') && !fs.existsSync('api/recall-judge.js'), 'matcher and server check removed')
  const ui = ['src/components/Game.jsx', 'src/components/SolvedGroup.jsx', 'src/components/HowToModal.jsx', 'src/components/Legal.jsx', 'src/App.jsx'].map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  assert(!/Name the connection|recall-input|judgeAnswer|recordCategoryBonus|Category bonus/.test(ui), 'no naming UI, matching or bonus left in the app')
  // A save that already holds naming bonuses keeps that XP.
  const st = E.normalize({ ledger: { 'daily:2026-10-01': { xp: 100, kind: 'daily', at: 1 }, 'category-bonus:daily-2026-10-01:g1': { xp: 10, kind: 'recall', at: 2 } } })
  assert(E.totalXp(st) === 110, 'previously earned naming XP still counts toward the total')
}

console.log('\n[40] Legal: footer, disclaimers, privacy matches the code, account deletion')
{
  const fs = await import('node:fs')
  const L = await import('../src/legal/config.js')
  assert(L.DISCLAIMER_TEXT === 'Plexus is an educational game and is not a substitute for professional medical advice, diagnosis, treatment, or clinical judgment. Do not use Plexus to make patient-care decisions.', 'educational disclaimer word for word')
  assert(L.ACCURACY_TEXT === 'Medical information in Plexus may contain errors or become outdated. Users should verify information with authoritative clinical and educational sources.', 'accuracy statement word for word')
  assert(L.AGE_TEXT.includes('not intended for children under 13'), 'under-13 statement')
  assert(L.COPYRIGHT === '© 2026 Plexus. All rights reserved.', 'copyright line')
  const legal = fs.readFileSync('src/components/Legal.jsx', 'utf8')
  const all = legal + fs.readFileSync('src/components/LegalFooter.jsx', 'utf8') + fs.readFileSync('src/legal/config.js', 'utf8') + fs.readFileSync('src/components/AuthModal.jsx', 'utf8')
  assert(!all.includes('®') && !/Plexus\(R\)/.test(all), 'no registered trademark symbol')
  assert(!/100\s*%|fully secure|totally secure|guarantee(?:d|s)? (?:your|that|the) (?:data|security)/i.test(legal), 'no absolute security claims')
  assert(!all.includes('—'), 'no em dashes in legal copy')
  // Privacy names every outside service the code actually uses
  const src = (f) => fs.readFileSync(f, 'utf8')
  if (src('src/lib/supabaseClient.js').includes('createClient')) assert(legal.includes('Supabase'), 'Privacy names Supabase')
  if (fs.existsSync('api/recall-judge.js') && src('api/recall-judge.js').includes('api.anthropic.com')) assert(legal.includes('Anthropic'), 'Privacy names Anthropic for the answer check')
  if (fs.existsSync('vercel.json')) assert(legal.includes('Vercel'), 'Privacy names the host')
  if (src('src/lib/liveRace.js').includes('channel(')) assert(legal.includes('Supabase Realtime'), 'Privacy covers live races')
  // and nothing collects what the page says Plexus does not collect
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(d + '/' + e.name) : /\.(jsx?|html)$/.test(e.name) ? [d + '/' + e.name] : []))
  const code = [...walk('src').filter((f) => !f.startsWith('src/data/')), 'index.html'].map((f) => src(f)).join('\n')
  assert(!/navigator\.geolocation|gtag\(|googletagmanager|posthog|mixpanel|segment\.io|plausible\.io|@vercel\/analytics|sentry|hotjar|fbq\(/i.test(code), 'no trackers or location: if one is added, update the Privacy page first')
  assert(!/document\.cookie\s*=/.test(code), 'no cookies set by Plexus')
  // the cloud progress table is limited to its owner
  const mig3 = src('supabase/migrations/0003_profiles_progress.sql')
  assert(/user_id = auth\.uid\(\)/.test(mig3) && /enable row level security/.test(mig3), 'cloud progress readable only by its owner (as the page says)')
  // account deletion: the caller only, cascades, no service key in the app
  const mig4 = src('supabase/migrations/0004_delete_account.sql')
  assert(/delete from auth\.users where id = uid/.test(mig4) && /auth\.uid\(\)/.test(mig4) && /grant execute on function public\.delete_my_account\(\) to authenticated/.test(mig4) && /revoke all/.test(mig4), 'delete_my_account deletes only the caller and is limited to signed-in users')
  for (const t of ['profiles', 'user_progress']) assert(new RegExp(`create table if not exists public\\.${t}[\\s\\S]*?references auth\\.users \\(id\\) on delete cascade`).test(src('supabase/migrations/0001_library.sql') + mig3), t + ' is removed with the account')
  assert(/rpc\('delete_my_account'\)/.test(src('src/lib/auth.js')) && !/service_role|SERVICE_ROLE/.test(code), 'deletion runs as the player; no service-role key in browser code')
  // clearing this device only touches Plexus keys
  const D = await import('../src/legal/deviceData.js')
  const mem = { k: { 'plexus.a': 1, 'medconnections.b': 1, 'sb-x-auth-token': 1, 'other.site': 1 }, get length() { return Object.keys(this.k).length }, key(i) { return Object.keys(this.k)[i] }, removeItem(k) { delete this.k[k] } }
  const prevL = globalThis.localStorage, prevS = globalThis.sessionStorage
  globalThis.localStorage = mem; globalThis.sessionStorage = undefined
  D.clearDeviceData()
  assert(Object.keys(mem.k).join() === 'other.site', 'clear device removes only Plexus keys')
  globalThis.localStorage = prevL; globalThis.sessionStorage = prevS
  // no contact address invented
  if (!L.CONTACT_EMAIL) assert(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(legal.replace(/mailto:\$\{CONTACT_EMAIL\}/, '')), 'no contact email hardcoded in the pages while none is set')
}

console.log('\n[41] Home and My Plexus: economy unchanged, previews faithful, copy clean')
{
  const C = await import('../src/progression/config.js')
  const E = await import('../src/progression/engine.js')
  // XP values and level thresholds are exactly what they were.
  assert(JSON.stringify(C.XP) === JSON.stringify({ daily: 100, perfect: 25, archive: 50, connection: { 1: 5, 2: 10, 3: 15, 4: 20 }, systemPuzzle: 50, systemComplete: 300, challengePerCorrect: 3, challengeMax: 60, challengeNewBest: 15, raceFinish: 20, raceWin: 10, raceSolo: 10, raceDailyLimit: 5, rounds: 250 }), 'XP values unchanged (naming bonus removed)')
  const costs = Array.from({ length: 12 }, (_, i) => C.levelCost(i + 1)).join(',')
  assert(costs === '150,220,290,380,490,600,730,860,1010,1180,1350,1540', 'level thresholds unchanged (' + costs + ')')
  assert(E.levelInfo(149).level === 1 && E.levelInfo(150).level === 2 && E.levelInfo(370).level === 3, 'level boundaries land where they did')
  assert(C.levelRewards(5).join() === 'lab' && C.levelRewards(6).join() === 'lab,imaging,curbside', 'reward schedule unchanged')
  // Connection of the day preview: first sentence + rest is always the exact
  // explanation, the preview ends at a sentence end, and no em dashes.
  const { firstSentence } = await import('../src/utils/connectionOfDay.js')
  const cats = [...connectionBank, ...connectionBankExtra].filter((c) => c.explanation)
  let bad = 0
  let dashes = 0
  for (const c of cats) {
    const { first, rest } = firstSentence(c.explanation)
    const joined = rest ? `${first} ${rest}` : first
    if (joined.replace(/\s+/g, ' ') !== c.explanation.trim().replace(/\s+/g, ' ') || !/[.!?)]$/.test(first)) bad++
    if (/—/.test(c.explanation) || /—/.test(c.remember || '')) dashes++
  }
  assert(bad === 0, `preview splits faithfully for all ${cats.length} explanations (${bad} off)`)
  assert(dashes === 0, 'no em dashes in explanations or takeaways')
  assert(firstSentence('Low K causes U waves. Also e.g. flattened T. Done.').first === 'Low K causes U waves.', 'splits at the first sentence end')
  assert(firstSentence('Seen with e.g. Lyme disease. More here.').first === 'Seen with e.g. Lyme disease.', 'does not split after e.g.')
  // New UI files: no em dashes in user-facing strings, no rank or currency language.
  const fs = await import('node:fs')
  for (const f of ['src/components/HowToModal.jsx', 'src/components/Modal.jsx', 'src/components/Home.jsx', 'src/components/DailyPlexus.jsx', 'src/components/Record.jsx', 'src/components/RecordParts.jsx', 'src/components/XpResult.jsx', 'src/components/useGrowthAnimation.js']) {
    const t = fs.readFileSync(f, 'utf8')
    const strings = [...t.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g), ...t.matchAll(/'([^'\n]*[A-Za-z ][^'\n]*)'/g), ...t.matchAll(/`([^`\n]*)`/g)].map((m) => m[1])
    assert(!strings.some((x) => /—/.test(x)), f + ' has no em dash in UI strings')
    assert(!/\b(coins?|gems?|loot|achievements?)\b/i.test(strings.join(' ')), f + ' adds no currency or achievement language')
  }
}

// ---------------------------------------------------------------
console.log(`\n${'='.repeat(40)}`)
if (failures === 0) {
  console.log(`ALL CHECKS PASSED (${allPuzzles.length} puzzles validated: ${dailyPuzzles.length} daily, ${systemPuzzles.length} system)\n`)
  process.exit(0)
} else {
  console.log(`${failures} CHECK(S) FAILED\n`)
  process.exit(1)
}
