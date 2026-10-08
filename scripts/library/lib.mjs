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

// Verification status, preserved as written. Only these count as approved.
const APPROVED = new Set(['approved', 'verified', 'reviewed and approved', 'final'])
const REJECTED = new Set(['rejected', 'retired', 'withdrawn'])
export function verificationOf(raw) {
  const s = String(raw ?? '').trim()
  const k = s.toLowerCase()
  if (!s) return { status: null, approved: false, state: 'missing' }
  if (APPROVED.has(k)) return { status: s, approved: true, state: 'approved' }
  if (REJECTED.has(k)) return { status: s, approved: false, state: 'rejected' }
  return { status: s, approved: false, state: 'unresolved' }
}

// ---------------- normalisation ----------------
const STOP = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'and', 'or', 'to', 'with', 'for', 'by', 'vs', 'as', 'at', 'from'])
export function words(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]s\b/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .split(' ')
    .filter((w) => w && !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is') ? w.slice(0, -1) : w))
}
const KEYS = new Map()
export const tileKey = (t) => {
  const s = String(t ?? '')
  if (!KEYS.has(s)) KEYS.set(s, words(s).join(' '))
  return KEYS.get(s)
}
export const titleKey = tileKey
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
  const out = { extra: {} }
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
  for (const k of ['systems', 'secondarySystems', 'tags', 'overlapTags']) if (out[k] !== undefined) out[k] = listOf(out[k]).map(String)
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
export function compare(a, b) {
  const ak = new Set(a.tiles.map(tileKey))
  const shared = b.tiles.map(tileKey).filter((t) => ak.has(t)).length
  const ta = titleKey(a.title)
  const tb = titleKey(b.title)
  const titleSim = jaccard(ta.split(' '), tb.split(' '))
  const sameTitle = ta === tb
  let kind = null
  if ((shared === 4 && titleSim >= 0.5) || (sameTitle && shared >= 3)) kind = 'same'
  else if (shared === 4 || shared === 3 || (sameTitle && shared <= 2) || (titleSim >= 0.8 && shared >= 2)) kind = 'uncertain'
  else if (shared >= 2) kind = 'overlap'
  return { kind, shared, titleSim: Math.round(titleSim * 100) / 100 }
}
export const pairKey = (a, b) => [a, b].sort().join(' | ')

// ---------------- boards ----------------
// A board is structurally fair when it has one connection per difficulty
// tier, no tile text appears twice (one solution), and no two connections are
// near-duplicates (same title, or two shared concept tags). Mirrors
// comboUsable() in src/utils/puzzleAssembler.js. Medical fairness (a tile that
// truly also fits another group) still needs human review; uploaded nearMisses
// are listed on each board so a reviewer can check them.
export function boardProblems(conns) {
  const p = []
  if (conns.length !== 4) p.push('needs 4 connections')
  const tiers = conns.map((c) => c.difficulty)
  if (new Set(tiers).size !== 4 || !tiers.every((t) => TIERS.includes(t))) p.push('needs one connection per difficulty')
  const seen = new Map()
  for (const c of conns)
    for (const t of c.tiles) {
      const k = tileKey(t)
      if (seen.has(k) && seen.get(k) !== c.id) p.push(`tile "${t}" appears in two groups`)
      seen.set(k, c.id)
    }
  for (let i = 0; i < conns.length; i++)
    for (let j = i + 1; j < conns.length; j++) {
      const a = conns[i]
      const b = conns[j]
      if (titleKey(a.title) === titleKey(b.title)) p.push(`"${a.title}" and "${b.title}" have the same title`)
      const at = new Set((a.tags || []).map((x) => String(x).toLowerCase()))
      if ((b.tags || []).filter((x) => at.has(String(x).toLowerCase())).length >= 2) p.push(`"${a.title}" and "${b.title}" test the same concepts`)
      const m = compare(a, b)
      if (m.kind === 'same' || m.kind === 'uncertain') p.push(`"${a.title}" and "${b.title}" may be the same connection`)
    }
  return p
}
export const boardFair = (conns) => boardProblems(conns).length === 0

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

// Finds up to `want` disjoint fair boards from `conns`. Depth-first search
// with a node budget, so it finds 5 starter boards whenever they exist in
// practice; reports how many it could form otherwise.
export function findDisjointBoards(conns, want, { seed = 'plexus', budget = 200000 } = {}) {
  const byTier = Object.fromEntries(TIERS.map((t) => [t, conns.filter((c) => c.difficulty === t).sort((a, b) => (a.id < b.id ? -1 : 1))]))
  const cap = Math.min(want, ...TIERS.map((t) => byTier[t].length))
  let best = []
  let nodes = 0
  const used = new Set()
  const r = rng(seed)
  const order = Object.fromEntries(TIERS.map((t) => [t, shuffle(byTier[t], r)]))
  const boards = []
  const dfs = () => {
    if (boards.length > best.length) best = boards.map((b) => [...b])
    if (best.length >= cap || nodes > budget) return
    // Choose the next board: easy first (fixed order prunes symmetric repeats).
    const pick = (tierIdx, chosen) => {
      if (nodes++ > budget) return false
      if (tierIdx === 4) {
        boards.push([...chosen])
        chosen.forEach((c) => used.add(c.id))
        dfs()
        chosen.forEach((c) => used.delete(c.id))
        boards.pop()
        return best.length >= cap
      }
      for (const c of order[TIERS[tierIdx]]) {
        if (used.has(c.id)) continue
        const next = [...chosen, c]
        if (boardProblems(next).filter((x) => !x.startsWith('needs')).length) continue
        if (pick(tierIdx + 1, next)) return true
      }
      return false
    }
    pick(0, [])
  }
  dfs()
  return best
}

// Greedy estimate of how many disjoint fair boards a pool can actually form
// (Daily check). Several seeded passes; the best count is reported.
export function countDailyBoards(conns, { passes = 12, seed = 'daily', budget = 50000 } = {}) {
  let best = []
  for (let p = 0; p < passes; p++) {
    const r = rng(`${seed}:${p}`)
    const pool = Object.fromEntries(TIERS.map((t) => [t, shuffle(conns.filter((c) => c.difficulty === t), r)]))
    const used = new Set()
    const boards = []
    let progress = true
    while (progress) {
      progress = false
      const chosen = []
      let nodes = 0
      const tryTier = (i) => {
        if (i === 4) return true
        for (const c of pool[TIERS[i]]) {
          if (nodes++ > budget) return false
          if (used.has(c.id)) continue
          const next = [...chosen, c]
          if (boardProblems(next).filter((x) => !x.startsWith('needs')).length) continue
          chosen.push(c)
          if (tryTier(i + 1)) return true
          chosen.pop()
        }
        return false
      }
      if (tryTier(0)) {
        boards.push(chosen.map((c) => c.id))
        chosen.forEach((c) => used.add(c.id))
        progress = true
      }
    }
    if (boards.length > best.length) best = boards
  }
  return best
}
