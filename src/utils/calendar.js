// ---------------------------------------------------------------------
// Calendar: the one place Plexus turns time into days.
// ---------------------------------------------------------------------
// Two kinds of time, never mixed:
//   • Instants: absolute timestamps (ms since 1970 UTC), e.g. when a puzzle
//     was finished. Stored as numbers or ISO strings; never used as a date.
//   • Calendar dates: 'YYYY-MM-DD' keys in the player's own time zone, e.g.
//     which Daily it is. A Daily's identity is its date key: the puzzle for
//     2026-10-07 is `daily-2026-10-07` everywhere in the world, and each
//     player reaches it at their own local midnight.
//
// The time zone is the browser's IANA zone (Intl), read fresh on every call,
// so a player who changes time zones gets the new one the next time the app
// looks (App re-checks when the tab is shown again, on focus, every minute
// while visible, and at local midnight).
//
// Day arithmetic works on keys (via whole UTC days), never by adding 24 hours
// to an instant, so daylight-saving changes cannot shift a date. Converting a
// local midnight back to an instant asks Intl for the zone's offset at that
// moment, so a 23 or 25 hour day ends at the right instant.
//
// Travel policy (also in TIME_AND_TRAVEL.md):
//   • Today's Daily is always the player's current local date.
//   • A finished Daily stays finished, and its rewards are keyed by its date
//     (`daily:2026-10-07`), so crossing time zones in either direction can
//     never pay twice or undo anything.
//   • A Daily counts toward the streak when it was finished on its own date
//     in the time zone the player was in at the time (stored with the
//     result). Older results without that record count when the finish time
//     falls on that date somewhere on Earth (UTC-12 to UTC+14).
//   • A calendar day lost to travel does not break a streak: a one-day gap
//     between two streak days is forgiven when the two finishes were less
//     than 48 hours apart (or, for today, when the last finish was less than
//     48 hours ago).
//   • Weekly goals count each event on the local date it was earned (stored
//     with it), and This Week runs Monday 00:00 to Monday 00:00 local time.
//     A weekly reward is paid once per week however the clocks move.

const DAY_MS = 86400000

// For tests: pin a time zone instead of the browser's.
let pinnedZone = null
export function pinTimeZoneForTesting(tz) {
  pinnedZone = tz || null
}

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
export function currentTimeZone() {
  return pinnedZone || detectTimeZone()
}

const formatters = new Map()
function partsFormatter(tz) {
  let f = formatters.get(tz)
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
    } catch {
      f = partsFormatter('UTC')
    }
    formatters.set(tz, f)
  }
  return f
}

// Wall-clock fields of an instant in a time zone.
export function zonedParts(ts, tz = currentTimeZone()) {
  const out = {}
  for (const p of partsFormatter(tz).formatToParts(new Date(ts))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value)
  }
  return { y: out.year, m: out.month, d: out.day, h: out.hour === 24 ? 0 : out.hour, mi: out.minute, s: out.second }
}

const pad = (n) => String(n).padStart(2, '0')
const keyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
export const isDayKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

// The calendar date of an instant in the player's time zone.
export function dayKey(ts = Date.now(), tz = currentTimeZone()) {
  const t = ts instanceof Date ? ts.getTime() : Number(ts)
  const p = zonedParts(t, tz)
  return keyOf(p.y, p.m, p.d)
}
export function todayKey(now = Date.now(), tz = currentTimeZone()) {
  return dayKey(now, tz)
}

export function parseKey(key) {
  const [y, m, d] = String(key).split('-').map(Number)
  return { y, m, d }
}
// Whole days since 1970-01-01 for a calendar date (no time zone involved).
export function dayIndex(key) {
  const { y, m, d } = parseKey(key)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}
export function keyFromIndex(i) {
  const dt = new Date(i * DAY_MS)
  return keyOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}
export function addDays(key, n) {
  return keyFromIndex(dayIndex(key) + n)
}
export function daysBetween(a, b) {
  return dayIndex(b) - dayIndex(a)
}
// 0 = Monday ... 6 = Sunday. 1970-01-01 was a Thursday.
export function weekdayOf(key) {
  return (((dayIndex(key) + 3) % 7) + 7) % 7
}

// Offset of a time zone from UTC at an instant, in ms (positive east).
export function zoneOffset(ts, tz = currentTimeZone()) {
  const p = zonedParts(ts, tz)
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s)
  return asUtc - Math.floor(ts / 1000) * 1000
}
// The instant a calendar date starts in a time zone. Handles DST: the offset
// is checked at the result, and a zone whose midnight is skipped by a clock
// change starts the day at the first instant that exists.
export function startOfDay(key, tz = currentTimeZone()) {
  const { y, m, d } = parseKey(key)
  const guess = Date.UTC(y, m - 1, d)
  let t = guess - zoneOffset(guess, tz)
  const off2 = zoneOffset(t, tz)
  if (guess - off2 !== t) t = guess - off2
  // If that still is not on `key` (midnight skipped), step forward to it.
  for (let i = 0; i < 4 && dayKey(t, tz) < key; i++) t += 3600000
  return t
}
export function nextMidnight(now = Date.now(), tz = currentTimeZone()) {
  return startOfDay(addDays(dayKey(now, tz), 1), tz)
}
export function msUntilNextMidnight(now = Date.now(), tz = currentTimeZone()) {
  return Math.max(0, nextMidnight(now, tz) - now)
}

// Monday-based week holding a date. `key` is the ISO week ('2026-W41'),
// `index` a running week number (stable, used to rotate weekly goals), and
// `start`/`end` the local Monday-midnight instants around it.
export function weekOfKey(key, tz = currentTimeZone()) {
  const monday = addDays(key, -weekdayOf(key))
  const thursday = addDays(monday, 3)
  const year = parseKey(thursday).y
  const week = Math.floor(daysBetween(`${year}-01-01`, thursday) / 7) + 1
  const nextMonday = addDays(monday, 7)
  const start = startOfDay(monday, tz)
  // Same running index as before this module existed (from the local Monday
  // midnight instant), so nobody's weekly goals change on upgrade.
  const index = Math.round(start / (7 * DAY_MS))
  return {
    key: `${year}-W${pad(week)}`,
    index,
    startKey: monday,
    endKey: nextMonday, // exclusive
    start,
    end: startOfDay(nextMonday, tz),
  }
}

// A readable name for a time zone, for display only: "Pacific Time" from
// "America/Los_Angeles". The IANA id is still what every date and reset uses.
// Generic names ("Pacific Time", not "Pacific Daylight Time") stay right on
// both sides of a daylight-saving change. Common zones are named here so they
// read the same on every browser; anything else uses the browser's generic
// name, then its name for the zone at `at`, then the city, then the offset.
const ZONE_NAMES = {
  'America/Los_Angeles': 'Pacific Time',
  'America/Vancouver': 'Pacific Time',
  'America/Tijuana': 'Pacific Time',
  'America/New_York': 'Eastern Time',
  'America/Detroit': 'Eastern Time',
  'America/Toronto': 'Eastern Time',
  'America/Indiana/Indianapolis': 'Eastern Time',
  'America/Kentucky/Louisville': 'Eastern Time',
  'America/Chicago': 'Central Time',
  'America/Winnipeg': 'Central Time',
  'America/Denver': 'Mountain Time',
  'America/Boise': 'Mountain Time',
  'America/Edmonton': 'Mountain Time',
  'America/Phoenix': 'Mountain Standard Time',
  'America/Anchorage': 'Alaska Time',
  'Pacific/Honolulu': 'Hawaii Time',
  'America/Halifax': 'Atlantic Time',
  'America/Puerto_Rico': 'Atlantic Time',
  'America/St_Johns': 'Newfoundland Time',
  'Europe/London': 'UK Time',
}
const isUtcZone = (tz) => !tz || /^(UTC|Etc\/(UTC|GMT|Universal|Zulu)|GMT|Universal|Zulu)$/i.test(tz)
function intlZoneName(tz, style, at) {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: style }).formatToParts(new Date(at)).find((p) => p.type === 'timeZoneName')
    const v = part?.value || ''
    // "GMT-5" style answers are offsets, not names; let the caller fall back.
    return v && !/^(GMT|UTC)([+-]|$)/.test(v) ? v : ''
  } catch {
    return ''
  }
}
function offsetLabel(tz, at) {
  const mins = Math.round(zoneOffset(at, tz) / 60000)
  if (!mins) return 'UTC'
  const a = Math.abs(mins)
  return `UTC${mins > 0 ? '+' : '-'}${Math.floor(a / 60)}${a % 60 ? `:${pad(a % 60)}` : ''}`
}
export function timeZoneLabel(tz = currentTimeZone(), at = Date.now()) {
  if (isUtcZone(tz)) return 'UTC'
  if (ZONE_NAMES[tz]) return ZONE_NAMES[tz]
  const generic = intlZoneName(tz, 'longGeneric', at) || intlZoneName(tz, 'long', at)
  if (generic) return generic
  if (/^Etc\//.test(tz)) {
    try {
      return offsetLabel(tz, at)
    } catch {
      return tz
    }
  }
  return `${tz.split('/').pop().replace(/_/g, ' ')} time`
}

// A calendar date for display ("Wednesday, October 7"), never shifted by the
// device's zone: the key is formatted at noon UTC in UTC.
export function formatDayKey(key, opts = { weekday: 'long', month: 'long', day: 'numeric' }, locale) {
  const { y, m, d } = parseKey(key)
  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)))
  } catch {
    return key
  }
}

// Did an instant fall on this calendar date in some time zone on Earth
// (UTC-12 to UTC+14)? Used for results saved before the finishing date was
// recorded, so travel since then cannot turn an on-time finish into a late one.
export function instantOnDateSomewhere(ts, key) {
  const t = typeof ts === 'string' ? Date.parse(ts) : Number(ts)
  if (!Number.isFinite(t)) return false
  const start = dayIndex(key) * DAY_MS - 14 * 3600000
  const end = (dayIndex(key) + 1) * DAY_MS + 12 * 3600000
  return t >= start && t < end
}

export { DAY_MS }
