import React from 'react'
import { groupColor } from './GroupMotif.jsx'

// ---------------------------------------------------------------------
// Difficulty icons: a secondary icon system, used ONLY to mark difficulty.
// ---------------------------------------------------------------------
// The abstract Plexus nodes stay the brand (logo, intro, constellations,
// group motifs, Archive marks). These four medical symbols only answer
// "how hard was this?":
//   level 1  Easy    medical cross
//   level 2  Medium  EKG tracing
//   level 3  Hard    droplet
//   level 4  Expert  rod of Asclepius
// One construction for all four so they read as a family: a single 1.8 stroke
// on a 24 grid, round caps and joins, no fills except one small node per
// icon (the cross's centre, the end of the trace, the drop's core, the
// serpent's head), which ties them to the Plexus node language. They draw in
// the difficulty's jewel tone (base tone on cream, lifted tint on a room).
// On solved cards they replace the old group motif, so each card carries one
// symbol system: medical icon + difficulty word.

export const DIFFICULTY_LABEL = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert' }

const ICONS = {
  // Easy: a medical cross drawn as one outline.
  1: {
    d: 'M9.6 4.5h4.8v5.1h5.1v4.8h-5.1v5.1H9.6v-5.1H4.5V9.6h5.1z',
    node: [12, 12],
  },
  // Medium: one beat of an EKG, flat baseline either side.
  2: {
    d: 'M2.5 13.2h4.3l1.9-3.2 2.4 7.6 2.7-12.1 2.2 7.7h5.5',
    node: [21.5, 13.2],
  },
  // Hard: a clean drop, slightly fuller at the base.
  3: {
    d: 'M12 3.6C9.4 7.6 6.2 11.3 6.2 14.7a5.8 5.8 0 0 0 11.6 0c0-3.4-3.2-7.1-5.8-11.1z',
    node: [12, 15.2],
  },
  // Expert: the rod of Asclepius, a staff with one serpent.
  4: {
    d: 'M12 3v18M16.2 5.4c-1.5-.4-3.2-.2-4.4.4-1.4.7-2.4 1.6-2.4 2.8 0 2.4 5.2 1.9 5.2 4.6 0 1.6-1.6 2.6-2.6 3.1',
    node: [16.2, 5.4],
  },
}

export default function DifficultyIcon({ level, size = 18, className = '', title, decorative = false }) {
  const icon = ICONS[level] || ICONS[1]
  const label = title || DIFFICULTY_LABEL[level] || ''
  return (
    <svg
      className={`difficulty-icon difficulty-icon-${level} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: groupColor(level) }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      focusable="false"
    >
      <path d={icon.d} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={icon.node[0]} cy={icon.node[1]} r="1.8" fill="currentColor" />
    </svg>
  )
}

// Icon + word, for places that label difficulty explicitly.
export function DifficultyTag({ level, size = 18, className = '' }) {
  return (
    <span className={`difficulty-tag ${className}`}>
      <DifficultyIcon level={level} size={size} decorative />
      <span className="difficulty-tag-label">{DIFFICULTY_LABEL[level]}</span>
    </span>
  )
}
