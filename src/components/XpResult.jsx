import React from 'react'
import { KIT } from '../progression/config.js'
import { LevelLine, fmt } from './RecordParts.jsx'

// The XP block on the results card. Secondary to the puzzle result and the
// streak, so it sits after the actions and stays compact: total XP with its
// breakdown, the level line, Kit rewards grouped in one row, and This Week.
// A level-up lights the next node and updates the level number, briefly.
export default function XpResult({ result }) {
  const { gained, lines, after, levelUp, grants, rounds } = result
  const items = summarizeGrants(grants)

  if (!(gained > 0) && items.length === 0) return null

  return (
    <div className={`xp-result ${levelUp ? 'is-level-up' : ''}`} role="status">
      <p className="xp-total">+{fmt(gained)} XP</p>
      {lines.length > 0 && <p className="xp-lines">{lines.map(([label, xp]) => `${label} ${fmt(xp)}`).join(' · ')}</p>}
      <LevelLine info={after} width={200} height={20} className="xp-line" />
      <p className="xp-level">
        <b>Level {after.level}</b> · {fmt(after.toNext)} XP to Level {after.level + 1}
      </p>
      {items.length > 0 && (
        <p className="xp-items">
          <span className="xp-items-label">Your Kit</span>
          {items.map((it) => (
            <span className="xp-item" key={it}>
              {it}
            </span>
          ))}
        </p>
      )}
      {rounds && (
        <p className="xp-rounds">
          {rounds.complete ? 'This Week: all 3 goals done' : `This Week: ${rounds.done} of ${rounds.goals.length} goals done`}
        </p>
      )}
    </div>
  )
}

function summarizeGrants(grants = []) {
  const c = {}
  grants.forEach((g) => {
    c[g] = (c[g] || 0) + 1
  })
  return Object.entries(c).map(([item, n]) => `${KIT[item]?.name || item} +${n}`)
}
