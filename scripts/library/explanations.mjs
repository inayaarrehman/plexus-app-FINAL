#!/usr/bin/env node
// ---------------------------------------------------------------------
// Player explanations: a fuller "detail" on each connection and one short
// note per tile, kept in content/library/explanations.json (see lib.mjs,
// "player explanations"). Served only after review, by activate.mjs.
// ---------------------------------------------------------------------
//   node scripts/library/explanations.mjs --status
//   node scripts/library/explanations.mjs restore-legacy
//        notes from the earlier bank for connections with the same four tiles
//   node scripts/library/explanations.mjs add-drafts <drafts.json> [--by "..."]
//        [{ id, detail, tileNotes: [4] }], stored as DRAFT_AI_GENERATED
//   node scripts/library/explanations.mjs export <out.csv> [--ids A,B] [--state draft|all]
//        a review sheet: current connection, the draft text, and empty
//        Verification Status / Reviewer / Notes columns
//   node scripts/library/explanations.mjs import <reviewed.csv|.json> [--dry-run]
//        reads the returned sheet; labels are stored exactly as written
//
// Every run rewrites content/library/explanations-review.md, the readable
// review list (drafts awaiting review, stale entries, what is served).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = process.env.PLEXUS_LIBRARY_DIR || path.join(ROOT, 'content/library')
const FILE = path.join(DIR, 'explanations.json')
const REVIEW_MD = path.join(DIR, 'explanations-review.md')
const readJson = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d)
const now = process.env.PLEXUS_IMPORT_TIME || new Date().toISOString()
const args = process.argv.slice(2)
const flag = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
const DRY = args.includes('--dry-run')

const state = readJson(path.join(DIR, 'library.json'), { records: {} })
const statusMap = { ...L.DEFAULT_STATUS_MAP, ...readJson(path.join(DIR, 'status-map.json'), {}) }
const store = readJson(FILE, {
  about: 'Player explanations kept beside each connection: a fuller explanation (detail) and one note per tile, tied to the exact tiles. Served only when eligible (see scripts/library/lib.mjs). Drafts are never served.',
  schema: 1,
  entries: {},
})
// Tiles as served: a checked revision (content/library/revisions.json)
// replaces the row's tiles while it still matches the row it revised.
const revisionsFile = readJson(path.join(DIR, 'revisions.json'), { entries: {} }).entries || {}
const tilesOf = (id) => {
  const raw = state.records[id]?.content?.tiles || null
  const rv = revisionsFile[id]
  return rv && raw && L.sameTiles(raw, rv.original.tiles) ? rv.revised.tiles : raw
}

function put(id, next, reason) {
  const prev = store.entries[id]
  if (prev) {
    const same = JSON.stringify([prev.detail, prev.tileNotes, prev.status, prev.tiles]) === JSON.stringify([next.detail, next.tileNotes, next.status, next.tiles])
    if (same) return 'unchanged'
    const { history = [], ...rest } = prev
    next.history = [...history, { ...rest, replacedAt: now, reason }]
    next.version = (prev.version || 1) + 1
  } else next.version = 1
  store.entries[id] = next
  return prev ? 'updated' : 'added'
}

// ---------------- CSV ----------------
function parseCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') row.push(cell), (cell = '')
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell), rows.push(row), (row = []), (cell = '')
    } else cell += ch
  }
  if (cell || row.length) row.push(cell), rows.push(row)
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()))
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}
const csvCell = (v) => (/[",\n\r]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''))
const COLS = ['Connection ID', 'Connection Title', 'Tile 1', 'Tile 2', 'Tile 3', 'Tile 4', 'Current Explanation', 'Detailed Explanation', 'Tile 1 Explanation', 'Tile 2 Explanation', 'Tile 3 Explanation', 'Tile 4 Explanation', 'Verification Status', 'Reviewer', 'Notes']
const pick = (row, ...names) => {
  const keys = Object.keys(row)
  for (const n of names) {
    const k = keys.find((x) => x.toLowerCase().replace(/[^a-z0-9]/g, '') === n.toLowerCase().replace(/[^a-z0-9]/g, ''))
    if (k && row[k] !== '') return row[k]
  }
  return ''
}

// ---------------- commands ----------------
const cmd = args.find((a) => !a.startsWith('--') && !Object.values({ by: flag('--by'), ids: flag('--ids'), st: flag('--state') }).includes(a))
const log = []

if (cmd === 'apply-checks') {
  // Independent AI checks (October 2026): revised connections get their
  // checked explanation; drafts that passed the check become AI_CHECKED
  // (fixes applied). Entries already reviewed by OpenEvidence or a person,
  // and legacy notes, are left alone.
  const checks = readJson(path.join(DIR, 'audit/explanation-check.json'), { entries: {} })
  const tally = { revision: 0, draft: 0, skipped: 0 }
  const reviewedElsewhere = (e) => e && e.provenance?.kind !== 'draft' && e.provenance?.kind !== 'ai-check' && e.status !== L.DRAFT_STATUS
  for (const [id, rv] of Object.entries(revisionsFile)) {
    if (!state.records[id]) continue
    if (!L.sameTiles(tilesOf(id), rv.revised.tiles)) { tally.skipped++; continue }
    const r = put(id, { tiles: rv.revised.tiles.slice(), detail: rv.detail, tileNotes: rv.tileNotes, status: L.AI_CHECK_STATUS, reviewer: null, provenance: { kind: 'ai-check', source: 'revision', draftedBy: 'Claude (AI), finalize pass' }, check: { verdict: 'pass', by: rv.review.reviewer, at: rv.review.checkedAt, note: rv.review.note || '' }, updatedAt: now }, 'connection revised (difficulty work); explanation rewritten and checked')
    if (r !== 'unchanged') tally.revision++
  }
  for (const [id, ck] of Object.entries(checks.entries || {})) {
    const e = store.entries[id]
    if (!e || revisionsFile[id] || reviewedElsewhere(e)) { tally.skipped++; continue }
    if (ck.verdict !== 'pass' || !L.sameTiles(e.tiles, ck.checkedTiles) || !L.sameTiles(e.tiles, tilesOf(id))) { tally.skipped++; continue }
    const detail = ck.fixes?.detail || e.detail
    const tileNotes = ck.fixes?.tileNotes || e.tileNotes
    const r = put(id, { tiles: e.tiles.slice(), detail, tileNotes, status: L.AI_CHECK_STATUS, reviewer: null, provenance: { kind: 'ai-check', source: 'draft', draftedBy: e.provenance?.draftedBy || null }, check: { verdict: 'pass', by: checks.reviewer, at: '2026-10-13', fixed: !!ck.fixes }, updatedAt: now }, 'draft passed an independent AI check')
    if (r !== 'unchanged') tally.draft++
  }
  if (!DRY) fs.writeFileSync(FILE, JSON.stringify(store, null, 1) + '\n')
  console.log(JSON.stringify(tally))
} else if (cmd === 'restore-legacy') {
  // Earlier bank connections with tile notes, after content corrections.
  const bank = (await import(path.join(ROOT, 'src/data/connectionBank.js'))).default
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const key = (tiles) => tiles.map(norm).sort().join('|')
  const legacy = new Map(bank.filter((c) => c.status === 'verified' && c.tileExplanations?.length === 4).map((c) => [key(c.tiles), c]))
  for (const [id, r] of Object.entries(state.records)) {
    const tiles = r.content?.tiles
    if (!tiles || r.library !== 'new') continue
    const c = legacy.get(key(tiles))
    if (!c) continue
    // Same relationship only: the titles must agree under the library's own matching.
    const m = L.compare({ title: r.content.title, tiles, alternateNames: r.content.alternateNames }, { title: c.title, tiles: c.tiles })
    if (m.kind !== 'same') {
      log.push(`skip ${id}: same tiles as ${c.id} but a different relationship (${m.kind})`)
      continue
    }
    const notes = tiles.map((t) => c.tileExplanations[c.tiles.findIndex((x) => norm(x) === norm(t))])
    const res = put(id, { tiles, tileNotes: notes, status: 'LEGACY_BANK', reviewer: null, provenance: { kind: 'legacy-bank', source: `connectionBank:${c.id}`, title: c.title, note: 'Tile notes players saw with these same four tiles before the new library; October 2026 AI-assisted bank review, not human verified.' }, updatedAt: now }, 'legacy restore')
    log.push(`${res} ${id} from ${c.id}`)
  }
} else if (cmd === 'add-drafts') {
  const file = args[args.indexOf('add-drafts') + 1]
  const by = flag('--by') || 'AI draft'
  for (const d of readJson(file, [])) {
    const tiles = tilesOf(d.id)
    if (!tiles) {
      log.push(`refused ${d.id}: no such connection`)
      continue
    }
    const prev = store.entries[d.id]
    if (prev && L.explanationEligibility(prev, tiles, statusMap).eligible) {
      log.push(`kept ${d.id}: it already has a served explanation; drafts never replace it`)
      continue
    }
    const entry = { tiles, detail: d.detail, tileNotes: d.tileNotes, status: L.DRAFT_STATUS, reviewer: null, provenance: { kind: 'draft', draftedBy: by, draftedAt: now }, updatedAt: now }
    const p = L.explanationProblems(entry, tiles)
    if (p.length) {
      log.push(`refused ${d.id}: ${p.join('; ')}`)
      continue
    }
    log.push(`${put(d.id, entry, 'new draft')} ${d.id} (draft)`)
  }
} else if (cmd === 'export') {
  const out = args[args.indexOf('export') + 1]
  const ids = flag('--ids') ? flag('--ids').split(',') : null
  const want = flag('--state') || 'draft'
  const rows = [COLS.join(',')]
  for (const [id, e] of Object.entries(store.entries)) {
    if (ids && !ids.includes(id)) continue
    const tiles = tilesOf(id)
    const el = L.explanationEligibility(e, tiles, statusMap)
    if (want !== 'all' && el.state !== want) continue
    const c = state.records[id].content
    rows.push([id, c.title, ...tiles, c.explanation, e.detail || '', ...(e.tileNotes || ['', '', '', '']), '', '', ''].map(csvCell).join(','))
  }
  fs.writeFileSync(out, rows.join('\n') + '\n')
  log.push(`wrote ${rows.length - 1} rows to ${out}`)
} else if (cmd === 'import') {
  const file = args[args.indexOf('import') + 1]
  const rows = file.endsWith('.json') ? readJson(file, []) : parseCsv(fs.readFileSync(file, 'utf8'))
  for (const row of rows) {
    const id = row.id || pick(row, 'Connection ID', 'id')
    const tiles = tilesOf(id)
    if (!tiles) {
      log.push(`refused ${id || '(no id)'}: no such connection`)
      continue
    }
    const sheetTiles = row.tiles || [1, 2, 3, 4].map((n) => pick(row, `Tile ${n}`))
    if (sheetTiles.some(Boolean) && !L.sameTiles(sheetTiles, tiles)) {
      log.push(`refused ${id}: the sheet's tiles do not match the connection's current tiles`)
      continue
    }
    const detail = row.detail ?? pick(row, 'Detailed Explanation', 'Connection Detail', 'Full Explanation')
    const tileNotes = row.tileNotes || [1, 2, 3, 4].map((n) => pick(row, `Tile ${n} Explanation`, `Tile ${n} Why`, `Explanation ${n}`))
    const status = row.status ?? pick(row, 'Verification Status', 'Status')
    if (!status) {
      log.push(`refused ${id}: no verification status (left as it was)`)
      continue
    }
    const prev = store.entries[id]
    const entry = {
      tiles,
      detail: detail || undefined,
      tileNotes: tileNotes.some(Boolean) ? tileNotes : undefined,
      status,
      reviewer: row.reviewer ?? (pick(row, 'Reviewer') || null),
      reviewNotes: row.notes ?? (pick(row, 'Notes') || undefined),
      provenance: { ...(prev?.provenance || { kind: 'import' }), reviewedFile: path.basename(file), reviewedAt: now },
      updatedAt: now,
    }
    const p = L.explanationProblems(entry, tiles)
    if (p.length) {
      log.push(`refused ${id}: ${p.join('; ')}`)
      continue
    }
    log.push(`${put(id, entry, `review import ${path.basename(file)}`)} ${id} (${status} → ${L.explanationEligibility(entry, tiles, statusMap).state})`)
  }
} else if (cmd && !args.includes('--status')) {
  console.error(`Unknown command ${cmd}. See the top of this file.`)
  process.exit(2)
}

// ---------------- report and save ----------------
const counts = {}
const lines = []
const served = []
for (const [id, e] of Object.entries(store.entries).sort()) {
  const r = state.records[id]
  const el = L.explanationEligibility(e, tilesOf(id), statusMap)
  counts[el.state] = (counts[el.state] || 0) + 1
  if (el.eligible) served.push(id)
  else {
    lines.push(`### ${id}: ${r?.content?.title || '(missing connection)'}`, `State: **${el.state}**${el.problems.length ? ` (${el.problems.join('; ')})` : ''} · status \`${e.status}\``, '')
    if (r) lines.push(`Current explanation: ${r.content.explanation}`, '')
    if (e.detail) lines.push(`**Detail (draft):** ${e.detail}`, '')
    if (e.tileNotes) (tilesOf(id) || e.tiles).forEach((t, i) => lines.push(`- **${t}:** ${e.tileNotes[i] || ''}`))
    if (e.reviewNotes) lines.push('', `Reviewer notes: ${e.reviewNotes}`)
    lines.push('')
  }
}
const md = [
  '# Player explanations: review list',
  '',
  'Fuller connection explanations and per-tile notes. Only eligible entries are served (by `activate.mjs`); drafts and stale entries never reach players. To review: `node scripts/library/explanations.mjs export review.csv`, send the sheet through the usual review, fill **Verification Status** (and Reviewer / Notes), then `import` it and re-run `activate.mjs`.',
  '',
  `Counts: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'}`,
  '',
  `Served (${served.length}): ${served.join(', ') || 'none'}`,
  '',
  '## Waiting for review or a fix',
  '',
  ...lines,
].join('\n')
if (!DRY) {
  fs.writeFileSync(FILE, JSON.stringify(store, null, 1) + '\n')
  fs.writeFileSync(REVIEW_MD, md + '\n')
}
console.log([...log, `explanations: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}${DRY ? ' (dry run, nothing saved)' : ''}`].join('\n'))
