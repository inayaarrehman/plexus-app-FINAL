#!/usr/bin/env node
// ---------------------------------------------------------------------
// Old vs new construction: a reproducible comparison across every mode.
// ---------------------------------------------------------------------
//   node scripts/library/difficulty-validate.mjs --old <dir>
// <dir> is a copy of the project from before the October 2026 difficulty
// work (the checkpoint content plus its src/). Writes
// content/library/activation/difficulty-validation.{json,md}.
//
// Everything here is an automated estimate from content metadata and
// wording signals. It is not player data, it does not prove medical
// uniqueness, and it says nothing about solve times or success rates.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as L from './lib.mjs'
import * as B from './boards.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const OLD = path.resolve(opt('--old', ''))
if (!OLD || !fs.existsSync(path.join(OLD, 'content/library/activation/ledger.json'))) throw new Error('--old <dir> must point at a pre-change copy of the project')
const N = Number(opt('--rounds', 300))
const RACES = Number(opt('--races', 200))
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const imp = (dir, rel) => import(pathToFileURL(path.join(dir, rel)).href)

// Browser globals some modules touch at import time.
const mem = {}
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k], key: (i) => Object.keys(mem)[i], get length() { return Object.keys(mem).length } }
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} }

const S = await imp(ROOT, 'src/utils/surfaceSignals.js')
const out = { generatedAt: new Date().toISOString(), caveat: 'Automated estimates from content metadata and wording signals; not player data; not proof of medical uniqueness.', daily: {}, systems: {}, timed: {}, race: {}, content: {}, capacity: {}, checks: [] }
const check = (name, pass, detail = '') => out.checks.push({ name, pass: !!pass, detail })

// ---------------- content and metadata ----------------
const lib = readJson(path.join(ROOT, 'content/library/library.json'))
const R = lib.records
const revisions = readJson(path.join(ROOT, 'content/library/revisions.json')).entries
const copyEdits = readJson(path.join(ROOT, 'content/library/copy-edits.json')).entries
const audit = readJson(path.join(ROOT, 'content/library/audit/difficulty-audit.json')).entries
const rerate = readJson(path.join(ROOT, 'content/library/audit/rerate.json')).entries
const revLog = readJson(path.join(ROOT, 'content/library/audit/revision-log.json')).entries
const boardReview = readJson(path.join(ROOT, 'content/library/board-review.json')).boards
const oldReview = readJson(path.join(ROOT, 'content/library/audit/old-board-review.json')).boards
const ledgerNew = readJson(path.join(ROOT, 'content/library/activation/ledger.json'))
const ledgerOld = readJson(path.join(OLD, 'content/library/activation/ledger.json'))
const libOld = readJson(path.join(OLD, 'content/library/library.json')).records
const { default: NL } = await imp(ROOT, 'src/data/library/newLibrary.js')

const oldConn = (id) => B.prepare({ ...libOld[id].content, id, system: libOld[id].system }, audit[id])
const newConn = (id) => {
  const r = R[id]
  let c = r.content
  if (revisions[id]) c = { ...c, title: revisions[id].revised.title, tiles: revisions[id].revised.tiles, explanation: revisions[id].revised.explanation, alternateNames: revisions[id].kind === 'wording' ? c.alternateNames : [] }
  if (copyEdits[id]) c = { ...c, title: copyEdits[id].title, explanation: copyEdits[id].explanation }
  return B.prepare({ ...c, id, system: r.system }, revisions[id] ? rerate[id] : audit[id])
}

function boardStats(boards, mk, reviews) {
  const ds = boards.map((ids) => ({ ids, d: B.describeBoard(ids.map(mk)), cs: ids.map(mk) }))
  const n = ds.length || 1
  const avg = (f) => Math.round((ds.reduce((a, x) => a + f(x), 0) / n) * 100) / 100
  const pct = (f) => Math.round((100 * ds.filter(f).length) / n)
  const rev = reviews ? ds.map((x) => reviews[[...x.ids].sort().join('+')]).filter(Boolean) : []
  const recMix = {}
  ds.forEach((x) => {
    const k = [x.cs.filter((c) => c.rec <= 1).length, x.cs.filter((c) => c.rec === 2).length, x.cs.filter((c) => c.rec >= 3).length].join('/')
    recMix[k] = (recMix[k] || 0) + 1
  })
  return {
    boards: ds.length,
    meanScore: avg((x) => x.d.score),
    groupsIsolatedByWordingPerBoard: avg((x) => x.d.surfaceIsolated.filter((s) => s.length).length),
    boardsWithAWordingGiveaway: pct((x) => x.d.surfaceIsolated.some((s) => s.length)),
    boardsWithASeriesGiveaway: pct((x) => x.d.surfaceIsolated.some((s) => s.some((l) => /series/.test(l)))),
    groupsIsolatedByTileKindPerBoard: avg((x) => x.d.kindIsolated.filter(Boolean).length),
    boardsThatSortByTileKind: pct((x) => x.d.kindSorted),
    boardsWith2PlusInstantGroups: pct((x) => x.cs.filter((c) => c.rec <= 1).length >= 2),
    boardsWith3PlusInstantGroups: pct((x) => x.cs.filter((c) => c.rec <= 1).length >= 3),
    boardsWithARecognition3PlusGroup: pct((x) => x.cs.some((c) => c.rec >= 3)),
    recognitionMix_instant_quick_reasoning: recMix,
    estimatedMixMeets1_2_1: pct((x) => x.d.counts[0] === 1 && x.d.counts[1] === 2 && x.d.counts[2] === 1),
    estimatedChallengingGroupPresent: pct((x) => x.d.counts[2] > 0),
    crossGroupLureTilesPerBoard: avg((x) => x.d.lure.reduce((a, b) => a + b, 0)),
    sharedAssociationHerringsPerBoard: avg((x) => x.d.herrings),
    possibleUnintendedGroups: ds.reduce((a, x) => a + x.d.bigClusters.length, 0),
    associationRisksOnBoard: ds.reduce((a, x) => a + x.d.risks.length, 0),
    automaticFlags: pct((x) => x.d.flags.length > 0),
    aiReview: rev.length ? { reviewed: rev.length, pass: rev.filter((r) => r.verdict === 'pass').length, competition: rev.reduce((m, r) => ((m[r.competition || 'n/a'] = (m[r.competition || 'n/a'] || 0) + 1), m), {}) } : null,
  }
}
const oldRevMap = Object.fromEntries(oldReview.map((b) => [b.key, b]))
out.daily.old = boardStats(ledgerOld.dailyBoards.map((b) => b.ids), oldConn, oldRevMap)
out.daily.new = boardStats(ledgerNew.dailyBoards.map((b) => b.ids), newConn, boardReview)
out.systems.starterOld = boardStats(Object.values(ledgerOld.starterBoards).flat().map((b) => b.ids), oldConn, oldRevMap)
out.systems.starterNew = boardStats(Object.values(ledgerNew.starterBoards).flat().map((b) => b.ids), newConn, boardReview)
out.systems.expansionOld = boardStats(ledgerOld.expansionBoards.map((b) => b.ids), oldConn, null)
out.systems.expansionNew = boardStats(ledgerNew.expansionBoards.map((b) => b.ids), newConn, boardReview)
out.systems.perSubject = {}
for (const s of NL.subjects) {
  const oldB = (ledgerOld.starterBoards[s] || []).map((b) => b.ids).concat(ledgerOld.expansionBoards.filter((b) => b.subject === s).map((b) => b.ids))
  const newB = (ledgerNew.starterBoards[s] || []).map((b) => b.ids).concat(ledgerNew.expansionBoards.filter((b) => b.subject === s).map((b) => b.ids))
  const o = boardStats(oldB, oldConn, null)
  const n = boardStats(newB, newConn, boardReview)
  out.systems.perSubject[s] = { boardsOld: o.boards, boardsNew: n.boards, wordingGiveawayOld: o.boardsWithAWordingGiveaway, wordingGiveawayNew: n.boardsWithAWordingGiveaway, kindIsolatedOld: o.groupsIsolatedByTileKindPerBoard, kindIsolatedNew: n.groupsIsolatedByTileKindPerBoard, instant2plusOld: o.boardsWith2PlusInstantGroups, instant2plusNew: n.boardsWith2PlusInstantGroups, aiReviewPassNew: n.aiReview ? `${n.aiReview.pass}/${n.aiReview.reviewed}` : 'n/a' }
}

// Every live board was reviewed and passed.
{
  const live = [...ledgerNew.dailyBoards, ...Object.values(ledgerNew.starterBoards).flat(), ...ledgerNew.expansionBoards]
  const missing = live.filter((b) => {
    const r = boardReview[[...b.ids].sort().join('+')]
    return !r || r.verdict !== 'pass'
  })
  check('every live Daily and Systems board passed the board fairness review', missing.length === 0, `${live.length} boards; ${missing.length} without a pass`)
  check('no live board has an association fairness risk', live.every((b) => !B.describeBoard(b.ids.map(newConn)).risks.length))
  check('no live board fails the structural checks (shared tiles, same relationship, reviewer instructions)', live.every((b) => !L.boardCheck(b.ids.map(newConn)).block.length))
  const seen = new Set()
  let dup = 0
  for (const b of ledgerNew.dailyBoards) for (const id of b.ids) (seen.has(id) ? dup++ : seen.add(id))
  check('no connection repeats across the Daily schedule', dup === 0)
  const tilesUnique = live.every((b) => new Set(b.ids.flatMap((id) => newConn(id).tiles.map(L.tileKey))).size === 16)
  check('16 distinct tiles on every board', tilesUnique)
  const used = new Set()
  let bad = 0
  for (const e of ledgerNew.expansionBoards) {
    for (const id of e.ids) {
      const day = ledgerNew.dailyBoards.findIndex((b) => b.ids.includes(id))
      if (day < 0 || day > e.releaseDay || used.has(id)) bad++
      used.add(id)
    }
  }
  check('Systems expansion never shows an unreleased Daily connection or reuses one', bad === 0)
}

// ---------------- content changes ----------------
{
  const by = (f) => revLog.reduce((m, r) => ((m[f(r)] = (m[f(r)] || 0) + 1), m), {})
  out.content.revisions = { proposed: revLog.length, outcome: by((r) => r.outcome), appliedByKind: by((r) => (r.outcome === 'applied' ? `${r.bank}:${r.kind}` : 'not applied')), cosmeticButCorrect: revLog.filter((r) => r.outcome === 'applied' && r.cosmetic).length }
  out.content.copyEdits = Object.keys(copyEdits).length
  const activeIds = Object.values(R).filter((r) => r.verification.approved && !r.problems.length && !r.heldFor.length && !r.duplicateOf && ['daily', 'systemsStarter'].includes(r.pool)).map((r) => r.id)
  out.content.activeConnections = activeIds.length
  out.content.revisedActive = activeIds.filter((id) => revisions[id]).length
  out.content.retainedUnchanged = activeIds.filter((id) => !revisions[id] && !copyEdits[id]).length
  const rec = (mk, ids) => ids.reduce((m, id) => ((m[Math.min(3, mk(id).rec)] = (m[Math.min(3, mk(id).rec)] || 0) + 1), m), {})
  out.content.recognitionBefore = rec(oldConn, activeIds)
  out.content.recognitionAfter = rec(newConn, activeIds)
  const served = Object.values(NL.connections)
  check('every served connection has a fuller explanation and a note for each tile', served.every((c) => c.detail && Array.isArray(c.tileNotes) && c.tileNotes.length === 4 && c.tileNotes.every(Boolean)), `${served.filter((c) => c.detail && c.tileNotes).length}/${served.length}`)
  check('no served connection is labeled human verified', served.every((c) => !c.review.humanVerified && !(c.explanationReview || {}).humanVerified))
  check('every revised connection carries the AI revision-check label', served.filter((c) => c.revision).every((c) => c.review.basis === 'ai-revision-check'))
check('no source references are shipped in the app', served.every((c) => !('source' in c) && !('sourceSection' in c)))
  const text = JSON.stringify(served.map((c) => [c.title, c.explanation, c.detail, c.tileNotes]))
  check('no em or en dashes in served text', !/[–—]/.test(text))
  check('no "the source" wording in served titles or explanations', !served.some((c) => /\bsource\b/i.test(`${c.title} ${c.explanation}`)))
}

// ---------------- timed: every 3 Minutes format ----------------
const NEWT = { engine: await imp(ROOT, 'src/utils/challengeEngine.js'), lib: await imp(ROOT, 'src/utils/timedLibrary.js'), race: await imp(ROOT, 'src/utils/raceEngine.js'), pa: await imp(ROOT, 'src/utils/puzzleAssembler.js') }
const OLDT = { engine: await imp(OLD, 'src/utils/challengeEngine.js'), lib: await imp(OLD, 'src/utils/timedLibrary.js'), race: await imp(OLD, 'src/utils/raceEngine.js') }
const PACING = await imp(ROOT, 'src/utils/timedPacing.js')
const meta = NEWT.lib.TIMED_META
const tierOfId = (id) => (meta[id] ? NEWT.lib.recognitionTier(meta[id].rec) : null)
const dominant = (id) => {
  const k = meta[id]?.kinds
  if (!k) return null
  const c = {}
  k.forEach((x) => (c[x] = (c[x] || 0) + 1))
  const [kind, n] = Object.entries(c).sort((a, b) => b[1] - a[1])[0]
  return n >= 3 ? kind : null
}
function roundInfo(r, bank) {
  const byTitle = (t) => bank.find((c) => c.title === t)
  const info = { shortcut: false, look: null, chars: 0, explained: !!(r.explanation && String(r.explanation).trim()), tier: null, kindMatch: null, sig: '' }
  const cat = r.categoryId ? bank.find((c) => c.id === r.categoryId) : null
  if (cat) info.tier = tierOfId(cat.id)
  const lookOf = (right, wrong) => (wrong.length ? wrong.reduce((a, w) => a + right.reduce((b, t) => b + S.lookAlike(w, t), 0) / right.length, 0) / wrong.length : null)
  switch (r.type) {
    case 'rapidAssociation':
    case 'linkTwo': {
      const right = r.options.filter((o) => o.correct).map((o) => o.text)
      const wrong = r.options.filter((o) => !o.correct).map((o) => o.text)
      info.shortcut = S.answerShortcuts(right, wrong).length > 0
      info.look = lookOf(right, wrong)
      info.chars = r.options.reduce((a, o) => a + o.text.length, 0) + String(r.anchor || r.prompt || '').length
      info.sig = r.categoryId + ':' + right.sort().join('|') + ':' + wrong.sort().join('|')
      break
    }
    case 'impostor': {
      const right = r.options.filter((o) => !o.correct).map((o) => o.text)
      info.shortcut = S.answerShortcuts(right, [r.correctAnswer]).length > 0
      info.look = lookOf(right, [r.correctAnswer])
      info.chars = r.options.reduce((a, o) => a + o.text.length, 0)
      info.sig = r.categoryId + ':' + r.correctAnswer
      break
    }
    case 'completeConnection': {
      const wrong = r.options.filter((o) => !o.correct).map((o) => o.text)
      info.shortcut = S.answerShortcuts([r.correctAnswer, ...r.shown], wrong).length > 0
      info.look = lookOf([r.correctAnswer, ...r.shown], wrong)
      info.chars = r.shown.join('').length + r.options.reduce((a, o) => a + o.text.length, 0)
      info.sig = r.categoryId + ':' + r.correctAnswer + ':' + wrong.sort().join('|')
      break
    }
    case 'commonLink': {
      const wrongTitles = r.options.filter((o) => !o.correct).map((o) => o.text)
      const leak = S.titleLeak(r.correctAnswer, r.shown)
      info.shortcut = leak.length > 0 && !wrongTitles.some((t) => leak.some((x) => S.words(t).includes(x)))
      const k = dominant(r.categoryId)
      const kinds = wrongTitles.map((t) => byTitle(t)).filter(Boolean).map((c) => dominant(c.id))
      info.kindMatch = k ? kinds.filter((x) => x === k).length / Math.max(1, kinds.length) : null
      info.chars = r.shown.join('').length + r.options.reduce((a, o) => a + o.text.length, 0)
      info.sig = r.categoryId + ':' + wrongTitles.sort().join('|')
      break
    }
    case 'miniConnections': {
      const a = bank.find((c) => c.id === r.groups.a.categoryId)
      const b = bank.find((c) => c.id === r.groups.b.categoryId)
      info.shortcut = S.boardSurface([a.tiles, b.tiles]).isolated.some((x) => x.length)
      info.kindMatch = dominant(a.id) && dominant(a.id) === dominant(b.id) ? 1 : 0
      info.tier = Math.max(tierOfId(a.id) ?? 1, tierOfId(b.id) ?? 1)
      info.chars = r.tiles.reduce((x, t) => x + t.text.length, 0)
      info.sig = [a.id, b.id].sort().join('+')
      info.explained = !!(r.groups.a.explanation && r.groups.b.explanation)
      break
    }
    case 'sameOrDifferent':
      info.chars = r.pair.join('').length + String(r.prompt).length
      info.sig = r.prompt + ':' + [...r.pair].sort().join('|')
      if (r.answer === 'different') info.look = S.lookAlike(r.pair[0], r.pair[1])
      if (!info.tier) info.tier = tierOfId(bank.find((c) => c.title === r.prompt)?.id)
      break
    case 'matchTheLink': {
      const cats = r.labels.map(byTitle).filter(Boolean)
        // Labels now come from four different systems on purpose (fairness);
      // the column is not meaningful here.
      info.kindMatch = null
      info.shortcut = r.concepts.some((t) => S.titleLeak(r.answer[t], [t]).length > 0)
      info.chars = r.concepts.join('').length + r.labels.join('').length
      info.sig = [...r.labels].sort().join('|') + ':' + [...r.concepts].sort().join('|')
      break
    }
    case 'doubleAgent':
      info.chars = r.options.reduce((a, o) => a + o.text.length, 0) + r.labelA.length + r.labelB.length
      info.sig = r.correctAnswer + ':' + r.labelA + ':' + r.labelB
      break
    case 'split':
      info.chars = r.tiles.reduce((a, t) => a + t.text.length, 0)
      info.sig = r.labelA
      break
    case 'chain':
    case 'completeTheChain':
      info.chars = (r.steps || r.sequence || []).filter(Boolean).join('').length
      info.sig = r.title + (r.missingIndex ?? '')
      break
  }
  return info
}
function timedStats(T, label) {
  const bank = T.lib.timedBank
  const types = T.engine.ROUND_TYPES
  const res = {}
  for (const type of types) {
    const rng = NEWT.pa.seededRng(`validate:${type}`)
    const infos = []
    let nulls = 0
    for (let i = 0; i < N; i++) {
      const r = T.engine.generateRound(bank, { rng, roundTypes: [type] })
      if (!r) {
        nulls++
        continue
      }
      infos.push(roundInfo(r, bank))
    }
    const n = infos.length || 1
    const mean = (f) => {
      const v = infos.map(f).filter((x) => x != null)
      return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null
    }
    const tiers = infos.reduce((m, x) => ((m[x.tier ?? 'n/a'] = (m[x.tier ?? 'n/a'] || 0) + 1), m), {})
    res[type] = {
      rounds: infos.length,
      couldNotBuild: nulls,
      wordingShortcutPct: Math.round((100 * infos.filter((x) => x.shortcut).length) / n),
      lookAlikeWrongAnswers: mean((x) => x.look),
      kindOrSubjectMatch: mean((x) => x.kindMatch),
      meanCharactersOnScreen: mean((x) => x.chars),
      distinctRoundsPct: Math.round((100 * new Set(infos.map((x) => x.sig)).size) / n),
      explainedPct: Math.round((100 * infos.filter((x) => x.explained).length) / n),
      tierMix: tiers,
    }
  }
  return res
}
out.timed.old = timedStats(OLDT, 'old')
out.timed.new = timedStats(NEWT, 'new')
out.timed.newTargets = (await imp(ROOT, 'src/utils/timedPacing.js')).TIMED_DIFFICULTY

// Cross-session repetition in 3 Minutes: five sessions of 12 rounds.
function sessions(T, useAvoid) {
  const bank = T.lib.timedBank
  const recentIds = []
  let repeats = 0
  let total = 0
  for (let s = 0; s < 5; s++) {
    const rng = NEWT.pa.seededRng(`sessions:${s}`)
    const used = new Set()
    let recent = []
    const avoid = new Set(recentIds)
    for (let i = 0; i < 12; i++) {
      const r = T.engine.composeNextRound(bank, { rng, recent, used, canonicalOf: T.lib.timedCanonicalId, ...(useAvoid ? { avoid } : {}) })
      if (!r) break
      T.engine.roundRelationships(r, bank, T.lib.timedCanonicalId).forEach((id) => used.add(id))
      recent = [{ type: r.type, systems: r.systems, conceptTags: r.conceptTags }, ...recent].slice(0, 3)
      const ids = [r.categoryId, r.groups?.a?.categoryId, r.groups?.b?.categoryId].filter(Boolean)
      for (const id of ids) {
        total++
        if (recentIds.includes(id)) repeats++
      }
      recentIds.unshift(...ids)
      recentIds.splice(60)
    }
  }
  return { categoriesServed: total, seenInTheLastFewSessionsPct: Math.round((100 * repeats) / Math.max(1, total)) }
}
out.timed.crossSessionOld = sessions(OLDT, false)
out.timed.crossSessionNew = sessions(NEWT, true)

// ---------------- Race ----------------
function raceStats(T, label) {
  const bank = T.lib.timedBank
  const curve = label === 'new' ? PACING.RACE_TIER_CURVE : null
  let deterministic = 0
  let repeatsInRace = 0
  let shortcut = 0
  let rounds = 0
  const tierAt = Array.from({ length: 10 }, () => ({}))
  const lengths = {}
  for (let i = 0; i < RACES; i++) {
    const code = T.race.makeJoinCode(NEWT.pa.seededRng(`code:${i}`))
    const a = T.race.buildRaceChallenge(bank, { code, canonicalOf: T.lib.timedCanonicalId })
    const b = T.race.buildRaceChallenge(bank, { code, canonicalOf: T.lib.timedCanonicalId })
    if (JSON.stringify(a) === JSON.stringify(b)) deterministic++
    lengths[a.length] = (lengths[a.length] || 0) + 1
    const rel = a.flatMap((r) => [...T.engine.roundRelationships(r, bank, T.lib.timedCanonicalId)])
    repeatsInRace += rel.length - new Set(rel).size
    a.forEach((r, k) => {
      const info = roundInfo(r, bank)
      rounds++
      if (info.shortcut) shortcut++
      const t = info.tier ?? 'n/a'
      tierAt[k][t] = (tierAt[k][t] || 0) + 1
    })
  }
  return { races: RACES, identicalForBothPlayersPct: Math.round((100 * deterministic) / RACES), raceLengths: lengths, relationshipRepeatsWithinARace: repeatsInRace, wordingShortcutPct: Math.round((100 * shortcut) / Math.max(1, rounds)), tierByRound: tierAt, curve }
}
out.race.old = raceStats(OLDT, 'old')
out.race.new = raceStats(NEWT, 'new')
check('Race: both players get the identical rounds for every sampled code', out.race.new.identicalForBothPlayersPct === 100)
check('Race: no relationship repeats inside a race', out.race.new.relationshipRepeatsWithinARace === 0)
{
  const hits = out.race.new.tierByRound.reduce((a, m, k) => a + (m[PACING.RACE_TIER_CURVE[k]] || 0), 0)
  out.race.new.curveAdherencePct = Math.round((100 * hits) / (RACES * 10))
}

// ---------------- separation, capacity, references ----------------
{
  const active = Object.values(R).filter((r) => r.verification.approved && !r.problems.length && !r.heldFor.length && !r.duplicateOf && ['daily', 'systemsStarter'].includes(r.pool)).map((r) => newConn(r.id))
  const timed = NEWT.lib.timedBank.filter((c) => c.status === 'verified')
  let overlap = 0
  for (const t of timed)
    for (const a of active) {
      const shared = t.tiles.filter((x) => a.tiles.some((y) => L.tileKey(x) === L.tileKey(y))).length
      if (shared >= 3) overlap++
    }
  check('timed play shares no group (3+ tiles) with an active Daily or Systems connection', overlap === 0, `${overlap} overlaps`)
  out.capacity = {
    activeConnections: active.length,
    servedConnections: Object.keys(NL.connections).length,
    servedBefore: Object.keys((await imp(OLD, 'src/data/library/newLibrary.js')).default.connections).length,
    dailyBoards: { before: ledgerOld.dailyBoards.length, after: ledgerNew.dailyBoards.length, runwayEnds: (() => { const d = new Date(Date.parse(NL.dailyStart) + (NL.dailyBoards.length - 1) * 864e5); return d.toISOString().slice(0, 10) })() },
    starterBoards: { before: Object.values(ledgerOld.starterBoards).flat().length, after: Object.values(ledgerNew.starterBoards).flat().length, perSubject: Object.fromEntries(NL.subjects.map((s) => [s, (NL.starterBoards[s] || []).length])) },
    expansionBoards: { before: ledgerOld.expansionBoards.length, after: ledgerNew.expansionBoards.length, waitingInQueues: Object.values(ledgerNew.expansionQueues || {}).flat().length },
    dailyLeftover: ledgerNew.dailyLeftover.length,
    timedCategories: { before: OLDT.lib.timedBank.filter((c) => c.status === 'verified').length, after: timed.length, withFourOrMoreNearMisses: timed.filter((c) => (c.nearMisses || []).length >= 4).length },
    boardsRejectedByReviewAndRebuilt: Object.values(boardReview).filter((b) => b.verdict === 'fail').length,
  }
  // References: every Daily date and Systems board builds a valid puzzle.
  const NLu = await imp(ROOT, 'src/utils/newLibrary.js')
  const { validatePuzzle } = await imp(ROOT, 'src/puzzles.js')
  let bad = 0
  for (let d = 0; d < NL.dailyBoards.length; d++) {
    const key = new Date(Date.parse(NL.dailyStart) + d * 864e5).toISOString().slice(0, 10)
    const p = NLu.getNewDailyPuzzle(key)
    if (!p || validatePuzzle(p).length) bad++
  }
  const endKey = new Date(Date.parse(NL.dailyStart) + NL.dailyBoards.length * 864e5).toISOString().slice(0, 10)
  for (const s of NL.subjects) NLu.systemsBoardsFor(s, endKey).forEach((b, i) => { const p = NLu.systemsBoardPuzzle(b, i); if (!p || validatePuzzle(p).length) bad++ })
  check('every Daily date and every Systems board builds a valid puzzle', bad === 0, `${bad} invalid`)
  // Epoch reset: old saves are cleared; cloud saves from before are ignored.
  const E = await imp(ROOT, 'src/utils/contentEpoch.js')
  for (const k of Object.keys(mem)) delete mem[k]
  mem['medconnections.dailyHistory.v1'] = '{"2026-10-13":{"completed":true}}'
  mem['medconnections.progress.daily-2026-10-13'] = '{}'
  mem['plexus.progression.v1'] = '{}'
  mem['medconnections.savedConnections.v1'] = '["X"]'
  const r1 = E.applyContentEpoch(globalThis.localStorage)
  const r2 = E.applyContentEpoch(globalThis.localStorage)
  check('content epoch: old puzzle progress cleared once, saved connections kept', r1.reset && !r2.reset && !mem['medconnections.dailyHistory.v1'] && !mem['medconnections.progress.daily-2026-10-13'] && !mem['plexus.progression.v1'] && mem['medconnections.savedConnections.v1'] === '["X"]')
  check('content epoch: a cloud save from before the rebuild is not merged back', !E.snapshotInEpoch({ dailyHistory: {} }) && E.snapshotInEpoch({ epoch: E.CONTENT_EPOCH }))
}

// ---------------- write ----------------
const DIR = path.join(ROOT, 'content/library/activation')
fs.writeFileSync(path.join(DIR, 'difficulty-validation.json'), JSON.stringify(out, null, 1) + '\n')
const md = []
const w = (s = '') => md.push(s)
const row = (cells) => w(`| ${cells.join(' | ')} |`)
w('# Difficulty rebuild: old vs new validation')
w()
w(`Generated by \`scripts/library/difficulty-validate.mjs\` (${N} rounds per timed format, ${RACES} races). ${out.caveat}`)
w()
w('## Daily and Systems boards')
w()
const keys = ['boards', 'boardsWithAWordingGiveaway', 'boardsWithASeriesGiveaway', 'groupsIsolatedByTileKindPerBoard', 'boardsThatSortByTileKind', 'boardsWith2PlusInstantGroups', 'boardsWith3PlusInstantGroups', 'boardsWithARecognition3PlusGroup', 'estimatedMixMeets1_2_1', 'crossGroupLureTilesPerBoard', 'sharedAssociationHerringsPerBoard', 'automaticFlags']
row(['', 'Daily old', 'Daily new', 'Starter old', 'Starter new', 'Expansion old', 'Expansion new'])
row(['---', '---', '---', '---', '---', '---', '---'])
for (const k of keys) row([k, out.daily.old[k], out.daily.new[k], out.systems.starterOld[k], out.systems.starterNew[k], out.systems.expansionOld[k], out.systems.expansionNew[k]])
row(['AI fairness review (pass/reviewed)', `${out.daily.old.aiReview?.pass}/${out.daily.old.aiReview?.reviewed}`, `${out.daily.new.aiReview?.pass}/${out.daily.new.aiReview?.reviewed}`, `${out.systems.starterOld.aiReview?.pass}/${out.systems.starterOld.aiReview?.reviewed}`, `${out.systems.starterNew.aiReview?.pass}/${out.systems.starterNew.aiReview?.reviewed}`, 'n/a', `${out.systems.expansionNew.aiReview?.pass}/${out.systems.expansionNew.aiReview?.reviewed}`])
w()
w('Percentages are of boards. "Instant" = audience recognition 1 in the content audit.')
w()
w('## 3 Minutes formats')
w()
row(['Format', 'Shortcut % old', 'new', 'Look-alike old', 'new', 'Kind/subject match old', 'new', 'Chars old', 'new', 'Distinct % old', 'new', 'Explained % old', 'new'])
row(Array(13).fill('---'))
for (const t of Object.keys(out.timed.new)) {
  const o = out.timed.old[t] || {}
  const n = out.timed.new[t]
  row([t, o.wordingShortcutPct ?? 'n/a', n.wordingShortcutPct, o.lookAlikeWrongAnswers ?? '', n.lookAlikeWrongAnswers ?? '', o.kindOrSubjectMatch ?? '', n.kindOrSubjectMatch ?? '', o.meanCharactersOnScreen ?? '', n.meanCharactersOnScreen ?? '', o.distinctRoundsPct ?? '', n.distinctRoundsPct, o.explainedPct ?? '', n.explainedPct])
}
w()
w(`Cross-session repetition (5 sessions of 12 rounds): old ${out.timed.crossSessionOld.seenInTheLastFewSessionsPct}% of categories had been seen in the previous sessions, new ${out.timed.crossSessionNew.seenInTheLastFewSessionsPct}%.`)
w()
w('## Race')
w()
w(`- Identical rounds for both players: old ${out.race.old.identicalForBothPlayersPct}%, new ${out.race.new.identicalForBothPlayersPct}% of ${RACES} codes.`)
w(`- Relationship repeats inside a race: old ${out.race.old.relationshipRepeatsWithinARace}, new ${out.race.new.relationshipRepeatsWithinARace}.`)
w(`- Wording shortcut rounds: old ${out.race.old.wordingShortcutPct}%, new ${out.race.new.wordingShortcutPct}%.`)
w(`- New difficulty curve ${JSON.stringify(out.race.new.curve)}; rounds landing on their planned tier: ${out.race.new.curveAdherencePct}%.`)
w()
w('## Capacity')
w()
w('```json')
w(JSON.stringify(out.capacity, null, 1))
w('```')
w()
w('## Content')
w()
w('```json')
w(JSON.stringify(out.content, null, 1))
w('```')
w()
w('## Checks')
w()
for (const c of out.checks) w(`- ${c.pass ? 'PASS' : 'FAIL'}: ${c.name}${c.detail ? ` (${c.detail})` : ''}`)
fs.writeFileSync(path.join(DIR, 'difficulty-validation.md'), md.join('\n') + '\n')
const failed = out.checks.filter((c) => !c.pass)
console.log(md.join('\n'))
if (failed.length) process.exit(1)
