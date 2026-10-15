// ---------------------------------------------------------------------
// Activation: turn the staged library into the content the app serves.
// ---------------------------------------------------------------------
// Reads (never changes):
//   content/library/library.json          staged records, starter boards, pairs
//   content/library/decisions.json        owner decisions on pairs
//   content/library/activation-review.json board reviews (clearances, swaps, rejections)
//   content/timed/manifest.json           timed-library audit pairs
//   src/data/connectionBank.js            the timed library itself
// Writes:
//   src/data/library/newLibrary.js        Daily + Systems content (generated)
//   src/data/library/timedLibrary.js      timed exclusions + canonical map (generated)
//   content/library/activation/ledger.json  every board, schedule and assignment
//   content/library/activation/report.md    what is live, what is held, and why
//   content/library/activation/pending-review.json  boards that still need a person
//
// Stability: once a ledger exists, published starter boards, the Daily
// schedule and Systems expansion boards are read back from it and never
// reshuffled. Running this again with the same inputs writes identical files.
// `--fresh` rebuilds from scratch and is refused once any new-library Daily
// date has been reached anywhere (UTC+14), so released content can't change.
//
//   node scripts/library/activate.mjs              build (or re-verify) and write
//   node scripts/library/activate.mjs --check      verify only; exit 1 if outputs would change
//   node scripts/library/activate.mjs --fresh      rebuild boards (only before launch)
//   add --pin-since <date> to a --rebuild to re-form boards reviewed before that date
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'
import * as B from './boards.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const P = (...x) => path.join(ROOT, ...x)
const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const opt = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}
const readJson = (f, dflt) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : dflt)

const ACT_DIR = P('content/library/activation')
const LEDGER_FILE = path.join(ACT_DIR, 'ledger.json')
const state = readJson(P('content/library/library.json'))
const decisions = readJson(P('content/library/decisions.json'), { pairs: {}, boards: {} })
const review = readJson(P('content/library/activation-review.json'), { starterBoards: {}, dailyBoards: {} })
const manualFlags = readJson(P('content/library/board-flags.json'), { boards: {} }).boards || {}
const timedManifest = readJson(P('content/timed/manifest.json'))
// Player explanations (detail + tile notes), served only when eligible; see
// scripts/library/explanations.mjs. They never affect boards or ids.
const explanations = readJson(P('content/library/explanations.json'), { entries: {} }).entries || {}
const statusMapForExplanations = { ...L.DEFAULT_STATUS_MAP, ...readJson(P('content/library/status-map.json'), {}) }
const anyLedger = readJson(LEDGER_FILE, null)
// --rebuild: a content epoch rebuild. Every board and the whole Daily
// schedule are rebuilt from the current content, including dates already
// released. Only for a deliberate content reset (the app clears puzzle
// progress when the epoch changes); needs --epoch <label>.
const REBUILD = flag('--rebuild')
const EPOCH = opt('--epoch', anyLedger?.epoch || 'launch')
if (REBUILD && (!opt('--epoch') || opt('--epoch') === anyLedger?.epoch)) throw new Error('--rebuild needs a new --epoch label')
const prevLedger = flag('--fresh') || REBUILD ? null : anyLedger
const { default: connectionBank } = await import(P('src/data/connectionBank.js'))

// The first date the new library serves Daily. Kept in the ledger so a rerun
// never moves it; set once with --daily-start.
const DAILY_START = opt('--daily-start', prevLedger?.dailyStart || anyLedger?.dailyStart || '2026-10-10')
if (!/^\d{4}-\d{2}-\d{2}$/.test(DAILY_START)) throw new Error('--daily-start must be YYYY-MM-DD')

// ---- date helpers (calendar arithmetic on keys only) ----
const dayIdx = (key) => Math.round(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86400000)
const keyOf = (idx) => new Date(idx * 86400000).toISOString().slice(0, 10)
const dateForDay = (n) => keyOf(dayIdx(DAILY_START) + n)
// The latest calendar date anywhere on Earth right now (UTC+14).
const nowMs = opt('--now') ? Date.parse(opt('--now')) : Date.now()
const latestKeyAnywhere = new Date(nowMs + 14 * 3600000).toISOString().slice(0, 10)
const releasedThroughDay = dayIdx(latestKeyAnywhere) - dayIdx(DAILY_START) // < 0 before launch

if (prevLedger && DAILY_START !== prevLedger.dailyStart) {
  if (latestKeyAnywhere >= prevLedger.dailyStart) throw new Error(`--daily-start refused: ${prevLedger.dailyStart} has already been reached somewhere.`)
  if (latestKeyAnywhere >= DAILY_START) throw new Error(`--daily-start refused: ${DAILY_START} has already been reached somewhere; pick a later date.`)
}
if (flag('--fresh') && !REBUILD && releasedThroughDay >= 0 && fs.existsSync(LEDGER_FILE))
  throw new Error(`--fresh refused: the new Daily has already started somewhere (${latestKeyAnywhere} >= ${DAILY_START}).`)

// ---------------------------------------------------------------------
// 1. Active connections and canonical relationship ids
// ---------------------------------------------------------------------
const R = state.records
// Revisions and copy edits (October 2026 difficulty work) are overlaid here;
// library.json keeps the original rows and their review labels. A revision
// applies only while the row still matches the text it was written against.
const revisions = readJson(P('content/library/revisions.json'), { entries: {} }).entries || {}
const copyEdits = readJson(P('content/library/copy-edits.json'), { entries: {} }).entries || {}
const overlayLog = { revised: [], copyEdited: [], stale: [] }
for (const [id, rv] of Object.entries(revisions)) {
  const r = R[id]
  if (!r) continue
  if (!L.sameTiles(r.content.tiles, rv.original.tiles) || r.content.title !== rv.original.title) {
    overlayLog.stale.push(id)
    continue
  }
  r.content = {
    ...r.content,
    title: rv.revised.title,
    tiles: rv.revised.tiles.slice(),
    explanation: rv.revised.explanation,
    // Alternate names described the old category; keep them only when the
    // revision changed wording alone.
    alternateNames: rv.kind === 'wording' ? r.content.alternateNames : [],
    revisedFrom: rv.original,
  }
  r.verification = { ...r.verification, status: rv.review.status, basis: rv.review.basis, reviewer: rv.review.reviewer, humanVerified: false, priorStatus: r.verification.status }
  r.contentHash = L.sha(`${r.contentHash}|rev|${JSON.stringify(rv.revised)}`)
  r.version = (r.version || 1) + 1
  r.revision = { kind: rv.kind, changeSummary: rv.changeSummary }
  overlayLog.revised.push(id)
}
for (const [id, ce] of Object.entries(copyEdits)) {
  const r = R[id]
  if (!r) continue
  if (r.content.title !== ce.original.title || r.content.explanation !== ce.original.explanation) {
    overlayLog.stale.push(`${id} (copy edit)`)
    continue
  }
  r.content = { ...r.content, title: ce.title, explanation: ce.explanation }
  r.contentHash = L.sha(`${r.contentHash}|copy|${ce.title}|${ce.explanation}`)
  r.copyEdit = true
  overlayLog.copyEdited.push(id)
}
// Difficulty metadata: the content audit, or the fresh re-rating for revised
// rows (the audit described the old tiles).
const auditMeta = readJson(P('content/library/audit/difficulty-audit.json'), { entries: {} }).entries || {}
const rerateMeta = readJson(P('content/library/audit/rerate.json'), { entries: {} }).entries || {}
const metaFor = (id) => (R[id]?.revision ? rerateMeta[id] : auditMeta[id]) || null
// Difficulty labels (content/library/difficulty-rubric.md): the score from the
// audit, an independent second rating, a tie-break third rating where the
// first two disagree, and owner overrides.
const secondRating = readJson(P('content/library/audit/difficulty-second-rating.json'), { entries: {} }).entries || {}
const thirdRating = readJson(P('content/library/audit/difficulty-third-rating.json'), { entries: {} }).entries || {}
const difficultyOverrides = readJson(P('content/library/audit/difficulty-overrides.json'), { entries: {} }).entries || {}
const difficultyCache = new Map()
const difficultyOf = (id) => {
  if (!difficultyCache.has(id)) difficultyCache.set(id, B.connectionDifficulty({ meta: metaFor(id), second: secondRating[id], third: thirdRating[id], override: difficultyOverrides[id] }))
  return difficultyCache.get(id)
}
const boardConfig = { ...B.DEFAULT_CONFIG, ...readJson(P('content/library/board-config.json'), {}) }
boardConfig.weights = { ...B.DEFAULT_CONFIG.weights, ...(boardConfig.weights || {}) }
// Board reviews for rebuilt boards, keyed by the sorted ids; each lapses if
// a member's content changes (signature).
const boardReview = readJson(P('content/library/board-review.json'), { boards: {} }).boards || {}
const conn = (r) => ({ ...r.content, id: r.id, system: r.system, tiles: r.content.tiles || [] })
const isActive = (r) =>
  r && r.verification.approved && !r.problems.length && !r.heldFor.length && !r.duplicateOf && ['systemsStarter', 'daily'].includes(r.pool)
const canonicalOf = (id) => {
  let cur = R[id]
  const seen = new Set()
  while (cur && cur.duplicateOf && !seen.has(cur.id)) {
    seen.add(cur.id)
    cur = R[cur.duplicateOf]
  }
  return cur ? cur.id : id
}
const active = Object.values(R).filter(isActive)
const activeIds = new Set(active.map((r) => r.id))
// Consolidated duplicates: the canonical record keeps every original record's
// subject as a system tag. The duplicates stay in staging untouched.
const consolidated = {}
for (const r of Object.values(R))
  if (r.duplicateOf) {
    const c = canonicalOf(r.id)
    ;(consolidated[c] ||= []).push({ id: r.id, system: r.system, title: r.content.title })
  }

// ---------------------------------------------------------------------
// 2. Timed library: exclusions and canonical ids
// ---------------------------------------------------------------------
const pairDecision = (a, b) => decisions.pairs?.[L.pairKey(a, b)] || null
const timedExclusions = {}
for (const x of state.timedExclusionsAtActivation || [])
  timedExclusions[x.timedId] = { reason: 'same relationship as a new-library connection', newId: x.replacedBy, title: x.timedTitle, kind: 'confirmed' }
for (const r of active)
  for (const t of r.timedUncertain || []) {
    if (pairDecision(r.id, t.id) === 'distinct') continue
    if (timedExclusions[t.id]) continue
    timedExclusions[t.id] = { reason: `unresolved overlap with ${r.id}, which is now active`, newId: r.id, title: t.title, kind: pairDecision(r.id, t.id) === 'same' ? 'confirmed' : 'temporary' }
  }
// Timed canonical map: audit "same relationship" pairs inside the timed bank
// share one id, so a timed session can never serve both.
const parent = {}
const find = (x) => (parent[x] && parent[x] !== x ? (parent[x] = find(parent[x])) : x)
const union = (a, b) => {
  const [x, y] = [find(a), find(b)].sort()
  if (x !== y) parent[y] = x
}
for (const p of timedManifest.pairs || []) {
  const d = pairDecision(p.a, p.b)
  if (d === 'distinct') continue
  if (p.kind === 'same' || p.audit === 'same relationship' || d === 'same') union(p.a, p.b)
}
const timedVerifiedRaw = connectionBank.filter((c) => c.status === 'verified')
// Timed overlays (October 2026): checked revisions, the checked near-miss
// lists (giveaways and wrong ones out, accepted replacements in) and
// difficulty metadata. Written into src/data/library/timedLibrary.js and
// applied by src/utils/timedLibrary.js, so the server and both Race players
// build from the identical overlaid bank.
const timedRevisionsIn = readJson(P('content/timed/revisions.json'), { entries: {} }).entries || {}
const nmCheck = readJson(P('content/timed/audit/near-miss-check.json'), { entries: {} }).entries || {}
const timedAudit = readJson(P('content/timed/audit/difficulty-audit.json'), { entries: {} }).entries || {}
const TIMED_REVISIONS = {}
const TIMED_NEAR_MISSES = {}
const TIMED_META = {}
const timedOverlayLog = { revised: 0, nearMissLists: 0, nearMissesHeld: 0, nearMissesWrong: 0, nearMissesAdded: 0, stale: [] }
for (const c of timedVerifiedRaw) {
  const rv = timedRevisionsIn[c.id]
  let cur = c
  if (rv) {
    if (L.sameTiles(c.tiles, rv.original.tiles) && c.title === rv.original.title) {
      TIMED_REVISIONS[c.id] = { title: rv.revised.title, tiles: rv.revised.tiles, explanation: rv.revised.explanation, tileExplanations: rv.tileNotes, review: { basis: rv.review.basis, humanVerified: false } }
      cur = { ...c, ...TIMED_REVISIONS[c.id] }
      timedOverlayLog.revised++
    } else timedOverlayLog.stale.push(c.id)
  }
  const nm = nmCheck[c.id]
  if (nm && L.sameTiles(nm.tiles, cur.tiles)) {
    const own = new Set(cur.tiles.map(L.tileKey))
    const kept = nm.existing.filter((x) => x.verdict === 'keep').map((x) => ({ text: x.text, why: x.why }))
    const added = nm.replacements.filter((x) => x.verdict === 'accept').map((x) => ({ text: x.text, why: x.why }))
    const seen = new Set()
    const list = [...kept, ...added].filter((x) => {
      const k = L.tileKey(x.text)
      if (own.has(k) || seen.has(k)) return false
      seen.add(k)
      return true
    })
    TIMED_NEAR_MISSES[c.id] = list
    timedOverlayLog.nearMissLists++
    timedOverlayLog.nearMissesHeld += nm.existing.filter((x) => x.verdict === 'giveaway').length
    timedOverlayLog.nearMissesWrong += nm.existing.filter((x) => x.verdict === 'wrong').length
    timedOverlayLog.nearMissesAdded += added.length
  } else if (nm) timedOverlayLog.stale.push(`${c.id} (near misses)`)
  const m = (TIMED_REVISIONS[c.id] ? rerateMeta[c.id] : timedAudit[c.id]) || null
  if (m && Array.isArray(m.tileTypes)) TIMED_META[c.id] = { rec: m.recognition, kinds: m.tileTypes.map(B.kindOf), reasoning: m.reasoning }
}
const timedVerified = timedVerifiedRaw.map((c) => (TIMED_REVISIONS[c.id] ? { ...c, ...TIMED_REVISIONS[c.id] } : c))
// Revised content on either side can create a new overlap between the two
// libraries; recheck those pairs so timed play never serves a Daily
// relationship.
for (const c of timedVerified)
  for (const r of active) {
    if (!TIMED_REVISIONS[c.id] && !r.revision) continue
    if (timedExclusions[c.id]) break
    const shared = c.tiles.filter((t) => r.content.tiles.some((u) => L.tileKey(u) === L.tileKey(t))).length
    const kind = L.compare(conn(r), c).kind
    if (shared >= 3 || kind === 'same' || (kind === 'uncertain' && pairDecision(r.id, c.id) !== 'distinct'))
      timedExclusions[c.id] = { reason: `revised content overlaps ${r.id} (${shared} shared tiles, ${kind})`, newId: r.id, title: c.title, kind: 'temporary' }
  }
// Timed entries with the same four tiles are one relationship.
{
  const bySet = new Map()
  for (const c of timedVerified) {
    const k = c.tiles.map(L.tileKey).sort().join('|')
    if (bySet.has(k)) union(bySet.get(k), c.id)
    else bySet.set(k, c.id)
  }
}
const timedCanonical = {}
for (const c of timedVerified) if (find(c.id) !== c.id) timedCanonical[c.id] = find(c.id)
const timedServed = timedVerified.filter((c) => !timedExclusions[c.id])

// ---------------------------------------------------------------------
// 3-5. Boards: Systems starters, the Daily schedule, Systems expansion
// ---------------------------------------------------------------------
// Built from whole-board scores (scripts/library/boards.mjs) on a fresh or
// --rebuild run; otherwise read back from the ledger and re-verified, never
// reshuffled.
// Order-independent: the same four connections with the same content.
const signatureOf = (ids) => L.sha([...ids].sort().map((id) => R[id]?.contentHash || 'missing').join('|')).slice(0, 8)
const setKey = (ids) => [...ids].sort().join('+')
const manualFor = (boardId, ids) =>
  (manualFlags[boardId] || []).filter((f) => !f.signature || f.signature === signatureOf(ids)).map((f) => `${f.text} (raised by ${f.by})`)
// A clearance covers a board only if every current flag was reviewed and the
// members' content is unchanged since the review.
function clearanceFor(dec, ids, flags) {
  if (!dec || !dec.clear) return null
  if (dec.signature && dec.signature !== signatureOf(ids)) return null
  const reviewed = new Set(dec.clear.flagsReviewed || [])
  if (!flags.every((f) => reviewed.has(f))) return null
  return { by: dec.clear.by, rationale: dec.clear.rationale, flagsReviewed: flags }
}
// Reviews of rebuilt boards (content/library/board-review.json):
//   { verdict: 'pass' | 'fail', by, rationale, signature, flagsReviewed }
// A failed board is never formed again; a pass clears the flags it saw.
const reviewSigOk = (d, ids) => d.signature === signatureOf(ids)
const reviewOf = (ids) => {
  const d = boardReview[setKey(ids)]
  return d && reviewSigOk(d, ids) ? d : null
}
const rejectedKeys = new Set(Object.entries(boardReview).filter(([, d]) => d.verdict === 'fail').map(([k]) => k))
// Pairs a failed review named as competing for the same tiles: kept apart on
// every rebuilt board.
const reviewBlockedPairs = new Set(Object.values(boardReview).flatMap((d) => (d.conflicts || []).map((p) => [...p].sort().join('|'))))
const clearanceFromReview = (ids, flags) => {
  const d = reviewOf(ids)
  // The signature pins the members' content, and flags are a function of
  // that content, so a matching pass covers exactly the flags it saw.
  if (!d || d.verdict !== 'pass') return null
  return { by: d.by, rationale: d.rationale, flagsReviewed: flags }
}
// Boards that already passed review stay as they are when content is
// rebuilt again (only failed boards and leftovers are re-formed), so each
// review round settles more of the collection.
// --pin-since <YYYY-MM-DD> (with --rebuild): reuse only boards whose passing
// review is from that date or later, so every other board is formed afresh
// under the current difficulty model. Failed boards and the pairs they named
// stay excluded everywhere; new boards need review.
const PIN_SINCE = opt('--pin-since', null)
const reviewDate = (d) => (String(d.by || '').match(/\d{4}-\d{2}-\d{2}/) || [''])[0]
function pinnedBoards(kind, poolIds, subject = null) {
  const pool = new Set(poolIds)
  const taken = new Set()
  const out = []
  for (const [k, d] of Object.entries(boardReview).sort(([a], [b]) => a.localeCompare(b))) {
    if (d.verdict !== 'pass' || d.kind !== kind || (subject && d.subject !== subject)) continue
    if (PIN_SINCE && reviewDate(d) < PIN_SINCE) continue
    const ids = k.split('+')
    if (!ids.every((id) => pool.has(id) && !taken.has(id)) || !reviewSigOk(d, ids)) continue
    ids.forEach((id) => taken.add(id))
    out.push(ids)
  }
  return out
}
const prep = (id) => {
  const p = B.prepare(conn(R[id]), metaFor(id))
  const d = difficultyOf(id)
  return d ? { ...p, base: B.baseForTier(d.score, d.tier), ownTier: d.tier } : p
}
const describe = (ids) => B.describeBoard(ids.map(prep), boardConfig)
// Easiest to hardest by the board's own estimate; ties keep board order.
const levelsOf = (ids, d) =>
  ids
    .map((id, i) => ({ id, e: d.eff[i], tier: ['easy', 'medium', 'hard'][d.tiers[i]], i }))
    .sort((a, b) => a.e - b.e || a.i - b.i)
    .map(({ id, tier }) => ({ id, tier }))

const starterOut = {}
const starterReserved = new Set()
const replacementsLog = []
const starterHeld = []
const shortfall = {}
const subjects = Object.keys(state.starterBoards)
const fresh = !prevLedger
for (const subject of subjects) {
  starterOut[subject] = []
  if (fresh) {
    // The subject's Systems pool: the connections set aside for its starter
    // boards (the previous published set when there is one).
    const prevSet = anyLedger?.starterBoards?.[subject] ? [...anyLedger.starterBoards[subject], ...(anyLedger.starterHeld || []).filter((b) => b.subject === subject)].flatMap((b) => b.ids) : state.starterBoards[subject].flatMap((b) => b.ids)
    const pool = [...new Set(prevSet)].filter((id) => isActive(R[id]))
    pool.forEach((id) => starterReserved.add(id))
    const pinned = pinnedBoards('starter', pool, subject).slice(0, L.STARTER_BOARDS_PER_SYSTEM)
    const rest = pool.filter((id) => !pinned.flat().includes(id))
    const opts = { seed: `starter:${subject}:${EPOCH}`, cfg: boardConfig, maxPerSubject: 4, minSubjects: 1, iterations: 20000, exclude: rejectedKeys, blockedPairs: reviewBlockedPairs }
    let built = [...pinned, ...B.buildPartition(rest.map(prep), { ...opts, want: L.STARTER_BOARDS_PER_SYSTEM - pinned.length })]
    // Pinned boards can strand the last few connections; if so, re-form the
    // whole subject when that yields more boards.
    if (built.length < L.STARTER_BOARDS_PER_SYSTEM) {
      const whole = B.buildPartition(pool.map(prep), { ...opts, seed: `${opts.seed}:whole`, want: L.STARTER_BOARDS_PER_SYSTEM })
      if (whole.length > built.length) built = whole
    }
    const described = built.map((ids) => ({ ids, d: describe(ids) }))
    // Systems order: easier boards first.
    described.sort((a, b) => a.d.eff.reduce((x, y) => x + y, 0) - b.d.eff.reduce((x, y) => x + y, 0))
    described.forEach(({ ids, d }, i) => {
      const id = `${L.slug(subject)}-starter-${i + 1}`
      const flags = [...d.flags, ...manualFor(id, ids)]
      const clearance = flags.length ? clearanceFromReview(ids, flags) : null
      const entry = { id, subject, ids, signature: signatureOf(ids), levels: levelsOf(ids, d), estimate: { eff: d.eff, counts: d.counts }, swaps: [], flags, clearance }
      if (d.block.length) starterHeld.push({ ...entry, status: 'blocked', block: d.block })
      else if (flags.length && !clearance) starterHeld.push({ ...entry, status: 'needs review' })
      else starterOut[subject].push(entry)
    })
  } else {
    for (const b of prevLedger.starterBoards?.[subject] || []) {
      b.ids.forEach((id) => starterReserved.add(id))
      const members = b.ids.map((id) => R[id])
      const problems = members.filter((r) => !isActive(r)).map((r) => `${r?.id || '?'} is no longer active`)
      const check = L.boardCheck(members.filter(Boolean).map(conn))
      const flags = [...check.flags, ...manualFor(b.id, b.ids)]
      const ok = signatureOf(b.ids) === b.signature && (!flags.length || (b.clearance && flags.every((f) => b.clearance.flagsReviewed.includes(f))))
      if (problems.length || check.block.length) starterHeld.push({ ...b, status: 'blocked', block: [...problems, ...check.block] })
      else if (!ok) starterHeld.push({ ...b, status: 'needs review', flags })
      else starterOut[subject].push(b)
    }
  }
  const published = starterOut[subject].length
  if (published < L.STARTER_BOARDS_PER_SYSTEM) shortfall[subject] = L.STARTER_BOARDS_PER_SYSTEM - published
}

// Daily boards: mixed subjects (at most two connections from one subject),
// no canonical relationship reused.
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
const dailyPool = active.filter((r) => r.pool === 'daily' && !starterReserved.has(r.id))
const dailyBoardsOut = []
const dailyPending = []
const dailyRejected = []
let dailyLeftover = []

if (!fresh && prevLedger?.dailyBoards) {
  // Re-verify the stored boards; never reshuffle.
  for (const b of prevLedger.dailyBoards) {
    const members = b.ids.map((id) => R[id])
    if (members.some((r) => !isActive(r))) throw new Error(`Daily board ${b.id} has a member that is no longer active; resolve before re-running.`)
    const check = L.boardCheck(members.map(conn))
    if (check.block.length) throw new Error(`Daily board ${b.id} no longer passes the structural checks: ${check.block.join(' | ')}`)
    const reviewed = new Set(b.clearance?.flagsReviewed || [])
    if (signatureOf(b.ids) !== b.signature || !check.flags.every((f) => reviewed.has(f)))
      throw new Error(`Daily board ${b.id} changed since it was reviewed; review it again before re-running.`)
    dailyBoardsOut.push(b)
  }
  dailyRejected.push(...(prevLedger.dailyRejected || []))
  dailyLeftover = dailyPool.map((r) => r.id).filter((id) => !dailyBoardsOut.some((b) => b.ids.includes(id)))
} else {
  const pinned = pinnedBoards('daily', dailyPool.map((r) => r.id))
  const pinnedIds = new Set(pinned.flat())
  const built = [...pinned, ...B.buildPartition(dailyPool.filter((r) => !pinnedIds.has(r.id)).map((r) => prep(r.id)), { seed: `daily:${EPOCH}`, cfg: boardConfig, maxPerSubject: 2, minSubjects: 2, iterations: Number(opt('--iterations', 150000)), exclude: rejectedKeys, blockedPairs: reviewBlockedPairs })]
  for (const [k, d] of Object.entries(boardReview)) if (d.verdict === 'fail' && d.kind === 'daily') dailyRejected.push({ ids: k.split('+'), reason: d.rationale, by: d.by })
  const used = new Set(built.flat())
  dailyLeftover = dailyPool.map((r) => r.id).filter((id) => !used.has(id))
  const candidates = []
  for (const ids of built) {
    const d = describe(ids)
    if (d.block.length) throw new Error('internal: blocked Daily board formed')
    const flags = d.flags
    const clearance = flags.length ? clearanceFromReview(ids, flags) : null
    if (flags.length && !clearance) {
      dailyPending.push({ key: setKey(ids), ids, signature: signatureOf(ids), flags })
      dailyLeftover.push(...ids)
    } else candidates.push({ ids, signature: signatureOf(ids), flags, clearance, levels: levelsOf(ids, d), estimate: { eff: d.eff, counts: d.counts, score: d.score } })
  }
  // Schedule order: deterministic; consecutive days avoid repeating a
  // subject and avoid two boards in a row with no challenging group.
  // Each board's place in the queue comes from a hash of its own members, so
  // re-forming a few boards leaves the rest of the order alone.
  const remaining = candidates.map((b) => ({ b, h: L.sha(`${EPOCH}:${setKey(b.ids)}`) })).sort((x, y) => x.h.localeCompare(y.h)).map((x) => x.b)
  let last = null
  while (remaining.length) {
    const fits = (b, strict) =>
      !last || (!b.ids.some((id) => last.ids.some((x) => R[x].system === R[id].system)) && (!strict || b.estimate.counts[2] > 0 || last.estimate.counts[2] > 0))
    let pickIdx = remaining.findIndex((b) => fits(b, true))
    if (pickIdx < 0) pickIdx = remaining.findIndex((b) => fits(b, false))
    if (pickIdx < 0) pickIdx = 0
    const [b] = remaining.splice(pickIdx, 1)
    dailyBoardsOut.push(b)
    last = b
  }
  dailyBoardsOut.forEach((b, i) => (b.id = `nd-${String(i + 1).padStart(3, '0')}`))
}
// No canonical relationship appears twice across the Daily schedule.
{
  const seen = new Set()
  for (const b of dailyBoardsOut)
    for (const id of b.ids) {
      const c = canonicalOf(id)
      if (seen.has(c)) throw new Error(`canonical relationship ${c} scheduled twice`)
      seen.add(c)
    }
}

// Systems expansion from released Dailies. Day n releases Daily board n; its
// connections join their subject's queue. A Systems board is published from
// a queue once it can be formed with no flag, choosing the best-scoring
// board among the waiting connections (the oldest waiting connection first
// when it fits). It is released the same day as the Daily that completed it,
// never earlier, and each connection is used by at most one board.
const expansion = []
const queues = {}
const heldExpansion = []
if (!fresh && prevLedger?.expansionBoards) {
  expansion.push(...prevLedger.expansionBoards)
  Object.assign(queues, prevLedger.expansionQueues || {})
} else {
  const counter = {}
  const WAIT_FOR = 5
  const MAX_WAIT_DAYS = 21
  const arrived = {}
  const lastDay = dailyBoardsOut.length - 1
  const combos = (q) => {
    const out = []
    for (let a = 0; a < q.length; a++) for (let b2 = a + 1; b2 < q.length; b2++) for (let c = b2 + 1; c < q.length; c++) for (let d = c + 1; d < q.length; d++) out.push([q[a], q[b2], q[c], q[d]])
    return out
  }
  dailyBoardsOut.forEach((b, day) => {
    for (const id of b.ids) {
      ;(queues[R[id].system] ||= []).push(id)
      arrived[id] = day
    }
    for (const subject of Object.keys(queues)) {
      let q = queues[subject]
      let formed = true
      while (formed && q.length >= 4) {
        formed = false
        const due = q.length >= WAIT_FOR || day - arrived[q[0]] >= MAX_WAIT_DAYS || day === lastDay
        if (!due) break
        let best = null
        for (const ids of combos(q.slice(0, 12))) {
          const k = setKey(ids)
          if (rejectedKeys.has(k)) continue
          const cs = ids.map(prep)
          if (B.compatibilityBlocked(cs)) continue
          if (ids.some((a, i) => ids.some((b, j) => j > i && reviewBlockedPairs.has([a, b].sort().join('|'))))) continue
          const check = L.boardCheck(cs)
          if (check.block.length || check.flags.length) continue
          const sc = B.analyzeBoard(cs, boardConfig).score + (ids.includes(q[0]) ? 2 : 0)
          if (!best || sc > best.sc) best = { ids, sc }
        }
        if (!best) break
        const ids = best.ids
        const d = describe(ids)
        counter[subject] = (counter[subject] || 0) + 1
        expansion.push({ id: `${L.slug(subject)}-more-${String(counter[subject]).padStart(3, '0')}`, subject, ids, releaseDay: day, signature: signatureOf(ids), levels: levelsOf(ids, d), estimate: { eff: d.eff, counts: d.counts }, origin: 'released-daily', fromDailyBoards: ids.map((id) => dailyBoardsOut.find((x) => x.ids.includes(id)).id) })
        q = q.filter((x) => !ids.includes(x))
        formed = true
      }
      queues[subject] = q
    }
  })
  for (const [subject, q] of Object.entries(queues)) if (q.length >= 4) heldExpansion.push({ subject, waiting: q.length })
}
{
  const used = new Set()
  for (const e of expansion)
    for (const id of e.ids) {
      if (used.has(id)) throw new Error(`expansion reuses ${id}`)
      if (starterReserved.has(id)) throw new Error(`expansion uses starter connection ${id}`)
      const relDay = dailyBoardsOut.findIndex((b) => b.ids.includes(id))
      if (relDay < 0 || relDay > e.releaseDay) throw new Error(`expansion ${e.id} would expose unreleased Daily content`)
      used.add(id)
    }
}

// ---------------------------------------------------------------------
// 6. Outputs
// ---------------------------------------------------------------------
// ---- difficulty labels on every board (rubric, October 15 2026) ----
// Each group's label on a board is its estimate there, at most one step from
// its own label. A board not yet released is ordered easiest to hardest. A
// released board keeps its order (a saved game in progress depends on it);
// its labels are updated, and only where a label would otherwise be more than
// one step from the group's own can a later group read easier.
const relabelLog = []
function relabel(b, released, where) {
  if (!b.ids || b.ids.length !== 4 || !b.ids.every((id) => R[id])) return
  const d = describe(b.ids)
  const byId = Object.fromEntries(b.ids.map((id, i) => [id, { id, e: d.eff[i], i, tier: B.boardTier(d.eff[i], difficultyOf(id)?.tier) }]))
  const before = (b.levels || []).map((l) => `${l.id}:${l.tier}`).join(',')
  let order
  if (released && b.levels && b.levels.length === 4) order = b.levels.map((l) => byId[l.id])
  else order = Object.values(byId).sort((x, y) => x.e - y.e || x.i - y.i)
  // Never easier than the group before it, and never more than one step from
  // the group's own label; on a released board the second rule wins.
  let floor = 0
  const levels = order.map((x) => {
    const own = B.TIERS.indexOf(difficultyOf(x.id)?.tier ?? x.tier)
    const t = Math.min(own < 0 ? 3 : own + 1, Math.max(floor, B.TIERS.indexOf(x.tier)))
    floor = t
    return { id: x.id, tier: B.TIERS[t] }
  })
  b.levels = levels
  const after = levels.map((l) => `${l.id}:${l.tier}`).join(',')
  if (before !== after) relabelLog.push({ board: b.id, where, released, before, after })
}
for (const s of subjects) for (const b of starterOut[s] || []) relabel(b, true, 'systems')
dailyBoardsOut.forEach((b, i) => relabel(b, i <= releasedThroughDay, 'daily'))
expansion.forEach((b) => relabel(b, b.releaseDay <= releasedThroughDay, 'systems-more'))

const usedIds = new Set([...Object.values(starterOut).flat().flatMap((b) => b.ids), ...dailyBoardsOut.flatMap((b) => b.ids)])
const servedRecords = active.filter((r) => usedIds.has(r.id)).sort((a, b) => a.id.localeCompare(b.id))
const clientConn = (r) => {
  const c = r.content
  const tags = [...new Set([r.system, ...(consolidated[r.id] || []).map((x) => x.system)])]
  return {
    id: r.id,
    canonicalId: canonicalOf(r.id),
    title: c.title,
    tiles: c.tiles,
    explanation: c.explanation || '',
    // Served difficulty follows the rubric (difficultyOf), not the source
    // label, which is kept for reference.
    difficulty: difficultyOf(r.id)?.tier || c.difficulty,
    sourceDifficulty: c.difficulty,
    subject: r.system,
    systems: tags,
    connectionType: c.connectionType || '',
    review: { status: r.verification.status, basis: r.verification.basis, reviewer: r.verification.reviewer || null, humanVerified: !!r.verification.humanVerified },
    // Source references stay in content/library only; they are never shipped
    // in the app (owner's decision, October 2026).
    version: r.version,
    ...(r.revision ? { revision: { kind: r.revision.kind, summary: r.revision.changeSummary } } : {}),
    ...(L.servedExplanation(explanations[r.id], c.tiles, statusMapForExplanations) || {}),
  }
}
const SUBJECT_ORDER = ['Cardiology', 'Pulmonary', 'Renal', 'Neurology', 'GI', 'Endocrine', 'Heme/Onc', 'MSK', 'Reproductive', 'Psychiatry', 'Microbiology', 'Immunology', 'Dermatology', 'Pharmacology', 'Biochemistry/Genetics', 'Genetics']
const subjectsOrdered = [...SUBJECT_ORDER.filter((s) => subjects.includes(s)), ...subjects.filter((s) => !SUBJECT_ORDER.includes(s))]

const boardOut = (b) => ({ id: b.id, ids: b.ids, ...(b.levels ? { levels: b.levels } : {}) })
const generated = {
  version: 1,
  epoch: EPOCH,
  dailyStart: DAILY_START,
  subjects: subjectsOrdered,
  connections: Object.fromEntries(servedRecords.map((r) => [r.id, clientConn(r)])),
  starterBoards: Object.fromEntries(subjectsOrdered.map((s) => [s, starterOut[s].map(boardOut)])),
  dailyBoards: dailyBoardsOut.map(boardOut),
  expansionBoards: expansion.map((e) => ({ ...boardOut(e), subject: e.subject, releaseDay: e.releaseDay })),
}
const ledger = {
  about: 'Activation ledger. Published boards, the Daily schedule and Systems expansion boards are read back from this file on every run and never reshuffled (except a deliberate --rebuild with a new epoch).',
  epoch: EPOCH,
  dailyStart: DAILY_START,
  boardConfig,
  overlays: overlayLog,
  timedOverlay: timedOverlayLog,
  starterBoards: Object.fromEntries(subjectsOrdered.map((s) => [s, starterOut[s]])),
  starterHeld,
  starterReplacements: replacementsLog,
  dailyBoards: dailyBoardsOut,
  dailyPending,
  dailyRejected,
  dailyLeftover: [...new Set(dailyLeftover)].sort(),
  expansionBoards: expansion,
  expansionQueues: queues,
  timedExclusions,
  timedCanonical,
  consolidated,
}

const banner = '// GENERATED by scripts/library/activate.mjs from content/library. Do not edit by hand.\n'
const newLibSrc = `${banner}// New library: the only source for Daily (from ${DAILY_START}) and Systems.\n// Review labels are kept as recorded; AI_REVIEWED_* rows are OpenEvidence AI review, not human verification.\nconst NEW_LIBRARY = ${JSON.stringify(generated)}\nexport default NEW_LIBRARY\n`
const timedSrc = `${banner}// Timed library (3 Minutes and Race): entries removed at activation, and\n// canonical relationship ids for timed entries that repeat each other.\nexport const TIMED_EXCLUSIONS = ${JSON.stringify(Object.fromEntries(Object.entries(timedExclusions).map(([k, v]) => [k, { kind: v.kind, newId: v.newId }])), null, 1)}\nexport const TIMED_CANONICAL = ${JSON.stringify(timedCanonical, null, 1)}\n// Checked revisions (AI checked, not human verified), checked near-miss\n// lists and difficulty metadata (audience recognition 1-5, tile kinds).\nexport const TIMED_REVISIONS = ${JSON.stringify(TIMED_REVISIONS)}\nexport const TIMED_NEAR_MISSES = ${JSON.stringify(TIMED_NEAR_MISSES)}\nexport const TIMED_META = ${JSON.stringify(TIMED_META)}\nexport const CONTENT_EPOCH = ${JSON.stringify(EPOCH)}\n`

// ---- report ----
const count = (arr) => arr.length
const statusTally = active.reduce((m, r) => ((m[r.verification.status] = (m[r.verification.status] || 0) + 1), m), {})
const holds = {
  medical: Object.values(R).filter((r) => ['held', 'unresolved', 'missing'].includes(r.verification.state)).length,
  duplicate: Object.values(R).filter((r) => r.verification.approved && r.heldFor.length).length,
  consolidated: Object.values(R).filter((r) => r.duplicateOf).length,
}
const lastDay = dailyBoardsOut.length - 1
const rep = []
const w = (s = '') => rep.push(s)
w('# Plexus new library: activation report')
w()
w(`Daily switches to the new library on **${DAILY_START}** (players' local date). Earlier dates keep the existing Daily.`)
w()
w('## Content')
w()
w(`| | Count |`)
w(`|---|---|`)
w(`| Active connections (eligible, unique, not held) | ${active.length} |`)
w(`| ...served on a published board | ${servedRecords.length} |`)
w(`| Held: medical / source review | ${holds.medical} |`)
w(`| Held: possible duplicate awaiting decision | ${holds.duplicate} |`)
w(`| Consolidated into a canonical relationship | ${holds.consolidated} |`)
w(`| Human verified | ${active.filter((r) => r.verification.humanVerified).length} |`)
w()
w(`Review labels of active connections: ${Object.entries(statusTally).map(([k, v]) => `${k} ${v}`).join(', ')} (OpenEvidence AI review; none relabelled as human verified).`)
w()
w('## Difficulty rebuild')
w()
w(`- Content epoch: **${EPOCH}**. Saved puzzle progress from an earlier epoch is cleared on each device (src/utils/contentEpoch.js).`)
w(`- Revisions applied (independent AI check, not human verified): ${overlayLog.revised.length}; wording-only copy edits: ${overlayLog.copyEdited.length}; stale (skipped): ${overlayLog.stale.length}.`)
w(`- Board target per board: ${boardConfig.target.approachable} approachable, ${boardConfig.target.moderate} moderate, ${boardConfig.target.challenging} challenging (content/library/board-config.json overrides). Estimates only.`)
{
  const all = [...dailyBoardsOut, ...Object.values(starterOut).flat(), ...expansion]
  const hit = all.filter((b) => b.estimate && b.estimate.counts && b.estimate.counts.join() === [boardConfig.target.approachable, boardConfig.target.moderate, boardConfig.target.challenging].join()).length
  const reviewed = all.filter((b) => boardReview[setKey(b.ids)]?.verdict === 'pass').length
  w(`- Boards whose estimated mix meets the target: ${hit} of ${all.length}. Boards with a recorded fairness review pass: ${reviewed} of ${all.length}. Boards rejected on review and never formed again: ${rejectedKeys.size}.`)
  const noChallenge = dailyBoardsOut.filter((b) => b.estimate && b.estimate.counts[2] === 0).length
  if (noChallenge) w(`- Shortage: ${noChallenge} Daily boards have no group estimated as challenging; the library has too few connections that need real reasoning to give every board one.`)
}
w()
w('## Systems starter boards')
w()
w('| Subject | Published | Shortfall |')
w('|---|---|---|')
for (const s of subjectsOrdered) w(`| ${s} | ${starterOut[s].length} | ${shortfall[s] || 0} |`)
w()
w(`Total published: ${Object.values(starterOut).flat().length}. Held: ${starterHeld.length}.`)
w()
if (replacementsLog.length) {
  w('### Replacements made during review')
  for (const x of replacementsLog) for (const s of x.swaps) w(`- ${x.board}: ${s.out} (${R[s.out].content.title}) replaced by ${s.in} (${R[s.in].content.title}). ${s.reason || ''}`)
  w()
}
const cleared = Object.values(starterOut).flat().filter((b) => b.clearance)
if (cleared.length) {
  w('### Flags reviewed and cleared (not silently)')
  for (const b of cleared) {
    w(`- **${b.id}** (${b.clearance.by}): ${b.clearance.rationale}`)
    for (const f of b.flags) w(`  - flag: ${f}`)
  }
  w()
}
if (starterHeld.length) {
  w('### Held starter boards')
  for (const b of starterHeld) w(`- ${b.id}: ${b.status}. ${(b.block || b.flags).join(' | ')}`)
  w()
}
w('## Daily')
w()
w(`- Launch-ready Daily boards: **${dailyBoardsOut.length}** (${dailyBoardsOut.filter((b) => !b.flags.length).length} with no flags, ${dailyBoardsOut.filter((b) => b.flags.length).length} flagged and cleared on review).`)
w(`- Runway: ${DAILY_START} to ${dailyBoardsOut.length ? dateForDay(lastDay) : 'n/a'} with no relationship repeated.`)
w(`- Boards waiting for review (not scheduled): ${dailyPending.length}. Rejected on review: ${dailyRejected.length}. Connections left over (no compatible board yet): ${new Set(dailyLeftover).size}.`)
w(`- Exhaustion policy: after ${dailyBoardsOut.length ? dateForDay(lastDay) : 'the last board'}, the Daily replays the same reviewed boards in the same order, one per day, under new dates. Nothing is regenerated, so no unreviewed board appears. Importing more content before then extends the new schedule instead.`)
w()
const clearedDaily = dailyBoardsOut.filter((b) => b.clearance)
if (clearedDaily.length || dailyRejected.length) {
  w('### Daily boards reviewed')
  for (const b of clearedDaily) {
    w(`- **${b.id}** cleared (${b.clearance.by}): ${b.clearance.rationale}`)
    for (const id of b.ids) w(`  - ${id} ${R[id].content.title}: ${R[id].content.tiles.join(' · ')}`)
  }
  for (const b of dailyRejected) w(`- Rejected ${b.ids.join(', ')} (${b.by}): ${b.reason}`)
  w()
}
w('## Systems expansion from released Dailies')
w()
w(`- ${expansion.length} expansion boards are scheduled. Each is released on the same date as the Daily that supplied its last connection, never earlier.`)
for (const s of subjectsOrdered) {
  const mine = expansion.filter((e) => e.subject === s)
  if (mine.length) w(`  - ${s}: ${mine.length} (first on ${dateForDay(mine[0].releaseDay)})`)
}
w(`- Connections still waiting in subject queues at the end of the runway: ${Object.values(queues).flat().length}.`)
w('- These boards intentionally reuse released Daily connections. That is separate from timed-mode overlap, which is excluded below.')
w()
w('## Timed library (3 Minutes and Race)')
w()
w(`- Timed entries before activation: ${timedVerified.length} verified.`)
w(`- Removed as confirmed equivalents of new-library connections: ${Object.values(timedExclusions).filter((x) => x.kind === 'confirmed').length}.`)
w(`- Temporarily excluded (unresolved overlap with an active new-library connection): ${Object.values(timedExclusions).filter((x) => x.kind === 'temporary').length}.`)
w(`- Served: ${timedServed.length}. Timed entries sharing one canonical relationship: ${Object.keys(timedCanonical).length} (never both in one session).`)
w()
for (const [id, x] of Object.entries(timedExclusions)) w(`  - ${id} "${x.title}": ${x.kind}, ${x.reason}`)
w()

const pendingFile = { about: 'Boards that need a person before they can be published. Add a decision to content/library/activation-review.json and re-run.', starter: starterHeld, daily: dailyPending }

// ---- difficulty review: queue for the owner, and old rule vs new ----
const servedIds = servedRecords.map((r) => r.id)
const diffRows = servedIds.map((id) => {
  const d = difficultyOf(id)
  const m = metaFor(id)
  return { id, title: R[id].content.title, subject: R[id].system, tiles: R[id].content.tiles, oldRule: m ? B.recognitionLabel(m.recognition) : R[id].content.difficulty, ...(d || {}), secondReason: secondRating[id]?.reason || '', thirdReason: thirdRating[id]?.reason || '' }
})
const queueRows = diffRows
  .filter((x) => x.status === 'queue')
  .sort((a, b) => {
    const sp = (x) => Math.max(...[x.computed, x.second, x.third].filter(Boolean).map((t) => B.TIERS.indexOf(t))) - Math.min(...[x.computed, x.second, x.third].filter(Boolean).map((t) => B.TIERS.indexOf(t)))
    return sp(b) - sp(a) || a.id.localeCompare(b.id)
  })
const countBy = (rows, f) => B.TIERS.map((t) => rows.filter((x) => f(x) === t).length)
const boardMix = (boards) => {
  const mix = {}
  for (const b of boards) {
    const k = (b.levels || []).map((l) => ({ easy: 'E', medium: 'M', hard: 'H', expert: 'X' })[l.tier]).join('')
    mix[k] = (mix[k] || 0) + 1
  }
  return Object.entries(mix).sort((a, b) => b[1] - a[1])
}
const dq = []
const dw = (x = '') => dq.push(x)
dw('# Difficulty labels: review')
dw()
dw('How labels are set: `content/library/difficulty-rubric.md`. Decide a queued connection by adding it to `content/library/audit/difficulty-overrides.json` and running `node scripts/library/activate.mjs`. All ratings are AI estimates, not player data.')
dw()
dw('## Counts (served connections)')
dw()
dw('| | Easy | Medium | Hard | Expert |')
dw('|---|---|---|---|---|')
dw(`| Old rule (recognition only) | ${countBy(diffRows, (x) => x.oldRule).join(' | ')} |`)
dw(`| Score alone | ${countBy(diffRows, (x) => x.computed).join(' | ')} |`)
dw(`| Second rating | ${countBy(diffRows, (x) => x.second).join(' | ')} |`)
dw(`| **Served now** | ${countBy(diffRows, (x) => x.tier).map((n) => `**${n}**`).join(' | ')} |`)
dw()
const st = (k) => diffRows.filter((x) => x.status === k).length
dw(`Status: ${st('confirmed')} confirmed (score and second rating agree), ${st('majority')} settled by a third rating, ${st('queue')} waiting for you, ${st('override')} decided by you.`)
dw()
dw('Daily boards, labels shown easiest to hardest (E Easy, M Medium, H Hard, X Expert):')
dw()
for (const [k, n] of boardMix(dailyBoardsOut)) dw(`- ${k}: ${n}`)
dw()
dw(`${dailyBoardsOut.filter((b) => b.levels.some((l) => l.tier === 'hard' || l.tier === 'expert')).length} of ${dailyBoardsOut.length} Daily boards show at least one Hard or Expert group; ${dailyBoardsOut.filter((b) => b.levels.some((l) => l.tier === 'expert')).length} show an Expert group.`)
dw()
dw(`## Needs your decision (${queueRows.length})`)
dw()
dw('Shipped meanwhile with the majority rating, or the middle one when all three differ (an Easy that needs more than recall ships as Medium). Ratings that span two tiers or more are listed first.')
dw()
for (const x of queueRows) {
  dw(`### ${x.id} · ${x.title} (${x.subject})`)
  dw(`Tiles: ${x.tiles.join(' · ')}`)
  dw(`- Score ${x.score}: **${x.computed}**${x.near ? ' (near a cut point)' : ''}`)
  dw(`- Second rating: **${x.second}**. ${x.secondReason}`)
  if (x.third) dw(`- Third rating: **${x.third}**. ${x.thirdReason}`)
  dw(`- Shipped as: **${x.tier}** (old rule: ${x.oldRule})`)
  dw()
}
const changed = diffRows.filter((x) => x.tier !== x.oldRule)
dw(`## Every label that changed (${changed.length})`)
dw()
dw('| Id | Connection | Old | New | Score | 2nd | 3rd | How |')
dw('|---|---|---|---|---|---|---|---|')
for (const x of changed.sort((a, b) => a.id.localeCompare(b.id))) dw(`| ${x.id} | ${x.title.replace(/\|/g, '/')} | ${x.oldRule} | **${x.tier}** | ${x.computed} (${x.score}) | ${x.second || ''} | ${x.third || ''} | ${x.status} |`)
dw()
const queueFile = { about: 'Connections whose difficulty ratings did not settle. Decide in difficulty-overrides.json.', generated: 'by scripts/library/activate.mjs', entries: queueRows.map(({ id, title, subject, tiles, score, computed, second, third, tier, oldRule, secondReason, thirdReason, near }) => ({ id, title, subject, tiles, score, computed, second, third, shippedAs: tier, oldRule, secondReason, thirdReason, near })) }
const outputs = {
  [P('content/library/audit/difficulty-review.md')]: dq.join('\n') + '\n',
  [P('content/library/audit/difficulty-review-queue.json')]: JSON.stringify(queueFile, null, 1) + '\n',
  [P('src/data/library/newLibrary.js')]: newLibSrc,
  [P('src/data/library/timedLibrary.js')]: timedSrc,
  [LEDGER_FILE]: JSON.stringify(ledger, null, 1) + '\n',
  [path.join(ACT_DIR, 'report.md')]: rep.join('\n') + '\n',
  [path.join(ACT_DIR, 'pending-review.json')]: JSON.stringify(pendingFile, null, 1) + '\n',
}
if (flag('--check')) {
  const changed = Object.entries(outputs).filter(([f, s]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== s)
  if (changed.length) {
    console.log('Outputs would change:\n' + changed.map(([f]) => '  ' + path.relative(ROOT, f)).join('\n'))
    process.exit(1)
  }
  console.log('activation outputs are up to date')
} else if (flag('--plan')) {
  // Review pass: nothing is frozen; only the report and the review list.
  fs.mkdirSync(ACT_DIR, { recursive: true })
  fs.writeFileSync(path.join(ACT_DIR, 'pending-review.json'), outputs[path.join(ACT_DIR, 'pending-review.json')])
  fs.writeFileSync(path.join(ACT_DIR, 'plan-report.md'), outputs[path.join(ACT_DIR, 'report.md')])
  fs.writeFileSync(path.join(ACT_DIR, 'plan-hashes.json'), JSON.stringify({ hashes: Object.fromEntries(active.map((r) => [r.id, r.contentHash])), starterPool: [...starterReserved].sort() }))
  fs.writeFileSync(path.join(ACT_DIR, 'plan-boards.json'), JSON.stringify({ starter: starterOut, daily: dailyBoardsOut, expansion, starterHeld, dailyPending }, null, 1))
} else {
  if (dailyPending.length || starterHeld.some((b) => b.status === 'needs review'))
    console.warn(`Note: ${dailyPending.length} Daily and ${starterHeld.filter((b) => b.status === 'needs review').length} starter boards still need review; they are left out of this activation.`)
  fs.mkdirSync(ACT_DIR, { recursive: true })
  fs.mkdirSync(P('src/data/library'), { recursive: true })
  for (const [f, s] of Object.entries(outputs)) fs.writeFileSync(f, s)
}
console.log(
  JSON.stringify(
    {
      dailyStart: DAILY_START,
      active: active.length,
      served: servedRecords.length,
      starterPublished: Object.fromEntries(subjectsOrdered.map((s) => [s, starterOut[s].length])),
      starterHeld: starterHeld.map((b) => b.id),
      dailyBoards: dailyBoardsOut.length,
      dailyPending: dailyPending.length,
      dailyRejected: dailyRejected.length,
      leftover: new Set(dailyLeftover).size,
      runwayEnds: dailyBoardsOut.length ? dateForDay(lastDay) : null,
      expansion: expansion.length,
      timedExcluded: Object.keys(timedExclusions).length,
      timedServed: timedServed.length,
    },
    null,
    1
  )
)
