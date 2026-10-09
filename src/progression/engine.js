// ---------------------------------------------------------------------
// Progression engine: pure functions, no storage, no React.
// ---------------------------------------------------------------------
// State shape (saved as plexus.progression.v1 and in the cloud snapshot):
//   {
//     version: 1,
//     ledger: { [eventId]: { xp, base, kind, at, m? } },   // every XP award
//     kit:    { grants: { [id]: { item, qty, source, at, pending? } },
//               uses:   { [id]: { item, at, m? } },
//               claims: { [grantId]: at } },   // pending grants taken in
//     v2:     { at, levelFrom, coverageFrom, converted } // Your Tools economy start
//     seen:   { level, stages? },                           // UI acknowledgements
//             (`stages` is a legacy field from the removed rank system. It is
//              kept and merged untouched so older saves and devices stay
//              compatible, but nothing reads it.)
//     migrated: <timestamp or null>,                         // one-time backfill
//     profile: { displayName? },
//   }
// Every award and grant is keyed by a stable id (e.g. "daily:2026-10-05",
// "system:Endocrine", "level:12"), so refreshes, replays and a second device
// can never pay twice. Level, totals and weekly goal progress are derived
// from the ledger, never stored, so they cannot drift.

import { dayKey, weekOfKey } from '../utils/calendar.js'
import {
  XP,
  PRACTICE_TAPER_AFTER,
  PRACTICE_TAPER_RATE,
  levelCost,
  KIT,
  WEEKLY_GOALS,
  WEEKLY_GOALS_NEEDED,
} from './config.js'

export const PRACTICE_KINDS = new Set(['syspuzzle', 'sysconn', 'challenge', 'race'])

export function emptyState() {
  return { version: 1, ledger: {}, kit: { grants: {}, uses: {}, claims: {} }, seen: { level: 1, stages: {} }, migrated: null, profile: {}, v2: null }
}

export function normalize(state) {
  const s = state && typeof state === 'object' ? state : {}
  const e = emptyState()
  return {
    version: 1,
    ledger: { ...(s.ledger || {}) },
    kit: { grants: { ...(s.kit?.grants || {}) }, uses: { ...(s.kit?.uses || {}) }, claims: { ...(s.kit?.claims || {}) } },
    seen: { level: s.seen?.level || 1, stages: { ...(s.seen?.stages || {}) } },
    migrated: s.migrated || e.migrated,
    profile: { ...(s.profile || {}) },
    v2: s.v2 && typeof s.v2 === 'object' ? { ...s.v2, converted: { ...(s.v2.converted || {}) } } : null,
  }
}

// ---- dates ----
// All day and week logic comes from utils/calendar.js (the player's time zone,
// DST-safe). Every ledger entry records the local date it was earned on (`d`),
// so later travel never moves it to another day or week.
export function localDayKey(ts) {
  return dayKey(ts)
}
// The local date an entry belongs to: the date stored with it, or (for
// entries saved before dates were stored) its instant in the current zone.
export function entryDay(e) {
  return e && typeof e.d === 'string' ? e.d : dayKey(e?.at ?? 0)
}
// Monday-based local week: { key: 'YYYY-Www', index, startKey, endKey, start, end }.
export function weekOf(ts) {
  return weekOfKey(dayKey(ts))
}
export function inWeek(e, wk) {
  const d = entryDay(e)
  return d >= wk.startKey && d < wk.endKey
}

// ---- XP ----
export function totalXp(state) {
  let t = 0
  for (const e of Object.values(state.ledger)) t += e.xp || 0
  return t
}

function practiceEarnedOn(state, day) {
  let t = 0
  for (const e of Object.values(state.ledger)) {
    if (PRACTICE_KINDS.has(e.kind) && entryDay(e) === day) t += e.xp || 0
  }
  return t
}

// Adds one award if its id is new. Practice XP past the daily allowance is
// paid at the taper rate. Returns the XP actually added (0 for a repeat).
export function award(state, { id, xp, kind, at = Date.now(), m }) {
  if (!id || state.ledger[id] || !(xp > 0)) return 0
  let paid = xp
  if (PRACTICE_KINDS.has(kind)) {
    const before = practiceEarnedOn(state, dayKey(at))
    const full = Math.max(0, Math.min(xp, PRACTICE_TAPER_AFTER - before))
    paid = full + Math.floor((xp - full) * PRACTICE_TAPER_RATE)
  }
  state.ledger[id] = { xp: paid, base: xp, kind, at, d: dayKey(at), ...(m ? { m } : {}) }
  return paid
}

// ---- levels ----
export function levelInfo(xp) {
  let level = 1
  let start = 0
  let cost = levelCost(1)
  while (xp >= start + cost) {
    start += cost
    level += 1
    cost = levelCost(level)
  }
  return {
    level,
    xp,
    levelStart: start,
    levelEnd: start + cost,
    intoLevel: xp - start,
    cost,
    toNext: start + cost - xp,
  }
}
// A Kit tool is open once the player reaches its unlock level.
export function itemOpen(item, level) {
  return level >= (KIT[item]?.unlock || 1)
}

// ---- Your Tools ----
// A grant past an item's cap is stored as `pending` instead of being lost. A
// pending grant counts once it is claimed (kit.claims), which is only allowed
// while the player is under the cap. Everything is keyed by id, so a grant,
// claim or use can never happen twice, on one device or after a sync.
export function grant(state, { id, item, qty = 1, source, at = Date.now() }) {
  if (!id || state.kit.grants[id] || !KIT[item]) return false
  const cap = KIT[item].max
  const pending = !!(cap && kitCounts(state)[item] + qty > cap)
  state.kit.grants[id] = { item, qty, source, at, ...(pending ? { pending: true } : {}) }
  return pending ? 'pending' : 'granted'
}
const grantCounts = (g, claims, id) => !g.pending || !!claims[id]
// Held balance of any item id, including ones no longer in KIT (used to
// convert removed tools).
export function heldOf(state, item) {
  let n = 0
  const claims = state.kit.claims || {}
  for (const [id, g] of Object.entries(state.kit.grants)) if (g.item === item && grantCounts(g, claims, id)) n += g.qty || 1
  for (const u of Object.values(state.kit.uses)) if (u.item === item) n -= 1
  return Math.max(0, n)
}
export function kitCounts(state) {
  const c = {}
  for (const k of Object.keys(KIT)) c[k] = heldOf(state, k)
  return c
}
// Pending claims per item, oldest first.
export function pendingClaims(state) {
  const out = {}
  const claims = state.kit.claims || {}
  for (const [id, g] of Object.entries(state.kit.grants)) {
    if (!g.pending || claims[id] || !KIT[g.item]) continue
    ;(out[g.item] ||= []).push({ id, ...g })
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => (a.at || 0) - (b.at || 0) || a.id.localeCompare(b.id))
  return out
}
export function claimPending(state, item, at = Date.now()) {
  const list = pendingClaims(state)[item] || []
  const cap = KIT[item]?.max
  if (!list.length) return false
  if (cap && kitCounts(state)[item] + (list[0].qty || 1) > cap) return false
  state.kit.claims[list[0].id] = at
  return true
}
export function useItem(state, { id, item, at = Date.now(), m }) {
  if (!id || state.kit.uses[id]) return false
  if ((kitCounts(state)[item] || 0) < 1) return false
  state.kit.uses[id] = { item, at, ...(m ? { m } : {}) }
  return true
}

// A zero-XP ledger marker (counts toward This Week, pays nothing).
export function mark(state, { id, kind, at = Date.now(), m }) {
  if (!id || state.ledger[id]) return false
  state.ledger[id] = { xp: 0, base: 0, kind, at, d: dayKey(at), ...(m ? { m } : {}) }
  return true
}

// ---- This Week ----
// Complete any two of three fixed goals:
//   dailies  scheduled Dailies completed (each date once; assisted counts)
//   systems  different Systems boards completed this week (replays count,
//            once per board per week)
//   timed    3-Minute sessions or Races finished (abandoned ones are never
//            recorded)
export function roundsProgress(state, now = Date.now()) {
  const wk = weekOf(now)
  const entries = Object.values(state.ledger).filter((e) => inWeek(e, wk) && !String(e.kind).startsWith('bf'))
  const counters = {
    dailies: entries.filter((e) => e.kind === 'daily').length,
    systems: new Set(entries.filter((e) => e.kind === 'sysweek').map((e) => e.m?.board)).size,
    timed: entries.filter((e) => e.kind === 'challenge' || e.kind === 'racedone').length,
  }
  const goals = WEEKLY_GOALS.map((g) => {
    const count = Math.min(counters[g.id] || 0, g.target)
    return { ...g, count, done: count >= g.target }
  })
  const done = goals.filter((g) => g.done).length
  return { week: wk, goals, done, need: WEEKLY_GOALS_NEEDED, complete: done >= WEEKLY_GOALS_NEEDED, paid: weekRewardPaid(state, wk) }
}
// Has this week's reward been paid? By its id, or by any weekly reward earned
// inside this week's dates (ids from before the week label was corrected, or
// from another time zone), so it is never paid twice.
export function weekRewardPaid(state, wk) {
  if (state.ledger[`rounds:${wk.key}`]) return true
  return Object.values(state.ledger).some((e) => e.kind === 'rounds' && inWeek(e, wk))
}
// Weekly rewards paid under Your Tools whose chosen tool has not been picked.
export function weeklyChoicesDue(state) {
  const from = state.v2?.at || Infinity
  return Object.entries(state.ledger)
    .filter(([id, e]) => e.kind === 'rounds' && (e.at || 0) >= from && id.startsWith('rounds:') && !state.kit.grants[`${id}:item`])
    .map(([id]) => id.slice('rounds:'.length))
    .sort()
}

// ---- merge (two devices, or device + cloud) ----
export function mergeStates(a, b) {
  const A = normalize(a)
  const B = normalize(b)
  const pickMigrated = A.migrated && B.migrated ? Math.min(A.migrated, B.migrated) : A.migrated || B.migrated || null
  return {
    version: 1,
    ledger: { ...B.ledger, ...A.ledger },
    kit: { grants: { ...B.kit.grants, ...A.kit.grants }, uses: { ...B.kit.uses, ...A.kit.uses }, claims: { ...B.kit.claims, ...A.kit.claims } },
    seen: { level: Math.max(A.seen.level, B.seen.level), stages: { ...B.seen.stages, ...A.seen.stages } },
    migrated: pickMigrated,
    profile: { ...B.profile, ...A.profile },
    v2: mergeV2(A.v2, B.v2),
  }
}
// Your Tools start marker: the earliest start (so Coverage counting and
// weekly choices begin at the first update on any device), and the highest
// level already paid under the old schedule (so no level is paid twice).
function mergeV2(a, b) {
  if (!a || !b) return a || b || null
  const conv = { ...b.converted }
  for (const [k, v] of Object.entries(a.converted || {})) conv[k] = Math.max(conv[k] || 0, v || 0)
  return {
    at: Math.min(a.at, b.at),
    coverageFrom: Math.min(a.coverageFrom ?? a.at, b.coverageFrom ?? b.at),
    levelFrom: Math.max(a.levelFrom || 1, b.levelFrom || 1),
    converted: conv,
  }
}

export { XP }
