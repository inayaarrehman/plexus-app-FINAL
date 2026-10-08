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

// The preview on Home: the explanation's first sentence, exactly as written,
// and the rest. Splits only at a sentence end followed by a capital, never
// after common abbreviations or initials, so first + ' ' + rest is always the
// original text.
export function firstSentence(text) {
  const t = String(text || '').trim()
  const re = /[.!?](?=\s+[A-Z(])/g
  let m
  while ((m = re.exec(t))) {
    const upto = t.slice(0, m.index + 1)
    // Not after common abbreviations or single initials.
    if (/\b(e\.g|i\.e|vs|approx|cf|etc|Dr|St|Fig|No|ca)\.$/i.test(upto) || /\b[A-Z]\.$/.test(upto)) continue
    return { first: upto, rest: t.slice(m.index + 1).trim() }
  }
  return { first: t, rest: '' }
}

