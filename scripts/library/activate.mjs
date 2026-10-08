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
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'

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
const prevLedger = flag('--fresh') ? null : readJson(LEDGER_FILE, null)
const { default: connectionBank } = await import(P('src/data/connectionBank.js'))

// The first date the new library serves Daily. Kept in the ledger so a rerun
// never moves it; set once with --daily-start.
const DAILY_START = opt('--daily-start', prevLedger?.dailyStart || '2026-10-10')
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
if (flag('--fresh') && releasedThroughDay >= 0 && fs.existsSync(LEDGER_FILE))
  throw new Error(`--fresh refused: the new Daily has already started somewhere (${latestKeyAnywhere} >= ${DAILY_START}).`)

// ---------------------------------------------------------------------
// 1. Active connections and canonical relationship ids
// ---------------------------------------------------------------------
const R = state.records
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
const timedVerified = connectionBank.filter((c) => c.status === 'verified')
const timedCanonical = {}
for (const c of timedVerified) if (find(c.id) !== c.id) timedCanonical[c.id] = find(c.id)
const timedServed = timedVerified.filter((c) => !timedExclusions[c.id])

// ---------------------------------------------------------------------
// 3. Starter boards (Systems only)
// ---------------------------------------------------------------------
const signatureOf = (ids) => L.sha(ids.map((id) => R[id]?.contentHash || 'missing').join('|')).slice(0, 8)
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

const starterOut = {}
const starterReserved = new Set()
const replacementsLog = []
const starterHeld = []
const shortfall = {}
const subjects = Object.keys(state.starterBoards)
for (const subject of subjects) {
  starterOut[subject] = []
  const prev = prevLedger?.starterBoards?.[subject] || null
  for (const b of state.starterBoards[subject]) {
    const prevBoard = prev?.find((x) => x.id === b.id)
    let ids = prevBoard ? prevBoard.ids.slice() : b.ids.slice()
    const dec = review.starterBoards?.[b.id]
    const swaps = prevBoard ? (prevBoard.swaps || []).slice() : []
    if (!prevBoard && dec?.replace)
      for (const [out, inn] of Object.entries(dec.replace)) {
        const i = ids.indexOf(out)
        if (i < 0) throw new Error(`${b.id}: replace names ${out}, which is not on the board`)
        const r = R[inn]
        if (!isActive(r) || r.pool !== 'daily' || r.system !== subject) throw new Error(`${b.id}: replacement ${inn} must be an active ${subject} Daily-pool connection`)
        if (r.placementNote && !decisions.starterAllow?.[inn]) throw new Error(`${b.id}: ${inn} carries a placement note (${r.placementNote})`)
        ids[i] = inn
        swaps.push({ out, in: inn, reason: dec.reason })
      }
    for (const id of ids) starterReserved.add(id)
    const members = ids.map((id) => R[id])
    const problems = members.filter((r) => !isActive(r)).map((r) => `${r?.id || '?'} is no longer active`)
    const check = L.boardCheck(members.filter(Boolean).map(conn))
    const flags = [...check.flags, ...manualFor(b.id, ids)]
    const clearance = flags.length ? (prevBoard?.clearance && prevBoard.signature === signatureOf(ids) && flags.every((f) => prevBoard.clearance.flagsReviewed.includes(f)) ? prevBoard.clearance : clearanceFor(dec, ids, flags)) : null
    const entry = { id: b.id, subject, ids, signature: signatureOf(ids), swaps, flags, clearance }
    if (problems.length || check.block.length) {
      starterHeld.push({ ...entry, status: 'blocked', block: [...problems, ...check.block] })
    } else if (flags.length && !clearance) {
      starterHeld.push({ ...entry, status: 'needs review' })
    } else {
      starterOut[subject].push(entry)
    }
    if (swaps.length) replacementsLog.push({ board: b.id, subject, swaps })
  }
  const published = starterOut[subject].length
  if (published < L.STARTER_BOARDS_PER_SYSTEM) shortfall[subject] = L.STARTER_BOARDS_PER_SYSTEM - published
}
// Connections swapped out of a starter board return to the Daily pool.
const swappedOut = new Set(replacementsLog.flatMap((x) => x.swaps.map((s) => s.out)))

// ---------------------------------------------------------------------
// 4. Daily boards: mixed subjects, no canonical relationship reused
// ---------------------------------------------------------------------
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
const MAX_PER_SUBJECT = 2

// Greedy with restarts: as many disjoint boards as possible, each passing the
// structural checks, with at most two connections from one subject. In
// `clean` mode a flagged pair or a member with a general board caution is not
// allowed at all.
function formBoards(pool, { clean, seed, restarts = 200, rejected = new Set() }) {
  const conns = pool.map((r) => conn(R[r.id]))
  const n = conns.length
  const ok = Array.from({ length: n }, () => new Uint8Array(n))
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const res = L.pairCheck(conns[i], conns[j])
      if (res.block.length) continue
      if (clean && res.flag.length) continue
      ok[i][j] = ok[j][i] = res.flag.length ? 2 : 1
    }
  const caution = conns.map((c) => L.generalCautionCount(c))
  const usable = conns.map((_, i) => !clean || caution[i] === 0)
  const tier = conns.map((c) => L.TIERS.indexOf(c.difficulty))
  let best = { boards: [], score: -Infinity }
  for (let r = 0; r < restarts; r++) {
    const rand = rng(`${seed}:${r}`)
    const used = new Uint8Array(n)
    const boards = []
    let score = 0
    for (const s0 of shuffle([...Array(n).keys()], rand)) {
      if (used[s0] || !usable[s0]) continue
      const board = [s0]
      while (board.length < 4) {
        let pick = -1
        let pickScore = -Infinity
        for (let k = 0; k < n; k++) {
          if (used[k] || !usable[k] || board.includes(k) || !board.every((b) => ok[b][k])) continue
          const sameSubject = board.filter((b) => conns[b].system === conns[k].system).length
          if (sameSubject >= MAX_PER_SUBJECT) continue
          const tiers = new Set(board.map((b) => tier[b]))
          const flagged = board.filter((b) => ok[b][k] === 2).length
          const sc = (sameSubject ? -2 : 2) + (tiers.has(tier[k]) ? 0 : 2) + (tier[k] >= 2 ? 1 : 0) - (flagged + caution[k]) * 3 + rand() * 2
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
      if (new Set(cs.map((c) => c.system)).size < 2) continue
      if (rejected.has(setKey(cs.map((c) => c.id)))) continue
      if (clean && L.boardCheck(cs).flags.length) continue
      board.forEach((i) => (used[i] = 1))
      boards.push(cs.map((c) => c.id))
      score += L.boardScore(cs) + new Set(cs.map((c) => c.system)).size
    }
    if (boards.length > best.boards.length || (boards.length === best.boards.length && score > best.score)) best = { boards, score }
  }
  return best.boards
}

const dailyPool = active.filter((r) => (r.pool === 'daily' || swappedOut.has(r.id)) && !starterReserved.has(r.id))
// One record per canonical relationship (active records are already canonical).
const dailyBoardsOut = []
const dailyPending = []
const dailyRejected = []
let dailyLeftover = []
const reviewKey = (ids) => setKey(ids)

if (prevLedger?.dailyBoards) {
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
  const rejected = new Set(Object.entries(review.dailyBoards || {}).filter(([, d]) => d.reject).map(([k]) => k))
  // Phase 1: boards with no flag at all. Phase 2: the rest, flags allowed
  // (each needs a recorded review). Phase 3: connections from boards rejected
  // on review plus anything left over, re-formed without the rejected sets.
  // Rejections never reshuffle phases 1 and 2, so earlier reviews stay valid.
  const cleanAll = formBoards(dailyPool, { clean: true, seed: 'daily-clean', restarts: 120 })
  const usedCleanAll = new Set(cleanAll.flat())
  const cleanBoards = cleanAll.filter((ids) => !rejected.has(setKey(ids)))
  const rejectedClean = cleanAll.filter((ids) => rejected.has(setKey(ids)))
  const rest = dailyPool.filter((r) => !usedCleanAll.has(r.id))
  const flaggedAll = formBoards(rest, { clean: false, seed: 'daily-flagged', restarts: 300, rejected })
  const usedFlagged = new Set(flaggedAll.flat())
  const phase3Pool = dailyPool.filter((r) => (!usedCleanAll.has(r.id) && !usedFlagged.has(r.id)) || rejectedClean.some((ids) => ids.includes(r.id)))
  const phase3 = formBoards(phase3Pool, { clean: false, seed: 'daily-rebuild', restarts: 300, rejected })
  for (const ids of rejectedClean) {
    const dec = review.dailyBoards[setKey(ids)]
    dailyRejected.push({ ids, reason: dec.reject.rationale, by: dec.reject.by })
  }
  const candidates = [
    ...cleanBoards.map((ids) => ({ ids, clean: true })),
    ...flaggedAll.map((ids) => ({ ids, clean: false })),
    ...phase3.map((ids) => ({ ids, clean: false })),
  ]
  const usedAll = new Set(candidates.flatMap((c) => c.ids))
  dailyLeftover = dailyPool.map((r) => r.id).filter((id) => !usedAll.has(id))
  for (const c of candidates) {
    const cs = c.ids.map((id) => conn(R[id]))
    const check = L.boardCheck(cs)
    if (check.block.length) throw new Error('internal: blocked Daily board formed')
    const dec = review.dailyBoards?.[reviewKey(c.ids)]
    const flags = check.flags
    const clearance = flags.length ? clearanceFor(dec, c.ids, flags) : null
    if (flags.length && !clearance) {
      dailyPending.push({ key: reviewKey(c.ids), ids: c.ids, signature: signatureOf(c.ids), flags })
      dailyLeftover.push(...c.ids)
    } else {
      dailyBoardsOut.push({ ids: c.ids, signature: signatureOf(c.ids), flags, clearance })
    }
  }
  // Schedule order: deterministic, spreading subjects so consecutive days do
  // not lean on the same ones.
  const r = rng('daily-order')
  const remaining = shuffle(dailyBoardsOut.splice(0), r)
  let last = new Set()
  while (remaining.length) {
    let pickIdx = remaining.findIndex((b) => !b.ids.some((id) => last.has(R[id].system)))
    if (pickIdx < 0) pickIdx = 0
    const [b] = remaining.splice(pickIdx, 1)
    dailyBoardsOut.push(b)
    last = new Set(b.ids.map((id) => R[id].system))
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

// ---------------------------------------------------------------------
// 5. Systems expansion from released Dailies (precomputed, persisted)
// ---------------------------------------------------------------------
// Day n releases Daily board n. Its connections join the expansion queue of
// their primary subject. Whenever a subject's queue holds four compatible,
// unused connections whose board passes every check with no flag, a Systems
// board is published, released the same day as the Daily that completed it.
// A Systems board never contains a connection from a Daily that has not
// been released yet, and every connection is used by at most one board.
const expansion = []
const queues = {}
const heldExpansion = []
if (prevLedger?.expansionBoards) {
  expansion.push(...prevLedger.expansionBoards)
  Object.assign(queues, prevLedger.expansionQueues || {})
} else {
  const counter = {}
  dailyBoardsOut.forEach((b, day) => {
    for (const id of b.ids) (queues[R[id].system] ||= []).push(id)
    for (const subject of Object.keys(queues)) {
      let q = queues[subject]
      let formed = true
      while (formed && q.length >= 4) {
        formed = false
        // Oldest-first search over 4-combinations of the queue.
        outer: for (let a = 0; a < q.length; a++)
          for (let b2 = a + 1; b2 < q.length; b2++)
            for (let c = b2 + 1; c < q.length; c++)
              for (let d = c + 1; d < q.length; d++) {
                const ids = [q[a], q[b2], q[c], q[d]]
                const check = L.boardCheck(ids.map((id) => conn(R[id])))
                if (check.block.length || check.flags.length) continue
                counter[subject] = (counter[subject] || 0) + 1
                expansion.push({ id: `${L.slug(subject)}-more-${String(counter[subject]).padStart(3, '0')}`, subject, ids, releaseDay: day, signature: signatureOf(ids), origin: 'released-daily', fromDailyBoards: ids.map((id) => dailyBoardsOut.find((x) => x.ids.includes(id)).id) })
                q = q.filter((x) => !ids.includes(x))
                formed = true
                break outer
              }
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
    difficulty: c.difficulty,
    subject: r.system,
    systems: tags,
    connectionType: c.connectionType || '',
    review: { status: r.verification.status, basis: r.verification.basis, reviewer: r.verification.reviewer || null, humanVerified: !!r.verification.humanVerified },
    source: c.sources || '',
    sourceSection: c.sourceSection || '',
    version: r.version,
  }
}
const SUBJECT_ORDER = ['Cardiology', 'Pulmonary', 'Renal', 'Neurology', 'GI', 'Endocrine', 'Heme/Onc', 'MSK', 'Reproductive', 'Psychiatry', 'Microbiology', 'Immunology', 'Dermatology', 'Pharmacology', 'Biochemistry/Genetics', 'Genetics']
const subjectsOrdered = [...SUBJECT_ORDER.filter((s) => subjects.includes(s)), ...subjects.filter((s) => !SUBJECT_ORDER.includes(s))]

const generated = {
  version: 1,
  dailyStart: DAILY_START,
  subjects: subjectsOrdered,
  connections: Object.fromEntries(servedRecords.map((r) => [r.id, clientConn(r)])),
  starterBoards: Object.fromEntries(subjectsOrdered.map((s) => [s, starterOut[s].map((b) => ({ id: b.id, ids: b.ids }))])),
  dailyBoards: dailyBoardsOut.map((b) => ({ id: b.id, ids: b.ids })),
  expansionBoards: expansion.map((e) => ({ id: e.id, subject: e.subject, ids: e.ids, releaseDay: e.releaseDay })),
}
const ledger = {
  about: 'Activation ledger. Published boards, the Daily schedule and Systems expansion boards are read back from this file on every run and never reshuffled.',
  dailyStart: DAILY_START,
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
const timedSrc = `${banner}// Timed library (3 Minutes and Race): entries removed at activation, and\n// canonical relationship ids for timed entries that repeat each other.\nexport const TIMED_EXCLUSIONS = ${JSON.stringify(Object.fromEntries(Object.entries(timedExclusions).map(([k, v]) => [k, { kind: v.kind, newId: v.newId }])), null, 1)}\nexport const TIMED_CANONICAL = ${JSON.stringify(timedCanonical, null, 1)}\n`

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

const outputs = {
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
  fs.writeFileSync(path.join(ACT_DIR, 'plan-boards.json'), JSON.stringify({ starter: starterOut, daily: dailyBoardsOut }, null, 1))
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
