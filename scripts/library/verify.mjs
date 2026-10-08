#!/usr/bin/env node
// Verifies a saved or restored copy of the staged library against its
// checksum manifest, and that it is still inactive and unread by the app.
//   node scripts/library/verify.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha } from './lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = process.env.PLEXUS_LIBRARY_DIR || path.join(ROOT, 'content/library')
const m = JSON.parse(fs.readFileSync(path.join(DIR, 'MANIFEST.json'), 'utf8'))
let bad = 0
for (const [rel, want] of Object.entries(m.files)) {
  const p = path.join(DIR, rel)
  if (!fs.existsSync(p)) {
    console.log(`MISSING ${rel}`)
    bad++
  } else if (sha(fs.readFileSync(p).toString('binary')) !== want) {
    console.log(`CHANGED ${rel}`)
    bad++
  }
}
const state = JSON.parse(fs.readFileSync(path.join(DIR, 'library.json'), 'utf8'))
if (state.active !== false || m.active !== false) {
  console.log('NOT STAGED: active flag is set')
  bad++
}
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const readers = walk(path.join(ROOT, 'src')).filter((f) => /(from|import)\s*\(?\s*['"][^'"]*(content\/library|library\.json|scripts\/library)/.test(fs.readFileSync(f, 'utf8')))
if (readers.length) {
  console.log(`LIVE APP READS STAGING: ${readers.join(', ')}`)
  bad++
}
const recs = Object.values(state.records)
console.log(`${Object.keys(m.files).length} files · ${recs.length} records · ${recs.reduce((n, r) => n + r.history.length, 0)} prior versions · systems ${m.systems.join(', ')} · saved ${m.savedAt}`)
console.log(bad ? `${bad} PROBLEM(S)` : 'STAGING VERIFIED (staging files intact; the app reads only the generated modules in src/data/library)')
process.exit(bad ? 1 : 0)
