// Section 13: after finishing the Daily Puzzle, highlight ONE particularly
// interesting Hard/Expert relationship with its one-sentence explanation.
// Only ever called once the puzzle is already fully solved (gameOver &&
// won), so this never spoils anything — every category is already visible
// to the player by the time this shows.
export function pickConnectionOfDay(puzzle) {
  if (!puzzle || !Array.isArray(puzzle.categories)) return null
  // The hardest group that has a one-line takeaway. The results screen and
  // Home both call this, so they always feature the same connection.
  const ranked = puzzle.categories.slice().sort((a, b) => b.level - a.level)
  const chosen = ranked.find((c) => c.remember) || ranked[0]
  if (!chosen) return null
  return { title: chosen.title, explanation: chosen.explanation, remember: chosen.remember || '' }
}
