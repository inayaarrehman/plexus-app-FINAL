import React, { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------
// Splash — the opening animation shown when the app launches.
// ---------------------------------------------------------------------
// Dark purple screen. The Plexus mark (four coloured nodes around a hub)
// draws in, bursts apart with a shockwave and scattering fragments, pulls
// back together, the connecting paths redraw, the wordmark settles in, and
// the whole overlay fades to reveal Home (which is already rendered
// underneath, so there is no loading gap).
//
// Pure CSS animation on one timeline (styles.css, .splash*). Tap anywhere to
// skip. Shown once per launch (sessionStorage), never on the #dev route.
// Reduced motion: a static mark for a moment, then straight in.

const DURATION_MS = 2700
const SESSION_KEY = 'plexus.splashShown.v1'

// Same geometry as BrandMark.jsx (viewBox 0 0 48 48).
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

// Each node flies outward along its line from the hub.
const BURST = 2.1
const nodeVector = (n) => ({ dx: (n.x - HUB.x) * BURST, dy: (n.y - HUB.y) * BURST })

// Small fragments that break off each node and scatter further out.
function fragmentsFor(n, i) {
  const base = Math.atan2(n.y - HUB.y, n.x - HUB.x)
  return [-0.55, 0, 0.55].map((spread, k) => {
    const a = base + spread
    const dist = 30 + ((i * 3 + k) % 3) * 7
    return {
      key: `${i}-${k}`,
      x: n.x,
      y: n.y,
      fx: Math.cos(a) * dist,
      fy: Math.sin(a) * dist,
      r: 1 + ((i + k) % 3) * 0.45,
      color: n.color,
      delay: k * 18,
    }
  })
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

export default function Splash({ onDone }) {
  const [reduced] = useState(prefersReducedMotion)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }

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
      style={{ '--splash-dur': `${DURATION_MS}ms` }}
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
        <svg className="splash-mark" viewBox="-14 -14 76 76" aria-hidden="true">
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

          {/* Fragments that break off and scatter. */}
          {NODES.flatMap(fragmentsFor).map((f) => (
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
          {NODES.map((n, i) => {
            const v = nodeVector(n)
            return (
              <circle
                key={i}
                className="splash-node"
                cx={n.x}
                cy={n.y}
                r="4.6"
                fill={n.color}
                style={{ '--dx': `${v.dx}px`, '--dy': `${v.dy}px`, animationDelay: `${i * 40}ms` }}
              />
            )
          })}

          <circle className="splash-hub" cx={HUB.x} cy={HUB.y} r="3" />
        </svg>

        <div className="splash-wordmark">Plexus</div>
      </div>
    </div>
  )
}
