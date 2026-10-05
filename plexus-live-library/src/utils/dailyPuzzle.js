import dailyPuzzles from '../data/dailyPuzzles.js'
import connectionBank from '../data/connectionBank.js'
import { dateKey, dayNumber } from './game.js'
import { dailySeedString, buildDailyFromSeed } from './dailySeed.js'

// Resolves which Daily Puzzle a given date should show. Everyone who opens the
// app on the same calendar date gets the SAME puzzle, and it changes at local
// midnight. Resolution order:
//   1. If a daily puzzle has been explicitly authored for this date, use it
//      (keeps the hand-curated launch dailies intact for their dates / archive).
//   2. Otherwise generate one DETERMINISTICALLY from the verified connection
//      bank, seeded by the date ("PLEXUS-YYYY-MM-DD"). The same date always
//      produces the identical puzzle on every device — no backend needed — and
//      because it draws from 180+ verified connections the board is fresh every
//      day rather than cycling a tiny authored pool. THIS is what makes the
//      board change daily.
//   3. Last-resort fallback: if the bank somehow can't form a full tier set,
//      rotate the authored pool by day number so the app never breaks.
export function getDailyPuzzleForDate(date, bank = connectionBank) {
  const key = dateKey(date)
  const published = dailyPuzzles.filter((p) => p.status === 'published')

  const explicit = published.find((p) => p.date === key)
  if (explicit) return explicit

  const generated = buildDailyFromSeed(bank, dailySeedString(key), {
    number: dayNumber(date),
    date: key,
  })
  if (generated) return generated

  if (published.length === 0) return null
  const n = dayNumber(date)
  const idx = ((n % published.length) + published.length) % published.length
  return published[idx]
}

export function isFutureDateKey(dateStr) {
  return dateStr > dateKey(new Date())
}
