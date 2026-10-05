// Builds the spoiler-free share text: one line per guess, so a friend sees
// the attempt pattern without the answers. Each concept is a node, coloured
// by its connection group with the four round emoji that render reliably
// everywhere (burnt coral, peacock, sapphire, amethyst). The richer node
// patterns live in the app; plain text stays compact and copyable.
const NODE_BY_LEVEL = { 1: '🟠', 2: '🟢', 3: '🔵', 4: '🟣' }

function guessRows(guessLog) {
  return guessLog.map((g) => g.levels.map((lv) => NODE_BY_LEVEL[lv] || '⚪').join('')).join('\n')
}

export function buildShareText({ isDaily, dailyNumber, puzzleTitle, shareLabel, guessLog, won, mistakes, dailyStreak }) {
  const rows = guessRows(guessLog)

  if (isDaily) {
    const header = `PLEXUS · ${String(dailyNumber ?? '').padStart(3, '0')}`
    const missLine = won ? (mistakes === 0 ? 'Perfectly connected.' : `${mistakes} miss${mistakes === 1 ? '' : 'es'}`) : 'Not solved today'
    const streakLine = won && dailyStreak > 0 ? `\n${dailyStreak} day streak` : ''
    return `${header}\n${rows}\n${missLine}${streakLine}`
  }

  const header = shareLabel ? `PLEXUS · ${shareLabel}` : `PLEXUS · ${puzzleTitle}`
  const missLine = won ? (mistakes === 0 ? 'Perfectly connected.' : `${mistakes} miss${mistakes === 1 ? '' : 'es'}`) : 'Not solved'
  return `${header}\n${rows}\n${missLine}`
}
