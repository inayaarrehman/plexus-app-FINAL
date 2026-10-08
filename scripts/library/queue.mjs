// ---------------------------------------------------------------------
// Pending-review queue and status counts for the staged library.
// ---------------------------------------------------------------------
// Rebuilt on every import and written to content/library/review-queue.json
// and review-queue.md. Issues are kept in separate categories so they can be
// worked through independently:
//   1. medical / source holds   rows not yet eligible (e.g. a revision whose
//                               final tile is not supported by its cited source)
//   2. duplicate decisions      possible duplicates inside the new library
//   3. timed-library overlaps   new connections that may repeat a timed entry
//   4. board ambiguity reviews  starter boards that pass structure but have flags
//   5. blocked boards           starter boards that no longer pass
//   6. difficulty calibration   notes about how hard a connection plays
import * as L from './lib.mjs'

const REL = { CAUSE: 'causes of', FIND: 'findings / associations of' }
export function relationshipLabel(title) {
  const k = L.subjectKey(title).split(' ').filter(Boolean)
  const rel = k.filter((w) => REL[w]).map((w) => REL[w])
  const topic = L.topicKey(title)
  return `${rel.length ? rel.join(' + ') + ' ' : ''}${topic}`.trim()
}
function sharedRelationship(a, b, m) {
  const ra = relationshipLabel(a.title)
  const rb = relationshipLabel(b.title)
  const bits = []
  if (m.sameSubject || ra === rb) bits.push(`both are "${ra}"`)
  else bits.push(`"${ra}" vs "${rb}"`)
  if (m.shared) bits.push(`${m.shared} of 4 tiles identical`)
  if (m.wordSim >= 0.6) bits.push(`tile wording ${Math.round(m.wordSim * 100)}% the same`)
  return bits.join('; ')
}
const side = (c, where) => ({ id: c.id, library: where, system: c.system || c.primarySystem || null, title: c.title, tiles: c.tiles, status: c.status || null })

export function buildQueue({ state, records, within, timedBank, eligible }) {
  const byId = (id) => state.records[id]
  const conn = (r) => ({ ...r.content, id: r.id, system: r.system, tiles: r.content.tiles || [] })
  const q = { generatedAt: state.updatedAt, active: false, medicalHolds: [], duplicateDecisions: [], timedOverlaps: [], boardReviews: [], blockedBoards: [], difficultyWarnings: [] }

  for (const r of records)
    if (r.verification.state === 'held' || r.verification.state === 'unresolved' || r.verification.state === 'missing')
      q.medicalHolds.push({ id: r.id, system: r.system, title: r.content.title, tiles: r.content.tiles, status: r.verification.status, issue: r.verification.outstanding || `Label "${r.verification.status ?? '(none)'}" is not eligible under the status map.` })

  for (const w of within) {
    if (w.kind !== 'uncertain' && !(w.kind === 'same' && !w.decided)) continue
    const a = conn(byId(w.a))
    const b = conn(byId(w.b))
    const held = byId(w.a).heldFor.length ? w.a : byId(w.b).heldFor.length ? w.b : null
    q.duplicateDecisions.push({
      key: L.pairKey(w.a, w.b),
      kind: w.kind === 'same' ? 'treated as the same relationship (set aside); confirm' : 'possible duplicate (held)',
      held: held,
      sharedRelationship: sharedRelationship(a, b, w),
      a: side(a, 'new'),
      b: side(b, 'new'),
      decide: `decisions.json → pairs → "${L.pairKey(w.a, w.b)}": "same" or "distinct"`,
    })
  }

  const timedById = new Map(timedBank.map((t) => [t.id, t]))
  for (const r of records) {
    for (const [list, kind] of [
      [r.timedUncertain, 'possible repeat of a timed entry'],
      [r.timedSame, 'same relationship as a timed entry (timed entry to be excluded at activation)'],
    ])
      for (const t of list) {
        const tc = timedById.get(t.id)
        const m = L.compare(conn(r), tc)
        q.timedOverlaps.push({
          key: L.pairKey(r.id, t.id),
          kind,
          sharedRelationship: sharedRelationship(conn(r), tc, m),
          a: side(conn(r), 'new'),
          b: side({ ...tc, system: tc.primarySystem }, 'timed'),
          decide: kind.startsWith('possible') ? `decisions.json → pairs → "${L.pairKey(r.id, t.id)}": "same" (exclude timed entry at activation) or "distinct"` : 'no decision needed unless you disagree',
        })
      }
  }

  for (const [sys, boards] of Object.entries(state.starterBoards))
    for (const b of boards) {
      const members = b.ids.map((id) => byId(id)).filter(Boolean)
      const entry = { board: b.id, system: sys, signature: b.signature, connections: members.map((r) => ({ id: r.id, title: r.content.title, difficulty: r.content.difficulty, tiles: r.content.tiles })) }
      if (b.status === 'review') q.boardReviews.push({ ...entry, flags: b.flags, clear: `decisions.json → boards → "${b.id}": "cleared:${b.signature}"` })
      if (b.status === 'blocked') q.blockedBoards.push({ ...entry, block: b.block, fix: `fix the content, or decisions.json → boards → "${b.id}": "rebuild"` })
      for (const r of members) for (const note of r.difficultyWarnings || []) q.difficultyWarnings.push({ id: r.id, title: r.content.title, difficulty: r.content.difficulty, board: b.id, note })
    }
  for (const r of records)
    if (!r.starterBoard) for (const note of r.difficultyWarnings || []) q.difficultyWarnings.push({ id: r.id, title: r.content.title, difficulty: r.content.difficulty, board: null, note })
  return q
}

const tilesLine = (t) => (t || []).join(' · ')
export function queueMarkdown(q) {
  const out = []
  const s = (x = '') => out.push(x)
  s('# Plexus new library: pending review queue')
  s()
  s(`Generated ${q.generatedAt}. Staging only; the library is not active and the live app is unchanged.`)
  s()
  s(`| Category | Open |`)
  s(`|---|---|`)
  s(`| Medical / source holds | ${q.medicalHolds.length} |`)
  s(`| Duplicate decisions (new library) | ${q.duplicateDecisions.length} |`)
  s(`| Timed-library overlaps | ${q.timedOverlaps.filter((x) => x.kind.startsWith('possible')).length} to decide, ${q.timedOverlaps.filter((x) => !x.kind.startsWith('possible')).length} recorded |`)
  s(`| Board ambiguity reviews | ${q.boardReviews.length} |`)
  s(`| Blocked boards | ${q.blockedBoards.length} |`)
  s(`| Difficulty calibration warnings | ${q.difficultyWarnings.length} |`)
  s()
  s('## 1. Medical / source holds')
  if (!q.medicalHolds.length) s('None.')
  for (const h of q.medicalHolds) {
    s(`### ${h.id} · ${h.title} (${h.system}, ${h.status})`)
    s(`Tiles: ${tilesLine(h.tiles)}`)
    s()
    s(`Issue: ${h.issue}`)
    s()
  }
  const pair = (x) => {
    s(`### ${x.a.title}  /  ${x.b.title}`)
    s(`${x.kind}. Shared relationship: ${x.sharedRelationship}.`)
    s()
    s(`| | ${x.a.id} (${x.a.library}${x.a.system ? ', ' + x.a.system : ''}) | ${x.b.id} (${x.b.library}${x.b.system ? ', ' + x.b.system : ''}) |`)
    s(`|---|---|---|`)
    s(`| Title | ${x.a.title} | ${x.b.title} |`)
    for (let i = 0; i < 4; i++) s(`| Tile ${i + 1} | ${x.a.tiles[i] ?? ''} | ${x.b.tiles[i] ?? ''} |`)
    s(`| Status | ${x.a.status ?? ''} | ${x.b.status ?? ''} |`)
    s()
    if (x.held) s(`Held until decided: ${x.held}.`)
    s(`Decide: ${x.decide}`)
    s()
  }
  s('## 2. Duplicate decisions (new library)')
  if (!q.duplicateDecisions.length) s('None.')
  q.duplicateDecisions.forEach(pair)
  s('## 3. Timed-library overlaps')
  if (!q.timedOverlaps.length) s('None.')
  q.timedOverlaps.forEach(pair)
  s('## 4. Board ambiguity reviews')
  if (!q.boardReviews.length) s('None.')
  for (const b of q.boardReviews) {
    s(`### ${b.board} (${b.system})`)
    for (const c of b.connections) s(`- ${c.id} ${c.title} [${c.difficulty}]: ${tilesLine(c.tiles)}`)
    for (const f of b.flags) s(`- Flag: ${f}`)
    s(`- Clear: ${b.clear}`)
    s()
  }
  s('## 5. Blocked boards')
  if (!q.blockedBoards.length) s('None.')
  for (const b of q.blockedBoards) {
    s(`### ${b.board} (${b.system})`)
    for (const c of b.connections) s(`- ${c.id} ${c.title}: ${tilesLine(c.tiles)}`)
    for (const f of b.block) s(`- Blocked: ${f}`)
    s(`- Fix: ${b.fix}`)
    s()
  }
  s('## 6. Difficulty calibration warnings')
  s('Separate from medical and ambiguity issues. These do not block a board.')
  s()
  if (!q.difficultyWarnings.length) s('None.')
  for (const d of q.difficultyWarnings) s(`- ${d.id} ${d.title} [${d.difficulty}]${d.board ? ` on ${d.board}` : ' (Daily pool)'}: "${d.note}"`)
  return out.join('\n') + '\n'
}

// Per-system status counts that keep review outcome and current usability
// apart.
export function systemCounts(records, sys, eligible) {
  const mine = records.filter((r) => !sys || r.system === sys)
  const passed = mine.filter((r) => r.verification.approved)
  return {
    rows: mine.length,
    passedReview: passed.length,
    passedReviewHuman: passed.filter((r) => r.verification.humanVerified).length,
    passedReviewAi: passed.filter((r) => !r.verification.humanVerified).length,
    heldMedical: mine.filter((r) => ['held', 'unresolved', 'missing'].includes(r.verification.state)).length,
    rejected: mine.filter((r) => r.verification.state === 'rejected').length,
    needsFix: mine.filter((r) => r.problems.length).length,
    heldDuplicate: passed.filter((r) => r.heldFor.length).length,
    setAsideDuplicate: passed.filter((r) => r.duplicateOf).length,
    usable: mine.filter(eligible).length,
    starter: mine.filter((r) => r.pool === 'systemsStarter').length,
    daily: mine.filter((r) => r.pool === 'daily').length,
  }
}
