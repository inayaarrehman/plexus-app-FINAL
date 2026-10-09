// ---------------------------------------------------------------------
// Daily streak, computed from the Daily history (the synced source of truth).
// ---------------------------------------------------------------------
//   • A streak day is a date's Daily, won, finished on that date.
//   • A loss on the day ends the streak.
//   • A missed day ends it, unless a Coverage covered that day.
//   • Today not played yet never breaks it.
// Computed from history, so it merges across devices with no extra state.
//
// Dates come from utils/calendar.js. "Finished on that date" is judged in the
// time zone the player was in when they finished (stored as `completedDay`),
// so travel afterwards can never undo a streak day. Results saved before that
// was stored count when the finish time falls on the date somewhere on Earth.
// A single calendar day lost to travel does not break a streak: the date in
// between is forgiven when the player moved at least 3 hours east (so a
// daylight-saving change never counts) and the finishes either side were
// under 48 hours apart. Finishes store their UTC offset for this; older
// results without it get no allowance. See TIME_AND_TRAVEL.md.

import { addDays as addDayKeys, dayIndex, instantOnDateSomewhere, zoneOffset, DAY_MS } from '../utils/calendar.js'

const DAY = DAY_MS
const TRAVEL_GAP_MS = 48 * 3600000
const TRAVEL_EAST_MIN = 180 // minutes of eastward offset change that can skip a date

export function addDays(key, n) {
  return addDayKeys(key, n)
}
// Kept for callers that want a Date for a key (local midnight of that date).
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Was this entry finished on its own date?
export function finishedOnDate(entry, key) {
  if (!entry || !entry.completed) return false
  if (typeof entry.completedDay === 'string') return entry.completedDay === key
  if (!entry.completedAt) return true // oldest records: trusted as on time
  return instantOnDateSomewhere(entry.completedAt, key)
}
// A history entry that counts as a streak day: finished on its own date and won.
export function isStreakDay(entry, key) {
  return Boolean(entry && entry.won) && finishedOnDate(entry, key)
}
// Finished on its own date but lost: ends a streak.
function isLossDay(entry, key) {
  return Boolean(entry && entry.completed && !entry.won) && finishedOnDate(entry, key)
}
const finishTime = (entry) => {
  const t = entry?.completedAt ? Date.parse(entry.completedAt) : NaN
  return Number.isFinite(t) ? t : null
}
const offsetOf = (entry) => (Number.isFinite(entry?.completedOffset) ? entry.completedOffset : null)
// One missed date between two finishes that was lost to travel: the player
// moved at least 3 hours east and the finishes were under 48 hours apart.
function lostToTravel(fromTime, fromOffset, toTime, toOffset) {
  if (fromTime == null || toTime == null || fromOffset == null || toOffset == null) return false
  return toTime > fromTime && toTime - fromTime < TRAVEL_GAP_MS && toOffset - fromOffset >= TRAVEL_EAST_MIN
}
function travelGap(h, before, after) {
  return lostToTravel(finishTime(h[before]), offsetOf(h[before]), finishTime(h[after]), offsetOf(h[after]))
}

// `shielded`: set of date keys a Coverage has covered.
// `pendingShield`: true when a shield is available and would cover yesterday
// once today's Daily is finished (so the streak shows as still alive).
// `now`: the current instant, used for the travel allowance on today.
export function currentStreak(history, todayKey, { shielded = new Set(), pendingShield = false, now = Date.now() } = {}) {
  const h = history || {}
  let key = todayKey
  if (!isStreakDay(h[key], key)) {
    key = addDays(todayKey, -1) // today not done yet: count from yesterday
    // Yesterday missing only because travel skipped it: the last finish was
    // the day before and is under 48 hours old.
    const dby = addDays(todayKey, -2)
    const nowOffset = Math.round(zoneOffset(now) / 60000)
    if (!h[key]?.completed && !shielded.has(key) && isStreakDay(h[dby], dby) && lostToTravel(finishTime(h[dby]), offsetOf(h[dby]), now, nowOffset)) key = dby
  }
  let count = 0
  let usedPending = 0
  let lastCounted = null
  for (let guard = 0; guard < 4000; guard++) {
    const e = h[key]
    if (isStreakDay(e, key)) {
      count += 1
      lastCounted = key
    } else if (isLossDay(e, key)) break
    else if (shielded.has(key)) {
      /* covered day: keeps the streak, adds nothing */
    } else if (count === 0 && usedPending < Number(pendingShield || 0) && dayIndex(todayKey) - dayIndex(key) === usedPending + 1 && !isStreakDay(h[todayKey], todayKey) && !h[key]?.completed) {
      usedPending += 1 // a missed day right before today: held Coverage will cover it when today is finished
    } else if (lastCounted && !e?.completed && dayIndex(lastCounted) - dayIndex(key) === 1 && isStreakDay(h[addDays(key, -1)], addDays(key, -1)) && travelGap(h, addDays(key, -1), lastCounted)) {
      /* one date skipped by travel */
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
      const gap = dayIndex(k) - dayIndex(prev)
      while (cursor < k) {
        if (!shielded.has(cursor) && !(gap === 2 && !history[cursor]?.completed && travelGap(history, prev, k))) {
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
// covered), and today's finish is a streak day. Not when the gap is only a
// date lost to travel (no shield is spent on that).

// Coverage: the missed days, oldest first, that held charges should cover
// when `todayKey` is finished. Only an unbroken run of missed days directly
// before today, ending at a streak day (or a covered day), and only if there
// are enough charges for the whole run; otherwise the streak is gone anyway
// and nothing is spent.
export function coverGaps(history, todayKey, shielded = new Set(), available = 0) {
  const h = history || {}
  if (!(available > 0)) return []
  const gaps = []
  let key = addDays(todayKey, -1)
  for (let i = 0; i <= available; i++) {
    if (isStreakDay(h[key], key) || shielded.has(key)) break
    if (h[key]?.completed) return [] // a lost Daily ends the streak; not a missed day
    gaps.push(key)
    key = addDays(key, -1)
  }
  if (gaps.length === 0 || gaps.length > available) return []
  if (!(isStreakDay(h[key], key) || shielded.has(key))) return []
  if (gaps.length === 1 && isStreakDay(h[todayKey], todayKey) && travelGap(h, key, todayKey)) return [] // a date skipped by travel needs no cover
  return gaps.reverse()
}
// Older single-day form, kept for callers and tests.
export function needsShield(history, todayKey, shielded = new Set()) {
  return coverGaps(history, todayKey, shielded, 1)[0] || null
}

export { DAY }
