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
export const MAP_W = 330
export const MAP_H = 532
const L_EDGE = 104 // left labels end here (text right-aligned)
const R_EDGE = 226 // right labels start here

const mirror = (pts) => pts.map(([x, y]) => [MAP_W - x, y])
const loop = (n, from = 0) => Array.from({ length: n }, (_, i) => [from + i, from + ((i + 1) % n)])

// Organ symbols: nodes and the links between them. `lit` lists the node
// order that lights up as boards are solved.
const BRAIN_L = [[150, 42], [141, 55], [146, 70], [158, 49], [157, 63], [161, 78]]
const BRAIN_LINKS = [[0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [4, 5], [1, 4], [2, 5]]
const KIDNEY_L = [[142, 268], [134, 278], [134, 296], [142, 306], [150, 298], [148, 287], [150, 274]]
const LUNG_L = [[151, 150], [141, 162], [133, 182], [131, 206], [135, 226], [148, 233], [160, 224], [160, 162]]
const LUNG_R = [[179, 150], [189, 162], [197, 180], [199, 198], [193, 206], [181, 204], [171, 196], [170, 162]]

const ORGANS = {
  Psychiatry: {
    nodes: BRAIN_L,
    links: BRAIN_LINKS,
    targets: [[110, 24, 52, 58]],
    anchor: [141, 55],
    label: { side: 'L', y: 50 },
  },
  Neurology: {
    nodes: [...mirror(BRAIN_L), [165, 87]],
    links: [...BRAIN_LINKS, [5, 6]],
    targets: [[167, 24, 52, 58]],
    anchor: [189, 55],
    label: { side: 'R', y: 50 },
  },
  Endocrine: {
    nodes: [[156, 99], [151, 107], [157, 114], [165, 108], [174, 99], [179, 107], [173, 114]],
    links: [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 3], [0, 3]],
    targets: [[139, 87, 52, 52]],
    anchor: [151, 107],
    label: { side: 'L', y: 118 },
  },
  Dermatology: {
    nodes: [[227, 144], [231, 157], [233, 171], [234, 186], [229, 164], [230, 179]],
    links: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 2], [1, 4], [4, 5], [5, 3], [2, 5]],
    targets: [[223, 136, 52, 64]],
    anchor: [227, 144],
    via: [224, 118],
    label: { side: 'R', y: 104 },
  },
  Pulmonary: {
    nodes: [...LUNG_L, ...LUNG_R, [165, 126], [165, 147], [154, 160], [176, 160]],
    links: [...loop(8), ...loop(8, 8), [16, 17], [17, 18], [17, 19], [18, 7], [19, 15]],
    targets: [
      [109, 144, 52, 90],
      [166, 144, 52, 60],
    ],
    anchor: [131, 190],
    label: { side: 'L', y: 190 },
  },
  Cardiology: {
    nodes: [[176, 224], [183, 216], [190, 223], [197, 216], [204, 224], [204, 234], [190, 252], [176, 234]],
    links: [...loop(8), [2, 6], [7, 5]],
    targets: [[166, 209, 53, 50]],
    anchor: [204, 234],
    label: { side: 'R', y: 236 },
  },
  Renal: {
    nodes: [...KIDNEY_L, ...mirror(KIDNEY_L)],
    links: [...loop(7), ...loop(7, 7)],
    targets: [
      [109, 264, 50, 52],
      [171, 264, 50, 52],
    ],
    anchor: [134, 287],
    label: { side: 'L', y: 287 },
  },
  GI: {
    nodes: [[142, 324], [165, 320], [188, 324], [190, 350], [188, 376], [165, 380], [142, 376], [140, 350], [152, 336], [178, 336], [178, 350], [152, 350], [152, 364], [178, 364]],
    links: [...loop(8), [8, 9], [9, 10], [10, 11], [11, 12], [12, 13]],
    targets: [[134, 321, 62, 65]],
    anchor: [190, 350],
    label: { side: 'R', y: 350 },
  },
  Reproductive: {
    nodes: [[144, 396], [155, 394], [162, 400], [168, 400], [175, 394], [186, 396], [160, 414], [170, 414], [165, 424]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [3, 7], [6, 7], [6, 8], [7, 8]],
    targets: [[136, 391, 58, 50]],
    anchor: [186, 396],
    label: { side: 'R', y: 410 },
  },
  MSK: {
    nodes: [[141, 446], [133, 466], [149, 466], [141, 473], [133, 480], [149, 480], [141, 504]],
    links: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]],
    targets: [[112, 446, 58, 66]],
    anchor: [133, 474],
    label: { side: 'L', y: 474 },
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

function Outline() {
  const side = (x) => x
  const r = (x) => MAP_W - x
  const arm = (f) =>
    `M${f(152)} 102 C ${f(128)} 104 ${f(112)} 110 ${f(104)} 126 C ${f(98)} 160 ${f(96)} 200 ${f(95)} 250 C ${f(94)} 280 ${f(96)} 305 ${f(98)} 326 Q ${f(103)} 336 ${f(108)} 324 C ${f(108)} 280 ${f(110)} 220 ${f(114)} 160 Q ${f(116)} 146 ${f(120)} 140`
  return (
    <g className="bm-outline" aria-hidden="true">
      <circle cx="165" cy="58" r="33" />
      <path d="M152 90 L152 102 M178 90 L178 102" />
      <path d={arm(side)} />
      <path d={arm(r)} />
      <path d="M120 140 C 117 220 117 320 120 404 C 122 450 126 495 130 528" />
      <path d="M210 140 C 213 220 213 320 210 404 C 208 450 204 495 200 528" />
      <path d="M152 528 C 154 500 158 470 160 432 Q 165 426 170 432 C 172 470 176 500 178 528" />
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
            const end = [o.label.side === 'L' ? L_EDGE + 4 : R_EDGE - 4, o.label.y]
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
                <circle key={`n${i}`} className={lit.has(i) ? 'is-lit' : ''} cx={x} cy={y} r={lit.has(i) ? 3.7 : 3.1} />
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
            className={`bm-label ${left ? 'is-left' : 'is-right'} ${selected === system ? 'is-selected' : ''} ${complete ? 'is-complete' : ''}`}
            style={{ ...pos, top: pct(o.label.y, MAP_H), '--node-accent': systemAccent(system) }}
            data-system={system}
            aria-label={label(system, r)}
            aria-pressed={wide ? selected === system : undefined}
            onClick={() => press(system)}
            onPointerEnter={() => setHot(system)}
            onPointerLeave={() => setHot((s) => (s === system ? null : s))}
            onFocus={() => setHot(system)}
            onBlur={() => setHot((s) => (s === system ? null : s))}
          >
            <span className="bm-name">{system}</span>
            <span className="bm-count">
              {r.solved} of {r.total}
              {complete && <span className="bm-done"> · done</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
