import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------
// Splash — the opening animation shown when the app launches.
// ---------------------------------------------------------------------
// The screen itself is the canvas. The intro is one full-viewport SVG whose
// coordinate system IS the viewport (viewBox = width × height in px, sized
// with 100dvh), so nothing is confined to a box and nothing is stretched.
//
// Sequence: the compact Plexus mark appears at centre → it bursts → its four
// nodes travel out to clusters across the screen while satellite nodes split
// off and spread toward the edges → connections draw outward from the centre,
// leading the eye across the viewport → the full-screen network holds, then
// drifts gently outward as the overlay fades into Home. It never snaps back
// into a small box.
//
// Positions are composed per viewport (a tall-phone layout and a wide layout),
// mapped into the safe area so nodes can approach its edges. Node sizes stay
// close to the original; the expansion comes from distance, not scale.
//
// Tap anywhere to skip. Once per launch (sessionStorage), never on #dev.
// Reduced motion: the finished network appears still, then fades in to Home.

const DURATION_MS = 3400
const SESSION_KEY = 'plexus.splashShown.v1'

// Canonical jewel palette (theme-independent; see --jewel-* in styles.css).
const JEWELS = ['terracotta', 'peacock', 'cobalt', 'plum']
const FALLBACK = { terracotta: '#bf5236', peacock: '#087f78', cobalt: '#3267c8', plum: '#7a49b2' }
const jewel = (name, variant = '') =>
  `var(--jewel-${name}${variant ? `-${variant}` : ''}, ${FALLBACK[name]})`
const COLORS = JEWELS.map((n) => jewel(n))
// Satellites: subtle same-family depth. Medium satellites take the deeper
// variant, tiny ones the more subdued variant (flat fills, no effects).
const SAT_SIZE = [0.62, 0.48, 0.7, 0.42]
const SAT_VARIANT = ['deep', 'soft', 'deep', 'soft']

// Compact mark offsets from the hub (BrandMark geometry, scaled to screen px).
const MARK = [
  { x: -14, y: -10 },
  { x: 10, y: -14 },
  { x: 13, y: 10 },
  { x: -10, y: 14 },
]
const MARK_SCALE = 2.6

// Composed layouts as fractions of the safe area (0..1). Deliberately
// asymmetric and organic: some clusters tight, some reaching far, satellites
// pushed toward the edges. `main` = where each of the four mark nodes settles;
// `sats[i]` = satellites that split off from main node i.
const LAYOUTS = {
  // Tall phone portrait.
  portrait: {
    hub: [0.5, 0.45],
    main: [
      [0.22, 0.27],
      [0.69, 0.19],
      [0.8, 0.53],
      [0.3, 0.71],
    ],
    sats: [
      [[0.09, 0.13], [0.33, 0.06], [0.06, 0.38]],
      [[0.57, 0.05], [0.92, 0.1], [0.86, 0.31]],
      [[0.96, 0.43], [0.74, 0.69], [0.93, 0.82]],
      [[0.07, 0.6], [0.14, 0.86], [0.42, 0.9], [0.63, 0.97]],
    ],
    cross: [
      [[0, 1], [1, 0]], // across the top edge
      [[1, 2], [2, 0]], // down the right side
      [[2, 2], [3, 3]], // across the bottom
      [[3, 0], [0, 2]], // up the left side
    ],
  },
  // Landscape / desktop: wider spread, shallower vertical reach.
  wide: {
    hub: [0.5, 0.47],
    main: [
      [0.3, 0.28],
      [0.65, 0.22],
      [0.74, 0.64],
      [0.36, 0.73],
    ],
    sats: [
      [[0.1, 0.16], [0.21, 0.06], [0.07, 0.48]],
      [[0.51, 0.06], [0.86, 0.1], [0.94, 0.34]],
      [[0.96, 0.6], [0.88, 0.87], [0.62, 0.92]],
      [[0.15, 0.72], [0.24, 0.94], [0.44, 0.97]],
    ],
    cross: [
      [[0, 1], [1, 0]],
      [[1, 2], [2, 0]],
      [[2, 2], [3, 2]],
      [[3, 0], [0, 2]],
    ],
  },
}

function readSafeArea() {
  if (typeof document === 'undefined') return { t: 0, r: 0, b: 0, l: 0 }
  try {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
    document.body.appendChild(probe)
    const cs = getComputedStyle(probe)
    const v = (p) => parseFloat(cs[p]) || 0
    const out = { t: v('paddingTop'), r: v('paddingRight'), b: v('paddingBottom'), l: v('paddingLeft') }
    probe.remove()
    return out
  } catch {
    return { t: 0, r: 0, b: 0, l: 0 }
  }
}

// Build the full-screen network for a viewport.
export function buildScene(W, H, safe = { t: 0, r: 0, b: 0, l: 0 }) {
  const layout = W / H > 1.05 ? LAYOUTS.wide : LAYOUTS.portrait
  const fx0 = safe.l
  const fy0 = safe.t
  const fw = Math.max(1, W - safe.l - safe.r)
  const fh = Math.max(1, H - safe.t - safe.b)
  const mx = fw * 0.035
  const my = fh * 0.03
  const at = ([u, v]) => ({ x: fx0 + mx + u * (fw - 2 * mx), y: fy0 + my + v * (fh - 2 * my) })

  // Node sizes track the original mark (~12px) with a gentle viewport response.
  const base = Math.max(9, Math.min(14, Math.min(W, H) / 32))
  const hub = at(layout.hub)

  const mains = layout.main.map((p, i) => {
    const start = { x: hub.x + MARK[i].x * MARK_SCALE, y: hub.y + MARK[i].y * MARK_SCALE }
    const end = at(p)
    return { i, color: COLORS[i], r: base, start, end, tx: end.x - start.x, ty: end.y - start.y }
  })

  const sats = []
  layout.sats.forEach((list, i) => {
    list.forEach((p, k) => {
      const parent = mains[i]
      const end = at(p)
      sats.push({
        key: `${i}-${k}`,
        parent: i,
        k,
        color: jewel(JEWELS[i], SAT_VARIANT[k % 4]),
        r: base * SAT_SIZE[k % 4],
        start: parent.start,
        end,
        tx: end.x - parent.start.x,
        ty: end.y - parent.start.y,
        delay: 1000 + i * 45 + k * 70,
        dur: 950 + k * 90,
      })
    })
  })

  // Sparse connections that lead the eye outward and around the screen.
  const satAt = (i, k) => sats.find((s) => s.parent === i && s.k === k)
  const lines = []
  mains.forEach((m) => lines.push({ key: `h${m.i}`, a: hub, b: m.end, tone: 'hub', delay: 1260 + m.i * 60, dur: 460 }))
  sats.forEach((s) =>
    lines.push({
      key: `s${s.key}`,
      a: mains[s.parent].end,
      b: s.end,
      tone: COLORS[s.parent], // connections keep the cluster's primary jewel tone
      delay: Math.round(s.delay + s.dur * 0.45),
      dur: 520,
    })
  )
  layout.cross.forEach(([[ia, ka], [ib, kb]], n) => {
    const a = satAt(ia, ka)
    const b = satAt(ib, kb)
    if (a && b) lines.push({ key: `c${n}`, a: a.end, b: b.end, tone: 'cross', delay: 2150 + n * 90, dur: 560 })
  })

  // Shockwave sized to clear the farthest corner.
  const far = Math.max(
    Math.hypot(hub.x, hub.y),
    Math.hypot(W - hub.x, hub.y),
    Math.hypot(hub.x, H - hub.y),
    Math.hypot(W - hub.x, H - hub.y)
  )

  return { W, H, hub, base, mains, sats, lines, waveScale: (far + 30) / 8 }
}

export function shouldShowSplash() {
  if (typeof window === 'undefined') return false
  if (window.location.hash === '#dev') return false
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* storage blocked: still show it once for this mount */
  }
  return true
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function viewportSize() {
  if (typeof window === 'undefined') return { W: 390, H: 844 }
  const vv = window.visualViewport
  return {
    W: Math.round(vv?.width || window.innerWidth || 390),
    H: Math.round(vv?.height || window.innerHeight || 844),
  }
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function Splash({ onDone }) {
  const [reduced] = useState(prefersReducedMotion)
  const [scene, setScene] = useState(() => {
    const { W, H } = viewportSize()
    return buildScene(W, H)
  })
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }

  // Compose for the real viewport + safe area before first paint.
  useIsoLayoutEffect(() => {
    const { W, H } = viewportSize()
    setScene(buildScene(W, H, readSafeArea()))
  }, [])

  useEffect(() => {
    document.getElementById('boot-splash')?.remove()
    const t = setTimeout(finish, reduced ? 1100 : DURATION_MS + 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { W, H, hub, base, mains, sats, lines, waveScale } = scene
  const ms = (n) => `${n}ms`

  return (
    <div
      className={`splash sp3 ${reduced ? 'is-static' : ''}`}
      style={{ '--splash-dur': ms(DURATION_MS) }}
      onClick={finish}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) finish()
      }}
      role="button"
      tabIndex={0}
      aria-label="Plexus. Tap to skip intro."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish()
      }}
    >
      <svg className="sp-canvas" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* Everything drifts gently outward together at the very end. */}
        <g className="sp-net" style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}>
          {/* Shockwave at the burst. */}
          <circle
            className="sp-wave"
            cx={hub.x}
            cy={hub.y}
            r="8"
            style={{ transformOrigin: `${hub.x}px ${hub.y}px`, '--wave-scale': waveScale }}
          />

          {/* The compact mark's own paths: draw in, then release at the burst. */}
          {[[0, 1], [1, 2], [2, 3], [3, 0], [0, 'h'], [1, 'h'], [2, 'h'], [3, 'h']].map(([a, b], n) => {
            const p = mains[a].start
            const q = b === 'h' ? hub : mains[b].start
            return (
              <line
                key={`m${n}`}
                className="sp-markpath"
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                pathLength="1"
                style={{ animationDelay: ms(240 + n * 22) }}
              />
            )
          })}

          {/* Network connections, drawn outward once the nodes have arrived. */}
          {lines.map((l) => (
            <line
              key={l.key}
              className={`sp-link sp-link-${l.tone === 'hub' || l.tone === 'cross' ? l.tone : 'cluster'}`}
              x1={l.a.x}
              y1={l.a.y}
              x2={l.b.x}
              y2={l.b.y}
              pathLength="1"
              style={{
                animationDelay: ms(l.delay),
                animationDuration: ms(l.dur),
                ...(l.tone !== 'hub' && l.tone !== 'cross' ? { stroke: l.tone } : null),
              }}
            />
          ))}

          {/* Satellites split off from their parent node and spread outward. */}
          {sats.map((s) => (
            <g
              key={s.key}
              className="sp-travel"
              style={{ '--tx': `${s.tx}px`, '--ty': `${s.ty}px`, animationDelay: ms(s.delay), animationDuration: ms(s.dur) }}
            >
              <circle
                className="sp-sat"
                cx={s.start.x}
                cy={s.start.y}
                r={s.r}
                fill={s.color}
                style={{ animationDelay: ms(s.delay - 40) }}
              />
            </g>
          ))}

          {/* The four mark nodes travel to their clusters. */}
          {mains.map((m) => (
            <g
              key={m.i}
              className="sp-travel sp-travel-main"
              style={{ '--tx': `${m.tx}px`, '--ty': `${m.ty}px`, animationDelay: ms(960 + m.i * 40) }}
            >
              <circle
                className="sp-main"
                cx={m.start.x}
                cy={m.start.y}
                r={m.r}
                fill={m.color}
                style={{ animationDelay: ms(m.i * 45) }}
              />
            </g>
          ))}

          {/* The hub stays at the centre of the network. */}
          <g className="sp-hubflash" style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}>
            <circle className="sp-hub" cx={hub.x} cy={hub.y} r={base * 0.62} />
          </g>

          {/* Wordmark under the hub; a background-coloured halo lets the
              network lines pass cleanly behind it. */}
          <text className="sp-word" x={hub.x} y={hub.y + base * 3} textAnchor="middle" dominantBaseline="middle">
            PLEXUS
          </text>
        </g>
      </svg>
    </div>
  )
}
