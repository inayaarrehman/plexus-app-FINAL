// Anatomical Plexus glyphs (Systems redesign). "Medicine gives each system
// its shape; Plexus draws that shape through connections." Every system has a
// hand-authored constellation of nodes + thin paths that suggests its organ
// or biological form WITHOUT being a conventional organ icon, filled
// silhouette, emoji, or stock SVG — the shape is legible only from the
// ARRANGEMENT of the network. One cohesive family: similar node size, stroke,
// density, bounding box (~20–80 within a 0–100 viewBox) and 9–12 nodes each.
//
// Each glyph is fully deterministic and static. Progress is layered on at
// render time: the whole network is ALWAYS faintly visible (§20); a prefix of
// `order` resolves (brightens/enlarges) in proportion to the system's real
// X/Y, and a path resolves once BOTH its endpoints have, so the network
// propagates through the anatomy along a fixed sequence (§21–22).
//
// `order` lists node indices in resolution sequence and MUST contain every
// node index exactly once; each newly-resolved node should connect to one
// already resolved so the lit region stays contiguous.

const G = {
  // Heart: apex at the bottom, two upper lobes with a central notch — the
  // contour of a heart implied by the ring, never the Valentine symbol.
  Cardiology: {
    nodes: [
      [50, 84], [32, 66], [68, 66], [20, 47], [80, 47],
      [28, 31], [72, 31], [40, 30], [60, 30], [50, 42],
    ],
    links: [
      [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6],
      [5, 7], [7, 9], [9, 8], [8, 6], [9, 0], [1, 2],
    ],
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  // Lungs: central airway branching at a carina into two symmetric lobar loops.
  Pulmonary: {
    nodes: [
      [50, 16], [50, 34], [38, 42], [62, 42],
      [30, 52], [24, 66], [34, 76], [42, 60],
      [70, 52], [76, 66], [66, 76], [58, 60],
    ],
    links: [
      [0, 1], [1, 2], [1, 3],
      [2, 4], [4, 5], [5, 6], [6, 7], [7, 2],
      [3, 8], [8, 9], [9, 10], [10, 11], [11, 3],
    ],
    order: [0, 1, 2, 3, 4, 8, 5, 9, 6, 10, 7, 11],
  },
  // Kidney: a bean contour with a concave hilum and internal spokes to a
  // medullary centre.
  Renal: {
    nodes: [
      [60, 20], [76, 34], [80, 52], [72, 70], [54, 80],
      [44, 64], [50, 50], [46, 34], [62, 50],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
      [6, 8], [8, 0], [8, 2], [8, 4],
    ],
    order: [6, 8, 0, 2, 4, 7, 5, 1, 3],
  },
  // Brain: two hemispheric arcs joined at the midline, with an inferior
  // brainstem drop.
  Neurology: {
    nodes: [
      [38, 22], [26, 30], [22, 44], [28, 56],
      [62, 22], [74, 30], [78, 44], [72, 56],
      [50, 20], [50, 42], [50, 64], [50, 76],
    ],
    links: [
      [8, 0], [0, 1], [1, 2], [2, 3], [3, 9],
      [8, 4], [4, 5], [5, 6], [6, 7], [7, 9],
      [8, 9], [9, 10], [10, 11],
    ],
    order: [8, 0, 4, 1, 5, 2, 6, 3, 7, 9, 10, 11],
  },
  // GI: the J-curve of the stomach continuing into an intestinal loop.
  GI: {
    nodes: [
      [38, 18], [30, 28], [30, 44], [40, 56], [56, 54],
      [64, 44], [62, 60], [52, 70], [64, 78], [54, 86],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [5, 6], [6, 7], [7, 8], [8, 9],
    ],
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  // Thyroid: a bilateral butterfly of two lobes joined by a central isthmus.
  Endocrine: {
    nodes: [
      [30, 34], [24, 46], [30, 60], [40, 50],
      [70, 34], [76, 46], [70, 60], [60, 50],
      [50, 50],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [3, 8], [8, 7],
    ],
    order: [8, 3, 7, 0, 4, 1, 5, 2, 6],
  },
  // Heme/Onc: hemoglobin read as a network: four globin subunits in a
  // square around the central iron, each with its heme branching outward.
  // A compact molecule, nothing like the branching airways of Pulmonary.
  'Heme/Onc': {
    nodes: [
      [50, 50], [34, 34], [66, 34], [66, 66], [34, 66],
      [22, 22], [78, 22], [78, 78], [22, 78],
    ],
    links: [
      [1, 2], [2, 3], [3, 4], [4, 1],
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 5], [2, 6], [3, 7], [4, 8],
    ],
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  // MSK: two epiphyseal node clusters (bone ends) meeting through a central
  // joint.
  MSK: {
    nodes: [
      [24, 30], [28, 20], [40, 26], [44, 40],
      [50, 50], [56, 60], [60, 74], [72, 78], [76, 66],
    ],
    links: [
      [1, 0], [1, 2], [0, 3], [2, 3], [3, 4],
      [4, 5], [5, 6], [6, 7], [7, 8], [8, 5],
    ],
    order: [4, 3, 5, 2, 6, 1, 7, 0, 8],
  },
  // Reproductive: a central body with two symmetric curved arms rising to
  // rounded terminal nodes — abstract and tasteful.
  Reproductive: {
    nodes: [
      [50, 64], [50, 52], [40, 44], [30, 38], [24, 30],
      [60, 44], [70, 38], [76, 30], [50, 78],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [1, 5], [5, 6], [6, 7], [0, 8],
    ],
    order: [0, 1, 8, 2, 5, 3, 6, 4, 7],
  },
  // Psychiatry: a head in profile, facing right, with a small cluster of
  // connected nodes where the mind sits. The contour carries the form;
  // Neurology stays the front-on brain.
  Psychiatry: {
    nodes: [
      [38, 86], [26, 60], [32, 30], [50, 18], [68, 26], [72, 40],
      [81, 50], [72, 56], [72, 68], [62, 74], [60, 86],
      [44, 42], [58, 38], [52, 52],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
      [11, 12], [12, 13], [13, 11],
    ],
    order: [11, 12, 13, 3, 2, 4, 1, 5, 0, 6, 7, 8, 9, 10],
  },
  // Microbiology: a virus: a six-sided capsid with spikes ending in nodes,
  // facets drawn to the genome at its centre.
  Microbiology: {
    nodes: [
      [50, 50],
      [50, 30], [67, 40], [67, 60], [50, 70], [33, 60], [33, 40],
      [50, 16], [79, 33], [79, 67], [50, 84], [21, 67], [21, 33],
    ],
    links: [
      [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
      [0, 1], [0, 3], [0, 5],
      [1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [6, 12],
    ],
    order: [0, 1, 3, 5, 2, 4, 6, 7, 8, 9, 10, 11, 12],
  },
  // Immunology: the Y of an immunoglobulin — a stem forking into two Fab arms.
  Immunology: {
    nodes: [
      [50, 82], [50, 62], [50, 48], [38, 38],
      [30, 26], [24, 34], [62, 38], [70, 26], [76, 34],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 4], [3, 5],
      [2, 6], [6, 7], [6, 8],
    ],
    order: [0, 1, 2, 3, 6, 4, 7, 5, 8],
  },
  // Dermatology: stacked layers (epidermis → dermis) as node rows knitted by
  // vertical connections.
  Dermatology: {
    nodes: [
      [28, 32], [50, 30], [72, 32],
      [26, 50], [50, 48], [74, 50],
      [30, 68], [50, 70], [70, 68],
    ],
    links: [
      [0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8],
      [0, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8],
    ],
    order: [1, 0, 2, 4, 3, 5, 7, 6, 8],
  },
  // Pharmacology: a pill bottle: cap above a taller body, corners as nodes,
  // and a two-node capsule inside.
  Pharmacology: {
    nodes: [
      [36, 16], [64, 16], [64, 27], [36, 27],
      [30, 33], [70, 33], [70, 82], [30, 82],
      [43, 57], [57, 57],
    ],
    links: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [3, 4], [2, 5],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [8, 9],
    ],
    order: [8, 9, 4, 5, 6, 7, 3, 2, 0, 1],
  },
  // Biochemistry: an amino acid: the alpha carbon at the centre, its amine
  // and carboxyl groups branching to either side, and a side chain dropping
  // to a six-node ring (an aromatic residue).
  'Biochemistry/Genetics': {
    nodes: [
      [50, 38], [32, 28], [20, 20], [22, 38],
      [68, 28], [80, 20], [78, 38],
      [50, 52],
      [50, 60], [58, 65], [58, 75], [50, 80], [42, 75], [42, 65],
    ],
    links: [
      [0, 1], [1, 2], [1, 3],
      [0, 4], [4, 5], [4, 6],
      [0, 7], [7, 8],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 8],
    ],
    order: [0, 1, 4, 7, 2, 5, 8, 3, 6, 9, 13, 10, 12, 11],
  },
  // Genetics: a paired, rung-linked double strand: DNA implied by two node
  // columns joined by base-pair rungs.
  Genetics: {
    nodes: [
      [36, 20], [64, 22], [34, 40], [66, 40],
      [36, 60], [64, 58], [34, 80], [66, 78],
    ],
    links: [
      [0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7],
      [0, 1], [2, 3], [4, 5], [6, 7],
    ],
    order: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  // Mixed / Step Review: a hub-and-spoke constellation — one centre linking
  // out to many system nodes. The "everything" network.
  'Mixed / Step Review': {
    nodes: [
      [50, 50], [50, 22], [72, 32], [80, 54],
      [70, 74], [48, 80], [28, 72], [20, 50], [30, 30],
    ],
    links: [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
      [1, 2], [4, 5], [7, 8],
    ],
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
}

// Fallback for any system without an authored glyph: a simple centred ring.
function fallbackGlyph() {
  const n = 8
  const nodes = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    nodes.push([50 + Math.cos(a) * 28, 50 + Math.sin(a) * 28])
  }
  const links = []
  for (let i = 0; i < n; i++) links.push([i, (i + 1) % n])
  return { nodes, links, order: nodes.map((_, i) => i) }
}

// Per-glyph perceived-size normalization (§8): a few forms read smaller than
// Heart/Lungs/Brain because their content is narrow or short. A gentle scale
// (applied around centre at render) evens the family's optical weight without
// touching geometry or the resolution order. Others stay at 1.
const GLYPH_SCALE = {
  Endocrine: 1.2, // wide-and-short — needs the most to match Heart/Lungs weight
  Immunology: 1.06,
  MSK: 1.05,
  Reproductive: 1.05,
}

// Returns { nodes: [{x,y}], links: [[i,j]], order: [i...], scale } for a system.
// Genetics keeps the double strand; Biochemistry has its own amino acid.
const GLYPH_ALIAS = {}
export function getSystemGlyph(system) {
  const g = G[system] || G[GLYPH_ALIAS[system]] || fallbackGlyph()
  return {
    nodes: g.nodes.map(([x, y]) => ({ x, y })),
    links: g.links,
    order: g.order,
    scale: GLYPH_SCALE[system] || 1,
  }
}

// Map a real progress fraction (0..1) onto the glyph's resolved state. The
// full network is always drawn (faint) by the renderer; this only decides how
// many nodes — in `order` sequence — read as resolved, and which links have
// both endpoints resolved. `empty` (Coming Soon) resolves nothing. Fraction
// derives from real X/Y upstream; one glyph node does NOT equal one connection.
export function resolveGlyph(glyph, fraction, { empty = false } = {}) {
  const n = glyph.nodes.length
  let resolvedCount
  if (empty || fraction <= 0) {
    resolvedCount = 0
  } else if (fraction >= 1) {
    resolvedCount = n
  } else {
    resolvedCount = Math.round(fraction * n)
    if (resolvedCount === 0) resolvedCount = 1 // any progress lights ≥1 node
    if (resolvedCount === n) resolvedCount = n - 1 // full network only at 100%
  }
  const resolved = new Set(glyph.order.slice(0, resolvedCount))
  return {
    resolvedCount,
    isNodeOn: (i) => resolved.has(i),
    isLinkOn: ([a, b]) => resolved.has(a) && resolved.has(b),
    complete: !empty && fraction >= 1,
  }
}

export const SYSTEM_GLYPH_NAMES = Object.keys(G)
