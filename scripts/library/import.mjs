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
const file = args.find((a, i) => !a.startsWith('--') && !['--system'].includes(args[i - 1]))
const system = flag('--system')
const now = process.env.PLEXUS_IMPORT_TIME || new Date().toISOString()

const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback)
const state = readJson(STATE, { schema: 1, records: {}, starterBoards: {}, imports: [] })
const decisions = readJson(DECISIONS, { pairs: {} }).pairs || {}

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
  r.verification = L.verificationOf(r.content.status)
  r.problems = L.rowProblems(r.content)
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
      const [keep, drop] = a.verification.approved && !b.verification.approved ? [a, b] : b.verification.approved && !a.verification.approved ? [b, a] : order.get(a.id) < order.get(b.id) ? [a, b] : [b, a]
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
  // Keep starter boards from earlier imports when they are still valid, so a
  // later upload never reshuffles a system's starter set.
  const kept = []
  for (const b of state.starterBoards[sys] || []) {
    const members = b.ids.map((id) => byId.get(id))
    if (members.every(Boolean) && L.boardFair(members.map(conn))) kept.push(b)
  }
  const taken = new Set(kept.flatMap((b) => b.ids))
  const need = L.STARTER_BOARDS_PER_SYSTEM - kept.length
  const found = need > 0 ? L.findDisjointBoards(mine.filter((r) => !taken.has(r.id)).map(conn), need, { seed: sys }) : []
  const used = new Set(kept.map((b) => b.n))
  let n = 1
  const fresh = found.map((board) => {
    while (used.has(n)) n++
    used.add(n)
    return { n, id: `${L.slug(sys)}-starter-${n}`, ids: [...board].sort((a, b) => L.TIERS.indexOf(a.difficulty) - L.TIERS.indexOf(b.difficulty)).map((c) => c.id) }
  })
  const boards = [...kept, ...fresh].sort((a, b) => a.n - b.n)
  state.starterBoards[sys] = boards
  for (const b of boards)
    for (const id of b.ids) {
      const r = byId.get(id)
      r.pool = 'systemsStarter'
      r.starterBoard = b.id
    }
  if (boards.length < L.STARTER_BOARDS_PER_SYSTEM) {
    const tierCounts = Object.fromEntries(L.TIERS.map((t) => [t, mine.filter((r) => r.content.difficulty === t).length]))
    shortages[sys] = { boards: boards.length, missing: L.STARTER_BOARDS_PER_SYSTEM - boards.length, approvedByTier: tierCounts }
  }
}
const dailyPool = records.filter((r) => r.pool === 'daily')
const dailyBoards = L.countDailyBoards(dailyPool.map(conn))
const timedExclusions = [...new Map(records.filter(eligible).flatMap((r) => r.timedSame.map((t) => [t.id, { timedId: t.id, timedTitle: t.title, replacedBy: r.id }]))).values()]

// ---------------- write ----------------
for (const r of records) state.records[r.id] = r
state.timedExclusionsAtActivation = timedExclusions
state.updatedAt = now
state.active = false // flipped only at activation, when all uploads are in
if (!DRY) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n')
  if (!fs.existsSync(DECISIONS)) fs.writeFileSync(DECISIONS, JSON.stringify({ about: 'Decide flagged pairs here. Key: the two ids joined by " | " (sorted). Value: "distinct" (different relationships, both stay) or "same" (one relationship).', pairs: {} }, null, 2) + '\n')
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
  say(`Rows: ${changes.added.length} new, ${changes.revised.length} revised, ${changes.unchanged.length} unchanged${changes.keptFromEarlier.length ? `, ${changes.keptFromEarlier.length} from an earlier ${sys} upload not in this file (kept)` : ''}`)
  say(`Unique approved connections: ${approvedUnique} (of ${mine.length} ${sys} records)`)
  const b = state.starterBoards[sys] || []
  say(`Systems starter boards: ${b.length} of ${L.STARTER_BOARDS_PER_SYSTEM} formed (${b.length * 4} connections reserved)`)
  if (shortages[sys]) {
    const s = shortages[sys]
    say(`  SHORTAGE: ${s.missing} board(s) short. Approved by difficulty: ${L.TIERS.map((t) => `${t} ${s.approvedByTier[t]}`).join(', ')}. Each board needs one of each, with no shared tiles or overlapping concepts.`)
  }
  const sysDaily = mine.filter((r) => r.pool === 'daily').length
  say(`Remaining for Daily from ${sys}: ${sysDaily}`)
  const dupHere = mine.filter((r) => r.duplicateOf)
  say(`Duplicates set aside: ${dupHere.length}${dupHere.length ? '' : ''}`)
  for (const r of dupHere) say(`  - ${r.id} "${r.content.title}" = ${r.duplicateOf} "${titleOf(r.duplicateOf)}" (${state.records[r.duplicateOf].system === sys ? 'same system' : 'earlier upload: ' + state.records[r.duplicateOf].system})`)
  const heldHere = mine.filter((r) => r.heldFor.length)
  say(`Possible duplicates held for your decision: ${heldHere.length}`)
  for (const r of heldHere) say(`  - ${r.id} "${r.content.title}" vs ${r.heldFor.map((id) => `${id} "${titleOf(id)}"`).join(', ')}`)
  const ts = mine.filter((r) => r.timedSame.length)
  const tu = mine.filter((r) => r.timedUncertain.length)
  say(`Overlap with the timed library: ${ts.length} same relationship (timed entry to be excluded at activation), ${tu.length} unclear`)
  for (const r of ts) say(`  - same: ${r.id} "${r.content.title}" = timed ${r.timedSame.map((t) => `${t.id} "${t.title}"`).join(', ')}`)
  for (const r of tu) say(`  - unclear: ${r.id} "${r.content.title}" vs timed ${r.timedUncertain.map((t) => `${t.id} "${t.title}" (${t.shared}/4 tiles)`).join(', ')}`)
  const review = mine.filter((r) => r.pool === 'review')
  const fix = mine.filter((r) => r.pool === 'needsFix')
  const rej = mine.filter((r) => r.pool === 'excluded')
  say(`Not approved (kept, not in any pool): ${review.length}${review.length ? ' · statuses: ' + [...new Set(review.map((r) => r.verification.status ?? '(none)'))].join(', ') : ''}`)
  for (const r of review) say(`  - ${r.id} "${r.content.title}" status ${r.verification.status ?? '(none)'}`)
  say(`Rejected: ${rej.length}`)
  say(`Need a fix before use: ${fix.length}`)
  for (const r of fix) say(`  - ${r.id} "${r.content.title || '(no title)'}": ${r.problems.join('; ')}`)
  for (const c of [...changes.conflicts, ...changes.problems]) say(`  ! row ${c.row}${c.id ? ' ' + c.id : ''}: ${c.issue}`)
  say()
}
say('## Cumulative (staged, not live)')
say(`Systems imported: ${systemsInLib.length ? systemsInLib.join(', ') : 'none yet'}`)
say(`Records ${records.length} · approved and unique ${count(eligible)} · Systems starter ${count((r) => r.pool === 'systemsStarter')} · Daily ${dailyPool.length}`)
say(`Held ${count((r) => r.pool === 'held')} · duplicates ${count((r) => r.pool === 'duplicate')} · not approved ${count((r) => r.pool === 'review')} · need a fix ${count((r) => r.pool === 'needsFix')} · rejected ${count((r) => r.pool === 'excluded')}`)
say(`Starter shortages: ${Object.keys(shortages).length ? Object.entries(shortages).map(([s, v]) => `${s} ${v.boards}/5`).join(', ') : 'none'}`)
say(`Daily capacity: estimate ${Math.floor(dailyPool.length / 4)} boards (${dailyPool.length} ÷ 4) · actually formed and checked ${dailyBoards.length} disjoint boards`)
say(`Timed entries to exclude at activation: ${timedExclusions.length}`)
const report = lines.join('\n')
console.log(report)
if (!DRY && importEntry) {
  fs.mkdirSync(path.join(DIR, 'reports'), { recursive: true })
  fs.writeFileSync(path.join(DIR, 'reports', `${now.slice(0, 10)}-${L.slug(importEntry.system)}-${importEntry.fileSha}.md`), report + '\n')
}
