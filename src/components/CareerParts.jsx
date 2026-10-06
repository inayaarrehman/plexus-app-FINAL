import React from 'react'
import { STAGES } from '../progression/config.js'

// ---------------------------------------------------------------------
// Small shared pieces of the Career system, all in the Plexus node language.
// ---------------------------------------------------------------------

// The levels inside the current career stage as nodes on one line, lit up to
// the current level, with the link to the next level filled by progress.
// Attending has no upper level, so it shows a rolling window of 8 levels.
export function LevelLine({ info, width = 260, height = 24, className = '' }) {
  const stage = info.stage
  const idx = STAGES.findIndex((s) => s.key === stage.key)
  const next = STAGES[idx + 1]
  let from = stage.from
  let to = next ? next.from - 1 : 0
  if (!next) {
    from = Math.max(stage.from, info.level - 4)
    to = from + 7
  }
  const n = to - from + 1
  const pad = 7
  const y = height / 2
  const step = n > 1 ? (width - pad * 2) / (n - 1) : 0
  const cur = info.level - from
  const frac = info.cost > 0 ? Math.min(1, info.intoLevel / info.cost) : 0
  const litTo = pad + step * cur + (cur < n - 1 ? step * frac : 0)
  return (
    <svg
      className={`level-line ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Level ${info.level}, ${Math.round(frac * 100)} percent of the way to level ${info.level + 1}`}
    >
      <line className="ll-track" x1={pad} y1={y} x2={width - pad} y2={y} />
      <line className="ll-fill" x1={pad} y1={y} x2={litTo} y2={y} />
      {Array.from({ length: n }).map((_, i) => {
        const x = pad + step * i
        const lit = i <= cur
        return <circle key={i} className={`ll-node ${lit ? 'is-lit' : ''} ${i === cur ? 'is-current' : ''}`} cx={x} cy={y} r={i === cur ? 5 : lit ? 3.6 : 3.2} />
      })}
    </svg>
  )
}

// Stage badge: a small Plexus that grows a node per stage (1, 2, 3, 4).
const BADGE_NODES = {
  premed: [[27, 27]],
  student: [[19, 30], [35, 24]],
  resident: [[18, 33], [35, 33], [27, 18]],
  attending: [[17, 22], [36, 17], [37, 35], [19, 37]],
}
const BADGE_LINKS = {
  premed: [],
  student: [[0, 1]],
  resident: [[0, 1], [1, 2], [2, 0]],
  attending: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]],
}
const NODE_TONES = ['var(--node-terracotta)', 'var(--node-peacock)', 'var(--node-cobalt)', 'var(--node-plum)']
export function StageBadge({ stageKey, size = 54, className = '' }) {
  const nodes = BADGE_NODES[stageKey] || BADGE_NODES.premed
  const links = BADGE_LINKS[stageKey] || []
  const name = STAGES.find((s) => s.key === stageKey)?.name || ''
  return (
    <svg className={`stage-badge ${className}`} width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={`${name} badge`}>
      <circle className="sb-ring" cx="27" cy="27" r="24.5" />
      {links.map(([a, b], i) => (
        <line key={i} className="sb-link" x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} className="sb-node" cx={x} cy={y} r="4.4" style={{ fill: NODE_TONES[i % 4] }} />
      ))}
    </svg>
  )
}

// Your Kit icons: thin line drawings with one node each, like the rest of Plexus.
const KIT_ICONS = {
  curbside: { d: 'M5 12h14', n: [[5, 12], [19, 12]] },
  lab: { d: 'M9 4h6M10 4v6l-4 9h12l-4-9V4', n: [[12, 15.5]] },
  imaging: { d: 'M4 6h16v12H4zM8 14l3-3 2 2 3-4', n: [[16, 9]] },
  readout: { d: 'M4 12h16M4 6h16M4 18h10', n: [[17.5, 18]] },
  shield: { d: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', n: [[12, 11]] },
  'second-opinion': { d: 'M8 7H4v4M4.5 11A8 8 0 1 0 7 6', n: [[12, 12]] },
  'time-out': { d: 'M12 7v5l3 2M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z', n: [[12, 12]] },
}
export function KitIcon({ item, size = 24, className = '' }) {
  const ic = KIT_ICONS[item] || KIT_ICONS.curbside
  return (
    <svg className={`kit-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d={ic.d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {ic.n.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.1" className="kit-icon-node" />
      ))}
    </svg>
  )
}

export const fmt = (n) => Number(n || 0).toLocaleString('en-US')

// ---------------------------------------------------------------------
// Career path: the four stages as nodes on one thin Plexus path.
// Completed stages stay lit in their jewel tone, the current stage is the
// largest node with an ivory ring, future stages are open and quiet. The link
// out of the current stage fills with progress toward the next stage.
// ---------------------------------------------------------------------
const STAGE_TONES = ['var(--node-terracotta)', 'var(--node-peacock)', 'var(--node-cobalt)', 'var(--node-plum)']
const PATH_PTS = [
  [50, 58],
  [150, 36],
  [250, 60],
  [350, 38],
]
// A few faint satellite nodes give the path a Plexus texture around stages
// that have been reached; future stages have none.
const SATELLITES = [
  [[24, 78], [70, 84]],
  [[124, 14], [178, 18]],
  [[226, 84], [280, 82]],
  [[328, 16], [376, 60]],
]
export function CareerPath({ info, stageFrac = 0, className = '' }) {
  const cur = STAGES.findIndex((s) => s.key === info.stage.key)
  return (
    <div className={`career-path ${className}`}>
      <svg viewBox="0 0 400 96" className="cp-svg" role="img" aria-label={`Career path: ${STAGES.map((s) => s.name).join(', ')}. Current stage ${info.stage.name}.`}>
        {SATELLITES.map((sats, i) =>
          i <= cur
            ? sats.map(([x, y], j) => (
                <g key={`s${i}${j}`}>
                  <line className="cp-sat-link" x1={PATH_PTS[i][0]} y1={PATH_PTS[i][1]} x2={x} y2={y} />
                  <circle className="cp-sat" cx={x} cy={y} r="2.6" style={{ fill: STAGE_TONES[i] }} />
                </g>
              ))
            : null
        )}
        {PATH_PTS.slice(0, -1).map(([x1, y1], i) => {
          const [x2, y2] = PATH_PTS[i + 1]
          const done = i < cur
          const active = i === cur
          const fx = x1 + (x2 - x1) * stageFrac
          const fy = y1 + (y2 - y1) * stageFrac
          return (
            <g key={`l${i}`}>
              <line className={`cp-link ${done ? 'is-done' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
              {active && stageFrac > 0 && (
                <line className="cp-progress" x1={x1} y1={y1} x2={fx} y2={fy} style={{ stroke: STAGE_TONES[i] }} />
              )}
            </g>
          )
        })}
        {PATH_PTS.map(([x, y], i) => {
          const state = i < cur ? 'is-done' : i === cur ? 'is-current' : 'is-future'
          return (
            <g key={`n${i}`} className={`cp-stage ${state}`}>
              {i === cur && <circle className="cp-ring" cx={x} cy={y} r="17" />}
              <circle
                className="cp-node"
                cx={x}
                cy={y}
                r={i === cur ? 10.5 : 7}
                style={i <= cur ? { fill: STAGE_TONES[i] } : undefined}
              />
            </g>
          )
        })}
      </svg>
      <ol className="cp-labels">
        {STAGES.map((s, i) => (
          <li key={s.key} className={i < cur ? 'is-done' : i === cur ? 'is-current' : 'is-future'}>
            {s.name}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------
// Milestone path: the levels of the current stage as small nodes, grouped
// under the stage's milestones (from MILESTONES in config). Lit up to the
// current level; the link to the next level fills with level progress. This
// is the page's one level-progress indicator.
// ---------------------------------------------------------------------
export function MilestonePath({ info, milestones, className = '' }) {
  const idx = STAGES.findIndex((s) => s.key === info.stage.key)
  const next = STAGES[idx + 1]
  let from = info.stage.from
  let to = next ? next.from - 1 : Math.max(info.level + 3, from + 7)
  if (!next) from = Math.max(info.stage.from, to - 7)
  const levels = []
  for (let L = from; L <= to; L++) levels.push(L)
  // Milestone groups inside the visible levels.
  const groups = []
  milestones.forEach((m, i) => {
    const end = (milestones[i + 1]?.from || Infinity) - 1
    const a = Math.max(m.from, from)
    const b = Math.min(end, to)
    if (a <= b) groups.push({ name: m.name, from: a, to: b, count: b - a + 1 })
  })
  const n = levels.length
  const frac = info.cost > 0 ? Math.min(1, info.intoLevel / info.cost) : 0
  return (
    <div className={`milestone-path ${className}`}>
      <div className="mp-track" role="img" aria-label={`Level ${info.level}, ${info.toNext} XP to level ${info.level + 1}`}>
        {levels.map((L, i) => {
          const lit = L <= info.level
          const isCur = L === info.level
          const isStart = groups.some((g) => g.from === L)
          return (
            <span key={L} className="mp-cell" style={{ flex: 1 }}>
              {i < n - 1 && (
                <span className="mp-link">
                  <span className="mp-link-fill" style={{ width: L < info.level ? '100%' : isCur ? `${Math.round(frac * 100)}%` : '0%' }} />
                </span>
              )}
              <span className={`mp-node ${lit ? 'is-lit' : ''} ${isCur ? 'is-current' : ''} ${isStart ? 'is-start' : ''}`} />
            </span>
          )
        })}
      </div>
      <div className="mp-labels">
        {groups.map((g) => {
          const state = info.level > g.to ? 'is-done' : info.level >= g.from ? 'is-current' : 'is-future'
          return (
            <span key={g.name} className={`mp-label ${state}`} style={{ flex: g.count }}>
              {g.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}
