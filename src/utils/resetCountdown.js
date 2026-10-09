// "Next puzzle in 3h 24m": the time until the next Daily, derived from the
// same reset rule the app uses (the player's local midnight, utils/calendar.js).
// This file only formats; it never changes when the Daily resets.
import { currentTimeZone, nextMidnight, timeZoneLabel, dayKey, formatDayKey } from './calendar.js'

// Whole minutes are rounded UP so the countdown never reads "0m" while a few
// seconds remain, and reaches the next puzzle exactly at midnight.
export function formatCountdown(ms) {
  if (!(ms > 0)) return 'now'
  if (ms < 60000) return 'under a minute'
  const mins = Math.ceil(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// Everything the Home countdown needs at one instant. DST-safe: the reset
// instant comes from nextMidnight, which asks Intl for the zone's offset at
// that moment, so 23- and 25-hour days count down correctly.
export function nextPuzzleInfo(now = Date.now(), tz = currentTimeZone()) {
  const at = nextMidnight(now, tz)
  const ms = Math.max(0, at - now)
  let clock = '12:00 AM'
  try {
    clock = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(at))
  } catch {
    // keep the default
  }
  const dateLabel = formatDayKey(dayKey(at, tz), { weekday: 'short', month: 'short', day: 'numeric' }, 'en-US')
  return {
    at,
    ms,
    text: ms > 0 ? `Next puzzle in ${formatCountdown(ms)}` : 'Next puzzle is ready',
    detail: `New Daily at ${clock} ${timeZoneLabel(tz)} (${dateLabel}). Each player gets it at midnight in their own time zone.`,
  }
}
