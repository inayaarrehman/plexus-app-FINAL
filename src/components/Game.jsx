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
import { loadProgression, spendCurbside } from '../progression/store.js'
import { kitCounts } from '../progression/engine.js'
import PuzzleSignature from './PuzzleSignature.jsx'
import { groupColor } from './GroupMotif.jsx'
import DifficultyIcon, { DifficultyTag, DIFFICULTY_LABEL } from './DifficultyIcon.jsx'
import PlexusLine from './PlexusLine.jsx'
import ReviewConnections from './ReviewConnections.jsx'
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

  const [selected, setSelected] = useState([])
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
    })
  }, [progressKey, puzzle.id, tiles, solvedCats, mistakes, guessLog, gameOver, won, toolsUsed, curbside])

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
    if (gameOver) return
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
    if (selected.length !== 4 || gameOver) return
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
      const now = Date.now()
      const durationMs = now - lastSolveTimeRef.current
      lastSolveTimeRef.current = now
      setSolvedCats((prev) => [...prev, catIndex])
      setGuessLog((prev) => [
        ...prev,
        { levels: [selected[0].level, selected[0].level, selected[0].level, selected[0].level], catIndexes, correct: true, durationMs, attemptKey: key },
      ])
      setPopCatIndex(catIndex)
      haptics.correct() // connection formed
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
      return
    }

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
          <div
            key={c.catIndex}
            className={`strand ${popCatIndex === c.catIndex ? 'strand-form' : ''} ${
              popCatIndex === c.catIndex && c.level === 4 ? 'strand-form-expert' : ''
            }`}
            style={{ '--strand-color': levelColor(c.level) }}
          >
            <div className="strand-head">
              <span className="strand-title">{c.title}</span>
              <DifficultyTag level={c.level} className="strand-difficulty" />
            </div>
            <ol className="strand-nodes">
              {c.items.map((it) => (
                <li className="strand-node" key={it.term}>
                  <span className="strand-dot" aria-hidden="true" />
                  <span className="strand-term">{it.term}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {!gameOver && (
        <>
          {solvedCats.length === 0 && selected.length === 0 && (
            <p className="board-hint">Find the four concepts that belong together.</p>
          )}
          <div className="tile-grid">
            {remainingTiles.map((tile) => {
              const isSelected = selected.some((t) => t.text === tile.text && t.catIndex === tile.catIndex)
              const isShaking = shakeIds.includes(tile.text)
              const isOneAwayPulse = oneAwayIds.includes(tile.text)
              return (
                <button
                  key={tile.text}
                  className={`tile ${isSelected ? 'tile-selected' : ''} ${
                    isSelected && selected.length >= 2 ? 'tile-proposing' : ''
                  } ${isSelected && selected.length === 4 ? 'tile-grouped' : ''} ${
                    isShaking ? 'tile-break' : ''
                  } ${isOneAwayPulse ? 'tile-oneaway-pulse' : ''} ${curbsideTiles.includes(tile.text) ? 'tile-curbside' : ''}`}
                  onClick={() => toggleTile(tile)}
                >
                  {tile.text}
                </button>
              )
            })}
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
              <button className="kit-use" onClick={handleCurbside} disabled={curbsideTiles.length > 0}>
                <span className="kit-use-name">Curbside</span>
                <span className="kit-use-count">×{curbsideLeft}</span>
              </button>
              {curbsideTiles.length > 0 && <span className="kit-hint">These two belong together.</span>}
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
          {won && <BrandMark size={58} className="result-brandmark" animate decorative />}
          {won && <Confetti count={isDaily ? 44 : 32} originY={45} seed={puzzle.id.length * 97 + mistakes} />}

          <h2>{resultTitle || (isDaily ? "Today's Results" : 'Puzzle Results')}</h2>

          {won && <p className="completion-phrase">{completionPhrase}</p>}

          {/* One row per difficulty, Easy to Expert: the medical icon names the
              difficulty and four nodes in its colour stand for the four
              concepts (filled when the group was solved, open when it wasn't). */}
          <ol
            className="result-motifs"
            aria-label={`${foundOrder.length} of ${puzzle.categories.length} connections found`}
          >
            {resultGroups.map((g) => (
              <li key={g.catIndex} className="result-motif-row">
                <DifficultyIcon level={g.level} size={20} className="result-difficulty" decorative />
                <span
                  className={`result-nodes ${g.found ? '' : 'is-missed'}`}
                  style={{ '--node-color': groupColor(g.level) }}
                  role="img"
                  aria-label={`${DIFFICULTY_LABEL[g.level]}: ${g.title}, ${g.found ? 'solved' : 'not solved'}`}
                >
                  {g.items.map((it) => (
                    <span key={it.term} className="result-node" />
                  ))}
                </span>
              </li>
            ))}
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

          {xpResult && <XpResult result={xpResult} />}

          <div className="result-actions">
            <button className="primary-btn" onClick={handleShare}>
              {copied ? 'Copied!' : 'Share Results'}
            </button>
            {challengeDayNumber != null && (
              <button className="secondary-btn" onClick={handleChallenge}>
                {challengeCopied ? 'Link copied!' : 'Challenge a friend'}
              </button>
            )}
            <button className="secondary-btn" onClick={() => setShowReview((v) => !v)}>
              {showReview ? 'Hide Connections' : 'View Connections'}
            </button>
            <button className="secondary-btn" onClick={onExit}>
              Keep Playing
            </button>
          </div>

          {showReview && <ReviewConnections puzzle={puzzle} onKnowledgeSignal={onKnowledgeSignal} />}

          {connectionOfDay && <PlexusLine className="result-divider" />}
          {connectionOfDay && (
            <div className="connection-of-day">
              <h3 className="connection-of-day-heading">Connection of the day</h3>
              <p className="connection-of-day-title">{connectionOfDay.title}</p>
              <p className="connection-of-day-explanation">{connectionOfDay.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
