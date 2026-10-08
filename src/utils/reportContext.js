// What a "Report this connection" carries about the connection, attached
// automatically: the puzzle's stable id, the connection's id (its verified
// bank id when it has one), its title and four tiles, the game mode and the
// puzzle's calendar date (Dailies only).
export function reportContext(puzzle, category, { mode = 'daily', date = null } = {}) {
  if (!puzzle || !category) return null
  const index = (puzzle.categories || []).indexOf(category)
  return {
    puzzleId: puzzle.id,
    categoryId: category.bankCategoryId || category.id || `${puzzle.id}:${index >= 0 ? index : category.title}`,
    title: category.title,
    tiles: (category.items || []).map((it) => it.term),
    mode,
    puzzleDate: date || puzzle.date || null,
  }
}
