#!/usr/bin/env node
// ---------------------------------------------------------------------
// Progression simulator: modeled players under the old and new rules.
// ---------------------------------------------------------------------
//   node scripts/progression-sim.mjs [--json out.json] [--md out.md]
//
// A model, not player data. Every behavior below is an assumption (stated in
// PROFILES and the per-mode models) and the results describe what these
// assumed players would earn, nothing about real retention or engagement.
// Seeded, so a run is reproducible.
//
// "old" mirrors the rules as they were before the October 2026 progression
// pass (copied here so they stay fixed); "new" reads the live config.
import fs from 'node:fs'
import * as CFG from '../src/progression/config.js'

const args = process.argv.slice(2)
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null)

// ---------------- rule sets ----------------
const oldLevelCost = (L) => {
  const n = L - 1
  return Math.round((150 + 60 * n + 6 * n * n) / 10) * 10
}
const OLD = {
  name: 'old',
  levelCost: oldLevelCost,
  daily: (r) => 100 + r.conn + (r.perfect ? 25 : 0),
  archive: (r) => 50 + r.conn, // any finish, win or lose
  systemAttempt: [100, 75, 50, 25],
  systemComplete: 300,
  practiceTaper: { after: 600, rate: 0.5 },
  challenge: (s) => (s.correct > 0 ? Math.min(60, s.correct * 3) : 0) + (s.newBest ? 15 : 0),
  raceFinish: (r) => (r.answered >= 3 && r.correct >= 1 ? 20 : 0),
  raceWin: (r) => (r.won && r.answered >= 3 && r.correct >= 1 ? 10 : 0),
  timed: { full: 150, cap: 225, rate: 0.5 },
  weekly: 250,
  streak: [[3, 50], [7, 100], [14, 150], [30, 300], [60, 400], [100, 500], [180, 600], [365, 1000]],
  crisprLevels: (L) => L >= 12 && (L - 12) % 4 === 0,
  crisprDrop: 0,
  crisprNeedsRaces: 0,
  toolLevels: (L) => (L === 2 ? ['curbside'] : L === 3 ? ['lab'] : L === 5 ? ['second-opinion'] : L >= 6 ? [['curbside', 'lab', 'second-opinion'][(L - 6) % 3]] : []),
}
const X = CFG.XP
const NEW = !CFG.challengeXp ? null : {
  name: 'new',
  levelCost: CFG.levelCost,
  daily: (r) => X.daily + (r.won ? X.dailyWin : 0) + r.conn + (r.perfect ? X.perfect : 0),
  archive: (r) => (r.won ? X.archive : 0) + r.conn,
  systemAttempt: X.systemAttempt,
  systemComplete: X.systemComplete,
  practiceTaper: null,
  challenge: (s) => CFG.challengeXp({ correct: s.correct, wrong: s.wrong, newBest: s.newBest }),
  raceFinish: (r) => (CFG.raceQualifies(r) ? X.raceFinish : 0),
  raceWin: (r) => (r.won && CFG.raceQualifies(r) ? X.raceWin : 0),
  timed: CFG.TIMED_XP,
  weekly: X.rounds,
  streak: CFG.STREAK_MILESTONES.map((m) => [m.days, m.xp]),
  crisprLevels: (L) => L >= CFG.CRISPR_UNLOCK_LEVEL && (L - CFG.CRISPR_UNLOCK_LEVEL) % CFG.CRISPR_LEVEL_EVERY === 0,
  crisprDrop: CFG.RACE_REWARDS.crisprDropChance,
  crisprNeedsRaces: CFG.RACE_REWARDS.crisprUnlockRaces,
  toolLevels: (L) => CFG.levelRewards(L),
}

// ---------------- seeded randomness ----------------
function rng(seed) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------- players (assumptions) ----------------
// minutes are rough per-activity times: a Daily 6 min, an Archive Daily 6
// min, a Systems board 6 min, a 3 Minutes session 4 min (with the results
// screen), a Race 3 min (lobby and results included).
export const PROFILES = {
  casual: { label: 'Casual', dailyP: 0.6, archivePerDay: 0, systemsPerDay: 0.2, challengePerDay: 0.3, racesPerDay: 0.15, acc: 0.6, raceWin: 0.4, toolUse: 0.25 },
  regular: { label: 'Regular', dailyP: 0.92, archivePerDay: 0.3, systemsPerDay: 1, challengePerDay: 1, racesPerDay: 1, acc: 0.7, raceWin: 0.5, toolUse: 0.2 },
  heavy: { label: 'Heavy', dailyP: 1, archivePerDay: 2, systemsPerDay: 4, challengePerDay: 4, racesPerDay: 5, acc: 0.8, raceWin: 0.6, toolUse: 0.15 },
  lowAcc: { label: 'Regular, low accuracy', dailyP: 0.92, archivePerDay: 0.3, systemsPerDay: 1, challengePerDay: 1, racesPerDay: 1, acc: 0.5, raceWin: 0.25, toolUse: 0.35 },
  racer: { label: 'Race fan', dailyP: 0.9, archivePerDay: 0, systemsPerDay: 0.3, challengePerDay: 0.5, racesPerDay: 6, acc: 0.75, raceWin: 0.55, toolUse: 0.2 },
  farmer: { label: 'Farmer', farmer: true, dailyP: 1, archivePerDay: 99, systemsPerDay: 0, challengePerDay: 8, racesPerDay: 12, acc: 0.15, raceWin: 0.5, toolUse: 0 },
}

// Win chance and groups solved on a Daily from accuracy (assumed).
const winP = (acc) => Math.min(0.95, 0.15 + acc)
const perfectP = (acc) => Math.max(0, (acc - 0.45) * 0.6)

function simulate(R, profile, days, { joinDay = 14, seed = 'sim' } = {}) {
  const r = rng(`${seed}:${R.name}:${profile.label}`)
  const st = { xp: 0, level: 1, ledgerDays: {}, streak: 0, lifetimeMilestones: new Set(), coverage: 0, dailies: 0, tools: { curbside: 1, lab: 0, 'second-opinion': 0 }, pendingTools: 0, crispr: 0, crisprPending: 0, mutation: 0, countedRaces: 0, qualWins: 0, bestChallenge: 0, systemsSolved: 0, systemsAvailable: 77, subjectsDone: 0, minutes: 0, firstLevelDay: {}, crisprDrops: 0, archiveBacklog: joinDay }
  const levelOf = (xp) => {
    let L = 1
    let s = 0
    while (xp >= s + R.levelCost(L)) {
      s += R.levelCost(L)
      L++
    }
    return L
  }
  const timeline = []
  let weekCounters = { dailies: 0, timed: 0, unaided: 0, paid: false }
  for (let day = 0; day < days; day++) {
    if (day % 7 === 0) weekCounters = { dailies: 0, timed: 0, unaided: 0, paid: false }
    let practice = 0
    let timed = 0
    const add = (xp, kind) => {
      let paid = xp
      if (kind === 'timed') {
        const full = Math.max(0, Math.min(xp, R.timed.full - timed))
        const room = Math.max(0, R.timed.cap - Math.max(timed, R.timed.full))
        paid = full + Math.min(room, Math.floor((xp - full) * R.timed.rate))
        timed += paid
      } else if (kind === 'practice' && R.practiceTaper) {
        const full = Math.max(0, Math.min(xp, R.practiceTaper.after - practice))
        paid = full + Math.floor((xp - full) * R.practiceTaper.rate)
      }
      if (kind === 'practice' || kind === 'timed') practice += paid
      st.xp += paid
      return paid
    }
    const before = levelOf(st.xp)
    // Daily
    if (r() < profile.dailyP) {
      const farmer = profile.farmer
      const won = !farmer && r() < winP(profile.acc)
      const usedTool = !farmer && r() < profile.toolUse && (st.tools.curbside + st.tools.lab + st.tools['second-opinion'] > 0)
      if (usedTool) {
        const k = Object.keys(st.tools).find((t) => st.tools[t] > 0)
        st.tools[k]--
      }
      const perfect = won && !usedTool && r() < perfectP(profile.acc)
      const conn = won ? 50 : farmer ? 0 : 15
      add(R.daily({ won, conn, perfect }), 'daily')
      st.minutes += farmer ? 0.3 : 6
      st.dailies++
      weekCounters.dailies++
      if (won && !usedTool) weekCounters.unaided++
      // streak (Plexus rule: a Daily won on its day; Coverage covers a gap)
      if (won) st.streak++
      else st.streak = 0
      if (st.dailies % 7 === 0) st.coverage = Math.min(2, st.coverage + 1)
      for (const [d, xp] of R.streak) if (st.streak >= d && !st.lifetimeMilestones.has(d)) {
        st.lifetimeMilestones.add(d)
        add(xp, 'streak')
      }
    } else if (st.coverage > 0 && st.streak > 0) st.coverage--
    else st.streak = 0
    // Archive
    st.archiveBacklog += 1
    const arch = Math.min(st.archiveBacklog - 1, Math.floor(profile.archivePerDay + (r() < profile.archivePerDay % 1 ? 1 : 0)))
    for (let i = 0; i < arch; i++) {
      const farmer = profile.farmer
      const won = !farmer && r() < winP(profile.acc)
      add(R.archive({ won, conn: won ? 50 : farmer ? 0 : 15 }), 'practice-archive')
      st.minutes += farmer ? 0.3 : 6
      st.archiveBacklog--
    }
    // Systems (finite: 77 starter boards + about 0.6 more a day)
    st.systemsAvailable = 77 + Math.floor(day * 0.6)
    const sys = Math.floor(profile.systemsPerDay + (r() < profile.systemsPerDay % 1 ? 1 : 0))
    for (let i = 0; i < sys && st.systemsSolved < st.systemsAvailable; i++) {
      let tries = 1
      while (r() > Math.min(0.9, profile.acc - 0.05) && tries < 6) tries++
      add(R.systemAttempt[Math.min(tries, 4) - 1], 'practice')
      st.minutes += 6 * tries
      st.systemsSolved++
      const subjects = Math.floor(st.systemsSolved / 5)
      while (st.subjectsDone < Math.min(16, subjects)) {
        st.subjectsDone++
        add(R.systemComplete, 'practice')
      }
    }
    // 3 Minutes
    const ch = Math.floor(profile.challengePerDay + (r() < profile.challengePerDay % 1 ? 1 : 0))
    for (let i = 0; i < ch; i++) {
      const rounds = profile.farmer ? 70 : 16 + Math.floor(r() * 6)
      const correct = Math.round(rounds * profile.acc * (0.85 + r() * 0.3))
      const wrong = rounds - correct
      const score = correct * 140 - wrong * 50
      const newBest = score > st.bestChallenge
      if (newBest) st.bestChallenge = score
      add(R.challenge({ correct, wrong, newBest }), 'timed')
      st.minutes += 4
      if (correct >= 1) weekCounters.timed++
    }
    // Race
    const races = Math.floor(profile.racesPerDay + (r() < profile.racesPerDay % 1 ? 1 : 0))
    let countedToday = 0
    for (let i = 0; i < races; i++) {
      const farmer = profile.farmer
      const answered = 10
      const correct = farmer ? 3 : Math.round(10 * profile.acc * (0.8 + r() * 0.4))
      const runMs = farmer ? 21000 : 60000 + r() * 60000
      const won = r() < profile.raceWin
      const res = { answered, correct, runMs, won }
      add(R.raceFinish(res) + R.raceWin(res), 'timed')
      st.minutes += farmer ? 0.6 : 3
      weekCounters.timed++
      // server rewards: counted up to 6 a day (3 per opponent; the farmer
      // uses two alts, the others race varied opponents)
      const serverQual = correct >= 3 && runMs >= 20000
      if (serverQual && countedToday < 6) {
        countedToday++
        st.countedRaces++
        if (won) {
          st.qualWins++
          if (st.qualWins % 5 === 0) {
            if (st.mutation < 3) st.mutation++
          }
          const unlocked = st.level >= 12 && st.countedRaces >= R.crisprNeedsRaces
          if (R.crisprDrop && unlocked && r() < R.crisprDrop) {
            st.crisprDrops++
            if (st.crispr < 3) st.crispr++
            else st.crisprPending++
          }
        }
      }
      // Chaos use: assume the racer spends a Mutation in a third of races
      if (!farmer && st.mutation > 0 && r() < 0.33) st.mutation--
      if (!farmer && st.crispr > 0 && r() < 0.1) st.crispr--
    }
    // This Week (any 2 of 3)
    const goals = [weekCounters.dailies >= 3, weekCounters.timed >= 2, weekCounters.unaided >= 1].filter(Boolean).length
    if (goals >= 2 && !weekCounters.paid) {
      weekCounters.paid = true
      add(R.weekly, 'weekly')
      st.tools.curbside = Math.min(5, st.tools.curbside + 1)
    }
    // level rewards
    const after = levelOf(st.xp)
    for (let L = before + 1; L <= after; L++) {
      st.firstLevelDay[L] = day
      for (const t of R.toolLevels(L)) {
        if (st.tools[t] < 5) st.tools[t]++
        else st.pendingTools++
      }
      if (R.crisprLevels(L)) {
        if (st.countedRaces >= R.crisprNeedsRaces) {
          if (st.crispr < 3) st.crispr++
          else st.crisprPending++
        } else st.crisprOwed = (st.crisprOwed || 0) + 1
      }
    }
    if (st.crisprOwed && st.countedRaces >= R.crisprNeedsRaces) {
      st.crispr = Math.min(3, st.crispr + st.crisprOwed)
      st.crisprOwed = 0
    }
    st.level = after
    if ([0, 6, 29, 89].includes(day))
      timeline.push({ day: day + 1, xp: st.xp, level: after, hours: Math.round((st.minutes / 60) * 10) / 10, tools: { ...st.tools }, pendingTools: st.pendingTools, mutation: st.mutation, crispr: st.crispr, crisprDrops: st.crisprDrops, systemsLeft: Math.max(0, st.systemsAvailable - st.systemsSolved) })
  }
  return { timeline, firstLevelDay: st.firstLevelDay }
}

// XP per hour by mode for the same player (regular accuracy), first week.
function perMode(R) {
  const p = { acc: 0.7, raceWin: 0.5 }
  const dailyWin = winP(p.acc)
  const daily = (dailyWin * R.daily({ won: true, conn: 50, perfect: false }) + (1 - dailyWin) * R.daily({ won: false, conn: 15 })) / (6 / 60)
  const archive = (dailyWin * R.archive({ won: true, conn: 50 }) + (1 - dailyWin) * R.archive({ won: false, conn: 15 })) / (6 / 60)
  const systems = R.systemAttempt[0] * 0.65 + R.systemAttempt[1] * 0.25 + R.systemAttempt[2] * 0.1
  const sysHr = systems / ((6 * 1.45) / 60)
  const ch = R.challenge({ correct: 13, wrong: 5, newBest: false }) / (4 / 60)
  const race = (R.raceFinish({ answered: 10, correct: 7, runMs: 80000 }) + 0.5 * R.raceWin({ answered: 10, correct: 7, runMs: 80000, won: true })) / (3 / 60)
  return { dailyFirstOfDay: Math.round(daily), archive: Math.round(archive), systems: Math.round(sysHr), threeMinutesBeforeLimit: Math.round(ch), raceBeforeLimit: Math.round(race), timedDailyLimit: R.timed.cap }
}
// What low-effort play pays per hour.
function abuse(R) {
  return {
    dailyInstantLoss: R.daily({ won: false, conn: 0 }),
    archiveInstantLossPerHour: R.archive({ won: false, conn: 0 }) * 200, // ~18 s each
    threeMinutesSpamSession: R.challenge({ correct: 10, wrong: 60, newBest: false }),
    raceSpamPerRace: R.raceFinish({ answered: 10, correct: 1, runMs: 8000 }),
    raceMinimumQualifying: R.raceFinish({ answered: 10, correct: 3, runMs: 21000 }),
  }
}

// CRISPR drop odds for a player: eligible wins a day (counted wins once
// unlocked) and the chance, over many seeded runs.
export function dropOdds(chance, eligibleWinsPerDay, days, runs = 2000) {
  const r = rng(`drop:${chance}:${eligibleWinsPerDay}:${days}`)
  const counts = []
  const firsts = []
  for (let k = 0; k < runs; k++) {
    let n = 0
    let first = null
    for (let d = 0; d < days; d++) {
      const wins = Math.floor(eligibleWinsPerDay) + (r() < eligibleWinsPerDay % 1 ? 1 : 0)
      for (let w = 0; w < wins; w++) if (r() < chance) {
        n++
        if (first == null) first = d + 1
      }
    }
    counts.push(n)
    firsts.push(first ?? Infinity)
  }
  counts.sort((a, b) => a - b)
  firsts.sort((a, b) => a - b)
  const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))]
  return { mean: Math.round((counts.reduce((a, b) => a + b, 0) / runs) * 100) / 100, p10: q(counts, 0.1), median: q(counts, 0.5), p90: q(counts, 0.9), atLeastOne: Math.round((100 * counts.filter((c) => c > 0).length) / runs), firstDropMedianDay: q(firsts, 0.5) === Infinity ? null : q(firsts, 0.5) }
}

export function runAll() {
  const out = { assumptions: PROFILES, rules: {}, results: {}, perModeXpPerHour: {}, abuse: {}, levelDays: {} }
  for (const R of [OLD, NEW].filter(Boolean)) {
    out.perModeXpPerHour[R.name] = perMode(R)
    out.abuse[R.name] = abuse(R)
    out.results[R.name] = {}
    out.levelDays[R.name] = {}
    for (const [k, p] of Object.entries(PROFILES)) {
      const s = simulate(R, p, 90)
      out.results[R.name][k] = s.timeline
      out.levelDays[R.name][k] = { L5: s.firstLevelDay[5] ?? null, L12: s.firstLevelDay[12] ?? null, L20: s.firstLevelDay[20] ?? null }
    }
  }
  // Eligible wins a day once CRISPR is unlocked: counted races (at most 6 a
  // day, 3 per opponent) times win rate.
  out.crisprDrop = {}
  for (const [label, w] of [['casual (1 race a week, 40% wins)', 0.06], ['regular (1 race a day, 50% wins)', 0.5], ['race fan (6 a day, 55% wins)', 3.3], ['maximum (6 counted wins every day)', 6]]) {
    out.crisprDrop[label] = { perDay: w, chance: CFG.RACE_REWARDS.crisprDropChance, '90 days': dropOdds(CFG.RACE_REWARDS.crisprDropChance, w, 90), '1 year': dropOdds(CFG.RACE_REWARDS.crisprDropChance, w, 365) }
  }
  return out
}

if (process.argv[1] && process.argv[1].endsWith('progression-sim.mjs')) {
  const out = runAll()
  if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(out, null, 1))
  const lines = []
  for (const rs of Object.keys(out.results)) {
    lines.push(`\n== ${rs} rules ==`)
    for (const [k, tl] of Object.entries(out.results[rs])) lines.push(`${PROFILES[k].label.padEnd(24)} ` + tl.map((t) => `d${t.day}: L${t.level} ${t.xp}xp ${t.hours}h C${t.crispr}${t.crisprDrops ? `(+${t.crisprDrops} drop)` : ''} M${t.mutation} T${Object.values(t.tools).join('/')}${t.pendingTools ? '+' + t.pendingTools : ''}`).join(' | ') + `   L12 on day ${out.levelDays[rs][k].L12 ?? '-'}`)
    lines.push('XP/hour ' + JSON.stringify(out.perModeXpPerHour[rs]))
    lines.push('abuse ' + JSON.stringify(out.abuse[rs]))
  }
  lines.push('\nCRISPR drop odds ' + JSON.stringify(out.crisprDrop, null, 1))
  console.log(lines.join('\n'))
}
