// Milestone badge: a growing plexus. Each milestone (Level 10, 20, 30, then
// every 5) branches further; from Level 30 the endings link into a web, from
// Level 40 a second ring is added, and the rim takes the four node colours in
// turn. The pattern is drawn from the level number, so every badge is the
// same everywhere and no two milestones look alike.
//   level     the milestone level the badge stands for (10, 20, 30, 35 ...)
//   state     'earned' (full colour), 'next' (outline, rim fills with
//             `progress`), 'locked' (outline only)
//   animate   plays the growing animation once (Milestone reached)
//   bare      hides the level number
import { useMemo } from 'react'
import { MILESTONE_LEVELS, MILESTONE_EVERY_AFTER } from '../progression/config.js'

const RIM = ['var(--jewel-terracotta)', 'var(--jewel-peacock)', 'var(--jewel-cobalt)', 'var(--jewel-plum)']
const TIPS = ['pb-tip-terracotta', 'pb-tip-peacock', 'pb-tip-cobalt', 'pb-tip-plum']
const C = 2 * Math.PI * 46

// 1 for Level 10, 2 for 20, 3 for 30, 4 for 35 ...
export function milestoneTier(level) {
  const last = MILESTONE_LEVELS[MILESTONE_LEVELS.length - 1]
  if (level <= last) return Math.max(1, MILESTONE_LEVELS.filter((l) => l <= level).length)
  return MILESTONE_LEVELS.length + Math.max(1, Math.round((level - last) / MILESTONE_EVERY_AFTER))
}

function drawPlexus(level) {
  const tier = milestoneTier(level)
  let seed = level * 9973 + 17
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const primaries = 3 + Math.floor(tier / 2)
  const depth = Math.min(1 + Math.ceil(tier / 2), 4)
  const cx = 50
  const cy = 48
  const paths = ['', '', '']
  const tips = []
  const f = (n) => n.toFixed(2)
  const grow = (x, y, ang, len, d) => {
    let x2 = x + Math.cos(ang) * len
    let y2 = y + Math.sin(ang) * len
    const r = Math.hypot(x2 - cx, y2 - cy)
    if (r > 40) {
      x2 = cx + ((x2 - cx) * 40) / r
      y2 = cy + ((y2 - cy) * 40) / r
    }
    paths[Math.min(d, 2)] += `M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}`
    if (d + 1 >= depth) {
      tips.push({ x: x2, y: y2, a: Math.atan2(y2 - cy, x2 - cx) })
      return
    }
    const spread = 0.42 + rnd() * 0.18
    grow(x2, y2, ang - spread, len * 0.74, d + 1)
    grow(x2, y2, ang + spread, len * 0.74, d + 1)
  }
  const first = 30 / depth + 6
  for (let i = 0; i < primaries; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / primaries + (rnd() - 0.5) * 0.3
    grow(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, a, first, 0)
  }
  const r = tier >= 5 ? 1.7 : 2.2
  const dots = ['', '', '', '']
  tips.forEach((t, j) => {
    dots[j % 4] += `M${f(t.x - r)} ${f(t.y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
  })
  let web = ''
  if (tier >= 3) {
    const s = [...tips].sort((p, q) => p.a - q.a)
    s.forEach((p, w) => {
      const n = s[(w + 1) % s.length]
      web += `M${f(p.x)} ${f(p.y)}L${f(n.x)} ${f(n.y)}`
    })
  }
  return { tier, paths, dots, web, ends: tips.length }
}

export default function PlexusBadge({ level, state = 'earned', progress = 0, size = 64, animate = false, bare = false, className = '', label, decorative = false }) {
  const art = useMemo(() => drawPlexus(level), [level])
  const earned = state === 'earned'
  const accent = RIM[(art.tier - 1) % 4]
  const name = label || `Level ${level} milestone badge${earned ? '' : state === 'next' ? ', next milestone' : ', not reached yet'}`
  const a = (c) => (animate ? c : undefined)
  return (
    <svg
      className={`plexus-badge is-${state} ${animate ? 'is-animating' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ '--pb-accent': accent }}
      {...(decorative ? { 'aria-hidden': 'true', focusable: 'false' } : { role: 'img', 'aria-label': name })}
    >
      <circle className={`pb-disc ${a('pb-a-disc') || ''}`} cx="50" cy="48" r="46" />
      <circle className={`pb-rim ${a('pb-a-rim') || ''}`} cx="50" cy="48" r="46" transform="rotate(-90 50 48)" style={animate ? { strokeDasharray: C } : undefined} />
      {state === 'next' && <circle className="pb-arc" cx="50" cy="48" r="46" transform="rotate(-90 50 48)" style={{ strokeDasharray: `${(C * Math.max(0, Math.min(1, progress))).toFixed(1)} ${C.toFixed(1)}` }} />}
      {earned && art.tier >= 5 && <circle className={`pb-ring2 ${a('pb-a-fade2') || ''}`} cx="50" cy="48" r="42.5" />}
      <g className="pb-net">
        {art.web && <path className={`pb-web ${a('pb-a-web') || ''}`} d={art.web} />}
        <path className={`pb-b0 ${a('pb-a-b0') || ''}`} d={art.paths[0]} />
        {art.paths[1] && <path className={`pb-b1 ${a('pb-a-b1') || ''}`} d={art.paths[1]} />}
        {art.paths[2] && <path className={`pb-b2 ${a('pb-a-b2') || ''}`} d={art.paths[2]} />}
        {art.dots.map((d, i) => d && <path key={i} className={`pb-tip ${TIPS[i]} ${a(`pb-a-tip pb-a-t${i}`) || ''}`} d={d} />)}
      </g>
      <circle className={`pb-soma ${a('pb-a-soma') || ''}`} cx="50" cy="48" r="6" />
      {!bare && (
        <g className={`pb-pill ${a('pb-a-pill') || ''}`}>
          <rect x="36" y="88" width="28" height="12" rx="6" />
          <text x="50" y="97">
            {level}
          </text>
        </g>
      )}
    </svg>
  )
}
