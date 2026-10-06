// ---------------------------------------------------------------------
// Plexus progression: every tunable number lives here.
// ---------------------------------------------------------------------
// XP values, the level curve, career stages, milestone names, Rounds goals
// and Your Kit rules. Components and the engine read from this file only, so
// the economy can be retuned without touching UI code.
//
// Career stages are Plexus ranks. They are never written as credentials
// (no "Dr.", MD, DO or degree language anywhere).

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
// maximum level, so Attending is not a dead end.
export function levelCost(level) {
  const n = level - 1
  return Math.round((150 + 60 * n + 6 * n * n) / 10) * 10
}

// Career stages by starting level. Medical Student is deliberately the
// longest stage (12 levels, four milestones). A later tier after Attending can
// be appended here without changing any saved data.
export const STAGES = [
  { key: 'premed', name: 'Premed', from: 1 },
  { key: 'student', name: 'Medical Student', from: 6 },
  { key: 'resident', name: 'Resident', from: 18 },
  { key: 'attending', name: 'Attending', from: 26 },
  // Future, not exposed yet: { key: 'attending-2', name: 'Attending II', from: 36 }, ...
]

export const MILESTONES = [
  { from: 1, name: 'First Shadow' },
  { from: 3, name: 'Interview Season' },
  { from: 5, name: 'White Coat' },
  { from: 6, name: 'Preclinical' },
  { from: 9, name: 'Boards' },
  { from: 12, name: 'Clerkships' },
  { from: 15, name: 'Match Season' },
  { from: 18, name: 'Intern' },
  { from: 20, name: 'PGY-2' },
  { from: 22, name: 'PGY-3' },
  { from: 24, name: 'Chief' },
  { from: 26, name: 'Attending' },
]

// ---- Your Kit ----
// `ready`: works in this version. The rest are earned and kept now, and switch
// on in a later update without any change to saved data.
export const KIT = {
  curbside: { name: 'Curbside', desc: 'Highlights two concepts that belong together.', stage: 'premed', ready: true },
  lab: { name: 'Lab', desc: 'Rules out one tile in your current selection.', stage: 'student', ready: false },
  imaging: { name: 'Imaging', desc: 'Shows what kind of connection one group is.', stage: 'student', ready: false },
  readout: { name: 'Readout', desc: 'Shows the difficulty of one unsolved group.', stage: 'student', ready: false },
  shield: { name: 'Streak Shield', desc: 'Covers one missed day so your streak continues. Used automatically.', stage: 'premed', ready: true, max: 2 },
  'second-opinion': { name: 'Second Opinion', desc: 'Takes back one mistake.', stage: 'resident', ready: false },
  'time-out': { name: 'Time Out', desc: 'Adds 30 seconds to a 3-Minute session.', stage: 'resident', ready: false },
}
export const KIT_ORDER = ['curbside', 'lab', 'imaging', 'readout', 'shield', 'second-opinion', 'time-out']

// Fixed level rewards, shown in advance on the Career page. No randomness.
const STUDENT_CYCLE = ['curbside', 'lab', 'readout', 'imaging']
const RESIDENT_CYCLE = ['lab', 'second-opinion', 'imaging', 'time-out', 'curbside', 'readout']
const ATTENDING_CYCLE = ['curbside', 'lab', 'imaging', 'readout', 'second-opinion', 'time-out']
export function levelRewards(level) {
  if (level < 2) return []
  if (level <= 5) return ['curbside']
  if (level === 6) return ['lab', 'imaging', 'curbside']
  if (level <= 17) return [STUDENT_CYCLE[(level - 7) % STUDENT_CYCLE.length]]
  if (level === 18) return ['second-opinion', 'time-out', 'curbside']
  if (level <= 25) return [RESIDENT_CYCLE[(level - 19) % RESIDENT_CYCLE.length]]
  if (level === 26) return [...ATTENDING_CYCLE]
  return [ATTENDING_CYCLE[(level - 27) % ATTENDING_CYCLE.length]]
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
