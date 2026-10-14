// Difficulty and construction checks (October 2026 rebuild).
//   node scripts/difficulty-test.mjs
const mem = {}
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k], key: (i) => Object.keys(mem)[i], get length() { return Object.keys(mem).length } }
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} }

const S = await import('../src/utils/surfaceSignals.js')
const B = await import('./library/boards.mjs')
const E = await import('../src/utils/challengeEngine.js')
const M = await import('../src/utils/challengeModesPlus.js')
const P = await import('../src/utils/timedPacing.js')
const T = await import('../src/utils/timedLibrary.js')
const RE = await import('../src/utils/raceEngine.js')
const { seededRng, normalizeTile } = await import('../src/utils/puzzleAssembler.js')
const CE = await import('../src/utils/contentEpoch.js')
const { default: NL } = await import('../src/data/library/newLibrary.js')
const NLu = await import('../src/utils/newLibrary.js')

let passed = 0
let failed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
const section = (s) => console.log(s)

section('[1] Wording signals')
{
  const iso = S.boardSurface([
    ['Type I collagen', 'Type II collagen', 'Type III collagen', 'Type V collagen'],
    ['Increased renal calcium reabsorption', 'Increased urinary phosphate excretion', 'Increased 1-alpha-hydroxylase activity', 'Increased bone resorption'],
    ['Behcet disease', 'Celiac disease', 'Crohn disease', 'Lupus'],
    ['Low C4', 'Increased bradykinin', 'Autosomal dominant inheritance', 'Recurrent bowel-wall edema'],
  ]).isolated
  ok(iso[0].length > 0, 'a numbered collagen series is flagged as isolating its group')
  ok(iso[1].length > 0, 'four "Increased ..." tiles are flagged as isolating their group')
  ok(iso[3].length === 0, 'a mixed group is not flagged')
  ok(S.answerShortcuts(['Adalimumab', 'Infliximab', 'Rituximab', 'Trastuzumab'], ['Etanercept', 'Anakinra', 'Methotrexate', 'Abatacept']).length > 0, '"-mab" answers among non-"-mab" wrong answers is a shortcut')
  ok(S.answerShortcuts(['Adalimumab', 'Infliximab'], ['Omalizumab', 'Etanercept']).length === 0, 'a shared stem that wrong answers also carry is not a shortcut')
  ok(S.titleLeak('Causes of anion gap metabolic acidosis', ['Diabetic ketoacidosis']).includes('acidosis'), 'a title word inside a longer tile word counts as a leak')
}

section('[2] Whole-board scoring')
{
  const mk = (id, title, tiles, types, rec, facets = [[], [], [], []], system = 'X') => B.prepare({ id, title, tiles, system, difficulty: 'easy', notes: '' }, { recognition: rec, reasoning: 'recall', tileTypes: types, facets, issues: [] })
  const sorted = [
    mk('a', 'Fibrillar collagen types', ['Type I collagen', 'Type II collagen', 'Type III collagen', 'Type V collagen'], ['molecule', 'molecule', 'molecule', 'molecule'], 1, [[], [], [], []], 'Biochem'),
    mk('b', 'Actions of PTH', ['Increased renal calcium reabsorption', 'Increased urinary phosphate excretion', 'Increased 1-alpha-hydroxylase activity', 'Increased bone resorption'], ['change', 'change', 'change', 'change'], 1, [[], [], [], []], 'Endo'),
    mk('c', 'Causes of aphthous ulcers', ['Behcet disease', 'Celiac disease', 'Crohn disease', 'Lupus'], ['disease', 'disease', 'disease', 'disease'], 1, [[], [], [], []], 'GI'),
    mk('d', 'Dopaminergic pathways', ['Mesolimbic pathway', 'Mesocortical pathway', 'Nigrostriatal pathway', 'Tuberoinfundibular pathway'], ['process', 'process', 'process', 'process'], 2, [[], [], [], []], 'Neuro'),
  ]
  const a = B.analyzeBoard(sorted)
  ok(a.kindSorted, 'four single-kind groups are recognized as sorting by tile kind')
  ok(a.surfaceIsolated.filter((x) => x.length).length >= 3, 'wording giveaways are counted per group')
  ok(a.instant >= 3, 'three instant groups are counted')
  const risky = B.pairRisk(mk('p', 'Clues to iron deficiency', ['Pica', 'Koilonychia', 'Low ferritin', 'Glossitis'], ['finding', 'finding', 'lab', 'finding'], 2, [['lead poisoning'], [], [], []]), mk('q', 'Lead poisoning features', ['Basophilic stippling', 'Wrist drop', 'Burton lines', 'Abdominal colic'], ['finding', 'finding', 'finding', 'finding'], 2))
  ok(risky.length === 1, 'a tile whose common association is another group\'s subject is a fairness risk')
  const ids = Array.from({ length: 16 }, (_, i) => mk(`x${i}`, `Group ${i}`, [`alpha${i}`, `beta${i}`, `gamma${i}`, `delta${i}`], ['disease', 'drug', 'finding', 'molecule'], 1 + (i % 3), [[], [], [], []], `S${i % 4}`))
  const p1 = B.buildPartition(ids, { seed: 't', maxPerSubject: 2, minSubjects: 2, iterations: 2000 })
  const p2 = B.buildPartition(ids, { seed: 't', maxPerSubject: 2, minSubjects: 2, iterations: 2000 })
  ok(JSON.stringify(p1) === JSON.stringify(p2) && p1.length === 4, 'board building is deterministic for the same inputs')
}

section('[3] Live library')
{
  const live = [...NL.dailyBoards, ...Object.values(NL.starterBoards).flat(), ...NL.expansionBoards]
  ok(NL.epoch && NL.epoch !== 'launch', 'the generated library carries the rebuild epoch')
  ok(live.every((b) => Array.isArray(b.levels) && b.levels.length === 4 && b.levels.every((l) => b.ids.includes(l.id))), 'every board carries its easiest-to-hardest levels')
  const p = NLu.getNewDailyPuzzle(NL.dailyStart)
  ok(p && p.categories.map((c) => c.bankCategoryId).join() === NL.dailyBoards[0].levels.map((l) => l.id).join(), 'the Daily shows groups in the board\'s own difficulty order')
  ok(Object.values(NL.connections).every((c) => c.detail && c.tileNotes && c.tileNotes.length === 4), 'every served connection has a fuller explanation and four tile notes')
  ok(Object.values(NL.connections).every((c) => ['easy', 'medium', 'hard', 'expert'].includes(c.difficulty) && c.sourceDifficulty), 'served difficulty comes from recognition; the source label is kept')
}

section('[4] Timed formats')
{
  const bank = T.timedBank
  for (const type of E.ROUND_TYPES) {
    const rng = seededRng(`dt:${type}`)
    let built = 0
    let invalid = 0
    for (let i = 0; i < 80; i++) {
      const r = E.generateRound(bank, { rng, roundTypes: [type] })
      if (!r) continue
      built++
      if (!E.validateRound(r, bank, { strictShortcuts: false }).valid) invalid++
    }
    ok(built >= 60 && invalid === 0, `${type}: builds valid rounds (${built}/80)`)
  }
  // Double Agent: every wrong option is a checked non-member of one group.
  {
    const rng = seededRng('dt:da')
    let bad = 0
    for (let i = 0; i < 60; i++) {
      const r = M.buildDoubleAgent(bank, rng)
      if (!r) continue
      const A = bank.find((c) => c.title === r.labelA)
      const B2 = bank.find((c) => c.title === r.labelB)
      const nm = (c) => (c.nearMisses || []).map((n) => normalizeTile(n.text))
      for (const o of r.options) if (!o.both && !nm(A).includes(normalizeTile(o.text)) && !nm(B2).includes(normalizeTile(o.text))) bad++
    }
    ok(bad === 0, 'Double Agent wrong options are all checked near misses of one of the two groups')
  }
  {
    const rng = seededRng('dt:mini')
    let same = 0
    for (let i = 0; i < 60; i++) {
      const r = E.generateRound(bank, { rng, roundTypes: ['miniConnections'] })
      const a = bank.find((c) => c.id === r.groups.a.categoryId)
      const b = bank.find((c) => c.id === r.groups.b.categoryId)
      if (P.sameSystem(a, b) || M.isWordplay(a) || M.isWordplay(b)) same++
    }
    ok(same === 0, 'Mini Connections pairs groups from different systems and never wordplay groups')
  }
  {
    const rng = seededRng('dt:tier')
    const counts = [0, 0, 0]
    for (let i = 0; i < 600; i++) {
      const r = E.generateRound(bank, { rng, roundTypes: ['impostor'] })
      if (r && r.tier != null) counts[r.tier]++
    }
    const total = counts.reduce((a, b) => a + b, 0)
    ok(counts.every((c) => c > total * 0.1), `Impostor serves all three tiers (${counts.join('/')})`)
  }
  const avoid = new Set(bank.slice(0, 120).map((c) => c.id))
  const rng = seededRng('dt:avoid')
  let hit = 0
  for (let i = 0; i < 40; i++) {
    const r = E.generateRound(bank, { rng, roundTypes: ['rapidAssociation'], avoid })
    if (r && avoid.has(r.categoryId)) hit++
  }
  ok(hit === 0, 'recently served categories are passed over when others are available')
}

section('[5] Race')
{
  const bank = T.timedBank
  let same = 0
  let curve = 0
  for (let i = 0; i < 40; i++) {
    const code = RE.makeJoinCode(seededRng(`rc:${i}`))
    const a = RE.buildRaceChallenge(bank, { code, canonicalOf: T.timedCanonicalId })
    const b = RE.buildRaceChallenge(bank, { code, canonicalOf: T.timedCanonicalId })
    if (JSON.stringify(a) === JSON.stringify(b) && a.length === RE.RACE_LENGTH) same++
    if (a.every((r, k) => r.tier === P.RACE_TIER_CURVE[k])) curve++
  }
  ok(same === 40, 'every race code builds the identical ten rounds for both players')
  ok(curve >= 36, `races follow the shared difficulty curve (${curve}/40 exactly)`)
}

section('[6] Content epoch reset')
{
  for (const k of Object.keys(mem)) delete mem[k]
  ok(!CE.applyContentEpoch(globalThis.localStorage).reset && mem[CE.EPOCH_KEY] === CE.CONTENT_EPOCH, 'a new device just records the epoch')
  for (const k of Object.keys(mem)) delete mem[k]
  mem['medconnections.dailyHistory.v1'] = '{}'
  mem['medconnections.stats.v1'] = '{}'
  mem['medconnections.systemsBoards.v1'] = '{}'
  mem['medconnections.progress.system-cardiology-starter-1'] = '{}'
  mem['plexus.progression.v1'] = '{}'
  mem['medconnections.savedConnections.v1'] = '["CARD-001"]'
  mem['plexus.connectionDraft.v1'] = 'x'
  const r = CE.applyContentEpoch(globalThis.localStorage)
  ok(r.reset, 'progress saved before the rebuild is cleared')
  ok(['medconnections.dailyHistory.v1', 'medconnections.stats.v1', 'medconnections.systemsBoards.v1', 'medconnections.progress.system-cardiology-starter-1', 'plexus.progression.v1'].every((k) => !(k in mem)), 'history, stats, Systems boards, games in progress and XP are all cleared')
  ok(mem['medconnections.savedConnections.v1'] === '["CARD-001"]' && mem['plexus.connectionDraft.v1'] === 'x', 'saved connections and drafts are kept')
  ok(!CE.applyContentEpoch(globalThis.localStorage).reset, 'the reset happens once')
  const { mergeSnapshots, snapshotLocal } = await import('../src/utils/progressSync.js')
  ok(snapshotLocal().epoch === CE.CONTENT_EPOCH && mergeSnapshots({}, {}).epoch === CE.CONTENT_EPOCH, 'saves carry the epoch')
  ok(!CE.snapshotInEpoch({ dailyHistory: { '2026-10-12': { completed: true } } }), 'a cloud save without the current epoch is not merged back')
}

console.log(failed ? `\n${failed} FAILED (${passed} passed)` : `\nALL DIFFICULTY CHECKS PASSED (${passed} passed)`)
if (failed) process.exit(1)
