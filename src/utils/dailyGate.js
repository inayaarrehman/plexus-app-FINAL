// ---------------------------------------------------------------------
// Daily gate: today's Plexus unlocks the rest of the game.
// ---------------------------------------------------------------------
// Builds on the existing Daily architecture rather than a parallel system:
//   • The CURRENT Daily is the one getDailyPuzzleForDate() serves, identified
//     by its date key and puzzle id (e.g. `daily-2026-10-05`).
//   • Completion is the existing per-date Daily history entry that
//     App.handleFinish writes once (`completed: true`, with the puzzleId).
//     Signed-in players get that history merged from the cloud by the
//     existing progress sync, so finishing on one device unlocks the others.
// Finishing the Daily counts whether it was solved or ran out of mistakes:
// a finished Daily cannot be replayed for credit, so a loss must not lock the
// rest of the game for the whole day.
//
// Clock guard: the Daily itself follows the player's local date
// (utils/calendar.js), so the gate also remembers the latest Daily this device
// has seen. Turning the clock back to a day that was already completed does
// not unlock anything while that newer Daily is still unfinished. A jump of
// more than a day backwards is treated as a clock correction, so a phone
// that was briefly set far in the future cannot lock itself out for weeks.

import { dateKey, dayNumber } from './game.js'
import { getDailyHistory } from './storage.js'
import { getDailyPuzzleForDate } from './dailyPuzzle.js'

// Views (App `view` values) and game modes that need today's Daily first.
export const GATED_VIEWS = ['systems', 'challenge', 'race', 'archive']
export const GATED_GAME_MODES = ['system', 'archive']

export const LOCK_COPY = "Complete today's Plexus to unlock."

const LATEST_KEY = 'plexus.latestDaily.v1'
const MAX_TRUSTED_ROLLBACK_DAYS = 1

function readLatest() {
  try {
    const raw = localStorage.getItem(LATEST_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLatest(entry) {
  try {
    localStorage.setItem(LATEST_KEY, JSON.stringify(entry))
  } catch {
    // storage unavailable: the gate still works off the current Daily
  }
}

export function currentDaily(now = Date.now()) {
  const key = dateKey(now)
  const puzzle = getDailyPuzzleForDate(now)
  return { key, day: dayNumber(now), puzzleId: puzzle ? puzzle.id : `daily-${key}` }
}

// Has the Daily for `key` been finished? When both sides carry a puzzle id
// they must match, so a history entry for a different puzzle never counts.
export function isDailyFinished(history, key, puzzleId) {
  const entry = history ? history[key] : null
  if (!entry || !entry.completed) return false
  if (entry.puzzleId && puzzleId && entry.puzzleId !== puzzleId) return false
  return true
}

// Pure decision, used by the app and the self-test.
export function evaluateGate({ history, current, latest }) {
  const doneCurrent = isDailyFinished(history, current.key, current.puzzleId)
  let required = current
  if (latest && latest.day > current.day && latest.day - current.day <= MAX_TRUSTED_ROLLBACK_DAYS) {
    required = latest
  }
  // Today's Daily finished, or the newer Daily this device already reached
  // (one date ahead at most) finished. The second case is travel west: the
  // player finished tomorrow's date in another time zone and is now back on
  // today's date. Nothing is unlocked by turning the clock back to a finished
  // date while the newer Daily is unfinished.
  const unlocked = required === current ? doneCurrent : isDailyFinished(history, required.key, required.puzzleId)
  return { unlocked, requiredKey: required.key }
}

// Reads storage, advances the latest-seen marker, and returns the decision.
export function getDailyGate(now = Date.now()) {
  const current = currentDaily(now)
  let latest = readLatest()
  if (!latest || current.day > latest.day || latest.day - current.day > MAX_TRUSTED_ROLLBACK_DAYS) {
    latest = { key: current.key, day: current.day, puzzleId: current.puzzleId }
    writeLatest(latest)
  }
  return { ...evaluateGate({ history: getDailyHistory(), current, latest }), currentKey: current.key }
}

export function isGatedView(view, gameMode) {
  if (GATED_VIEWS.includes(view)) return true
  return view === 'game' && GATED_GAME_MODES.includes(gameMode)
}

// One-time "the locks just opened" moment on Home, remembered per Daily so it
// plays once and never again that day.
const UNLOCK_SEEN_KEY = 'plexus.unlockSeen.v1'
export function hasSeenUnlock(key) {
  try {
    return localStorage.getItem(UNLOCK_SEEN_KEY) === key
  } catch {
    return true
  }
}
export function markUnlockSeen(key) {
  try {
    localStorage.setItem(UNLOCK_SEEN_KEY, key)
  } catch {
    // ignore
  }
}
