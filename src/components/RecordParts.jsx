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

// ---------------------------------------------------------------------
// My Plexus: the player's own network, grown one level at a time.
// ---------------------------------------------------------------------
// Every node is real progress:
//   - a large node per level (reached levels lit in a jewel tone, the current
//     level largest with its number inside, the next levels open and faint)
//   - small branch nodes off a level for the Kit rewards that level grants
//     (lit once earned, open while ahead, so the next reward is visible)
// Only a focused window is drawn: three levels behind, two ahead. Early on
// the network is small; once earlier levels scroll out of the window a faint
// trail on the left shows the network continues. XP to the next level fills
// the link between the current node and the next one.
//
// Placement is fixed per level number (no randomness at render), slightly
// irregular so it reads as a network and not a chart.

const GW = 400
const JEWELS = ['peacock', 'cobalt', 'plum', 'terracotta']
export const levelJewel = (L) => JEWELS[(L - 1) % JEWELS.length]

// Deterministic 0..1 value per level and purpose.
function jit(L, salt) {
  const x = Math.sin(L * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function growthLayout(info, rewardsFor) {
  const L = info.level
  const from = Math.max(1, L - 3)
  const to = L + 2
  const levels = []
  for (let v = from; v <= to; v++) levels.push(v)
  const n = levels.length
  const step = 68
  const span = (n - 1) * step
  const x0 = (GW - span) / 2
  const cy = 0
  const nodes = levels.map((v, i) => {
    const up = v % 2 === 0
    const amp = 14 + jit(v, 1) * 16
    const x = x0 + i * step + (jit(v, 2) - 0.5) * 14
    const y = cy + (up ? -amp : amp)
    const state = v < L ? 'done' : v === L ? 'current' : v === L + 1 ? 'next' : 'future'
    // Rewards branch away from the middle line, the number sits on the other side.
    const dir = up ? -1 : 1
    const items = v >= 2 ? rewardsFor(v) : []
    const r = state === 'current' ? 16 : state === 'done' ? 7.5 : 6.5
    const base = 90 * dir // degrees: up = -90, down = 90 (SVG y grows down)
    const spread = items.length > 1 ? Math.min(40, 150 / (items.length - 1)) : 0
    const tilt = (jit(v, 3) - 0.5) * 34
    const sats = items.map((item, k) => {
      const ang = ((base + tilt + (k - (items.length - 1) / 2) * spread) * Math.PI) / 180
      const d = r + 17 + jit(v, 4 + k) * 6 + (items.length > 3 && k % 2 ? 9 : 0)
      return { item, x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d }
    })
    return { level: v, x, y, r, state, dir, jewel: levelJewel(v), sats }
  })
  const cur = nodes.find((nd) => nd.state === 'current')
  const next = nodes.find((nd) => nd.state === 'next')
  // Frame the drawing tightly: every node, branch and number, plus a margin.
  let minY = Infinity
  let maxY = -Infinity
  nodes.forEach((nd) => {
    const ys = [nd.y - nd.r - 6, nd.y + nd.r + 6, nd.y - nd.dir * (nd.r + 13) - 8, nd.y - nd.dir * (nd.r + 13) + 8, ...nd.sats.map((s) => s.y - 6), ...nd.sats.map((s) => s.y + 6)]
    ys.forEach((y) => {
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })
  })
  const top = Math.floor(minY - 6)
  return { nodes, cur, next, trail: from > 1, width: GW, top, height: Math.ceil(maxY + 6 - top) }
}

function frac(info) {
  return info.cost > 0 ? Math.min(1, Math.max(0, info.intoLevel / info.cost)) : 0
}

export function PlexusGrowth({ info, rewardsFor, className = '' }) {
  const gid = React.useId().replace(/:/g, '')
  const lay = growthLayout(info, rewardsFor)
  const { nodes, cur, next } = lay
  const f = frac(info)
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  // Point on the current to next link where the XP fill ends (stopping at the node edges).
  const ux = next.x - cur.x
  const uy = next.y - cur.y
  const len = Math.hypot(ux, uy)
  const sx = cur.x + (ux / len) * cur.r
  const sy = cur.y + (uy / len) * cur.r
  const ex = next.x - (ux / len) * next.r
  const ey = next.y - (uy / len) * next.r
  const hx = sx + (ex - sx) * f
  const hy = sy + (ey - sy) * f
  return (
    <div className={`growth ${className}`}>
      <svg
        viewBox={`0 ${lay.top} ${lay.width} ${lay.height}`}
        className="growth-svg"
        role="img"
        aria-label={`Your Plexus: level ${info.level}, ${info.toNext} XP to level ${info.level + 1}.`}
        style={{ '--growth-frac': f }}
      >
        <defs>
          <linearGradient id={`${gid}-tl`} x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-tr`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The network continues beyond the window on both sides. */}
        {lay.trail && (
          <line className="g-trail" x1={first.x} y1={first.y} x2={first.x - 34} y2={first.y + 10 * first.dir} stroke={`url(#${gid}-tl)`} />
        )}
        <line className="g-trail" x1={last.x} y1={last.y} x2={last.x + 30} y2={last.y - 8 * last.dir} stroke={`url(#${gid}-tr)`} />

        {/* Cross links between reached levels make it a network, not a line. */}
        {nodes.slice(0, -2).map((a, i) => {
          const b = nodes[i + 2]
          if (b.level > info.level) return null
          return <line key={`x${a.level}`} className="g-cross" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}

        {/* Level links. */}
        {nodes.slice(0, -1).map((a, i) => {
          const b = nodes[i + 1]
          const done = b.level <= info.level
          return <line key={`l${a.level}`} className={`g-link ${done ? 'is-done' : ''}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}

        {/* XP toward the next level. */}
        {f > 0 && (
          <line className={`g-progress jewel-${cur.jewel}`} x1={sx} y1={sy} x2={hx} y2={hy} pathLength="1" />
        )}

        {/* Reward branches. */}
        {nodes.map((nd) =>
          nd.sats.map((s, k) => (
            <g key={`s${nd.level}-${k}`} className={`g-sat is-${nd.state} jewel-${nd.jewel}`} data-item={s.item}>
              <line className="g-branch" x1={nd.x} y1={nd.y} x2={s.x} y2={s.y} />
              <circle className="g-sat-node" cx={s.x} cy={s.y} r={nd.state === 'done' || nd.state === 'current' ? 4 : 3.6} />
            </g>
          ))
        )}

        {/* Level nodes. */}
        {nodes.map((nd) => (
          <g key={nd.level} className={`g-level is-${nd.state} jewel-${nd.jewel}`} data-level={nd.level}>
            {nd.state === 'current' && <circle className="g-ring" cx={nd.x} cy={nd.y} r={nd.r + 5} />}
            <circle className="g-node" cx={nd.x} cy={nd.y} r={nd.r} />
            {nd.state === 'current' ? (
              <text className="g-num g-num-in" x={nd.x} y={nd.y} textAnchor="middle" dominantBaseline="central">
                {nd.level}
              </text>
            ) : (
              <text className="g-num" x={nd.x} y={nd.y - nd.dir * (nd.r + 13)} textAnchor="middle" dominantBaseline="central">
                {nd.level}
              </text>
            )}
          </g>
        ))}

        {f > 0 && <circle className="g-head" cx={hx} cy={hy} r="3" />}
      </svg>
    </div>
  )
}

// This Week: each goal is a node. Progress fills the node; when all three are
// done the nodes join into a small triangle.
export function WeekGoals({ goals, complete }) {
  const wrap = React.useRef(null)
  const [pts, setPts] = React.useState(null)
  React.useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => {
      const box = el.getBoundingClientRect()
      const p = [...el.querySelectorAll('.rounds-node')].map((n) => {
        const r = n.getBoundingClientRect()
        return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]
      })
      setPts({ p, w: box.width, h: box.height })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [goals.length])
  return (
    <div className={`rounds-wrap ${complete ? 'is-complete' : ''}`} ref={wrap}>
      {complete && pts && pts.p.length === 3 && (
        <svg className="rounds-links" width={pts.w} height={pts.h} viewBox={`0 0 ${pts.w} ${pts.h}`} aria-hidden="true">
          {[[0, 1], [1, 2], [2, 0]].map(([a, b]) => (
            <line key={`${a}${b}`} x1={pts.p[a][0]} y1={pts.p[a][1]} x2={pts.p[b][0]} y2={pts.p[b][1]} pathLength="1" />
          ))}
        </svg>
      )}
      <ul className="rounds-list">
        {goals.map((g, i) => {
          const p = g.target > 0 ? Math.min(1, g.count / g.target) : 0
          return (
            <li key={g.id} className={`rounds-goal ${g.done ? 'is-done' : ''} jewel-${JEWELS[i % 3]}`}>
              <span className="rounds-gutter" aria-hidden="true">
                <span className="rounds-node" style={{ '--p': p }} />
              </span>
              <span className="rounds-label">{g.label}</span>
              <span className="rounds-count">
                {g.count}/{g.target}
              </span>
            </li>
          )
        })}
      </ul>
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
