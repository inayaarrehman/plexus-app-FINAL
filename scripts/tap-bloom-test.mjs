// Homepage tap bloom: geometry, timing bounds and which taps may bloom.
// node scripts/tap-bloom-test.mjs
import * as B from '../src/utils/tapBloom.js'

let fails = 0
let passes = 0
const ok = (c, m) => {
  if (c) passes++
  else {
    fails++
    console.log(`FAIL - ${m}`)
  }
}

console.log('[1] A tap burst: 6 to 10 small nodes, one connected network, gone by the end')
for (let seed = 1; seed <= 300; seed++) {
  const b = B.makeBurst(200, 300, { seed })
  const drawn = b.nodes.filter((n) => !n.root)
  ok(drawn.length >= 6 && drawn.length <= 10, `seed ${seed}: ${drawn.length} nodes`)
  ok(drawn.every((n) => Math.hypot(n.tx, n.ty) <= 50 && n.size >= 2 && n.size <= 3.6), `seed ${seed}: nodes stay small and close (within 50px)`)
  const reached = new Set([0])
  b.links.forEach((l) => reached.add(l.b))
  ok(reached.size === b.nodes.length && b.links.length === b.nodes.length - 1, `seed ${seed}: every node joins one branching network`)
  ok(b.glitter.length >= 3 && b.glitter.length <= 5, `seed ${seed}: a few glitter dots`)
  ok(b.duration >= 1000 && b.duration <= 1500, `seed ${seed}: lasts 1 to 1.5s`)
}

console.log('[2] Timeline: spread, links, pulse, glitter, fade')
{
  const b = B.makeBurst(0, 0, { seed: 42 })
  const at = (t) => B.frame(b, t)
  ok(at(0).nodes.every((n) => n.alpha === 0) && at(0).links.every((l) => l.drawn === 0), 'nothing shows at the moment of the tap')
  ok(at(0.36).nodes.slice(1).every((n) => n.alpha > 0.9), 'nodes have spread by about 0.4s')
  ok(at(0.62).links.every((l) => l.drawn === 1), 'every link is drawn by about 0.75s')
  const pulseTimes = []
  for (let t = 0; t <= 1; t += 0.01) if (at(t).links.some((l) => l.pulse != null)) pulseTimes.push(t)
  ok(pulseTimes.length > 0 && pulseTimes[0] >= B.PHASE.pulseStart - 0.01 && pulseTimes.at(-1) <= B.PHASE.pulseEnd + 0.01, 'the pulse travels after the links form')
  const firstPulse = (d) => { for (let t = 0; t <= 1; t += 0.005) if (at(t).links.some((l, i) => b.links[i].depth === d && l.pulse != null)) return t; return null }
  ok(firstPulse(0) < firstPulse(1), 'the pulse moves outward from the tap point')
  ok(at(0.5).glitter.some((g) => g.alpha > 0) && at(0.1).glitter.every((g) => g.alpha === 0), 'glitter flickers in the middle only')
  const end = at(1)
  ok(end.done && end.nodes.every((n) => n.alpha === 0) && end.links.every((l) => l.alpha === 0) && end.glitter.every((g) => g.alpha === 0), 'fully faded at the end')
}

console.log('[3] Logo bloom: a slightly larger ring round the wordmark')
for (let seed = 1; seed <= 100; seed++) {
  const box = { x: 16, y: 20, w: 92, h: 24 }
  const l = B.makeBloom(box, { seed })
  const t = B.makeBurst(0, 0, { seed })
  const ring = l.nodes.filter((n) => !n.root)
  ok(ring.length > t.nodes.length - 1 && ring.length <= 20, `seed ${seed}: more nodes than a tap (${ring.length}), still bounded`)
  ok(Math.max(...ring.map((n) => Math.abs(n.tx))) > box.w / 2, `seed ${seed}: the ring goes round the wordmark`)
  const seen = new Set()
  l.links.forEach((k) => {
    seen.add(k.a)
    seen.add(k.b)
  })
  ok(ring.every((_, i) => seen.has(i + 1)), `seed ${seed}: every ring node is linked`)
  ok(l.duration > t.duration && l.duration <= 1500, `seed ${seed}: a little longer, within 1.5s`)
}

console.log('[4] Limits')
ok(B.MAX_BURSTS >= 2 && B.MAX_BURSTS <= 6 && B.MIN_GAP_MS >= 40, 'simultaneous bursts and tap rate are bounded')
ok(B.TAP_SLOP_PX <= 12 && B.TAP_MAX_MS <= 800, 'drags and long presses are not taps')

console.log('[5] Only empty space and the logo bloom')
// Minimal stand-in for an element: `closest` matches any selector in the list
// that names one of the element's own tags/classes/attributes or an ancestor's.
const el = (...selfAndAncestors) => ({
  closest(sel) {
    const parts = sel.split(',').map((s) => s.trim())
    return parts.some((p) => selfAndAncestors.includes(p)) ? this : null
  },
})
ok(B.tapKind(el('p')) === 'tap', 'plain text or space: bloom')
ok(B.tapKind(el('section')) === 'tap', 'an empty section: bloom')
for (const c of ['a', 'button', 'input', 'select', 'textarea', 'label', 'summary', '[role="button"]', '[role="tab"]', '[role="link"]', '[tabindex]:not([tabindex="-1"])'])
  ok(B.tapKind(el(c)) === null, `${c}: no bloom`)
for (const c of ['nav', '.app-nav', '.modal', '.modal-backdrop', '[role="dialog"]', '.install-hint', '.lock-notice', '.toast'])
  ok(B.tapKind(el(c)) === null, `${c}: no bloom`)
ok(B.tapKind(el('.home-nav-brand', 'nav')) === 'logo', 'the logo inside the nav: the logo bloom, and only that')
ok(B.tapKind(el('.home-nav-brand', 'a')) === null, 'if the logo ever becomes a link it is left alone')
ok(B.tapKind(null) === null, 'no element: nothing')

console.log(fails ? `\n${fails} FAILED (${passes} passed)` : `\nALL TAP BLOOM CHECKS PASSED (${passes} passed)`)
process.exit(fails ? 1 : 0)
