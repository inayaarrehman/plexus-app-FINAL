import React from 'react'

// Race artwork: two strands of nodes, one per player, converging on a single
// goal node. The same idea as the Race tile on Home, drawn wider for the top
// of the Race screens. Decorative only.
const A = [[10, 22], [44, 14], [80, 26], [116, 18], [150, 34]]
const B = [[10, 74], [44, 82], [80, 68], [116, 78], [150, 60]]
const GOAL = [196, 47]
const path = (pts) => [...pts, GOAL].map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

export default function RaceArt({ className = '' }) {
  return (
    <svg className={`race-art ${className}`} viewBox="0 0 210 96" aria-hidden="true" focusable="false">
      <path className="race-art-path race-art-a" d={path(A)} />
      <path className="race-art-path race-art-b" d={path(B)} />
      <g className="race-art-runner race-art-a">
        {A.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === A.length - 1 ? 5 : 4} />
        ))}
      </g>
      <g className="race-art-runner race-art-b">
        {B.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === B.length - 1 ? 5 : 4} />
        ))}
      </g>
      <circle className="race-art-goal-ring" cx={GOAL[0]} cy={GOAL[1]} r="11" />
      <circle className="race-art-goal" cx={GOAL[0]} cy={GOAL[1]} r="6.5" />
    </svg>
  )
}
