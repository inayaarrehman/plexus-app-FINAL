// ---------------------------------------------------------------------
// Daily streak, computed from the Daily history (the synced source of truth).
// ---------------------------------------------------------------------
// The old counter in stats never broke on a missed day, only on a loss, so it
// could keep growing for someone who played once a month. This replaces it
// for everything the player sees and for streak rewards:
//   • A streak day is today's-date Daily, won, finished on that date.
//   • A loss on the day ends the streak (same as before).
//   • A missed day ends it, unless a Streak Shield covered that day.
//   • Today not played yet never breaks it.
// Computed from history, so it merges across devices with no extra state.

const DAY = 86400000

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(key, n) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function localKey(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// A history entry that counts as a streak day: finished on its own date and won.
// Entries without a completion time are trusted as on time (older records).
export function isStreakDay(entry, key) {
  if (!entry || !entry.completed || !entry.won) return false
  if (!entry.completedAt) return true
  return localKey(entry.completedAt) === key
}
// Finished on its own date but lost: ends a streak.
function isLossDay(entry, key) {
  if (!entry || !entry.completed || entry.won) return false
  return !entry.completedAt || localKey(entry.completedAt) === key
}

// `shielded`: set of date keys a Streak Shield has covered.
// `pendingShield`: true when a shield is available and would cover yesterday
// once today's Daily is finished (so the streak shows as still alive).
export function currentStreak(history, todayKey, { shielded = new Set(), pendingShield = false } = {}) {
  const h = history || {}
  let key = todayKey
  if (!isStreakDay(h[key], key)) key = addDays(todayKey, -1) // today not done yet: count from yesterday
  let count = 0
  let usedPending = false
  for (let guard = 0; guard < 4000; guard++) {
    const e = h[key]
    if (isStreakDay(e, key)) count += 1
    else if (isLossDay(e, key)) break
    else if (shielded.has(key)) {
      /* covered day: keeps the streak, adds nothing */
    } else if (pendingShield && !usedPending && key === addDays(todayKey, -1) && count === 0 && !isStreakDay(h[todayKey], todayKey)) {
      usedPending = true // yesterday missed, a shield will cover it when today is finished
    } else break
    key = addDays(key, -1)
  }
  return count
}

export function longestStreak(history, { shielded = new Set() } = {}) {
  const keys = Object.keys(history || {}).filter((k) => isStreakDay(history[k], k)).sort()
  if (keys.length === 0) return 0
  let best = 0
  let run = 0
  let prev = null
  for (const k of keys) {
    if (prev) {
      let gapOk = true
      let cursor = addDays(prev, 1)
      while (cursor < k) {
        if (!shielded.has(cursor)) {
          gapOk = false
          break
        }
        cursor = addDays(cursor, 1)
      }
      run = gapOk ? run + 1 : 1
    } else run = 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

// When today's Daily is finished: should a shield cover yesterday? True when
// yesterday was missed (no entry), the day before was a streak day (or itself
// covered), and today's finish is a streak day.
export function needsShield(history, todayKey, shielded = new Set()) {
  const h = history || {}
  const y = addDays(todayKey, -1)
  const yy = addDays(todayKey, -2)
  if (h[y]?.completed || shielded.has(y)) return null
  if (!(isStreakDay(h[yy], yy) || shielded.has(yy))) return null
  return y
}

export { DAY }
