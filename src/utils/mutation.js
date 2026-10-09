// ---------------------------------------------------------------------
// Mutation: display-only letter scramble for Race answer tiles
// ---------------------------------------------------------------------
// Only what is drawn on the tile changes. Spaces, punctuation and digits keep
// their places, each word's letters are shuffled among that word's own letter
// positions, and the original upper/lower case pattern stays by position. The
// option's real text (what is submitted and scored, and every explanation)
// is never touched; the tile simply shows the original again when the effect
// ends. The same text and seed always give the same scramble, so the effect
// is one fixed rendering for its two seconds, never a flicker.
import { makeRng, hashStringToSeed } from './puzzleAssembler.js'

const LETTER = /\p{L}/u

function shuffleWord(letters, rand) {
  const a = letters.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function scrambleLabel(text, seed = 0) {
  const src = String(text)
  const chars = [...src]
  const rand = makeRng((hashStringToSeed(src) ^ (seed >>> 0)) >>> 0)
  const out = chars.slice()
  // Words: maximal runs of letters (apostrophes and hyphens split words, so
  // punctuation stays exactly where it was).
  let i = 0
  const words = []
  while (i < chars.length) {
    if (!LETTER.test(chars[i])) {
      i++
      continue
    }
    let j = i
    while (j < chars.length && LETTER.test(chars[j])) j++
    words.push([i, j])
    i = j
  }
  const lowerOf = (c) => c.toLowerCase()
  const isUpper = (c) => c !== c.toLowerCase() && c === c.toUpperCase()
  for (const [s, e] of words) {
    const letters = chars.slice(s, e).map(lowerOf)
    if (new Set(letters).size < 2) continue
    let mixed = shuffleWord(letters, rand)
    // Make sure the word visibly changes.
    for (let k = 0; k < 6 && mixed.join('') === letters.join(''); k++) mixed = shuffleWord(letters, rand)
    if (mixed.join('') === letters.join('')) mixed = [...letters.slice(1), letters[0]]
    for (let k = s; k < e; k++) out[k] = isUpper(chars[k]) ? mixed[k - s].toUpperCase() : mixed[k - s]
  }
  // A label with no shuffleable word (e.g. "A", "II") is shown with its
  // letters reversed across the whole label, still letters only.
  if (out.join('') === src) {
    const pos = chars.map((c, k) => (LETTER.test(c) ? k : -1)).filter((k) => k >= 0)
    const rev = pos.map((k) => chars[k]).reverse()
    pos.forEach((k, n) => (out[k] = rev[n]))
  }
  return out.join('')
}

// Is an effect running at this (server-corrected) instant?
export function activeEffect(events, me, nowMs) {
  for (let i = (events || []).length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.kind !== 'mutation' || e.to_user !== me) continue
    const start = Date.parse(e.starts_at)
    const end = Date.parse(e.ends_at)
    if (nowMs >= start && nowMs < end) return { id: e.id, seed: Number(e.data?.seed) || e.id, endsAt: end }
  }
  return null
}
