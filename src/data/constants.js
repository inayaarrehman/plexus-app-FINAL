// Difficulty tiers, easiest -> trickiest. An original palette — coral,
// aqua/teal, cobalt, plum — rather than NYT's yellow/green/blue/purple.
// This is also the app's broader brand palette (homepage accents, brand
// mark, system pages), not just a difficulty code — kept in sync with the
// --difficulty-* CSS variables in styles.css.
//
// `shape` + `shapeLabel`: color is never the only signal for difficulty —
// every place that shows a difficulty color (solved banners, the result
// grid, the share text) also shows this shape/label, so the game stays
// legible for color-blind players and reads correctly as plain text when
// shared. Deliberately distinct from any color-coded-only presentation.
// The canonical Plexus jewel palette (terracotta / peacock / cobalt / plum),
// mirrored in styles.css as --jewel-*. Every hex below is contrast-checked at 4.5:1+ against white (the fixed
// text color used on solved banners/tiles/result squares in both light and
// dark mode, since those are always rendered as color fills, not text-on-
// page) — see styles.css's --difficulty-* root block for the matching
// values, and its dark-mode block for the separate, lighter tints used
// where a difficulty color is the TEXT color on a page background instead.
export const DIFFICULTY = [
  { level: 1, name: 'Burnt coral', color: '#c25b40', motif: 'chain' },
  { level: 2, name: 'Peacock', color: '#0b7480', motif: 'hub' },
  { level: 3, name: 'Sapphire', color: '#2c57b0', motif: 'cluster' },
  { level: 4, name: 'Amethyst', color: '#7848b2', motif: 'mesh' },
]

// The same four families as node GRAPHICS. These resolve to the base jewel
// colours on cream surfaces and the intro, and to lifted, ivory-rimmed tints
// inside the gemstone rooms (see --node-* in styles.css), so node art stays
// multicoloured and visible on every room.
export const NODE_VARS = [
  'var(--node-terracotta, #bf5236)',
  'var(--node-peacock, #087f78)',
  'var(--node-cobalt, #3267c8)',
  'var(--node-plum, #7a49b2)',
]

// The full organ-system library. A system with zero puzzles today still
// shows up (as "coming soon") so the nav doesn't have to change shape as
// content is added.
export const SYSTEMS = [
  'Cardiology',
  'Pulmonary',
  'Renal',
  'Neurology',
  'GI',
  'Endocrine',
  'Heme/Onc',
  'MSK',
  'Reproductive',
  'Psychiatry',
  'Microbiology',
  'Immunology',
  'Dermatology',
  'Pharmacology',
  'Biochemistry/Genetics',
  'Mixed / Step Review',
]

export const PUZZLE_STATUS = ['draft', 'reviewed', 'published']
