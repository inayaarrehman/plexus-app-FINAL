// ---------------------------------------------------------------------
// Plexus progression: every tunable number lives here.
// ---------------------------------------------------------------------
// XP values, the level curve, level rewards, weekly goals (shown as This
// Week) and Your Tools rules. Components and the engine read from this file
// only, so the economy can be retuned without touching UI code.
//
// Progression is levels only. There are no ranks or titles.

export const XP = {
  daily: 100, // today's Daily finished
  perfect: 25, // today's Daily, 0 mistakes, no tools used
  archive: 50, // a past Daily from the Archive, first finish only
  connection: { 1: 5, 2: 10, 3: 15, 4: 20 }, // Easy, Medium, Hard, Expert
  systemPuzzle: 50, // a Systems puzzle solved
  systemComplete: 300, // every connection in a system solved (once per system)
  challengePerCorrect: 3, // 3-Minute
  challengeMax: 60,
  challengeNewBest: 15,
  raceFinish: 20,
  raceWin: 10,
  raceSolo: 10,
  raceDailyLimit: 5,
  rounds: 250, // This Week reward
}

// Practice (Systems, 3-Minute, Race) halves after this much in one local day,
// so steady play always beats grinding. Dailies are never tapered.
export const PRACTICE_TAPER_AFTER = 600
export const PRACTICE_TAPER_RATE = 0.5

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
// maximum level.
export function levelCost(level) {
  const n = level - 1
  return Math.round((150 + 60 * n + 6 * n * n) / 10) * 10
}

// ---- Your Tools ----
// Every number below is a playtest setting, not proven balance. Change it
// here; nothing else needs to move.
//
// Internal ids are kept from earlier versions so saved balances carry over:
// curbside is shown as Consult, lab as Rule Out, shield as Coverage.
//   group  'puzzle' (Daily + Systems boards), 'streak', or 'race'
//   unlock level the tool can be used from (puzzle tools)
//   max    inventory cap; awards past it wait as pending claims
//   server race items live in the trusted backend, not in this save
export const KIT = {
  curbside: { name: 'Consult', group: 'puzzle', desc: 'Highlights two tiles that belong together.', unlock: 1, max: 5, ready: true },
  lab: { name: 'Rule Out', group: 'puzzle', desc: 'After a “one away” guess, identifies the tile that doesn’t belong with the other three.', unlock: 3, max: 5, ready: true },
  'second-opinion': { name: 'Second Opinion', group: 'puzzle', desc: 'Restores one mistake allowance. Your original mistake stays recorded.', unlock: 5, max: 5, ready: true },
  shield: { name: 'Coverage', group: 'streak', desc: 'Covers one missed day to protect your streak. Used automatically.', unlock: 1, max: 2, ready: true },
}
export const PUZZLE_TOOLS = ['curbside', 'lab', 'second-opinion']
export const KIT_ORDER = ['curbside', 'lab', 'second-opinion', 'shield']

// Race power-ups. Inventory, earning and spending happen on the server
// (api/race, supabase/migrations/0006); these are the names and copy.
export const RACE_ITEMS = {
  mutation: { name: 'Mutation', desc: 'Scrambles the letters on your opponent’s answer tiles for two seconds, then restores them.', max: 3 },
  crispr: { name: 'CRISPR', desc: 'Arm it to block one incoming Mutation. Used only when it blocks an attack.', max: 3 },
}
// Mirrors the server settings (race_config in migration 0006), for display.
export const RACE_REWARDS = { mutationEveryWins: 5, crisprEveryRaces: 10, perOpponentPerDay: 3, perDay: 6 }

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

// ---- This Week ----
// Three fixed goals; finishing any two pays the weekly reward once, Monday
// to Monday in the player's time zone.
export const WEEKLY_GOALS = [
  { id: 'dailies', label: 'Complete 3 Dailies', target: 3 },
  { id: 'systems', label: 'Complete 2 different Systems boards', target: 2 },
  { id: 'timed', label: 'Finish 2 timed sessions (3 Minutes or Race)', target: 2 },
]
export const WEEKLY_GOALS_NEEDED = 2
// The weekly reward also includes one puzzle tool of the player's choice
// (any they have unlocked).
export const WEEKLY_TOOL_CHOICE = true
