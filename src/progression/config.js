// ---------------------------------------------------------------------
// Plexus progression: every tunable number lives here.
// ---------------------------------------------------------------------
// XP values, the level curve, level rewards, weekly goals (shown as This
// Week) and Your Tools rules. Components and the engine read from this file
// only, so the economy can be retuned without touching UI code.
//
// Progression is levels only. There are no ranks or titles.

export const XP = {
  // Daily: finishing today's Daily pays `daily` win or lose (showing up is
  // what keeps the habit), a win adds `dailyWin`, each solved group adds its
  // connection XP, and a perfect solve adds `perfect`. A full, perfect solve
  // still pays 175 as before; a quick deliberate loss pays 75, not 100.
  daily: 75,
  dailyWin: 25,
  perfect: 25, // today's Daily, won, 0 mistakes, no tools used
  // A past Daily from the Archive, first finish only: `archive` when it is
  // solved, plus the groups solved. A lost Archive Daily pays only its solved
  // groups, so losing old Dailies on purpose earns nothing.
  archive: 40,
  connection: { 1: 5, 2: 10, 3: 15, 4: 20 }, // Easy, Medium, Hard, Expert
  systemPuzzle: 50, // legacy: a Systems puzzle solved (still used to backfill pre-progression wins)
  // Systems boards: paid once, only when the board is solved, by which attempt
  // solved it (1st, 2nd, 3rd, 4th or later). Replays pay nothing.
  systemAttempt: [100, 75, 50, 25],
  systemComplete: 300, // every board a subject offers solved (once per subject)
  // 3 Minutes: 3 per correct answer, minus 1 per wrong answer (never below
  // 0), up to 60 a session, plus 15 for a new personal best. Accuracy counts,
  // so tapping through without reading earns little.
  challengePerCorrect: 3,
  challengePerWrong: 1,
  challengeMax: 60,
  challengeNewBest: 15,
  // Race: a finished run that qualifies (RACE_QUALIFY) pays raceFinish, and a
  // win adds raceWin. A race on this device with no live opponent pays raceSolo.
  raceFinish: 25,
  raceWin: 15,
  raceSolo: 10,
  rounds: 250, // This Week reward
  coverageAlt: 50, // Coverage earned while full, when every puzzle tool is full too
}

// 3 Minutes XP for one session (see XP above).
export function challengeXp({ correct = 0, wrong = 0, newBest = false } = {}) {
  if (!(correct > 0)) return 0
  const net = Math.max(0, Math.min(XP.challengeMax, correct * XP.challengePerCorrect - wrong * XP.challengePerWrong))
  return net + (newBest && net > 0 ? XP.challengeNewBest : 0)
}

// A Race run that earns XP: every round answered, at least 3 correct, and at
// least 20 seconds of play. These are the same per-player thresholds the
// Race server uses for rewards (race_config min_correct and min_run_ms), so a
// run that taps through every answer in a few seconds earns nothing.
export const RACE_QUALIFY = { minCorrect: 3, minRunMs: 20000, rounds: 10 }
export function raceQualifies({ answered = 0, correct = 0, runMs = null, rounds = RACE_QUALIFY.rounds } = {}) {
  return answered >= rounds && correct >= RACE_QUALIFY.minCorrect && (runMs == null || runMs >= RACE_QUALIFY.minRunMs)
}

// No practice taper any more: Systems pays only once per board and the
// Archive only for solved Dailies, so a daily slowdown only made the XP shown
// on a board disagree with the XP paid. Kept as names for old imports.
export const PRACTICE_TAPER_AFTER = Infinity
export const PRACTICE_TAPER_RATE = 1

// ---- Timed XP (3 Minutes and Race share one daily budget) ----
// Per local day (the player's own midnight):
//   the first 150 XP from timed play is paid in full,
//   further timed XP is paid at half rate until the day's timed total reaches
//   225 XP (so up to 75 more XP from 150 XP of play),
//   after that timed sessions pay no XP but stay playable and still count
//   toward This Week when they qualify.
// Both modes draw on the same budget, so switching modes cannot reset it.
export const TIMED_XP = { full: 150, cap: 225, rate: 0.5 }

// A timed session that counts toward This Week: played to its end (the 3
// Minutes clock ran out, or every Race round was answered) with at least 3
// answers submitted and at least 1 correct. Starting, leaving early or letting
// the clock run with no answers counts for nothing and earns nothing.
export const TIMED_QUALIFY = { minAnswers: 3, minCorrect: 1 }

export const STREAK_MILESTONES = [
  { days: 3, xp: 50 },
  { days: 7, xp: 100 },
  { days: 14, xp: 150 },
  { days: 30, xp: 300 },
  { days: 60, xp: 400 },
  { days: 100, xp: 500 },
  { days: 180, xp: 600 },
  { days: 365, xp: 1000 },
]

// XP needed to go from level L to L+1. Rises gently, never ends: there is no
// maximum level. Cost of level L = round((100 + 70n + 6n^2) / 10) * 10 with
// n = L - 1: the first levels come a little faster than before (a first day
// usually reaches Level 3, where Rule Out unlocks), and from about Level 10
// on the curve matches the previous one. The Race server uses the same curve
// (race_player_level, migration 0010).
export const LEVEL_CURVE = { base: 100, linear: 70, square: 6 }
export function levelCost(level) {
  const n = level - 1
  return Math.round((LEVEL_CURVE.base + LEVEL_CURVE.linear * n + LEVEL_CURVE.square * n * n) / 10) * 10
}

// ---- Your Tools ----
// Every number below is a playtest setting, not proven balance. Change it
// here; nothing else needs to move.
//
// Internal ids are kept from earlier versions so saved balances carry over:
// curbside is shown as Consult, lab as Rule Out, shield as Coverage.
//   group  'puzzle' (Daily + Systems boards), 'streak', or 'race'
//   unlock level the tool can be used from (puzzle tools)
//   max    inventory cap; puzzle tools past it wait as pending claims.
//          Coverage past its cap is swapped for a puzzle tool or XP instead
//          (COVERAGE_OVERFLOW below).
//   server race items live in the trusted backend, not in this save
//   desc   the Daily effect (kept for older callers)
//   modes  what the tool does in each mode, checked against Game.jsx and
//          Challenge.jsx (toolEffect). Puzzle tools work in today's Daily
//          and in 3 Minutes only, one per Daily and one per session.
export const KIT = {
  curbside: {
    name: 'Consult', group: 'puzzle', desc: 'Highlights two tiles that belong together.', unlock: 1, max: 5, ready: true,
    modes: {
      daily: 'Highlights two tiles that belong together, from the easiest group you haven’t solved.',
      timed: 'In rounds where you pick or group answers, highlights two that belong together, or one right answer when you pick two.',
    },
  },
  lab: {
    name: 'Rule Out', group: 'puzzle', desc: 'After a “one away” guess, identifies the tile that doesn’t belong with the other three.', unlock: 3, max: 5, ready: true,
    modes: {
      daily: 'After a “one away” guess, identifies the tile that doesn’t belong.',
      timed: 'Crosses out one wrong choice, in rounds with a list of choices.',
    },
  },
  'second-opinion': {
    name: 'Second Opinion', group: 'puzzle', desc: 'Restores one mistake allowance. Your original mistake stays recorded.', unlock: 5, max: 5, ready: true,
    modes: {
      daily: 'After a mistake, restores one mistake allowance. Your original mistake stays recorded.',
      timed: 'Right after a wrong answer, gives back the points it cost and restores your streak. The miss still counts toward accuracy.',
    },
  },
  shield: { name: 'Coverage', group: 'streak', desc: 'Covers one missed day to protect your streak. Used automatically.', unlock: 1, max: 2, ready: true },
}
export const PUZZLE_TOOLS = ['curbside', 'lab', 'second-opinion']
// Where puzzle tools can be used, in one line.
export const TOOL_WHERE = 'Today’s Daily and 3 Minutes only: one per Daily, one per 3 Minutes session. Not in the Archive, Systems or Race.'
export const KIT_ORDER = ['curbside', 'lab', 'second-opinion', 'shield']

// Race power-ups. Inventory, earning and spending happen on the server
// (api/race, supabase/migrations/0006 and 0009); these are the names, copy and
// the display copies of the server settings.
//   Mutation lasts MUTATION_MS. Race power-ups are used in Chaos races only.
//   CRISPR is a level reward: it unlocks at CRISPR_UNLOCK_LEVEL, which pays
//   one charge, then one more every CRISPR_LEVEL_EVERY levels. Races give
//   Mutation only. The server checks the level before CRISPR can be equipped,
//   armed or used, so these numbers are for display.
export const MUTATION_MS = 10000
export const CRISPR_UNLOCK_LEVEL = 12
export const CRISPR_LEVEL_EVERY = 4
export const RACE_ITEMS = {
  mutation: { name: 'Mutation', desc: 'Scrambles the letters on your opponent’s answer tiles for 10 seconds, then restores them.', max: 3 },
  crispr: { name: 'CRISPR', desc: `Arm it to block one incoming Mutation. Used only when it blocks an attack. Unlocks at Level ${CRISPR_UNLOCK_LEVEL}.`, max: 3, unlock: CRISPR_UNLOCK_LEVEL },
}
// Mirrors the server settings (race_config in migrations 0006, 0009, 0010).
//   crisprDropChance   chance of one CRISPR after an eligible Race win: a win
//                      in a race that counted toward Race rewards, once
//                      CRISPR is unlocked. Rolled once per race on the server.
//   crisprUnlockRaces  CRISPR also needs this many counted races, checked on
//                      the server (a Race item should come from racing).
export const RACE_REWARDS = { mutationEveryWins: 5, perOpponentPerDay: 3, perDay: 6, crisprUnlockLevel: CRISPR_UNLOCK_LEVEL, crisprLevelEvery: CRISPR_LEVEL_EVERY, crisprDropChance: 0.02, crisprUnlockRaces: 5 }
// ---- Milestones ----
// Level 10, 20 and 30, then every 5 levels (35, 40, 45 ...). Each milestone:
//   a growing-plexus badge (see PlexusBadge.jsx),
//   one of each puzzle tool (Consult, Rule Out, Second Opinion),
//   +1 to every puzzle tool's limit, with no maximum,
//   one CRISPR from Level 20 on (paid by the Race server, migration 0011,
//   once CRISPR is unlocked; not at Level 10, which comes before the unlock).
// The server mirrors these numbers (race_is_milestone, race_config keys
// milestone_every_after and milestone_crispr_from).
export const MILESTONE_LEVELS = [10, 20, 30]
export const MILESTONE_EVERY_AFTER = 5
export const MILESTONE_CRISPR_FROM = 20
export const MILESTONE_CAP_STEP = 1
export function isMilestone(level) {
  const last = MILESTONE_LEVELS[MILESTONE_LEVELS.length - 1]
  return MILESTONE_LEVELS.includes(level) || (level > last && (level - last) % MILESTONE_EVERY_AFTER === 0)
}
// How many milestones a player at `level` has reached (0 below Level 10).
export function milestonesReached(level) {
  const last = MILESTONE_LEVELS[MILESTONE_LEVELS.length - 1]
  const fixed = MILESTONE_LEVELS.filter((l) => l <= level).length
  return fixed + (level > last ? Math.floor((level - last) / MILESTONE_EVERY_AFTER) : 0)
}
// The milestone levels up to `level`, oldest first.
export function milestoneList(level) {
  const out = []
  for (let L = MILESTONE_LEVELS[0]; L <= level; L++) if (isMilestone(L)) out.push(L)
  return out
}
// The next milestone level above `level`, and the one `n` after it.
export function nextMilestoneLevel(level, n = 0) {
  let found = -1
  for (let L = level + 1; ; L++) {
    if (isMilestone(L) && ++found === n) return L
  }
}
// The latest milestone reached, or null below Level 10.
export function lastMilestoneLevel(level) {
  const list = milestoneList(level)
  return list.length ? list[list.length - 1] : null
}
// What a milestone pays. `tools` are added to Your Tools by the app;
// `crispr` is paid by the Race server.
export function milestoneRewards(level) {
  if (!isMilestone(level)) return null
  return { tools: [...PUZZLE_TOOLS], capStep: MILESTONE_CAP_STEP, crispr: level >= MILESTONE_CRISPR_FROM ? 1 : 0 }
}
// A puzzle tool's limit at `level`: its base limit plus one per milestone.
// Coverage and Race items keep their own limits.
export function toolCap(item, level) {
  const base = KIT[item]?.max
  if (!base) return base
  return PUZZLE_TOOLS.includes(item) ? base + milestonesReached(level) * MILESTONE_CAP_STEP : base
}

// The next level (above `level`) with any reward, and everything it brings:
// puzzle tools, a tool unlock, a CRISPR. Shown as "Next at Level N".
export function nextMilestone(level) {
  for (let L = level + 1; L < level + 50; L++) {
    const items = levelRewards(L).map((it) => (KIT[it]?.unlock === L ? `${KIT[it].name} (new)` : `${KIT[it]?.name || it} +1`))
    if (L >= CRISPR_UNLOCK_LEVEL && (L - CRISPR_UNLOCK_LEVEL) % CRISPR_LEVEL_EVERY === 0) items.push(L === CRISPR_UNLOCK_LEVEL ? 'CRISPR (new)' : 'CRISPR +1')
    const ms = milestoneRewards(L)
    if (ms) {
      items.push('Milestone: one of each tool', 'Tool limit +1')
      if (ms.crispr) items.push('Milestone CRISPR')
    }
    if (items.length) return { level: L, items, milestone: !!ms }
  }
  return null
}
// The next level that pays a CRISPR, for a player at `level`.
export function nextCrisprLevel(level) {
  const fromLevels = level < CRISPR_UNLOCK_LEVEL ? CRISPR_UNLOCK_LEVEL : CRISPR_UNLOCK_LEVEL + (Math.floor((level - CRISPR_UNLOCK_LEVEL) / CRISPR_LEVEL_EVERY) + 1) * CRISPR_LEVEL_EVERY
  let ms = nextMilestoneLevel(level)
  while (ms < MILESTONE_CRISPR_FROM) ms = nextMilestoneLevel(ms)
  return Math.min(fromLevels, ms)
}

// Tools removed in this version and what a held one converts to (1:1, the
// owner's decision). Anything over a cap becomes a pending claim.
export const REMOVED_TOOLS = { imaging: 'curbside', readout: 'lab', 'time-out': 'second-opinion' }
export const REMOVED_NAMES = { imaging: 'Imaging', readout: 'Readout', 'time-out': 'Time Out' }

// One puzzle tool per board attempt.
export const TOOLS_PER_ATTEMPT = 1

// ---- Earning ----
// A new player gets one Consult once. Levels: Consult at 2, Rule Out at 3,
// Second Opinion at 5, then one tool per level from 6, cycling. Levels a
// player had already reached before this version keep what they were given
// then and are not paid again.
export const STARTER_GIFT = ['curbside']
const FIXED_LEVEL_REWARDS = { 2: ['curbside'], 3: ['lab'], 5: ['second-opinion'] }
export const LEVEL_CYCLE_FROM = 6
export const LEVEL_CYCLE = ['curbside', 'lab', 'second-opinion']
export function levelRewards(level) {
  if (level < 2) return []
  if (FIXED_LEVEL_REWARDS[level]) return [...FIXED_LEVEL_REWARDS[level]]
  if (level >= LEVEL_CYCLE_FROM) return [LEVEL_CYCLE[(level - LEVEL_CYCLE_FROM) % LEVEL_CYCLE.length]]
  return []
}
// The next level (above `level`) that gives a tool, and what it gives.
export function nextLevelReward(level) {
  for (let L = level + 1; L < level + 50; L++) {
    const r = levelRewards(L)
    if (r.length) return { level: L, items: r }
  }
  return null
}

// Coverage: one for every N distinct scheduled Dailies completed (not
// Archive replays, not necessarily consecutive). Counting starts from this
// version (the owner's decision), so past Dailies are not back-paid.
export const COVERAGE_EVERY = 7
// Earned while already holding the cap of Coverage: instead of a claim that
// could never be used, the player gets the puzzle tool they hold fewest of
// (unlocked and under its cap; ties go Consult, Rule Out, Second Opinion), or
// XP.coverageAlt if every unlocked puzzle tool is full. Paid once per Coverage.
export const COVERAGE_OVERFLOW = true

// ---- This Week ----
// Three fixed goals, each a different kind of play; finishing any two pays
// the weekly reward once, Monday to Monday in the player's time zone.
// Systems stays out of This Week.
//   dailies  scheduled Dailies completed this week, win or lose (Coverage
//            does not count)
//   timed    qualifying timed sessions finished this week (TIMED_QUALIFY)
//   unaided  a scheduled Daily solved this week with no puzzle tool used
//            (Consult, Rule Out or Second Opinion); mistakes are fine
export const WEEKLY_GOALS = [
  { id: 'dailies', label: 'Complete 3 Daily Challenges', target: 3 },
  { id: 'timed', label: 'Finish 2 timed sessions', hint: '3 Minutes or Race', target: 2 },
  { id: 'unaided', label: 'Solve a Daily without using a tool', hint: 'No Consult, Rule Out or Second Opinion', target: 1 },
]
export const WEEKLY_GOALS_NEEDED = 2
// What keeps a day for the streak goal: 'won' (the Plexus streak rule: that
// date's Daily won on that date) or 'completed' (that date's Daily finished
// on that date, win or lose). Coverage keeps a missed day either way.
export const STREAK_GOAL_DAY = 'completed' // owner's decision: showing up every day, win or lose
// The weekly reward also includes one puzzle tool of the player's choice
// (any they have unlocked).
export const WEEKLY_TOOL_CHOICE = true
