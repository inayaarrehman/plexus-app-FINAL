// ---------------------------------------------------------------------
// Progression engine: pure functions, no storage, no React.
// ---------------------------------------------------------------------
// State shape (saved as plexus.progression.v1 and in the cloud snapshot):
//   {
//     version: 1,
//     ledger: { [eventId]: { xp, base, kind, at, m? } },   // every XP award
//     kit:    { grants: { [id]: { item, qty, source, at } },
//               uses:   { [id]: { item, at, m? } } },
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

import {
  XP,
  PRACTICE_TAPER_AFTER,
  PRACTICE_TAPER_RATE,
  levelCost,
  KIT,
  ROUNDS_POOL,
  ROUNDS_ROTATION,
} from './config.js'

export const PRACTICE_KINDS = new Set(['syspuzzle', 'sysconn', 'challenge', 'race'])

export function emptyState() {
  return { version: 1, ledger: {}, kit: { grants: {}, uses: {} }, seen: { level: 1, stages: {} }, migrated: null, profile: {} }
}

export function normalize(state) {
  const s = state && typeof state === 'object' ? state : {}
  const e = emptyState()
  return {
    version: 1,
    ledger: { ...(s.ledger || {}) },
    kit: { grants: { ...(s.kit?.grants || {}) }, uses: { ...(s.kit?.uses || {}) } },
    seen: { level: s.seen?.level || 1, stages: { ...(s.seen?.stages || {}) } },
    migrated: s.migrated || e.migrated,
    profile: { ...(s.profile || {}) },
  }
}

// ---- dates (local time) ----
export function localDayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// Monday-based local week: returns { key: 'YYYY-Www', index, start, end }.
export function weekOf(ts) {
  const d = new Date(ts)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  // ISO-style week number from the Thursday of this week.
  const thu = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 3)
  const jan1 = new Date(thu.getFullYear(), 0, 1)
  const week = Math.floor((thu - jan1) / 86400000 / 7) + 1
  const index = Math.round(start.getTime() / (7 * 86400000)) // stable running index
  return { key: `${thu.getFullYear()}-W${String(week).padStart(2, '0')}`, index, start: start.getTime(), end: end.getTime() }
}

// ---- XP ----
export function totalXp(state) {
  let t = 0
  for (const e of Object.values(state.ledger)) t += e.xp || 0
  return t
}

function practiceEarnedOn(state, dayKey) {
  let t = 0
  for (const e of Object.values(state.ledger)) {
    if (PRACTICE_KINDS.has(e.kind) && localDayKey(e.at) === dayKey) t += e.xp || 0
  }
  return t
}

// Adds one award if its id is new. Practice XP past the daily allowance is
// paid at the taper rate. Returns the XP actually added (0 for a repeat).
export function award(state, { id, xp, kind, at = Date.now(), m }) {
  if (!id || state.ledger[id] || !(xp > 0)) return 0
  let paid = xp
  if (PRACTICE_KINDS.has(kind)) {
    const before = practiceEarnedOn(state, localDayKey(at))
    const full = Math.max(0, Math.min(xp, PRACTICE_TAPER_AFTER - before))
    paid = full + Math.floor((xp - full) * PRACTICE_TAPER_RATE)
  }
  state.ledger[id] = { xp: paid, base: xp, kind, at, ...(m ? { m } : {}) }
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

// ---- Your Kit ----
export function grant(state, { id, item, qty = 1, source, at = Date.now() }) {
  if (!id || state.kit.grants[id] || !KIT[item]) return false
  const cap = KIT[item].max
  if (cap && kitCounts(state)[item] >= cap) return false // held at the limit: nothing is lost later, the grant just doesn't happen
  state.kit.grants[id] = { item, qty, source, at }
  return true
}
export function kitCounts(state) {
  const c = {}
  for (const k of Object.keys(KIT)) c[k] = 0
  for (const g of Object.values(state.kit.grants)) if (c[g.item] !== undefined) c[g.item] += g.qty || 1
  for (const u of Object.values(state.kit.uses)) if (c[u.item] !== undefined) c[u.item] -= 1
  for (const k of Object.keys(c)) c[k] = Math.max(0, c[k])
  return c
}
export function useItem(state, { id, item, at = Date.now(), m }) {
  if (!id || state.kit.uses[id]) return false
  if ((kitCounts(state)[item] || 0) < 1) return false
  state.kit.uses[id] = { item, at, ...(m ? { m } : {}) }
  return true
}

// ---- Rounds ----
export function roundsGoals(weekIndex) {
  const ids = ROUNDS_ROTATION[((weekIndex % ROUNDS_ROTATION.length) + ROUNDS_ROTATION.length) % ROUNDS_ROTATION.length]
  return ids.map((id) => ROUNDS_POOL.find((g) => g.id === id))
}
export function roundsProgress(state, now = Date.now()) {
  const wk = weekOf(now)
  const entries = Object.values(state.ledger).filter((e) => e.at >= wk.start && e.at < wk.end && !String(e.kind).startsWith('bf'))
  const goals = roundsGoals(wk.index).map((g) => {
    let rel = entries.filter((e) => g.kinds.includes(e.kind) && (!g.level || e.m?.level === g.level))
    let count = g.distinct ? new Set(rel.map((e) => e.m?.[g.distinct]).filter(Boolean)).size : rel.length
    count = Math.min(count, g.target)
    return { ...g, count, done: count >= g.target }
  })
  return { week: wk, goals, done: goals.filter((g) => g.done).length, complete: goals.every((g) => g.done) }
}

// ---- merge (two devices, or device + cloud) ----
export function mergeStates(a, b) {
  const A = normalize(a)
  const B = normalize(b)
  const pickMigrated = A.migrated && B.migrated ? Math.min(A.migrated, B.migrated) : A.migrated || B.migrated || null
  return {
    version: 1,
    ledger: { ...B.ledger, ...A.ledger },
    kit: { grants: { ...B.kit.grants, ...A.kit.grants }, uses: { ...B.kit.uses, ...A.kit.uses } },
    seen: { level: Math.max(A.seen.level, B.seen.level), stages: { ...B.seen.stages, ...A.seen.stages } },
    migrated: pickMigrated,
    profile: { ...B.profile, ...A.profile },
  }
}

export { XP }
