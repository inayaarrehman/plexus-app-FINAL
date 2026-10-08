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
ok(s.starterBoards.Pulmonary.length === 4 && /SHORTAGE: 1 board/.test(out2), '18 eligible connections: 4 boards formed (exact tiers not required), shortage of 1 reported')
ok(s.starterBoards.Pulmonary.every((b) => b.structural === 'pass'), 'every formed board passes structural checks')
ok(L.boardFair(['easy', 'easy', 'easy', 'easy'].map((t, i) => row('same', t, i))), 'an all-one-difficulty board is allowed')
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

// 4b. A revision that breaks a starter board flags it instead of reshuffling.
const board1 = state().starterBoards.Cardiology[0]
const [m0, m1] = board1.ids
const clashTile = state().records[m1].content.tiles[0]
run(write('alpha-v3.json', alpha2.map((r) => (r.id === m0 ? { ...r, tiles: [clashTile, ...r.tiles.slice(1)] } : r))), 'Cardiology')
s = state()
const fb = s.starterBoards.Cardiology[0]
ok(fb.status === 'blocked' && !fb.publishable && fb.block.some((i) => /share the tile/.test(i)) && fb.revalidated.afterRevisionOf.includes(m0), 'a revision that breaks a starter board blocks it from publication')
ok(fb.id === JSON.parse(boardsBefore)[0].id && JSON.stringify(s.starterBoards.Cardiology.map((b) => b.ids)) === JSON.stringify(JSON.parse(boardsBefore).map((b) => b.ids)), 'the blocked board keeps its id and reservation; no reshuffle')
fs.writeFileSync(path.join(lib, 'decisions.json'), JSON.stringify({ pairs: {}, boards: { [fb.id]: 'rebuild' } }))
run(write('alpha-v3.json', alpha2.map((r) => (r.id === m0 ? { ...r, tiles: [clashTile, ...r.tiles.slice(1)] } : r))), 'Cardiology')
s = state()
ok(s.starterBoards.Cardiology.length === 5 && s.starterBoards.Cardiology.every((b) => b.status === 'ready'), 'after you choose rebuild, a valid replacement board is formed')
fs.writeFileSync(path.join(lib, 'decisions.json'), JSON.stringify({ pairs: {}, boards: {} }))

// 4c. Reviewer notes: explicit "do not combine" blocks, other mentions flag.
const chk = (x, y) => L.pairCheck(x, y)
let r1 = chk(row('nb', 'easy', 1, { notes: 'Board overlap: keep separate from nb-medium-1.' }), row('nb', 'medium', 1))
ok(r1.block.length === 1, 'an explicit keep-separate note naming another id blocks the pair')
r1 = chk(row('nb', 'easy', 1, { notes: 'Board overlap with nb-medium-1.' }), row('nb', 'medium', 1))
ok(r1.block.length === 0 && r1.flag.some((f) => /note mentions/.test(f)), 'a note that only mentions another id is flagged, not blocked')
r1 = chk(row('nb', 'easy', 2, { notes: 'Trypsin-like: keep nbmedium2w3 off this board.' }), row('nb', 'medium', 2))
ok(r1.block.length === 1, 'an explicit instruction naming another connection\'s tile blocks the pair')
r1 = chk(row('nb', 'easy', 2, { notes: 'Compare nbmedium2w3 for contrast.' }), row('nb', 'medium', 2))
ok(r1.block.length === 0 && r1.flag.some((f) => /note mentions/.test(f)), 'a tile merely mentioned in a note is flagged')
r1 = chk(row('nb', 'easy', 3, { explanation: 'Unlike nbhard3w2, these are fine.' }), row('nb', 'hard', 3))
ok(r1.block.length === 0 && r1.flag.some((f) => /named in/.test(f)), 'a tile named in another explanation is an ambiguity flag, not a block')
r1 = chk(row('nb', 'easy', 4, { tiles: ['Cu/Zn superoxide dismutase (SOD1)', 'p', 'q', 'r'] }), row('nb', 'hard', 4, { tiles: ['SOD1', 's', 't', 'u'] }))
ok(r1.block.some((x) => /share the tile/.test(x)), 'a tile alias in parentheses counts as the same tile')
r1 = chk(row('nb', 'easy', 5, { title: 'Group one', alternateNames: ['Shared name'] }), row('nb', 'hard', 5, { title: 'Shared name' }))
ok(r1.block.some((x) => /share the name/.test(x)), 'a title that matches another group\'s alternate name blocks the pair')
const gen = L.boardCheck([row('g', 'easy', 1, { notes: 'Avoid additional sugar tiles on the same board.' }), row('g', 'medium', 1), row('g', 'hard', 1), row('g', 'expert', 1)])
ok(gen.block.length === 0 && gen.flags.some((f) => /instruction to check/.test(f)), 'a general avoid-instruction naming no tile is a review flag on the board')

// 4d. Labels: unmapped stays unresolved; AI-review labels carry their basis;
// conditional labels need a determination tied to the exact content.
run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' }), row('lab', 'easy', 2, { status: 'AI_REVIEWED_REVISED' })]), 'GI')
ok(state().records['lab-easy-1'].pool === 'review' && state().records['lab-easy-1'].verification.status === 'AI_REVIEWED_PASS', 'an unmapped label is kept as written and stays unresolved')
let refused = false
try {
  run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' })]), 'GI', ['--assume-approved', 'AI_REVIEWED_PASS'])
} catch {
  refused = true
}
ok(refused, 'a projection without --dry-run is refused')
const proj = run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' }), row('lab', 'easy', 2, { status: 'AI_REVIEWED_REVISED' })]), 'GI', ['--dry-run', '--assume-approved', 'AI_REVIEWED_PASS'])
ok(/PROJECTION/.test(proj) && state().records['lab-easy-1'].pool === 'review', 'a dry-run projection reports but saves nothing')
ok(state().records['lab-easy-1'].content.raw.status === 'AI_REVIEWED_PASS', 'the original row is kept verbatim')
fs.writeFileSync(path.join(lib, 'status-map.json'), JSON.stringify({ ...L.DEFAULT_STATUS_MAP, aiReviewEligible: { labels: ['AI_REVIEWED_PASS'], reviewer: 'Reviewer X' }, aiReviewConditional: { labels: ['AI_REVIEWED_REVISED'], reviewer: 'Reviewer X' } }))
run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' }), row('lab', 'easy', 2, { status: 'AI_REVIEWED_REVISED' })]), 'GI')
let v1 = state().records['lab-easy-1'].verification
ok(v1.approved && v1.basis === 'ai-review' && v1.humanVerified === false && v1.status === 'AI_REVIEWED_PASS', 'an AI-review label is eligible, keeps its label and is never marked human verified')
ok(state().records['lab-easy-2'].verification.state === 'held' && /No determination/.test(state().records['lab-easy-2'].verification.outstanding), 'a revised row without a determination is held')
const h2 = state().records['lab-easy-2'].contentHash
fs.writeFileSync(path.join(lib, 'revision-reviews.json'), JSON.stringify({ rows: { 'lab-easy-2': { endorsedFinalRow: true, outstanding: null, contentHash: h2 } } }))
run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' }), row('lab', 'easy', 2, { status: 'AI_REVIEWED_REVISED' })]), 'GI')
ok(state().records['lab-easy-2'].verification.basis === 'ai-review-revised', 'an endorsed revised row with nothing outstanding becomes eligible')
run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' }), row('lab', 'easy', 2, { status: 'AI_REVIEWED_REVISED', explanation: 'changed again' })]), 'GI')
ok(state().records['lab-easy-2'].verification.state === 'held' && /changed after/.test(state().records['lab-easy-2'].verification.outstanding), 'if the revised row changes again, it is held for a fresh determination')
fs.writeFileSync(path.join(lib, 'revision-reviews.json'), JSON.stringify({ rows: { 'lab-easy-2': { endorsedFinalRow: true, outstanding: 'Source does not support tile 1.' } } }))
run(write('labels.json', [row('lab', 'easy', 1, { status: 'AI_REVIEWED_PASS' }), row('lab', 'easy', 2, { status: 'AI_REVIEWED_REVISED', explanation: 'changed again' })]), 'GI')
ok(state().records['lab-easy-2'].verification.outstanding === 'Source does not support tile 1.', 'an outstanding issue is shown as written')

// 4e. Ambiguity review clearance is tied to the board's content.
const flaggedRows = [row('amb', 'easy', 1, { notes: 'Compare ambmedium1w1.' }), row('amb', 'medium', 1), row('amb', 'hard', 1), row('amb', 'expert', 1)]
run(write('amb.json', flaggedRows), 'Endocrine')
let eb = state().starterBoards.Endocrine[0]
ok(eb.status === 'review' && eb.structural === 'pass' && !eb.publishable, 'a board with an ambiguity flag passes structure but waits for review')
fs.writeFileSync(path.join(lib, 'decisions.json'), JSON.stringify({ pairs: {}, boards: { [eb.id]: `cleared:${eb.signature}` } }))
run(write('amb.json', flaggedRows), 'Endocrine')
ok(state().starterBoards.Endocrine[0].status === 'ready', 'clearing the review with the board signature makes it ready')
run(write('amb.json', flaggedRows.map((r, i) => (i === 2 ? { ...r, explanation: 'revised' } : r))), 'Endocrine')
eb = state().starterBoards.Endocrine[0]
ok(eb.status === 'review' && /again/.test(eb.ambiguityReview), 'a revision after clearance puts the board back into review')
fs.writeFileSync(path.join(lib, 'decisions.json'), JSON.stringify({ pairs: {}, boards: {} }))

// 4f. Matching reworded relationships.
const mk = (title, tiles) => ({ title, tiles })
ok(L.compare(mk('Classic Marfan syndrome associations', ['a1', 'a2', 'a3', 'a4']), mk('Marfan syndrome associations', ['b1', 'b2', 'b3', 'b4'])).kind === 'uncertain', 'same subject with different tiles is flagged')
ok(L.compare(mk('Conditions that can produce restrictive cardiomyopathy', ['a1', 'a2', 'a3', 'a4']), mk('Causes of restrictive cardiomyopathy', ['b1', 'b2', 'b3', 'b4'])).kind === 'uncertain', '"conditions that can produce X" matches "causes of X"')
ok(L.compare(mk('Causes of dilated cardiomyopathy', ['a1', 'a2', 'a3', 'a4']), mk('Dilated cardiomyopathy findings', ['b1', 'b2', 'b3', 'b4'])).kind === null, 'causes and findings of the same disease are different relationships')
ok(L.compare(mk('The four defects in tetralogy of Fallot', ['Pulmonary outflow stenosis', 'Aorta overriding the septum', 'Ventricular septal defect', 'Right ventricular hypertrophy']), mk('Findings in tetralogy of Fallot', ['Pulmonary stenosis', 'Right ventricular hypertrophy', 'Overriding aorta', 'Ventricular septal defect'])).kind === 'uncertain', 'reworded tiles of the same relationship are flagged, never merged automatically')
const e33 = { id: 'E33', title: 'Steroid and electrolyte pattern of 17-alpha-hydroxylase deficiency', tiles: ['Elevated 11-deoxycorticosterone', 'Reduced androgens', 'Hypertension', 'Hypokalemia'], notes: 'Shares 3 tiles with E34 - do not co-place in one board.' }
const e34 = { id: 'E34', title: 'Steroid and electrolyte pattern of 11-beta-hydroxylase deficiency', tiles: ['Elevated 11-deoxycorticosterone', 'Elevated androgens', 'Hypertension', 'Hypokalemia'] }
ok(L.compare(e33, e34).kind === 'overlap' && L.compare(e33, e34).reviewerDistinct, 'connections the reviewer kept apart by id are distinct, not duplicates')
ok(L.compare({ ...e33, notes: '' }, e34).kind === 'uncertain', 'without that note, a 3-tile match is held, not merged')
ok(L.pairCheck(e33, e34).block.length > 0, 'and they never share a board')
ok(L.compare(mk('Systolic murmurs', ['Aortic stenosis', 'Mitral regurgitation', 'Tricuspid regurgitation', 'Hypertrophic cardiomyopathy']), mk('Diastolic murmurs', ['Aortic regurgitation', 'Pulmonic regurgitation', 'Mitral stenosis', 'Tricuspid stenosis'])).kind === null, 'similar vocabulary in a different relationship is not a duplicate')
ok(L.pairCheck({ id: 'x1', title: 'Bacillary angiomatosis clues', tiles: ['p1', 'p2', 'p3', 'p4'], notes: 'Clinically mimics pyogenic granuloma and Kaposi sarcoma.' }, { id: 'x2', title: 'Kaposi sarcoma clues', tiles: ['q1', 'q2', 'q3', 'q4'] }).flag.some((f) => /mentions the subject/.test(f)), 'a note naming another connection\'s subject is an ambiguity flag')
ok(L.isDifficultyNote('Intentionally introductory category; may be too transparent for a Hard puzzle.') && !L.isDifficultyNote('Hard difficulty appropriate.'), 'difficulty-calibration notes are recognised separately')
ok(L.compare(mk('Drugs that disrupt microtubule function', ['Mebendazole', 'Griseofulvin', 'Colchicine', 'Vincristine']), mk('Drugs disrupting microtubule dynamics', ['Colchicine', 'Vincristine', 'Vinblastine', 'Paclitaxel'])).kind === 'uncertain', 'near-identical subjects sharing two tiles are flagged')
ok(L.pairCheck({ id: 'd1', title: 'Down syndrome physical findings', tiles: ['p1', 'p2', 'p3', 'p4'] }, { id: 'd2', title: 'Down syndrome congenital associations', tiles: ['q1', 'q2', 'q3', 'q4'] }).flag.some((f) => /both are about down/.test(f)), 'two connections about the same condition on one board are flagged')
ok(!L.pairCheck({ id: 'c1', title: 'Causes of dilated cardiomyopathy', tiles: ['p1', 'p2', 'p3', 'p4'] }, { id: 'c2', title: 'Conditions that can produce restrictive cardiomyopathy', tiles: ['q1', 'q2', 'q3', 'q4'] }).flag.some((f) => /both are about/.test(f)), 'different conditions sharing a word are not flagged')
ok(L.tileKey('Elevated urinary orotic acid') === L.tileKey('Increased urinary orotic acid') && L.tileKey('Reduced DHT') === L.tileKey('Decreased DHT'), 'direction synonyms (elevated/increased, reduced/decreased) count as the same tile')
ok(L.compare(mk('Vaso-occlusive complications of sickle cell disease', ['Dactylitis', 'Acute chest syndrome', 'Avascular necrosis', 'Stroke']), mk('Sickle-cell vaso-occlusive manifestations', ['Dactylitis', 'Acute chest syndrome', 'Ischemic stroke', 'Priapism'])).kind === 'uncertain', '"complications" and "manifestations" of the same process are flagged')
ok(L.compare({ title: 'PNH diagnostic clues', alternateNames: ['Paroxysmal nocturnal hemoglobinuria'], tiles: ['Acquired PIGA mutation', 'Loss of CD55 and CD59', 'Complement-mediated hemolysis', 'Unusual-site venous thrombosis'] }, { title: 'Clues to paroxysmal nocturnal hemoglobinuria', alternateNames: ['PNH associations'], tiles: ['Loss of CD55 / CD59', 'Coombs-negative hemolysis', 'Hemoglobinuria', 'Hepatic vein thrombosis'] }).kind === 'uncertain', 'an abbreviation in one title meets the full name through accepted alternate names')
ok(L.tileKey('MMR vaccine') === L.tileKey('MMR') && L.tileKey('Alcohol use') === L.tileKey('Alcohol') && L.tileKey('Cushing disease') !== L.tileKey('Cushing syndrome'), 'generic tile suffixes are ignored, but disease and syndrome are not')
ok(L.placementNote({ notes: 'Low relevance here - reserve for embryology content.' }) !== null, 'a "reserve for" note is detected')

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
