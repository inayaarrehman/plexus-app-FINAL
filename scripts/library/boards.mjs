// ---------------------------------------------------------------------
// Whole-board construction for Daily and Systems (October 2026).
// ---------------------------------------------------------------------
// The earlier builder picked four connections that passed the pair checks
// and spread subjects and difficulty labels. It never looked at the 16 tiles
// together, so a board could hold four disease names, four enzymes, four
// pathways and four "Increased ..." statements and sort itself.
//
// This module scores a complete board from:
//   • difficulty: audience recognition per connection (content audit, 1-5),
//     adjusted for how the rest of the board plays against it, compared
//     with a configurable target (default 1 approachable, 2 moderate,
//     1 challenging; content/library/board-config.json)
//   • surface isolation: a wording or format pattern that marks 3+ tiles of
//     one group and almost nothing else (src/utils/surfaceSignals.js)
//   • tile-kind isolation: a group whose tiles are a kind (diseases, drugs,
//     molecules, findings...) that no other group uses
//   • competition: tiles whose common associations (audit facets) point at
//     another group's tiles, and associations shared across groups (red
//     herrings of two or three tiles)
//   • fairness risks, which block or penalize: a tile whose association is
//     another group's subject (it may really belong there), four or more
//     tiles across three groups sharing one association (an unintended
//     group), and every existing pair check (shared tiles, same
//     relationship, reviewer instructions)
//
// It then builds boards with a seeded greedy start and a seeded local
// search (swaps between boards), so the same inputs always give the same
// boards. All numbers are estimates for construction; they are not player
// data and do not prove medical uniqueness.
import * as L from './lib.mjs'
import { boardSurface } from '../../src/utils/surfaceSignals.js'

export const DEFAULT_CONFIG = {
  target: { approachable: 1, moderate: 2, challenging: 1 },
  maxInstantPerBoard: 2,
  weights: {
    difficulty: 3,
    extraInstant: 3,
    surfaceIsolated: 4,
    seriesIsolated: 2,
    kindIsolated: 2,
    kindSorted: 4,
    lureTile: 1.5,
    herring: 1,
    surfaceHerring: 0.5,
    bigCluster: 4,
    pairFlag: 4,
    caution: 4,
    reasoningMix: 0.5,
    sameSubject: 1,
  },
}

// Coarse tile kinds: what a player sees at a glance.
const KIND = {
  disease: 'disease',
  finding: 'clinical',
  lab: 'clinical',
  change: 'clinical',
  drug: 'drug',
  organism: 'organism',
  molecule: 'molecule',
  cell_tissue: 'structure',
  anatomy: 'structure',
  process: 'process',
  procedure: 'process',
  risk: 'context',
  other: 'context',
}
export const kindOf = (t) => KIND[t] || 'context'

const fkey = (s) =>
  L.words(String(s || ''))
    .map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ')
const phraseIn = (hay, needle) => needle.length >= 4 && ` ${hay} `.includes(` ${needle} `)

// Per-connection metadata the scorer needs. `meta` is the audit entry
// (recognition, tileTypes, facets, reasoning, issues) for exactly these
// tiles; stale or missing metadata falls back to the source label.
export function prepare(c, meta) {
  const fallbackRec = { easy: 2, medium: 2, hard: 3, expert: 4 }[c.difficulty] || 2
  const m = meta && Array.isArray(meta.tileTypes) && meta.tileTypes.length === 4 ? meta : null
  return {
    ...c,
    rec: m ? m.recognition : fallbackRec,
    reasoning: m ? m.reasoning : 'recall',
    kinds: m ? m.tileTypes.map(kindOf) : [],
    facets: m ? m.facets.map((fs) => (fs || []).map(fkey).filter((f) => f.length >= 3)) : [[], [], [], []],
    issues: m ? m.issues || [] : [],
    tileKeys: c.tiles.map(fkey),
    topic: fkey(L.topicKey(c.title)),
    metaOk: !!m,
  }
}

// How many of A's tiles have an association naming one of B's tiles.
function lureTiles(a, b) {
  let n = 0
  a.facets.forEach((fs) => {
    if (fs.some((f) => b.tileKeys.some((t) => phraseIn(t, f) || (t.length >= 4 && phraseIn(f, t))))) n++
  })
  return n
}
// A's tiles whose association is B's subject: the tile may genuinely belong
// to B. Treated as a fairness risk, never as a reward.
function topicRisks(a, b) {
  const out = []
  if (!b.topic || b.topic.length < 4) return out
  a.facets.forEach((fs, i) => {
    const hit = fs.find((f) => f.length >= 5 && (f === b.topic || phraseIn(b.topic, f) || (b.topic.length >= 6 && phraseIn(f, b.topic))))
    if (hit) out.push({ tile: a.tiles[i], assoc: hit, other: b.title })
  })
  return out
}

export function pairRisk(a, b) {
  return [...topicRisks(a, b), ...topicRisks(b, a)]
}

// ---------------- scoring one board ----------------
export function analyzeBoard(conns, cfg = DEFAULT_CONFIG, { pairFlags = 0, cautions = 0 } = {}) {
  const W = cfg.weights
  const groups = conns.map((c) => c.tiles)
  const surf = boardSurface(groups)
  // Tile-kind isolation.
  const kindIsolated = conns.map((c, gi) => {
    if (!c.kinds.length) return null
    const counts = {}
    c.kinds.forEach((k) => (counts[k] = (counts[k] || 0) + 1))
    for (const [k, n] of Object.entries(counts)) {
      if (n < 3) continue
      const outside = conns.reduce((acc, o, oj) => acc + (oj === gi ? 0 : o.kinds.filter((x) => x === k).length), 0)
      if (outside <= 1) return k
    }
    return null
  })
  const nKindIso = kindIsolated.filter(Boolean).length
  // Competition.
  const lure = conns.map((a, i) => conns.reduce((acc, b, j) => acc + (i === j ? 0 : lureTiles(a, b)), 0))
  const facetMap = new Map()
  conns.forEach((c, gi) =>
    c.facets.forEach((fs, ti) =>
      fs.forEach((f) => {
        if (!facetMap.has(f)) facetMap.set(f, [])
        facetMap.get(f).push(gi * 4 + ti)
      })
    )
  )
  let herrings = 0
  const bigClusters = []
  for (const [f, cells] of facetMap) {
    const tiles = [...new Set(cells)]
    const gs = new Set(tiles.map((x) => Math.floor(x / 4)))
    if (gs.size < 2) continue
    if (tiles.length >= 4 && gs.size >= 3) bigClusters.push({ assoc: f, tiles: tiles.map((x) => conns[Math.floor(x / 4)].tiles[x % 4]) })
    else if (tiles.length >= 2) herrings++
  }
  // Effective difficulty per connection on this board.
  const eff = conns.map((c, i) => {
    // Base: the connection's own difficulty score (rubric, October 2026),
    // or audience recognition where no score was given.
    let e = c.base ?? c.rec
    e += 0.5 * Math.min(2, lure[i])
    if (c.kinds.length && !kindIsolated[i]) e += 0.5
    if (surf.isolated[i].length) e -= 1
    return Math.round(e * 100) / 100
  })
  const tierOf = (e) => (e < 1.75 ? 0 : e < 2.75 ? 1 : 2)
  const tiers = eff.map(tierOf)
  const T = [cfg.target.approachable, cfg.target.moderate, cfg.target.challenging]
  const counts = [0, 1, 2].map((t) => tiers.filter((x) => x === t).length)
  const diffDistance = counts.reduce((acc, n, i) => acc + Math.abs(n - T[i]), 0) / 2
  const instant = conns.filter((c, i) => c.rec <= 1 && tiers[i] === 0).length
  const surfIso = surf.isolated.filter((x) => x.length).length
  const seriesIso = surf.isolated.filter((x) => x.some((f) => f.key === 'series')).length
  const reasoningMix = new Set(conns.map((c) => c.reasoning)).size
  const subjects = conns.map((c) => c.subject || c.system)
  const sameSubjectPairs = subjects.reduce((acc, s, i) => acc + subjects.slice(i + 1).filter((x) => x === s).length, 0)

  let score = 0
  score -= W.difficulty * diffDistance
  score -= W.extraInstant * Math.max(0, instant - 1)
  score -= W.surfaceIsolated * surfIso + W.seriesIsolated * seriesIso
  score -= W.kindIsolated * nKindIso + (nKindIso >= 3 ? W.kindSorted : 0)
  score += W.lureTile * Math.min(4, lure.reduce((a, b) => a + Math.min(2, b), 0))
  score += W.herring * Math.min(3, herrings) + W.surfaceHerring * Math.min(2, surf.herrings.length)
  score -= W.bigCluster * bigClusters.length
  score -= W.pairFlag * pairFlags + W.caution * cautions
  score += W.reasoningMix * reasoningMix
  score -= W.sameSubject * sameSubjectPairs
  return {
    score: Math.round(score * 100) / 100,
    eff,
    tiers,
    counts,
    diffDistance,
    instant,
    surfaceIsolated: surf.isolated.map((x) => x.map((f) => f.label)),
    surfaceHerrings: surf.herrings.map((h) => h.label),
    kindIsolated,
    kindSorted: nKindIso >= 3,
    lure,
    herrings,
    bigClusters,
    reasoningMix,
  }
}

// ---------------- building boards ----------------
function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
  let a = h >>> 0
  return () => {
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

// Pairwise compatibility: 0 blocked, 1 clean, 2 flagged (needs a recorded
// review). Fairness risks from associations block.
export function compatibility(conns, { allowFlags = true, blockedPairs = null } = {}) {
  const n = conns.length
  const ok = Array.from({ length: n }, () => new Uint8Array(n))
  const flags = Array.from({ length: n }, () => new Array(n))
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const r = L.pairCheck(conns[i], conns[j])
      if (r.block.length) continue
      if (pairRisk(conns[i], conns[j]).length) continue
      if (blockedPairs && blockedPairs.has([conns[i].id, conns[j].id].sort().join('|'))) continue
      if (r.flag.length && !allowFlags) continue
      ok[i][j] = ok[j][i] = r.flag.length ? 2 : 1
      flags[i][j] = flags[j][i] = r.flag
    }
  return { ok, flags }
}

// Partition `conns` into as many valid boards as possible, then improve the
// total score by seeded local search.
//   maxPerSubject   cap on connections from one subject (Daily: 2)
//   minSubjects     distinct subjects required on a board (Daily: 2)
//   want            stop after this many boards (Systems starters: 5)
//   exclude         Set of rejected board keys (sorted ids joined by '+')
export function buildPartition(conns, { seed, cfg = DEFAULT_CONFIG, maxPerSubject = 4, minSubjects = 1, want = Infinity, restarts = 12, iterations = 60000, allowFlags = true, exclude = new Set(), nested = false, blockedPairs = null }) {
  const n = conns.length
  const { ok } = compatibility(conns, { allowFlags, blockedPairs })
  const caution = conns.map((c) => L.generalCautionCount(c))
  const subj = conns.map((c) => c.subject || c.system)
  const key = (b) => b.map((i) => conns[i].id).sort().join('+')
  const valid = (b) => {
    for (let x = 0; x < b.length; x++) for (let y = x + 1; y < b.length; y++) if (!ok[b[x]][b[y]]) return false
    const per = {}
    for (const i of b) if ((per[subj[i]] = (per[subj[i]] || 0) + 1) > maxPerSubject) return false
    if (new Set(b.map((i) => subj[i])).size < minSubjects) return false
    if (b.length === 4 && exclude.has(key(b))) return false
    return true
  }
  const memo = new Map()
  const scoreOf = (b) => {
    const k = key(b)
    let s = memo.get(k)
    if (s === undefined) {
      let pf = 0
      for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) if (ok[b[x]][b[y]] === 2) pf++
      const cs = b.map((i) => conns[i])
      const cautions = b.some((i) => caution[i] > 0) ? 1 : 0
      s = analyzeBoard(cs, cfg, { pairFlags: pf, cautions }).score
      memo.set(k, s)
    }
    return s
  }
  // 1. Greedy starts: most boards, then best score.
  let best = null
  for (let r = 0; r < restarts; r++) {
    const rand = rng(`${seed}:start:${r}`)
    const used = new Uint8Array(n)
    const boards = []
    for (const s0 of shuffle([...Array(n).keys()], rand)) {
      if (boards.length >= want) break
      if (used[s0]) continue
      const b = [s0]
      while (b.length < 4) {
        const cands = []
        for (let k = 0; k < n; k++) if (!used[k] && !b.includes(k) && valid([...b, k])) cands.push(k)
        if (!cands.length) break
        let pick
        if (b.length < 3) {
          // Prefer a new recognition level and a new subject; random otherwise.
          const pref = cands.map((k) => (b.some((i) => conns[i].rec === conns[k].rec) ? 0 : 2) + (b.some((i) => subj[i] === subj[k]) ? 0 : 1) + rand() * 2)
          pick = cands[pref.indexOf(Math.max(...pref))]
        } else {
          let ps = -Infinity
          for (const k of shuffle(cands, rand).slice(0, 80)) {
            const sc = scoreOf([...b, k])
            if (sc > ps) {
              ps = sc
              pick = k
            }
          }
        }
        b.push(pick)
      }
      if (b.length < 4) continue
      b.forEach((i) => (used[i] = 1))
      boards.push(b)
    }
    const total = boards.reduce((a, b) => a + scoreOf(b), 0)
    if (!best || boards.length > best.boards.length || (boards.length === best.boards.length && total > best.total)) best = { boards, total }
  }
  // 2. Local search: swap members between two boards, or with an unused
  // connection. Simulated annealing on a seeded schedule.
  const boards = best.boards.map((b) => b.slice())
  const inBoard = new Int32Array(n).fill(-1)
  boards.forEach((b, bi) => b.forEach((i) => (inBoard[i] = bi)))
  const rand = rng(`${seed}:search`)
  const scores = boards.map(scoreOf)
  for (let it = 0; it < iterations && boards.length; it++) {
    const temp = 2 * (1 - it / iterations) + 0.01
    const bi = Math.floor(rand() * boards.length)
    const pi = Math.floor(rand() * 4)
    const j = Math.floor(rand() * n)
    const bj = inBoard[j]
    if (bj === bi) continue
    const A = boards[bi].slice()
    const out = A[pi]
    A[pi] = j
    if (!valid(A)) continue
    let B = null
    if (bj >= 0) {
      B = boards[bj].slice()
      B[B.indexOf(j)] = out
      if (!valid(B)) continue
    }
    const before = scores[bi] + (bj >= 0 ? scores[bj] : 0)
    const sa = scoreOf(A)
    const sb = B ? scoreOf(B) : 0
    const delta = sa + sb - before
    if (delta >= 0 || rand() < Math.exp(delta / temp)) {
      boards[bi] = A
      scores[bi] = sa
      inBoard[j] = bi
      if (B) {
        boards[bj] = B
        scores[bj] = sb
        inBoard[out] = bj
      } else inBoard[out] = -1
    }
  }
  // 3. Try to form extra boards from what is left over.
  if (boards.length < want && !nested) {
    const left = [...Array(n).keys()].filter((i) => inBoard[i] < 0)
    const extra = buildPartition.call(null, left.map((i) => conns[i]), { seed: `${seed}:extra`, cfg, maxPerSubject, minSubjects, want: want - boards.length, restarts: 20, iterations: 0, allowFlags, exclude, nested: true, blockedPairs })
    for (const ids of extra) boards.push(ids.map((id) => conns.findIndex((c) => c.id === id)))
  }
  return boards.map((b) => b.map((i) => conns[i].id))
}

// Full analysis of a finished board for ledgers and reports.
export function describeBoard(conns, cfg = DEFAULT_CONFIG) {
  const check = L.boardCheck(conns)
  const risks = []
  for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) risks.push(...pairRisk(conns[i], conns[j]))
  const a = analyzeBoard(conns, cfg, { pairFlags: check.flags.length ? 1 : 0 })
  return { ...a, flags: check.flags, block: check.block, risks }
}

// True when any pair on the board carries an association fairness risk.
export function compatibilityBlocked(conns) {
  for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) if (pairRisk(conns[i], conns[j]).length) return true
  return false
}

// Recognition (1-5) to the served difficulty label (before October 15 2026;
// kept for the validation script).
export const recognitionLabel = (rec) => (rec <= 1 ? 'easy' : rec === 2 ? 'medium' : rec <= 4 ? 'hard' : 'expert')

// ---------------------------------------------------------------------
// Difficulty labels (content/library/difficulty-rubric.md)
// ---------------------------------------------------------------------
export const TIERS = ['easy', 'medium', 'hard', 'expert']
export const CUTS = [1.75, 2.75, 3.75]
export const NEAR_CUT = 0.25
export const REASONING_BONUS = { recall: 0, discrimination: 0.5, mechanism: 0.75 }
const GIVEAWAY_ISSUES = ['series', 'shared-stem']
export const tierOfScore = (x) => (x < CUTS[0] ? 0 : x < CUTS[1] ? 1 : x < CUTS[2] ? 2 : 3)

// A connection's own score: recognition, plus the kind of thinking it takes,
// plus tiles not under their best-known name, minus a wording giveaway.
export function difficultyScore(meta, second) {
  if (!meta || typeof meta.recognition !== 'number') return null
  let x = meta.recognition + (REASONING_BONUS[meta.reasoning] ?? 0)
  x += 0.25 * Math.min(2, Math.max(0, Number(second?.altNames) || 0))
  if ((meta.issues || []).some((i) => GIVEAWAY_ISSUES.includes(i))) x -= 0.5
  return Math.round(x * 100) / 100
}

// The label, and how sure it is.
//   computed  from the score and the two rules below
//   second    the independent rating against the rubric
//   third     a tie-break rating, asked only when the first two disagree or
//             the score sits near a cut point
// Rules: Easy is recall only; Expert needs the second rating at Hard or
// above. Status: confirmed (computed and second agree, not near a cut),
// majority (the third agreed with one of them), queue (no majority, or the
// ratings span two tiers or more: the owner decides), override (owner).
export function connectionDifficulty({ meta, second, third, override }) {
  const score = difficultyScore(meta, second)
  if (score == null) return null
  const recallOnly = (t) => (t === 0 && meta.reasoning !== 'recall' ? 1 : t)
  const s2 = second ? TIERS.indexOf(second.tier) : -1
  const expertOk = (t) => (t === 3 && s2 >= 0 && s2 < 2 ? 2 : t)
  const computed = expertOk(recallOnly(tierOfScore(score)))
  const near = CUTS.some((c) => Math.abs(score - c) < NEAR_CUT)
  const s3 = third ? TIERS.indexOf(third.tier) : -1
  let tier = computed
  let status = 'computed'
  if (s2 >= 0) {
    if (s2 === computed && !near) status = 'confirmed'
    else if (s3 >= 0) {
      const votes = [computed, s2, s3]
      const top = votes.find((v) => votes.filter((x) => x === v).length >= 2)
      const spread = Math.max(...votes) - Math.min(...votes)
      tier = top ?? [...votes].sort((a, b) => a - b)[1]
      status = top != null && spread < 2 ? 'majority' : 'queue'
    } else status = 'queue'
  }
  tier = expertOk(recallOnly(tier))
  if (override && TIERS.includes(override.tier)) {
    tier = TIERS.indexOf(override.tier)
    status = 'override'
  }
  return { score, computed: TIERS[computed], second: second?.tier || null, third: third?.tier || null, near, tier: TIERS[tier], status }
}

// A numeric base for board estimates: the label's own step (Easy 1, Medium 2,
// Hard 3, Expert 4, the same scale as audience recognition), nudged by at
// most a quarter toward the score, so a board starts from the label the
// group was given.
export function baseForTier(score, tier) {
  const step = TIERS.indexOf(tier) + 1
  return Math.round((step + Math.max(-0.25, Math.min(0.25, score - step))) * 100) / 100
}

// A group's label on a board: its estimate on that board, at most one step
// from its own label.
export function boardTier(eff, ownTier) {
  const own = TIERS.indexOf(ownTier)
  const t = tierOfScore(eff)
  return own < 0 ? TIERS[t] : TIERS[Math.max(own - 1, Math.min(own + 1, t))]
}
