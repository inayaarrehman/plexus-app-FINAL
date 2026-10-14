import React from 'react'
import { KIT, PUZZLE_TOOLS } from '../progression/config.js'
import { ToolArt } from './RecordParts.jsx'

// Puzzle tools in 3 Minutes: the same Consult, Rule Out and Second Opinion as
// the Daily, from the same inventory and level unlocks, one per session.
// Each is adapted to a single round (see Challenge.jsx, toolEffect):
//   Consult         highlights answers that belong together in this round
//                   (two of the four in Rapid Association, two tiles from one
//                   group in a two-group board or Split, one of the two in
//                   Link Two)
//   Rule Out        crosses out one wrong choice in this round
//   Second Opinion  right after a wrong answer: the points it cost come back
//                   and your streak is restored (the miss still counts for
//                   accuracy)
// Race power-ups (Mutation, CRISPR) are for Race only.
export const CHALLENGE_TOOL_TIP = {
  curbside: 'Highlights answers that belong together in this round.',
  lab: 'Crosses out one wrong choice in this round.',
  'second-opinion': 'Right after a wrong answer, gives back the points it cost and restores your streak.',
}

export function ToolsIntro({ kit }) {
  if (!kit) return null
  const parts = PUZZLE_TOOLS.map((item) => {
    const def = KIT[item]
    return kit.level < def.unlock ? `${def.name} unlocks at Level ${def.unlock}` : `${def.name} ×${kit.counts[item] || 0}`
  })
  return (
    <p className="challenge-power-intro">
      <b>Tools:</b> {parts.join(' · ')}. One tool per session.
    </p>
  )
}

export default function ChallengeTools({ kit, toolState, used, note, onUse }) {
  if (!kit) return null
  return (
    <div className="challenge-powerups-wrap challenge-tools">
      <div className="challenge-powerups" role="group" aria-label="Tools">
        {PUZZLE_TOOLS.map((item) => {
          const def = KIT[item]
          const st = toolState(item)
          const locked = kit.level < def.unlock
          const meta = locked ? `Level ${def.unlock}` : used === item ? 'Used' : `×${kit.counts[item] || 0}`
          return (
            <button
              key={item}
              type="button"
              className={`challenge-power challenge-tool ${used === item ? 'is-on' : ''} ${locked ? 'is-locked' : ''}`}
              onClick={() => st.ok && onUse(item)}
              aria-disabled={!st.ok}
              disabled={!st.ok}
              title={`${CHALLENGE_TOOL_TIP[item]}${st.ok ? '' : ` ${st.why}.`}`}
              aria-label={`${def.name}, ${locked ? `locked until Level ${def.unlock}` : `${kit.counts[item] || 0} left`}. ${CHALLENGE_TOOL_TIP[item]}${st.ok ? '' : ` ${st.why}.`}`}
            >
              <ToolArt item={item} locked={locked} size="xs" className="challenge-tool-art" />
              <span className="challenge-power-name">{def.name}</span>
              <span className="challenge-power-meta">{meta}</span>
            </button>
          )
        })}
      </div>
      <p className="challenge-power-status" role="status" aria-live="polite">
        {note}
      </p>
    </div>
  )
}
