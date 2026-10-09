import React from 'react'
import { KIT, PUZZLE_TOOLS, nextLevelReward } from '../progression/config.js'
import { formatDayKey } from '../utils/calendar.js'
import { LevelLine, ToolArt, fmt } from './RecordParts.jsx'

// The XP block on the results card. Secondary to the puzzle result and the
// streak, so it sits after the actions and stays compact: total XP with its
// breakdown, the level line, tool rewards grouped in one row, and This Week.
// A level-up lights the next node and updates the level number, briefly.
// Under it: the next reward and when it arrives, and a quiet way into My
// Plexus (never forced).
export default function XpResult({ result, onOpenRecord }) {
  const { gained, lines, after, levelUp, grants, rounds, pending = [], coverageUsed = [], weeklyChoice = null } = result
  // Grants that went into the inventory (pending claims are listed apart).
  const held = [...grants]
  for (const p of pending) {
    const i = held.indexOf(p)
    if (i >= 0) held.splice(i, 1)
  }
  const items = countGrants(held)
  const next = nextLevelReward(after.level)

  if (!(gained > 0) && items.length === 0 && coverageUsed.length === 0 && pending.length === 0) return null

  return (
    <div className={`xp-result ${levelUp ? 'is-level-up' : ''}`} role="status">
      <p className="xp-total">+{fmt(gained)} XP</p>
      {lines.length > 0 && <p className="xp-lines">{lines.map(([label, xp]) => `${label} ${fmt(xp)}`).join(' · ')}</p>}
      <LevelLine info={after} width={200} height={20} className="xp-line" />
      <p className="xp-level">
        <b>Level {after.level}</b> · {fmt(after.toNext)} XP to Level {after.level + 1}
      </p>
      {next && (
        <p className="xp-next">
          Next reward at Level {next.level} · {next.items.map((it) => `${KIT[it]?.name || it} +1`).join(' · ')}
        </p>
      )}
      {coverageUsed.length > 0 && (
        <p className="xp-coverage">
          Coverage used for {coverageUsed.map((d) => formatDayKey(d, { month: 'short', day: 'numeric' })).join(' and ')}. Your streak continues.
        </p>
      )}
      {pending.length > 0 && <p className="xp-pending">Inventory full: {summarizeGrants(pending).join(' · ')} waiting as a claim in Your Tools.</p>}
      {weeklyChoice && <p className="xp-pending">Weekly reward earned. Choose your tool in Your Tools.</p>}
      {items.length > 0 && (
        <p className="xp-items">
          <span className="xp-items-label">Your Tools</span>
          {items.map(({ item, label }) => (
            <span className="xp-item" key={item}>
              {PUZZLE_TOOLS.includes(item) && <ToolArt item={item} size="icon" className="xp-item-art" />}
              {label}
            </span>
          ))}
        </p>
      )}
      {rounds && (
        <p className="xp-rounds">
          {rounds.complete ? 'This Week: reward earned' : `This Week: ${rounds.done} of ${rounds.need} goals`}
        </p>
      )}
      {onOpenRecord && (
        <button type="button" className="xp-open" onClick={onOpenRecord}>
          See My Plexus <span aria-hidden="true">&rarr;</span>
        </button>
      )}
    </div>
  )
}

function countGrants(grants = []) {
  const c = {}
  grants.forEach((g) => {
    c[g] = (c[g] || 0) + 1
  })
  return Object.entries(c).map(([item, n]) => ({ item, label: `${KIT[item]?.name || item} +${n}` }))
}
function summarizeGrants(grants = []) {
  return countGrants(grants).map((g) => g.label)
}
