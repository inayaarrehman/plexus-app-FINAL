#!/usr/bin/env node
// ---------------------------------------------------------------------
// Import: the AI-reviewed timed bank (Split, Sequence, Missing Step) for
// 3 Minutes and Race.
// ---------------------------------------------------------------------
//   node scripts/library/import-timed-arrows.mjs           validate and write
//   node scripts/library/import-timed-arrows.mjs --check   validate; exit 1 if the output would change
//   node scripts/library/import-timed-arrows.mjs --in <file.json>
//
// Reads content/timed/arrows/plexus_timed_bank_ai_reviewed.json (the
// interchange file, kept as supplied) and writes src/data/timedArrowsBank.js.
// The output is a pure function of the input, keyed and sorted by content_id,
// so importing again never duplicates anything.
//
// What reaches the app: the gameplay fields (prompt, clinical context, group
// labels, tiles, chain steps, choices, answer keys), the explanations, and
// the review status. Source titles, page numbers, reviewer notes, source
// caveats and review focus stay in content/ only (no sources are shown in
// Plexus, owner's decision). The audit's abbreviated answer summaries are
// never used as answers.
//
// Every item must pass every check; an item that does not is reported by id
// with the reason and the import stops. Nothing is silently dropped or edited.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const IN = path.resolve(ROOT, opt('--in', 'content/timed/arrows/plexus_timed_bank_ai_reviewed.json'))
const OUT = path.join(ROOT, 'src/data/timedArrowsBank.js')
const REPORT = path.join(ROOT, 'content/timed/arrows/import-report.md')

const raw = fs.readFileSync(IN)
const sha256 = crypto.createHash('sha256').update(raw).digest('hex')
const data = JSON.parse(raw.toString('utf8'))

const problems = []
const bad = (id, reason) => problems.push(`${id}: ${reason}`)
const s = (x) => typeof x === 'string' && x.trim().length > 0
const lower = (x) => String(x).trim().toLowerCase()
const TIER = { easy: 0, medium: 1, hard: 2 }

if (data.schema_version !== 'plexus-timed-bank-interchange-v1') bad('file', `unexpected schema_version ${data.schema_version}`)
if (data.review_provenance?.human_verified !== false) bad('file', 'review_provenance.human_verified must be false')
const items = Array.isArray(data.items) ? data.items : []
const seenIds = new Set()
for (const it of items) {
  if (seenIds.has(it.content_id)) bad(it.content_id, 'duplicate content_id')
  seenIds.add(it.content_id)
}

// Player-visible text: no em dashes (Plexus copy rule). Reported, never edited.
const visibleText = (it) => [it.prompt, it.clinical_context, it.group_a, it.group_b, it.explanation, ...(it.tiles || []).map((t) => t.text), ...(it.choices || []).map((c) => c.text), ...(it.component_explanations || []).flatMap((c) => [c.text, c.explanation])].filter(Boolean)

function common(it) {
  const id = it.content_id
  if (!/^PLX-HYA-(SPL|SEQ|MIS)-\d{3}$/.test(id || '')) bad(id, 'content_id format')
  if (!s(it.concept_id)) bad(id, 'missing concept_id')
  if (!Array.isArray(it.eligible_modes) || !it.eligible_modes.includes('three_minute') || !it.eligible_modes.includes('race')) bad(id, 'not eligible for both timed modes')
  for (const k of ['prompt', 'clinical_context', 'explanation', 'topic', 'system']) if (!s(it[k])) bad(id, `missing ${k}`)
  if (!(it.difficulty in TIER)) bad(id, `unknown difficulty ${it.difficulty}`)
  if (it.review_status !== 'AI_REVIEWED_PASS' || it.reviewer_verdict !== 'PASS') bad(id, `review is ${it.review_status}/${it.reviewer_verdict}, not AI_REVIEWED_PASS`)
  if (it.reviewer_corrected_answer && !/confirmed/i.test(it.reviewer_corrected_answer)) bad(id, `reviewer supplied a correction: ${it.reviewer_corrected_answer}`)
  if (it.review_evidence?.report_content_id !== id) bad(id, 'review evidence names another item')
  if (visibleText(it).some((t) => t.includes('—'))) bad(id, 'player-visible text contains an em dash')
  if (!Array.isArray(it.component_explanations) || it.component_explanations.some((c) => !s(c.explanation))) bad(id, 'missing component explanations')
}

const systemsOf = (sys) => String(sys).split('/').map((x) => x.trim()).filter(Boolean)
const review = (it) => ({ status: it.review_status, verdict: it.reviewer_verdict, humanVerified: false, basis: 'supplied AI audit' })

const out = { split: [], sequence: [], missingStep: [] }
for (const it of items) {
  common(it)
  const id = it.content_id
  const ce = new Map((it.component_explanations || []).map((c) => [c.id, c]))
  if (it.format === 'split') {
    const tiles = it.tiles || []
    const key = it.answer_key || {}
    if (tiles.length !== 6) bad(id, `expected 6 tiles, got ${tiles.length}`)
    if (new Set(tiles.map((t) => t.id)).size !== tiles.length) bad(id, 'duplicate tile id')
    if (new Set(tiles.map((t) => lower(t.text))).size !== tiles.length) bad(id, 'duplicate tile text')
    if (!s(it.group_a) || !s(it.group_b) || lower(it.group_a) === lower(it.group_b)) bad(id, 'group labels missing or identical')
    const keyIds = Object.keys(key)
    if (keyIds.length !== tiles.length || tiles.some((t) => !(t.id in key))) bad(id, 'answer key does not cover exactly the tiles')
    const a = keyIds.filter((k) => key[k] === 'A').length
    const b = keyIds.filter((k) => key[k] === 'B').length
    if (a !== 3 || b !== 3) bad(id, `groups are ${a}/${b}, expected 3/3`)
    for (const t of tiles) {
      const c = ce.get(t.id)
      if (!c || c.group !== key[t.id] || c.text !== t.text) bad(id, `tile ${t.id} explanation does not match its tile or group`)
    }
    out.split.push({
      contentId: id,
      conceptId: it.concept_id,
      systems: systemsOf(it.system),
      topic: it.topic,
      tier: TIER[it.difficulty],
      prompt: it.prompt,
      context: it.clinical_context,
      labelA: it.group_a,
      labelB: it.group_b,
      // Canonical order (by tile id); shuffled at round time.
      tiles: [...tiles].sort((x, y) => x.id.localeCompare(y.id)).map((t) => ({ id: t.id, text: t.text, group: key[t.id] === 'A' ? 'a' : 'b', why: ce.get(t.id)?.explanation || '' })),
      explanation: it.explanation,
      review: review(it),
    })
  } else if (it.format === 'sequence') {
    const tiles = it.tiles || []
    const key = it.answer_key || []
    const byId = new Map(tiles.map((t) => [t.id, t]))
    if (tiles.length !== 4) bad(id, `expected 4 steps, got ${tiles.length}`)
    if (!Array.isArray(key) || key.length !== 4 || new Set(key).size !== 4 || key.some((k) => !byId.has(k))) bad(id, 'answer key is not an order of the four step ids')
    if (new Set(tiles.map((t) => lower(t.text))).size !== tiles.length) bad(id, 'duplicate step text')
    const ordered = Array.isArray(key) ? key.map((k) => byId.get(k)?.text) : []
    if (JSON.stringify(ordered) !== JSON.stringify(it.ordered_steps)) bad(id, 'answer key does not give ordered_steps')
    key.forEach((k, n) => {
      const c = ce.get(k)
      if (!c || c.position !== n + 1 || c.text !== byId.get(k)?.text) bad(id, `step ${k} explanation does not match its position`)
    })
    out.sequence.push({
      contentId: id,
      conceptId: it.concept_id,
      systems: systemsOf(it.system),
      topic: it.topic,
      tier: TIER[it.difficulty],
      prompt: it.prompt,
      context: it.clinical_context,
      // In the correct order; shuffled at round time.
      steps: key.map((k) => ({ id: k, text: byId.get(k)?.text, why: ce.get(k)?.explanation || '' })),
      explanation: it.explanation,
      review: review(it),
    })
  } else if (it.format === 'missing_step') {
    const choices = it.choices || []
    const steps = it.ordered_steps || []
    const pos = it.missing_position_1based
    const key = it.answer_key || {}
    if (steps.length !== 4) bad(id, `expected a 4-step chain, got ${steps.length}`)
    if (choices.length !== 4) bad(id, `expected 4 choices, got ${choices.length}`)
    if (new Set(choices.map((c) => c.id)).size !== choices.length) bad(id, 'duplicate choice id')
    if (new Set(choices.map((c) => lower(c.text))).size !== choices.length) bad(id, 'duplicate choice text')
    if (!Number.isInteger(pos) || pos < 1 || pos > steps.length) bad(id, `invalid blank position ${pos}`)
    if (key.missing_position_1based !== pos) bad(id, 'answer key blank position differs')
    const correct = choices.find((c) => c.id === it.correct_choice_id)
    if (!correct || key.correct_choice_id !== it.correct_choice_id) bad(id, 'correct choice id missing or inconsistent')
    if (!correct || correct.text !== it.correct_answer || key.correct_text !== it.correct_answer || steps[pos - 1] !== it.correct_answer) bad(id, 'correct answer does not fill the blank')
    if (choices.some((c) => c.id !== it.correct_choice_id && steps.map(lower).includes(lower(c.text)))) bad(id, 'a wrong choice is a step of the chain')
    const display = steps.map((x, n) => (n === pos - 1 ? '[ ? ]' : x)).join(' -> ')
    if (display !== it.display_chain) bad(id, 'display_chain does not match the chain and blank')
    if (it.review_evidence?.reported_blank_position_1based !== pos) bad(id, 'audit reported a different blank position')
    for (const c of choices) {
      const e = ce.get(c.id)
      if (!e || e.text !== c.text || !!e.correct !== (c.id === it.correct_choice_id)) bad(id, `choice ${c.id} explanation does not match`)
    }
    out.missingStep.push({
      contentId: id,
      conceptId: it.concept_id,
      systems: systemsOf(it.system),
      topic: it.topic,
      tier: TIER[it.difficulty],
      prompt: it.prompt,
      context: it.clinical_context,
      chain: steps.slice(),
      missingIndex: pos - 1,
      correctId: it.correct_choice_id,
      // Canonical order (by choice id); shuffled at round time.
      choices: [...choices].sort((x, y) => x.id.localeCompare(y.id)).map((c) => ({ id: c.id, text: c.text, correct: c.id === it.correct_choice_id, why: ce.get(c.id)?.explanation || '' })),
      explanation: it.explanation,
      review: review(it),
    })
  } else bad(it.content_id, `unknown format ${it.format}`)
}

// Counts and chain pairing.
const counts = { split: out.split.length, sequence: out.sequence.length, missingStep: out.missingStep.length }
if (counts.split !== 60 || counts.sequence !== 30 || counts.missingStep !== 30) bad('file', `counts ${counts.split}/${counts.sequence}/${counts.missingStep}, expected 60/30/30`)
const seqByConcept = new Map(out.sequence.map((x) => [x.conceptId, x]))
const misByConcept = new Map(out.missingStep.map((x) => [x.conceptId, x]))
if (seqByConcept.size !== out.sequence.length) bad('file', 'two Sequence items share a concept_id')
if (misByConcept.size !== out.missingStep.length) bad('file', 'two Missing Step items share a concept_id')
for (const [c, seq] of seqByConcept) {
  const mis = misByConcept.get(c)
  if (!mis) {
    bad(seq.contentId, `no Missing Step version for ${c}`)
    continue
  }
  if (JSON.stringify(seq.steps.map((x) => x.text)) !== JSON.stringify(mis.chain)) bad(mis.contentId, `chain differs from ${seq.contentId}`)
  if (seq.context !== mis.context) bad(mis.contentId, `clinical context differs from ${seq.contentId}`)
}
for (const c of misByConcept.keys()) if (!seqByConcept.has(c)) bad(misByConcept.get(c).contentId, `no Sequence version for ${c}`)
const splitConcepts = new Set(out.split.map((x) => x.conceptId))
if (splitConcepts.size !== out.split.length) bad('file', 'two Split items share a concept_id')

if (problems.length) {
  console.error(`Import stopped: ${problems.length} problem(s). Nothing was written.\n  ` + problems.join('\n  '))
  process.exit(1)
}

for (const k of Object.keys(out)) out[k].sort((x, y) => x.contentId.localeCompare(y.contentId))
const bank = {
  source: path.relative(ROOT, IN),
  sha256,
  schema: data.schema_version,
  review: { status: 'AI_REVIEWED_PASS', humanVerified: false, reviewed: data.review_provenance?.reported_outcome?.reviewed ?? null, pass: data.review_provenance?.reported_outcome?.pass ?? null },
  counts,
  ...out,
}
const js = `// GENERATED by scripts/library/import-timed-arrows.mjs from ${bank.source}. Do not edit by hand.
// Split, Sequence and Missing Step rounds for 3 Minutes and Race. Reviewed by
// a supplied AI audit (AI_REVIEWED_PASS), not human verified. Sequence and
// Missing Step items with the same conceptId are two formats of one chain.
const TIMED_ARROWS_BANK = ${JSON.stringify(bank)}
export default TIMED_ARROWS_BANK
`
const report = `# Timed bank import (Split, Sequence, Missing Step)

- Input: \`${bank.source}\` (sha256 ${sha256})
- Imported: ${counts.split} Split, ${counts.sequence} Sequence, ${counts.missingStep} Missing Step (${seqByConcept.size} shared chains)
- Review: every item AI_REVIEWED_PASS from the supplied audit; not human verified
- Problems: none
- Kept out of the app: source titles and pages, reviewer notes, source caveats, review focus, the audit's abbreviated answer summaries
`

if (args.includes('--check')) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === js
  console.log(same ? 'timedArrowsBank.js is up to date' : 'timedArrowsBank.js would change')
  process.exit(same ? 0 : 1)
}
fs.writeFileSync(OUT, js)
fs.writeFileSync(REPORT, report)
console.log(`imported ${counts.split} Split, ${counts.sequence} Sequence, ${counts.missingStep} Missing Step -> ${path.relative(ROOT, OUT)}`)
