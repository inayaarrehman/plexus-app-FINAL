// ---------------------------------------------------------------------
// Plexus progression: every tunable number lives here.
// ---------------------------------------------------------------------
// XP values, the level curve, level rewards, weekly goals (shown as This
// Week) and Your Kit rules. Components and the engine read from this file
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
  rounds: 250,
}

// Practice (Systems, 3-Minute, Race) halves after this much in one local day,
// so steady play always beats grinding. Dailies are never tapered.
export const PRACTICE_TAPER_AFTER = 600
export const PRACTICE_TAPER_RATE = 0.5

export const STREAK_MILESTONES = [
  { days: 3, xp: 50 },
  { days: 7, xp: 100, grant: 'shield' },
  { days: 14, xp: 150 },
  { days: 30, xp: 300, grant: 'shield' },
  { days: 60, xp: 400 },
  { days: 100, xp: 500, grant: 'shield' },
  { days: 180, xp: 600 },
  { days: 365, xp: 1000 },
]

// XP needed to go from level L to L+1. Rises gently, never ends: there is no
// maximum level.
export function levelCost(level) {
  const n = level - 1
  return Math.round((150 + 60 * n + 6 * n * n) / 10) * 10
}

// ---- Your Kit ----
// `ready`: works in this version. The rest are earned and kept now, and switch
// on in a later update without any change to saved data.
// `unlock`: the level a tool opens at. Tools earned earlier (for example from
// This Week) are kept and show up once the level is reached.
export const KIT = {
  curbside: { name: 'Curbside', desc: 'Highlights two concepts that belong together.', unlock: 1, ready: true },
  lab: { name: 'Lab', desc: 'Rules out one tile in your current selection.', unlock: 5, ready: false },
  imaging: { name: 'Imaging', desc: 'Shows what kind of connection one group is.', unlock: 6, ready: false },
  readout: { name: 'Readout', desc: 'Shows the difficulty of one unsolved group.', unlock: 8, ready: false },
  shield: { name: 'Streak Shield', desc: 'Covers one missed day so your streak continues. Used automatically.', unlock: 1, ready: true, max: 2 },
  'second-opinion': { name: 'Second Opinion', desc: 'Takes back one mistake.', unlock: 12, ready: false },
  'time-out': { name: 'Time Out', desc: 'Adds 30 seconds to a 3-Minute session.', unlock: 14, ready: false },
}
export const KIT_ORDER = ['curbside', 'lab', 'imaging', 'readout', 'shield', 'second-opinion', 'time-out']

// Fixed level rewards, shown in advance on the Record page. No randomness.
// Grants are stored by id (level:L:i), so a level that was already reached
// keeps whatever it granted at the time. Levels 2 to 17 each grant one item,
// levels 6 and 18 grant three, so nothing is granted twice or added later.
// Each tool is first granted at the level it unlocks.
const EARLY = {
  2: ['curbside'], 3: ['curbside'], 4: ['curbside'], 5: ['lab'],
  6: ['lab', 'imaging', 'curbside'],
  7: ['curbside'], 8: ['readout'], 9: ['lab'], 10: ['imaging'], 11: ['curbside'],
  12: ['second-opinion'], 13: ['readout'], 14: ['time-out'], 15: ['lab'], 16: ['imaging'], 17: ['curbside'],
  18: ['second-opinion', 'time-out', 'curbside'],
}
const CYCLE_19 = ['lab', 'second-opinion', 'imaging', 'time-out', 'curbside', 'readout']
const CYCLE_27 = ['curbside', 'lab', 'imaging', 'readout', 'second-opinion', 'time-out']
export function levelRewards(level) {
  if (level < 2) return []
  if (EARLY[level]) return [...EARLY[level]]
  if (level <= 25) return [CYCLE_19[(level - 19) % CYCLE_19.length]]
  if (level === 26) return [...CYCLE_27]
  return [CYCLE_27[(level - 27) % CYCLE_27.length]]
}
export const PERFECT_REWARD_EVERY = 5 // every 5th perfect Daily: Curbside +1
export const ROUNDS_ITEM_ROTATION = ['curbside', 'lab', 'time-out', 'imaging'] // every other week

// ---- Rounds (weekly goals) ----
// Three goals a week, reset Monday. Every goal can be finished alone (no live
// opponent needed). `count` reads the week's ledger entries.
export const ROUNDS_POOL = [
  { id: 'dailies5', label: 'Finish 5 Dailies', target: 5, kinds: ['daily', 'archive'] },
  { id: 'systems3', label: 'Finish 3 Systems puzzles', target: 3, kinds: ['syspuzzle'] },
  { id: 'challenge1', label: 'Play a 3-Minute session', target: 1, kinds: ['challenge'] },
  { id: 'expert6', label: 'Solve 6 Expert connections', target: 6, kinds: ['conn', 'sysconn'], level: 4 },
  { id: 'archive1', label: 'Finish a past Daily from the Archive', target: 1, kinds: ['archive'] },
  { id: 'twosystems', label: 'Practice 2 different systems', target: 2, kinds: ['syspuzzle'], distinct: 'system' },
  { id: 'perfect1', label: 'Get a perfect Daily', target: 1, kinds: ['perfect'] },
  { id: 'challenge3', label: 'Play three 3-Minute sessions', target: 3, kinds: ['challenge'] },
]
// Rotation: each week takes three different goals; consecutive weeks differ.
export const ROUNDS_ROTATION = [
  ['dailies5', 'systems3', 'challenge1'],
  ['dailies5', 'expert6', 'archive1'],
  ['perfect1', 'twosystems', 'challenge3'],
  ['dailies5', 'twosystems', 'challenge1'],
  ['systems3', 'expert6', 'perfect1'],
  ['dailies5', 'archive1', 'challenge3'],
]
