// ---------------------------------------------------------------------
// New content library: staging logic (pure functions, no file IO).
// ---------------------------------------------------------------------
// The new library feeds Daily and Systems only. The existing bank
// (src/data/connectionBank.js) stays the timed library for 3 Minutes and Race.
// Nothing in src/ imports this staging data, so importing a system changes
// nothing players see until activation. See content/library/README.md.
import { createHash } from 'node:crypto'

export const TIERS = ['easy', 'medium', 'hard', 'expert']
export const STARTER_BOARDS_PER_SYSTEM = 5
export const STARTER_PER_SYSTEM = STARTER_BOARDS_PER_SYSTEM * 4

// Verification status, preserved exactly as written. Which labels make a row
// eligible is decided by the status map (content/library/status-map.json),
// which only the project owner changes. Eligibility always records its basis:
//   human     a label in `approved` (independent human verification)
//   ai-review a label in `aiReviewEligible` (AI review under the owner's
//             authorized workflow; never presented as human verified)
//   ai-review-revised  a label in `aiReviewConditional`, eligible only when the
//             per-row determination (revision-reviews.json) says the review
//             endorsed the final corrected row with nothing outstanding, and
//             only for the exact content that determination was made on
// Anything else stays unresolved.
export const DEFAULT_STATUS_MAP = {
  approved: ['approved', 'verified', 'reviewed and approved', 'final'],
  rejected: ['rejected', 'retired', 'withdrawn'],
  aiReviewEligible: { labels: [], reviewer: null },
  aiReviewConditional: { labels: [], reviewer: null },
  unresolved: [],
}
export function verificationOf(raw, map = DEFAULT_STATUS_MAP, { id = null, contentHash = null, revisionReviews = {} } = {}) {
  const s = String(raw ?? '').trim()
  const k = s.toLowerCase()
  const has = (list) => (list || []).some((x) => String(x).trim().toLowerCase() === k)
  const base = { status: s || null, humanVerified: false, basis: null, reviewer: null, outstanding: null }
  if (!s) return { ...base, approved: false, state: 'missing' }
  if (has(map.approved)) return { ...base, approved: true, state: 'approved', basis: 'human', humanVerified: true }
  if (has(map.rejected)) return { ...base, approved: false, state: 'rejected' }
  if (has(map.aiReviewEligible?.labels)) return { ...base, approved: true, state: 'eligible', basis: 'ai-review', reviewer: map.aiReviewEligible.reviewer || null }
  if (has(map.aiReviewConditional?.labels)) {
    const d = id ? revisionReviews[id] : null
    const reviewer = map.aiReviewConditional.reviewer || null
    if (!d) return { ...base, approved: false, state: 'held', reviewer, outstanding: 'No determination yet on whether the review endorsed the corrected row.' }
    if (d.contentHash && contentHash && d.contentHash !== contentHash) return { ...base, approved: false, state: 'held', reviewer, outstanding: 'The row changed after it was assessed; it needs a fresh determination.' }
    if (d.endorsedFinalRow === true && !d.outstanding) return { ...base, approved: true, state: 'eligible', basis: 'ai-review-revised', reviewer }
    return { ...base, approved: false, state: 'held', reviewer, outstanding: d.outstanding || 'The review did not clearly endorse the corrected row.' }
  }
  return { ...base, approved: false, state: 'unresolved' }
}

// ---------------- normalisation ----------------
// Interchangeable direction words in lab-style tiles: "Elevated urinary
// orotic acid" = "Increased urinary orotic acid".
const SYN = { elevated: 'high', increased: 'high', raised: 'high', higher: 'high', decreased: 'low', reduced: 'low', lowered: 'low', lower: 'low', diminished: 'low' }
const STOP = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'and', 'or', 'to', 'with', 'for', 'by', 'vs', 'as', 'at', 'from'])
export function words(text) {
  // A capital "A" after a word ("Vitamin A", "Hepatitis A", "Procarboxypeptidase
  // A") is a name, not the article, so it is protected from the stopword list.
  return String(text ?? '')
    .replace(/(?<=[A-Za-z0-9][ -])A(?![A-Za-z0-9])/g, 'qqletteraqq')
    // Greek letters as words, so "β1 receptor" = "Beta-1 receptor".
    .replace(/[αΑ]/g, ' alpha ').replace(/[βΒ]/g, ' beta ').replace(/[γΓ]/g, ' gamma ').replace(/[δΔ]/g, ' delta ').replace(/[κΚ]/g, ' kappa ').replace(/[μ]/g, ' mu ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]s\b/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .split(' ')
    .filter((w) => w && !STOP.has(w))
    .map((w) => (w === 'qqletteraqq' ? 'a' : SYN[w] || w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is') ? w.slice(0, -1) : w))
}
const KEYS = new Map()
// Tile keys also drop a few generic trailing words, so "MMR vaccine" = "MMR",
// "Alcohol use" = "Alcohol" and "Mumps infection" = "Mumps". "Disease" and
// "syndrome" are kept: Cushing disease and Cushing syndrome differ.
const TILE_GENERIC = new Set(['vaccine', 'use', 'exposure', 'infection', 'therapy'])
export const tileKey = (t) => {
  const s = String(t ?? '')
  if (!KEYS.has(s)) {
    const w = words(s)
    const core = w.filter((x) => !TILE_GENERIC.has(x))
    KEYS.set(s, (core.length ? core : w).join(' '))
  }
  return KEYS.get(s)
}
const TITLE_KEYS = new Map()
export const titleKey = (t) => {
  const s = String(t ?? '')
  if (!TITLE_KEYS.has(s)) TITLE_KEYS.set(s, words(s).join(' '))
  return TITLE_KEYS.get(s)
}
export function jaccard(a, b) {
  const A = new Set(a)
  const B = new Set(b)
  if (!A.size && !B.size) return 1
  let i = 0
  for (const x of A) if (B.has(x)) i++
  return i / (A.size + B.size - i)
}
export function sha(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
}
export function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------- row mapping ----------------
// Maps an uploaded row (JSON object or CSV/XLSX row) to the library content
// shape. Every field that is not understood is kept under `extra`, so nothing
// in the reviewed file is lost.
const ALIASES = {
  id: ['id', 'connection_id', 'connectionid', 'uid'],
  title: ['title', 'connection', 'connection_title', 'name', 'link'],
  difficulty: ['difficulty', 'tier', 'level'],
  connectionType: ['connectiontype', 'connection_type', 'type'],
  explanation: ['explanation', 'why', 'group_explanation'],
  remember: ['remember', 'takeaway', 'key_point', 'high_yield'],
  qualifiers: ['qualifiers', 'qualifier', 'caveats', 'caveat'],
  sourceSection: ['source_section', 'sourcesection', 'source_page', 'page'],
  organSystems: ['organ_system', 'organ_systems', 'organsystem'],
  discipline: ['discipline', 'disciplines'],
  alternateNames: ['accepted_alternate_category_names', 'alternate_names', 'alternatenames', 'aliases'],
  ambiguityScore: ['ambiguity_score', 'ambiguityscore', 'ambiguity'],
  sources: ['sources', 'source', 'references', 'reference', 'citations'],
  status: ['status', 'verification', 'verification_status', 'review_status', 'verificationstatus'],
  reviewer: ['reviewer', 'reviewed_by', 'reviewedby'],
  reviewedAt: ['reviewedat', 'reviewed_at', 'date_reviewed', 'datereviewed', 'review_date'],
  systems: ['systems'],
  primarySystem: ['primarysystem', 'primary_system', 'system', 'subject'],
  secondarySystems: ['secondarysystems', 'secondary_systems'],
  tags: ['tags', 'concepts'],
  overlapTags: ['overlaptags', 'overlap_tags'],
  nearMisses: ['nearmisses', 'near_misses', 'red_herrings'],
  notes: ['notes', 'review_notes', 'reviewer_notes'],
  tiles: ['tiles'],
  tileExplanations: ['tileexplanations', 'tile_explanations'],
}
const LOOKUP = Object.fromEntries(Object.entries(ALIASES).flatMap(([k, list]) => list.map((a) => [a, k])))
const normHeader = (h) => String(h).trim().toLowerCase().replace(/[\s-]+/g, '_')
const listOf = (v) => {
  if (v == null || v === '') return []
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x.trim() : x)).filter((x) => x !== '' && x != null)
  const s = String(v).trim()
  if (s.startsWith('[')) {
    try {
      return listOf(JSON.parse(s))
    } catch {
      // fall through
    }
  }
  return s.split(/\s*[;|]\s*/).filter(Boolean)
}

export function mapRow(row) {
  // The full original row is kept verbatim under `raw`; the mapped fields
  // below are what the app will read.
  const out = { extra: {}, raw: { ...row } }
  const tiles = []
  const tileEx = []
  for (const [rawKey, value] of Object.entries(row)) {
    const h = normHeader(rawKey)
    const flat = h.replace(/_/g, '')
    let m = h.match(/^(?:tile|item|term)_?([1-4])$/)
    if (m) {
      tiles[+m[1] - 1] = value
      continue
    }
    m = h.match(/^(?:tile|item|term)_?([1-4])_?(?:explanation|why|reason)$/) || h.match(/^(?:explanation|why)_?(?:tile|item)?_?([1-4])$/)
    if (m) {
      tileEx[+m[1] - 1] = value
      continue
    }
    const key = LOOKUP[h] || LOOKUP[flat]
    if (key && out[key] === undefined) out[key] = value
    else out.extra[rawKey] = value
  }
  if (!out.tiles && tiles.length) out.tiles = tiles
  if (!out.tileExplanations && tileEx.length) out.tileExplanations = tileEx
  out.tiles = listOf(out.tiles).map(String)
  if (out.tileExplanations !== undefined) out.tileExplanations = listOf(out.tileExplanations).map(String)
  if (out.ambiguityScore !== undefined && out.ambiguityScore !== '' && !Number.isNaN(Number(out.ambiguityScore))) out.ambiguityScore = Number(out.ambiguityScore)
  for (const k of ['systems', 'secondarySystems', 'tags', 'overlapTags', 'alternateNames']) if (out[k] !== undefined) out[k] = listOf(out[k]).map(String)
  if (typeof out.nearMisses === 'string') {
    try {
      out.nearMisses = JSON.parse(out.nearMisses)
    } catch {
      out.nearMisses = listOf(out.nearMisses).map((text) => ({ text }))
    }
  }
  if (typeof out.sources === 'string' && out.sources.trim().startsWith('[')) {
    try {
      out.sources = JSON.parse(out.sources)
    } catch {
      // keep as written
    }
  }
  if (out.difficulty !== undefined) out.difficulty = String(out.difficulty).trim().toLowerCase()
  for (const [k, v] of Object.entries(out)) if (typeof v === 'string') out[k] = v.trim()
  if (!Object.keys(out.extra).length) delete out.extra
  for (const k of Object.keys(out)) if (out[k] === undefined || out[k] === '') delete out[k]
  return out
}

// Structural problems that keep a row out of every pool. Content is never
// rewritten to fix them; they are reported.
// A reviewer note asking for the connection to be kept for other content
// ("reserve for embryology content") keeps it out of this system's starter
// boards; it stays in the shared Daily pool.
export function placementNote(c) {
  return noteSentences(c.notes).find((x) => /\breserve (it |this )?for\b/i.test(x)) || null
}
export function rowProblems(c) {
  const p = []
  if (!c.title) p.push('missing title')
  if (!Array.isArray(c.tiles) || c.tiles.length !== 4 || c.tiles.some((t) => !String(t || '').trim())) p.push('needs exactly 4 tiles')
  else if (new Set(c.tiles.map(tileKey)).size !== 4) p.push('two tiles are the same')
  if (!TIERS.includes(c.difficulty)) p.push(`difficulty must be one of ${TIERS.join(', ')} (got "${c.difficulty ?? ''}")`)
  if (!c.explanation) p.push('missing explanation')
  if (c.tileExplanations && c.tileExplanations.length !== 4) p.push('tile explanations must be 4, parallel to tiles')
  return p
}

// Content fingerprint: what makes a revision a revision. Pool/meta excluded.
export const contentHash = (c) => sha(c)

// ---------------- matching ----------------
// Compares two connections. Returns { kind, shared, titleSim } where kind is
//   'same'      same relationship: same four tiles and a similar title, or the
//               same title with at least three of the same tiles
//   'uncertain' could be the same relationship: needs a person to decide
//   'overlap'   shares concepts but is a different relationship (allowed)
//   null        unrelated
// A connection title's subject: what it is about plus the kind of relationship,
// with filler removed and word order ignored. "Classic Marfan syndrome
// associations" = "Marfan syndrome findings"; "Conditions that can produce
// restrictive cardiomyopathy" = "Causes of restrictive cardiomyopathy". Causes
// and findings of the same disease stay different subjects.
const FILLER = new Set(['classic', 'characteristic', 'typical', 'source', 'listed', 'described', 'key', 'common', 'important', 'recognized', 'major', 'clinical', 'diagnostic', 'can', 'that', 'which', 'may', 'be', 'is', 'are', 'four', 'main'])
const RELATION = { caus: 'CAUSE', change: 'FIND', complication: 'FIND', consequence: 'FIND', cause: 'CAUSE', condition: 'CAUSE', produce: 'CAUSE', lead: 'CAUSE', etiology: 'CAUSE', finding: 'FIND', clue: 'FIND', association: 'FIND', associated: 'FIND', feature: 'FIND', sign: 'FIND', manifestation: 'FIND', presentation: 'FIND' }
// Light verb stemming for subjects only ("disrupting" / "disrupt").
const stem = (w) => (w.length > 6 && w.endsWith('ing') ? w.slice(0, -3) : w.length > 5 && w.endsWith('ed') ? w.slice(0, -2) : w)
export const subjectKey = (title) => [...new Set(words(title).filter((w) => !FILLER.has(w)).map((w) => RELATION[w] || RELATION[stem(w)] || stem(w)))].sort().join(' ')
// The topic of a title in its original word order ("Kaposi sarcoma clues" →
// "kaposi sarcoma"), used to notice when one connection's notes or
// explanation talk about another connection's subject.
export const topicKey = (title) => words(title).filter((w) => !FILLER.has(w) && !RELATION[w]).join(' ')
const tileWords = (c) => [...new Set((c.tiles || []).flatMap((t) => words(t)))]
function subjectParts(text) {
  const k = subjectKey(text).split(' ').filter(Boolean)
  return { rel: k.filter((w) => w === 'CAUSE' || w === 'FIND').join(' '), topic: k.filter((w) => w !== 'CAUSE' && w !== 'FIND').join(' ') }
}
function subjectsMeet(a, b) {
  const names = (c) => [c.title, ...(Array.isArray(c.alternateNames) ? c.alternateNames : [])].filter(Boolean).map(subjectParts)
  const A = names(a)
  const B = names(b)
  return A.some((x) => x.topic.split(' ').length >= 1 && x.topic.length >= 3 && B.some((y) => y.topic === x.topic && (x.rel === y.rel || !x.rel || !y.rel)))
}
export function compare(a, b) {
  const ak = new Set(a.tiles.map(tileKey))
  const shared = b.tiles.map(tileKey).filter((t) => ak.has(t)).length
  const ta = titleKey(a.title)
  const tb = titleKey(b.title)
  const titleSim = jaccard(ta.split(' '), tb.split(' '))
  const sa = subjectKey(a.title)
  const sb = subjectKey(b.title)
  const sameTitle = ta === tb
  // Subjects are also compared through each row's accepted alternate names, so
  // an abbreviation in one title ("PNH diagnostic clues") meets the full name
  // in the other ("Clues to paroxysmal nocturnal hemoglobinuria"). Two
  // subjects match when their topic words are the same and their relationship
  // kinds agree (or one names no kind).
  const sameSubject = (!!sa && sa === sb && sa.replace(/CAUSE|FIND/g, '').trim() !== '') || subjectsMeet(a, b)
  // Reworded tiles ("Overriding aorta" / "Aorta overriding the septum") are
  // caught by comparing the words used across all four tiles.
  const wordSim = jaccard(tileWords(a), tileWords(b))
  // Best similarity across each row's title and accepted alternate names.
  const allNames = (c) => [c.title, ...(Array.isArray(c.alternateNames) ? c.alternateNames : [])].filter(Boolean).map((t) => subjectKey(t).split(' '))
  let subjSim = jaccard(sa.split(' '), sb.split(' '))
  for (const x of allNames(a)) for (const y of allNames(b)) subjSim = Math.max(subjSim, jaccard(x, y))
  let kind = null
  // Only near-identical tiles with a matching title count as the same
  // relationship automatically. Similar wording alone ("17-alpha" vs
  // "11-beta-hydroxylase deficiency" patterns) is never merged: it is held
  // for a person to decide.
  if ((shared === 4 && (titleSim >= 0.5 || subjSim >= 0.5)) || ((sameTitle || sameSubject) && shared >= 3)) kind = 'same'
  else if (shared === 4 || shared === 3 || ((sameTitle || sameSubject) && shared <= 2) || (titleSim >= 0.8 && shared >= 2) || (wordSim >= 0.6 && subjSim >= 0.5) || (subjSim >= 0.6 && shared >= 2) || (subjSim >= 0.75 && shared >= 1)) kind = 'uncertain'
  else if (shared >= 2) kind = 'overlap'
  // When the reviewer's notes on either row name the other row's id, the
  // reviewer saw both and kept them as separate connections. That is
  // recorded as a shared-concept overlap (allowed, and kept off one board by
  // the board checks), not a duplicate.
  const crossNoted = (a.id && b.notes && String(b.notes).includes(a.id)) || (b.id && a.notes && String(a.notes).includes(b.id))
  let reviewerDistinct = false
  if (crossNoted && (kind === 'same' || kind === 'uncertain')) {
    kind = 'overlap'
    reviewerDistinct = true
  }
  return { kind, shared, titleSim: Math.round(titleSim * 100) / 100, sameSubject, wordSim: Math.round(wordSim * 100) / 100, reviewerDistinct }
}
export const pairKey = (a, b) => [a, b].sort().join(' | ')

// ---------------- boards ----------------
// A board is four connections. Checks come in two strengths.
//
// BLOCK (the board cannot be formed):
//   • the same tile twice, including a tile's own alias in parentheses
//     ("Cu/Zn superoxide dismutase (SOD1)" also blocks "SOD1")
//   • two connections with the same title or accepted alternate name
//   • two connections that may be the same connection
//   • an explicit reviewer instruction not to combine them: a "do not
//     co-place / do not combine / keep separate / keep off this board / avoid
//     ... on the board" sentence that names the other connection's id or one
//     of its tiles
//
// FLAG (the board can be formed, but needs an ambiguity review before it is
// published):
//   • a note that mentions the other connection's id or tiles without an
//     explicit instruction
//   • a tile of one connection named in another's title or explanation
//   • two shared concept tags
//   • a general "avoid ..." instruction on a board that names no specific id
//     or tile (a person has to judge whether the other groups qualify)
//
// Difficulty balance is a preference only; any mix is allowed.
const phrase = (hay, needle) => needle.length >= 3 && ` ${hay} `.includes(` ${needle} `)
const EXPLICIT = [/\bdo not (co-?place|combine|add|place|pair)\b/i, /\bkeep (\w+ )?(separate|apart)\b/i, /\boff (this|the same|one) (board|puzzle)\b/i, /\b(on|to) the same board\b/i, /\bon one board\b/i, /\bin one puzzle\b/i, /\bavoid\b.{0,80}\b(tile|tiles|board|category)\b/i, /\bexclude\b/i, /\bdo not (also )?(create|build)\b/i, /\bavoid (building|creating|placing)\b/i]
export function noteSentences(notes) {
  return String(notes || '')
    .split(/(?<=[.;])\s+(?=[A-Z(])/)
    .map((x) => x.trim())
    .filter(Boolean)
}
export const isExplicit = (sentence) => EXPLICIT.some((re) => re.test(sentence))
// Variants that count as the same tile: the text, the text without a
// parenthetical, and the parenthetical itself.
function tileVariants(t) {
  const out = new Set([tileKey(t)])
  const m = String(t).match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (m) {
    out.add(tileKey(m[1]))
    out.add(tileKey(m[2]))
  }
  return [...out].filter(Boolean)
}
const PROFILE = new Map()
function profile(c) {
  let p = PROFILE.get(c)
  if (!p) {
    const sentences = noteSentences(c.notes).map((text) => ({ text, key: words(text).join(' '), explicit: isExplicit(text) }))
    p = {
      tiles: (c.tiles || []).map(tileKey),
      variants: (c.tiles || []).map(tileVariants),
      names: [c.title, ...(c.alternateNames || [])].map(titleKey).filter(Boolean),
      text: words(`${c.title || ''} ${c.explanation || ''}`).join(' '),
      notes: words(c.notes || '').join(' '),
      sentences,
      tags: (c.tags || []).map((x) => String(x).toLowerCase()),
    }
    PROFILE.set(c, p)
  }
  return p
}
// What A's notes say about B: explicit instructions (block) and mentions (flag).
function noteRelation(a, b) {
  const A = profile(a)
  const B = profile(b)
  const res = { block: [], flag: [] }
  for (const s of A.sentences) {
    const byId = b.id && s.text.includes(b.id)
    const tileIdx = B.tiles.findIndex((t, i) => !A.tiles.includes(t) && B.variants[i].some((v) => phrase(s.key, v)))
    if (!byId && tileIdx < 0) continue
    const what = byId ? b.id : `"${b.tiles[tileIdx]}"`
    if (s.explicit) res.block.push(`${a.id} note says not to combine with ${what}: "${s.text}"`)
    else res.flag.push(`${a.id} note mentions ${what}: "${s.text}"`)
  }
  return res
}
export function pairCheck(a, b) {
  const A = profile(a)
  const B = profile(b)
  const block = []
  const flag = []
  for (let i = 0; i < A.variants.length; i++)
    for (let j = 0; j < B.variants.length; j++)
      if (A.variants[i].some((v) => B.variants[j].includes(v))) block.push(`share the tile "${a.tiles[i]}"${a.tiles[i] === b.tiles[j] ? '' : ` / "${b.tiles[j]}"`}`)
  const nameHit = A.names.find((n) => B.names.includes(n))
  if (nameHit) block.push(`share the name "${nameHit}"`)
  const m = compare(a, b)
  if (m.kind === 'same' || m.kind === 'uncertain') block.push('may be the same connection')
  for (const r of [noteRelation(a, b), noteRelation(b, a)]) {
    block.push(...r.block)
    flag.push(...r.flag)
  }
  const f1 = B.tiles.findIndex((t) => phrase(A.text, t))
  const f2 = A.tiles.findIndex((t) => phrase(B.text, t))
  if (f1 >= 0) flag.push(`tile "${b.tiles[f1]}" is named in "${a.title}"'s title or explanation`)
  if (f2 >= 0) flag.push(`tile "${a.tiles[f2]}" is named in "${b.title}"'s title or explanation`)
  const tagSet = new Set(A.tags)
  if (B.tags.filter((t) => tagSet.has(t)).length >= 2) flag.push('share two concept tags')
  // Two connections about the same condition on one board ("Down syndrome
  // physical findings" and "Down syndrome congenital associations"): tiles of
  // one can read as belonging to the other.
  const ta = topicKey(a.title).split(' ').filter(Boolean)
  const tb = topicKey(b.title).split(' ').filter(Boolean)
  const WEAK = new Set(['syndrome', 'disease', 'disorder', 'deficiency', 'drug', 'type', 'cell', 'acid', 'hormone', 'infection'])
  const sharedStrong = ta.filter((w) => tb.includes(w) && !WEAK.has(w) && w.length >= 3)
  if (sharedStrong.length && jaccard(ta, tb) >= 0.5) flag.push(`both are about ${sharedStrong.join(' ')}`)
  // One connection's notes or explanation name the other's subject
  // ("clinically mimics ... Kaposi sarcoma"): the two may compete for tiles.
  for (const [x, X, y] of [[a, A, b], [b, B, a]]) {
    const topic = topicKey(y.title)
    if (topic.length >= 5 && topic !== topicKey(x.title) && (phrase(X.notes, topic) || phrase(X.text, topic))) flag.push(`"${x.title}" mentions the subject of "${y.title}" (${topic})`)
  }
  return { block, flag }
}
// Back-compatible: every issue (block and flag).
export const pairIssues = (a, b) => {
  const r = pairCheck(a, b)
  return [...r.block, ...r.flag]
}
// General instructions in a member's notes that name no specific id or tile
// ("avoid additional homocysteine-elevating tiles on the same board").
// Difficulty calibration is kept apart from medical and ambiguity issues: a
// note about how hard a connection plays ("may be too transparent for a Hard
// puzzle") is a difficulty warning, never a board-ambiguity flag. Notes that
// confirm the difficulty ("Hard difficulty appropriate") are not warnings.
const DIFFICULTY_RE = /\b(too (transparent|easy|obvious|hard|difficult|obscure)|difficulty|for an? (easy|medium|hard|expert) (puzzle|board)|underrated|overrated)\b/i
export const isDifficultyNote = (text) => DIFFICULTY_RE.test(text) && !/\b(appropriate|correct|fits|confirmed)\b/i.test(text)
export function difficultyWarnings(c) {
  return noteSentences(c.notes).filter(isDifficultyNote)
}
function cautions(conns) {
  const out = []
  for (const c of conns)
    for (const s of profile(c).sentences) {
      if (isDifficultyNote(s.text)) continue
      // Explicit instructions, and any other sentence about the board, that
      // name no specific id or tile: a person must judge them.
      if (!s.explicit && !/\b(board|puzzle)\b/i.test(s.text)) continue
      const specific = conns.some((o) => o !== c && ((o.id && s.text.includes(o.id)) || profile(o).variants.some((vs) => vs.some((v) => phrase(s.key, v)))))
      const namesAnyId = /\b[A-Z]{2,}-(?:[A-Z]{2,}-)?\d+\b/.test(s.text)
      if (!specific && !namesAnyId) out.push(`${c.id} board instruction to check against the other groups: "${s.text}"`)
    }
  return out
}
export function boardCheck(conns) {
  const block = []
  const flags = []
  if (conns.length !== 4) block.push('needs 4 connections')
  for (let i = 0; i < conns.length; i++)
    for (let j = i + 1; j < conns.length; j++) {
      const r = pairCheck(conns[i], conns[j])
      for (const x of r.block) block.push(`"${conns[i].title}" / "${conns[j].title}": ${x}`)
      for (const x of r.flag) flags.push(`"${conns[i].title}" / "${conns[j].title}": ${x}`)
    }
  if (conns.length === 4) flags.push(...cautions(conns))
  return { block, flags }
}
export const boardProblems = (conns) => boardCheck(conns).block
export const boardFair = (conns) => boardProblems(conns).length === 0
export function boardScore(conns) {
  const tiers = conns.map((c) => TIERS.indexOf(c.difficulty))
  const distinct = new Set(tiers).size
  const counts = TIERS.map((_, i) => tiers.filter((t) => t === i).length)
  const harder = tiers.some((t) => t >= 2) ? 2 : 0
  const lopsided = Math.max(...counts) >= 3 ? 3 : 0
  const types = new Set(conns.map((c) => String(c.connectionType || '').toLowerCase())).size
  return distinct * 3 + harder - lopsided + types * 0.5 - boardCheck(conns).flags.length * 4
}

// Deterministic PRNG so the same input always produces the same boards.
function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const shuffle = (arr, r) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Builds up to `want` disjoint fair boards. Seeded randomized greedy with many
// restarts; keeps the run with the most boards, then the best balance.
// Deterministic for the same input.
export function buildBoards(conns, want, { seed = 'plexus', restarts = 400 } = {}) {
  const n = conns.length
  const ok = Array.from({ length: n }, () => new Uint8Array(n))
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const r = pairCheck(conns[i], conns[j])
      if (r.block.length === 0) ok[i][j] = ok[j][i] = r.flag.length ? 2 : 1
    }
  const tierOf = conns.map((c) => c.difficulty)
  // Connections whose notes carry a general board instruction always need an
  // ambiguity review wherever they go, so they are picked last.
  const generalCautions = conns.map((c) => profile(c).sentences.filter((x) => !isDifficultyNote(x.text) && (x.explicit || /\b(board|puzzle)\b/i.test(x.text)) && !/\b[A-Z]{2,}-(?:[A-Z]{2,}-)?\d+\b/.test(x.text)).length)
  let best = { boards: [], score: -Infinity }
  for (let r = 0; r < restarts; r++) {
    const rand = rng(`${seed}:${r}`)
    const used = new Uint8Array(n)
    const boards = []
    let score = 0
    for (const s0 of shuffle([...Array(n).keys()], rand).sort((a, b) => generalCautions[a] - generalCautions[b])) {
      if (boards.length >= want) break
      if (used[s0]) continue
      const board = [s0]
      while (board.length < 4) {
        let pick = -1
        let pickScore = -Infinity
        for (let k = 0; k < n; k++) {
          if (used[k] || board.includes(k) || !board.every((b) => ok[b][k])) continue
          const tiers = new Set(board.map((b) => tierOf[b]))
          const flagged = board.filter((b) => ok[b][k] === 2).length
          const sc = (tiers.has(tierOf[k]) ? 0 : 3) + (TIERS.indexOf(tierOf[k]) >= 2 ? 1 : 0) - (flagged + generalCautions[k]) * 4 + rand() * 2
          if (sc > pickScore) {
            pickScore = sc
            pick = k
          }
        }
        if (pick < 0) break
        board.push(pick)
      }
      if (board.length < 4) continue
      const cs = board.map((i) => conns[i])
      board.forEach((i) => (used[i] = 1))
      boards.push(cs)
      score += boardScore(cs)
    }
    if (boards.length > best.boards.length || (boards.length === best.boards.length && score > best.score)) best = { boards, score }
    if (want !== Infinity && best.boards.length >= want && r >= restarts / 4) break
  }
  return best.boards
}
export const findDisjointBoards = (conns, want, opts) => buildBoards(conns, want, opts)
export const countDailyBoards = (conns, { seed = 'daily', restarts = 24 } = {}) => buildBoards(conns, Infinity, { seed, restarts }).map((b) => b.map((c) => c.id))

// Red-herring candidates on a board, from uploaded nearMisses: a tile of one
// group named as a near miss of another. Informational, for review.
export function boardNearMisses(conns) {
  const out = []
  for (const a of conns)
    for (const b of conns) {
      if (a === b) continue
      const near = new Set((b.nearMisses || []).map((n) => tileKey(typeof n === 'string' ? n : n.text)))
      for (const t of a.tiles) if (near.has(tileKey(t))) out.push({ tile: t, belongsTo: a.id, nearMissOf: b.id })
    }
  return out
}

