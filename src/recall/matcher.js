// ---------------------------------------------------------------------
// Name the connection: the local matcher.
// ---------------------------------------------------------------------
// Decides whether a player's typed answer names a group's connection.
// Cheapest reliable path first, all on the device and instant:
//
//   1. normalization  (see normalize.js: case, punctuation, abbreviations,
//                      plurals, relation words, word order)
//   2. exact match    against the canonical name and its aliases
//   3. weighted overlap with typo tolerance: specific medical words count
//      far more than generic ones, so "bacteria" alone never passes for
//      "Organisms causing infective endocarditis"
//
// It returns a confidence band:
//   high    clearly the same connection: accept
//   medium  plausible but broad or narrow: ask once to be more specific
//           (and, when available, let the semantic check decide; judge.js)
//   low     not the same connection
//
// The canonical name and its aliases are the only source of truth. The
// matcher compares phrases; it never decides medical facts.

import { tokens, bagKey, CONCEPT_NAMES } from './normalize.js'

// Weights for relation concepts. Head nouns (organisms, drugs) and frames that
// change the meaning (adverse effects, treatment, raised vs low) are required
// when the category has them; CAUSE is required only when it is the whole
// frame ("Causes of X"). Generic words weigh little.
const CONCEPT_WEIGHT = { CAUSE: 0.7, ASSOC: 0.5, ORGANISM: 1.2, DRUG: 1.2, ADVERSE: 1.6, TREAT: 1.6, DISEASE: 0.4, UP: 1.3, DOWN: 1.3, PROLONG: 1.6, FINDING: 1.2, PLACE: 1.5, NEG: 2, DERIVE: 1.2 }
const REQUIRED_FRAMES = new Set(['ORGANISM', 'DRUG', 'ADVERSE', 'TREAT', 'UP', 'DOWN', 'PROLONG', 'FINDING', 'NEG'])
// Relation frames that name different questions about the same topic:
// causes of X, signs of X, treatment of X and adverse effects of X differ.
const RELATION_FAMILY = ['CAUSE', 'FINDING', 'TREAT', 'ADVERSE']
const HEAD_FRAMES = new Set(['ORGANISM', 'DRUG', 'DISEASE', 'FINDING'])
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP' }
const GENERIC = new Set('structure traverse traversing passing pass through content contained containing type pattern class classe based related named common main major minor key important clinical medical general specific primary secondary syndrome process effect thing system cell factor finding level value'.split(' '))
const GENERIC_WEIGHT = 0.6
// Modifiers that are usually implied and may be left out without changing
// which connection is meant ("endocarditis organisms" for "organisms causing
// infective endocarditis"). They weigh little and are never the anchor.
const SOFT = new Set('interval infective infectious acute chronic digital congenital true typical clinical classic'.split(' '))
const SOFT_WEIGHT = 0.5

// ---- vocabulary and word weights, built once from all puzzle content ----
let VOCAB = null // Map word -> document frequency across category names
let VOCAB_ALL = null // every word seen in names, aliases and tiles
let DOCS = 1

export function buildVocabulary(categories = []) {
  const df = new Map()
  const all = new Set()
  for (const c of categories) {
    const names = [c.canonical || c.title, ...(c.aliases || [])]
    const seen = new Set()
    for (const n of names) for (const t of tokens(n)) seen.add(t)
    seen.forEach((t) => {
      df.set(t, (df.get(t) || 0) + 1)
      all.add(t)
    })
    for (const tile of c.tiles || (c.items || []).map((i) => i.term) || []) for (const t of tokens(tile)) all.add(t)
  }
  VOCAB = df
  VOCAB_ALL = all
  DOCS = Math.max(categories.length, 1)
}
export function vocabularyReady() {
  return VOCAB !== null
}

function weight(t, boost) {
  let w
  if (CONCEPT_NAMES.has(t)) w = CONCEPT_WEIGHT[t] ?? 0.6
  else if (GENERIC.has(t)) w = GENERIC_WEIGHT
  else if (SOFT.has(t)) w = SOFT_WEIGHT
  else if (/^\d+$/.test(t)) w = 1.5
  else if (VOCAB && !VOCAB_ALL.has(t)) w = 1.5 // unknown word: likely filler or a typo
  else {
    const df = VOCAB?.get(t) || 0
    w = Math.max(1, Math.min(7, Math.log((DOCS + 1) / (df + 1)) + 1))
  }
  return boost?.has(t) ? w * 1.5 : w
}

// ---- typo tolerance ----
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  // Damerau-Levenshtein (adjacent swaps count as one edit), with early exit.
  let prev2 = null
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (prev2 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1)
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev2 = prev
    prev = cur
  }
  return prev[b.length]
}

// Two words match when equal, or when the player's word is a near miss of the
// target AND is not itself a different known word. That keeps real typos
// ("endocardits") while refusing look-alikes that mean something else
// ("nephritic" for "nephrotic", "hypokalemia" for "hyperkalemia").
function wordMatch(u, c) {
  if (u === c) return true
  if (CONCEPT_NAMES.has(u) || CONCEPT_NAMES.has(c)) return u === c || (u === 'ASSOC' && c === 'CAUSE') || (u === 'CAUSE' && c === 'ASSOC')
  if (VOCAB_ALL?.has(u) && VOCAB_ALL?.has(c)) return false
  if (/^hyp(?:er|o)/.test(u) || /^hyp(?:er|o)/.test(c)) {
    if (u.slice(0, 5) !== c.slice(0, 5)) return false
  }
  if (u[0] !== c[0] || c.length < 5) return false
  const max = c.length >= 10 ? 2 : 1
  return editDistance(u, c, max) <= max
}

function scorePhrase(userToks, target, boost) {
  const C = tokens(target)
  if (C.length === 0) return null
  const matchedC = C.filter((c) => userToks.some((u) => wordMatch(u, c)))
  const wSum = C.reduce((a, t) => a + weight(t, boost), 0)
  const wHit = matchedC.reduce((a, t) => a + weight(t, boost), 0)
  const recall = wSum ? wHit / wSum : 0
  const uSum = userToks.reduce((a, t) => a + weight(t, boost), 0)
  const uHit = userToks.filter((u) => C.some((c) => wordMatch(u, c))).reduce((a, t) => a + weight(t, boost), 0)
  const precision = uSum ? uHit / uSum : 0

  // Anchor: the category's most specific words. One of them must be named.
  const content = C.filter((t) => !CONCEPT_NAMES.has(t) && !SOFT.has(t) && !GENERIC.has(t))
  const maxW = Math.max(0, ...content.map((t) => weight(t, boost)))
  const anchors = content.filter((t) => weight(t, boost) >= maxW * 0.75)
  const anchorHit = anchors.length === 0 ? matchedC.some((t) => CONCEPT_NAMES.has(t)) : anchors.some((a) => matchedC.includes(a))

  // Frames: head nouns and meaning-changing relations must be present.
  const frames = C.filter((t) => REQUIRED_FRAMES.has(t))
  const hasHead = C.some((t) => HEAD_FRAMES.has(t))
  if (C.includes('CAUSE') && !hasHead) frames.push('CAUSE')
  const framesMissing = frames.filter((f) => !userToks.some((u) => wordMatch(u, f)))
  const opposite = C.some((t) => OPPOSITE[t] && userToks.includes(OPPOSITE[t]) && !userToks.includes(t))
  // "non-anion gap" is not "anion gap": negation must agree.
  const negation = C.includes('NEG') !== userToks.includes('NEG')
  // "Causes of X" is not "Signs of X".
  const cRel = RELATION_FAMILY.filter((f) => C.includes(f))
  const uRel = RELATION_FAMILY.filter((f) => userToks.includes(f))
  const relationClash = cRel.length > 0 && uRel.length > 0 && !uRel.some((f) => cRel.includes(f))
  // Asking about signs, treatment or adverse effects of something when the
  // category names the thing itself is a different question; let it be
  // judged rather than accepted outright.
  const extraFrame = userToks.some((u) => ['FINDING', 'TREAT', 'ADVERSE'].includes(u) && !C.includes(u))
  const contradiction = opposite || negation || relationClash

  // The answer must say something specific, not just "bacteria" or "drugs".
  const userSpecific = userToks.some((u) => !CONCEPT_NAMES.has(u) && !GENERIC.has(u))

  // A swap: the category's key word is missing and a different known medical
  // word stands in its place ("acidosis" for "alkalosis", "diastolic" for
  // "systolic"). That names a different connection.
  const topMissed = anchors.some((t) => !matchedC.includes(t))
  const strayKnown = userToks.some((u) => !CONCEPT_NAMES.has(u) && !GENERIC.has(u) && !SOFT.has(u) && VOCAB_ALL?.has(u) && weight(u, boost) >= 2 && !C.some((c) => wordMatch(u, c)))
  const swap = topMissed && strayKnown

  return { recall, precision, anchorHit, framesMissing, contradiction, userSpecific, swap, extraFrame }
}

// match(answer, group) -> { band: 'high'|'medium'|'low', via, score }
// group: { canonical, aliases?, keyTerms?, doNotAccept? }
export function matchAnswer(answer, group) {
  const userToks = tokens(answer)
  if (userToks.length === 0) return { band: 'low', via: 'empty', score: 0 }
  const key = userToks.slice().sort().join(' ')
  const accepted = [group.canonical, ...(group.aliases || [])].filter(Boolean)

  // Exact (normalized, any order)
  if (accepted.some((p) => bagKey(p) === key)) return { band: 'high', via: 'exact', score: 1 }
  // Explicitly too broad
  if ((group.doNotAccept || []).some((p) => bagKey(p) === key)) return { band: 'low', via: 'rejected-phrase', score: 0 }

  const boost = new Set((group.keyTerms || []).flatMap((t) => tokens(t)))
  let best = null
  for (const p of accepted) {
    const s = scorePhrase(userToks, p, boost)
    if (!s) continue
    const score = s.recall * 0.7 + s.precision * 0.3
    if (!best || score > best.score) best = { ...s, score }
  }
  if (!best || !best.userSpecific || best.contradiction || best.swap) return { band: 'low', via: 'overlap', score: best?.score || 0 }

  if (best.anchorHit && best.framesMissing.length === 0 && !best.extraFrame && best.recall >= 0.6 && best.precision >= 0.6) {
    return { band: 'high', via: 'overlap', score: best.score }
  }
  if ((best.anchorHit && best.recall >= 0.35) || best.recall >= 0.5) return { band: 'medium', via: 'overlap', score: best.score }
  return { band: 'low', via: 'overlap', score: best.score }
}

// The group fields the matcher reads, from a puzzle category.
export function recallTarget(category) {
  return {
    canonical: category.canonical || category.title,
    aliases: category.aliases || [],
    keyTerms: category.keyTerms || [],
    doNotAccept: category.doNotAccept || [],
  }
}
