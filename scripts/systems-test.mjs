// Systems queue rotation and attempt-based XP, against the real store.
//   node scripts/systems-test.mjs
const store = {}
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] }
const { pinTimeZoneForTesting } = await import('../src/utils/calendar.js')
pinTimeZoneForTesting('America/Los_Angeles')
const S = await import('../src/progression/store.js')
const E = await import('../src/progression/engine.js')
const { subjectProgress, systemsBoardsFor } = await import('../src/utils/newLibrary.js')
const { recordSystemsBoardFinish, getSystemsBoards, setSystemsBoards } = await import('../src/utils/storage.js')

let failed = 0
let passed = 0
const ok = (c, m) => {
  if (c) passed++
  else {
    failed++
    console.log('  FAIL -', m)
  }
}
let now = Date.parse('2026-10-20T10:00:00-07:00')
Date.now = () => now
const tick = (ms = 60000) => (now += ms)
const reset = () => {
  for (const k of Object.keys(store)) delete store[k]
  S.ensureProgression()
}
const TODAY = '2026-10-20'
const SUBJ = 'Cardiology'
const boards = systemsBoardsFor(SUBJ, TODAY)
const puzzleOf = (b) => ({ id: b.id, categories: [{ level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }] })
const allGroups = [0, 1, 2, 3].map((ci) => ({ correct: true, catIndexes: [ci, ci, ci, ci] }))
const xp = () => E.totalXp(S.loadProgression())
const progress = () => subjectProgress(SUBJ, TODAY, getSystemsBoards(), S.systemAttempts(getSystemsBoards()))
let att = 0
// One attempt on a board, the way App does it: mark at the first guess, then finish.
function attempt(b, won, { guesses = true } = {}) {
  tick()
  if (guesses) S.recordSystemAttemptStart({ boardId: b.id, attemptId: `${b.id}:${++att}`, system: SUBJ })
  if (!guesses) return null
  const tries = S.systemAttempts(getSystemsBoards())[b.id]?.count || 1
  const finished = won ? recordSystemsBoardFinish(b.id, { won, mistakes: 1, subject: SUBJ }) : getSystemsBoards()
  const p = subjectProgress(SUBJ, TODAY, finished)
  return S.recordSystemFinish({ puzzle: puzzleOf(b), system: SUBJ, won, guessLog: won ? allGroups : allGroups.slice(0, 1), boardId: b.id, attempts: tries, systemComplete: won && p.completed >= p.total })
}

console.log(`[1] Queue: ${boards.length} ${SUBJ} boards; leaving or losing rotates, opening alone does not`)
reset()
ok(progress().next.board.id === boards[0].id, 'starts at board 1')
attempt(boards[0], false, { guesses: false })
ok(progress().next.board.id === boards[0].id, 'opening and leaving without a guess is not an attempt (board 1 still next)')
ok(!S.systemAttempts(getSystemsBoards())[boards[0].id], 'no attempt recorded')
const x0 = xp()
const r = attempt(boards[0], false)
ok(xp() === x0 && r.gained === 0, 'a lost board pays no XP (no partial group XP)')
ok(!getSystemsBoards()[boards[0].id], 'a lost board is not marked complete')
ok(progress().next.board.id === boards[1].id, 'the lost board goes to the back: board 2 is next')
ok(progress().queue.at(-1).board.id === boards[0].id, 'board 1 is last in the queue')
attempt(boards[1], false)
ok(progress().queue.map((q) => q.index).join() === [2, 3, 4, 0, 1].slice(0, boards.length).join(), 'never-tried boards first, then by when they were tried: ' + progress().queue.map((q) => q.index + 1).join(','))
ok(S.recordSystemAttemptStart({ boardId: boards[1].id, attemptId: `${boards[1].id}:${att}` }) === false, 'the same attempt id is never counted twice (refresh or resume)')

console.log('[2] XP by attempt: 100 / 75 / 50 / 25, once per board')
reset()
const results = []
for (let n = 1; n <= 4; n++) {
  const b = boards[n - 1]
  for (let k = 1; k < n; k++) attempt(b, false)
  const before = xp()
  const res = attempt(b, true)
  results.push(res.gained === xp() - before ? xp() - before : -1)
  ok(res.attemptNumber === n, `board ${n} solved on try ${n}`)
}
ok(JSON.stringify(results) === '[100,75,50,25]', 'XP per try: ' + JSON.stringify(results))
{
  const b = boards[4]
  for (let k = 0; k < 6; k++) attempt(b, false)
  const before = xp()
  attempt(b, true)
  // b is the last board: the subject bonus lands with it.
  ok(xp() - before === 25 + 300, 'try 7 still pays 25 (plus the subject bonus on the last board): ' + (xp() - before))
}
{
  const before = xp()
  const again = attempt(boards[0], true)
  ok(xp() === before && again.gained === 0, 'replaying a solved board pays nothing')
  ok(S.recordSystemAttemptStart({ boardId: boards[0].id, attemptId: 'replay-1' }) === false, 'replays of solved boards are not counted as attempts')
}

console.log('[3] Completion: subject bonus and the celebration flag, once')
reset()
let lastRes = null
boards.forEach((b) => (lastRes = attempt(b, true)))
ok(lastRes.connectedNow === true && lastRes.lines.some(([l, v]) => /complete/.test(l) && v === 300), 'solving the last board completes the subject once (+300, celebrate)')
ok(progress().next === null && progress().completed === boards.length, 'nothing left in the queue')
const again2 = attempt(boards[2], true)
ok(!again2.connectedNow && again2.gained === 0, 'no second celebration or bonus')

console.log('[4] Losses never complete a subject (was a loophole)')
reset()
boards.forEach((b) => attempt(b, false))
ok(progress().completed === 0 && progress().next, 'losing every board completes nothing')
ok(!Object.keys(S.loadProgression().ledger).some((k) => k.startsWith('system:')), 'no subject bonus for losses')

console.log('[5] Only one unsolved board left: it is next, straight away')
reset()
boards.slice(0, -1).forEach((b) => attempt(b, true))
const last = boards.at(-1)
attempt(last, false)
ok(progress().queue.length === 1 && progress().next.board.id === last.id, 'the last unsolved board is offered again at once')

console.log('[6] Earlier players: old losses count as a try, earlier XP is kept and not paid twice')
reset()
{
  const b = boards[0]
  // Old rules: a lost board was saved as finished (won: false) and paid group XP.
  setSystemsBoards({ [b.id]: { finishedAt: new Date(now - 86400000).toISOString(), won: false, subject: SUBJ } })
  const st = S.loadProgression()
  E.award(st, { id: `conn:${b.id}:0`, xp: 5, kind: 'sysconn', at: now - 86400000 })
  E.award(st, { id: `conn:${b.id}:1`, xp: 10, kind: 'sysconn', at: now - 86400000 })
  S.saveProgression(st)
  const before = xp()
  ok(progress().completed === 0 && progress().queue.some((q) => q.board.id === b.id), 'an old lost board is back in rotation, not complete')
  ok(progress().next.board.id !== b.id, 'and it waits behind boards never tried')
  const res = attempt(b, true)
  ok(res.attemptNumber === 2 && xp() - before === 75 - 15, `solved on try 2: 75 minus the 15 already earned = ${xp() - before}`)
  ok(xp() >= before, 'nothing earned before is taken away')
}
{
  // An old WON board keeps its XP and is not paid again.
  reset()
  const b = boards[1]
  setSystemsBoards({ [b.id]: { finishedAt: new Date(now).toISOString(), won: true, subject: SUBJ } })
  const st = S.loadProgression()
  E.award(st, { id: `syspuzzle:${b.id}`, xp: 50, kind: 'syspuzzle', at: now })
  S.saveProgression(st)
  const before = xp()
  attempt(b, true)
  ok(xp() === before, 'a board solved under the old rules pays nothing more')
}

console.log('[7] Two devices: attempts merge by id, so the count survives a device switch')
reset()
{
  const b = boards[0]
  S.recordSystemAttemptStart({ boardId: b.id, attemptId: 'phone-1' })
  const phone = S.loadProgression()
  reset()
  S.recordSystemAttemptStart({ boardId: b.id, attemptId: 'laptop-1' })
  const laptop = S.loadProgression()
  S.replaceProgression(E.mergeStates(phone, laptop))
  ok(S.systemAttempts({})[b.id].count === 2, 'attempts from both devices count after a sync')
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL SYSTEMS CHECKS PASSED'} (${passed} passed)`)
process.exit(failed ? 1 : 0)
