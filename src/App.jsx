import React, { useEffect, useMemo, useRef, useState } from 'react'
import connectionBank from './data/connectionBank.js'
import Home from './components/Home.jsx'
import Game from './components/Game.jsx'
import Archive from './components/Archive.jsx'
import Systems from './components/Systems.jsx'
import Challenge from './components/Challenge.jsx'
import Race from './components/Race.jsx'
import { raceCodeFromHash } from './utils/raceEngine.js'
import AppNav from './components/AppNav.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import AuthModal from './components/AuthModal.jsx'
import Legal, { LEGAL_PAGES } from './components/Legal.jsx'
import SupportPage from './components/SupportPage.jsx'
import ReportModal from './components/ReportModal.jsx'
import HowToModal from './components/HowToModal.jsx'
import { isSupabaseConfigured } from './lib/supabaseClient.js'
import { onAuthChange } from './lib/auth.js'
import { syncProgress, pushProgress } from './lib/progressRepo.js'
import { snapshotLocal } from './utils/progressSync.js'
import { timedBank } from './utils/timedLibrary.js'
import { subjectProgress, libraryConnectionMap, subjectLabel } from './utils/newLibrary.js'
import StatsModal from './components/StatsModal.jsx'
import DevViewer from './components/DevViewer.jsx'
import BrandMark from './components/BrandMark.jsx'
import { dayNumber, dateKeyFromDayNumber } from './utils/game.js'
import { finishStamp, useToday } from './utils/calendarHooks.js'
import { getDailyPuzzleForDate, getPlayableDailyForDate } from './utils/dailyPuzzle.js'
import { getDailyGate, isGatedView, GATED_VIEWS, LOCK_COPY, hasSeenUnlock, markUnlockSeen } from './utils/dailyGate.js'
import LockGlyph from './components/LockGlyph.jsx'
import Record from './components/Record.jsx'
import { recordDailyFinish, recordSystemFinish, backfillIfNeeded, streakInfo, loadProgression, recordSnapshot } from './progression/store.js'
import { SYSTEMS } from './data/constants.js'
import { systemMasteryCounts } from './utils/mastery.js'
import {
  loadStats,
  recordResult,
  loadProgress,
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
  const [isDevRoute, setIsDevRoute] = useState(() => window.location.hash === '#dev')
  const [challengeInvite, setChallengeInvite] = useState(() => parseChallengeHash())
  // Terms / Privacy / Disclaimer have their own links (#terms etc.) so they can
  // be shared, and open over whatever screen is current. Never locked.
  const parseLegalHash = () => {
    const h = window.location.hash.replace(/^#/, '')
    return LEGAL_PAGES.includes(h) || h === 'support' ? h : null
  }
  const [legalPage, setLegalPage] = useState(() => parseLegalHash())
  const openLegal = (page) => {
    window.location.hash = page
    setLegalPage(page)
  }
  const closeLegal = () => {
    setLegalPage(null)
    if ([...LEGAL_PAGES, 'support'].includes(window.location.hash.replace(/^#/, ''))) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }
  useEffect(() => {
    const onHashChange = () => {
      setIsDevRoute(window.location.hash === '#dev')
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
  const [recordSection, setRecordSection] = useState(null)
  // Report this connection: the connection being reported (null when closed).
  const [reportCtx, setReportCtx] = useState(null)
  const reportModal = reportCtx ? <ReportModal context={reportCtx} onClose={() => setReportCtx(null)} /> : null
  const [view, setView] = useState(() => (myPlexusPreview ? 'record' : 'home')) // 'home' | 'game' | 'archive' | 'systems' | 'challenge' | 'race'
  const [gameCtx, setGameCtx] = useState(null)
  const [challengePhase, setChallengePhase] = useState('intro')
  // A race join code carried in the URL hash (#race=CODE) drops a tapped
  // invite link straight into Race Mode's join screen.
  const [raceInitialCode, setRaceInitialCode] = useState('')
  const [showHowTo, setShowHowTo] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [stats, setStats] = useState(loadStats())
  const supaConfigured = isSupabaseConfigured()

  // Pull the signed-in player's cloud progress, merge it with what's on this
  // device (monotonic — never loses a streak), and refresh the UI. Runs on load
  // if already signed in, and on every sign-in / sign-out.
  const resyncProgress = () => {
    if (!supaConfigured) return
    syncProgress()
      .then((merged) => {
        if (merged) {
          setStats(loadStats())
          setRefreshTick((t) => t + 1)
        }
      })
      .catch(() => {
        /* best-effort — offline / not signed in is fine */
      })
  }

  useEffect(() => {
    if (!supaConfigured) return undefined
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
      setRaceInitialCode(code)
      setView('race')
    }
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
  const continueSystemCounts = useMemo(() => {
    if (!continueSystem) return { total: 0, solved: 0 }
    const p = subjectProgress(continueSystem, todayKey, finishedBoards)
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
    setView(key)
  }

  // Route protection: whatever path leads into a gated view (nav, a hash
  // link, an internal button, a stale state), it is sent back to Today with
  // the same notice. Render-time check below keeps it from flashing.
  const blockedView = !modesUnlocked && isGatedView(view, gameCtx?.mode)
  useEffect(() => {
    if (!blockedView) return
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
      resultTitle: isToday ? "Today's Results" : `Result for ${dateStr}`,
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


  // Systems play the subject's fixed boards in order: the five starter
  // boards, then boards released from past Dailies. The next board is the
  // first one this player has not finished. When none is left the Systems
  // page shows the caught-up message instead of Play.
  const playSystem = (system) => {
    if (!modesUnlocked) {
      showLocked()
      return
    }
    const p = subjectProgress(system, todayKey, getSystemsBoards())
    if (!p.next) {
      setSystemPlayNotice(null)
      setView('systems')
      return
    }
    const puzzle = systemsBoardPuzzle(p.next.board, p.next.index)
    if (!puzzle) {
      setSystemPlayNotice(`This ${subjectLabel(system)} board could not be loaded.`)
      return
    }
    setSystemPlayNotice(null)
    setGameCtx({
      puzzle,
      mode: 'system',
      progressKey: puzzle.id,
      headerLabel: `${subjectLabel(system)} · Board ${p.next.index + 1}`,
      resultTitle: 'Puzzle Results',
      system,
      boardId: p.next.board.id,
      isDaily: false,
    })
    setView('game')
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
      const finished = recordSystemsBoardFinish(gameCtx.boardId || puzzle.id, { won, mistakes, subject: system })
      const counts = subjectProgress(system, todayKey, finished)
      progression = recordSystemFinish({
        puzzle,
        system,
        won,
        guessLog,
        systemComplete: counts.total > 0 && counts.completed >= counts.total,
      })
    }
    setRefreshTick((t) => t + 1)
    // Back up the just-updated progress to the cloud (no-op for guests / when
    // Supabase isn't configured). Fire-and-forget — never blocks the UI.
    if (supaConfigured) pushProgress(snapshotLocal())
    return progression
  }

  if (isDevRoute) {
    return <DevViewer />
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
          key={gameCtx.progressKey}
          puzzle={gameCtx.puzzle}
          isDaily={gameCtx.mode === 'daily' || gameCtx.mode === 'archive'}
          progressKey={gameCtx.progressKey}
          headerLabel={gameCtx.headerLabel}
          resultTitle={gameCtx.resultTitle}
          shareLabel={gameCtx.mode === 'system' ? gameCtx.system : undefined}
          dailyNumber={gameCtx.dailyNumber}
          dailyStreak={gameCtx.isToday ? streak.current : 0}
          dailyPerfectStreak={gameCtx.isToday ? stats.currentPerfectStreak : 0}
          challengeDayNumber={gameCtx.mode === 'system' ? null : gameCtx.challengeDayNumber}
          onExit={goHome}
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
        />
        {reportModal}
      </div>
    )
  }

  if (view === 'record') {
    return (
      <div className="app-shell app-shell-wide">
        <Record
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
        {challengePhase !== 'playing' && <AppNav active="challenge" onNavigate={navigate} />}
        <Challenge bank={bank} onExit={goHome} onPhaseChange={setChallengePhase} />
      </div>
    )
  }

  if (view === 'race' && !blockedView) {
    return (
      <div className="app-shell">
        <Race bank={bank} initialCode={raceInitialCode} onExit={goHome} />
      </div>
    )
  }

  if (view === 'archive' && !blockedView) {
    return (
      <div className="app-shell">
        <AppNav active="archive" onNavigate={navigate} />
        <Archive dailyHistory={getDailyHistory()} onOpenDay={openArchiveDay} onBack={goHome} currentStreak={streak.current} />
      </div>
    )
  }

  if (view === 'systems' && !blockedView) {
    return (
      <div className="app-shell">
        <AppNav active="systems" onNavigate={navigate} />
        <Systems
          todayKey={todayKey}
          finishedBoards={finishedBoards}
          onPlaySystem={playSystem}
          onBack={goHome}
          playNotice={systemPlayNotice}
          onDismissPlayNotice={() => setSystemPlayNotice(null)}
        />
      </div>
    )
  }

  return (
    <div className="app-shell app-shell-home">
      <AppNav active="home" onNavigate={navigate} locked={!modesUnlocked} onLocked={showLocked} />
      <Home
        key={todayKey}
        todayKey={todayKey}
        timeZone={timeZone}
        onReport={setReportCtx}
        onOpenSupport={() => openLegal('support')}
        dailyNumber={todayDayNumber}
        dailyDone={dailyDone}
        currentStreak={streak.current}
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
        onLocked={showLocked}
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
      {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
      {reportModal}
      {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}
      {showAccount && <AuthModal onClose={() => setShowAccount(false)} onAuthChanged={resyncProgress} onOpenLegal={openLegal} />}
      <InstallPrompt />
    </div>
  )
}
