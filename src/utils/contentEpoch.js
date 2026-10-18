// ---------------------------------------------------------------------
// Content epoch: clears saved puzzle progress after a library rebuild.
// ---------------------------------------------------------------------
// When the whole library is rebuilt (scripts/library/activate.mjs --rebuild),
// or the progression rules are reset (PROGRESS_EPOCH below),
// dates and board ids that were already played can now hold different
// puzzles, so results saved against them no longer describe anything real.
// The generated library carries an epoch label; the first time this device
// runs a build with a new label, puzzle progress is cleared once:
//   Daily history and stats (streaks), games in progress, Systems boards and
//   their attempts, XP and tools (the progression save, whose entries are
//   keyed by the same dates and board ids), 3 Minutes bests and recent
//   rounds, weak spots, near misses and concept mastery.
// Kept: saved connections, settings and preferences, report and submission
// ids, the install hint, and the account itself. Cloud saves from an older
// epoch are ignored on the next sync (src/lib/progressRepo.js), so the
// signed-in copy is replaced by the fresh one rather than merged back.
import NEW_LIBRARY from '../data/library/newLibrary.js'

// The progression rules changed (October 2026 progression pass): XP amounts,
// the level curve and Race rewards. Saved progress from before is cleared
// the same way, once. Change PROGRESS_EPOCH only for a deliberate reset.
// October 17 2026: bumped for launch, so every device starts clean alongside
// the prelaunch server reset.
export const PROGRESS_EPOCH = '2026-10-launch'
export const CONTENT_EPOCH = `${NEW_LIBRARY.epoch || 'launch'}|${PROGRESS_EPOCH}`
export const EPOCH_KEY = 'plexus.contentEpoch.v1'

export const RESET_KEYS = [
  'medconnections.stats.v1',
  'medconnections.dailyHistory.v1',
  'medconnections.systemProgress.v1',
  'medconnections.weakSpots.v1',
  'medconnections.nearMiss.v1',
  'medconnections.conceptMastery.v1',
  'medconnections.challenge.v1',
  'medconnections.recentCategories.v1',
  'medconnections.systemsBoards.v1',
  'plexus.progression.v1',
  'plexus.latestDaily.v1',
  'plexus.unlockSeen.v1',
  'plexus.timedRecent.v1',
  'plexus.home.dailySeen.v1',
  'plexus.archiveSelected.v1',
  'plexus.myplexus.seenXp.v1',
]
export const RESET_PREFIXES = ['medconnections.progress.']

const hasProgress = (store) => RESET_KEYS.some((k) => store.getItem(k) != null) || allKeys(store).some((k) => RESET_PREFIXES.some((p) => k.startsWith(p)))
function allKeys(store) {
  const out = []
  for (let i = 0; i < store.length; i++) out.push(store.key(i))
  return out.filter(Boolean)
}

// Returns { reset, from } and never throws (storage can be unavailable).
export function applyContentEpoch(store = typeof localStorage !== 'undefined' ? localStorage : null, epoch = CONTENT_EPOCH) {
  try {
    if (!store) return { reset: false, from: null }
    const from = store.getItem(EPOCH_KEY)
    if (from === epoch) return { reset: false, from }
    let reset = false
    if (hasProgress(store)) {
      for (const k of RESET_KEYS) store.removeItem(k)
      for (const k of allKeys(store)) if (RESET_PREFIXES.some((p) => k.startsWith(p))) store.removeItem(k)
      reset = true
    }
    try {
      sessionStorage.removeItem('plexus.raceMatch.v1')
    } catch {
      /* no session storage */
    }
    store.setItem(EPOCH_KEY, epoch)
    return { reset, from }
  } catch {
    return { reset: false, from: null }
  }
}

// A cloud snapshot from another epoch describes boards that no longer exist.
export const snapshotInEpoch = (snap, epoch = CONTENT_EPOCH) => !!snap && snap.epoch === epoch
