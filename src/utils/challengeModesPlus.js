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
import chainBank from '../data/chainBank.js'
import ARROWS from '../data/timedArrowsBank.js'
import { normalizeTile, shuffleWith } from './puzzleAssembler.js'
import { drawTier, pickAnchor, pickLookAlike, tierOf, blockedPair, VAGUE_LABELS } from './timedPacing.js'
import { titleLeak, answerShortcuts } from './surfaceSignals.js'

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
  // Added October 2026 (only two of the four above were still in the timed
  // library, so Split kept repeating). Each is a textbook two-way split
  // whose current tiles sit clearly on one side.
  ['Causes of a transudative pleural effusion', 'Causes of an exudative pleural effusion'],
  ['Upper lobe predominant lung disease', 'Lower lobe predominant lung disease'],
  ['Causes of hypokalemia', 'Causes of hyperkalemia'],
  ['Causes of hypercalcemia', 'Causes of hypocalcemia'],
  ['Causes of respiratory acidosis', 'Causes of respiratory alkalosis'],
  ['Autosomal dominant conditions', 'Autosomal recessive conditions'],
  ['Causes of a low DLCO', 'Causes of an increased DLCO'],
  ['Causes of anion gap metabolic acidosis', 'Causes of metabolic alkalosis'],
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

// ---- Imported Split, Sequence and Missing Step rounds ----
// From the AI-reviewed timed bank (src/data/timedArrowsBank.js). Each round
// keeps its stable content id and tile, step and choice ids; only the display
// order is shuffled, so the answer key never moves. A Sequence item and its
// Missing Step item share a concept id and count as one chain for repeats:
// both carry the same `conceptKey`, which the session (`used`), the device's
// recent list (`avoid`) and the composer's last-rounds check all read.
export const arrowsKey = (conceptId) => `arrows:${conceptId}`
const arrowsFresh = (items, avoid) => {
  if (!avoid || !avoid.size) return items
  const fresh = items.filter((x) => !avoid.has(arrowsKey(x.conceptId)))
  return fresh.length ? fresh : items
}
// Nearest requested tier, like pickAnchor.
const nearTier = (items, tier) => {
  if (tier == null) return items
  for (const d of [0, 1, 2]) {
    const near = items.filter((x) => Math.abs((x.tier ?? 1) - tier) === d)
    if (near.length) return near
  }
  return items
}
const arrowsBase = (it, type) => ({
  type,
  source: 'arrows',
  contentId: it.contentId,
  conceptId: it.conceptId,
  conceptKey: arrowsKey(it.conceptId),
  conceptTags: [arrowsKey(it.conceptId)],
  title: it.topic,
  prompt: it.prompt,
  context: it.context,
  tier: it.tier,
  systems: it.systems || [],
  explanation: it.explanation,
  review: it.review,
})
// Which source a format draws from: the imported items and the curated ones
// in proportion to how many each has, recent ones last.
// A requested tier (Race's shared difficulty curve) needs a rated item, and
// only the imported rounds carry a difficulty rating.
function chooseSource(arrowsCount, curatedCount, rng, tier) {
  if (tier != null && arrowsCount) return 'arrows'
  const total = arrowsCount + curatedCount
  return total && rng() * total < arrowsCount ? 'arrows' : 'curated'
}

// SPLIT — two labelled buckets. Curated pairs (eight concepts, four each,
// from verified categories) and imported rounds (six tiles, three each).
export function buildSplit(bank, rng, opts = {}) {
  if (chooseSource(ARROWS.split.length, SPLIT_PAIRS.length, rng, opts.tier) === 'arrows') {
    const it = pick(nearTier(arrowsFresh(ARROWS.split, opts.avoid), opts.tier), rng)
    return {
      ...arrowsBase(it, 'split'),
      labelA: it.labelA,
      labelB: it.labelB,
      tiles: shuffleWith(it.tiles.map((t) => ({ id: t.id, text: t.text, group: t.group, why: t.why })), rng),
      details: [
        ...it.tiles.filter((t) => t.group === 'a').map((t) => ({ text: t.text, tag: 'A', note: t.why })),
        ...it.tiles.filter((t) => t.group === 'b').map((t) => ({ text: t.text, tag: 'B', note: t.why })),
      ],
    }
  }
  return buildCuratedSplit(bank, rng, opts)
}
function buildCuratedSplit(bank, rng, opts = {}) {
  const idx = index(bank)
  // Pairs served recently on this device go last.
  const recent = (ta) => (opts.avoid && idx.byTitle.get(ta) && opts.avoid.has(idx.byTitle.get(ta).id) ? 1 : 0)
  const pairs = shuffleWith(SPLIT_PAIRS, rng).sort((x, y) => recent(x[0]) - recent(y[0]))
  for (const [ta, tb] of pairs) {
    const a = idx.byTitle.get(ta)
    const b = idx.byTitle.get(tb)
    if (!a || !b) continue
    const tiles = [
      ...a.tiles.map((text) => ({ id: text, text, group: 'a' })),
      ...b.tiles.map((text) => ({ id: text, text, group: 'b' })),
    ]
    return {
      type: 'split',
      prompt: 'Split them.',
      labelA: ta,
      labelB: tb,
      tiles: shuffleWith(tiles, rng),
      systems: [...new Set([...(a.systems || []), ...(b.systems || [])])],
      conceptTags: [ta, tb],
      explanation: [a.explanation && `${ta}: ${a.explanation}`, b.explanation && `${tb}: ${b.explanation}`].filter(Boolean).join(' ') || `${ta} vs ${tb}.`,
    }
  }
  return null
}

// MATCH THE LINK — four concepts, four labels, one clean match each.
export function buildMatchTheLink(bank, rng, opts = {}) {
  const idx = index(bank)
  const usable = idx.cats.filter((c) => !isWordplay(c) && !VAGUE_LABELS.has(c.title))
  const tier = opts.tier != null ? opts.tier : drawTier('matchTheLink', rng)
  for (let attempt = 0; attempt < 40; attempt++) {
    // Four labels from one subject where possible, sharing a tile kind, so a
    // concept cannot be matched just by noticing it is the only drug or the
    // only cardiology item.
    const first = pickAnchor(usable, rng, { tier, avoid: opts.avoid })
    if (!first) return null
    // Four labels from four different systems: labels from one system, or
    // two labels about the same idea, claimed each other's concepts when
    // generated rounds were reviewed.
    const chosen = [first]
    for (const c of shuffleWith(usable, rng)) {
      if (chosen.length >= 4) break
      if (chosen.some((x) => x.id === c.id || blockedPair(x, c) || (x.systems || []).some((s) => (c.systems || []).includes(s)))) continue
      chosen.push(c)
    }
    if (chosen.length < 4) continue
    const labels = chosen.map((c) => c.title)
    const concepts = []
    let ok = true
    for (const c of chosen) {
      const others = labels.filter((t) => t !== c.title)
      // Only a concept listed under exactly one category in the whole timed
      // library (a concept listed under two is the kind that fits two
      // labels), and not one that repeats a word of its own label.
      const clean = c.tiles.filter((t) => titlesOf(idx, t).size === 1 && !titleLeak(c.title, [t]).length && !others.some((o) => belongsTo(idx, t, o)))
      const tile = clean.length ? pick(clean, rng) : null
      if (!tile) {
        ok = false
        break
      }
      const note = c.tileExplanations && c.tileExplanations[c.tiles.indexOf(tile)]
      concepts.push({ text: tile, label: c.title, note })
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
      explanation: concepts.map((p) => `${p.text} → ${p.label}${p.note ? `: ${p.note}` : '.'}`).join(' '),
      tier: tierOf(first),
      systems: [...new Set(chosen.flatMap((c) => c.systems || []))],
      conceptTags: labels,
    }
  }
  return null
}

// DOUBLE AGENT — one concept that belongs to BOTH displayed connections.
export function buildDoubleAgent(bank, rng, opts = {}) {
  const idx = index(bank)
  // Concepts that genuinely appear in >=2 distinct verified categories.
  const duals = [...idx.tileTitles.entries()].filter(([, titles]) => titles.size >= 2)
  if (duals.length === 0) return null
  for (const [normText, titleSet] of shuffleWith(duals, rng)) {
    const titles = shuffleWith([...titleSet].filter((t) => !VAGUE_LABELS.has(t) && idx.quiz.some((c) => c.title === t)), rng)
    if (titles.length < 2) continue
    const [A, B] = titles
    // The intended dual concept's original (display) text.
    const a = idx.byTitle.get(A)
    const dualDisplay = a.tiles.find((t) => normalizeTile(t) === normText)
    if (!dualDisplay) continue
    // Distractors must be known NOT to belong to at least one of the two
    // groups, so none can secretly belong to both: a tile of one group that
    // the other group lists as a checked near miss, or a checked near miss of
    // either group. (Tiles that merely are not listed under the other group
    // were often members in fact; review of generated rounds caught that.)
    const nmA = nearMissesOf(idx.byTitle.get(A)).map((n) => n.text)
    const nmB = nearMissesOf(idx.byTitle.get(B)).map((n) => n.text)
    const inNm = (list, t) => list.some((x) => normalizeTile(x) === normalizeTile(t))
    const aOnly = exclusiveTiles(idx, A, B).filter((t) => normalizeTile(t) !== normText && inNm(nmB, t))
    const bOnly = exclusiveTiles(idx, B, A).filter((t) => normalizeTile(t) !== normText && inNm(nmA, t))
    const neither = [...nmA, ...nmB].filter((t) => normalizeTile(t) !== normText && !belongsTo(idx, t, A) && !belongsTo(idx, t, B))
    const pool = [...new Set([...aOnly, ...bOnly])]
    const distractors = []
    const seenD = new Set()
    for (const t of [...shuffleWith(pool, rng), ...shuffleWith(neither, rng)]) {
      const k = normalizeTile(t)
      if (seenD.has(k)) continue
      seenD.add(k)
      distractors.push(t)
      if (distractors.length >= 4) break
    }
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
export function buildLinkTwo(bank, rng, opts = {}) {
  const idx = index(bank)
  if (idx.quiz.length === 0) return null
  const tier = opts.tier != null ? opts.tier : drawTier('linkTwo', rng)
  for (let attempt = 0; attempt < 20; attempt++) {
    const target = pickAnchor(idx.quiz, rng, { tier, avoid: opts.avoid })
    const correct = sample(target.tiles, 2, rng)
    const pickNm = pickLookAlike(nearMissesOf(target), correct, 4, rng)
    if (correct.length < 2 || !pickNm) continue
    const near = pickNm.list
    const options = shuffleWith(
      [...correct.map((text) => ({ text, correct: true })), ...near.map((n) => ({ text: n.text, correct: false, why: n.why }))],
      rng
    )
    return {
      type: 'linkTwo',
      categoryId: target.id,
      prompt: target.title,
      anchorLabel: target.title,
      options,
      correctAnswers: correct,
      tier: tierOf(target),
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
export function buildSameOrDifferent(bank, rng, opts = {}) {
  const idx = index(bank)
  if (idx.quiz.length === 0) return null
  const c = pickAnchor(idx.quiz, rng, { tier: opts.tier != null ? opts.tier : drawTier('sameOrDifferent', rng), avoid: opts.avoid })
  if (rng() < 0.5) {
    const [t1, t2] = sample(c.tiles, 2, rng)
    if (!t1 || !t2) return null
    return {
      type: 'sameOrDifferent',
      categoryId: c.id,
      prompt: c.title,
      anchorLabel: c.title,
      pair: [t1, t2],
      answer: 'same',
      tier: tierOf(c),
      systems: c.systems || [],
      conceptTags: [c.title],
      explanation: `${t1} and ${t2} both belong to ${c.title}.`,
    }
  }
  const member = pick(c.tiles, rng)
  // The outsider should read like the member, not differ by format.
  const nmPick = member ? pickLookAlike(nearMissesOf(c), [member], 1, rng) : null
  const nm = nmPick && nmPick.list[0]
  if (!member || !nm) return null
  return {
    type: 'sameOrDifferent',
    categoryId: c.id,
    prompt: c.title,
    anchorLabel: c.title,
    pair: shuffleWith([member, nm.text], rng),
    answer: 'different',
    outsider: nm.text,
    tier: tierOf(c),
    systems: c.systems || [],
    conceptTags: [c.title],
    explanation: `${nm.text} does not belong: ${nm.why}`,
  }
}

// CHAIN — order four steps. Curated chains (chainBank) and imported
// Sequence items. Steps carry ids; `order` is the ids in the right order.
export function buildChain(bank, rng, opts = {}) {
  if (chooseSource(ARROWS.sequence.length, chainBank.length, rng, opts.tier) === 'arrows') {
    const it = pick(nearTier(arrowsFresh(ARROWS.sequence, opts.avoid), opts.tier), rng)
    return {
      ...arrowsBase(it, 'chain'),
      steps: shuffleWith(it.steps.map((x) => ({ id: x.id, text: x.text })), rng),
      order: it.steps.map((x) => x.id),
      details: it.steps.map((x, n) => ({ text: x.text, tag: String(n + 1), note: x.why })),
    }
  }
  if (chainBank.length === 0) return null
  const chain = pick(chainBank, rng)
  return {
    type: 'chain',
    prompt: 'Build the chain.',
    title: chain.title,
    steps: shuffleWith(chain.steps.map((text) => ({ id: text, text })), rng),
    order: chain.steps.slice(),
    systems: chain.systems || [],
    conceptTags: [chain.title],
    explanation: chain.note,
  }
}

// COMPLETE THE CHAIN — one missing step, pick it. Curated chains (a middle
// step hidden, curated decoys) and imported Missing Step items (fixed blank,
// audited choices with ids).
export function buildCompleteTheChain(bank, rng, opts = {}) {
  if (chooseSource(ARROWS.missingStep.length, chainBank.length, rng, opts.tier) === 'arrows') {
    const it = pick(nearTier(arrowsFresh(ARROWS.missingStep, opts.avoid), opts.tier), rng)
    const correct = it.choices.find((c) => c.correct)
    return {
      ...arrowsBase(it, 'completeTheChain'),
      sequence: it.chain.map((x, n) => (n === it.missingIndex ? null : x)),
      missingIndex: it.missingIndex,
      options: shuffleWith(it.choices.map((c) => ({ id: c.id, text: c.text, correct: c.correct, why: c.why })), rng),
      correctId: it.correctId,
      correctAnswer: correct.text,
      details: [correct, ...it.choices.filter((c) => !c.correct)].map((c) => ({ text: c.text, tag: c.correct ? 'Answer' : '', note: c.why })),
    }
  }
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
    options: shuffleWith([{ id: missing, text: missing, correct: true }, ...distractors.map((text) => ({ id: text, text, correct: false }))], rng),
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
    if (round.source === 'arrows') return validateArrowsRound(round)
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
    if (answerShortcuts(round.options.filter((o) => o.correct).map((o) => o.text), round.options.filter((o) => !o.correct).map((o) => o.text)).length)
      return { valid: false, reason: 'linkTwo: the two answers share wording the others lack' }
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
    if (round.source === 'arrows') return validateArrowsRound(round)
    if (round.order.length !== 4 || round.steps.length !== 4) return { valid: false, reason: 'chain: need 4 steps' }
    if (new Set(round.steps.map((x) => lower(x.text))).size !== 4) return { valid: false, reason: 'chain: duplicate step' }
    return { valid: true }
  }

  if (round.type === 'completeTheChain') {
    if (round.source === 'arrows') return validateArrowsRound(round)
    if (round.options.filter((o) => o.correct).length !== 1) return { valid: false, reason: 'completeTheChain: need one answer' }
    if (new Set(round.options.map((o) => lower(o.text))).size !== round.options.length) return { valid: false, reason: 'completeTheChain: duplicate option' }
    return { valid: true }
  }

  return { valid: false, reason: `unknown mode ${round.type}` }
}

// Imported rounds: the shown round must still be its source item exactly
// (same tiles, steps or choices and the same answers), only reordered.
const ARROWS_BY_ID = new Map([...ARROWS.split, ...ARROWS.sequence, ...ARROWS.missingStep].map((x) => [x.contentId, x]))
export function validateArrowsRound(round) {
  const it = ARROWS_BY_ID.get(round.contentId)
  if (!it) return { valid: false, reason: `unknown imported item ${round.contentId}` }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const byId = (xs) => [...xs].sort((x, y) => String(x.id).localeCompare(String(y.id)))
  if (round.type === 'split') {
    if (round.tiles.length !== 6) return { valid: false, reason: 'split: expected 6 tiles' }
    if (round.tiles.filter((t) => t.group === 'a').length !== 3) return { valid: false, reason: 'split: groups not 3/3' }
    if (!same(byId(round.tiles).map((t) => [t.id, t.text, t.group]), byId(it.tiles).map((t) => [t.id, t.text, t.group]))) return { valid: false, reason: 'split: tiles differ from the source item' }
    return { valid: true }
  }
  if (round.type === 'chain') {
    if (!same(round.order, it.steps.map((x) => x.id))) return { valid: false, reason: 'chain: order differs from the source item' }
    if (!same(byId(round.steps).map((x) => [x.id, x.text]), byId(it.steps).map((x) => [x.id, x.text]))) return { valid: false, reason: 'chain: steps differ from the source item' }
    return { valid: true }
  }
  if (round.type === 'completeTheChain') {
    if (round.options.length !== 4 || round.options.filter((o) => o.correct).length !== 1) return { valid: false, reason: 'missing step: need 4 choices, one right' }
    if (!same(byId(round.options).map((o) => [o.id, o.text, !!o.correct]), byId(it.choices).map((o) => [o.id, o.text, !!o.correct]))) return { valid: false, reason: 'missing step: choices differ from the source item' }
    const right = round.options.find((o) => o.correct)
    if (right.id !== it.correctId || right.text !== it.chain[it.missingIndex] || round.sequence[it.missingIndex] !== null) return { valid: false, reason: 'missing step: answer does not fill the blank' }
    return { valid: true }
  }
  return { valid: false, reason: `imported item in unknown format ${round.type}` }
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
