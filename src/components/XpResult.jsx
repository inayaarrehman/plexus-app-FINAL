import React from 'react'
import { KIT } from '../progression/config.js'
import BrandMark from './BrandMark.jsx'
import { LevelLine, StageBadge, fmt } from './CareerParts.jsx'

// The Career block on the results card. Normal case: total XP, a one-line
// breakdown, the level line, and Rounds if it moved. A level-up changes the
// level line and number. A career-stage promotion replaces the block with a
// larger constellation, the new stage, its badge and what was added to Your Kit.
export default function XpResult({ result }) {
  const { gained, lines, after, levelUp, promotion, grants, rounds } = result
  const items = summarizeGrants(grants)

  if (promotion) {
    return (
      <div className="xp-result xp-promotion" role="status">
        <BrandMark size={96} className="promo-mark" animate decorative />
        <p className="promo-kicker">Promoted to</p>
        <p className="promo-stage">{promotion.name}</p>
        <p className="promo-level">Level {after.level}</p>
        <StageBadge stageKey={promotion.key} size={52} className="promo-badge" />
        {items.length > 0 && <p className="xp-items">{items.join(' · ')}</p>}
        {gained > 0 && <p className="xp-sub">+{fmt(gained)} XP</p>}
      </div>
    )
  }

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
