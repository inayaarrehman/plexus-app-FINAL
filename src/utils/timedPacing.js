// ---------------------------------------------------------------------
// Timed pacing: difficulty mix per format, Race difficulty curve, and the
// helpers that pick anchors and wrong answers (3 Minutes and Race).
// ---------------------------------------------------------------------
// Tiers come from the content audit's audience recognition (1-5): 1 is
// approachable, 2 moderate, 3 and up challenging (src/utils/timedLibrary.js).
// They are estimates for pacing, not player data.
//
// Each format has its own mix. Formats with more to read (two groups, four
// labels) lean easier so a 3-minute session still fits several rounds;
// formats that test one discrimination (Impostor, Complete) carry more
// challenging rounds. Edit these numbers to retune; they are weights.
import { answerShortcuts, lookAlike, titleLeak, titleHas, boardSurface, words } from './surfaceSignals.js'
import { normalizeTile, shuffleWith } from './puzzleAssembler.js'

export const TIMED_DIFFICULTY = {
  rapidAssociation: [0.3, 0.5, 0.2],
  impostor: [0.2, 0.5, 0.3],
  completeConnection: [0.2, 0.5, 0.3],
  commonLink: [0.3, 0.45, 0.25],
  miniConnections: [0.4, 0.45, 0.15],
  linkTwo: [0.25, 0.5, 0.25],
  sameOrDifferent: [0.35, 0.45, 0.2],
  matchTheLink: [0.4, 0.45, 0.15],
  doubleAgent: [0.3, 0.5, 0.2],
}

// Race: the same ten-round curve in every race (two approachable openers, a
// moderate middle, two challenging rounds), so both players face identical
// rounds and every race has the same shape.
export const RACE_TIER_CURVE = [0, 0, 1, 1, 2, 1, 1, 2, 1, 1]

export const tierOf = (c) => (c && c.tier != null ? c.tier : 1)

// Pick a target tier from a format's mix.
export function drawTier(type, rng) {
  const mix = TIMED_DIFFICULTY[type]
  if (!mix) return null
  const total = mix.reduce((a, b) => a + b, 0)
  let x = rng() * total
  for (let t = 0; t < mix.length; t++) {
    x -= mix[t]
    if (x < 0) return t
  }
  return mix.length - 1
}

// Choose an anchor category: the requested tier when available (else the
// nearest tier), and categories served recently (across sessions on this
// device: `avoid`) only when nothing else is left.
export function pickAnchor(pool, rng, { tier = null, avoid = null, filter = null } = {}) {
  let list = filter ? pool.filter(filter) : pool
  if (!list.length) return null
  if (avoid && avoid.size) {
    const fresh = list.filter((c) => !avoid.has(c.id))
    if (fresh.length) list = fresh
  }
  if (tier != null) {
    for (const d of [0, 1, 2]) {
      const near = list.filter((c) => Math.abs(tierOf(c) - tier) === d)
      if (near.length) {
        list = near
        break
      }
    }
  }
  return list[Math.floor(rng() * list.length)]
}

// Choose `count` wrong answers from a category's checked near misses that
// read like the right answers and leave no wording shortcut. Tries several
// draws and keeps the best: fewest shortcuts, then most look-alike.
//   right   the tiles shown as correct (or shown alongside)
export function pickLookAlike(near, right, count, rng, { tries = 10 } = {}) {
  if (near.length < count) return null
  const scored = near.map((n) => ({ n, s: right.reduce((a, t) => a + lookAlike(n.text, t), 0) / Math.max(1, right.length) }))
  let best = null
  for (let k = 0; k < tries; k++) {
    // Weighted draw toward look-alikes, with randomness so sessions vary.
    const pick = scored
      .map((x) => ({ ...x, key: x.s + rng() * 0.6 }))
      .sort((a, b) => b.key - a.key)
      .slice(0, count)
    const texts = pick.map((x) => x.n.text)
    const shortcuts = answerShortcuts(right, texts).length
    const look = pick.reduce((a, x) => a + x.s, 0)
    if (!best || shortcuts < best.shortcuts || (shortcuts === best.shortcuts && look > best.look)) best = { shortcuts, look, list: pick.map((x) => x.n) }
    if (best.shortcuts === 0 && k >= 3) break
  }
  return best
}

// Impostor: the one wrong answer must not stand out by wording.
export function pickImpostor(near, tiles, rng) {
  if (!near.length) return null
  const ranked = shuffleWith(near, rng)
    .map((n) => ({ n, shortcuts: answerShortcuts(tiles, [n.text]).length, look: tiles.reduce((a, t) => a + lookAlike(n.text, t), 0) + rng() * 0.8 }))
    .sort((a, b) => a.shortcuts - b.shortcuts || b.look - a.look)
  return { impostor: ranked[0].n, shortcuts: ranked[0].shortcuts }
}

// The dominant tile kind of a category ("disease", "drug"...), when known.
export function dominantKind(c) {
  const k = c && c.tileKinds
  if (!k || !k.length) return null
  const counts = {}
  k.forEach((x) => (counts[x] = (counts[x] || 0) + 1))
  const [kind, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return n >= 3 ? kind : null
}

// Wrong titles for "What links these?": same subject and tile kind when
// possible, categories that list one of the shown tiles as a checked near
// miss first (a title known not to fit that tile), never a category that
// contains a shown tile, and a title word that appears in the tiles must
// not be unique to the right answer.
export function pickTitleDistractors(cats, anchor, count, rng) {
  const shown = new Set(anchor.tiles.map(normalizeTile))
  const kind = dominantKind(anchor)
  const leak = titleLeak(anchor.title, anchor.tiles)
  const candidates = cats
    .filter((c) => c.id !== anchor.id && c.title !== anchor.title && !c.tiles.some((t) => shown.has(normalizeTile(t))))
    .map((c) => {
      let w = 0
      if ((c.systems || []).some((s) => (anchor.systems || []).includes(s))) w += 2
      if (kind && dominantKind(c) === kind) w += 2
      if (c.connectionType === anchor.connectionType) w += 0.5
      if ((c.nearMisses || []).some((n) => shown.has(normalizeTile(n.text)))) w += 3
      if (leak.some((x) => titleHas(c.title, x))) w += 2
      return { c, w: w + rng() * 1.5 }
    })
    .sort((a, b) => b.w - a.w)
  const out = []
  const seen = new Set([anchor.title.toLowerCase()])
  for (const { c } of candidates) {
    if (out.length >= count) break
    if (seen.has(c.title.toLowerCase())) continue
    seen.add(c.title.toLowerCase())
    out.push(c.title)
  }
  // A leak that only the right title carries is a wording giveaway.
  const leakAlone = leak.length > 0 && !out.some((t) => leak.some((x) => titleHas(t, x)))
  return { titles: out, leakAlone }
}

// Two groups for a mini board: same tile kind or subject, no wording that
// isolates either group, and a bonus when a tile of one group is a checked
// near miss of the other (a tempting tile known not to belong).
// Groups from the same organ system compete for tiles too easily (a review
// of generated rounds found "low DLCO" and "high A-a gradient" both claiming
// the same lung diseases), so a pair must come from different systems; the
// shared tile kind is what keeps it from sorting at a glance.
export const sameSystem = (a, b) => (a.systems || []).some((x) => (b.systems || []).includes(x))
// Two groups whose tiles share a meaningful word ("Hypotension" and
// "Orthostatic hypotension") invite a swap; keep them apart.
const WEAK_WORDS = new Set(['syndrome', 'disease', 'deficiency', 'chronic', 'acute', 'primary', 'secondary', 'disorder', 'infection', 'failure', 'increased', 'decreased', 'elevated', 'reduced', 'normal', 'positive', 'negative'])
const strongWords = (tiles) => new Set(tiles.flatMap((t) => words(t)).filter((w) => w.length >= 5 && !WEAK_WORDS.has(w)).map((w) => (w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)))
export function sharesTileWord(a, b) {
  const A = strongWords(a.tiles)
  for (const w of strongWords(b.tiles)) if (A.has(w)) return true
  return false
}
// Pairs of groups that a review of generated rounds found sharing members
// (a tile of one also fits the other). Never shown together in Mini
// Connections or Match the Link.
export const TIMED_BLOCKED_PAIRS = [
  ['Causes of a low DLCO', 'Causes of a high A-a gradient'],
  ['Restrictive lung diseases', 'Upper lobe predominant lung disease'],
  ['Causes of a high A-a gradient', 'Causes of respiratory acidosis'],
  ['Starts with "hyper-" but produces a LOW value', 'Causes of hypocalcemia'],
  ['Causes of a low DLCO', 'Restrictive lung diseases'],
  ['Causes of hyperkalemia', 'Causes of hypocalcemia'],
  ['Psychiatric drugs needing drug levels or blood counts', 'Drugs requiring therapeutic drug monitoring'],
  ['Drugs causing gingival hyperplasia', 'Drugs requiring therapeutic drug monitoring'],
  ['Diuretic classes by nephron site', 'Causes of hyperkalemia'],
  ['Nephrotic-pattern glomerular diseases', 'Causes of hyperkalemia'],
  ['Alpha blockade: uses and effects', 'Features of anaphylaxis'],
  ['Causes of hypercalcemia', 'Oncologic emergencies'],
  ['Causes of respiratory acidosis', 'Restrictive lung diseases'],
  ['Diseases prevented by the MMRV vaccine', 'Causes of acute pancreatitis'],
  ["Anticholinergic toxidrome ('mad, blind, red, dry')", 'Shifts the oxygen-hemoglobin curve RIGHT (unloads O2 more easily)'],
  ['Torsades de pointes risk factors', 'A measurement that falls as the disease gets worse'],
  ['Causes of peripheral neuropathy', 'Causes of microcytic anemia'],
  ['Associations of obstructive sleep apnea', 'A measurement that falls as the disease gets worse'],
  ['TORCH infections', 'Obligate intracellular organisms'],
]
const blockedSet = new Set(TIMED_BLOCKED_PAIRS.map((p) => [...p].sort().join('||')))
export const blockedPair = (a, b) => blockedSet.has([String(a.title || a), String(b.title || b)].sort().join('||'))
// Labels too loose to judge membership against ("A measurement that falls as
// the disease gets worse"): fine as a Daily-style group, not as a label to
// sort other concepts into.
export const VAGUE_LABELS = new Set(['A measurement that falls as the disease gets worse'])

// Open-ended groups ("Causes of ...", "Associations of ...") have many
// members beyond the four shown; two of them on one mini board kept sharing
// a disease in review (COPD raises the A-a gradient and causes respiratory
// acidosis). At most one open-ended group per mini board.
export const openEnded = (c) => /^(causes|common causes|associations|conditions associated|raises|risk factors|can precipitate|drugs causing|indications)\b/i.test(String(c.title || '').trim()) || /\b(risk factors|causes of)\b/i.test(String(c.title || ''))
export function miniPairScore(a, b) {
  if (sameSystem(a, b) || sharesTileWord(a, b) || (openEnded(a) && openEnded(b)) || blockedPair(a, b) || VAGUE_LABELS.has(a.title) || VAGUE_LABELS.has(b.title)) return -Infinity
  let s = 0
  const ka = dominantKind(a)
  if (ka && ka === dominantKind(b)) s += 3
  const surf = boardSurface([a.tiles, b.tiles])
  s -= 3 * surf.isolated.filter((x) => x.length).length
  const aT = new Set(a.tiles.map(normalizeTile))
  const bT = new Set(b.tiles.map(normalizeTile))
  if ((b.nearMisses || []).some((n) => aT.has(normalizeTile(n.text)))) s += 2
  if ((a.nearMisses || []).some((n) => bT.has(normalizeTile(n.text)))) s += 2
  return s
}
