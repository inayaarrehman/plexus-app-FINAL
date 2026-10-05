import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------
// Splash — the opening animation shown when the app launches.
// ---------------------------------------------------------------------
// Dark purple screen. The Plexus mark (four coloured nodes around a hub)
// draws in, then bursts apart: the nodes and scattering fragments fly all the
// way OFF the edges of the screen, a shockwave sweeps outward, then every
// piece flies back in from off-screen and snaps together, the paths redraw,
// the wordmark settles in, and the overlay fades to reveal Home (already
// rendered underneath, so there is no loading gap).
//
// Flight distances are measured from the real screen on mount, so pieces
// always clear the edges on any phone or desktop size. Pure CSS animation on
// one timeline (styles.css, .splash*). Tap anywhere to skip. Shown once per
// launch (sessionStorage), never on the #dev route. Reduced motion: a still
// mark for a moment, then straight in.

const DURATION_MS = 3100
const SESSION_KEY = 'plexus.splashShown.v1'

// Same geometry as BrandMark.jsx; the SVG viewBox is padded around it.
const VB = { x: -14, y: -14, w: 76 }
const HUB = { x: 26, y: 24 }
const NODES = [
  { x: 12, y: 14, color: 'var(--difficulty-easy, #bb4c34)' },
  { x: 36, y: 10, color: 'var(--difficulty-medium, #0f7a76)' },
  { x: 39, y: 34, color: 'var(--difficulty-hard, #3568c4)' },
  { x: 16, y: 38, color: 'var(--difficulty-expert, #8c4fc2)' },
]
const PATHS = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [0, 'hub'], [1, 'hub'], [2, 'hub'], [3, 'hub'],
]
const FRAG_SPREAD = [-0.6, -0.2, 0.25, 0.65]

// Distance (in screen px) from point (sx, sy) travelling along unit vector
// (ux, uy) until it leaves a W×H viewport.
function exitDistance(sx, sy, ux, uy, W, H) {
  const ts = []
  if (ux > 0.0001) ts.push((W - sx) / ux)
  if (ux < -0.0001) ts.push(-sx / ux)
  if (uy > 0.0001) ts.push((H - sy) / uy)
  if (uy < -0.0001) ts.push(-sy / uy)
  return ts.length ? Math.max(0, Math.min(...ts)) : Math.max(W, H)
}

// Build every piece's flight vector (in SVG user units) so it clears the
// screen edge. `scale` = screen px per SVG unit; (ox, oy) = SVG origin on screen.
function computeFlights({ scale, ox, oy, W, H }) {
  const toScreen = (p) => ({ x: ox + (p.x - VB.x) * scale, y: oy + (p.y - VB.y) * scale })

  const nodes = NODES.map((n, i) => {
    const vx = n.x - HUB.x
    const vy = n.y - HUB.y
    const len = Math.hypot(vx, vy) || 1
    const ux = vx / len
    const uy = vy / len
    const s = toScreen(n)
    const px = exitDistance(s.x, s.y, ux, uy, W, H) + 70 + i * 12 // clear the edge
    const d = px / scale
    return { dx: ux * d, dy: uy * d }
  })

  const frags = NODES.flatMap((n, i) => {
    const base = Math.atan2(n.y - HUB.y, n.x - HUB.x)
    const s = toScreen(n)
    return FRAG_SPREAD.map((spread, k) => {
      const a = base + spread
      const ux = Math.cos(a)
      const uy = Math.sin(a)
      const px = exitDistance(s.x, s.y, ux, uy, W, H) + 40 + ((i + k) % 4) * 30
      const d = px / scale
      return {
        key: `${i}-${k}`,
        x: n.x,
        y: n.y,
        fx: ux * d,
        fy: uy * d,
        r: 0.9 + ((i * 2 + k) % 3) * 0.45,
        color: n.color,
        delay: k * 22 + i * 10,
      }
    })
  })

  // Shockwave sized to sweep past the farthest corner.
  const hub = toScreen(HUB)
  const far = Math.max(
    Math.hypot(hub.x, hub.y),
    Math.hypot(W - hub.x, hub.y),
    Math.hypot(hub.x, H - hub.y),
    Math.hypot(W - hub.x, H - hub.y)
  )
  const waveScale = (far + 40) / scale / 6 // ring radius is 6 units

  return { nodes, frags, waveScale }
}

// Reasonable defaults before measurement (and for SSR/tests): ~off a phone.
function defaultFlights() {
  return computeFlights({ scale: 2.9, ox: 85, oy: 220, W: 390, H: 760 })
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

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function Splash({ onDone }) {
  const [reduced] = useState(prefersReducedMotion)
  const [flights, setFlights] = useState(defaultFlights)
  const svgRef = useRef(null)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }

  // Measure the real screen before first paint so every piece clears the edges.
  useIsoLayoutEffect(() => {
    const el = svgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (!r.width) return
    setFlights(
      computeFlights({
        scale: r.width / VB.w,
        ox: r.left,
        oy: r.top,
        W: window.innerWidth,
        H: window.innerHeight,
      })
    )
  }, [])

  useEffect(() => {
    // Remove the static boot cover from index.html now that React has painted
    // the same dark screen, so there is no flash between the two.
    document.getElementById('boot-splash')?.remove()
    // Safety net in case animationend never fires (backgrounded tab, etc.).
    const t = setTimeout(finish, reduced ? 900 : DURATION_MS + 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const point = (ref) => (ref === 'hub' ? HUB : NODES[ref])

  return (
    <div
      className={`splash ${reduced ? 'is-static' : ''}`}
      style={{ '--splash-dur': `${DURATION_MS}ms`, '--wave-scale': flights.waveScale }}
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
      <div className="splash-stage">
        <svg
          ref={svgRef}
          className="splash-mark"
          viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.w}`}
          aria-hidden="true"
        >
          {/* Shockwave ring at the moment of the burst. */}
          <circle className="splash-wave" cx={HUB.x} cy={HUB.y} r="6" />

          {/* Connecting paths: draw in, snap apart, redraw. */}
          <g className="splash-paths">
            {PATHS.map(([a, b], i) => {
              const p = point(a)
              const q = point(b)
              return (
                <line
                  key={i}
                  className="splash-path"
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  pathLength="1"
                  style={{ animationDelay: `${i * 14}ms` }}
                />
              )
            })}
          </g>

          {/* Fragments that break off and fly off-screen, then return. */}
          {flights.frags.map((f) => (
            <circle
              key={f.key}
              className="splash-frag"
              cx={f.x}
              cy={f.y}
              r={f.r}
              fill={f.color}
              style={{ '--fx': `${f.fx}px`, '--fy': `${f.fy}px`, animationDelay: `${f.delay}ms` }}
            />
          ))}

          {/* The four nodes. */}
          {NODES.map((n, i) => (
            <circle
              key={i}
              className="splash-node"
              cx={n.x}
              cy={n.y}
              r="4.6"
              fill={n.color}
              style={{
                '--dx': `${flights.nodes[i].dx}px`,
                '--dy': `${flights.nodes[i].dy}px`,
                animationDelay: `${i * 35}ms`,
              }}
            />
          ))}

          <circle className="splash-hub" cx={HUB.x} cy={HUB.y} r="3" />
        </svg>

        <div className="splash-wordmark">Plexus</div>
      </div>
    </div>
  )
}
