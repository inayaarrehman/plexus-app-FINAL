// ---------------------------------------------------------------------
// Expanded 3-Minute modes (Sections 17–31) — engine, grounded ONLY in
// verified content, with strict per-round validation.
// ---------------------------------------------------------------------
// Every builder below returns a fully-formed round or null. Nothing infers
// medicine from text: membership is decided by whether a concept LITERALLY
// appears as a tile in a verified category (an exact, explicit signal), and
// ordered chains come only from the curated chainBank. A round is emitted
// only if validateModeRound passes it — ambiguous rounds are rejected, never
// fudged. Cognitive-task tags let the session composer vary the KIND of
// thinking, not just the mode.
import connectionBank from '../data/connectionBank.js'
import chainBank from '../data/chainBank.js'
import { normalizeTile, shuffleWith } from './puzzleAssembler.js'

// Which kind of thinking each mode demands (Section 32).
export const COGNITIVE_TASK = {
  miniConnections: 'GROUPING',
  rapidAssociation: 'GROUPING',
  impostor: 'IDENTIFICATION',
  completeConnection: 'IDENTIFICATION',
  linkTwo: 'IDENTIFICATION',
  commonLink: 'CLASSIFICATION', // "Which Connection?"
  matchTheLink: 'CLASSIFICATION',
  split: 'CLASSIFICATION',
  sameOrDifferent: 'CLASSIFICATION',
  chain: 'SEQUENCING',
  completeTheChain: 'MECHANISM',
  doubleAgent: 'OVERLAP',
}

// Curated clean binary classifier pairs for Split — pairs of EXISTING
// verified category titles whose membership is a medically clean two-bucket
// split. Referencing verified content, not authoring new facts.
export const SPLIT_PAIRS = [
  ['Nephrotic-pattern glomerular diseases', 'Nephritic-pattern glomerular diseases'],
  ['Obstructive lung diseases', 'Restrictive lung diseases'],
  ['Systolic murmurs', 'Diastolic murmurs'],
  ['Gs-coupled receptors (increased cAMP)', 'Gq-coupled receptors'],
]

// ---- Verified content index (memoized by bank reference) ----
let _cache = null
function index(bank) {
  if (_cache && _cache.bank === bank) return _cache
  const verified = bank.filter((c) => c.status === 'verified')
  // Dedupe categories by title (the bank contains a few near-duplicate
  // entries); keep the first, so "a category" means one title.
  const byTitle = new Map()
  for (const c of verified) if (!byTitle.has(c.title)) byTitle.set(c.title, c)
  const cats = [...byTitle.values()]
  // Categories usable in single-concept formats: not wordplay, with curated
  // near misses to draw plausible wrong answers from.
  const quiz = cats.filter((c) => !isWordplay(c) && nearMissesOf(c).length >= 4)
  // normalized tile -> Set of category titles it appears in
  const tileTitles = new Map()
  for (const c of cats) {
    for (const t of c.tiles) {
      const k = normalizeTile(t)
      if (!tileTitles.has(k)) tileTitles.set(k, new Set())
      tileTitles.get(k).add(c.title)
    }
  }
  _cache = { bank, cats, quiz, byTitle, tileTitles }
  return _cache
}

// Wordplay groups ("___ triad", eponym fragments) are fine on a board but their
// tiles are not complete concepts on their own, so the 3-Minute formats that
// show single concepts or ask about membership never use them.
export function isWordplay(c) {
  return c.connectionType === 'language' || c.connectionType === 'meta-wordplay' || String(c.title || '').includes('___')
}
// Curated near misses for a category (complete concepts that do NOT belong,
// each with a reason), minus anything that is actually one of its tiles.
export function nearMissesOf(c) {
  const own = new Set((c.tiles || []).map(normalizeTile))
  return (c.nearMisses || []).filter((n) => n && n.text && !own.has(normalizeTile(n.text)))
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]
const sample = (arr, n, rng) => shuffleWith(arr, rng).slice(0, n)
// titles a concept (tile text) belongs to
const titlesOf = (idx, text) => idx.tileTitles.get(normalizeTile(text)) || new Set()
const belongsTo = (idx, text, title) => titlesOf(idx, text).has(title)

// tiles of a category not shared with another category (pure-A members)
function exclusiveTiles(idx, ownerTitle, otherTitle) {
  const owner = idx.byTitle.get(ownerTitle)
  if (!owner) return []
  return owner.tiles.filter((t) => !belongsTo(idx, t, otherTitle))
}

// ---------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------

// SPLIT — two labelled buckets, eight concepts, sort four into each.
export function buildSplit(bank, rng) {
  const idx = index(bank)
  const pairs = shuffleWith(SPLIT_PAIRS, rng)
  for (const [ta, tb] of pairs) {
    const a = idx.byTitle.get(ta)
    const b = idx.byTitle.get(tb)
    if (!a || !b) continue
    const tiles = [
      ...a.tiles.map((text) => ({ text, group: 'a' })),
      ...b.tiles.map((text) => ({ text, group: 'b' })),
    ]
    return {
      type: 'split',
      prompt: 'Split them.',
      labelA: ta,
      labelB: tb,
      tiles: shuffleWith(tiles, rng),
      systems: [...new Set([...(a.systems || []), ...(b.systems || [])])],
      conceptTags: [ta, tb],
      explanation: `${ta} vs ${tb}.`,
    }
  }
  return null
}

// MATCH THE LINK — four concepts, four labels, one clean match each.
export function buildMatchTheLink(bank, rng) {
  const idx = index(bank)
  for (let attempt = 0; attempt < 40; attempt++) {
    const chosen = sample(idx.cats.filter((c) => !isWordplay(c)), 4, rng)
    if (chosen.length < 4) return null
    const labels = chosen.map((c) => c.title)
    const concepts = []
    let ok = true
    for (const c of chosen) {
      const tile = pick(c.tiles, rng)
      // The concept must match ONLY its own label among the four shown.
      const others = labels.filter((t) => t !== c.title)
      if (others.some((t) => belongsTo(idx, tile, t))) {
        ok = false
        break
      }
      concepts.push({ text: tile, label: c.title })
    }
    if (!ok) continue
    const answer = {}
    concepts.forEach((p) => {
      answer[p.text] = p.label
    })
    return {
      type: 'matchTheLink',
      prompt: 'Match each to its link.',
      concepts: shuffleWith(concepts.map((p) => p.text), rng),
      labels: shuffleWith(labels, rng),
      answer,
      systems: [...new Set(chosen.flatMap((c) => c.systems || []))],
      conceptTags: labels,
    }
  }
  return null
}

// DOUBLE AGENT — one concept that belongs to BOTH displayed connections.
export function buildDoubleAgent(bank, rng) {
  const idx = index(bank)
  // Concepts that genuinely appear in >=2 distinct verified categories.
  const duals = [...idx.tileTitles.entries()].filter(([, titles]) => titles.size >= 2)
  if (duals.length === 0) return null
  for (const [normText, titleSet] of shuffleWith(duals, rng)) {
    const titles = shuffleWith([...titleSet].filter((t) => idx.quiz.some((c) => c.title === t)), rng)
    if (titles.length < 2) continue
    const [A, B] = titles
    // The intended dual concept's original (display) text.
    const a = idx.byTitle.get(A)
    const dualDisplay = a.tiles.find((t) => normalizeTile(t) === normText)
    if (!dualDisplay) continue
    // Distractors: some A-only, some B-only, some neither — NONE dual.
    const aOnly = exclusiveTiles(idx, A, B).filter((t) => normalizeTile(t) !== normText)
    const bOnly = exclusiveTiles(idx, B, A).filter((t) => normalizeTile(t) !== normText)
    // "Neither" option: a curated near miss of one of the two groups.
    const neither = [...nearMissesOf(idx.byTitle.get(A)), ...nearMissesOf(idx.byTitle.get(B))]
      .map((n) => n.text)
      .filter((t) => !belongsTo(idx, t, A) && !belongsTo(idx, t, B))
    const distractors = [...sample(aOnly, 2, rng), ...sample(bOnly, 2, rng), ...sample(neither, 1, rng)]
      .filter(Boolean)
    if (distractors.length < 4) continue
    const options = shuffleWith(
      [{ text: dualDisplay, both: true }, ...distractors.map((text) => ({ text, both: false }))],
      rng
    )
    return {
      type: 'doubleAgent',
      prompt: 'Which belongs to both?',
      labelA: A,
      labelB: B,
      options,
      correctAnswer: dualDisplay,
      systems: [...new Set([...(idx.byTitle.get(A).systems || []), ...(idx.byTitle.get(B).systems || [])])],
      conceptTags: [A, B],
      explanation: `${dualDisplay} appears in both ${A} and ${B}.`,
    }
  }
  return null
}

// LINK TWO — exactly two of the shown concepts belong to the named group.
// The other four are that group's curated near misses.
export function buildLinkTwo(bank, rng) {
  const idx = index(bank)
  if (idx.quiz.length === 0) return null
  for (let attempt = 0; attempt < 20; attempt++) {
    const target = pick(idx.quiz, rng)
    const correct = sample(target.tiles, 2, rng)
    const near = sample(nearMissesOf(target), 4, rng)
    if (correct.length < 2 || near.length < 4) continue
    const options = shuffleWith(
      [...correct.map((text) => ({ text, correct: true })), ...near.map((n) => ({ text: n.text, correct: false, why: n.why }))],
      rng
    )
    return {
      type: 'linkTwo',
      prompt: target.title,
      anchorLabel: target.title,
      options,
      correctAnswers: correct,
      systems: target.systems || [],
      conceptTags: [target.title],
      explanation: target.explanation,
    }
  }
  return null
}

// BELONGS? (type id kept as sameOrDifferent for saved stats) — the group is
// named, two concepts are shown, and the player says whether BOTH belong.
// "No" rounds pair a real member with one of the group's curated near misses,
// so the answer never depends on an unstated relationship.
export function buildSameOrDifferent(bank, rng) {
  const idx = index(bank)
  if (idx.quiz.length === 0) return null
  const c = pick(idx.quiz, rng)
  if (rng() < 0.5) {
    const [t1, t2] = sample(c.tiles, 2, rng)
    if (!t1 || !t2) return null
    return {
      type: 'sameOrDifferent',
      prompt: c.title,
      anchorLabel: c.title,
      pair: [t1, t2],
      answer: 'same',
      systems: c.systems || [],
      conceptTags: [c.title],
      explanation: `${t1} and ${t2} both belong to ${c.title}.`,
    }
  }
  const member = pick(c.tiles, rng)
  const nm = pick(nearMissesOf(c), rng)
  if (!member || !nm) return null
  return {
    type: 'sameOrDifferent',
    prompt: c.title,
    anchorLabel: c.title,
    pair: shuffleWith([member, nm.text], rng),
    answer: 'different',
    outsider: nm.text,
    systems: c.systems || [],
    conceptTags: [c.title],
    explanation: `${nm.text} does not belong: ${nm.why}`,
  }
}

// CHAIN — order four steps of a verified sequence.
export function buildChain(bank, rng) {
  if (chainBank.length === 0) return null
  const chain = pick(chainBank, rng)
  return {
    type: 'chain',
    prompt: 'Build the chain.',
    title: chain.title,
    steps: shuffleWith(chain.steps, rng),
    order: chain.steps.slice(),
    systems: chain.systems || [],
    conceptTags: [chain.title],
    explanation: chain.note,
  }
}

// COMPLETE THE CHAIN — one missing middle step, pick it.
export function buildCompleteTheChain(bank, rng) {
  if (chainBank.length < 2) return null
  const chain = pick(chainBank, rng)
  const missingIndex = 1 + Math.floor(rng() * 2) // hide step 2 or 3 (a middle step)
  const missing = chain.steps[missingIndex]
  // Curated wrong steps for this chain (never steps from unrelated chains).
  const distractors = sample((chain.decoys || []).filter((s) => !chain.steps.includes(s)), 3, rng)
  if (distractors.length < 3) return null
  const sequence = chain.steps.map((s, i) => (i === missingIndex ? null : s))
  return {
    type: 'completeTheChain',
    prompt: 'Complete the chain.',
    title: chain.title,
    sequence,
    missingIndex,
    options: shuffleWith([{ text: missing, correct: true }, ...distractors.map((text) => ({ text, correct: false }))], rng),
    correctAnswer: missing,
    systems: chain.systems || [],
    conceptTags: [chain.title],
    explanation: chain.note,
  }
}

export const NEW_BUILDERS = {
  split: buildSplit,
  matchTheLink: buildMatchTheLink,
  doubleAgent: buildDoubleAgent,
  linkTwo: buildLinkTwo,
  sameOrDifferent: buildSameOrDifferent,
  chain: buildChain,
  completeTheChain: buildCompleteTheChain,
}

// ---------------------------------------------------------------------
// Validation — a round is shown only if it passes.
// ---------------------------------------------------------------------
const lower = (s) => String(s).toLowerCase()
export function validateModeRound(round, bank) {
  if (!round) return { valid: false, reason: 'no round' }
  const idx = index(bank)

  if (round.type === 'split') {
    if (round.tiles.length !== 8) return { valid: false, reason: 'split: expected 8 tiles' }
    if (new Set(round.tiles.map((t) => lower(t.text))).size !== 8) return { valid: false, reason: 'split: duplicate tile' }
    const aCount = round.tiles.filter((t) => t.group === 'a').length
    if (aCount !== 4) return { valid: false, reason: 'split: buckets not 4/4' }
    // No tile may legitimately belong to the opposite bucket's category.
    for (const t of round.tiles) {
      const oppTitle = t.group === 'a' ? round.labelB : round.labelA
      if (belongsTo(idx, t.text, oppTitle)) return { valid: false, reason: 'split: a tile fits both buckets' }
    }
    return { valid: true }
  }

  if (round.type === 'matchTheLink') {
    if (round.concepts.length !== 4 || round.labels.length !== 4) return { valid: false, reason: 'match: need 4 + 4' }
    for (const concept of round.concepts) {
      const correctLabel = round.answer[concept]
      const matches = round.labels.filter((l) => belongsTo(idx, concept, l))
      // Exactly one displayed label may claim this concept, and it's the answer.
      if (matches.length !== 1 || matches[0] !== correctLabel) {
        return { valid: false, reason: 'match: a concept fits zero or multiple labels' }
      }
    }
    return { valid: true }
  }

  if (round.type === 'doubleAgent') {
    const both = round.options.filter((o) => o.both)
    if (both.length !== 1) return { valid: false, reason: 'doubleAgent: not exactly one dual member' }
    if (!belongsTo(idx, round.correctAnswer, round.labelA) || !belongsTo(idx, round.correctAnswer, round.labelB)) {
      return { valid: false, reason: 'doubleAgent: answer not verified in both' }
    }
    for (const o of round.options) {
      if (o.both) continue
      if (belongsTo(idx, o.text, round.labelA) && belongsTo(idx, o.text, round.labelB)) {
        return { valid: false, reason: 'doubleAgent: a distractor also belongs to both' }
      }
    }
    return { valid: true }
  }

  if (round.type === 'linkTwo') {
    if (round.options.length !== 6) return { valid: false, reason: 'linkTwo: expected 6 options' }
    if (round.options.filter((o) => o.correct).length !== 2) return { valid: false, reason: 'linkTwo: need exactly 2 correct' }
    for (const o of round.options) {
      if (o.correct) continue
      if (belongsTo(idx, o.text, round.anchorLabel)) return { valid: false, reason: 'linkTwo: a distractor is a real member' }
    }
    return { valid: true }
  }

  if (round.type === 'sameOrDifferent') {
    const [t1, t2] = round.pair
    if (!round.anchorLabel) return { valid: false, reason: 'belongs: the group must be named' }
    const inGroup = [t1, t2].filter((t) => belongsTo(idx, t, round.anchorLabel)).length
    if (round.answer === 'same' && inGroup !== 2) return { valid: false, reason: 'belongs: "yes" but not both are members' }
    if (round.answer === 'different' && inGroup !== 1) return { valid: false, reason: 'belongs: "no" must pair one member with one outsider' }
    return { valid: true }
  }

  if (round.type === 'chain') {
    if (round.order.length !== 4 || round.steps.length !== 4) return { valid: false, reason: 'chain: need 4 steps' }
    if (new Set(round.steps.map(lower)).size !== 4) return { valid: false, reason: 'chain: duplicate step' }
    return { valid: true }
  }

  if (round.type === 'completeTheChain') {
    if (round.options.filter((o) => o.correct).length !== 1) return { valid: false, reason: 'completeTheChain: need one answer' }
    if (new Set(round.options.map((o) => lower(o.text))).size !== round.options.length) return { valid: false, reason: 'completeTheChain: duplicate option' }
    return { valid: true }
  }

  return { valid: false, reason: `unknown mode ${round.type}` }
}

// ---------------------------------------------------------------------
// Mode quality gate (Section 30) — classify each new mode by how many
// distinct VALID rounds it can currently produce from verified content.
// ---------------------------------------------------------------------
export function assessModes(bank, { attempts = 120 } = {}) {
  let seed = 12345
  const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const report = {}
  for (const [mode, builder] of Object.entries(NEW_BUILDERS)) {
    const validKeys = new Set()
    const rejections = {}
    for (let i = 0; i < attempts; i++) {
      const round = builder(bank, rng)
      if (!round) {
        rejections['no-round'] = (rejections['no-round'] || 0) + 1
        continue
      }
      const v = validateModeRound(round, bank)
      if (v.valid) {
        // A stable-ish signature to count DISTINCT rounds.
        const key =
          round.type === 'chain' || round.type === 'completeTheChain'
            ? round.title + (round.missingIndex ?? '')
            : round.type === 'split'
              ? round.labelA
              : round.type === 'doubleAgent'
                ? round.correctAnswer + round.labelA + round.labelB
                : round.type === 'sameOrDifferent'
                  ? round.pair.join('|')
                  : (round.conceptTags || []).join('|') + (round.correctAnswer || '')
        validKeys.add(key)
      } else {
        rejections[v.reason] = (rejections[v.reason] || 0) + 1
      }
    }
    const distinct = validKeys.size
    // READY needs a healthy variety; LIMITED has some; NOT_READY ~none.
    const status = distinct >= 8 ? 'READY' : distinct >= 3 ? 'LIMITED' : 'NOT_READY'
    report[mode] = { distinctValid: distinct, status, rejections }
  }
  return report
}
