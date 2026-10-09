// ---------------------------------------------------------------------
// Unlock for Verified Connections, the review extra that looks across puzzles.
// ---------------------------------------------------------------------
// Verified Connections show how one idea links to OTHER connections in the
// library, some of which may be in puzzles the player has not reached yet,
// so they open with play: after 10 completed Dailies and 5 solved Systems
// boards. Counts come from the same records the rest of the app uses (Daily
// history and solved Systems boards), so they sync with progress and never
// go back. Even once unlocked, the list names only connections the player
// has already met in a finished Daily or a solved Systems board; the rest
// are counted, never named, until they are played.
// (Follow the Thread, which also unlocked here, has been removed. The
// Verified Connections view is kept without an entry point.)
import { getDailyHistory, getSystemsBoards } from './storage.js'
import { getDailyPuzzleForDate } from './dailyPuzzle.js'
import { LIBRARY_SUBJECTS, systemsBoardsFor, systemsBoardPuzzle } from './newLibrary.js'
import { dayKey } from './calendar.js'

export const UNLOCKS = {
  verified: { dailies: 10, systems: 5 },
}

export function progressCounts(history = getDailyHistory(), boards = getSystemsBoards()) {
  const dailies = Object.values(history || {}).filter((e) => e && e.completed).length
  const systems = Object.values(boards || {}).filter((b) => b && b.won).length
  return { dailies, systems }
}

// { unlocked, need: { dailies, systems }, have: { dailies, systems }, left }
export function featureState(name, counts = progressCounts()) {
  const need = UNLOCKS[name]
  const have = { dailies: Math.min(counts.dailies, need.dailies), systems: Math.min(counts.systems, need.systems) }
  const unlocked = counts.dailies >= need.dailies && counts.systems >= need.systems
  return { unlocked, need, have, left: { dailies: Math.max(0, need.dailies - counts.dailies), systems: Math.max(0, need.systems - counts.systems) } }
}

// "10 Dailies and 5 Systems boards"
export function unlockRequirement(name) {
  const n = UNLOCKS[name]
  const parts = [`${n.dailies} Dailies`]
  if (n.systems) parts.push(`${n.systems} Systems boards`)
  return parts.join(' and ')
}

const idsOf = (cat) => [cat?.bankCategoryId, cat?.canonicalId, cat?.id].filter(Boolean).map(String)

// Ids of every connection the player has met in a finished Daily or a
// solved Systems board, plus any puzzle passed in (the one being reviewed).
export function encounteredConnectionIds({ history = getDailyHistory(), boards = getSystemsBoards(), extra = [] } = {}) {
  const out = new Set()
  for (const [date, e] of Object.entries(history || {})) {
    if (!e?.completed) continue
    try {
      getDailyPuzzleForDate(date)?.categories?.forEach((c) => idsOf(c).forEach((id) => out.add(id)))
    } catch {
      // a date with no puzzle contributes nothing
    }
  }
  const solved = new Set(Object.entries(boards || {}).filter(([, b]) => b?.won).map(([id]) => id))
  if (solved.size) {
    const today = dayKey(Date.now())
    for (const subject of LIBRARY_SUBJECTS) {
      systemsBoardsFor(subject, today).forEach((b, i) => {
        if (!solved.has(b.id)) return
        systemsBoardPuzzle(b, i)?.categories?.forEach((c) => idsOf(c).forEach((id) => out.add(id)))
      })
    }
  }
  for (const p of extra) p?.categories?.forEach((c) => idsOf(c).forEach((id) => out.add(id)))
  return out
}
