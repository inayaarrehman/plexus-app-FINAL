// ---------------------------------------------------------------------
// Progression store: the only place that reads/writes progression state.
// ---------------------------------------------------------------------
// Each record* function loads the state, adds awards under stable ids, runs
// the follow-ups (level rewards, promotions, streak milestones, Rounds), saves,
// and returns a summary the UI can show (XP gained, level change, promotion,
// items received). Calling any of them twice for the same event is harmless.

import {
  XP,
  STREAK_MILESTONES,
  levelRewards,
  PERFECT_REWARD_EVERY,
  ROUNDS_ITEM_ROTATION,
  KIT,
} from './config.js'
import {
  emptyState,
  normalize,
  award,
  grant,
  useItem,
  totalXp,
  levelInfo,
  kitCounts,
  roundsProgress,
  stageIndex,
  localDayKey,
} from './engine.js'
import { currentStreak, longestStreak, needsShield, isStreakDay } from './streak.js'

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
  const pendingShield = (kitCounts(state).shield || 0) > 0
  return {
    current: currentStreak(history, todayKey, { shielded, pendingShield }),
    longest: longestStreak(history, { shielded }),
  }
}

// ---- follow-ups run after every batch of awards ----
function followUps(state, ctx) {
  const now = ctx.at || Date.now()
  // Level rewards for every level reached (idempotent, so merges stay consistent).
  const info = levelInfo(totalXp(state))
  for (let L = 2; L <= info.level; L++) {
    levelRewards(L).forEach((item, i) => {
      if (grant(state, { id: `level:${L}:${i}`, item, source: 'level', at: now }) && ctx.grants) ctx.grants.push(item)
    })
  }
  // Rounds: complete when all three goals are done; reward once per week.
  const rp = roundsProgress(state, now)
  if (rp.complete && !state.ledger[`rounds:${rp.week.key}`]) {
    ctx.gained += award(state, { id: `rounds:${rp.week.key}`, xp: XP.rounds, kind: 'rounds', at: now })
    ctx.lines.push(['This Week', XP.rounds])
    if (rp.week.index % 2 === 0) {
      const item = ROUNDS_ITEM_ROTATION[(rp.week.index / 2) % ROUNDS_ITEM_ROTATION.length]
      if (grant(state, { id: `rounds:${rp.week.key}:item`, item, source: 'rounds', at: now }) && ctx.grants) ctx.grants.push(item)
    }
    // Rounds XP can itself cross a level: grant those rewards too.
    const again = levelInfo(totalXp(state))
    for (let L = info.level + 1; L <= again.level; L++) {
      levelRewards(L).forEach((item, i) => {
        if (grant(state, { id: `level:${L}:${i}`, item, source: 'level', at: now }) && ctx.grants) ctx.grants.push(item)
      })
    }
  }
}

function run(fn, { silent = false } = {}) {
  const state = loadProgression()
  const before = levelInfo(totalXp(state))
  const ctx = { gained: 0, lines: [], grants: [], at: Date.now() }
  fn(state, ctx)
  followUps(state, ctx)
  const after = levelInfo(totalXp(state))
  let promotion = null
  if (stageIndex(after.stage.key) > stageIndex(before.stage.key) && !state.seen.stages[after.stage.key]) {
    promotion = silent ? null : after.stage
    state.seen.stages[after.stage.key] = true
  }
  state.seen.level = Math.max(state.seen.level, after.level)
  saveProgression(state)
  return {
    gained: ctx.gained,
    lines: ctx.lines.filter((l) => l[1] > 0),
    grants: ctx.grants,
    before,
    after,
    levelUp: after.level > before.level,
    promotion,
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
    if (isToday && won && mistakes === 0 && toolsUsed === 0) {
      const p = award(state, { id: `perfect:${dateKey}`, xp: XP.perfect, kind: 'perfect', at })
      ctx.gained += p
      ctx.lines.push(['Perfect', p])
      const perfectCount = Object.values(state.ledger).filter((e) => e.kind === 'perfect').length
      if (perfectCount > 0 && perfectCount % PERFECT_REWARD_EVERY === 0) {
        if (grant(state, { id: `perfect-reward:${perfectCount}`, item: 'curbside', source: 'perfect', at })) ctx.grants.push('curbside')
      }
    }
    if (isToday && history) {
      // Streak Shield: cover yesterday if it was the only gap in a live streak.
      const shielded = shieldedDates(state)
      if (isStreakDay(history[dateKey], dateKey)) {
        const gap = needsShield(history, dateKey, shielded)
        if (gap && useItem(state, { id: `shield:${gap}`, item: 'shield', at, m: { date: gap } })) {
          ctx.shieldUsed = gap
          shielded.add(gap)
        }
      }
      const streak = currentStreak(history, dateKey, { shielded })
      STREAK_MILESTONES.forEach((ms) => {
        if (streak >= ms.days) {
          const got = award(state, { id: `streak:${ms.days}`, xp: ms.xp, kind: 'streak', at })
          if (got) {
            ctx.gained += got
            ctx.lines.push([`${ms.days} day streak`, got])
            if (ms.grant && grant(state, { id: `streak:${ms.days}:item`, item: ms.grant, source: 'streak', at })) ctx.grants.push(ms.grant)
          }
        }
      })
    }
  })
}

// ---- Systems puzzle ----
export function recordSystemFinish({ puzzle, system, won, guessLog, systemComplete = false }) {
  return run((state, ctx) => {
    const at = ctx.at
    if (won) {
      const g = award(state, { id: `syspuzzle:${puzzle.id}`, xp: XP.systemPuzzle, kind: 'syspuzzle', at, m: { system } })
      ctx.gained += g
      ctx.lines.push(['Systems puzzle', g])
    }
    let conn = 0
    guessLog.filter((x) => x.correct).forEach((x) => {
      const ci = x.catIndexes[0]
      const level = puzzle.categories[ci]?.level
      conn += award(state, { id: `conn:${puzzle.id}:${ci}`, xp: XP.connection[level] || 0, kind: 'sysconn', at, m: { level, system } })
    })
    ctx.gained += conn
    ctx.lines.push(['Connections', conn])
    if (systemComplete) {
      const c = award(state, { id: `system:${system}`, xp: XP.systemComplete, kind: 'system', at, m: { system } })
      if (c) {
        ctx.gained += c
        ctx.lines.push([`${system} complete`, c])
        if (grant(state, { id: `system:${system}:item`, item: 'curbside', source: 'system', at })) ctx.grants.push('curbside')
      }
    }
  })
}

// ---- 3-Minute ----
export function recordChallengeSession({ completedAt, roundsCorrect = 0, isNewBest = false }) {
  return run((state, ctx) => {
    const at = ctx.at
    const id = `challenge:${completedAt || at}`
    const xp = Math.min(XP.challengeMax, roundsCorrect * XP.challengePerCorrect) + (isNewBest && roundsCorrect > 0 ? XP.challengeNewBest : 0)
    if (xp > 0) {
      ctx.gained += award(state, { id, xp, kind: 'challenge', at })
    } else if (!state.ledger[id]) {
      // A session with nothing correct still counts as played for Rounds.
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
    const today = localDayKey(at)
    const racesToday = Object.entries(state.ledger).filter(([id, e]) => e.kind === 'race' && !id.endsWith(':win') && localDayKey(e.at) === today).length
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

// ---- Curbside ----
export function spendCurbside(puzzleId) {
  const state = loadProgression()
  const ok = useItem(state, { id: `curbside:${puzzleId}:${Date.now()}`, item: 'curbside', m: { puzzle: puzzleId } })
  if (ok) saveProgression(state)
  return ok
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
    const onTime = !e.completedAt || localDayKey(new Date(e.completedAt).getTime()) === key
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
    grant(state, { id: `system:${sys}:item`, item: 'curbside', source: 'system', at })
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
      if (ms.grant) grant(state, { id: `streak:${ms.days}:item`, item: ms.grant, source: 'streak', at })
    }
  })
  state.migrated = at
  saveProgression(state)
  // Level rewards and stage acknowledgements, without a promotion moment.
  return run(() => {}, { silent: true })
}

// ---- read model for the UI ----
export function careerSnapshot({ history = {}, todayKey }) {
  const state = loadProgression()
  const xp = totalXp(state)
  const info = levelInfo(xp)
  const counts = kitCounts(state)
  const streak = streakInfo(state, history, todayKey)
  const entries = Object.values(state.ledger)
  const systemsComplete = entries.filter((e) => e.kind === 'system' || e.kind === 'bf-system').length
  // Connections solved: each live award is one connection; backfilled Dailies
  // count 4 per won day; backfilled Systems carry their count.
  let connections = 0
  for (const e of entries) {
    if (e.kind === 'conn' || e.kind === 'sysconn') connections += 1
    else if (e.kind === 'bf-conn') connections += 4
    else if (e.kind === 'bf-sysconn') connections += e.m?.count || 0
  }
  return { state, xp, info, counts, streak, systemsComplete, connections, rounds: roundsProgress(state), kit: KIT }
}
