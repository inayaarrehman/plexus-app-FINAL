// ---------------------------------------------------------------------
// Homepage tap bloom: the geometry and timing, kept apart from the canvas
// so it can be tested without a browser (components/TapBloom.jsx draws it).
// ---------------------------------------------------------------------
// A tap on empty space sends out a few small nodes; they spread, join into a
// small branching network, a pulse runs out along the links, a few tiny dots
// flicker, and everything fades. A tap on the logo makes a slightly larger
// ring of nodes around the wordmark in the same language.

export const BURST_MS = 1200 // a normal tap
export const BLOOM_MS = 1450 // the logo
export const MAX_BURSTS = 4 // drawn at once; the oldest goes first
export const MIN_GAP_MS = 70 // between bursts, so a burst of taps stays smooth
export const TAP_SLOP_PX = 10 // more movement than this is a drag or scroll
export const TAP_MAX_MS = 600 // a longer press is not a tap

// Timeline, as fractions of the burst's life.
export const PHASE = {
  spreadEnd: 0.32, // nodes have reached their places
  linkStart: 0.18,
  linkEnd: 0.5, // every link fully drawn
  pulseStart: 0.42,
  pulseEnd: 0.82,
  glitterStart: 0.22,
  glitterEnd: 0.92,
  fadeStart: 0.68, // then everything fades to nothing at 1
}

// Small deterministic random source, so a burst can be reproduced in tests.
export function rng(seed = Date.now()) {
  let s = (Math.floor(seed) >>> 0) || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

export const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
const clamp01 = (t) => Math.min(1, Math.max(0, t))
export const span = (t, a, b) => clamp01((t - a) / (b - a))

// Links: a spanning tree from the tap point, each node joined to the nearest
// node already in the network, so it reads as a small branching network and
// a pulse can travel outward along it. `depth` orders the pulse.
function grow(points, rootIndex = 0) {
  const inTree = new Set([rootIndex])
  const depth = { [rootIndex]: 0 }
  const links = []
  while (inTree.size < points.length) {
    let best = null
    for (let i = 0; i < points.length; i++) {
      if (inTree.has(i)) continue
      for (const j of inTree) {
        const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
        if (!best || d < best.d) best = { i, j, d }
      }
    }
    inTree.add(best.i)
    depth[best.i] = depth[best.j] + 1
    links.push({ a: best.j, b: best.i, depth: depth[best.j] })
  }
  return { links, depth }
}

// A normal burst at (x, y) in page coordinates.
//   nodes[0] is the hidden root at the tap point (not drawn); 6 to 10 drawn
//   nodes spread to 22-48px; links grow from the root outward.
export function makeBurst(x, y, { seed, colors = 4 } = {}) {
  const r = rng(seed)
  const count = 6 + Math.floor(r() * 5) // 6..10
  const turn = r() * Math.PI * 2
  const nodes = [{ x: 0, y: 0, tx: 0, ty: 0, size: 0, color: 0, root: true }]
  for (let i = 0; i < count; i++) {
    const a = turn + (i / count) * Math.PI * 2 + (r() - 0.5) * 0.7
    const dist = 22 + r() * 26
    nodes.push({ x: 0, y: 0, tx: Math.cos(a) * dist, ty: Math.sin(a) * dist, size: 2.4 + r() * 1.1, color: Math.floor(r() * colors), delay: r() * 0.08 })
  }
  const { links, depth } = grow(nodes.map((n) => ({ x: n.tx, y: n.ty })))
  const glitter = Array.from({ length: 3 + Math.floor(r() * 3) }, () => {
    const a = r() * Math.PI * 2
    const dist = 12 + r() * 46
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, phase: r() * Math.PI * 2, rate: 18 + r() * 14, size: 0.9 + r() * 0.6 }
  })
  const maxDepth = Math.max(...Object.values(depth))
  return { kind: 'tap', x, y, nodes, links, glitter, maxDepth, duration: BURST_MS }
}

// The logo bloom: a ring of nodes around the wordmark's box (page coords),
// joined around the ring with a few spokes, the pulse running both ways.
export function makeBloom(box, { seed, colors = 4 } = {}) {
  const r = rng(seed)
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const rx = box.w / 2 + 18
  const ry = box.h / 2 + 14
  const count = 12 + Math.floor(r() * 3) // 12..14
  const nodes = [{ x: 0, y: 0, tx: 0, ty: 0, size: 0, color: 0, root: true }]
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (r() - 0.5) * 0.25 - Math.PI / 2
    const k = 1 + (r() - 0.5) * 0.22
    nodes.push({ x: 0, y: 0, tx: Math.cos(a) * rx * k, ty: Math.sin(a) * ry * k, size: 2.6 + r() * 1.2, color: i % colors, delay: (i / count) * 0.12 })
  }
  // Around the ring from the top node (1), both directions, so the pulse
  // splits at the top and meets near the bottom. Ring nodes are 1..count.
  const links = []
  const h = Math.floor(count / 2)
  for (let i = 1; i <= h; i++) links.push({ a: i, b: i + 1, depth: i - 1 })
  links.push({ a: 1, b: count, depth: 0 })
  for (let j = count - 1; j > h + 1; j--) links.push({ a: j + 1, b: j, depth: count - j })
  // A few short spokes outward for a branching edge.
  for (let k = 0; k < 4; k++) {
    const i = 1 + Math.floor(r() * count)
    const p = nodes[i]
    const len = 1 + 0.18 + r() * 0.12
    nodes.push({ x: 0, y: 0, tx: p.tx * len, ty: p.ty * len, size: 1.8 + r() * 0.6, color: (i + 1) % colors, delay: 0.1 + r() * 0.08 })
    links.push({ a: i, b: nodes.length - 1, depth: (links.find((l) => l.b === i)?.depth ?? 0) + 1 })
  }
  const glitter = Array.from({ length: 6 }, () => {
    const a = r() * Math.PI * 2
    return { x: Math.cos(a) * (rx + 8 + r() * 18), y: Math.sin(a) * (ry + 6 + r() * 14), phase: r() * Math.PI * 2, rate: 16 + r() * 14, size: 0.9 + r() * 0.7 }
  })
  const maxDepth = Math.max(...links.map((l) => l.depth)) + 1
  return { kind: 'logo', x: cx, y: cy, nodes, links, glitter, maxDepth, duration: BLOOM_MS }
}

// Where each part is at time t (0..1 of the burst's life): node positions and
// alpha, how much of each link is drawn, where the pulses are, glitter alpha.
export function frame(b, t) {
  const fade = 1 - easeOut(span(t, PHASE.fadeStart, 1))
  const nodes = b.nodes.map((n) => {
    const k = easeOut(span(t, n.delay || 0, PHASE.spreadEnd + (n.delay || 0)))
    return { x: n.tx * k, y: n.ty * k, size: n.size * (0.55 + 0.45 * k), alpha: n.root ? 0 : Math.min(1, k * 1.6) * fade, color: n.color }
  })
  const per = b.maxDepth > 0 ? 1 / (b.maxDepth + 1) : 1
  const links = b.links.map((l) => {
    const start = PHASE.linkStart + (PHASE.linkEnd - PHASE.linkStart) * l.depth * per
    const drawn = easeOut(span(t, start, start + (PHASE.linkEnd - PHASE.linkStart) * per * 1.4))
    const pStart = PHASE.pulseStart + (PHASE.pulseEnd - PHASE.pulseStart) * l.depth * per
    const pulse = span(t, pStart, pStart + (PHASE.pulseEnd - PHASE.pulseStart) * per)
    return { a: l.a, b: l.b, drawn, pulse: pulse > 0 && pulse < 1 ? pulse : null, alpha: fade }
  })
  const g = span(t, PHASE.glitterStart, PHASE.glitterEnd)
  const glitter = b.glitter.map((d) => ({ x: d.x, y: d.y, size: d.size, alpha: g > 0 && g < 1 ? Math.max(0, Math.sin(d.phase + g * d.rate)) * Math.sin(g * Math.PI) * fade : 0 }))
  return { nodes, links, glitter, done: t >= 1 }
}

// Should a tap on this element bloom? Never on controls, navigation, forms,
// dialogs or the floating notices; the logo is the one intended exception.
const CONTROLS = 'a, button, input, select, textarea, label, summary, details, option, video, audio, [role="button"], [role="link"], [role="tab"], [role="switch"], [role="checkbox"], [role="menuitem"], [role="slider"], [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
const NO_BLOOM = 'nav, .app-nav, .modal, .modal-backdrop, [role="dialog"], [role="alertdialog"], [aria-modal="true"], .install-hint, .lock-notice, .toast'
export const LOGO = '.home-nav-brand'
export function tapKind(el) {
  if (!el || typeof el.closest !== 'function') return null
  if (el.closest(LOGO)) return el.closest(CONTROLS) ? null : 'logo'
  if (el.closest(CONTROLS) || el.closest(NO_BLOOM)) return null
  return 'tap'
}
