// The imported timed bank (Split, Sequence, Missing Step) in 3 Minutes and Race.
//   node scripts/timed-arrows-test.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const mem = {}
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k], key: (i) => Object.keys(mem)[i], get length() { return Object.keys(mem).length } }
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { default: ARROWS } = await import('../src/data/timedArrowsBank.js')
const M = await import('../src/utils/challengeModesPlus.js')
const E = await import('../src/utils/challengeEngine.js')
const RE = await import('../src/utils/raceEngine.js')
const T = await import('../src/utils/timedLibrary.js')
const { scoreAnswer, roundsFor } = await import('../server/raceCore.js')
const SRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/timed/arrows/plexus_timed_bank_ai_reviewed.json'), 'utf8'))

let passed = 0
let failed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
let seed = 7
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const bank = T.timedBank

console.log('[1] Import: counts, ids, fields, idempotence')
{
  ok(ARROWS.counts.split === 60 && ARROWS.counts.sequence === 30 && ARROWS.counts.missingStep === 30, 'counts 60 / 30 / 30')
  const all = [...ARROWS.split, ...ARROWS.sequence, ...ARROWS.missingStep]
  ok(new Set(all.map((x) => x.contentId)).size === 120, '120 unique content ids')
  ok(all.every((x) => x.review.status === 'AI_REVIEWED_PASS' && x.review.humanVerified === false), 'every item is AI_REVIEWED_PASS and not human verified')
  ok(all.every((x) => x.prompt && x.context && x.explanation), 'every item has a prompt, clinical context and explanation')
  const gen = fs.readFileSync(path.join(ROOT, 'src/data/timedArrowsBank.js'), 'utf8')
  ok(!/Mehlman|source_title|reviewer_notes|source_caveat|reported_answer_summary|review_focus|pdf_pages/.test(gen), 'no sources, reviewer notes, caveats or audit summaries in the app bundle')
  const out = execFileSync('node', ['scripts/library/import-timed-arrows.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' })
  ok(/up to date/.test(out), 'importing again changes nothing (idempotent)')
  // Against the supplied file, field by field.
  const src = new Map(SRC.items.map((x) => [x.content_id, x]))
  for (const it of ARROWS.split) {
    const s = src.get(it.contentId)
    ok(s.concept_id === it.conceptId && s.clinical_context === it.context && s.group_a === it.labelA && s.group_b === it.labelB && s.explanation === it.explanation, `${it.contentId}: fields kept`)
    ok(it.tiles.length === 6 && it.tiles.filter((t) => t.group === 'a').length === 3 && it.tiles.every((t) => s.answer_key[t.id] === (t.group === 'a' ? 'A' : 'B') && s.tiles.find((x) => x.id === t.id).text === t.text), `${it.contentId}: six tiles, three per group, key kept`)
    ok(it.tiles.every((t) => t.why && t.why === s.component_explanations.find((c) => c.id === t.id).explanation), `${it.contentId}: tile explanations kept`)
  }
  const seqBy = new Map(ARROWS.sequence.map((x) => [x.conceptId, x]))
  for (const it of ARROWS.sequence) {
    const s = src.get(it.contentId)
    ok(JSON.stringify(it.steps.map((x) => x.id)) === JSON.stringify(s.answer_key) && JSON.stringify(it.steps.map((x) => x.text)) === JSON.stringify(s.ordered_steps), `${it.contentId}: four steps in the keyed order`)
    ok(it.steps.every((x) => x.why), `${it.contentId}: step explanations kept`)
  }
  for (const it of ARROWS.missingStep) {
    const s = src.get(it.contentId)
    const seq = seqBy.get(it.conceptId)
    ok(seq && JSON.stringify(seq.steps.map((x) => x.text)) === JSON.stringify(it.chain), `${it.contentId}: same chain as ${seq?.contentId}`)
    ok(it.choices.length === 4 && new Set(it.choices.map((c) => c.text)).size === 4 && it.choices.filter((c) => c.correct).length === 1, `${it.contentId}: four distinct choices, one right`)
    ok(it.missingIndex === s.missing_position_1based - 1 && it.correctId === s.correct_choice_id && it.chain[it.missingIndex] === s.correct_answer && it.choices.find((c) => c.correct).text === s.correct_answer, `${it.contentId}: blank and answer kept (full answer, not the audit summary)`)
    ok(it.choices.every((c) => c.why), `${it.contentId}: choice explanations kept`)
  }
}

console.log('[2] Import refuses an unsafe item, by id, and writes nothing')
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arrows-'))
  const cases = [
    ['PLX-HYA-SPL-001', (d) => { d.items[0].answer_key.t4 = 'A' }, /groups are 4\/2/],
    ['PLX-HYA-MIS-001', (d) => { d.items.find((x) => x.content_id === 'PLX-HYA-MIS-001').correct_choice_id = 'B' }, /PLX-HYA-MIS-001/],
    ['PLX-HYA-SEQ-001', (d) => { d.items.find((x) => x.content_id === 'PLX-HYA-SEQ-001').answer_key = ['s2', 's1', 's3', 's4'] }, /does not give ordered_steps/],
    ['duplicate', (d) => { d.items.push({ ...d.items[0] }) }, /duplicate content_id/],
  ]
  const before = fs.readFileSync(path.join(ROOT, 'src/data/timedArrowsBank.js'), 'utf8')
  for (const [name, mutate, expect] of cases) {
    const d = JSON.parse(JSON.stringify(SRC))
    mutate(d)
    const f = path.join(dir, `${name}.json`)
    fs.writeFileSync(f, JSON.stringify(d))
    let msg = ''
    let code = 0
    try {
      execFileSync('node', ['scripts/library/import-timed-arrows.mjs', '--in', f], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (e) {
      code = e.status
      msg = String(e.stderr)
    }
    ok(code === 1 && expect.test(msg), `${name}: refused with its id and reason (${msg.split('\n')[1]?.trim() || msg.trim()})`)
  }
  ok(fs.readFileSync(path.join(ROOT, 'src/data/timedArrowsBank.js'), 'utf8') === before, 'the app data is untouched after a refused import')
}

console.log('[3] Rounds: every item reachable, shuffled, answer mapping intact')
{
  const seen = { split: new Set(), chain: new Set(), completeTheChain: new Set() }
  const orders = { split: new Set(), chain: new Set(), completeTheChain: new Set() }
  let invalid = 0
  for (let i = 0; i < 4000; i++) {
    for (const type of ['split', 'chain', 'completeTheChain']) {
      const r = M.NEW_BUILDERS[type](bank, rng, {})
      if (!r || r.source !== 'arrows') continue
      if (!M.validateModeRound(r, bank).valid) invalid++
      seen[type].add(r.contentId)
      const ids = (r.tiles || r.steps || r.options).map((x) => x.id).join(',')
      orders[type].add(`${r.contentId}:${ids}`)
      if (type === 'split') {
        const it = ARROWS.split.find((x) => x.contentId === r.contentId)
        if (!r.tiles.every((t) => it.tiles.find((x) => x.id === t.id).group === t.group)) invalid++
        if (!scoreAnswer(r, Object.fromEntries(it.tiles.map((t) => [t.id, t.group])))) invalid++
      }
      if (type === 'chain') {
        const it = ARROWS.sequence.find((x) => x.contentId === r.contentId)
        if (!scoreAnswer(r, it.steps.map((x) => x.id)) || scoreAnswer(r, r.steps.map((x) => x.id)) !== (r.steps.map((x) => x.id).join() === it.steps.map((x) => x.id).join())) invalid++
      }
      if (type === 'completeTheChain') {
        const it = ARROWS.missingStep.find((x) => x.contentId === r.contentId)
        if (!scoreAnswer(r, it.chain[it.missingIndex]) || r.options.some((o) => !o.correct && scoreAnswer(r, o.text))) invalid++
      }
    }
  }
  ok(seen.split.size === 60 && seen.chain.size === 30 && seen.completeTheChain.size === 30, `every imported item can be served (${seen.split.size}/${seen.chain.size}/${seen.completeTheChain.size})`)
  ok(invalid === 0, `every served round validates and scores right answers right, wrong ones wrong (${invalid} problems)`)
  ok(orders.split.size > 300 && orders.chain.size > 150 && orders.completeTheChain.size > 150, 'tiles, steps and choices are shuffled')
  // Curated rounds still come up too.
  let curated = 0
  for (let i = 0; i < 400; i++) if (M.NEW_BUILDERS.split(bank, rng, {})?.source !== 'arrows') curated++
  ok(curated > 20, `curated Split pairs still appear (${curated} of 400)`)
  // Wrong answers fail.
  const r = M.buildSplit(bank, () => 0.01, {})
  ok(r.source === 'arrows' && !scoreAnswer(r, Object.fromEntries(r.tiles.map((t) => [t.id, t.group === 'a' ? 'b' : 'a']))) && !scoreAnswer(r, {}), 'a wrong or incomplete Split is scored wrong')
}

console.log('[4] A chain’s two formats count as one concept')
{
  const key = M.arrowsKey('PLX-HYA-C001')
  let r
  for (let i = 0; i < 200 && !(r && r.conceptId === 'PLX-HYA-C001'); i++) r = M.buildChain(bank, rng, {})
  const rel = E.roundRelationships(r, bank, T.timedCanonicalId)
  let m
  for (let i = 0; i < 400 && !(m && m.conceptId === 'PLX-HYA-C001'); i++) m = M.buildCompleteTheChain(bank, rng, {})
  ok(rel.has(key) && E.roundRelationships(m, bank, T.timedCanonicalId).has(key), 'Sequence and Missing Step share one relationship key')
  // Whole simulated sessions: never both formats of one chain.
  let clashes = 0
  let backToBack = 0
  let arrowsRounds = 0
  for (let s = 0; s < 300; s++) {
    const used = new Set()
    let recent = []
    const concepts = []
    for (let k = 0; k < 18; k++) {
      const round = E.composeNextRound(bank, { rng, used, recent, canonicalOf: T.timedCanonicalId })
      if (!round) break
      E.roundRelationships(round, bank, T.timedCanonicalId).forEach((id) => used.add(id))
      recent = [{ type: round.type, systems: round.systems, conceptTags: round.conceptTags }, ...recent].slice(0, 3)
      if (round.conceptKey) {
        arrowsRounds++
        if (concepts.includes(round.conceptKey)) clashes++
        if (concepts[concepts.length - 1] === round.conceptKey) backToBack++
      }
      concepts.push(round.conceptKey || null)
    }
  }
  ok(arrowsRounds > 300, `imported rounds come up in 3 Minutes sessions (${arrowsRounds} in 300 sessions)`)
  ok(clashes === 0 && backToBack === 0, 'no session shows both formats of one chain, or the same concept twice')
  // Across sessions: concepts this device saw recently go last.
  const avoid = new Set(ARROWS.sequence.slice(0, 29).map((x) => M.arrowsKey(x.conceptId)))
  let fresh = 0
  for (let i = 0; i < 200; i++) {
    const c = M.buildChain(bank, () => 0.01, { avoid })
    if (c.source === 'arrows' && !avoid.has(c.conceptKey)) fresh++
  }
  ok(fresh === 200, 'a chain seen recently on this device is passed over while others remain')
}

console.log('[5] Race: same rounds for both players, capped new formats, server scoring')
{
  let withNew = 0
  let capOk = true
  let deterministic = true
  const typeSeen = new Set()
  for (let i = 0; i < 150; i++) {
    const code = RE.makeJoinCode(rng)
    const a = RE.buildRaceChallenge(bank, { code, canonicalOf: T.timedCanonicalId })
    const b = RE.buildRaceChallenge(bank, { code, canonicalOf: T.timedCanonicalId })
    if (JSON.stringify(a) !== JSON.stringify(b)) deterministic = false
    if (JSON.stringify(a) !== JSON.stringify(roundsFor(code))) deterministic = false
    const counts = {}
    a.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1
      typeSeen.add(r.type)
    })
    for (const t of Object.keys(RE.RACE_TYPE_CAP)) if ((counts[t] || 0) > RE.RACE_TYPE_CAP[t]) capOk = false
    if (a.some((r) => r.source === 'arrows')) withNew++
    const keys = a.map((r) => r.conceptKey).filter(Boolean)
    if (new Set(keys).size !== keys.length) capOk = false
    if (a.length !== RE.RACE_LENGTH) deterministic = false
  }
  ok(deterministic, 'the same code gives identical rounds on every client and the server, ten each')
  ok(capOk, 'at most one Split, one Chain and one Complete the Chain per race, never a chain twice')
  ok(['split', 'chain', 'completeTheChain'].every((t) => typeSeen.has(t)) && withNew > 60, `imported rounds come up in races (${withNew} of 150)`)
  const classic = RE.buildRaceChallenge(bank, { code: 'ABCD', canonicalOf: T.timedCanonicalId, roundTypes: RE.RACE_CLASSIC_TYPES })
  ok(classic.every((r) => RE.RACE_CLASSIC_TYPES.includes(r.type)), 'the shared-code fallback race keeps the original four formats')
  ok(scoreAnswer({ type: 'chain', order: ['s1', 's2'] }, ['s2', 's1']) === false && scoreAnswer({ type: 'chain', order: ['s1', 's2'] }, 's1') === false, 'server: wrong or malformed Chain answers are wrong')
  ok(scoreAnswer({ type: 'split', tiles: [{ id: 't1', group: 'a' }] }, ['a']) === false, 'server: malformed Split answers are wrong')
  // Race again: the new race shares no imported concept with the one just played.
  const { handleRace } = await import('../server/raceCore.js')
  let clash = 0
  for (let i = 0; i < 60; i++) {
    let prevCode
    for (let k = 0; k < 50 && !prevCode; k++) {
      const c = RE.makeJoinCode(rng)
      if (roundsFor(c).some((r) => r.conceptKey)) prevCode = c
    }
    let sent
    const rpc = async (fn, args) => (fn === 'race_state' ? { ok: true, match: { code: prevCode } } : ((sent = args.p_code), { ok: true, match: { code: args.p_code } }))
    await handleRace({ token: 't', body: { action: 'rematch', matchId: '00000000-0000-0000-0000-000000000001' } }, { rpc, getUser: async () => ({ id: 'u' }), makeCode: () => RE.makeJoinCode(rng) })
    const before = new Set(roundsFor(prevCode).map((r) => r.conceptKey).filter(Boolean))
    if (roundsFor(sent).some((r) => before.has(r.conceptKey))) clash++
  }
  ok(clash === 0, `Race again never repeats a chain or Split from the race just played (${clash} of 60)`)
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL TIMED BANK CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
