import React from 'react'

// ---------------------------------------------------------------------
// Plexus group motifs: the identity of the four connection groups.
// ---------------------------------------------------------------------
// Each group is four concepts, so each motif is four nodes. What tells the
// groups apart is HOW the four connect, plus colour, so the groups never rely
// on colour alone:
//   level 1  Burnt coral  chain    a path, one concept leading to the next
//   level 2  Peacock      hub      one central concept with three branches
//   level 3  Sapphire     cluster  three concepts linked tightly, one tied on
//   level 4  Amethyst     mesh     two linked triangles, the densest web
// Complexity rises with difficulty. These are the four distinct ways four
// nodes can connect, not geometric shapes drawn in dots.
//
// Two layouts share each topology: `badge` (square, for headers and labels)
// and `row` (wide, for the results stack). `missed` draws the four concepts
// as loose open nodes with no links (a group that was not found). `animate`
// assembles the motif once: nodes appear, then the links draw (~280ms).

export const GROUP_META = {
  1: { name: 'Burnt coral', motif: 'chain', label: 'chain' },
  2: { name: 'Peacock', motif: 'hub', label: 'hub' },
  3: { name: 'Sapphire', motif: 'cluster', label: 'cluster' },
  4: { name: 'Amethyst', motif: 'mesh', label: 'mesh' },
}

// Colour per group, resolved by context: base jewel tones on cream surfaces,
// lifted tints with an ivory rim on the gemstone rooms (see --group-* tokens).
export const GROUP_VARS = {
  1: 'var(--group-coral, #c25b40)',
  2: 'var(--group-peacock, #0b7480)',
  3: 'var(--group-sapphire, #2c57b0)',
  4: 'var(--group-amethyst, #7848b2)',
}
export const groupColor = (level) => GROUP_VARS[level] || 'var(--text)'

// Node positions and links for each topology, per layout.
const GEOMETRY = {
  badge: {
    w: 24,
    h: 24,
    r: 2.7,
    chain: { n: [[4, 16.5], [9.5, 8], [14.5, 16], [20, 7.5]], l: [[0, 1], [1, 2], [2, 3]] },
    hub: { n: [[12, 12.5], [4.5, 7], [19.5, 6.5], [13.5, 20.5]], l: [[0, 1], [0, 2], [0, 3]] },
    cluster: { n: [[5, 8.5], [13, 5], [9.5, 14.5], [19.5, 19]], l: [[0, 1], [1, 2], [2, 0], [2, 3]] },
    mesh: { n: [[4.5, 12.5], [12, 4.5], [12.5, 18], [20.5, 10]], l: [[0, 1], [1, 2], [2, 0], [1, 3], [2, 3]] },
  },
  row: {
    w: 72,
    h: 20,
    r: 3,
    chain: { n: [[7, 13], [26, 6.5], [45, 13], [65, 6.5]], l: [[0, 1], [1, 2], [2, 3]] },
    hub: { n: [[36, 10], [9, 10], [62, 4], [62, 16]], l: [[0, 1], [0, 2], [0, 3]] },
    cluster: { n: [[8, 14], [20, 5], [31, 14], [64, 9]], l: [[0, 1], [1, 2], [2, 0], [2, 3]] },
    mesh: { n: [[7, 12], [28, 3.5], [38, 16.5], [65, 8]], l: [[0, 1], [1, 2], [2, 0], [1, 3], [2, 3]] },
  },
}

export default function GroupMotif({ level, layout = 'badge', size, missed = false, animate = false, className = '', title }) {
  const meta = GROUP_META[level] || GROUP_META[1]
  const g = GEOMETRY[layout] || GEOMETRY.badge
  const shape = g[meta.motif]
  const width = size || (layout === 'row' ? 72 : 22)
  const height = layout === 'row' ? (width * g.h) / g.w : width
  // title="" marks the motif as decorative (its group title is right next to it).
  const decorative = title === ''
  const label = title || `${meta.name} ${meta.label}`
  return (
    <svg
      className={`group-motif group-motif-${layout} motif-${meta.motif} ${missed ? 'is-missed' : ''} ${animate ? 'is-assembling' : ''} ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${g.w} ${g.h}`}
      style={{ '--motif-color': groupColor(level) }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      focusable="false"
    >
      {!missed && (
        <g className="motif-links">
          {shape.l.map(([a, b], i) => (
            <path
              key={i}
              className="motif-link"
              d={`M${shape.n[a][0]} ${shape.n[a][1]}L${shape.n[b][0]} ${shape.n[b][1]}`}
              pathLength="1"
              style={{ '--i': i }}
            />
          ))}
        </g>
      )}
      <g className="motif-nodes">
        {shape.n.map(([x, y], i) => (
          <circle key={i} className="motif-node" cx={x} cy={y} r={g.r} style={{ '--i': i }} />
        ))}
      </g>
    </svg>
  )
}
