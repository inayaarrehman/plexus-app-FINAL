import React from 'react'

// ---------------------------------------------------------------------
// Small shared pieces of the Record page and the results card, all in the
// Plexus node language. Progression is levels only.
// ---------------------------------------------------------------------

// The window of levels shown around the current one: two behind, two ahead.
export function levelWindow(level, size = 5) {
  const from = Math.max(1, level - Math.floor(size / 2))
  return Array.from({ length: size }, (_, i) => from + i)
}

function levelFrac(info) {
  return info.cost > 0 ? Math.min(1, info.intoLevel / info.cost) : 0
}

// Compact level line (Home and results): five level nodes on one thin line,
// lit up to the current level, the link to the next level filled by progress.
export function LevelLine({ info, width = 260, height = 24, className = '' }) {
  const levels = levelWindow(info.level)
  const n = levels.length
  const pad = 7
  const y = height / 2
  const step = (width - pad * 2) / (n - 1)
  const cur = levels.indexOf(info.level)
  const frac = levelFrac(info)
  const litTo = pad + step * cur + (cur < n - 1 ? step * frac : 0)
  return (
    <svg
      className={`level-line ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Level ${info.level}, ${info.toNext} XP to level ${info.level + 1}`}
    >
      <line className="ll-track" x1={pad} y1={y} x2={width - pad} y2={y} />
      <line className="ll-fill" x1={pad} y1={y} x2={litTo} y2={y} />
      {levels.map((L, i) => {
        const x = pad + step * i
        const lit = L <= info.level
        const isCur = L === info.level
        return <circle key={L} className={`ll-node ${lit ? 'is-lit' : ''} ${isCur ? 'is-current' : ''}`} cx={x} cy={y} r={isCur ? 5 : lit ? 3.6 : 3.2} />
      })}
    </svg>
  )
}

// Level path (top of Record): the levels around the current one as nodes on
// a thin Plexus path that steps gently up and down. Reached levels are lit,
// the current level is the largest node with an ivory ring, the next levels
// are open and quiet. The link out of the current level fills with progress.
// This is the page's one level-progress indicator.
const LP_Y = [46, 30, 46, 30, 46]
export function LevelPath({ info, className = '' }) {
  const levels = levelWindow(info.level)
  const n = levels.length
  const x0 = 40
  const step = (400 - x0 * 2) / (n - 1)
  const pts = levels.map((L, i) => [x0 + step * i, LP_Y[(L - 1) % 2 === 0 ? 0 : 1]])
  const cur = levels.indexOf(info.level)
  const frac = levelFrac(info)
  return (
    <div className={`level-path ${className}`}>
      <svg viewBox="0 0 400 96" className="lp-svg" role="img" aria-label={`Level ${info.level}. ${info.toNext} XP to level ${info.level + 1}.`}>
        {pts.slice(0, -1).map(([x1, y1], i) => {
          const [x2, y2] = pts[i + 1]
          const done = i < cur
          return (
            <g key={`l${i}`}>
              <line className={`lp-link ${done ? 'is-done' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
              {i === cur && frac > 0 && (
                <line className="lp-progress" x1={x1} y1={y1} x2={x1 + (x2 - x1) * frac} y2={y1 + (y2 - y1) * frac} />
              )}
            </g>
          )
        })}
        {pts.map(([x, y], i) => {
          const L = levels[i]
          const state = L < info.level ? 'is-done' : L === info.level ? 'is-current' : 'is-future'
          return (
            <g key={L} className={`lp-level ${state}`}>
              {state === 'is-current' && <circle className="lp-ring" cx={x} cy={y} r="16" />}
              <circle className="lp-node" cx={x} cy={y} r={state === 'is-current' ? 10 : 6.5} />
              <text className="lp-num" x={x} y={88} textAnchor="middle">
                {L}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
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
