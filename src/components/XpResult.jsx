import React from 'react'
import { KIT } from '../progression/config.js'
import { LevelLine, fmt } from './RecordParts.jsx'

// The XP block on the results card: total XP, a one-line breakdown, the level
// line, items received and This Week if it moved. A level-up lights the next
// node and updates the level number; nothing more dramatic than that.
export default function XpResult({ result }) {
  const { gained, lines, after, levelUp, grants, rounds } = result
  const items = summarizeGrants(grants)

  if (!(gained > 0) && items.length === 0) return null

  return (
    <div className={`xp-result ${levelUp ? 'is-level-up' : ''}`} role="status">
      <p className="xp-total">+{fmt(gained)} XP</p>
      {lines.length > 0 && <p className="xp-lines">{lines.map(([label, xp]) => `${label} ${fmt(xp)}`).join(' · ')}</p>}
      <LevelLine info={after} width={240} height={22} className="xp-line" />
      <p className="xp-level">
        <b>Level {after.level}</b> · {fmt(after.toNext)} XP to Level {after.level + 1}
      </p>
      {items.length > 0 && <p className="xp-items">{items.join(' · ')}</p>}
      {rounds && (
        <p className="xp-rounds">{rounds.complete ? 'This Week complete' : `This Week ${rounds.done} of ${rounds.goals.length}`}</p>
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
