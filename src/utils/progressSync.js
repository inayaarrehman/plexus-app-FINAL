// ---------------------------------------------------------------------
// Progress sync — merge local (localStorage) and cloud (Supabase) progress
// ---------------------------------------------------------------------
// Only the retention-critical, cleanly-mergeable data is synced:
//   • stats         — streaks + lifetime counts (medconnections.stats.v1)
//   • dailyHistory  — per-date Daily results (powers Archive + streak)
//   • challenge     — 3-Minute personal bests
//   • progression   — XP ledger, Your Kit, Career acknowledgements (union by id)
// Everything merges MONOTONICALLY so syncing can only ever protect progress,
// never lose it: streaks/bests take the max, the current streak follows the
// most-recently-completed day, and daily history is unioned per date keeping
// the better result. The merge functions are PURE (no storage, no network) so
// they are unit-tested directly; snapshotLocal/applySnapshot are the only
// localStorage glue.

import {
  loadStats,
  saveStats,
  getDailyHistory,
  setDailyHistory,
  getChallengeStats,
  replaceChallengeStats,
} from './storage.js'
import { mergeStates as mergeProgression } from '../progression/engine.js'
import { loadProgression, replaceProgression } from '../progression/store.js'

const SNAPSHOT_VERSION = 1

// ---- stats ----
export function mergeStats(a = {}, b = {}) {
  const s = (x) => x || {}
  a = s(a)
  b = s(b)
  const max = (k) => Math.max(a[k] || 0, b[k] || 0)
  // The current streak must follow the record whose last completed daily is
  // more recent — that's the one whose running streak is still "live".
  const aKey = a.lastCompletedDailyKey || ''
  const bKey = b.lastCompletedDailyKey || ''
  let current
  if (aKey === bKey) {
    current = {
      currentStreak: max('currentStreak'),
      currentPerfectStreak: max('currentPerfectStreak'),
      lastCompletedDailyKey: aKey || null,
    }
  } else if (aKey > bKey) {
    current = {
      currentStreak: a.currentStreak || 0,
      currentPerfectStreak: a.currentPerfectStreak || 0,
      lastCompletedDailyKey: aKey,
    }
  } else {
    current = {
      currentStreak: b.currentStreak || 0,
      currentPerfectStreak: b.currentPerfectStreak || 0,
      lastCompletedDailyKey: bKey,
    }
  }
  const dist = []
  for (let i = 0; i < 5; i++) {
    dist[i] = Math.max((a.mistakeDistribution || [])[i] || 0, (b.mistakeDistribution || [])[i] || 0)
  }
  return {
    gamesPlayed: max('gamesPlayed'),
    gamesWon: max('gamesWon'),
    maxStreak: max('maxStreak'),
    maxPerfectStreak: max('maxPerfectStreak'),
    ...current,
    mistakeDistribution: dist,
  }
}

// ---- daily history ----
// Pick the "better" of two entries for the same date: a completed entry beats
// an incomplete one; among completed, a win beats a loss, then fewer mistakes.
function betterDailyEntry(a, b) {
  if (!a) return b
  if (!b) return a
  if (!!a.completed !== !!b.completed) return a.completed ? a : b
  if (!!a.won !== !!b.won) return a.won ? a : b
  const am = a.mistakes ?? 99
  const bm = b.mistakes ?? 99
  if (am !== bm) return am < bm ? a : b
  return a // equal enough — keep the first
}

export function mergeDailyHistory(a = {}, b = {}) {
  const out = {}
  for (const key of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    out[key] = betterDailyEntry(a?.[key], b?.[key])
  }
  return out
}

// ---- challenge ----
export function mergeChallenge(a = {}, b = {}) {
  a = a || {}
  b = b || {}
  const max = (k) => Math.max(a[k] || 0, b[k] || 0)
  const seen = new Set()
  const history = [...(a.history || []), ...(b.history || [])]
    .filter((h) => {
      const id = h?.completedAt || JSON.stringify(h)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .sort((x, y) => String(y?.completedAt || '').localeCompare(String(x?.completedAt || '')))
    .slice(0, 20)
  return {
    personalBest: max('personalBest'),
    bestAccuracy: max('bestAccuracy'),
    mostRounds: max('mostRounds'),
    mostCorrect: max('mostCorrect'),
    history,
  }
}

// ---- whole snapshot ----
export function mergeSnapshots(a = {}, b = {}) {
  return {
    version: SNAPSHOT_VERSION,
    stats: mergeStats(a.stats, b.stats),
    dailyHistory: mergeDailyHistory(a.dailyHistory, b.dailyHistory),
    challenge: mergeChallenge(a.challenge, b.challenge),
    // Progression merges by event id, so the same award on two devices counts once.
    progression: mergeProgression(a.progression, b.progression),
  }
}

// ---- localStorage glue ----
export function snapshotLocal() {
  return {
    version: SNAPSHOT_VERSION,
    stats: loadStats(),
    dailyHistory: getDailyHistory(),
    challenge: getChallengeStats(),
    progression: loadProgression(),
  }
}

export function applySnapshot(snap) {
  if (!snap) return
  if (snap.stats) saveStats(snap.stats)
  if (snap.dailyHistory) setDailyHistory(snap.dailyHistory)
  if (snap.challenge) replaceChallengeStats(snap.challenge)
  if (snap.progression) replaceProgression(snap.progression)
}
