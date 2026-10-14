#!/usr/bin/env node
// Records board fairness reviews into content/library/board-review.json.
//   node scripts/library/board-review.mjs add <reviews.json> --by "..."
// reviews: [{ key, verdict, problems, flagsReviewed, competition, note }]
// Run after `activate.mjs --plan` (it reads the plan's content hashes).
// A review is tied to the board's signature (its members' content); it lapses
// if any member changes. Failed boards are never formed again by activate.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as L from './lib.mjs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FILE = path.join(ROOT, 'content/library/board-review.json')
const args = process.argv.slice(2)
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
const store = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { about: 'Fairness reviews of rebuilt Daily and Systems boards (Claude, AI review at the owner\'s request; not human verification). Keyed by sorted connection ids; each lapses when a member changes. pass = no tile fits another group as well, no strong alternative grouping, flags judged. fail = never formed again.', boards: {} }
if (args[0] === 'add') {
  // Signatures come from the content hashes of the activation plan
  // (content/library/activation/plan-hashes.json), so they match what
  // activate computes: order-independent, over the members' content.
  const reviews = JSON.parse(fs.readFileSync(args[1], 'utf8'))
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/library/activation/plan-hashes.json'), 'utf8'))
  const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/library/library.json'), 'utf8'))
  const starterPool = new Set(plan.starterPool)
  const revisions = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/library/revisions.json'), 'utf8')).entries
  const by = opt('--by') || 'Claude (AI board review), 2026-10-13'
  let n = 0
  for (const r of reviews) {
    const ids = r.key.split('+')
    if (ids.some((id) => !plan.hashes[id])) throw new Error(`unknown member in ${r.key}`)
    const subjects = [...new Set(ids.map((id) => lib.records[id].system))]
    const kind = subjects.length > 1 ? 'daily' : ids.every((id) => starterPool.has(id)) ? 'starter' : 'expansion'
    const signature = L.sha([...ids].sort().map((id) => plan.hashes[id]).join('|')).slice(0, 8)
    // Which pairs of connections the problems name (a tile or title of each),
    // so activate can keep that pair apart everywhere, not just on this board.
    let conflicts = []
    if (r.verdict === 'fail') {
      const text = ` ${L.words((r.problems || []).join(' ')).join(' ')} `
      const names = (id) => {
        const c = lib.records[id].content
        const rv = revisions[id]
        const title = rv ? rv.revised.title : c.title
        const tiles = rv ? rv.revised.tiles : c.tiles
        return [title, ...tiles].map((x) => L.words(x).join(' ')).filter((x) => x.length >= 4)
      }
      const hit = ids.filter((id) => names(id).some((n) => text.includes(` ${n} `)))
      for (let i = 0; i < hit.length; i++) for (let j = i + 1; j < hit.length; j++) conflicts.push([hit[i], hit[j]].sort())
    }
    store.boards[r.key] = { verdict: r.verdict, kind, ...(conflicts.length ? { conflicts } : {}), subject: kind === 'daily' ? null : subjects[0], by, signature, rationale: r.verdict === 'pass' ? r.flagsReviewed || r.note || 'No tile fits another group as well; no alternative grouping.' : (r.problems || []).join(' '), competition: r.competition || null, note: r.note || '' }
    n++
  }
  fs.writeFileSync(FILE, JSON.stringify(store, null, 1) + '\n')
  console.log(`recorded ${n}; total ${Object.keys(store.boards).length} (fail ${Object.values(store.boards).filter((x) => x.verdict === 'fail').length})`)
} else {
  console.log('usage: add <reviews.json> --by "..."')
}
