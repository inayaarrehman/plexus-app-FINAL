#!/usr/bin/env node
// Records the existing bank as the timed library (3 Minutes and Race only).
//   node scripts/library/timed-snapshot.mjs
// Writes content/timed/manifest.json: every entry with its actual status and
// any flags. Changes nothing in the bank and nothing players see.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bank from '../../src/data/connectionBank.js'
import * as L from './lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(ROOT, 'content/timed/manifest.json')

const entries = bank.map((c) => ({ id: c.id, title: c.title, status: c.status, difficulty: c.difficulty, primarySystem: c.primarySystem || c.systems?.[0] || null, flags: [] }))
const byId = new Map(entries.map((e) => [e.id, e]))
for (const c of bank) if (c.status !== 'verified') byId.get(c.id).flags.push({ flag: 'needs_review', note: c.notes || `status is ${c.status}` })
// The read-only content audit (October 2026) judged these by hand. The
// automatic matcher is stricter about calling two entries "the same": it
// needs three or four shared tiles. Same-title entries built from different
// example tiles are therefore "unclear" to the matcher but were judged the
// same relationship in the audit. Both views are kept.
const AUDIT_SAME = [
  ['bank-easy-12', 'bank-migrated-sys-pulm-0001-L1'],
  ['bank-easy-15', 'bank-migrated-sys-mixed-0003-L1'],
  ['bank-medium-08', 'bank-migrated-sys-cardio-0001-L1'],
  ['bank-medium-09', 'bank-migrated-sys-cardio-0001-L2'],
  ['bank-easy-08', 'bank-migrated-sys-renal-0003-L2'],
  ['bank-easy-11', 'bank-migrated-sys-pulm-0001-L2'],
  ['bank-medium-10', 'bank-migrated-sys-cardio-0002-L4'],
  ['bank-medium-14', 'bank-migrated-sys-renal-0001-L3'],
  ['bank-easy-05', 'bank-ext-103'],
].map(([a, b]) => L.pairKey(a, b))
const AUDIT_DISTINCT = [
  ['bank-medium-11', 'bank-migrated-sys-cardio-0002-L2'],
  ['bank-migrated-sys-renal-0001-L3', 'bank-migrated-sys-renal-0003-L2'],
].map(([a, b]) => L.pairKey(a, b))
const auditOf = (a, b) => (AUDIT_SAME.includes(L.pairKey(a, b)) ? 'same relationship' : AUDIT_DISTINCT.includes(L.pairKey(a, b)) ? 'different relationships, heavy overlap' : null)
const pairs = []
for (let i = 0; i < bank.length; i++)
  for (let j = i + 1; j < bank.length; j++) {
    const m = L.compare(bank[i], bank[j])
    if (m.kind === 'same' || m.kind === 'uncertain') {
      pairs.push({ a: bank[i].id, b: bank[j].id, kind: m.kind, audit: auditOf(bank[i].id, bank[j].id), shared: m.shared, titleSim: m.titleSim })
      byId.get(bank[j].id).flags.push({ flag: m.kind === 'same' ? 'same_relationship_as' : 'possible_duplicate_of', other: bank[i].id })
    }
  }
const manifest = {
  about: 'The existing bank, kept as the timed library for 3 Minutes and Race. New uploads never go here. Statuses are as recorded in the bank. Flags are for review only; nothing has been removed.',
  library: 'timed',
  modes: ['challenge', 'race'],
  generatedFrom: 'src/data/connectionBank.js (with contentCorrections applied)',
  counts: { entries: entries.length, verified: entries.filter((e) => e.status === 'verified').length, needsReview: entries.filter((e) => e.status === 'needs_review').length, other: entries.filter((e) => !['verified', 'needs_review'].includes(e.status)).length, sameRelationshipPairs: pairs.filter((p) => p.kind === 'same').length, possibleDuplicatePairs: pairs.filter((p) => p.kind === 'uncertain').length, auditSamePairs: pairs.filter((p) => p.audit === 'same relationship').length, auditDistinctOverlapPairs: pairs.filter((p) => p.audit && p.audit !== 'same relationship').length, auditPairsMissedByMatcher: AUDIT_SAME.length + AUDIT_DISTINCT.length - pairs.filter((p) => p.audit).length },
  pairs,
  entries,
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1) + '\n')
console.log(JSON.stringify(manifest.counts))
for (const e of entries.filter((x) => x.status !== 'verified')) console.log(`needs review: ${e.id} "${e.title}"`)
for (const p of pairs) console.log(`${p.kind} (audit: ${p.audit || 'not listed'}): ${p.a} "${byId.get(p.a).title}" / ${p.b} "${byId.get(p.b).title}" (${p.shared}/4 tiles)`)
