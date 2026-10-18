import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import connectionBank from './data/connectionBank.js'
import Home from './components/Home.jsx'
import Game from './components/Game.jsx'
import Archive from './components/Archive.jsx'
import Systems from './components/Systems.jsx'
import Challenge from './components/Challenge.jsx'
import Race from './components/Race.jsx'
import { raceCodeFromHash } from './utils/raceEngine.js'
import { readRaceResume, hasAccountSession } from './lib/raceApi.js'

// Opened from an email link (sign-up confirmation or magic link)? Read before
// the Supabase client clears the address.
const FROM_EMAIL_LINK = typeof window !== 'undefined' && /access_token=|[?&]code=/.test(window.location.hash + window.location.search)
import AppNav from './components/AppNav.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import AuthModal from './components/AuthModal.jsx'
import Legal, { LEGAL_PAGES } from './components/Legal.jsx'
import SupportPage from './components/SupportPage.jsx'
import ReportModal from './components/ReportModal.jsx'
import HowToModal from './components/HowToModal.jsx'
import InstallGuide from './components/InstallGuide.jsx'
import RaceInvitePrompt from './components/RaceInvitePrompt.jsx'
import { isSupabaseConfigured } from './lib/supabaseClient.js'
import { onAuthChange } from './lib/auth.js'
import { AUTH_REDIRECT, clearAuthHash } from './lib/authRedirect.js'
import { appLink } from './utils/appUrl.js'
import { syncProgress, pushProgress } from './lib/progressRepo.js'
import { snapshotLocal } from './utils/progressSync.js'
import { timedBank } from './utils/timedLibrary.js'
import { subjectProgress, libraryConnectionMap, subjectLabel, LIBRARY_SUBJECTS } from './utils/newLibrary.js'
import StatsModal from './components/StatsModal.jsx'
// The content viewer and library editor (#dev) are for the owner, not
// players: they show every puzzle and answer. They load only in a dev build or
// when VITE_ENABLE_DEV_VIEWER=1 is set in Vercel, and in a separate file so
// players never download them.
const DevViewer = lazy(() => import('./components/DevViewer.jsx'))
const DEV_VIEWER_ON = (() => {
  try {
    return !!import.meta.env?.DEV || import.meta.env?.VITE_ENABLE_DEV_VIEWER === '1'
  } catch {
    return false
  }
})()
import BrandMark from './components/BrandMark.jsx'
import { dayNumber, dateKeyFromDayNumber } from './utils/game.js'
import { finishStamp, useToday } from './utils/calendarHooks.js'
import { formatDayKey } from './utils/calendar.js'
import { getDailyPuzzleForDate, getPlayableDailyForDate } from './utils/dailyPuzzle.js'
import { getDailyGate, isGatedView, GATED_VIEWS, LOCK_COPY, hasSeenUnlock, markUnlockSeen } from './utils/dailyGate.js'
import LockGlyph from './components/LockGlyph.jsx'
import Modal from './components/Modal.jsx'
import Record from './components/Record.jsx'
import { recordDailyFinish, recordSystemFinish, recordSystemAttemptStart, systemAttempts, attemptXp, backfillIfNeeded, streakInfo, loadProgression, recordSnapshot, ensureProgression } from './progression/store.js'
import { systemAccent, systemConfettiPalette } from './utils/systemAccent.js'
import { SYSTEMS } from './data/constants.js'
import { systemMasteryCounts } from './utils/mastery.js'
import {
  loadStats,
  recordResult,
  loadProgress,
  clearProgress,
  getDailyHistory,
  recordDailyHistory,
  getSystemProgress,
  recordSystemAttempt,
  recordWeakSpots,
  recordKnowledgeSignal,
  recordNearMissConfusions,
  getConceptMastery,
  recordConceptMastery,
  getChallengeStats,
  getSystemsBoards,
  recordSystemsBoardFinish,
} from './utils/storage.js'
import { systemsBoardPuzzle } from './utils/newLibrary.js'

// Builds Weak Spot data points from one finished attempt: every category
// touched by a wrong guess (the "concepts involved"), plus every category's
// final solved/unsolved status. Keyed by category title so the same concept
// aggregates across different puzzles.
function buildWeakSpotResults(puzzle, guessLog) {
  const results = []
  const solvedSet = new Set()
  guessLog.forEach((g) => {
    if (g.correct) {
      const catIndex = g.catIndexes[0]
      solvedSet.add(catIndex)
      results.push({ tag: puzzle.categories[catIndex].title, solved: true })
    } else {
      const uniqueCats = [...new Set(g.catIndexes)]
      uniqueCats.forEach((ci) => {
        results.push({ tag: puzzle.categories[ci].title, solved: false })
      })
    }
  })
  puzzle.categories.forEach((cat, i) => {
    if (!solvedSet.has(i)) {
      results.push({ tag: cat.title, solved: false })
    }
  })
  return results
}

// Near Miss Memory (Section 14): scans the finished attempt's wrong
// guesses for "one away" mix-ups (3 tiles from one category + 1 from
// another) and returns the confused-category-title pairs so
// recordNearMissConfusions can track which two concepts keep getting
// mixed up together, across attempts — not shown to the player yet, just
// recorded for a future Weak Spots feature to draw on.
function buildNearMissResults(puzzle, guessLog) {
  const pairs = []
  guessLog.forEach((g) => {
    if (g.correct) return
    const counts = {}
    g.catIndexes.forEach((ci) => {
      counts[ci] = (counts[ci] || 0) + 1
    })
    const entries = Object.entries(counts)
    const majority = entries.find(([, c]) => c === 3)
    const minority = entries.find(([, c]) => c === 1)
    if (majority && minority) {
      const a = puzzle.categories[Number(majority[0])]?.title
      const b = puzzle.categories[Number(minority[0])]?.title
      if (a && b) pairs.push({ a, b })
    }
  })
  return pairs
}

// Builds concept-mastery data points, one per category that actually came
// from the connection bank (assembled puzzles carry a `bankCategoryId` on
// each category; hand-written Daily Puzzle categories don't, and are
// simply skipped here — mastery tracking only applies to bank content).
// "Clean" means solved correctly with no wrong guess ever touching it.
function buildMasteryResults(puzzle, guessLog) {
  const results = []
  puzzle.categories.forEach((cat, catIndex) => {
    if (!cat.bankCategoryId) return
    const wasWronglyTouched = guessLog.some((g) => !g.correct && g.catIndexes.includes(catIndex))
    const wasCorrectlySolved = guessLog.some((g) => g.correct && g.catIndexes[0] === catIndex)
    results.push({
      bankCategoryId: cat.bankCategoryId,
      solved: wasCorrectlySolved,
      cleanSolve: wasCorrectlySolved && !wasWronglyTouched,
    })
  })
  return results
}

export default function App() {
  const parseChallengeHash = () => {
    const m = window.location.hash.match(/^#challenge\/(\d+)$/)
    return m ? Number(m[1]) : null
  }
  const [isDevRoute, setIsDevRoute] = useState(() => DEV_VIEWER_ON && window.location.hash === '#dev')
  const [challengeInvite, setChallengeInvite] = useState(() => parseChallengeHash())
  // Terms / Privacy / Disclaimer have their own links (#terms etc.) so they can
  // be shared, and open over whatever screen is current. Never locked.
  const parseLegalHash = () => {
    const h = window.location.hash.replace(/^#/, '')
    return LEGAL_PAGES.includes(h) || h === 'support' ? h : null
  }
  const [legalPage, setLegalPage] = useState(() => parseLegalHash())
  // Opened from inside the app: the legal page is one history entry, so
  // closing it (or browser Back) returns to the screen underneath.
  const legalFromApp = useRef(false)
  const openLegal = (page) => {
    legalFromApp.current = true
    window.location.hash = page
    setLegalPage(page)
  }
  const closeLegal = () => {
    setLegalPage(null)
    if ([...LEGAL_PAGES, 'support'].includes(window.location.hash.replace(/^#/, ''))) {
      if (legalFromApp.current) {
        legalFromApp.current = false
        history.back()
      } else {
        history.replaceState(history.state, '', window.location.pathname + window.location.search)
      }
    }
  }
  useEffect(() => {
    const onHashChange = () => {
      setIsDevRoute(DEV_VIEWER_ON && window.location.hash === '#dev')
      setChallengeInvite(parseChallengeHash())
      setLegalPage(parseLegalHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // #myplexus-preview[?from=XP&to=XP] replays the My Plexus XP and level-up
  // sequence for checking it. Display only: nothing is read from or written
  // to saved progress, and no XP or reward is awarded.
  const [myPlexusPreview, setMyPlexusPreview] = useState(() => {
    const m = window.location.hash.match(/^#myplexus-preview(?:\?(.*))?$/)
    if (!m) return null
    const q = new URLSearchParams(m[1] || '')
    const from = Number(q.get('from') ?? 100)
    const to = Number(q.get('to') ?? 420)
    return Number.isFinite(from) && Number.isFinite(to) && to >= from && from >= 0 ? { from, to } : { from: 100, to: 420 }
  })
  // A refresh reopens the screen this history entry was showing (behind the
  // same Daily gate). Simple screens are restored as the initial state; a
  // board is reopened by the restore effect further down.
  const [initRoute] = useState(() => {
    try {
      const r = history.state?.plexus?.route
      if (!r || window.location.hash.replace(/^#/, '')) return null
      if (r.view === 'home') return null
      const locked = !getDailyGate().unlocked
      if (r.view === 'game') return locked && r.mode !== 'daily' ? { refused: true } : { game: r }
      if (!['archive', 'systems', 'record', 'challenge', 'race'].includes(r.view)) return null
      if (locked && GATED_VIEWS.includes(r.view)) return { refused: true }
      return { view: r.view, landing: r.landing || null, section: r.section || null }
    } catch {
      return null
    }
  })
  const [recordSection, setRecordSection] = useState(() => initRoute?.section || null)
  // Report this connection: the connection being reported (null when closed).
  const [reportCtx, setReportCtx] = useState(null)
  const reportModal = reportCtx ? <ReportModal context={reportCtx} onClose={() => setReportCtx(null)} /> : null
  const [view, setView] = useState(() => (myPlexusPreview ? 'record' : initRoute?.view || 'home')) // 'home' | 'game' | 'archive' | 'systems' | 'challenge' | 'race'
  const [gameCtx, setGameCtx] = useState(null)
  const [challengePhase, setChallengePhase] = useState('intro')
  // A race join code carried in the URL hash (#race=CODE) drops a tapped
  // invite link straight into Race Mode's join screen.
  const [raceInitialCode, setRaceInitialCode] = useState('')
  // A shared race link: a popup offers to join, then goes straight to that
  // race's lobby. Joining from a link skips the Daily gate for that race
  // (kept for this tab, so a reload mid-race still works); Race opened from
  // Home still needs today's Daily.
  const [raceInvite, setRaceInvite] = useState('')
  const [inviteSignedIn, setInviteSignedIn] = useState(false)
  const [raceAutoJoin, setRaceAutoJoin] = useState(false)
  const [invitePass, setInvitePass] = useState(() => {
    try {
      return sessionStorage.getItem('plexus.raceInvitePass.v1') === '1'
    } catch {
      return false
    }
  })
  const setPass = (on) => {
    setInvitePass(on)
    try {
      if (on) sessionStorage.setItem('plexus.raceInvitePass.v1', '1')
      else sessionStorage.removeItem('plexus.raceInvitePass.v1')
    } catch {
      /* storage unavailable */
    }
  }
  const offerRaceInvite = (code) => {
    setRaceInvite(code)
    hasAccountSession().then(setInviteSignedIn)
  }
  const joinRaceInvite = () => {
    setPass(true)
    setRaceInitialCode(raceInvite)
    setRaceAutoJoin(true)
    setRaceInvite('')
    setGameCtx(null)
    setView('race')
  }
  const exitRace = () => {
    setPass(false)
    setRaceAutoJoin(false)
    setGameCtx(null)
    setView('home')
  }
  const [showHowTo, setShowHowTo] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [showStats, setShowStats] = useState(false)
  // A password reset link (or an expired one) opens Account at the right step.
  const [showAccount, setShowAccount] = useState(() => !!AUTH_REDIRECT && isSupabaseConfigured())
  const accountMode = AUTH_REDIRECT?.kind === 'recovery' ? 'reset' : AUTH_REDIRECT?.kind === 'link-error' ? (/expired|invalid|access_denied/i.test(`${AUTH_REDIRECT.code} ${AUTH_REDIRECT.description}`) ? 'expired' : 'in') : 'in'
  const [accountInitial, setAccountInitial] = useState(accountMode)
  const [stats, setStats] = useState(loadStats())
  const supaConfigured = isSupabaseConfigured()

  // Pull the signed-in player's cloud progress, merge it with what's on this
  // device (monotonic — never loses a streak), and refresh the UI. Runs on load
  // if already signed in, and on every sign-in / sign-out.
  // Your Tools start (starter Consult for new players, removed-tool
  // conversion) runs after any cloud sync, so a fresh device never treats an
  // existing player as new.
  const startTools = () => {
    try {
      ensureProgression()
    } catch {
      /* storage unavailable */
    }
    setRefreshTick((t) => t + 1)
  }
  const resyncProgress = () => {
    if (!supaConfigured) {
      startTools()
      return
    }
    syncProgress()
      .then((merged) => {
        if (merged) setStats(loadStats())
      })
      .catch(() => {
        /* best-effort — offline / not signed in is fine */
      })
      .finally(startTools)
  }

  useEffect(() => {
    if (!supaConfigured) {
      startTools()
      return undefined
    }
    resyncProgress()
    const off = onAuthChange(() => resyncProgress())
    return () => {
      if (typeof off === 'function') off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supaConfigured])

  // Two libraries, never mixed. 3 Minutes and Race read only the timed bank
  // (the existing bank minus entries removed at activation). Daily and Systems
  // read only the new library (utils/newLibrary.js). Nothing is merged in from
  // Supabase at runtime any more, so every player gets the same content.
  const bank = timedBank
  const [refreshTick, setRefreshTick] = useState(0)
  const [systemPlayNotice, setSystemPlayNotice] = useState(null)

  // On load, if the URL carries a Race invite (#race=CODE), open Race Mode's
  // join screen with the code prefilled.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const code = raceCodeFromHash(window.location.hash)
    if (code) {
      // Offer to join; the code lives in the popup now, so drop it from the
      // address so a refresh or later history entry does not reopen it.
      offerRaceInvite(code)
      setView('home')
      history.replaceState(history.state, '', window.location.pathname + window.location.search)
      return
    }
    // A server race in progress on this tab (reload or reconnect): go back to
    // it; the race screen resumes from the server's state.
    try {
      if (sessionStorage.getItem('plexus.raceMatch.v1')) {
        setView('race')
        return
      }
    } catch {
      /* storage unavailable */
    }
    // Signed in from Race in another tab (a confirmation link): go back to
    // that race once this tab is signed in. Race picks up the seat or code.
    // Without an email link, only a note from the last few minutes counts,
    // so an abandoned sign-in does not reopen Race later.
    const resume = readRaceResume(FROM_EMAIL_LINK ? undefined : 10 * 60 * 1000)
    if (resume?.code) {
      hasAccountSession().then((acct) => {
        if (!acct) return
        setRaceInitialCode(resume.code)
        setView('race')
      })
    }
  }, [])

  // A race link opened while Plexus is already open in this tab.
  useEffect(() => {
    const on = () => {
      const code = raceCodeFromHash(window.location.hash)
      if (!code) return
      offerRaceInvite(code)
      history.replaceState(history.state, '', window.location.pathname + window.location.search)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A shared Systems result links to its system (#system/Cardiology): open
  // that system's page, behind the same Daily gate as everything in Systems.
  const [systemLink, setSystemLink] = useState(() => systemFromHash(window.location.hash))
  useEffect(() => {
    const on = () => {
      const s = systemFromHash(window.location.hash)
      if (s) setSystemLink(s)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  // The player's local date and time zone (utils/calendar.js), kept current
  // across midnight, returning to the tab and time-zone changes.
  const clock = useToday()
  const todayKey = clock.key
  const timeZone = clock.tz
  const todayDayNumber = dayNumber(todayKey)

  // Today's Daily is "done" once it has been completed — the source of truth
  // is the per-date daily history, not one progress key, so replaying never
  // double-counts the day.
  const dailyDone = useMemo(() => {
    return !!getDailyHistory()[todayKey]?.completed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, refreshTick])

  // Daily gate: 3-Minute, Race, Systems and Review open once the CURRENT
  // Daily has been finished. Derived from the same Daily history as
  // dailyDone (cloud-merged for signed-in players), so it survives refreshes
  // and relocks by itself when a new Daily becomes current.
  const gate = useMemo(() => getDailyGate(todayKey), [todayKey, refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps
  const modesUnlocked = gate.unlocked

  // Restrained locked-mode feedback: one short status line, plus a single
  // pulse on the Play button so the way forward is obvious.
  const [lockNotice, setLockNotice] = useState(0)
  const lockTimer = useRef(null)
  const showLocked = () => {
    setLockNotice((n) => n + 1)
    clearTimeout(lockTimer.current)
    lockTimer.current = setTimeout(() => setLockNotice(0), 2800)
  }
  useEffect(() => () => clearTimeout(lockTimer.current), [])
  // Tapping a locked mode shows what it is and how to open it. It never
  // opens the mode or shows any puzzle content.
  const [lockedPreview, setLockedPreview] = useState(null)
  const openLockedPreview = (key) => (LOCKED_PREVIEWS[key] ? setLockedPreview(key) : showLocked())

  // A race invite (#race=CODE) that arrives before today's Daily is finished
  // is held here and used the first time Race is opened after unlocking.
  const [pendingRaceCode, setPendingRaceCode] = useState('')

  // Daily streak from the Daily history (breaks on a missed day; a Streak
  // Shield can cover one). Replaces the old stats counter everywhere it shows.
  const streak = useMemo(
    () => streakInfo(loadProgression(), getDailyHistory(), todayKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayKey, refreshTick]
  )

  // Compact progression read for the Home level line and This Week line.
  const recordHome = useMemo(() => {
    try {
      return recordSnapshot({ history: getDailyHistory(), todayKey })
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, refreshTick])

  const systemProgress = useMemo(() => getSystemProgress(), [refreshTick])
  const continueSystem = dailyDone ? systemProgress.lastPlayedSystem : null
  // Systems boards finished on this device (merged with the cloud copy for
  // signed-in players).
  const finishedBoards = useMemo(() => getSystemsBoards(), [refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps
  // Attempts per Systems board (synced with the XP ledger): orders each
  // subject's queue of unsolved boards.
  const boardAttempts = useMemo(() => systemAttempts(finishedBoards), [finishedBoards, refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps
  // My Plexus: Systems boards completed out of boards available today.
  const systemsBoardTotals = useMemo(() => {
    let completed = 0
    let available = 0
    for (const subject of LIBRARY_SUBJECTS) {
      const p = subjectProgress(subject, todayKey, finishedBoards, boardAttempts)
      completed += p.completed
      available += p.total
    }
    return { completed, available }
  }, [todayKey, finishedBoards])
  const continueSystemCounts = useMemo(() => {
    if (!continueSystem) return { total: 0, solved: 0 }
    const p = subjectProgress(continueSystem, todayKey, finishedBoards, boardAttempts)
    return { total: p.total, solved: p.completed }
  }, [continueSystem, todayKey, finishedBoards])
  const challengeBest = useMemo(() => getChallengeStats().personalBest, [refreshTick])
  // Total Dailies ever completed — feeds only the ambient homepage network
  // (Section 10). Derived from existing history; no new persistence.
  const dailiesCompleted = useMemo(() => {
    const h = getDailyHistory()
    return Object.values(h).filter((e) => e?.completed).length
  }, [refreshTick])

  useEffect(() => {
    if (view === 'home') setRefreshTick((t) => t + 1)
  }, [view])

  // One-time XP backfill for players who were here before progression:
  // credit what history records reliably, then never run again.
  useEffect(() => {
    try {
      const m = getConceptMastery()
      // Lookups only: earlier history refers to the old bank, newer to the
      // new library.
      const bankById = { ...Object.fromEntries(connectionBank.map((c) => [c.id, c])), ...libraryConnectionMap() }
      const systems = SYSTEMS.filter((sys) => {
        const c = systemMasteryCounts(connectionBank, sys, m)
        return c.total > 0 && c.solved >= c.total
      })
      const sp = getSystemProgress()
      const systemWins = Object.values(sp.perSystem || {}).reduce((n, x) => n + (x.completed || 0), 0)
      const r = backfillIfNeeded({ history: getDailyHistory(), mastery: m, bankById, systems, challenge: getChallengeStats(), systemWins })
      if (r) setRefreshTick((t) => t + 1)
    } catch {
      /* best-effort */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Purely presentational: paint each screen its own full-viewport Plexus
  // environment colour by toggling a class on <body> (so the colour bleeds
  // past the centred app-shell rather than stopping at it). Home is
  // indigo, the Daily/Archive board is cranberry, a system puzzle stays
  // in the peacock Systems room, Review is raspberry, and the 3-Minute
  // Challenge is cobalt (deepened to midnight blue while a round is live). The
  // hidden #dev route stays on the plain neutral surface. Toggles CSS
  // classes only — no effect on any game logic or state.
  useEffect(() => {
    const b = document.body
    const gameMode = gameCtx?.mode
    // Legal pages sit on the Home room whatever is underneath.
    const v = legalPage ? 'legal' : view
    const isDailyBoard = v === 'game' && (gameMode === 'daily' || gameMode === 'archive')
    const isSystemBoard = v === 'game' && gameMode === 'system'
    b.classList.toggle('bg-home', !isDevRoute && (v === 'home' || v === 'legal'))
    b.classList.toggle('env-daily', !isDevRoute && isDailyBoard)
    b.classList.toggle('env-systems', !isDevRoute && (v === 'systems' || isSystemBoard))
    b.classList.toggle('env-review', !isDevRoute && v === 'archive')
    b.classList.toggle('env-challenge', !isDevRoute && v === 'challenge')
    b.classList.toggle('env-record', !isDevRoute && v === 'record')
    b.classList.toggle('env-race', !isDevRoute && v === 'race')
    b.classList.toggle('bg-challenge-focus', !isDevRoute && v === 'challenge' && challengePhase === 'playing')
  }, [view, legalPage, gameCtx, challengePhase, isDevRoute])

  const goHome = () => {
    setGameCtx(null)
    setView('home')
  }

  const navigate = (key) => {
    if (!modesUnlocked && GATED_VIEWS.includes(key)) {
      showLocked()
      return
    }
    if (key === 'challenge') setChallengePhase('intro')
    if (key === 'systems') {
      setSystemsSelected(null)
      setSystemsLanding(null)
      setSystemsNotice(null)
    }
    setView(key)
  }

  // Route protection: whatever path leads into a gated view (nav, a hash
  // link, an internal button, a stale state), it is sent back to Today with
  // the same notice. Render-time check below keeps it from flashing.
  const blockedView = !modesUnlocked && isGatedView(view, gameCtx?.mode) && !(view === 'race' && invitePass)
  useEffect(() => {
    if (!blockedView) return
    replaceNextRoute.current = true
    if (view === 'race' && raceInitialCode) setPendingRaceCode(raceInitialCode)
    setGameCtx(null)
    setView('home')
    showLocked()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedView])

  // One-time unlock moment on Home after the Daily is finished.
  const justUnlocked = modesUnlocked && view === 'home' && !hasSeenUnlock(gate.currentKey)
  useEffect(() => {
    if (!justUnlocked) return undefined
    const t = setTimeout(() => markUnlockSeen(gate.currentKey), 1600)
    return () => clearTimeout(t)
  }, [justUnlocked, gate.currentKey])

  const openArchiveDay = (dateStr, puzzle, wasCompleted) => {
    const isToday = dateStr === todayKey
    if (!isToday && !modesUnlocked) {
      // A past Daily is Review content: locked until today's is finished.
      setGameCtx(null)
      setView('home')
      showLocked()
      return
    }
    const challengeDayNumber = dayNumber(dateStr)
    setGameCtx({
      puzzle,
      mode: isToday ? 'daily' : 'archive',
      progressKey: `daily-${dateStr}`,
      headerLabel: isToday ? `Daily #${todayDayNumber}` : `Archive · ${dateStr}`,
      resultTitle: isToday ? 'Today’s Plexus' : `Plexus for ${formatDayKey(dateStr, { weekday: 'short', month: 'short', day: 'numeric' })}`,
      dailyNumber: puzzle.number,
      dailyStreak: streak.current,
      dateForHistory: dateStr,
      challengeDayNumber,
      isToday,
    })
    setView('game')
  }

  // Recipient of a "Challenge a friend" link: resolve the day number back to
  // its Daily and open it. No sender data is present (or shown).
  const openChallenge = (n) => {
    const key = dateKeyFromDayNumber(n)
    const puzzle = getPlayableDailyForDate(key, todayKey)
    window.location.hash = ''
    setChallengeInvite(null)
    if (!puzzle) {
      setView('home')
      return
    }
    openArchiveDay(key, puzzle, !!getDailyHistory()[key]?.completed)
  }

  const openDailyToday = () => {
    const puzzle = getDailyPuzzleForDate(todayKey)
    if (!puzzle) return
    openArchiveDay(todayKey, puzzle, dailyDone)
  }


  // Systems: each subject is a queue of unsolved boards (utils/newLibrary.js
  // subjectProgress). Play opens the head of the queue. A board left after a
  // guess, or lost, goes to the back; a solved board leaves the queue. When
  // nothing is left the Systems page shows the subject as connected.
  const [systemsSelected, setSystemsSelected] = useState(() => initRoute?.landing || null)
  // Phone only: the system whose landing page is open (null = the directory).
  const [systemsLanding, setSystemsLanding] = useState(() => initRoute?.landing || null)
  const [systemsNotice, setSystemsNotice] = useState(null)
  const openBoard = (system, board, index, { replay = false } = {}) => {
    const puzzle = systemsBoardPuzzle(board, index)
    if (!puzzle) {
      setSystemPlayNotice(`This ${subjectLabel(system)} board could not be loaded.`)
      return false
    }
    const boards = getSystemsBoards()
    const solved = !!boards[board.id]?.won
    const saved = loadProgress(puzzle.id)
    // A finished-but-unsolved board (from before boards rotated) or a replay
    // starts fresh; an unfinished attempt resumes (same attempt, same count).
    if (replay || (saved?.gameOver && !saved.won)) clearProgress(puzzle.id)
    const resuming = !replay && saved && !saved.gameOver && saved.attemptId && loadProgression().ledger[`sysattempt:${board.id}:${saved.attemptId}`]
    const tries = systemAttempts(boards)[board.id]?.count || 0
    const n = tries + (resuming ? 0 : 1)
    setSystemPlayNotice(null)
    setSystemsNotice(null)
    setGameCtx({
      puzzle,
      mode: 'system',
      progressKey: puzzle.id,
      headerLabel: `${subjectLabel(system)} · Board ${index + 1}`,
      resultTitle: 'Puzzle Results',
      system,
      boardId: board.id,
      isDaily: false,
      attempt: Date.now(),
      systemAttempt: solved ? null : { n, xp: attemptXp(n) },
      systemCompletion: null,
    })
    setView('game')
    return true
  }
  const playSystem = (system) => {
    if (!modesUnlocked) {
      showLocked()
      return
    }
    const boards = getSystemsBoards()
    const p = subjectProgress(system, todayKey, boards, systemAttempts(boards))
    if (!p.next) {
      setSystemPlayNotice(null)
      setSystemsSelected(system)
      setSystemsLanding(system)
      setGameCtx(null)
      setView('systems')
      return
    }
    // A board with an attempt still in progress (the app was closed or
    // refreshed mid-board) resumes first, with its mistakes and try count.
    const open = p.queue.find((x) => {
      const saved = loadProgress(x.board.id)
      return saved && !saved.gameOver && Array.isArray(saved.guessLog) && saved.guessLog.length > 0
    })
    const pick = open || p.next
    openBoard(system, pick.board, pick.index)
  }

  // Leave a Systems board (Back, or Back to Systems on the result). After a
  // submitted guess an unsolved board's attempt is over: its saved state is
  // cleared (nothing is revealed) and it moves to the back of the queue.
  // The bookkeeping of leaving a board, shared with browser Back.
  const endSystemBoard = (ctx) => {
    if (!ctx || ctx.mode !== 'system') return
    setRefreshTick((t) => t + 1)
    const saved = loadProgress(ctx.progressKey)
    const interacted = !!(saved && Array.isArray(saved.guessLog) && saved.guessLog.length > 0)
    if (saved && !saved.won) {
      clearProgress(ctx.progressKey)
      if (interacted && !saved.gameOver && ctx.systemAttempt) setSystemsNotice({ title: 'Still connecting…', text: 'This puzzle will come back around.' })
    }
  }
  const leaveSystemBoard = () => {
    const ctx = gameCtx
    if (ctx && ctx.mode === 'system') {
      endSystemBoard(ctx)
      setSystemsSelected(ctx.system)
      setSystemsLanding(ctx.system)
    }
    setGameCtx(null)
    setRefreshTick((t) => t + 1)
    setView('systems')
  }

  // Explicit replay of a solved board (from the Systems page): a fresh attempt.
  // Tools used in it are spent again; XP is never paid again, and This Week
  // counts the board once per week.
  const playSystemBoard = (system, board, index) => {
    if (!modesUnlocked) {
      showLocked()
      return
    }
    openBoard(system, board, index, { replay: true })
  }

  // The two actions after a Systems board ends: the next unsolved board in the
  // same subject (or the same board again when it is the only one left, or the
  // subject's completion when none are), and Back to Systems.
  const systemActionsFor = (ctx) => {
    if (!ctx || ctx.mode !== 'system') return null
    const p = subjectProgress(ctx.system, todayKey, finishedBoards, boardAttempts)
    const others = p.queue.filter((x) => x.board.id !== ctx.boardId)
    const back = { label: 'Back to Systems', onClick: leaveSystemBoard }
    if (!p.queue.length) return { primary: { label: 'View System Completion', onClick: leaveSystemBoard }, secondary: back, othersLeft: 0 }
    if (!others.length) {
      const only = p.queue[0]
      return { primary: { label: 'Try again', onClick: () => openBoard(ctx.system, only.board, only.index) }, secondary: back, othersLeft: 0 }
    }
    return { primary: { label: 'Next Puzzle', onClick: () => playSystem(ctx.system) }, secondary: back, othersLeft: others.length }
  }
  const onSystemAttemptStart = (attemptId) => {
    if (!gameCtx || gameCtx.mode !== 'system') return
    if (recordSystemAttemptStart({ boardId: gameCtx.boardId, attemptId, system: gameCtx.system })) {
      if (supaConfigured) pushProgress(snapshotLocal())
    }
  }

  const handleContinueStudying = () => {
    if (!modesUnlocked) {
      showLocked()
      return
    }
    if (!continueSystem) {
      setView('systems')
      return
    }
    playSystem(continueSystem)
  }

  const handleFinish = ({ won, mistakes, guessLog, puzzle, toolsUsed = 0 }) => {
    if (!gameCtx) return null
    const { mode, dateForHistory, isToday, system } = gameCtx
    let progression = null

    recordWeakSpots(buildWeakSpotResults(puzzle, guessLog))
    recordNearMissConfusions(buildNearMissResults(puzzle, guessLog))

    if (mode === 'daily' || mode === 'archive') {
      // Count a Daily's completion (history + streak/stats) only the FIRST
      // time that date is completed. A later replay records nothing toward
      // streak/history, so it can never double-count or inflate.
      const alreadyCompleted = !!getDailyHistory()[dateForHistory]?.completed
      if (!alreadyCompleted) {
        recordDailyHistory({
          date: dateForHistory,
          puzzleId: puzzle.id,
          puzzleNumber: puzzle.number,
          completed: true,
          won,
          mistakes,
          // The instant it was finished, kept apart from the puzzle's date,
          // plus the local date, UTC offset and time zone at that moment, so
          // later travel never changes whether it was on time.
          ...finishStamp(),
        })
        const updated = recordResult({ won, mistakes, isDaily: true, dailyKey: dateForHistory, countsTowardStreak: isToday })
        setStats(updated)
        progression = recordDailyFinish({
          dateKey: dateForHistory,
          isToday,
          puzzle,
          won,
          mistakes,
          guessLog,
          toolsUsed,
          history: getDailyHistory(),
        })
      }
    } else if (mode === 'system') {
      recordConceptMastery(buildMasteryResults(puzzle, guessLog))
      const correctGuesses = guessLog.filter((g) => g.correct).length
      const totalGuesses = guessLog.length
      const solvedCount = new Set(guessLog.filter((g) => g.correct).map((g) => g.catIndexes[0])).size
      recordSystemAttempt({
        puzzleId: puzzle.id,
        system,
        won,
        mistakes,
        correctGuesses,
        totalGuesses,
        categoriesMissed: 4 - solvedCount,
      })
      const updated = recordResult({ won, mistakes, isDaily: false, countsTowardStreak: false })
      setStats(updated)
      // Only a solved board is recorded as complete. A lost board records
      // no completion and no XP, and is cleared so it comes back fresh.
      const boardId = gameCtx.boardId || puzzle.id
      // Count tries before this solve is written (an old unsolved entry counts as a try).
      const tries = systemAttempts(getSystemsBoards())[boardId]?.count || 1
      const finished = won ? recordSystemsBoardFinish(boardId, { won, mistakes, subject: system }) : getSystemsBoards()
      const counts = subjectProgress(system, todayKey, finished)
      progression = recordSystemFinish({
        puzzle,
        system,
        won,
        guessLog,
        boardId,
        attempts: tries,
        systemComplete: won && counts.total > 0 && counts.completed >= counts.total,
      })
      if (!won) clearProgress(gameCtx.progressKey)
      if (won && progression?.connectedNow) {
        setGameCtx((c) => (c && c.boardId === boardId ? { ...c, systemCompletion: { label: subjectLabel(system), total: counts.total, accent: systemAccent(system), palette: systemConfettiPalette(system) } } : c))
      }
    }
    setRefreshTick((t) => t + 1)
    // Back up the just-updated progress to the cloud (no-op for guests / when
    // Supabase isn't configured). Fire-and-forget — never blocks the UI.
    if (supaConfigured) pushProgress(snapshotLocal())
    return progression
  }

  // ---------------------------------------------------------------------
  // Browser history. Every app screen is one history entry (same address;
  // the screen lives in history.state), so browser Back and Forward follow
  // the player through Today, Systems and a system's page, the Archive,
  // My Plexus, 3 Minutes, Race and the boards. Rules:
  //   • a new screen pushes an entry; going to the screen the previous entry
  //     already shows steps back instead, so in-app Back and browser Back
  //     agree and history never fills with duplicates;
  //   • moving from one board to the next replaces the board's entry, and
  //     leaving a board replaces it when its parent is not the entry below;
  //   • entries restore a screen, never an action: going Back or Forward to a
  //     Systems board opens that system's page (no board is picked or
  //     started), and a Daily reopens from its saved progress, so nothing is
  //     paid, spent or counted again;
  //   • leaving a Systems board after a guess, or a 3 Minutes run in play,
  //     asks first, exactly as the in-app Back does;
  //   • a refresh reopens the same screen, behind the same Daily gate.
  // At the first entry, Back leaves the site as usual.
  const wide = useWideLayout()
  const route = useMemo(() => {
    if (view === 'game' && gameCtx) {
      return gameCtx.mode === 'system'
        ? { view: 'game', mode: 'system', system: gameCtx.system }
        : { view: 'game', mode: gameCtx.mode, date: gameCtx.dateForHistory }
    }
    if (view === 'systems') return { view, landing: wide ? null : systemsLanding }
    if (view === 'record') return { view, section: recordSection || null }
    return { view }
  }, [view, gameCtx, wide, systemsLanding, recordSection])
  const routeKey = JSON.stringify(route)
  const routeKeyRef = useRef(routeKey)
  routeKeyRef.current = routeKey
  const fromPop = useRef(false)
  const replaceNextRoute = useRef(!!initRoute?.refused)
  // A refresh that reopens a board waits for it before writing history; one
  // the gate refused replaces its entry with Today.
  const restoring = useRef(!!initRoute?.game)
  // The first write after a page load only ever replaces the current entry.
  const firstSync = useRef(true)
  const overlayRoute = isDevRoute || !!legalPage || challengeInvite !== null || !!myPlexusPreview
  useEffect(() => {
    if (overlayRoute) return
    if (restoring.current) {
      if (route.view !== 'game' && !replaceNextRoute.current) return
      restoring.current = false
      fromPop.current = true
    }
    const cur = history.state?.plexus
    const entry = (prevKey) => ({ ...(history.state || {}), plexus: { route, key: routeKey, prevKey } })
    if (firstSync.current) {
      firstSync.current = false
      fromPop.current = false
      replaceNextRoute.current = false
      if (!cur || cur.key !== routeKey) history.replaceState(entry(cur?.prevKey ?? null), '')
      return
    }
    if (fromPop.current) {
      fromPop.current = false
      replaceNextRoute.current = false
      if (!cur || cur.key !== routeKey) history.replaceState(entry(cur?.prevKey ?? null), '')
      return
    }
    if (cur?.key === routeKey) return
    if (!cur) {
      history.replaceState(entry(null), '')
      return
    }
    const leavingBoard = cur.route?.view === 'game' && cur.route.mode === 'system'
    if (replaceNextRoute.current || (cur.route?.view === 'game' && route.view === 'game')) {
      replaceNextRoute.current = false
      history.replaceState(entry(cur.prevKey), '')
      return
    }
    if (cur.prevKey === routeKey) {
      history.back()
      return
    }
    if (leavingBoard) {
      history.replaceState(entry(cur.prevKey), '')
      return
    }
    history.pushState(entry(cur.key), '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, overlayRoute])

  // Open a remembered screen without adding history.
  const applyRoute = (r) => {
    if (!r) return
    if (!modesUnlocked && (GATED_VIEWS.includes(r.view) || (r.view === 'game' && r.mode !== 'daily' && r.date !== todayKey))) {
      replaceNextRoute.current = true
      setGameCtx(null)
      setView('home')
      showLocked()
      return
    }
    if (r.view === 'game') {
      if (r.mode === 'system') {
        replaceNextRoute.current = true
        setGameCtx(null)
        setSystemsSelected(r.system)
        setSystemsLanding(r.system)
        setView('systems')
        return
      }
      const puzzle = r.date === todayKey ? getDailyPuzzleForDate(todayKey) : getPlayableDailyForDate(r.date, todayKey)
      if (puzzle) openArchiveDay(r.date, puzzle, !!getDailyHistory()[r.date]?.completed)
      else {
        replaceNextRoute.current = true
        setGameCtx(null)
        setView('home')
      }
      return
    }
    setGameCtx(null)
    if (r.view === 'systems') {
      setSystemsSelected(r.landing || null)
      setSystemsLanding(r.landing || null)
    }
    if (r.view === 'record') setRecordSection(r.section || null)
    if (r.view === 'challenge') setChallengePhase('intro')
    setView(r.view)
  }

  // Browser Back during a board after a guess, or a 3 Minutes run in play:
  // stay put and ask, the same question the in-app Back asks.
  const [exitRequest, setExitRequest] = useState(0)
  const popGuard = () => {
    if (view === 'challenge' && challengePhase === 'playing') return true
    if (view === 'game' && gameCtx?.mode === 'system' && gameCtx.systemAttempt) {
      const saved = loadProgress(gameCtx.progressKey)
      return !!(saved && !saved.gameOver && Array.isArray(saved.guessLog) && saved.guessLog.length > 0)
    }
    return false
  }
  const popHandler = useRef(() => {})
  popHandler.current = (e) => {
    const p = e.state?.plexus
    if (!p || overlayRoute) return
    if (p.key === routeKeyRef.current) return
    if (popGuard()) {
      history.pushState(history.state && history.state.plexus?.key === routeKeyRef.current ? history.state : { plexus: { route, key: routeKey, prevKey: p.key } }, '')
      setExitRequest((n) => n + 1)
      return
    }
    if (view === 'game' && gameCtx?.mode === 'system') endSystemBoard(gameCtx)
    fromPop.current = true
    applyRoute(p.route)
  }
  useEffect(() => {
    const onPop = (e) => popHandler.current(e)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  // A refresh: reopen the screen this entry was showing.
  useEffect(() => {
    if (initRoute?.game) applyRoute(initRoute.game)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!systemLink) return
    history.replaceState(history.state, '', window.location.pathname + window.location.search)
    if (modesUnlocked) {
      setGameCtx(null)
      setSystemsSelected(systemLink)
      setSystemsLanding(systemLink)
      setView('systems')
    } else {
      setGameCtx(null)
      setView('home')
      openLockedPreview('systems')
    }
    setSystemLink(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemLink])

  // After an asked-for exit (board or 3 Minutes run) that started as browser
  // Back, finish the step back.
  const finishRequestedExit = () => setTimeout(() => history.back(), 0)

  // Account dialog: on every screen, including Race (which can open it for
  // a guest who wants to sign in without leaving the lobby).
  const accountModal = showAccount ? (
    <AuthModal
      initialMode={accountInitial}
      onClose={() => {
        setShowAccount(false)
        setAccountInitial('in')
        clearAuthHash()
      }}
      onAuthChanged={resyncProgress}
      onOpenLegal={openLegal}
    />
  ) : null

  if (isDevRoute) {
    return (
      <Suspense fallback={null}>
        <DevViewer />
      </Suspense>
    )
  }

  // Recipient entry for a Challenge link — lightweight, spoiler-free: no
  // sender time/mistakes/score, no answers, just an invite to play.
  if (challengeInvite !== null) {
    return (
      <div className="app-shell">
        <div className="challenge-invite">
          <BrandMark size={44} decorative />
          <h1 className="challenge-invite-title">Plexus</h1>
          <p className="challenge-invite-line">
            You&rsquo;ve been challenged to Daily {String(challengeInvite).padStart(3, '0')}.
          </p>
          <button className="play-today-btn" onClick={() => openChallenge(challengeInvite)}>
            Play
            <span className="play-today-btn-arrow" aria-hidden="true">
              {' '}
              &rarr;
            </span>
          </button>
          <button
            className="text-link challenge-invite-later"
            onClick={() => {
              window.location.hash = ''
              setChallengeInvite(null)
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    )
  }

  if (legalPage && !isDevRoute) {
    return (
      <div className="app-shell">
        {legalPage === 'support' ? (
          <SupportPage onBack={closeLegal} onNavigate={openLegal} />
        ) : (
          <Legal page={legalPage} onBack={closeLegal} onNavigate={openLegal} />
        )}
      </div>
    )
  }

  if (view === 'game' && gameCtx && !blockedView) {
    return (
      <div className="app-shell">
        <Game
          key={`${gameCtx.progressKey}:${gameCtx.attempt || 0}`}
          puzzle={gameCtx.puzzle}
          isDaily={gameCtx.mode === 'daily' || gameCtx.mode === 'archive'}
          progressKey={gameCtx.progressKey}
          headerLabel={gameCtx.headerLabel}
          resultTitle={gameCtx.resultTitle}
          shareLabel={gameCtx.mode === 'system' ? subjectLabel(gameCtx.system) : undefined}
          dailyNumber={gameCtx.dailyNumber}
          dailyStreak={gameCtx.isToday ? streak.current : 0}
          dailyPerfectStreak={gameCtx.isToday ? stats.currentPerfectStreak : 0}
          challengeDayNumber={gameCtx.mode === 'system' ? null : gameCtx.challengeDayNumber}
          onExit={gameCtx.mode === 'system' ? leaveSystemBoard : goHome}
          onOpenRecord={() => {
            setGameCtx(null)
            setRecordSection(null)
            setView('record')
          }}
          onReport={setReportCtx}
          reportMode={gameCtx.mode}
          puzzleDate={gameCtx.mode === 'system' ? null : gameCtx.dateForHistory}
          onFinish={handleFinish}
          onKnowledgeSignal={recordKnowledgeSignal}
          onReplay={null}
          onAttemptStart={gameCtx.mode === 'system' ? onSystemAttemptStart : null}
          systemAttempt={gameCtx.systemAttempt || null}
          systemActions={systemActionsFor(gameCtx)}
          systemCompletion={gameCtx.systemCompletion || null}
          onPlayTimed={gameCtx.mode === 'daily' ? () => navigate('challenge') : null}
          shareUrl={gameCtx.mode === 'system' ? appLink(`#system/${encodeURIComponent(gameCtx.system)}`) : appLink(`#challenge/${gameCtx.challengeDayNumber}`)}
          exitRequest={exitRequest}
          onRequestedExit={() => {
            endSystemBoard(gameCtx)
            finishRequestedExit()
          }}
        />
        {reportModal}
      </div>
    )
  }

  if (view === 'record') {
    return (
      <div className="app-shell app-shell-wide">
        <Record
          systemsBoards={systemsBoardTotals}
          history={getDailyHistory()}
          todayKey={todayKey}
          stats={stats}
          preview={myPlexusPreview}
          initialSection={recordSection}
          onBack={() => {
            if (myPlexusPreview) {
              window.location.hash = ''
              setMyPlexusPreview(null)
            }
            goHome()
          }}
        />
      </div>
    )
  }

  if (view === 'challenge' && !blockedView) {
    return (
      <div className="app-shell">
        <Analytics />
        {challengePhase !== 'playing' && <AppNav active="challenge" onNavigate={navigate} />}
        <Challenge bank={bank} onExit={goHome} onPhaseChange={setChallengePhase} exitRequest={exitRequest} onRequestedExit={finishRequestedExit} />
      </div>
    )
  }

  if (view === 'race' && !blockedView) {
    return (
      <div className="app-shell">
        <Analytics />
        <Race bank={bank} initialCode={raceInitialCode} autoJoin={raceAutoJoin} onExit={exitRace} onSignIn={supaConfigured ? () => setShowAccount(true) : null} />
        {accountModal}
      </div>
    )
  }

  if (view === 'archive' && !blockedView) {
    return (
      <div className="app-shell">
        <Analytics />
        <AppNav active="archive" onNavigate={navigate} />
        <Archive dailyHistory={getDailyHistory()} onOpenDay={openArchiveDay} onBack={goHome} currentStreak={streak.current} />
      </div>
    )
  }

  if (view === 'systems' && !blockedView) {
    return (
      <div className="app-shell app-shell-systems">
        <Analytics />
        <AppNav active="systems" onNavigate={navigate} />
        <Systems
          todayKey={todayKey}
          finishedBoards={finishedBoards}
          boardAttempts={boardAttempts}
          initialSelected={systemsSelected}
          onSelectedChange={setSystemsSelected}
          landing={wide ? null : systemsLanding}
          onOpenLanding={setSystemsLanding}
          onCloseLanding={() => {
            setSystemsLanding(null)
            setSystemsSelected(null)
          }}
          notice={systemsNotice}
          onClearNotice={() => setSystemsNotice(null)}
          onPlaySystem={playSystem}
          onReplayBoard={playSystemBoard}
          onBack={goHome}
          playNotice={systemPlayNotice}
          onDismissPlayNotice={() => setSystemPlayNotice(null)}
        />
      </div>
    )
  }

  return (
    <div className="app-shell app-shell-home">
      <Analytics />
      <AppNav active="home" onNavigate={navigate} locked={!modesUnlocked} onLocked={openLockedPreview} />
      <Home
        key={todayKey}
        todayKey={todayKey}
        timeZone={timeZone}
        onReport={setReportCtx}
        dailyNumber={todayDayNumber}
        dailyDone={dailyDone}
        currentStreak={streak.current}
        longestStreak={streak.longest}
        streakWeek={streak.week}
        continueSystem={continueSystem}
        continueSystemSolved={continueSystemCounts.solved}
        continueSystemTotal={continueSystemCounts.total}
        challengeBest={challengeBest}
        dailiesCompleted={dailiesCompleted}
        onPlayDaily={openDailyToday}
        onOpenSystems={() => navigate('systems')}
        onContinueStudying={handleContinueStudying}
        onStartChallenge={() => navigate('challenge')}
        onStartRace={() => {
          if (!modesUnlocked) {
            showLocked()
            return
          }
          setRaceInitialCode(pendingRaceCode)
          setPendingRaceCode('')
          setView('race')
        }}
        locked={!modesUnlocked}
        justUnlocked={justUnlocked}
        onLocked={openLockedPreview}
        nudge={lockNotice}
        onOpenStats={() => setShowStats(true)}
        onOpenRecord={(section) => {
          setRecordSection(typeof section === 'string' ? section : null)
          setView('record')
        }}
        record={recordHome}
        onOpenHowTo={() => setShowHowTo(true)}
        onOpenAccount={supaConfigured ? () => setShowAccount(true) : null}
        onOpenLegal={openLegal}
      />
      {lockNotice > 0 && (
        <p key={lockNotice} className="lock-notice" role="status">
          <LockGlyph size={13} />
          {LOCK_COPY}
        </p>
      )}
      {showHowTo && (
        <HowToModal
          onClose={() => setShowHowTo(false)}
          onInstall={() => {
            setShowHowTo(false)
            setShowInstall(true)
          }}
        />
      )}
      {showInstall && <InstallGuide onClose={() => setShowInstall(false)} />}
      {lockedPreview && (
        <Modal title={LOCKED_PREVIEWS[lockedPreview].title} onClose={() => setLockedPreview(null)} className="locked-preview">
          <p className="locked-preview-text">{LOCKED_PREVIEWS[lockedPreview].text}</p>
          <p className="locked-preview-rule">
            <LockGlyph size={14} />
            <span>{LOCK_COPY}</span>
          </p>
          <div className="leave-board-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setLockedPreview(null)
                openDailyToday()
              }}
            >
              {dailyDone ? 'View today’s Daily' : 'Play today’s Daily'}
            </button>
            <button type="button" className="secondary-btn" onClick={() => setLockedPreview(null)}>
              Not now
            </button>
          </div>
        </Modal>
      )}
      {reportModal}
      {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}
      {accountModal}
      {raceInvite && <RaceInvitePrompt code={raceInvite} signedIn={inviteSignedIn} onJoin={joinRaceInvite} onClose={() => {
        // Not now: the code waits until Race is opened from Home.
        setPendingRaceCode(raceInvite)
        setRaceInvite('')
      }} />}
      <InstallPrompt />
    </div>
  )
}

// What each locked mode is, for the preview shown when it is tapped.
const LOCKED_PREVIEWS = {
  challenge: { title: '3 Minutes', text: 'A fast mix of medical connection challenges. Score as many as you can before the clock runs out.' },
  race: { title: 'Race', text: 'Race a friend through the same rounds. Share a code, and the faster, sharper player wins.' },
  systems: { title: 'Systems', text: 'Practice one organ system at a time, from Cardiology to Genetics. Boards stay open until you solve them.' },
  archive: { title: 'Archive', text: 'Play past Dailies you missed, and look back at the connections you have solved.' },
}

// Desktop layout (Systems shows a preview there instead of a page per system).
function useWideLayout() {
  const q = '(min-width: 900px)'
  const [wide, setWide] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false))
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const mq = window.matchMedia(q)
    const on = () => setWide(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return wide
}

// #system/<subject> from a shared Systems result (any library subject).
function systemFromHash(hash) {
  const m = /^#system\/(.+)$/.exec(String(hash || ''))
  if (!m) return null
  let id = ''
  try {
    id = decodeURIComponent(m[1])
  } catch {
    return null
  }
  return LIBRARY_SUBJECTS.includes(id) ? id : null
}
