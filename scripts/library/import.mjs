#!/usr/bin/env node
// ---------------------------------------------------------------------
// Import one reviewed system file into the staged new library.
// ---------------------------------------------------------------------
//   node scripts/library/import.mjs <file.json|.csv|.xlsx> --system "Cardiology" [--dry-run]
//   node scripts/library/import.mjs --status            (cumulative report only)
//
// Staged data lives in content/library/. Nothing in src/ reads it, so the live
// Daily and Systems content does not change. Imports are incremental and
// idempotent: earlier systems are never removed, re-running the same file
// changes nothing, and a revised file updates matching records with version
// history. See content/library/README.md.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'
import { buildQueue, queueMarkdown, systemCounts } from './queue.mjs'
import timedBank from '../../src/data/connectionBank.js'
import { SYSTEMS } from '../../src/data/constants.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = process.env.PLEXUS_LIBRARY_DIR || path.join(ROOT, 'content/library')
const STATE = path.join(DIR, 'library.json')
const DECISIONS = path.join(DIR, 'decisions.json')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const DRY = args.includes('--dry-run')
const STATUS_ONLY = args.includes('--status')
const file = args.find((a, i) => !a.startsWith('--') && !['--system', '--assume-approved'].includes(args[i - 1]))
const system = flag('--system')
const now = process.env.PLEXUS_IMPORT_TIME || new Date().toISOString()

const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback)
const state = readJson(STATE, { schema: 1, records: {}, starterBoards: {}, imports: [] })
const decisionFile = readJson(DECISIONS, { pairs: {}, boards: {} })
const decisions = decisionFile.pairs || {}
const boardDecisions = decisionFile.boards || {}
// Which verification labels count as approved. Only you change this file.
const STATUS_MAP_FILE = path.join(DIR, 'status-map.json')
const statusMap = { ...L.DEFAULT_STATUS_MAP, ...readJson(STATUS_MAP_FILE, {}) }
// Per-row determinations for conditionally eligible labels (for example
// AI_REVIEWED_REVISED): did the review endorse the final corrected row, and is
// anything outstanding? Tied to the row's content hash, so a later revision
// needs a fresh determination.
// Manual ambiguity flags on specific starter boards, for medical overlaps the
// automatic checks cannot see. Each entry names who raised it. A flagged
// board needs review; the flag lapses when the board's signature changes.
const BOARD_FLAGS = path.join(DIR, 'board-flags.json')
const manualBoardFlags = readJson(BOARD_FLAGS, { boards: {} }).boards || {}
const REVISION_REVIEWS = path.join(DIR, 'revision-reviews.json')
const revisionReviews = readJson(REVISION_REVIEWS, { rows: {} }).rows || {}
// Projection only: --assume-approved "LABEL,LABEL" shows what the pools would
// be if those labels were approved. Refused unless --dry-run, so it can never
// mark anything approved.
const assume = flag('--assume-approved')
if (assume) {
  if (!DRY) {
    console.error('--assume-approved is a projection and only works with --dry-run.')
    process.exit(2)
  }
  statusMap.approved = [...statusMap.approved, ...assume.split(',').map((x) => x.trim())]
}

// ---------------- reading the upload ----------------
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()))
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}
function readUpload(p) {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.json') {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'))
    return Array.isArray(data) ? data : data.connections || data.categories || data.items || []
  }
  if (ext === '.csv') return parseCsv(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''))
  if (ext === '.xlsx') {
    const py = `import json,sys,openpyxl\nwb=openpyxl.load_workbook(sys.argv[1],read_only=True,data_only=True)\nout=[]\nfor ws in wb.worksheets:\n  rows=list(ws.iter_rows(values_only=True))\n  if not rows: continue\n  head=[str(h).strip() if h is not None else '' for h in rows[0]]\n  for r in rows[1:]:\n    if all(v is None or str(v).strip()=='' for v in r): continue\n    out.append({h:(v if v is None or isinstance(v,(int,float,bool)) else str(v)) for h,v in zip(head,r) if h})\nprint(json.dumps(out,default=str))`
    return JSON.parse(execFileSync('python3', ['-I', '-c', py, p], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }))
  }
  throw new Error(`Unsupported file type ${ext}. Use .json, .csv or .xlsx.`)
}

// ---------------- import ----------------
const changes = { added: [], revised: [], unchanged: [], conflicts: [], problems: [], keptFromEarlier: [] }
let importEntry = null

if (!STATUS_ONLY) {
  if (!file || !system) {
    console.error('Usage: node scripts/library/import.mjs <file> --system "<System>" [--dry-run]')
    process.exit(2)
  }
  const raw = fs.readFileSync(file)
  const fileSha = L.sha(raw.toString('binary'))
  const rows = readUpload(file)
  const sysSlug = L.slug(system)
  const timedIds = new Set(timedBank.map((c) => c.id))
  const seenInFile = new Set()
  if (!SYSTEMS.includes(system)) changes.problems.push({ row: '-', issue: `"${system}" is not one of the app's system names (${SYSTEMS.join(', ')}). Imported under this name; it needs a mapping before activation.` })

  rows.forEach((row, idx) => {
    const content = L.mapRow(row)
    const rowNo = idx + 2
    // ID: the file's own id wins. Without one, match an existing record of
    // this system with the same four tiles; otherwise derive a stable id from
    // the content so re-imports land on the same record.
    let id = content.id ? String(content.id) : null
    let matchedBy = id ? 'id' : null
    if (!id && Array.isArray(content.tiles) && content.tiles.length === 4) {
      const key = content.tiles.map(L.tileKey).sort().join('|')
      const hit = Object.values(state.records).find((r) => r.system === system && r.content.tiles.map(L.tileKey).sort().join('|') === key)
      if (hit) {
        id = hit.id
        matchedBy = 'tiles'
      } else id = `nl-${sysSlug}-${L.sha(L.titleKey(content.title) + '|' + key).slice(0, 10)}`
    }
    if (!id) id = `nl-${sysSlug}-row${rowNo}-${fileSha.slice(0, 6)}`
    delete content.id
    if (timedIds.has(id)) {
      changes.conflicts.push({ row: rowNo, id, issue: 'this id is already used by the timed library; ids must be unique across both libraries. Not imported.' })
      return
    }
    if (seenInFile.has(id)) {
      changes.conflicts.push({ row: rowNo, id, issue: 'id appears twice in this file. Second copy not imported.' })
      return
    }
    seenInFile.add(id)
    const existing = state.records[id]
    if (existing && existing.system !== system) {
      changes.conflicts.push({ row: rowNo, id, issue: `id already belongs to ${existing.system}. Not imported; rename it or confirm it moved.` })
      return
    }
    const hash = L.contentHash(content)
    const origin = { file: path.basename(file), fileSha: fileSha.slice(0, 12), row: rowNo, importedAt: now }
    if (!existing) {
      state.records[id] = { id, library: 'new', system, content, contentHash: hash, version: 1, origin, history: [] }
      changes.added.push(id)
    } else if (existing.contentHash === hash) {
      changes.unchanged.push(id)
    } else {
      // A title change with few shared tiles under a reused id is unclear.
      const m = L.compare({ ...existing.content, tiles: existing.content.tiles || [] }, { ...content, tiles: content.tiles || [] })
      if (matchedBy === 'id' && m.shared <= 1 && m.titleSim < 0.3) changes.problems.push({ row: rowNo, id, issue: `revision changes the title and tiles almost entirely ("${existing.content.title}" → "${content.title}"). Updated with history; please confirm this is the same connection.` })
      existing.history.push({ version: existing.version, contentHash: existing.contentHash, origin: existing.origin, content: existing.content })
      Object.assign(existing, { content, contentHash: hash, version: existing.version + 1, origin })
      changes.revised.push(id)
    }
  })
  for (const r of Object.values(state.records)) if (r.system === system && !seenInFile.has(r.id)) changes.keptFromEarlier.push(r.id)
  importEntry = { file: path.basename(file), fileSha: fileSha.slice(0, 12), system, importedAt: now, rows: rows.length, added: changes.added.length, revised: changes.revised.length, unchanged: changes.unchanged.length }
  const already = state.imports.some((e) => e.fileSha === importEntry.fileSha && e.system === system)
  if (!already) state.imports.push(importEntry)
}

// ---------------- analysis over the whole staged library ----------------
const records = Object.values(state.records).sort((a, b) => (a.origin.importedAt + a.id < b.origin.importedAt + b.id ? -1 : 1))
const conn = (r) => ({ ...r.content, id: r.id, tiles: r.content.tiles || [] })
const order = new Map(records.map((r, i) => [r.id, i]))
for (const r of records) {
  r.verification = L.verificationOf(r.content.status, statusMap, { id: r.id, contentHash: r.contentHash, revisionReviews })
  r.problems = L.rowProblems(r.content)
  r.difficultyWarnings = L.difficultyWarnings(r.content)
  r.duplicateOf = null
  r.heldFor = []
  r.timedSame = []
  r.timedUncertain = []
}
const within = []
const usable = records.filter((r) => r.problems.length === 0 && r.verification.state !== 'rejected')
for (let i = 0; i < usable.length; i++)
  for (let j = i + 1; j < usable.length; j++) {
    const a = usable[i]
    const b = usable[j]
    const m = L.compare(conn(a), conn(b))
    if (!m.kind) continue
    const decided = decisions[L.pairKey(a.id, b.id)]
    const kind = decided === 'distinct' ? 'overlap' : decided === 'same' ? 'same' : m.kind
    within.push({ a: a.id, b: b.id, kind, decided: decided || null, ...m, sameSystem: a.system === b.system })
    if (kind === 'same' || kind === 'uncertain') {
      // Keep the approved one; if both or neither are approved, keep the earlier import.
      // Keep the approved one; then the one already reserved on a starter board
      // (so a new match never disturbs existing allocations); then the earlier import.
      const onBoard = (r) => Object.values(state.starterBoards || {}).some((bs) => bs.some((x) => x.ids.includes(r.id)))
      const [keep, drop] = a.verification.approved && !b.verification.approved ? [a, b] : b.verification.approved && !a.verification.approved ? [b, a] : onBoard(a) && !onBoard(b) ? [a, b] : onBoard(b) && !onBoard(a) ? [b, a] : order.get(a.id) < order.get(b.id) ? [a, b] : [b, a]
      if (kind === 'same') drop.duplicateOf = drop.duplicateOf || keep.id
      else drop.heldFor.push(keep.id)
    }
  }
// Against the timed library (3 Minutes / Race). The new library wins: a timed
// entry that is the same relationship as an approved new entry is recorded
// for exclusion at activation. Nothing is removed from the timed bank now.
const timedConns = timedBank.map((c) => ({ ...c, tiles: c.tiles || [] }))
for (const r of usable) {
  for (const t of timedConns) {
    const m = L.compare(conn(r), t)
    const decided = decisions[L.pairKey(r.id, t.id)]
    const kind = decided === 'distinct' ? null : decided === 'same' ? 'same' : m.kind
    if (kind === 'same') r.timedSame.push({ id: t.id, title: t.title, shared: m.shared })
    else if (kind === 'uncertain') r.timedUncertain.push({ id: t.id, title: t.title, shared: m.shared, titleSim: m.titleSim })
  }
}

// ---------------- pools ----------------
const eligible = (r) => r.verification.approved && r.problems.length === 0 && !r.duplicateOf && r.heldFor.length === 0
for (const r of records) {
  r.pool = r.verification.state === 'rejected' ? 'excluded' : r.problems.length ? 'needsFix' : r.duplicateOf ? 'duplicate' : r.heldFor.length ? 'held' : !r.verification.approved ? 'review' : 'daily'
  r.starterBoard = null
}
const systemsInLib = [...new Set(records.map((r) => r.system))].sort()
const shortages = {}
for (const sys of systemsInLib) {
  const mine = records.filter((r) => r.system === sys && eligible(r))
  const byId = new Map(mine.map((r) => [r.id, r]))
  for (const r of mine) r.placementNote = (decisionFile.starterAllow || {})[r.id] ? null : L.placementNote(r.content)
  const starterCandidates = mine.filter((r) => !r.placementNote)
  // Starter boards from earlier imports are kept, never reshuffled, and
  // revalidated on every import. A board whose members changed or no longer
  // pass keeps its id and its reservation but is BLOCKED from activation and
  // publication until resolved (fix the content, or decisions.json → boards →
  // "rebuild"). A board with ambiguity flags needs REVIEW: it is cleared by
  // decisions.json → boards → "cleared:<signature>", and the clearance lapses
  // automatically if any member's content changes (the signature changes).
  const kept = []
  for (const b of state.starterBoards[sys] || []) {
    if (boardDecisions[b.id] === 'rebuild') continue
    const block = []
    const members = b.ids.map((id) => state.records[id])
    members.forEach((r, i) => {
      if (!r) block.push(`${b.ids[i]} is no longer in the library`)
      else if (!eligible(r)) block.push(`${r.id} "${r.content.title}" is no longer eligible (${r.pool}${r.verification.outstanding ? ': ' + r.verification.outstanding : ''})`)
    })
    const live = members.filter((r) => r && eligible(r))
    const check = live.length === 4 ? L.boardCheck(live.map(conn)) : { block: [], flags: [] }
    block.push(...check.block)
    const revisedNow = b.ids.filter((id) => changes.revised.includes(id))
    Object.assign(b, boardState(b, members, block, check.flags))
    if (revisedNow.length) b.revalidated = { at: now, afterRevisionOf: revisedNow, result: b.status }
    kept.push(b)
  }
  const taken = new Set(kept.flatMap((b) => b.ids))
  const need = L.STARTER_BOARDS_PER_SYSTEM - kept.length
  const found = need > 0 ? L.buildBoards(starterCandidates.filter((r) => !taken.has(r.id)).map(conn), need, { seed: sys }) : []
  const used = new Set(kept.map((b) => b.n))
  let n = 1
  const fresh = found.map((board) => {
    while (used.has(n)) n++
    used.add(n)
    const ids = [...board].sort((a, b) => L.TIERS.indexOf(a.difficulty) - L.TIERS.indexOf(b.difficulty)).map((c) => c.id)
    const b = { n, id: `${L.slug(sys)}-starter-${n}`, formedAt: now, ids }
    const check = L.boardCheck(board)
    return Object.assign(b, boardState(b, ids.map((id) => state.records[id]), check.block, check.flags))
  })
  const boards = [...kept, ...fresh].sort((a, b) => a.n - b.n)
  state.starterBoards[sys] = boards
  for (const b of boards)
    for (const id of b.ids) {
      const r = byId.get(id)
      if (!r) continue
      r.pool = 'systemsStarter'
      r.starterBoard = b.id
    }
  const passing = boards.filter((b) => b.status !== 'blocked').length
  if (passing < L.STARTER_BOARDS_PER_SYSTEM) {
    const tierCounts = Object.fromEntries(L.TIERS.map((t) => [t, mine.filter((r) => r.content.difficulty === t).length]))
    shortages[sys] = { boards: passing, blocked: boards.length - passing, missing: L.STARTER_BOARDS_PER_SYSTEM - passing, approvedByTier: tierCounts }
  }
}
function boardState(b, members, block, autoFlags) {
  const signature = L.sha(members.map((r) => (r ? r.contentHash : 'missing')).join('|')).slice(0, 8)
  const manual = (manualBoardFlags[b.id] || []).filter((f) => !f.signature || f.signature === signature).map((f) => `${f.text} (raised by ${f.by})`)
  const flags = [...autoFlags, ...manual]
  const decision = boardDecisions[b.id]
  const cleared = typeof decision === 'string' && decision === `cleared:${signature}`
  const staleClear = typeof decision === 'string' && decision.startsWith('cleared:') && !cleared
  const status = block.length ? 'blocked' : flags.length && !cleared ? 'review' : 'ready'
  return {
    difficultyWarnings: members.filter(Boolean).flatMap((r) => (r.difficultyWarnings || []).map((n) => `${r.id} [${r.content.difficulty}]: "${n}"`)),
    signature,
    status,
    publishable: status === 'ready',
    structural: block.length ? 'fail' : 'pass',
    block,
    flags,
    ambiguityReview: flags.length ? (cleared ? 'cleared' : staleClear ? 'needed again (content changed since it was cleared)' : 'needed') : 'none',
    issues: undefined,
  }
}
const dailyPool = records.filter((r) => r.pool === 'daily')
// Capacity check only. Daily boards are rebuilt across ALL systems every time,
// so this system's Daily connections stay free to mix with later subjects.
// No Daily connection is assigned to a board here.
const dailyBoards = L.countDailyBoards(dailyPool.map(conn))
const dailyFlagged = dailyBoards.filter((ids) => L.boardCheck(ids.map((id) => conn(state.records[id]))).flags.length).length
const dailyMixed = dailyBoards.filter((ids) => new Set(ids.map((id) => state.records[id].system)).size > 1).length
const timedExclusions = [...new Map(records.filter(eligible).flatMap((r) => r.timedSame.map((t) => [t.id, { timedId: t.id, timedTitle: t.title, replacedBy: r.id }]))).values()]

// ---------------- write ----------------
for (const r of records) state.records[r.id] = r
state.timedExclusionsAtActivation = timedExclusions
state.pairs = within
const queue = buildQueue({ state, records, within, timedBank, eligible })
state.counts = { all: systemCounts(records, null, eligible), bySystem: Object.fromEntries(systemsInLib.map((x) => [x, systemCounts(records, x, eligible)])) }
state.updatedAt = now
state.active = false // flipped only at activation, when all uploads are in
if (!DRY) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n')
  fs.writeFileSync(DECISIONS, JSON.stringify({ about: 'Your decisions. pairs: key is the two ids joined by " | " (sorted); value "distinct" (different relationships, both stay) or "same" (one relationship). boards: key is a starter board id; value "cleared:<signature>" after an ambiguity review (lapses if any member changes), or "rebuild" to release a blocked board and form a new one.', pairs: decisions, boards: boardDecisions }, null, 2) + '\n')
  fs.writeFileSync(path.join(DIR, 'review-queue.json'), JSON.stringify(queue, null, 1) + '\n')
  fs.writeFileSync(path.join(DIR, 'review-queue.md'), queueMarkdown(queue))
  if (!fs.existsSync(STATUS_MAP_FILE)) fs.writeFileSync(STATUS_MAP_FILE, JSON.stringify({ about: 'Which verification labels count as approved. Labels are matched case-insensitively. A label in none of these lists stays unresolved. Only the project owner changes this.', ...L.DEFAULT_STATUS_MAP }, null, 2) + '\n')
}

// ---------------- report ----------------
const lines = []
const say = (s = '') => lines.push(s)
const count = (f) => records.filter(f).length
const titleOf = (id) => state.records[id]?.content.title || timedBank.find((c) => c.id === id)?.title || id
if (importEntry) {
  const sys = importEntry.system
  const mine = records.filter((r) => r.system === sys)
  const approvedUnique = mine.filter(eligible).length
  say(`# Import: ${sys}`)
  say(`File ${importEntry.file} (${importEntry.rows} rows) · ${DRY ? 'DRY RUN, nothing saved' : 'saved to staging'} · live content unchanged`)
  say()
  const labels = {}
  for (const r of mine) {
    const k = `${r.verification.status ?? '(none)'} → ${r.verification.state}${r.verification.basis ? ` (${r.verification.basis}${r.verification.reviewer ? ', ' + r.verification.reviewer : ''}${r.verification.humanVerified ? '' : ', not human verified'})` : ''}`
    labels[k] = (labels[k] || 0) + 1
  }
  say(`Verification: ${Object.entries(labels).map(([k, v]) => `${v} ${k}`).join(' · ')}${assume ? ` (PROJECTION: assuming ${assume} approved)` : ''}`)
  const heldRev = mine.filter((r) => r.verification.state === 'held')
  for (const r of heldRev) say(`  HELD ${r.id} "${r.content.title}": ${r.verification.outstanding}`)
  say(`Rows: ${changes.added.length} new, ${changes.revised.length} revised, ${changes.unchanged.length} unchanged${changes.keptFromEarlier.length ? `, ${changes.keptFromEarlier.length} from an earlier ${sys} upload not in this file (kept)` : ''}`)
  const c = systemCounts(records, sys, eligible)
  say(`Status: ${c.rows} rows · passed medical review ${c.passedReview} (AI-reviewed ${c.passedReviewAi}, human verified ${c.passedReviewHuman}) · held for medical/source review ${c.heldMedical} · held as possible duplicates ${c.heldDuplicate} · set aside as duplicates ${c.setAsideDuplicate} · usable now ${c.usable}`)
  const b = state.starterBoards[sys] || []
  const cnt = (st) => b.filter((x) => x.status === st).length
  say(`Systems starter boards: ${b.length} of ${L.STARTER_BOARDS_PER_SYSTEM} formed (${b.length * 4} connections reserved) · pass structural checks ${b.length - cnt('blocked')} · ready ${cnt('ready')} · need ambiguity review ${cnt('review')} · blocked ${cnt('blocked')}`)
  for (const x of b) {
    const cs = x.ids.map((id) => state.records[id])
    say(`  ${x.id} · ${x.status.toUpperCase()} · structural ${x.structural} · signature ${x.signature} [${cs.map((r) => r?.content.difficulty || '?').join(', ')}]`)
    for (const r of cs) say(`      ${r ? `${r.id} ${r.content.title}: ${r.content.tiles.join(' / ')}` : '?'}`)
    if (x.revalidated && x.revalidated.at === now) say(`    revalidated after revision of ${x.revalidated.afterRevisionOf.join(', ')}: ${x.revalidated.result}`)
    for (const i of x.block || []) say(`    BLOCK: ${i}`)
    for (const i of x.flags || []) say(`    review: ${i}`)
    for (const i of x.difficultyWarnings || []) say(`    difficulty (separate, does not block): ${i}`)
  }
  if (shortages[sys]) {
    const s = shortages[sys]
    say(`  SHORTAGE: ${s.missing} board(s) short of 5 passing structural checks${s.blocked ? ` (${s.blocked} blocked)` : ''}. Eligible by difficulty: ${L.TIERS.map((t) => `${t} ${s.approvedByTier[t]}`).join(', ')}.`)
  }
  const sysDaily = mine.filter((r) => r.pool === 'daily').length
  say(`Remaining for Daily from ${sys}: ${sysDaily}`)
  const dupHere = mine.filter((r) => r.duplicateOf)
  say(`Duplicates set aside: ${dupHere.length}${dupHere.length ? '' : ''}`)
  for (const r of dupHere) say(`  - ${r.id} "${r.content.title}" = ${r.duplicateOf} "${titleOf(r.duplicateOf)}" (${state.records[r.duplicateOf].system === sys ? 'same system' : 'earlier upload: ' + state.records[r.duplicateOf].system})`)
  const heldHere = mine.filter((r) => r.heldFor.length)
  say(`Possible duplicates held for your decision: ${heldHere.length}`)
  for (const r of heldHere) say(`  - ${r.id} "${r.content.title}" vs ${r.heldFor.map((id) => `${id} "${titleOf(id)}"`).join(', ')}`)
  const cross = within.filter((w) => !w.sameSystem && [w.a, w.b].some((id) => state.records[id].system === sys))
  say(`Cross-system matches with earlier uploads: ${cross.filter((w) => w.kind === 'same').length} same, ${cross.filter((w) => w.kind === 'uncertain').length} unclear (held), ${cross.filter((w) => w.kind === 'overlap').length} shared-concept overlaps (allowed)`)
  for (const w of cross) say(`  - ${w.kind}: ${w.a} "${titleOf(w.a)}" / ${w.b} "${titleOf(w.b)}" (${w.shared}/4 tiles${w.sameSubject ? ', same subject' : ''})`)
  const sameSys = within.filter((w) => w.sameSystem && state.records[w.a].system === sys && w.kind === 'overlap')
  if (sameSys.length) say(`Shared-concept overlaps within ${sys} (allowed, never on one board): ${sameSys.map((w) => `${w.a}/${w.b}`).join(', ')}`)
  const placed = mine.filter((r) => r.placementNote)
  for (const r of placed) say(`Kept out of ${sys} starter boards by reviewer note (stays in Daily): ${r.id} "${r.content.title}": "${r.placementNote}"`)
  const ts = mine.filter((r) => r.timedSame.length)
  const tu = mine.filter((r) => r.timedUncertain.length)
  say(`Overlap with the timed library: ${ts.length} same relationship (timed entry to be excluded at activation), ${tu.length} unclear`)
  for (const r of ts) say(`  - same: ${r.id} "${r.content.title}" = timed ${r.timedSame.map((t) => `${t.id} "${t.title}"`).join(', ')}`)
  for (const r of tu) say(`  - unclear: ${r.id} "${r.content.title}" vs timed ${r.timedUncertain.map((t) => `${t.id} "${t.title}" (${t.shared}/4 tiles)`).join(', ')}`)
  const review = mine.filter((r) => r.pool === 'review')
  const fix = mine.filter((r) => r.pool === 'needsFix')
  const rej = mine.filter((r) => r.pool === 'excluded')
  say(`Not eligible yet (kept, not in any pool): ${review.length}`)
  for (const r of review) say(`  - ${r.id} "${r.content.title}" status ${r.verification.status ?? '(none)'} (${r.verification.state})`)
  say(`Rejected: ${rej.length}`)
  say(`Need a fix before use: ${fix.length}`)
  for (const r of fix) say(`  - ${r.id} "${r.content.title || '(no title)'}": ${r.problems.join('; ')}`)
  for (const c of [...changes.conflicts, ...changes.problems]) say(`  ! row ${c.row}${c.id ? ' ' + c.id : ''}: ${c.issue}`)
  say()
}
say('## Cumulative (staged, not live)')
say('| System | Rows | Passed review | Medical holds | Duplicate holds | Usable now | Starter | Daily |')
say('|---|---|---|---|---|---|---|---|')
for (const x of [...systemsInLib, null]) {
  const c = systemCounts(records, x, eligible)
  say(`| ${x || 'Total'} | ${c.rows} | ${c.passedReview} | ${c.heldMedical} | ${c.heldDuplicate + c.setAsideDuplicate} | ${c.usable} | ${c.starter} | ${c.daily} |`)
}
say(`All passed rows are AI-reviewed (OpenEvidence) unless counted as human verified: ${systemCounts(records, null, eligible).passedReviewHuman} human verified.`)
say(`Review queue: medical holds ${queue.medicalHolds.length} · duplicate decisions ${queue.duplicateDecisions.length} · timed overlaps to decide ${queue.timedOverlaps.filter((x) => x.kind.startsWith('possible')).length} · board ambiguity reviews ${queue.boardReviews.length} · blocked boards ${queue.blockedBoards.length} · difficulty warnings ${queue.difficultyWarnings.length} (content/library/review-queue.md)`)
const allBoards = systemsInLib.flatMap((x) => state.starterBoards[x] || [])
say(`Starter boards: ${systemsInLib.map((x) => `${x} ${(state.starterBoards[x] || []).filter((b) => b.status !== 'blocked').length}/5 passing`).join(', ') || 'none'} · ready ${allBoards.filter((b) => b.status === 'ready').length} · need ambiguity review ${allBoards.filter((b) => b.status === 'review').length} · blocked ${allBoards.filter((b) => b.status === 'blocked').length} · shortages: ${Object.keys(shortages).length ? Object.keys(shortages).join(', ') : 'none'}`)
say(`Daily: ${dailyPool.length} connections, unassigned and shared across all systems · estimate ${Math.floor(dailyPool.length / 4)} boards (${dailyPool.length} ÷ 4) · capacity check formed ${dailyBoards.length} disjoint boards passing structural checks (${dailyFlagged} of them would need ambiguity review; ${dailyMixed} mix systems)`)
say(`Timed entries to exclude at activation: ${timedExclusions.length}`)
const report = lines.join('\n')
console.log(report)
if (!DRY && importEntry) {
  fs.mkdirSync(path.join(DIR, 'reports'), { recursive: true })
  fs.writeFileSync(path.join(DIR, 'reports', `${now.slice(0, 10)}-${L.slug(importEntry.system)}-${importEntry.fileSha}.md`), report + '\n')
}
// Checksum manifest of everything staged, so a saved copy can be verified
// after it is restored (node scripts/library/verify.mjs).
if (!DRY) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  const files = walk(DIR).filter((f) => !f.endsWith('MANIFEST.json')).sort()
  const manifest = {
    about: 'Checksums of the staged new library. Staging only: active is false and nothing in src/ reads these files.',
    active: false,
    savedAt: now,
    systems: systemsInLib,
    counts: state.counts.all,
    files: Object.fromEntries(files.map((f) => [path.relative(DIR, f), L.sha(fs.readFileSync(f).toString('binary'))])),
  }
  fs.writeFileSync(path.join(DIR, 'MANIFEST.json'), JSON.stringify(manifest, null, 1) + '\n')
}
