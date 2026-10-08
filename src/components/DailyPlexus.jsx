import React, { useEffect, useMemo, useState } from 'react'
import { groupColor } from './GroupMotif.jsx'

// ---------------------------------------------------------------------
// Today's Plexus on Home: the Daily drawn as its own constellation.
// ---------------------------------------------------------------------
// Sixteen nodes, one per concept, in four groups of four. What it shows is
// the player's real progress on today's board (the saved game), never a
// decoration:
//   - not started: all sixteen nodes loose and muted, waiting to be sorted
//   - a group solved: its four nodes gather, take the group's colour and
//     connect in that group's shape (the same chain / hub / cluster / mesh
//     topologies as everywhere else in Plexus)
//   - finished: each group links to a shared centre node, so the four
//     connections become one Plexus. Groups not found on a lost board are
//     drawn open and dashed, so the picture stays honest.
// Positions come from the puzzle id, so today's Plexus always looks the same
// and carries nothing about the answers.
//
// Motion is short and only on change: groups solved since the last time Home
// was shown gather and connect once, and finishing draws the centre links
// once. A gentle entrance plays on the first Home view of a session. With
// reduced motion everything appears in place.

const W = 320
const H = 178
const CX = W / 2
const CY = H / 2

function hash(str) {
  let h = 2166136261 >>> 0
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Links between a group's four nodes, by difficulty (matches GroupMotif).
const TOPOLOGY = {
  1: [[0, 1], [1, 2], [2, 3]], // chain
  2: [[0, 1], [0, 2], [0, 3]], // hub
  3: [[0, 1], [1, 2], [2, 0], [2, 3]], // cluster
  4: [[0, 1], [1, 2], [2, 0], [1, 3], [2, 3]], // mesh
}

export function dailyPlexusLayout(seed, levels) {
  const r = rng(hash(`daily-plexus-${seed}`))
  const turn = r() * Math.PI * 2
  // Group anchors: four quadrants around the centre, slightly uneven.
  const groups = levels.map((level, g) => {
    const ang = turn + (g * Math.PI) / 2 + (r() - 0.5) * 0.5
    const ax = CX + Math.cos(ang) * (92 + r() * 14)
    const ay = CY + Math.sin(ang) * (44 + r() * 8)
    const rot = r() * Math.PI * 2
    const nodes =
      level === 2
        ? [[ax, ay], ...[0, 1, 2].map((k) => [ax + Math.cos(rot + (k * 2 * Math.PI) / 3) * 23, ay + Math.sin(rot + (k * 2 * Math.PI) / 3) * 18])]
        : [0, 1, 2, 3].map((k) => {
            const a = rot + (k * Math.PI) / 2 + (r() - 0.5) * 0.5
            const d = 18 + r() * 8
            return [ax + Math.cos(a) * d, ay + Math.sin(a) * d * 0.78]
          })
    // The node nearest the centre carries the link into the Plexus.
    let near = 0
    nodes.forEach(([x, y], i) => {
      if (Math.hypot(x - CX, y - CY) < Math.hypot(nodes[near][0] - CX, nodes[near][1] - CY)) near = i
    })
    return { level, nodes, near }
  })
  // Loose positions: sixteen points spread over the field, kept apart.
  const loose = []
  let guard = 0
  while (loose.length < 16 && guard++ < 4000) {
    const x = 26 + r() * (W - 52)
    const y = 14 + r() * (H - 28)
    if (loose.every(([lx, ly]) => Math.hypot(lx - x, ly - y) > 29)) loose.push([x, y])
  }
  while (loose.length < 16) loose.push([26 + r() * (W - 52), 18 + r() * (H - 36)])
  return { groups, loose }
}

function reducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

// `solved`: category indexes the player found. `finished`: the board is over
// (won or lost). `fresh`: indexes to animate in now. `freshFinish`: draw the
// centre links now. `entrance`: play the first-view entrance.
export default function DailyPlexus({ puzzle, solved = [], finished = false, fresh = [], freshFinish = false, entrance = false, label, onActivate }) {
  const cats = puzzle?.categories || []
  // Groups ordered Easy to Expert so colour and shape follow difficulty.
  const order = useMemo(() => cats.map((c, i) => ({ i, level: c.level })).sort((a, b) => a.level - b.level), [cats])
  const lay = useMemo(() => dailyPlexusLayout(puzzle?.id || 'daily', order.map((o) => o.level)), [puzzle?.id, order])
  const found = new Set(solved)

  // Fresh groups start loose and gather one frame later, so the move plays.
  const [settled, setSettled] = useState(() => fresh.length === 0 && !freshFinish)
  useEffect(() => {
    if (settled) return undefined
    if (reducedMotion()) {
      setSettled(true)
      return undefined
    }
    let a = 0
    let b = 0
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setSettled(true))
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [settled])
  const freshSet = new Set(fresh)

  const state = finished ? 'finished' : solved.length ? 'partial' : 'waiting'
  const nodes = []
  const links = []
  const spokes = []
  lay.groups.forEach((g, gi) => {
    const cat = order[gi]
    const isFound = found.has(cat.i)
    const revealed = isFound || finished
    const gather = revealed && !(freshSet.has(cat.i) && !settled)
    const color = groupColor(g.level)
    g.nodes.forEach(([x, y], k) => {
      const [lx, ly] = lay.loose[gi * 4 + k]
      nodes.push({ key: `${gi}-${k}`, x: gather ? x : lx, y: gather ? y : ly, color, found: isFound, revealed, idx: gi * 4 + k, fresh: freshSet.has(cat.i) })
    })
    if (revealed) {
      TOPOLOGY[g.level].forEach(([a, b], li) =>
        links.push({ key: `${gi}-${li}`, a: g.nodes[a], b: g.nodes[b], color, found: isFound, fresh: freshSet.has(cat.i), shown: gather })
      )
    }
    if (finished) spokes.push({ key: `s${gi}`, from: g.nodes[g.near], color, found: isFound })
  })
  const spokesShown = finished && settled

  const cls = `daily-plexus is-${state} ${entrance ? 'is-entrance' : ''} ${freshFinish ? 'is-fresh-finish' : ''}`
  const svg = (
    <svg className="dp-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      {spokesShown &&
        spokes.map((s) => (
          <line
            key={s.key}
            className={`dp-spoke ${s.found ? '' : 'is-missed'}`}
            x1={s.from[0]}
            y1={s.from[1]}
            x2={CX}
            y2={CY}
            pathLength="1"
            style={{ '--dp-color': s.color }}
          />
        ))}
      {links.map((l) =>
        l.shown ? (
          <line
            key={l.key}
            className={`dp-link ${l.found ? '' : 'is-missed'} ${l.fresh ? 'is-fresh' : ''}`}
            x1={l.a[0]}
            y1={l.a[1]}
            x2={l.b[0]}
            y2={l.b[1]}
            pathLength="1"
            style={{ '--dp-color': l.color }}
          />
        ) : null
      )}
      {nodes.map((n) => (
        <g
          key={n.key}
          className={`dp-node ${n.revealed ? (n.found ? 'is-found' : 'is-missed') : ''} ${n.fresh ? 'is-fresh' : ''}`}
          style={{ transform: `translate(${n.x}px, ${n.y}px)`, '--dp-color': n.color, '--dp-i': n.idx }}
        >
          <circle r={n.revealed ? 5.2 : 4.2} />
        </g>
      ))}
      {spokesShown && <circle className="dp-hub" cx={CX} cy={CY} r="6.5" />}
    </svg>
  )
  return onActivate ? (
    <button type="button" className={`${cls} dp-button`} onClick={onActivate} aria-label={label}>
      {svg}
    </button>
  ) : (
    <div className={cls} role="img" aria-label={label}>
      {svg}
    </div>
  )
}
