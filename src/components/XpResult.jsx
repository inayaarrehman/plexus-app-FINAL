import React, { useEffect, useState } from 'react'
import { KIT, nextMilestone } from '../progression/config.js'
import { formatDayKey } from '../utils/calendar.js'
import { LevelLine, fmt } from './RecordParts.jsx'
import ToolReveal, { REVEAL_SECONDS } from './ToolReveal.jsx'
import MilestoneMoment, { milestoneToShow } from './MilestoneMoment.jsx'

// The XP block on the results card. Secondary to the puzzle result and the
// streak, so it sits after the actions and stays compact: total XP with its
// breakdown, the level line, tool rewards grouped in one row, and This Week.
// A level-up lights the next node and updates the level number, briefly.
// Under it: the next reward and when it arrives, and a quiet way into My
// Plexus (never forced).
// Tools that just arrived, one row each, each playing its own animation in
// turn, and the Milestone reached moment when a milestone was crossed. Used
// by the result card here and by the 3 Minutes and Race results.
export function RewardMoments({ result, onOpenRecord, startAt = 0.6 }) {
  const [moment, setMoment] = useState(null)
  // Picked up once per new result (a Race win arrives after the finish).
  useEffect(() => {
    const m = milestoneToShow(result)
    if (m) setMoment(m)
  }, [result])
  if (!result) return null
  const held = [...(result.grants || [])]
  for (const p of result.pending || []) {
    const i = held.indexOf(p)
    if (i >= 0) held.splice(i, 1)
  }
  const items = countGrants(held)
  let at = startAt
  const rows = items.map(({ item, n, label }) => {
    const row = { item, label, at, held: result.counts?.[item], cap: result.caps?.[item] }
    at += Math.min(REVEAL_SECONDS[item] || 1.6, 1.6) * 0.75
    return row
  })
  return (
    <>
      {rows.length > 0 && (
        <ul className="xp-reveal" aria-label="Your Tools">
          {rows.map((r) => (
            <li key={r.item} className="xp-reveal-row" style={{ '--glow-at': `${r.at}s` }}>
              <ToolReveal item={r.item} width={64} delay={r.at} />
              <span className="xp-reveal-text">
                <span className="xp-reveal-kicker">Your Tools</span>
                <span className="xp-reveal-name">{r.label}</span>
                {r.held != null && r.cap ? (
                  <span className="xp-reveal-held">
                    {r.held} of {r.cap} held
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
      {moment && <MilestoneMoment milestone={moment} caps={result.caps} onClose={() => setMoment(null)} onOpenRecord={onOpenRecord} />}
    </>
  )
}

export default function XpResult({ result, onOpenRecord }) {
  const { gained, lines, after, levelUp, grants, rounds, pending = [], coverageUsed = [], coverageAlt = [], weeklyChoice = null } = result
  // Grants that went into the inventory (pending claims are listed apart).
  const held = [...grants]
  for (const p of pending) {
    const i = held.indexOf(p)
    if (i >= 0) held.splice(i, 1)
  }
  const items = countGrants(held)
  const next = nextMilestone(after.level)

  if (!(gained > 0) && items.length === 0 && coverageUsed.length === 0 && pending.length === 0 && coverageAlt.length === 0 && !(result.milestones || []).length) return null

  return (
    <div className={`xp-result ${levelUp ? 'is-level-up' : ''}`} role="status">
      <p className="xp-total">+{fmt(gained)} XP</p>
      {lines.length > 0 && <p className="xp-lines">{lines.map(([label, xp]) => `${label} ${fmt(xp)}`).join(' · ')}</p>}
      <LevelLine info={after} width={200} height={20} className="xp-line" />
      <p className="xp-level">
        <b>Level {after.level}</b>
        {levelUp ? ' reached' : ''} · {fmt(after.toNext)} XP to Level {after.level + 1}
      </p>
      {next && (
        <p className="xp-next">
          Next reward at Level {next.level} · {next.items.join(' · ')}
        </p>
      )}
      {coverageUsed.length > 0 && (
        <p className="xp-coverage">
          Coverage used for {coverageUsed.map((d) => formatDayKey(d, { month: 'short', day: 'numeric' })).join(' and ')}. Your streak continues.
        </p>
      )}
      {coverageAlt.length > 0 && (
        <p className="xp-coverage">
          You earned a Coverage while holding {KIT.shield.max}, so you got {coverageAlt.map((c) => (c.item ? KIT[c.item]?.name : `${c.xp} XP`)).join(' and ')} instead.
        </p>
      )}
      {pending.length > 0 && <p className="xp-pending">Inventory full: {summarizeGrants(pending).join(' · ')} waiting as a claim in Your Tools.</p>}
      {weeklyChoice && <p className="xp-pending">Weekly reward earned. Choose your tool in Your Tools.</p>}
      <RewardMoments result={result} onOpenRecord={onOpenRecord} startAt={levelUp ? 1.4 : 0.6} />
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
  return Object.entries(c).map(([item, n]) => ({ item, n, label: `${KIT[item]?.name || item} +${n}` }))
}
function summarizeGrants(grants = []) {
  return countGrants(grants).map((g) => g.label)
}
