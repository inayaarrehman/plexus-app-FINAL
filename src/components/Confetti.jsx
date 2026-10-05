import React, { useMemo } from 'react'

// ---------------------------------------------------------------------
// Completion confetti — a restrained burst in the Plexus jewel palette.
// ---------------------------------------------------------------------
// Sequence on a full puzzle win (see Game.jsx): the Plexus constellation
// assembles at the top of the result card, and just as its nodes land the
// confetti bursts OUT of the constellation, arcs outward, then falls and fades
// as the result/streak/share state settles. It is an accent to the
// constellation, never the main event: brief (~1.6–2.2s total), contained in
// the result card (which clips it), and coloured only with the jewel tones —
// terracotta, peacock, cobalt, plum, plus their deeper same-family variants —
// so it reads as Plexus rather than generic rainbow confetti.
//
// Shapes stay in the Plexus language: mostly small rectangles, with a few
// round "nodes" and short line segments. Flat fills, no glow or gradients.
// Under prefers-reduced-motion it renders nothing (the constellation and the
// result carry the moment).

const JEWELS = ['terracotta', 'peacock', 'cobalt', 'plum']
const FALLBACK = { terracotta: '#bf5236', peacock: '#087f78', cobalt: '#3267c8', plum: '#7a49b2' }
// Node colours, so the burst reads on whichever room the result card sits in
// (lifted jewel tints on a room, base jewels elsewhere), with an occasional
// warm ivory piece.
const colorFor = (i) => {
  if (i % 7 === 6) return 'var(--ivory-text, #fbf6ee)'
  const name = JEWELS[i % JEWELS.length]
  return `var(--node-${name}, ${FALLBACK[name]})`
}
const SHAPES = ['rect', 'rect', 'rect', 'node', 'line'] // weighted toward rectangles

function prefersReducedMotion() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

// Small deterministic RNG so a given mount looks natural but stable.
function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// `count`: pieces (the Daily gets a slightly fuller burst than a system puzzle).
// `originY`: px from the top of the result card where the constellation sits.
export default function Confetti({ count = 40, originY = 46, seed = 7 }) {
  const pieces = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }).map((_, i) => {
      // Fan out sideways from the constellation with only a small lift (the
      // card's top edge is close, so a tall arc would be clipped), then fall
      // visibly past the heading and fade before the actions.
      const side = i % 2 === 0 ? -1 : 1
      const x = side * (26 + r() * 165)
      const peak = -(6 + r() * 24)
      const size = 5 + r() * 5
      return {
        id: i,
        x,
        peak,
        fall: 190 + r() * 190,
        rot: (r() < 0.5 ? -1 : 1) * (220 + r() * 360),
        delay: 0.5 + r() * 0.18,
        duration: 1.35 + r() * 0.6,
        color: colorFor(i),
        size,
        shape: SHAPES[i % SHAPES.length],
      }
    })
  }, [count, seed])

  if (prefersReducedMotion()) return null

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => {
        const style = {
          top: `${originY}px`,
          backgroundColor: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          '--x': `${p.x}px`,
          '--peak': `${p.peak}px`,
          '--fall': `${p.fall}px`,
          '--rot': `${p.rot}deg`,
        }
        if (p.shape === 'node') {
          style.width = p.size
          style.height = p.size
        } else if (p.shape === 'line') {
          style.width = p.size * 2.2
          style.height = 2
        } else {
          style.width = p.size
          style.height = p.size * 0.5
        }
        return <span key={p.id} className={`confetti-piece confetti-${p.shape}`} style={style} />
      })}
    </div>
  )
}
