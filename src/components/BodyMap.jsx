import React, { useEffect, useRef, useState } from 'react'
import { systemAccent } from '../utils/systemAccent.js'

// ---------------------------------------------------------------------
// The Systems body map: one responsive SVG (a quiet body outline, the organ
// symbols drawn as Plexus nodes joined by straight lines, and short
// connectors) with HTML buttons laid over it in the same coordinates.
//   • every system has a label button (name and live count; the accessible,
//     keyboard target, in top-to-bottom order) and one or more organ
//     targets (pointer only, so each system is one tab stop);
//   • all targets are at least 50 × 50 map units, which is 44 × 44 CSS px at
//     the narrowest map (300px wide) and grows from there; neighbouring
//     targets and labels keep a 5-unit gap and never overlap, and no
//     connector runs under a label (checked in the browser tests);
//   • the outline and connectors ignore taps;
//   • a share of each organ's nodes lights up in proportion to the boards
//     solved (a fixed order per organ), and the count stays in words.
// The illustrations are navigation symbols, not anatomy.
// ---------------------------------------------------------------------
export const MAP_W = 340
export const MAP_H = 430
const CX = 165 // body centre line (a little left, so right labels have room)
const L_EDGE = 84 // left labels end here (text right-aligned)
const R_EDGE = 245 // right labels start here

const mirror = (pts) => pts.map(([x, y]) => [2 * CX - x, y])
const loop = (n, from = 0) => Array.from({ length: n }, (_, i) => [from + i, from + ((i + 1) % n)])
const chain = (n, from = 0) => Array.from({ length: n - 1 }, (_, i) => [from + i, from + i + 1])

// Organ symbols: nodes and the links between them, all on one grid of node
// size and line weight. Lit nodes follow a fixed order (see litSet).
const BRAIN_L = [[159, 20], [150, 26], [146, 37], [148, 49], [157, 56], [161, 38]]
const BRAIN_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 2], [5, 4], [1, 5]]
const KIDNEY_L = [[129, 192], [121, 200], [120, 212], [127, 220], [135, 214], [133, 205], [136, 197]]
// Lungs: rounded apex, wide sloping base, a hilum on the inner edge. The
// viewer's right lung has a notch where the heart sits; both are the same size.
const LUNG_L = [[143, 100], [134, 107], [126, 120], [120, 136], [118, 151], [122, 163], [135, 166], [148, 161], [152, 147], [150, 125], [148, 109]]
const LUNG_R = [[187, 100], [196, 107], [204, 120], [210, 136], [212, 151], [208, 163], [195, 166], [189, 160], [189, 147], [187, 125], [182, 109]]

const ORGANS = {
  Psychiatry: {
    nodes: BRAIN_L,
    links: BRAIN_LINKS,
    targets: [[113, 6, 50, 51]],
    anchor: [146, 37],
    label: { side: 'L', y: 30 },
  },
  Neurology: {
    nodes: [...mirror(BRAIN_L), [CX, 64]],
    links: [...BRAIN_LINKS, [4, 6]],
    targets: [[168, 6, 50, 51]],
    anchor: [184, 37],
    label: { side: 'R', y: 30 },
  },
  Endocrine: {
    nodes: [[158, 79], [154, 85], [159, 90], [165, 86], [172, 79], [176, 85], [171, 90]],
    links: [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 3], [0, 3]],
    targets: [[135, 62, 50, 54]],
    anchor: [154, 85],
    label: { side: 'L', y: 88 },
  },
  // Skin: a short run of nodes along the outer contour where the shoulder
  // becomes the upper arm, with its label right beside it.
  Dermatology: {
    nodes: [[214, 99], [222, 102], [228, 107], [232, 114], [218, 105], [225, 110]],
    links: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 1], [4, 5], [5, 2], [5, 3]],
    targets: [[190, 62, 50, 54]],
    anchor: [232, 112],
    label: { side: 'R', y: 93 },
  },
  Pulmonary: {
    nodes: [...LUNG_L, ...LUNG_R, [CX, 93], [CX, 102], [157, 110], [173, 110]],
    links: [...loop(11), ...loop(11, 11), [22, 23], [23, 24], [23, 25], [24, 9], [25, 20]],
    targets: [
      [92, 123, 50, 50],
      [202, 123, 50, 50],
    ],
    anchor: [118, 150],
    label: { side: 'L', y: 150 },
  },
  // Heart: between the lungs at mid-chest, a little to the viewer's right.
  Cardiology: {
    nodes: [[161, 135], [166, 130], [171, 135], [176, 130], [181, 135], [181, 142], [171, 153], [161, 142]],
    links: [...loop(8), [2, 6], [7, 5]],
    targets: [[147, 123, 50, 50]],
    anchor: [171, 153],
    via: [186, 171],
    label: { side: 'R', y: 203 },
  },
  Renal: {
    nodes: [...KIDNEY_L, ...mirror(KIDNEY_L)],
    links: [...loop(7), ...loop(7, 7)],
    targets: [
      [100, 181, 50, 52],
      [180, 181, 50, 52],
    ],
    anchor: [120, 206],
    label: { side: 'L', y: 206 },
  },
  // Bowel: the colon framing the abdomen, small intestine winding inside.
  GI: {
    nodes: [
      [147, 284], [144, 266], [147, 249], [157, 242], [173, 242], [183, 249], [186, 266], [184, 282], [173, 289],
      [155, 256], [165, 252], [175, 257], [170, 265], [160, 267], [156, 275], [166, 279], [176, 274],
    ],
    links: [...chain(9), ...chain(8, 9)],
    targets: [[139, 238, 52, 52]],
    anchor: [186, 266],
    label: { side: 'R', y: 264 },
  },
  Reproductive: {
    nodes: [[147, 307], [156, 304], [161, 310], [169, 310], [174, 304], [183, 307], [160, 321], [170, 321], [165, 330]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [3, 7], [6, 7], [6, 8], [7, 8]],
    targets: [[139, 295, 52, 52]],
    anchor: [183, 307],
    label: { side: 'R', y: 322 },
  },
  MSK: {
    nodes: [[136, 360], [129, 376], [143, 376], [136, 382], [129, 388], [143, 388], [136, 402]],
    links: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]],
    targets: [[110, 352, 52, 52]],
    anchor: [129, 382],
    label: { side: 'L', y: 382 },
  },
}
// Keyboard and screen-reader order: top of the body to the bottom.
export const MAP_ORDER = ['Psychiatry', 'Neurology', 'Endocrine', 'Dermatology', 'Pulmonary', 'Cardiology', 'Renal', 'GI', 'Reproductive', 'MSK']
export const MAP_GEOMETRY = ORGANS

// Lit nodes in a fixed order: alternate ends of the node list, so even one
// solved board shows on the organ.
function litSet(n, fraction) {
  if (!(fraction > 0)) return new Set()
  const k = Math.min(n, Math.max(1, Math.round(n * fraction)))
  const order = []
  for (let i = 0, j = n - 1; order.length < n; i++, j--) {
    order.push(i)
    if (j !== i && order.length < n) order.push(j)
  }
  return new Set(order.slice(0, k))
}

const pct = (v, of) => `${(v / of) * 100}%`

// A friendly silhouette: a head that narrows to the chin, sloping shoulders,
// a gentle waist, hips and short legs. Drawn for these proportions, not
// stretched. Decorative and never tappable.
function Outline() {
  const m = (x) => 2 * CX - x
  const head = 'M165 10 C 181 10 191 22 191 38 C 191 54 184 67 172 73 Q 165 77 158 73 C 146 67 139 54 139 38 C 139 22 149 10 165 10 Z'
  const side = (f) =>
    `M${f(156)} 74 L${f(155)} 88 C ${f(146)} 92 ${f(127)} 94 ${f(113)} 100 C ${f(103)} 104 ${f(97)} 114 ${f(95)} 128 ` +
    `C ${f(92)} 156 ${f(91)} 184 ${f(92)} 208 Q ${f(96)} 220 ${f(102)} 210 C ${f(103)} 186 ${f(105)} 160 ${f(108)} 138 Q ${f(109)} 130 ${f(112)} 126 ` +
    `C ${f(115)} 160 ${f(119)} 184 ${f(119)} 200 C ${f(119)} 224 ${f(112)} 252 ${f(111)} 282 C ${f(111)} 302 ${f(113)} 318 ${f(115)} 336 ` +
    `C ${f(117)} 362 ${f(121)} 394 ${f(125)} 424`
  return (
    <g className="bm-outline" aria-hidden="true">
      <path d={head} />
      <path d={side((x) => x)} />
      <path d={side(m)} />
      <path d="M150 424 C 152 394 155 366 159 346 Q 165 336 171 346 C 175 366 178 394 180 424" />
    </g>
  )
}

export default function BodyMap({ rows, selected = null, onChoose, wide = false, label }) {
  const [hot, setHot] = useState(null)
  const [pulse, setPulse] = useState(null)
  const pulseTimer = useRef(null)
  useEffect(() => () => clearTimeout(pulseTimer.current), [])
  // A brief node pulse on press; navigation is never delayed for it.
  const press = (system) => {
    clearTimeout(pulseTimer.current)
    setPulse(system)
    pulseTimer.current = setTimeout(() => setPulse(null), 360)
    onChoose(system)
  }

  return (
    <div className={`bodymap ${wide ? 'is-wide' : 'is-phone'}`} role="group" aria-label="Body map of systems">
      <svg className="bm-art" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true" focusable="false">
        <Outline />
        <g className="bm-connectors">
          {MAP_ORDER.map((system) => {
            const o = ORGANS[system]
            const end = o.end || [o.label.side === 'L' ? L_EDGE + 4 : R_EDGE - 4, o.label.y]
            const pts = [o.anchor, ...(o.via ? [o.via] : []), end]
            return (
              <g key={system} className={`bm-connector ${hot === system || selected === system ? 'is-hot' : ''}`}>
                <polyline points={pts.map((p) => p.join(',')).join(' ')} />
                <circle cx={end[0]} cy={end[1]} r="2.6" />
              </g>
            )
          })}
        </g>
        {MAP_ORDER.map((system) => {
          const o = ORGANS[system]
          const r = rows[system] || { total: 0, solved: 0 }
          const lit = litSet(o.nodes.length, r.total ? r.solved / r.total : 0)
          const cls = ['bm-organ', hot === system ? 'is-hot' : '', selected === system ? 'is-selected' : '', pulse === system ? 'is-pulse' : ''].join(' ')
          return (
            <g key={system} className={cls} style={{ '--node-accent': systemAccent(system) }} data-system={system}>
              {o.links.map(([a, b], i) => (
                <line key={`l${i}`} x1={o.nodes[a][0]} y1={o.nodes[a][1]} x2={o.nodes[b][0]} y2={o.nodes[b][1]} />
              ))}
              {o.nodes.map(([x, y], i) => (
                <circle key={`n${i}`} className={lit.has(i) ? 'is-lit' : ''} cx={x} cy={y} r={lit.has(i) ? 2.7 : 2.3} />
              ))}
            </g>
          )
        })}
      </svg>

      {MAP_ORDER.map((system) =>
        ORGANS[system].targets.map(([x, y, w, h], i) => (
          <button
            key={`${system}-t${i}`}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="bm-target"
            data-system={system}
            style={{ left: pct(x, MAP_W), top: pct(y, MAP_H), width: pct(w, MAP_W), height: pct(h, MAP_H) }}
            onClick={() => press(system)}
            onPointerEnter={() => setHot(system)}
            onPointerDown={() => setHot(system)}
            onPointerLeave={() => setHot((s) => (s === system ? null : s))}
          />
        ))
      )}

      {MAP_ORDER.map((system) => {
        const o = ORGANS[system]
        const r = rows[system] || { total: 0, solved: 0 }
        const complete = r.total > 0 && r.solved >= r.total
        const left = o.label.side === 'L'
        const pos = left ? { right: pct(MAP_W - L_EDGE, MAP_W), maxWidth: pct(L_EDGE, MAP_W) } : { left: pct(R_EDGE, MAP_W), maxWidth: pct(MAP_W - R_EDGE, MAP_W) }
        return (
          <button
            key={system}
            type="button"
            className={`bm-label ${left ? 'is-left' : 'is-right'} ${selected === system ? 'is-selected' : ''} ${hot === system ? 'is-hot' : ''} ${pulse === system ? 'is-pulse' : ''} ${complete ? 'is-complete' : ''}`}
            style={{ ...pos, top: pct(o.label.y, MAP_H), '--node-accent': systemAccent(system) }}
            data-system={system}
            aria-label={label(system, r)}
            aria-pressed={wide ? selected === system : undefined}
            onClick={() => press(system)}
            onPointerEnter={() => setHot(system)}
            onPointerDown={() => setHot(system)}
            onPointerLeave={() => setHot((s) => (s === system ? null : s))}
            onFocus={() => setHot(system)}
            onBlur={() => setHot((s) => (s === system ? null : s))}
          >
            <span className="bm-name">{system}</span>
            <span className="bm-count">
              {complete ? (
                <>
                  {r.solved}/{r.total} <span className="bm-done" aria-hidden="true">✓</span>
                </>
              ) : (
                `${r.solved} of ${r.total}`
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
