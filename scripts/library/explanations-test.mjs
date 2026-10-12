// Player explanations: drafts are never served, a reviewed sheet makes an
// entry eligible, stale or mismatched rows are refused, and served fields
// never change boards. Runs on a temporary copy of content/library.
//   node scripts/library/explanations-test.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plexus-expl-'))
for (const f of ['library.json', 'status-map.json']) fs.copyFileSync(path.join(ROOT, 'content/library', f), path.join(tmp, f))
const run = (...a) => execFileSync('node', [path.join(ROOT, 'scripts/library/explanations.mjs'), ...a], { env: { ...process.env, PLEXUS_LIBRARY_DIR: tmp, PLEXUS_IMPORT_TIME: '2026-10-11T00:00:00Z' }, encoding: 'utf8' })
const store = () => JSON.parse(fs.readFileSync(path.join(tmp, 'explanations.json'), 'utf8')).entries
const map = { ...L.DEFAULT_STATUS_MAP, ...JSON.parse(fs.readFileSync(path.join(tmp, 'status-map.json'), 'utf8')) }
const state = JSON.parse(fs.readFileSync(path.join(tmp, 'library.json'), 'utf8'))
let failed = 0, passed = 0
const ok = (c, m) => (c ? passed++ : (failed++, console.log('  FAIL -', m)))

const id = 'PLX-HEM-016'
const tiles = state.records[id].content.tiles
const notes = tiles.map((t) => `${t}: a short test note about this tile.`)
fs.writeFileSync(path.join(tmp, 'd.json'), JSON.stringify([{ id, detail: 'A test detail paragraph.', tileNotes: notes }, { id: 'NOPE-1', detail: 'x', tileNotes: notes }, { id: 'CARD-052', detail: 'x', tileNotes: ['only one'] }]))
const out = run('add-drafts', path.join(tmp, 'd.json'), '--by', 'test')
ok(/added PLX-HEM-016 \(draft\)/.test(out) && /refused NOPE-1: no such connection/.test(out) && /refused CARD-052: tile notes must be 4/.test(out), 'drafts: stored, unknown ids and wrong note counts refused')
ok(store()[id].status === L.DRAFT_STATUS && L.servedExplanation(store()[id], tiles, map) === null, 'a draft is never served')

run('export', path.join(tmp, 'sheet.csv'))
const sheet = fs.readFileSync(path.join(tmp, 'sheet.csv'), 'utf8')
ok(sheet.split('\n')[0].includes('Tile 1 Explanation') && sheet.includes(id), 'export writes a review sheet with the draft')
// The reviewer returns it marked AI_REVIEWED_PASS.
fs.writeFileSync(path.join(tmp, 'back.json'), JSON.stringify([{ id, tiles, detail: 'A test detail paragraph.', tileNotes: notes, status: 'AI_REVIEWED_PASS', reviewer: 'OpenEvidence' }]))
ok(/updated PLX-HEM-016 \(AI_REVIEWED_PASS → eligible\)/.test(run('import', path.join(tmp, 'back.json'))), 'a reviewed row becomes eligible')
const served = L.servedExplanation(store()[id], tiles, map)
ok(served && served.tileNotes.length === 4 && served.explanationReview.basis === 'ai-review' && served.explanationReview.humanVerified === false, 'served with its basis, never as human verified')
ok(store()[id].history.length === 1 && store()[id].version === 2, 'the draft is kept in history')

fs.writeFileSync(path.join(tmp, 'bad.json'), JSON.stringify([{ id, tiles: ['a', 'b', 'c', 'd'], tileNotes: notes, status: 'AI_REVIEWED_PASS' }, { id, tileNotes: notes }]))
const bad = run('import', path.join(tmp, 'bad.json'))
ok(/do not match the connection's current tiles/.test(bad) && /no verification status/.test(bad), "a sheet with other tiles, or without a status, is refused")
ok(L.explanationEligibility({ ...store()[id], tiles: [...tiles].reverse() }, tiles, map).state === 'stale', 'an entry written for other tiles is stale and not served')
ok(L.explanationEligibility({ ...store()[id], status: 'rejected' }, tiles, map).eligible === false, 'a rejected entry is not served')
ok(fs.readFileSync(path.join(tmp, 'explanations-review.md'), 'utf8').includes('Served (1): PLX-HEM-016'), 'the review list says what is served')

// The live data: drafts are present but none is served.
const live = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/library/explanations.json'), 'utf8')).entries
const lib = (await import(path.join(ROOT, 'src/data/library/newLibrary.js'))).default
const servedLive = Object.values(lib.connections).filter((c) => c.tileNotes || c.detail)
ok(servedLive.every((c) => live[c.id] && L.explanationEligibility(live[c.id], c.tiles, map).eligible), 'every explanation in the app is eligible in the explanations file')
ok(Object.entries(live).filter(([, e]) => e.status === L.DRAFT_STATUS).every(([k]) => !lib.connections[k]?.tileNotes), 'no draft reaches the app')
ok(servedLive.every((c) => c.tileNotes.length === 4), 'served tile notes always come in fours')
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`\n${failed ? `${failed} FAILED` : 'ALL EXPLANATION CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
