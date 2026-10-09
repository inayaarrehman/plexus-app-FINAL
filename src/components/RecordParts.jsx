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
// Every large node is a real level: reached levels lit in a jewel tone, the
// current level largest with its number inside, the next levels open and
// faint. Small branch nodes off a level are the Kit rewards that level grants
// (lit once earned, open while ahead). The next level carries a label with
// its reward, so the reward sits on the node it belongs to.
//
// Only a focused window is drawn (3 behind and 2 ahead on phones, 5 and 3 on
// wide screens). Early on the network is small; once earlier levels leave the
// window a faint trail shows it continues. XP to the next level fills the link
// between the current node and the next one.
//
// The path is a gentle wave fixed per level number, so the same level always
// sits in the same place relative to its neighbours and nothing moves at
// random. The drawing is framed from its real extent, so it never clips.

const JEWELS = ['peacock', 'cobalt', 'plum', 'terracotta']
export const levelJewel = (L) => JEWELS[(L - 1) % JEWELS.length]

// Deterministic 0..1 value per level and purpose.
function jit(L, salt) {
  const x = Math.sin(L * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export const GROWTH_WINDOWS = { compact: { behind: 3, ahead: 2, step: 62 }, wide: { behind: 5, ahead: 3, step: 88 } }
const MARGIN = 34
const LABEL_H = 34 // room for the two-line reward label, in drawing units

export function growthLayout(info, rewardsFor, size = 'compact') {
  const { behind, ahead, step } = GROWTH_WINDOWS[size] || GROWTH_WINDOWS.compact
  const L = info.level
  const from = Math.max(1, L - behind)
  const to = L + ahead
  const W = (behind + ahead) * step + MARGIN * 2
  const levels = []
  for (let v = from; v <= to; v++) levels.push(v)
  const n = levels.length
  const x0 = (W - (n - 1) * step) / 2
  const nodes = levels.map((v, i) => {
    // A slow wave plus a little per-level variation: rises and falls over a
    // few levels instead of zigzagging every step.
    const y = Math.sin(v * 1.2) * 24 + (jit(v, 1) - 0.5) * 10
    const x = x0 + i * step + (jit(v, 2) - 0.5) * 10
    const state = v < L ? 'done' : v === L ? 'current' : v === L + 1 ? 'next' : 'future'
    // Rewards branch to one side, the number sits on the other. Alternating
    // sides keeps neighbouring clusters apart.
    const dir = v % 2 === 0 ? -1 : 1
    const items = v >= 2 ? rewardsFor(v) : []
    const r = state === 'current' ? 17 : state === 'done' ? 8 : 7
    const k = items.length
    const spread = k > 1 ? Math.min(34, 132 / (k - 1)) : 0
    const tilt = (jit(v, 3) - 0.5) * 24
    const reach = r + 17
    const sats = items.map((item, j) => {
      const ang = ((90 * dir + tilt + (j - (k - 1) / 2) * spread) * Math.PI) / 180
      return { item, x: x + Math.cos(ang) * reach, y: y + Math.sin(ang) * reach }
    })
    return { level: v, x, y, r, state, dir, jewel: levelJewel(v), sats, reach: k ? reach + 4 : r }
  })
  const cur = nodes.find((nd) => nd.state === 'current')
  const next = nodes.find((nd) => nd.state === 'next')
  // Where the next level's reward label sits: past its branch tips.
  const label = { x: next.x, y: next.y + next.dir * (next.reach + 7), dir: next.dir }
  // Frame from the real extent of everything drawn.
  let minY = Infinity
  let maxY = -Infinity
  const take = (y) => {
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  nodes.forEach((nd) => {
    take(nd.y - nd.r - 6)
    take(nd.y + nd.r + 6)
    take(nd.y - nd.dir * (nd.r + 21))
    nd.sats.forEach((s) => {
      take(s.y - 6)
      take(s.y + 6)
    })
  })
  take(label.y + label.dir * LABEL_H)
  const top = Math.floor(minY - 4)
  return { nodes, cur, next, label, trail: from > 1, width: W, top, height: Math.ceil(maxY + 4 - top) }
}

function fracOf(info) {
  return info.cost > 0 ? Math.min(1, Math.max(0, info.intoLevel / info.cost)) : 0
}

// `info` is { level, intoLevel, cost, toNext }. `moving` styles the head as a
// travelling pulse while XP is being added. `activating` lights the next node
// as the level is reached, and `label` overrides the reward label (used to
// show the reward just earned).
export function PlexusGrowth({ info, ariaInfo = null, rewardsFor, rewardText, size = 'compact', moving = false, activating = false, label, className = '' }) {
  const said = ariaInfo || info
  const gid = React.useId().replace(/:/g, '')
  const lay = growthLayout(info, rewardsFor, size)
  const { nodes, cur, next } = lay
  const f = fracOf(info)
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  // The XP fill runs between the two node edges.
  const ux = next.x - cur.x
  const uy = next.y - cur.y
  const len = Math.hypot(ux, uy)
  const sx = cur.x + (ux / len) * (cur.r + 1)
  const sy = cur.y + (uy / len) * (cur.r + 1)
  const ex = next.x - (ux / len) * next.r
  const ey = next.y - (uy / len) * next.r
  const hx = sx + (ex - sx) * f
  const hy = sy + (ey - sy) * f
  const lb = label || { kicker: 'Next reward', text: rewardText }
  const lx = (lay.label.x / lay.width) * 100
  const ly = ((lay.label.y - lay.top) / lay.height) * 100
  return (
    <div className={`growth growth-${size} ${className}`}>
      <svg
        viewBox={`0 ${lay.top} ${lay.width} ${lay.height}`}
        className="growth-svg"
        role="img"
        aria-label={`Your Plexus: level ${said.level}, ${said.toNext} XP to level ${said.level + 1}.`}
      >
        <defs>
          <linearGradient id={`${gid}-tl`} x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-tr`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* The network continues beyond the window on both sides. */}
        {lay.trail && <line className="g-trail" x1={first.x} y1={first.y} x2={first.x - 36} y2={first.y + 6} stroke={`url(#${gid}-tl)`} />}
        <line className="g-trail" x1={last.x} y1={last.y} x2={last.x + 34} y2={last.y - 6} stroke={`url(#${gid}-tr)`} />

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
        {f > 0 && <line className={`g-progress jewel-${cur.jewel}`} x1={sx} y1={sy} x2={hx} y2={hy} />}

        {/* Reward branches. */}
        {nodes.map((nd) =>
          nd.sats.map((s, k) => {
            const lit = nd.state === 'done' || nd.state === 'current' || (activating && nd.state === 'next')
            return (
              <g key={`s${nd.level}-${k}`} className={`g-sat is-${nd.state} ${lit ? 'is-lit' : ''} jewel-${nd.jewel}`} data-item={s.item}>
                <line className="g-branch" x1={nd.x} y1={nd.y} x2={s.x} y2={s.y} />
                <circle className="g-sat-node" cx={s.x} cy={s.y} r={lit ? 4 : 3.6} />
              </g>
            )
          })
        )}

        {/* Level nodes. */}
        {nodes.map((nd) => {
          const act = activating && nd.state === 'next'
          return (
            <g key={nd.level} className={`g-level is-${nd.state} ${act ? 'is-activating' : ''} jewel-${nd.jewel}`} data-level={nd.level}>
              {nd.state === 'current' && <circle className="g-ring" cx={nd.x} cy={nd.y} r={nd.r + 5} />}
              <circle className="g-node" cx={nd.x} cy={nd.y} r={act ? 11 : nd.r} />
              {nd.state === 'current' ? (
                <text className="g-num g-num-in" x={nd.x} y={nd.y} textAnchor="middle" dominantBaseline="central">
                  {nd.level}
                </text>
              ) : (
                <text className="g-num" x={nd.x} y={nd.y - nd.dir * (nd.r + 12)} textAnchor="middle" dominantBaseline="central">
                  {nd.level}
                </text>
              )}
            </g>
          )
        })}

        {f > 0 && <circle className={`g-head jewel-${cur.jewel} ${moving ? 'is-moving' : ''}`} cx={hx} cy={hy} r={moving ? 4.2 : 3} />}
      </svg>
      {lb.text && (
        <p
          className={`growth-label ${lay.label.dir < 0 ? 'is-above' : 'is-below'} ${label ? 'is-earned' : ''} jewel-${next.jewel}`}
          style={{ left: `clamp(124px, ${lx}%, calc(100% - 34px))`, top: `${ly}%` }}
        >
          <span className="growth-label-kicker">{lb.kicker}</span>
          <span className="growth-label-text">{lb.text}</span>
        </p>
      )}
    </div>
  )
}

// This Week: each goal is a node. Progress fills the node; when the week's
// reward is earned (any two goals) the nodes join into a small triangle.
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

// Your Tools icons: thin line drawings with one node each, like the rest of Plexus.
const KIT_ICONS = {
  curbside: { d: 'M5 12h14', n: [[5, 12], [19, 12]] },
  lab: { d: 'M9 4h6M10 4v6l-4 9h12l-4-9V4', n: [[12, 15.5]] },
  imaging: { d: 'M4 6h16v12H4zM8 14l3-3 2 2 3-4', n: [[16, 9]] },
  readout: { d: 'M4 12h16M4 6h16M4 18h10', n: [[17.5, 18]] },
  shield: { d: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', n: [[12, 11]] },
  'second-opinion': { d: 'M8 7H4v4M4.5 11A8 8 0 1 0 7 6', n: [[12, 12]] },
  'time-out': { d: 'M12 7v5l3 2M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z', n: [[12, 12]] },
  mutation: { d: 'M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12M9 7h6M9 17h6', n: [[12, 12]] },
  crispr: { d: 'M6 6l12 12M18 6L6 18M4 4a2 2 0 1 0 4 4M20 4a2 2 0 1 1-4 4', n: [[12, 12]] },
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
