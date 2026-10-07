import React, { useEffect, useMemo, useRef, useState } from 'react'
import { buildTiles, isFullMatch, isOneAway, shuffle, attemptKey, isDuplicateAttempt, MAX_MISTAKES, STREAK_MILESTONES } from '../utils/game.js'
import { loadProgress, saveProgress } from '../utils/storage.js'
import { getCompletionPhrase } from '../utils/completionPhrases.js'
import { pickConnectionPhrase } from '../utils/connectionMicrocopy.js'
import { buildShareText } from '../utils/shareText.js'
import { computeDailyMicroStat } from '../utils/dailyMicroStat.js'
import { pickConnectionOfDay } from '../utils/connectionOfDay.js'
import BrandMark from './BrandMark.jsx'
import Confetti from './Confetti.jsx'
import XpResult from './XpResult.jsx'
import { loadProgression, spendCurbside, recordCategoryBonus } from '../progression/store.js'
import { XP } from '../progression/config.js'
import { judgeAnswer } from '../recall/judge.js'
import { logEvent } from '../utils/events.js'
import { kitCounts } from '../progression/engine.js'
import PuzzleSignature from './PuzzleSignature.jsx'
import { groupColor } from './GroupMotif.jsx'
import DifficultyIcon, { DIFFICULTY_LABEL } from './DifficultyIcon.jsx'
import ReviewConnections from './ReviewConnections.jsx'
import TileText from './TileText.jsx'
import SolvedGroup from './SolvedGroup.jsx'
import { haptics } from '../utils/haptics.js'

const levelColor = (level) => groupColor(level)

export default function Game({
  puzzle,
  isDaily,
  progressKey,
  headerLabel,
  resultTitle,
  shareLabel,
  dailyNumber,
  dailyStreak,
  dailyPerfectStreak = 0,
  challengeDayNumber = null,
  onExit,
  onFinish,
  onKnowledgeSignal,
  recallEnabled = false,
}) {
  const initial = useMemo(() => {
    const saved = loadProgress(progressKey)
    if (saved && saved.puzzleId === puzzle.id) return saved
    return {
      puzzleId: puzzle.id,
      tiles: buildTiles(puzzle),
      solvedCats: [],
      mistakes: 0,
      guessLog: [],
      gameOver: false,
      won: false,
      toolsUsed: 0,
      curbside: [],
      recall: {},
    }
  }, [progressKey, puzzle])

  // Whether this puzzle was ALREADY completed before this component mounted
  // (e.g. reopening "Review today" or an Archive day). Captured once so we
  // never re-report a finish — and re-inflate stats — just from reopening
  // an already-solved puzzle.
  const alreadyOverAtLoad = useRef(initial.gameOver)

  const [tiles, setTiles] = useState(initial.tiles)
  const [solvedCats, setSolvedCats] = useState(initial.solvedCats)
  const [mistakes, setMistakes] = useState(initial.mistakes)
  const [guessLog, setGuessLog] = useState(initial.guessLog)
  const [gameOver, setGameOver] = useState(initial.gameOver)
  const [won, setWon] = useState(initial.won)
  // Your Kit on the board: tools used this puzzle (a used tool removes Perfect
  // eligibility) and the two tiles a Curbside is currently highlighting.
  const [toolsUsed, setToolsUsed] = useState(initial.toolsUsed || 0)
  const [curbside, setCurbside] = useState(initial.curbside || [])
  const [curbsideLeft, setCurbsideLeft] = useState(() => kitCounts(loadProgression()).curbside || 0)
  const [xpResult, setXpResult] = useState(null)
  // Name the connection (today's Daily): per solved group, keyed by catIndex.
  // status: open | clarify | checking | correct | missed | skipped
  const [recall, setRecall] = useState(initial.recall || {})
  const [recallDrafts, setRecallDrafts] = useState({})
  // Only one group is open for naming at a time (the most recently solved).
  const [activeRecall, setActiveRecall] = useState(null)
  // Brief confirmation after naming, and the group whose title is revealing.
  const [recallFlash, setRecallFlash] = useState(null) // { catIndex, text, kind }
  const [revealCat, setRevealCat] = useState(null)
  const flashTimer = useRef(null)
  const revealTimer = useRef(null)

  const [selected, setSelected] = useState([])
  // A correct guess first connects on the board (tiles pulse, light up as
  // nodes and draw lines to a shared point) before it becomes a solved group.
  const [connecting, setConnecting] = useState(null) // { catIndex, color, points, hub, w, h }
  const gridRef = useRef(null)
  const [shakeIds, setShakeIds] = useState([])
  const [oneAwayIds, setOneAwayIds] = useState([])
  const [message, setMessage] = useState('')
  const [popCatIndex, setPopCatIndex] = useState(null)
  const [copied, setCopied] = useState(false)
  const [challengeCopied, setChallengeCopied] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const finishReported = useRef(false)
  const msgTimer = useRef(null)
  // Last individual-connection microcopy phrase, so the next one never repeats it.
  const lastMicroRef = useRef(null)
  // For the "Fastest group" daily micro-stat only — an approximate, purely
  // informational timing, not a scored/competitive metric. Resets each
  // mount, which is fine for a one-line fun-fact rather than a leaderboard.
  const lastSolveTimeRef = useRef(Date.now())

  // Persist progress on every meaningful change.
  useEffect(() => {
    saveProgress(progressKey, {
      puzzleId: puzzle.id,
      tiles,
      solvedCats,
      mistakes,
      guessLog,
      gameOver,
      won,
      toolsUsed,
      curbside,
      // A check in flight is saved as open, so a refresh simply asks again.
      recall: Object.fromEntries(Object.entries(recall).map(([k, v]) => [k, v.status === 'checking' ? { ...v, status: v.clarified ? 'clarify' : 'open' } : v])),
    })
  }, [progressKey, puzzle.id, tiles, solvedCats, mistakes, guessLog, gameOver, won, toolsUsed, curbside, recall])

  useEffect(() => {
    if (gameOver && !finishReported.current && !alreadyOverAtLoad.current) {
      finishReported.current = true
      const res = onFinish({ won, mistakes, guessLog, puzzle, toolsUsed })
      if (res && typeof res === 'object') setXpResult(res)
    }
  }, [gameOver, won, mistakes, guessLog, puzzle, onFinish, toolsUsed])

  // Curbside: highlight two tiles from the easiest unsolved group. Uses one
  // from Your Kit and marks the puzzle as tool-assisted (no Perfect).
  const curbsideTiles = curbside.filter((text) => tiles.some((t) => t.text === text && !solvedCats.includes(t.catIndex)))
  // First use of a tool explains it before anything is spent; after that a
  // tap uses it straight away (no repeated confirmations).
  const [curbsideIntro, setCurbsideIntro] = useState(false)
  const onCurbsideTap = () => {
    if (gameOver || curbsideTiles.length > 0) return
    if (!kitIntroSeen('curbside')) {
      setCurbsideIntro(true)
      return
    }
    handleCurbside()
  }
  const confirmCurbside = () => {
    markKitIntroSeen('curbside')
    setCurbsideIntro(false)
    handleCurbside()
  }

  const handleCurbside = () => {
    if (gameOver || curbsideTiles.length > 0) return
    const unsolved = puzzle.categories
      .map((c, i) => ({ ...c, catIndex: i }))
      .filter((c) => !solvedCats.includes(c.catIndex))
      .sort((a, b) => a.level - b.level)
    const target = unsolved[0]
    if (!target) return
    const pair = tiles.filter((t) => t.catIndex === target.catIndex).slice(0, 2).map((t) => t.text)
    if (pair.length < 2 || !spendCurbside(puzzle.id)) return
    setCurbside(pair)
    setToolsUsed((n) => n + 1)
    setCurbsideLeft(kitCounts(loadProgression()).curbside || 0)
    haptics.select()
  }

  const flashMessage = (text, ms = 1500) => {
    setMessage(text)
    clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setMessage(''), ms)
  }

  useEffect(() => () => clearTimeout(msgTimer.current), [])

  // Solved categories are removed from the board as they're found.
  const remainingTiles = tiles.filter((t) => !solvedCats.includes(t.catIndex))

  const toggleTile = (tile) => {
    if (gameOver || connecting) return
    const already = selected.find((t) => t.text === tile.text && t.catIndex === tile.catIndex)
    if (!already && selected.length < 4) haptics.select() // proposing a connection
    setSelected((prev) => {
      const dup = prev.find((t) => t.text === tile.text && t.catIndex === tile.catIndex)
      if (dup) return prev.filter((t) => t !== dup)
      if (prev.length >= 4) return prev
      return [...prev, tile]
    })
  }

  const handleShuffle = () => {
    setTiles((prev) => {
      const unsolved = prev.filter((t) => !solvedCats.includes(t.catIndex))
      const solved = prev.filter((t) => solvedCats.includes(t.catIndex))
      return [...solved, ...shuffle(unsolved)]
    })
  }

  const handleDeselect = () => setSelected([])

  const handleSubmit = () => {
    if (selected.length !== 4 || gameOver || connecting) return
    // Duplicate detection is keyed on the four tiles' STABLE identities
    // (order-independent, exact), not on which categories they came from —
    // see isDuplicateAttempt/attemptKey. This is the fix for false
    // "Already tried this combo" warnings.
    const key = attemptKey(selected)
    const alreadyGuessed = isDuplicateAttempt(guessLog, selected)

    const levels = selected.map((t) => t.level).sort((a, b) => a - b)
    const catIndexes = selected.map((t) => t.catIndex)

    if (isFullMatch(selected)) {
      const catIndex = selected[0].catIndex
      const sel = selected
      haptics.correct() // connection formed
      const commit = () => solveGroup(sel, catIndex, catIndexes, key)
      const cluster = measureCluster(gridRef.current, sel)
      if (!cluster || prefersReducedMotion()) {
        commit()
        return
      }
      setConnecting({ catIndex, color: levelColor(sel[0].level), ...cluster })
      setTimeout(() => {
        setConnecting(null)
        commit()
      }, CONNECT_MS)
      return
    }
    handleWrongGuess(levels, catIndexes, key, alreadyGuessed)
  }

  // The solved group takes its place (same bookkeeping as before).
  const solveGroup = (selected, catIndex, catIndexes, key) => {
    {
      const now = Date.now()
      const durationMs = now - lastSolveTimeRef.current
      lastSolveTimeRef.current = now
      setSolvedCats((prev) => [...prev, catIndex])
      setGuessLog((prev) => [
        ...prev,
        { levels: [selected[0].level, selected[0].level, selected[0].level, selected[0].level], catIndexes, correct: true, durationMs, attemptKey: key },
      ])
      setPopCatIndex(catIndex)
      if (recallEnabled) {
        setRecall((prev) => (prev[catIndex] ? prev : { ...prev, [catIndex]: { status: 'open' } }))
        setActiveRecall(catIndex)
        logEvent('recall_prompt_shown')
      }
      setTimeout(() => setPopCatIndex(null), 700)
      setSelected([])

      const isFinalGroup = solvedCats.length + 1 === 4
      if (isFinalGroup) {
        // The whole-puzzle payoff (mark + confetti + "Connected.") takes
        // over — no individual microcopy on the final group.
        setTimeout(() => {
          haptics.complete() // the network completes
          setWon(true)
          setGameOver(true)
        }, 500)
      } else {
        // Individual connection: a brief rotating positive line near the
        // board. NOT "Connected." — that's reserved for full completion.
        const phrase = pickConnectionPhrase(lastMicroRef.current)
        lastMicroRef.current = phrase
        flashMessage(phrase, 900)
      }
    }
  }

  const handleWrongGuess = (levels, catIndexes, key, alreadyGuessed) => {
    // Wrong guess. The haptic is identical for every wrong guess (including
    // One Away) so it can never signal how close the selection was.
    setGuessLog((prev) => [...prev, { levels, catIndexes, correct: false, attemptKey: key }])
    haptics.incorrect()
    const oneAway = isOneAway(selected)
    // One Away gets its own subtle feedback (a synchronized pulse) instead
    // of the plain shake — applied identically to all 4 selected tiles, on
    // purpose: it must never single out which 3 belong together.
    if (oneAway) {
      setOneAwayIds(selected.map((t) => t.text))
      setTimeout(() => setOneAwayIds([]), 600)
    } else {
      setShakeIds(selected.map((t) => t.text))
      setTimeout(() => setShakeIds([]), 500)
    }

    if (alreadyGuessed) {
      flashMessage('Already tried that combo')
    } else if (oneAway) {
      flashMessage('One link away')
    } else {
      flashMessage('Not quite')
    }

    const newMistakes = mistakes + 1
    setMistakes(newMistakes)
    if (newMistakes >= MAX_MISTAKES) {
      setSelected([])
      setTimeout(() => {
        setSolvedCats([0, 1, 2, 3])
        setGameOver(true)
        setWon(false)
      }, 500)
    }
  }

  const mistakesLeft = MAX_MISTAKES - mistakes

  // ---- Name the connection ----
  // Optional and separate from solving: a wrong or skipped answer never costs
  // a mistake, Perfect, streak or a tool. One clarification at most.
  const groupIdOf = (catIndex) => {
    const c = puzzle.categories[catIndex]
    return c?.bankCategoryId || c?.id || `group-${catIndex}`
  }
  const setRecallStatus = (catIndex, patch) => setRecall((prev) => ({ ...prev, [catIndex]: { ...prev[catIndex], ...patch } }))
  // Close the naming step: the official title reveals (lines draw in) and the
  // card settles into its solved state. An optional short confirmation shows
  // for a moment, then the card is just the connection.
  const revealGroup = (catIndex, flash = null) => {
    setActiveRecall((cur) => (cur === catIndex ? null : cur))
    setRevealCat(catIndex)
    clearTimeout(revealTimer.current)
    revealTimer.current = setTimeout(() => setRevealCat(null), 450)
    clearTimeout(flashTimer.current)
    setRecallFlash(flash ? { catIndex, ...flash } : null)
    if (flash) flashTimer.current = setTimeout(() => setRecallFlash(null), 2600)
  }
  useEffect(() => () => {
    clearTimeout(flashTimer.current)
    clearTimeout(revealTimer.current)
  }, [])

  const submitRecall = async (catIndex) => {
    const entry = recall[catIndex]
    const text = (recallDrafts[catIndex] || '').trim()
    if (!entry || !text || entry.status === 'checking') return
    setRecallStatus(catIndex, { status: 'checking' })
    logEvent('recall_submitted')
    let band = 'low'
    let missing = []
    try {
      const verdict = await judgeAnswer(text, puzzle.categories[catIndex])
      band = verdict.band
      missing = verdict.missing || []
    } catch {
      band = 'low'
    }
    if (band === 'high') {
      setRecallStatus(catIndex, { status: 'correct', answer: text })
      revealGroup(catIndex, { text: `Correct · +${XP.categoryBonus} XP`, kind: 'correct' })
      logEvent('recall_accepted')
      haptics.correct()
      const r = recordCategoryBonus({ puzzleId: puzzle.id, groupId: groupIdOf(catIndex) })
      // Named after the puzzle finished: add it to the results already shown.
      if (r && r.gained > 0) setXpResult((x) => (x ? mergeBonus(x, r) : x))
    } else if (band === 'medium' && !entry.clarified) {
      // One more try, with a hint about what is missing.
      setRecallStatus(catIndex, { status: 'clarify', clarified: true, broader: missing.length > 0 })
      logEvent('recall_clarify')
    } else if (band === 'medium') {
      // Still related but not specific enough: show the connection, with the
      // words their answer did not cover in bold.
      setRecallStatus(catIndex, { status: 'close', answer: text, missing })
      revealGroup(catIndex, { text: 'Close. The connection is more specific. No mistake counted.', kind: 'close' })
      logEvent('recall_rejected')
    } else {
      setRecallStatus(catIndex, { status: 'missed', answer: text })
      revealGroup(catIndex, { text: 'Not quite. No mistake counted.', kind: 'missed' })
      logEvent('recall_rejected')
    }
  }
  const skipRecall = (catIndex) => {
    setRecallStatus(catIndex, { status: 'skipped' })
    revealGroup(catIndex)
    logEvent('recall_skipped')
  }
  const recallPending = (catIndex) => ['open', 'clarify', 'checking'].includes(recall[catIndex]?.status)

  const isMilestone = isDaily && won && STREAK_MILESTONES.includes(dailyStreak)

  const completionPhrase = useMemo(
    // A tool-assisted solve isn't "perfect", so it takes the ordinary phrase.
    () => (gameOver && won ? getCompletionPhrase({ puzzleId: puzzle.id, mistakes: mistakes === 0 && toolsUsed > 0 ? 1 : mistakes }) : ''),
    [gameOver, won, puzzle.id, mistakes, toolsUsed]
  )
  const isPerfect = won && mistakes === 0 && toolsUsed === 0

  const dailyMicroStat = useMemo(
    () => (isDaily && gameOver && won ? computeDailyMicroStat({ mistakes, guessLog, dailyPerfectStreak }) : null),
    [isDaily, gameOver, won, mistakes, guessLog, dailyPerfectStreak]
  )

  const connectionOfDay = useMemo(
    () => (isDaily && gameOver && won ? pickConnectionOfDay(puzzle) : null),
    [isDaily, gameOver, won, puzzle]
  )

  const shareText = useMemo(
    () =>
      buildShareText({
        isDaily,
        dailyNumber,
        puzzleTitle: puzzle.title,
        shareLabel,
        guessLog,
        won,
        mistakes,
        toolsUsed,
        dailyStreak,
      }),
    [isDaily, dailyNumber, puzzle.title, shareLabel, guessLog, won, mistakes, toolsUsed, dailyStreak]
  )

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage('Copy failed. Select and copy it manually.')
    }
  }

  // Challenge a friend: copies a spoiler-free link to the SAME Daily (only
  // its day number is in the URL — no categories, tiles, answers, or the
  // sender's result). Distinct from "Share Results".
  const handleChallenge = async () => {
    const base = `${window.location.origin}${window.location.pathname}`
    const n = String(challengeDayNumber).padStart(3, '0')
    const url = `${base}#challenge/${challengeDayNumber}`
    const text = `I challenged you to today’s Plexus, Daily ${n}\n${url}`
    try {
      await navigator.clipboard.writeText(text)
      setChallengeCopied(true)
      setTimeout(() => setChallengeCopied(false), 2000)
    } catch {
      setMessage('Copy failed. Select and copy it manually.')
    }
  }

  // Connection of the day names a group; wait while that group's name is
  // still being asked for.
  const connectionOfDayPending = connectionOfDay
    ? puzzle.categories.some((c, i) => c.title === connectionOfDay.title && recallPending(i))
    : false

  const orderedSolvedCats = puzzle.categories
    .map((c, i) => ({ ...c, catIndex: i }))
    .filter((c) => solvedCats.includes(c.catIndex))
    .sort((a, b) => solvedCats.indexOf(a.catIndex) - solvedCats.indexOf(b.catIndex))

  // Results summary: one row per difficulty, Easy to Expert. A group is
  // "found" when a correct guess solved it (a loss reveals the rest unfound).
  const foundOrder = guessLog.filter((g) => g.correct).map((g) => g.catIndexes[0])
  const resultGroups = puzzle.categories
    .map((c, i) => ({ ...c, catIndex: i, found: foundOrder.includes(i) }))
    .sort((a, b) => a.level - b.level)

  return (
    <div className="game">
      <div className="game-header">
        <button className="icon-btn" onClick={onExit} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>{headerLabel}</span>
        </div>
        <div className="mistakes-indicator" aria-label={`${mistakesLeft} mistakes remaining`}>
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <span key={i} className={`dot ${i < mistakesLeft ? 'dot-live' : 'dot-spent'}`} />
          ))}
        </div>
      </div>

      {message && <div className="toast">{message}</div>}

      {/* The Daily's deterministic Puzzle Signature: loose nodes while the
          board is unsolved, its connected form once won — the puzzle's own
          tiny identity, transforming in place. Decorative only. */}
      {isDaily && (
        <div className="daily-id-row">
          <PuzzleSignature seed={puzzle.id} resolved={gameOver && won} size={34} animate={gameOver && won} />
          <span className="daily-id-label">Daily {String(dailyNumber ?? '').padStart(3, '0')}</span>
        </div>
      )}

      {/* Solved categories render as Plexus Strands: four concept-nodes on
          one connecting path, in the category's colour. Once the whole
          board is solved the stack draws together (strand-stack-complete)
          and leads into the completion mark on the result card below. */}
      <div className={`strand-stack ${gameOver ? 'strand-stack-complete' : ''}`}>
        {orderedSolvedCats.map((c) => (
          <SolvedGroup
            key={c.catIndex}
            category={c}
            color={levelColor(c.level)}
            forming={popCatIndex === c.catIndex}
            revealing={revealCat === c.catIndex || (popCatIndex === c.catIndex && !recallPending(c.catIndex))}
            pending={recallPending(c.catIndex)}
            open={activeRecall === c.catIndex}
            entry={recall[c.catIndex]}
            draft={recallDrafts[c.catIndex] || ''}
            flash={recallFlash?.catIndex === c.catIndex ? recallFlash : null}
            bonusXp={XP.categoryBonus}
            onOpen={() => setActiveRecall(c.catIndex)}
            onDraft={(v) => setRecallDrafts((d) => ({ ...d, [c.catIndex]: v }))}
            onSubmit={() => submitRecall(c.catIndex)}
            onSkip={() => skipRecall(c.catIndex)}
          />
        ))}
      </div>

      {!gameOver && (
        <>
          {solvedCats.length === 0 && selected.length === 0 && (
            <p className="board-hint">Find the four concepts that belong together.</p>
          )}
          <div className={`tile-grid ${connecting ? 'is-connecting' : ''}`} ref={gridRef}>
            {remainingTiles.map((tile) => {
              const isSelected = selected.some((t) => t.text === tile.text && t.catIndex === tile.catIndex)
              const isShaking = shakeIds.includes(tile.text)
              const isOneAwayPulse = oneAwayIds.includes(tile.text)
              const isConnecting = connecting?.catIndex === tile.catIndex
              return (
                <button
                  key={tile.text}
                  style={isConnecting ? { '--strand-color': connecting.color } : undefined}
                  className={`tile ${isSelected ? 'tile-selected' : ''} ${
                    isSelected && selected.length >= 2 ? 'tile-proposing' : ''
                  } ${isSelected && selected.length === 4 ? 'tile-grouped' : ''} ${
                    isShaking ? 'tile-break' : ''
                  } ${isOneAwayPulse ? 'tile-oneaway-pulse' : ''} ${curbsideTiles.includes(tile.text) ? 'tile-curbside' : ''} ${
                    isConnecting ? 'tile-connecting' : ''
                  }`}
                  onClick={() => toggleTile(tile)}
                  data-term={tile.text}
                >
                  <TileText>{tile.text}</TileText>
                </button>
              )
            })}
            {connecting && (
              <svg
                className="connect-overlay"
                viewBox={`0 0 ${connecting.w} ${connecting.h}`}
                style={{ '--strand-color': connecting.color }}
                aria-hidden="true"
              >
                {connecting.points.map(([x, y], i) => (
                  <line key={i} className="connect-line" x1={x} y1={y} x2={connecting.hub[0]} y2={connecting.hub[1]} pathLength="1" />
                ))}
                {connecting.points.map(([x, y], i) => (
                  <circle key={`n${i}`} className="connect-node" cx={x} cy={y} r="4.5" />
                ))}
                <circle className="connect-hub" cx={connecting.hub[0]} cy={connecting.hub[1]} r="5.5" />
              </svg>
            )}
          </div>

          <div className="game-controls">
            <button className="secondary-btn" onClick={handleShuffle}>
              Shuffle
            </button>
            <button className="secondary-btn" onClick={handleDeselect} disabled={selected.length === 0}>
              Deselect
            </button>
            <button className="primary-btn" onClick={handleSubmit} disabled={selected.length !== 4}>
              Submit
            </button>
          </div>
          {(curbsideLeft > 0 || curbsideTiles.length > 0) && (
            <div className="kit-bar">
              <button className="kit-use" onClick={onCurbsideTap} disabled={curbsideTiles.length > 0 || curbsideIntro} aria-describedby="curbside-desc">
                <span className="kit-use-name">Curbside</span>
                <span className="kit-use-count">×{curbsideLeft}</span>
              </button>
              {curbsideTiles.length > 0 ? (
                <span className="kit-hint">These two belong together.</span>
              ) : (
                <span className="kit-desc" id="curbside-desc">Highlights two tiles that belong together.</span>
              )}
              {curbsideIntro && (
                <div className="kit-intro" role="group" aria-label="About Curbside">
                  <p className="kit-intro-text">
                    <b>Curbside</b> highlights two tiles from the same group. It uses 1 of your {curbsideLeft}
                    {isDaily ? ', and a Daily solved with a tool does not count as Perfect.' : '.'}
                  </p>
                  <div className="kit-intro-actions">
                    <button className="kit-intro-use" onClick={confirmCurbside}>Use Curbside</button>
                    <button className="kit-intro-cancel" onClick={() => setCurbsideIntro(false)}>Not now</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {gameOver && (
        <div className={`result-card ${won ? 'result-card-won' : ''} ${isPerfect ? 'result-card-perfect' : ''}`}>
          {/* The completion payoff: the Plexus constellation assembles (four
              jewel-toned nodes wiring themselves together) as the centrepiece,
              and just as its nodes land a restrained jewel-tone confetti burst
              comes out of it, then settles as the result appears. The Daily
              gets a slightly fuller burst than a system puzzle. */}
          {/* The four solved connections feed into the finished Plexus: one
              thin line per group, in its colour, drawing into the mark. */}
          {won && <PlexusMerge colors={resultGroups.map((g) => groupColor(g.level))} />}
          {won && <BrandMark size={58} className="result-brandmark" animate decorative />}
          {won && <Confetti count={isDaily ? 44 : 32} originY={45} seed={puzzle.id.length * 97 + mistakes} />}

          <h2>{resultTitle || (isDaily ? "Today's Results" : 'Puzzle Results')}</h2>

          {won && <p className="completion-phrase">{completionPhrase}</p>}

          {/* The four connections, Easy to Expert, each a converge mark (four
              concepts into one) on a thin spine that rises toward the finished
              Plexus above: 4 concepts make a connection, 4 connections make a
              Plexus. The title leads; difficulty is quiet metadata. */}
          <ol
            className="result-connections"
            aria-label={`${foundOrder.length} of ${puzzle.categories.length} connections found`}
          >
            {resultGroups.map((g) => {
              const unnamed = recallPending(g.catIndex)
              return (
                <li key={g.catIndex} className={`rc-row ${g.found ? '' : 'is-missed'}`} style={{ '--strand-color': groupColor(g.level) }}>
                  <span className="rc-node" aria-hidden="true" />
                  <span className="rc-text">
                    <span className={`rc-title ${unnamed ? 'is-unnamed' : ''}`}>
                      {unnamed ? `Name it above · +${XP.categoryBonus} XP` : g.title}
                    </span>
                    <span className="rc-meta">
                      <DifficultyIcon level={g.level} size={13} decorative />
                      {DIFFICULTY_LABEL[g.level]}
                      {!g.found && ' · not found'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>

          <p className="result-summary">
            {won
              ? `Solved with ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`
              : 'Out of guesses. Here are the groups you missed.'}
          </p>

          {isDaily && dailyStreak > 0 && (
            <div className={`streak-banner ${isMilestone ? 'milestone' : ''}`}>
              {dailyStreak} day streak{isMilestone ? '!' : ''}
            </div>
          )}

          {dailyMicroStat && <p className="daily-micro-stat">{dailyMicroStat}</p>}

          {/* One takeaway right away (the same Connection of the day Home
              shows), with the full review one tap away. */}
          {connectionOfDay && !connectionOfDayPending && (
            <div className="connection-of-day result-takeaway">
              <h3 className="connection-of-day-heading">Connection of the day</h3>
              <p className="connection-of-day-title">{connectionOfDay.title}</p>
              <p className="connection-of-day-explanation">{connectionOfDay.remember || connectionOfDay.explanation}</p>
            </div>
          )}
          <button className="result-review-toggle" onClick={() => setShowReview((v) => !v)} aria-expanded={showReview}>
            {showReview ? 'Hide connections' : 'Show connections'}
            <span aria-hidden="true">{showReview ? ' ▴' : ' ▾'}</span>
          </button>
          {showReview && <ReviewConnections puzzle={puzzle} onKnowledgeSignal={onKnowledgeSignal} />}


          <div className="result-actions">
            <button className="primary-btn" onClick={handleShare}>
              {copied ? 'Copied!' : 'Share Results'}
            </button>
            {challengeDayNumber != null && (
              <button className="secondary-btn" onClick={handleChallenge}>
                {challengeCopied ? 'Link copied!' : 'Challenge a friend'}
              </button>
            )}
            <button className="secondary-btn" onClick={onExit}>
              Keep Playing
            </button>
          </div>

          {/* XP, level and Kit rewards: secondary, compact, after the actions. */}
          {xpResult && <XpResult result={xpResult} />}


        </div>
      )}
    </div>
  )
}

// Fold a bonus earned after the finish into the results already on screen.
function mergeBonus(x, r) {
  const lines = x.lines.map((l) => [...l])
  const i = lines.findIndex((l) => l[0] === 'Category bonus')
  if (i >= 0) lines[i][1] += r.gained
  else {
    const p = lines.findIndex((l) => l[0] === 'Perfect')
    lines.splice(p >= 0 ? p : lines.length, 0, ['Category bonus', r.gained])
  }
  return {
    ...x,
    gained: x.gained + r.gained,
    lines,
    after: r.after,
    levelUp: x.levelUp || r.levelUp,
    grants: [...(x.grants || []), ...(r.grants || [])],
    rounds: r.rounds || x.rounds,
  }
}

// Which Kit tools the player has already had explained (per device).
const KIT_INTRO_KEY = 'plexus.kitIntro.v1'
function kitIntroSeen(item) {
  try {
    return Boolean(JSON.parse(localStorage.getItem(KIT_INTRO_KEY) || '{}')[item])
  } catch {
    return false
  }
}
function markKitIntroSeen(item) {
  try {
    const seen = JSON.parse(localStorage.getItem(KIT_INTRO_KEY) || '{}')
    seen[item] = true
    localStorage.setItem(KIT_INTRO_KEY, JSON.stringify(seen))
  } catch {
    /* storage unavailable: the explanation simply shows again next time */
  }
}

// ---- Solve animation helpers ----
// How long the four tiles spend connecting on the board before they become a
// solved group (the card then forms in about 220ms: under 500ms in all).
const CONNECT_MS = 260

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Centers of the four tiles (relative to the grid) and their shared point.
function measureCluster(grid, tiles) {
  if (!grid) return null
  const box = grid.getBoundingClientRect()
  const points = []
  for (const t of tiles) {
    const el = [...grid.querySelectorAll('.tile')].find((n) => n.dataset.term === t.text)
    if (!el) return null
    const r = el.getBoundingClientRect()
    // A node at the top edge of each tile, so the terms stay readable.
    points.push([r.left - box.left + r.width / 2, r.top - box.top + 9])
  }
  const hub = [points.reduce((a, p) => a + p[0], 0) / points.length, points.reduce((a, p) => a + p[1], 0) / points.length]
  return { points, hub, w: Math.max(1, box.width), h: Math.max(1, box.height) }
}

// Four lines, one per solved group, curving from the solved groups above into
// the Plexus mark: 4 connections make 1 Plexus.
function PlexusMerge({ colors }) {
  const W = 240
  const H = 46
  const xs = [30, 90, 150, 210]
  return (
    <svg className="plexus-merge" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" focusable="false">
      {xs.map((x, i) => (
        <path
          key={i}
          className="pm-line"
          d={`M ${x} 2 C ${x} ${H * 0.55}, ${W / 2} ${H * 0.45}, ${W / 2} ${H - 2}`}
          pathLength="1"
          style={{ stroke: colors[i], animationDelay: `${i * 40}ms` }}
        />
      ))}
      {xs.map((x, i) => (
        <circle key={`n${i}`} className="pm-node" cx={x} cy="3" r="3" style={{ fill: colors[i], animationDelay: `${i * 40}ms` }} />
      ))}
    </svg>
  )
}
