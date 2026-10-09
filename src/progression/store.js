// ---------------------------------------------------------------------
// Progression store: the only place that reads/writes progression state.
// ---------------------------------------------------------------------
// Each record* function loads the state, adds awards under stable ids, runs
// the follow-ups (level rewards, streak milestones, This Week), saves, and
// returns a summary the UI can show (XP gained, level change, items received). Calling any of them twice for the same event is harmless.

import {
  XP,
  STREAK_MILESTONES,
  levelRewards,
  nextLevelReward,
  KIT,
  PUZZLE_TOOLS,
  REMOVED_TOOLS,
  STARTER_GIFT,
  COVERAGE_EVERY,
} from './config.js'
import {
  emptyState,
  normalize,
  award,
  grant,
  useItem,
  mark,
  heldOf,
  totalXp,
  levelInfo,
  kitCounts,
  pendingClaims,
  claimPending,
  roundsProgress,
  weeklyChoicesDue,
  itemOpen,
  weekOf,
  localDayKey,
  entryDay,
} from './engine.js'
import { currentStreak, longestStreak, coverGaps, isStreakDay, finishedOnDate, addDays as addDayKey } from './streak.js'
import { weekdayOf } from '../utils/calendar.js'

const KEY = 'plexus.progression.v1'

export function loadProgression() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalize(JSON.parse(raw)) : emptyState()
  } catch {
    return emptyState()
  }
}
export function saveProgression(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage unavailable: progression still works for this session
  }
  return state
}
export function replaceProgression(state) {
  return saveProgression(normalize(state))
}

export function shieldedDates(state) {
  const set = new Set()
  for (const u of Object.values(state.kit.uses)) if (u.item === 'shield' && u.m?.date) set.add(u.m.date)
  return set
}

export function streakInfo(state, history, todayKey) {
  const shielded = shieldedDates(state)
  const pendingShield = kitCounts(state).shield || 0
  return {
    current: currentStreak(history, todayKey, { shielded, pendingShield }),
    longest: longestStreak(history, { shielded }),
    week: streakWeek(history, todayKey, shielded),
  }
}

// This week, Monday to Sunday in the player's own calendar, judged by the
// same rule the streak count uses: a day is `done` when its Daily was won and
// finished on that date (isStreakDay), `covered` when a Coverage kept the
// streak for it. Nothing here is stored; it is read from the Daily history.
export function streakWeek(history, todayKey, shielded = new Set()) {
  const h = history || {}
  const monday = addDayKey(todayKey, -weekdayOf(todayKey))
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDayKey(monday, i)
    const done = isStreakDay(h[key], key)
    return { key, done, covered: !done && shielded.has(key), today: key === todayKey, future: key > todayKey }
  })
}

// ---- Your Tools start (runs once per save, safe to repeat) ----
// XP earned before the economy started, i.e. under the old reward schedule.
function xpBefore(state, at) {
  let t = 0
  for (const e of Object.values(state.ledger)) if ((e.at || 0) < at) t += e.xp || 0
  return t
}
export function ensureV2(state, now = Date.now(), ctx = null) {
  if (!state.v2) state.v2 = { at: now, coverageFrom: now, levelFrom: 1, converted: {} }
  const v2 = state.v2
  // Levels already reached before this version keep what they were given
  // then; the new schedule pays only levels above them. Recomputed every time
  // so a fresh device that synced an older save afterwards can't pay twice.
  const before = xpBefore(state, v2.at)
  v2.levelFrom = Math.max(v2.levelFrom || 1, levelInfo(before).level)
  // A brand-new player (nothing earned before) gets one Consult, once.
  const hadOld = before > 0 || Object.values(state.kit.grants).some((g) => (g.at || 0) < v2.at)
  if (!hadOld) STARTER_GIFT.forEach((item, i) => grant(state, { id: `starter:${i}`, item, source: 'starter', at: v2.at }))
  // Removed tools convert 1:1 (owner's decision). Ids count up per held
  // unit, so repeating this, or syncing with another device, never converts
  // the same unit twice. The original grants stay in the save as a record.
  for (const [old, to] of Object.entries(REMOVED_TOOLS)) {
    const held = heldOf(state, old)
    for (let n = 1; n <= held; n++) {
      const r = grant(state, { id: `convert:${old}:${n}`, item: to, source: `convert:${old}`, at: now })
      if (r && ctx?.grants) ctx.grants.push(to)
    }
    v2.converted[old] = Math.max(v2.converted[old] || 0, held)
  }
  return state
}

// ---- follow-ups run after every batch of awards ----
function payLevels(state, ctx, now) {
  const info = levelInfo(totalXp(state))
  for (let L = Math.max(2, (state.v2.levelFrom || 1) + 1); L <= info.level; L++) {
    levelRewards(L).forEach((item, i) => {
      const r = grant(state, { id: `lvl2:${L}:${i}`, item, source: 'level', at: now })
      if (r && ctx.grants) ctx.grants.push(item)
      if (r === 'pending' && ctx.pending) ctx.pending.push(item)
    })
  }
  return info
}
// Distinct scheduled Dailies completed since Coverage counting began.
export function coverageProgress(state) {
  const from = state.v2?.coverageFrom ?? Infinity
  const count = Object.values(state.ledger).filter((e) => e.kind === 'daily' && (e.at || 0) >= from).length
  return { count, every: COVERAGE_EVERY, earned: Math.floor(count / COVERAGE_EVERY), toNext: COVERAGE_EVERY - (count % COVERAGE_EVERY) }
}
function followUps(state, ctx) {
  const now = ctx.at || Date.now()
  ensureV2(state, now, ctx)
  const info = payLevels(state, ctx, now)
  // Coverage: one per COVERAGE_EVERY scheduled Dailies.
  const cov = coverageProgress(state)
  for (let k = 1; k <= cov.earned; k++) {
    const r = grant(state, { id: `coverage:${k}`, item: 'shield', source: 'coverage', at: now })
    if (r && ctx.grants) ctx.grants.push('shield')
    if (r === 'pending' && ctx.pending) ctx.pending.push('shield')
  }
  // This Week: any two goals pays 250 XP once, plus a tool the player picks.
  const rp = roundsProgress(state, now)
  if (rp.complete && !rp.paid) {
    ctx.gained += award(state, { id: `rounds:${rp.week.key}`, xp: XP.rounds, kind: 'rounds', at: now })
    ctx.lines.push(['This Week', XP.rounds])
    ctx.weeklyChoice = rp.week.key
    // This Week XP can itself cross a level.
    if (levelInfo(totalXp(state)).level > info.level) payLevels(state, ctx, now)
  }
}

function run(fn) {
  const state = loadProgression()
  const before = levelInfo(totalXp(state))
  const ctx = { gained: 0, lines: [], grants: [], pending: [], at: Date.now() }
  fn(state, ctx)
  followUps(state, ctx)
  const after = levelInfo(totalXp(state))
  state.seen.level = Math.max(state.seen.level, after.level)
  saveProgression(state)
  return {
    gained: ctx.gained,
    lines: ctx.lines.filter((l) => l[1] > 0),
    grants: ctx.grants,
    pending: ctx.pending,
    coverageUsed: ctx.shieldUsed || [],
    weeklyChoice: ctx.weeklyChoice || null,
    attemptNumber: ctx.attemptNumber ?? null,
    connectedNow: !!ctx.connectedNow,
    before,
    after,
    levelUp: after.level > before.level,
    rounds: roundsProgress(state),
  }
}

// ---- Daily (today or Archive) ----
// Call only for a FIRST finish of that date (App.handleFinish already knows).
export function recordDailyFinish({ dateKey, isToday, puzzle, won, mistakes, guessLog, toolsUsed = 0, history }) {
  return run((state, ctx) => {
    const at = ctx.at
    if (isToday) {
      ctx.gained += award(state, { id: `daily:${dateKey}`, xp: XP.daily, kind: 'daily', at })
      ctx.lines.push(['Daily', XP.daily])
    } else {
      ctx.gained += award(state, { id: `archive:${dateKey}`, xp: XP.archive, kind: 'archive', at })
      ctx.lines.push(['Archive Daily', XP.archive])
    }
    let conn = 0
    guessLog.filter((g) => g.correct).forEach((g) => {
      const ci = g.catIndexes[0]
      const level = puzzle.categories[ci]?.level
      const xp = XP.connection[level] || 0
      conn += award(state, { id: `conn:${puzzle.id}:${ci}`, xp, kind: 'conn', at, m: { level } })
    })
    ctx.gained += conn
    ctx.lines.push(['Connections', conn])
    // Perfect: won with no mistakes and no tools. Restoring a mistake with
    // Second Opinion keeps the mistake on record, so it is never perfect.
    if (isToday && won && mistakes === 0 && toolsUsed === 0) {
      const p = award(state, { id: `perfect:${dateKey}`, xp: XP.perfect, kind: 'perfect', at })
      ctx.gained += p
      ctx.lines.push(['Perfect', p])
    }
    if (isToday && history) {
      // Coverage: when today is finished after missed days, each charge
      // covers one missed day (oldest first, adjacent to the streak). Uses
      // are keyed by the covered date, so two devices or a re-sync can never
      // spend twice for the same day. Covering a day pays nothing.
      const shielded = shieldedDates(state)
      if (isStreakDay(history[dateKey], dateKey)) {
        const gaps = coverGaps(history, dateKey, shielded, kitCounts(state).shield || 0)
        for (const gap of gaps) {
          if (useItem(state, { id: `shield:${gap}`, item: 'shield', at, m: { date: gap } })) {
            ;(ctx.shieldUsed ||= []).push(gap)
            shielded.add(gap)
          }
        }
      }
      const streak = currentStreak(history, dateKey, { shielded })
      STREAK_MILESTONES.forEach((ms) => {
        if (streak >= ms.days) {
          const got = award(state, { id: `streak:${ms.days}`, xp: ms.xp, kind: 'streak', at })
          if (got) {
            ctx.gained += got
            ctx.lines.push([`${ms.days} day streak`, got])
          }
        }
      })
    }
  })
}

// ---- Systems puzzle ----
// ---- Systems ----
// An attempt is one visit to an unsolved board in which at least one guess
// was submitted. It is marked once per attempt id (the id is saved with the
// board, so a refresh or resume is the same attempt) and synced like the rest
// of the ledger, so leaving and reopening, or switching devices, never resets
// the count. Opening a board and leaving without a guess is not an attempt.
export function recordSystemAttemptStart({ boardId, attemptId, system = null }) {
  if (!boardId || !attemptId) return false
  const state = loadProgression()
  if (state.ledger[`syspuzzle:${boardId}`]) return false // already solved: replays are not attempts
  const ok = mark(state, { id: `sysattempt:${boardId}:${attemptId}`, kind: 'sysattempt', at: Date.now(), m: { board: boardId, system } })
  if (ok) saveProgression(state)
  return ok
}
// Attempts per board: { [boardId]: { count, last } }. `legacy` (the old
// finished-boards map) counts a board lost before attempts were tracked as
// one earlier attempt, at its finish time.
export function systemAttempts(legacy = {}) {
  const state = loadProgression()
  const out = {}
  for (const e of Object.values(state.ledger)) {
    if (e.kind !== 'sysattempt' || !e.m?.board) continue
    const o = (out[e.m.board] ||= { count: 0, last: 0 })
    o.count += 1
    o.last = Math.max(o.last, e.at || 0)
  }
  // Losses are no longer written to that map, so an unsolved entry there is
  // always from before this change.
  for (const [id, b] of Object.entries(legacy || {})) {
    if (!b || b.won) continue
    const o = (out[id] ||= { count: 0, last: 0 })
    o.count += 1
    o.last = Math.max(o.last, Date.parse(b.finishedAt || '') || 1)
  }
  return out
}
export function systemSolved(boardId) {
  return !!loadProgression().ledger[`syspuzzle:${boardId}`]
}
// XP for solving a board on attempt n (1-based).
export const attemptXp = (n) => XP.systemAttempt[Math.min(Math.max(1, n), XP.systemAttempt.length) - 1]

// A Systems board finished. XP only when it is solved, once per board, by the
// attempt that solved it. XP a board earned under the old rules (group XP from
// a lost game) counts toward that amount, so nothing is paid twice and
// nothing already earned is taken away. A lost game pays nothing and reveals
// nothing; the board goes back into rotation. `systemComplete` (every board
// solved) pays the subject bonus once, and `connectedNow` reports the first
// time a subject is fully solved, for the completion celebration.
export function recordSystemFinish({ puzzle, system, won, guessLog, systemComplete = false, boardId = null, attempts = null }) {
  return run((state, ctx) => {
    const at = ctx.at
    const id = boardId || puzzle.id
    ctx.attemptNumber = null
    if (!won) return
    // This Week: a solved board counts once per board per week, replays included.
    mark(state, { id: `sysweek:${weekOf(at).key}:${id}`, kind: 'sysweek', at, m: { board: id, system } })
    if (!state.ledger[`syspuzzle:${puzzle.id}`]) {
      const n = Math.max(1, attempts ?? 1)
      const prior = Object.entries(state.ledger)
        .filter(([k, e]) => k.startsWith(`conn:${puzzle.id}:`) && e.kind === 'sysconn')
        .reduce((a, [, e]) => a + (e.xp || 0), 0)
      const g = award(state, { id: `syspuzzle:${puzzle.id}`, xp: Math.max(0, attemptXp(n) - prior), kind: 'syspuzzle', at, m: { system, attempt: n } })
      ctx.gained += g
      ctx.attemptNumber = n
      ctx.lines.push([n === 1 ? 'Solved on the first try' : `Solved on try ${n}`, g])
    }
    if (systemComplete) {
      const c = award(state, { id: `system:${system}`, xp: XP.systemComplete, kind: 'system', at, m: { system } })
      if (c) {
        ctx.gained += c
        ctx.lines.push([`${system} complete`, c])
      }
      ctx.connectedNow = mark(state, { id: `sysconnected:${system}`, kind: 'sysconnected', at, m: { system } })
    }
  })
}

// ---- 3-Minute ----
export function recordChallengeSession({ completedAt, roundsCorrect = 0, isNewBest = false, actions = null }) {
  return run((state, ctx) => {
    const at = ctx.at
    const id = `challenge:${completedAt || at}`
    // An inactive session (the clock ran out with no answer at all) earns
    // nothing and does not count toward This Week.
    if (actions === 0) return
    const xp = Math.min(XP.challengeMax, roundsCorrect * XP.challengePerCorrect) + (isNewBest && roundsCorrect > 0 ? XP.challengeNewBest : 0)
    if (xp > 0) {
      ctx.gained += award(state, { id, xp, kind: 'challenge', at })
    } else if (!state.ledger[id]) {
      // A session with nothing correct still counts as played for This Week.
      state.ledger[id] = { xp: 0, base: 0, kind: 'challenge', at }
    }
    ctx.lines.push(['3 Minutes', state.ledger[id]?.xp || 0])
  })
}

// ---- Race ----
// Finishing pays once per race run; a win adds a small bonus when the result
// arrives (the opponent may finish after you). Up to 5 races a day earn XP.
export function recordRaceFinish({ raceId, solo = false }) {
  return run((state, ctx) => {
    const at = ctx.at
    // Finished race (solo or head-to-head) counts toward This Week, even past
    // the daily XP limit. Abandoned races never reach this point.
    mark(state, { id: `racedone:${raceId}`, kind: 'racedone', at })
    const today = localDayKey(at)
    const racesToday = Object.entries(state.ledger).filter(([id, e]) => e.kind === 'race' && !id.endsWith(':win') && entryDay(e) === today).length
    if (racesToday >= XP.raceDailyLimit) return
    const g = award(state, { id: `race:${raceId}`, xp: solo ? XP.raceSolo : XP.raceFinish, kind: 'race', at })
    ctx.gained += g
    ctx.lines.push(['Race', g])
  })
}
export function recordRaceWin({ raceId }) {
  return run((state, ctx) => {
    if (!state.ledger[`race:${raceId}`]) return // only races that earned finish XP can earn the win bonus
    const g = award(state, { id: `race:${raceId}:win`, xp: XP.raceWin, kind: 'race', at: ctx.at })
    ctx.gained += g
    ctx.lines.push(['Race win', g])
  })
}

// ---- puzzle tools ----
// Tools are for Daily puzzles only. Systems boards, 3 Minutes and Race can
// still earn tools (they are kept for Dailies) but can never spend one. The
// check lives here, not just in the board's buttons, so a stale screen or
// another route cannot use a tool outside a Daily: the caller must say the
// board is a Daily, and the attempt must be a Daily attempt
// ('daily-YYYY-MM-DD:<start>').
export const TOOL_MODES = ['daily']
const DAILY_ATTEMPT = /^daily-\d{4}-\d{2}-\d{2}:/
export function toolsAllowedIn(mode) {
  return TOOL_MODES.includes(mode)
}
// One tool per board attempt: the use id is the attempt id, so a second
// spend in the same attempt (another tab, a double tap, a refresh) is
// refused. Returns false (nothing spent) when the board is not a Daily, the
// tool is locked or empty, or this attempt already used a tool.
export function spendTool(item, attemptId, m = {}) {
  if (!PUZZLE_TOOLS.includes(item) || !attemptId) return false
  if (!toolsAllowedIn(m.mode) || !DAILY_ATTEMPT.test(String(attemptId))) return false
  const state = loadProgression()
  ensureV2(state)
  const info = levelInfo(totalXp(state))
  if (!itemOpen(item, info.level)) return false
  const ok = useItem(state, { id: `tool:${attemptId}`, item, m: { ...m, attempt: attemptId } })
  if (ok) saveProgression(state)
  return ok
}
// Older name kept for callers.
export const spendCurbside = (puzzleId) => spendTool('curbside', `${puzzleId}:${Date.now()}`, { puzzle: puzzleId, mode: 'daily' })

export function toolUsedInAttempt(attemptId) {
  return loadProgression().kit.uses[`tool:${attemptId}`] || null
}

// Take one pending claim into the inventory (only while under the cap).
export function claimTool(item) {
  const state = loadProgression()
  const ok = claimPending(state, item)
  if (ok) saveProgression(state)
  return ok
}

// The weekly reward's tool: any unlocked puzzle tool, chosen by the player.
export function chooseWeeklyTool(weekKey, item) {
  const state = loadProgression()
  ensureV2(state)
  if (!PUZZLE_TOOLS.includes(item)) return false
  if (!weeklyChoicesDue(state).includes(weekKey)) return false
  if (!itemOpen(item, levelInfo(totalXp(state)).level)) return false
  const r = grant(state, { id: `rounds:${weekKey}:item`, item, source: 'rounds', at: Date.now() })
  if (r) saveProgression(state)
  return r
}

// Starts the economy for this save (starter gift, conversions) without
// waiting for the first puzzle. Call after any cloud sync on load.
export function ensureProgression() {
  const state = loadProgression()
  const before = JSON.stringify(state)
  ensureV2(state)
  payLevels(state, { grants: [], pending: [] }, Date.now())
  if (JSON.stringify(state) !== before) saveProgression(state)
  return state
}

// ---- one-time backfill for existing players ----
// Credits only what history records reliably. Unknowns are skipped, not guessed.
//   history:    Daily history (date -> { completed, won, mistakes, completedAt })
//   mastery:    per bank category { timesSolved }
//   bankById:   id -> { difficulty }
//   systems:    names of systems already fully solved
//   challenge:  stored 3-Minute sessions + personal best
//   systemWins: number of Systems puzzles won (from system progress)
export function backfillIfNeeded({ history = {}, mastery = {}, bankById = {}, systems = [], challenge = {}, systemWins = 0 }) {
  const state = loadProgression()
  if (state.migrated) return null
  const at = Date.now()
  const lvl = { easy: 1, medium: 2, hard: 3, expert: 4 }
  for (const [key, e] of Object.entries(history)) {
    if (!e?.completed) continue
    const onTime = finishedOnDate(e, key)
    award(state, { id: onTime ? `daily:${key}` : `archive:${key}`, xp: onTime ? XP.daily : XP.archive, kind: 'bf-daily', at })
    if (e.won) {
      // A won Daily means all four groups were solved: 5 + 10 + 15 + 20.
      award(state, { id: `bf-conn:${key}`, xp: 50, kind: 'bf-conn', at })
      if (onTime && e.mistakes === 0) award(state, { id: `perfect:${key}`, xp: XP.perfect, kind: 'bf-perfect', at })
    }
  }
  // Systems connections: mastery counts every correct Systems solve per category.
  let sysConn = 0
  let sysCount = 0
  for (const [id, m] of Object.entries(mastery)) {
    const diff = bankById[id]?.difficulty
    if (!diff || !(m?.timesSolved > 0)) continue
    sysConn += (XP.connection[lvl[diff]] || 0) * m.timesSolved
    sysCount += m.timesSolved
  }
  if (sysConn > 0) award(state, { id: 'bf-sysconn', xp: sysConn, kind: 'bf-sysconn', at, m: { count: sysCount } })
  if (systemWins > 0) award(state, { id: 'bf-syspuzzles', xp: systemWins * XP.systemPuzzle, kind: 'bf-syspuzzle', at })
  systems.forEach((sys) => {
    award(state, { id: `system:${sys}`, xp: XP.systemComplete, kind: 'bf-system', at, m: { system: sys } })
  })
  for (const s of challenge.history || []) {
    const xp = Math.min(XP.challengeMax, (s.roundsCorrect || 0) * XP.challengePerCorrect)
    if (xp > 0) award(state, { id: `challenge:${s.completedAt}`, xp, kind: 'bf-challenge', at })
  }
  if ((challenge.personalBest || 0) > 0) award(state, { id: 'bf-challenge-best', xp: XP.challengeNewBest, kind: 'bf-challenge', at })
  // Streak milestones from the real (history-based) longest streak.
  const longest = longestStreak(history)
  STREAK_MILESTONES.forEach((ms) => {
    if (longest >= ms.days) {
      award(state, { id: `streak:${ms.days}`, xp: ms.xp, kind: 'bf-streak', at })
    }
  })
  state.migrated = at
  saveProgression(state)
  // Level rewards for the backfilled XP.
  return run(() => {})
}

// ---- read model for the UI ----
export function recordSnapshot({ history = {}, todayKey }) {
  const state = loadProgression()
  ensureV2(state)
  const xp = totalXp(state)
  const info = levelInfo(xp)
  const counts = kitCounts(state)
  const streak = streakInfo(state, history, todayKey)
  const entries = Object.values(state.ledger)
  // Connections solved: each live award is one connection; backfilled Dailies
  // count 4 per won day; backfilled Systems carry their count.
  let connections = 0
  for (const e of entries) {
    if (e.kind === 'conn' || e.kind === 'sysconn') connections += 1
    else if (e.kind === 'bf-conn') connections += 4
    else if (e.kind === 'bf-sysconn') connections += e.m?.count || 0
  }
  return {
    state,
    xp,
    info,
    counts,
    streak,
    connections,
    rounds: roundsProgress(state),
    kit: KIT,
    pending: pendingClaims(state),
    weeklyChoices: weeklyChoicesDue(state),
    coverage: coverageProgress(state),
    nextReward: nextLevelReward(Math.max(info.level, state.v2?.levelFrom || 1)),
    converted: state.v2?.converted || {},
  }
}
