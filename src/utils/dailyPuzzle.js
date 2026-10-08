import dailyPuzzles from '../data/dailyPuzzles.js'
import connectionBank from '../data/connectionBank.js'
import { dateKey, dayNumber } from './game.js'
import { dailySeedString, buildDailyFromSeed } from './dailySeed.js'
import { PINNED_DAILIES, PINNED_THROUGH } from '../data/dailyLock.js'
import { assemblePuzzleFromCategories, categoriesCompatible } from './puzzleAssembler.js'
import { NEW_DAILY_START, getNewDailyPuzzle } from './newLibrary.js'

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
//
// From NEW_DAILY_START on, the Daily comes ONLY from the new library's fixed
// schedule (utils/newLibrary.js). There is no fallback to the timed bank: if
// the schedule had no board the result is null. Dates before the switch keep
// resolving exactly as they always did, so the puzzle a player already has
// for today does not change when this ships.
export function getDailyPuzzleForDate(date, bank = connectionBank) {
  const key = dateKey(date)
  if (key >= NEW_DAILY_START) return getNewDailyPuzzle(key)
  const published = dailyPuzzles.filter((p) => p.status === 'published')

  const explicit = published.find((p) => p.date === key)
  if (explicit) return explicit

  // Dailies that already went out keep their four categories (see dailyLock.js).
  if (key <= PINNED_THROUGH && PINNED_DAILIES[key]) {
    // Pinned ids are stored easy to expert; keep that day's tiers even if a
    // category's difficulty label was corrected later.
    const TIERS = ['easy', 'medium', 'hard', 'expert']
    const cats = PINNED_DAILIES[key].map((id, i) => {
      const c = bank.find((x) => x.id === id)
      return c ? { ...c, difficulty: TIERS[i] } : null
    })
    if (cats.every(Boolean) && categoriesCompatible(cats)) {
      const puzzle = assemblePuzzleFromCategories(cats, { id: `daily-${key}`, number: dayNumber(key), title: 'Daily Plexus' })
      puzzle.type = 'daily'
      puzzle.date = key
      puzzle.seed = dailySeedString(key)
      return puzzle
    }
  }

  const generated = buildDailyFromSeed(bank, dailySeedString(key), {
    number: dayNumber(key),
    date: key,
  })
  if (generated) return generated

  if (published.length === 0) return null
  const n = dayNumber(key)
  const idx = ((n % published.length) + published.length) % published.length
  return published[idx]
}

// What the Archive and Challenge links may open. Dailies from before the new
// library are retired from play (kept in the backup and in players' history);
// only today's Daily, whichever library it comes from, stays playable.
export function getPlayableDailyForDate(key, todayKey = dateKey(Date.now())) {
  if (key > todayKey) return null
  if (key < NEW_DAILY_START && key !== todayKey) return null
  return getDailyPuzzleForDate(key)
}

export function isFutureDateKey(dateStr) {
  return dateStr > dateKey(Date.now())
}
