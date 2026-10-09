// Each Systems subject's node colour: one accent from the shared four-colour
// Plexus palette, cycled by the subject's position (Coral, Teal, Cobalt,
// Plum, repeat). The Systems grid, a subject's page and its completion
// celebration all read it from here so they always match.
import { NODE_VARS } from '../data/constants.js'
import { LIBRARY_SUBJECTS } from './newLibrary.js'

export function systemAccent(system) {
  const idx = LIBRARY_SUBJECTS.indexOf(system)
  return NODE_VARS[(idx < 0 ? 0 : idx) % NODE_VARS.length] || NODE_VARS[0]
}

// The completion burst: the subject's colour, a lighter and a deeper shade of
// it, and an occasional ivory piece.
export function systemConfettiPalette(system) {
  const c = systemAccent(system)
  return [c, `color-mix(in srgb, ${c} 62%, #ffffff)`, c, `color-mix(in srgb, ${c} 72%, #000000)`, c, `color-mix(in srgb, ${c} 80%, #ffffff)`, 'var(--ivory-text, #fbf6ee)']
}
