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
export const MAP_H = 512
const CX = 167 // body centre line
const L_EDGE = 84 // left labels end here (text right-aligned)
const R_EDGE = 249 // right labels start here

const mirror = (pts) => pts.map(([x, y]) => [2 * CX - x, y])
const loop = (n, from = 0) => Array.from({ length: n }, (_, i) => [from + i, from + ((i + 1) % n)])
const chain = (n, from = 0) => Array.from({ length: n - 1 }, (_, i) => [from + i, from + i + 1])
const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy])

// Organ symbols: nodes and the links between them, all on one grid of node
// size and line weight. Lit nodes follow a fixed order (see litSet). Each
// sits where it belongs in the figure below: brain in the head, thyroid on
// the neck, lungs and heart in the chest, kidneys in the upper abdomen, bowel
// in the abdomen, reproductive organs in the pelvis, a knee for MSK and skin
// on the shoulder's outline.
const BRAIN_L = [[161, 22], [152, 28], [148, 39], [150, 51], [159, 58], [163, 40]]
const BRAIN_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 2], [5, 4], [1, 5]]
const KIDNEY_L = shift([[129, 192], [121, 200], [120, 212], [127, 220], [135, 214], [133, 205], [136, 197]], 15, 1)
// Lungs: rounded apex, wide sloping base. The viewer's right lung has a notch
// where the heart sits.
const LUNG_L = [[155, 118], [146, 124], [138, 136], [133, 150], [131, 163], [135, 173], [146, 176], [156, 172], [159, 160], [158, 140], [157, 126]]
const LUNG_R = [[179, 118], [188, 124], [196, 136], [201, 150], [203, 163], [200, 173], [195, 175], [192, 168], [191, 154], [182, 142], [178, 128]]

const ORGANS = {
  Psychiatry: {
    nodes: BRAIN_L,
    links: BRAIN_LINKS,
    targets: [[113, 10, 50, 54]],
    anchor: [148, 39],
    label: { side: 'L', y: 39 },
  },
  Neurology: {
    nodes: [...mirror(BRAIN_L), [CX, 66]],
    links: [...BRAIN_LINKS, [4, 6]],
    targets: [[168, 10, 50, 54]],
    anchor: [186, 39],
    label: { side: 'R', y: 39 },
  },
  // Thyroid: a small butterfly on the neck.
  Endocrine: {
    nodes: [[161, 83], [157, 89], [162, 94], [167, 90], [173, 83], [177, 89], [172, 94]],
    links: [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 3], [0, 3]],
    targets: [[139, 69, 50, 50]],
    anchor: [157, 89],
    label: { side: 'L', y: 94 },
  },
  // Skin: nodes along the outline where the shoulder rounds into the arm.
  Dermatology: {
    nodes: [[208, 99], [218, 101], [226, 106], [231, 115], [214, 106], [223, 112]],
    links: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 1], [4, 5], [5, 2], [5, 3]],
    targets: [[194, 69, 50, 50]],
    anchor: [231, 115],
    label: { side: 'R', y: 104 },
  },
  Pulmonary: {
    nodes: [...LUNG_L, ...LUNG_R, [CX, 100], [CX, 109], [160, 115], [174, 115]],
    links: [...loop(11), ...loop(11, 11), [22, 23], [23, 24], [23, 25], [24, 0], [25, 11]],
    targets: [[92, 124, 50, 50]],
    anchor: [133, 150],
    label: { side: 'L', y: 150 },
  },
  // Heart: low in the chest, a little to the viewer's right, in the notch.
  Cardiology: {
    nodes: [[164, 153], [169, 148], [175, 153], [181, 148], [186, 153], [186, 161], [175, 173], [164, 161]],
    links: [...loop(8), [2, 6], [7, 5]],
    targets: [[147, 124, 50, 50]],
    anchor: [175, 173],
    via: [180, 184],
    label: { side: 'R', y: 194 },
  },
  Renal: {
    nodes: [...KIDNEY_L, ...mirror(KIDNEY_L)],
    links: [...loop(7), ...loop(7, 7)],
    targets: [
      [99, 179, 50, 50],
      [185, 179, 50, 50],
    ],
    anchor: [135, 208],
    label: { side: 'L', y: 208 },
  },
  // Bowel: the colon framing the abdomen, small intestine winding inside.
  GI: {
    nodes: shift(
      [
        [147, 284], [144, 266], [147, 249], [157, 242], [173, 242], [183, 249], [186, 266], [184, 282], [173, 289],
        [155, 256], [165, 252], [175, 257], [170, 265], [160, 267], [156, 275], [166, 279], [176, 274],
      ],
      2,
      -12
    ),
    links: [...chain(9), ...chain(8, 9)],
    targets: [[142, 234, 50, 50]],
    anchor: [188, 254],
    label: { side: 'R', y: 254 },
  },
  Reproductive: {
    nodes: shift([[147, 307], [156, 304], [161, 310], [169, 310], [174, 304], [183, 307], [160, 321], [170, 321], [165, 330]], 2, -20),
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [3, 7], [6, 7], [6, 8], [7, 8]],
    targets: [[142, 289, 50, 50]],
    anchor: [185, 287],
    label: { side: 'R', y: 342 },
  },
  // A knee joint on the viewer's left leg.
  MSK: {
    nodes: shift([[136, 360], [129, 376], [143, 376], [136, 382], [129, 388], [143, 388], [136, 402]], 9, 10),
    links: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]],
    targets: [[114, 368, 50, 50]],
    anchor: [138, 392],
    label: { side: 'L', y: 392 },
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

// The figure: a natural head on a short neck, gently sloping shoulders,
// arms relaxed at the sides with simple hands beside the upper thighs, a
// balanced chest, waist and hips, and two legs down to simple feet. One path
// per side (mirrored), drawn at these proportions and never stretched to fit
// the labels. Decorative and never tappable.
const SIDE = [
  'M 167 12',
  'C 182 12 192 24 192 40', // crown to the widest point of the head
  'C 192 52 188 62 180 68', // jaw
  'C 178 72 178 76 179 80', // neck
  'C 180 86 181 90 184 92',
  'C 190 95 198 97 206 99', // shoulder slope
  'C 218 101 228 106 231 116', // round of the shoulder
  'C 235 130 236 150 237 170', // upper arm
  'C 238 186 240 198 241 208', // elbow
  'C 242 228 242 250 239 272', // forearm, tapering to the wrist
  'C 241 282 243 292 242 302', // hand
  'C 241 314 236 322 230 322',
  'C 225 322 223 316 224 306',
  'C 225 296 226 286 227 276', // wrist (inner)
  'C 226 256 224 236 223 210', // forearm (inner)
  'C 222 196 220 186 218 176', // inner elbow
  'C 216 160 216 146 216 134', // inner upper arm to the armpit
  'C 216 150 215 170 213 190', // chest and ribs
  'C 211 205 208 216 209 226', // waist
  'C 210 244 215 262 216 282', // hip
  'C 217 300 215 322 212 342', // outer thigh
  'C 209 360 205 376 204 392', // knee
  'C 203 406 206 424 202 444', // calf
  'C 199 458 196 466 194 474', // ankle
  'C 197 482 201 489 200 496', // foot
  'C 200 502 192 503 183 502',
  'L 181 502',
  'C 179 494 180 482 181 474', // heel and inner ankle
  'C 182 460 180 438 180 418', // inner calf
  'C 180 404 177 396 177 388', // inner knee
  'C 176 362 175 338 172 326', // inner thigh
  'Q 169 318 167 318', // crotch
].join(' ')
const mirrorPath = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${2 * CX - Number(x)} ${y}`)
function Outline() {
  return (
    <g className="bm-outline" aria-hidden="true">
      <path d={SIDE} />
      <path d={mirrorPath(SIDE)} />
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
