// Checks for the staging importer, using placeholder (non-medical) rows in a
// temporary folder. Never touches content/library.
//   node scripts/library/test.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plexus-lib-'))
const lib = path.join(tmp, 'lib')
let fails = 0
let n = 0
const ok = (c, m) => {
  n++
  if (!c) fails++
  console.log(`  ${c ? 'ok  ' : 'FAIL'} - ${m}`)
}
const run = (file, system, extra = []) =>
  execFileSync('node', [path.join(HERE, 'import.mjs'), file, '--system', system, ...extra], { env: { ...process.env, PLEXUS_LIBRARY_DIR: lib, PLEXUS_IMPORT_TIME: '2026-10-07T12:00:00Z' }, encoding: 'utf8' })
const state = () => JSON.parse(fs.readFileSync(path.join(lib, 'library.json'), 'utf8'))
const TIERS = L.TIERS
// Placeholder rows: system X, tier T, number i. Tiles are unique strings.
const row = (sys, t, i, extra = {}) => ({ id: `${sys}-${t}-${i}`, title: `${sys} group ${t} ${i}`, tiles: [1, 2, 3, 4].map((k) => `${sys}${t}${i}w${k}`), difficulty: t, explanation: 'Placeholder.', tileExplanations: ['a', 'b', 'c', 'd'], remember: 'r', tags: [`${sys}-${t}-${i}`], status: 'approved', sources: [{ title: 'S' }], qualifiers: 'q', ...extra })
const write = (name, rows) => {
  const p = path.join(tmp, name)
  fs.writeFileSync(p, JSON.stringify(rows))
  return p
}

// 1. A system with 7 per tier: 5 starter boards, 8 left for Daily.
const alpha = TIERS.flatMap((t) => [1, 2, 3, 4, 5, 6, 7].map((i) => row('alpha', t, i)))
const f1 = write('alpha.json', alpha)
console.log('\n[library import]')
run(f1, 'Cardiology')
let s = state()
const recs = Object.values(s.records)
ok(recs.length === 28, '28 rows imported')
ok(s.starterBoards.Cardiology.length === 5 && recs.filter((r) => r.pool === 'systemsStarter').length === 20, '5 starter boards reserve 20 connections')
ok(recs.filter((r) => r.pool === 'daily').length === 8, 'the other 8 go to Daily')
ok(s.starterBoards.Cardiology.every((b) => L.boardFair(b.ids.map((id) => ({ ...s.records[id].content, id })))), 'every starter board is fair (one per tier, no shared tiles)')
ok(recs.every((r) => r.content.sources && r.content.qualifiers && r.content.tileExplanations.length === 4 && r.verification.status === 'approved'), 'sources, qualifiers, tile explanations and status preserved')
ok(s.active === false, 'staged library is not active')
const boardsBefore = JSON.stringify(s.starterBoards.Cardiology)

// 2. Idempotent: the same file again changes nothing.
const before = fs.readFileSync(path.join(lib, 'library.json'), 'utf8')
run(f1, 'Cardiology')
ok(fs.readFileSync(path.join(lib, 'library.json'), 'utf8') === before, 're-importing the same file changes nothing')

// 3. Second system: earlier system untouched; shortages reported without inventing.
const beta = [...['easy', 'medium', 'hard'].flatMap((t) => [1, 2, 3, 4, 5].map((i) => row('beta', t, i))), ...[1, 2, 3].map((i) => row('beta', 'expert', i))]
// a duplicate of an alpha connection (different id, wording, tile order)
beta.push({ ...row('alpha', 'easy', 6), id: 'beta-copy', title: 'Alpha group, easy 6', tiles: [...row('alpha', 'easy', 6).tiles].reverse() })
// an unresolved entry
beta.push(row('beta', 'easy', 9, { status: 'needs_review' }))
// a broken entry
beta.push({ ...row('beta', 'medium', 9), tiles: ['x', 'y', 'z'] })
const out2 = run(write('beta.json', beta), 'Pulmonary')
s = state()
ok(Object.values(s.records).filter((r) => r.system === 'Cardiology').length === 28 && JSON.stringify(s.starterBoards.Cardiology) === boardsBefore, 'the earlier system and its starter boards are unchanged')
ok(s.starterBoards.Pulmonary.length === 3 && /SHORTAGE: 2 board/.test(out2), 'only 3 expert connections: 3 boards formed, shortage of 2 reported')
ok(s.records['beta-copy'].pool === 'duplicate' && s.records['beta-copy'].duplicateOf === 'alpha-easy-6', 'a reworded, reordered copy of an earlier upload is a duplicate, not new')
ok(s.records['beta-easy-9'].pool === 'review' && !s.records['beta-easy-9'].verification.approved, 'an unresolved entry stays unapproved and out of every pool')
ok(s.records['beta-medium-9'].pool === 'needsFix', 'a malformed entry is reported, not repaired')

// 4. Revised file: version history, starter boards kept.
const alpha2 = alpha.map((r) => (r.id === 'alpha-easy-7' ? { ...r, explanation: 'Placeholder, revised.' } : r))
run(write('alpha-v2.json', alpha2), 'Cardiology')
s = state()
const rv = s.records['alpha-easy-7']
ok(rv.version === 2 && rv.history.length === 1 && rv.history[0].content.explanation === 'Placeholder.' && rv.content.explanation === 'Placeholder, revised.', 'a revised row keeps its id, bumps its version and keeps the old version')
ok(JSON.stringify(s.starterBoards.Cardiology) === boardsBefore, 'a revision does not reshuffle starter boards')

// 5. Rows without ids get stable ids; re-import matches them.
const noId = TIERS.map((t) => {
  const r = row('gamma', t, 1)
  delete r.id
  return r
})
run(write('gamma.json', noId), 'Renal')
const ids1 = Object.keys(state().records).filter((k) => k.startsWith('nl-renal-')).sort()
run(write('gamma-again.json', noId.map((r) => ({ ...r, explanation: 'changed' }))), 'Renal')
const ids2 = Object.keys(state().records).filter((k) => k.startsWith('nl-renal-')).sort()
ok(ids1.length === 4 && JSON.stringify(ids1) === JSON.stringify(ids2) && state().records[ids1[0]].version === 2, 'rows without ids get stable ids and later revisions match them')

// 6. Uncertain matches are held, and a decision releases them.
run(write('delta.json', [{ ...row('delta', 'hard', 1), tiles: [...row('alpha', 'hard', 7).tiles.slice(0, 3), 'deltaNew'], title: 'Something else entirely' }]), 'Neurology')
s = state()
ok(s.records['delta-hard-1'].pool === 'held', 'a 3-of-4 tile match with a different title is held for a decision')
fs.writeFileSync(path.join(lib, 'decisions.json'), JSON.stringify({ pairs: { [L.pairKey('delta-hard-1', 'alpha-hard-7')]: 'distinct' } }))
run(write('delta.json', [{ ...row('delta', 'hard', 1), tiles: [...row('alpha', 'hard', 7).tiles.slice(0, 3), 'deltaNew'], title: 'Something else entirely' }]), 'Neurology')
ok(state().records['delta-hard-1'].pool === 'daily', 'marking the pair distinct releases it')

// 7. Ids already used by the timed library are refused.
const o = run(write('clash.json', [{ ...row('eps', 'easy', 1), id: 'bank-easy-01' }]), 'GI')
ok(!state().records['bank-easy-01'] && /already used by the timed library/.test(o), 'an id that clashes with the timed library is refused')

// 8. CSV with tile columns.
const csv = 'ID,Title,Tile 1,Tile 2,Tile 3,Tile 4,Difficulty,Explanation,Status,Source,Qualifier\n' + 'csv-1,"Csv group, one",c1,c2,c3,c4,Easy,"Placeholder, with comma",Approved,Ref A,Only in adults\n'
fs.writeFileSync(path.join(tmp, 'x.csv'), csv)
run(path.join(tmp, 'x.csv'), 'MSK')
const c1 = state().records['csv-1']
ok(c1 && c1.content.tiles.join() === 'c1,c2,c3,c4' && c1.content.title === 'Csv group, one' && c1.content.sources === 'Ref A' && c1.content.qualifiers === 'Only in adults' && c1.verification.approved, 'CSV rows map tiles, quoted commas, sources and qualifiers')

// 9. Dry run saves nothing.
const snap = fs.readFileSync(path.join(lib, 'library.json'), 'utf8')
run(write('dry.json', [row('zeta', 'easy', 1)]), 'GI', ['--dry-run'])
ok(fs.readFileSync(path.join(lib, 'library.json'), 'utf8') === snap, 'dry run saves nothing')

// 10. Nothing in src/ reads the staged library.
const ROOT = path.resolve(HERE, '../..')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
ok(!walk(path.join(ROOT, 'src')).some((f) => /content\/library|library\.json|scripts\/library/.test(fs.readFileSync(f, 'utf8'))), 'the app does not read the staged library yet')

fs.rmSync(tmp, { recursive: true, force: true })
console.log(`\n${fails ? fails + ' LIBRARY CHECK(S) FAILED' : 'ALL ' + n + ' LIBRARY CHECKS PASSED'}`)
process.exit(fails ? 1 : 0)
