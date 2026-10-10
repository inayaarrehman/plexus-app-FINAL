import React, { useEffect, useMemo, useRef, useState } from 'react'
import InfoIcon from './InfoIcon.jsx'
import { ToolArt } from './RecordParts.jsx'
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
import { loadProgression, spendTool, toolUsedInAttempt, toolsAllowedIn } from '../progression/store.js'
import { kitCounts, itemOpen, levelInfo, totalXp } from '../progression/engine.js'
import { KIT, PUZZLE_TOOLS } from '../progression/config.js'
import PuzzleSignature from './PuzzleSignature.jsx'
import { groupColor } from './GroupMotif.jsx'
import { difficultyLabelOf } from './DifficultyIcon.jsx'
import ReviewConnections from './ReviewConnections.jsx'
import TileText from './TileText.jsx'
import SolvedGroup from './SolvedGroup.jsx'
import { reportContext } from '../utils/reportContext.js'
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
  onOpenRecord,
  onFinish,
  onReport, // opens Report this connection with the group's details
  reportMode = 'daily', // daily | archive | system, attached to reports
  puzzleDate = null, // the Daily's calendar date, attached to reports
  onReplay = null, // explicit replay: starts a new attempt (Systems boards)
  // Systems boards only:
  onAttemptStart = null, // (attemptId) once the first guess of an attempt is submitted
  systemAttempt = null, // { n, xp }: which try this is and what solving it pays
  systemActions = null, // { primary: {label, onClick}, secondary: {label, onClick} } after the board ends
  systemCompletion = null, // { label, total, palette } when this solve completed the subject for the first time
}) {
  const isSystem = reportMode === 'system'
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
      attemptId: `${progressKey}:${Date.now()}`,
      ruleOut: null,
      restored: 0,
    }
  }, [progressKey, puzzle])
  // Every board attempt has an id. It is saved with the board, so a refresh
  // or resumed game is the same attempt (one tool per attempt holds), and an
  // explicit replay starts a new one.
  const attemptId = useMemo(() => initial.attemptId || `${progressKey}:legacy`, [initial, progressKey])

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
  // Your Tools on the board: tools used this attempt (a used tool removes
  // Perfect eligibility), the two tiles a Consult is highlighting, the tile
  // Rule Out marked, and mistake allowances restored by Second Opinion.
  const [toolsUsed, setToolsUsed] = useState(initial.toolsUsed || (toolUsedInAttempt(initial.attemptId || `${progressKey}:legacy`) ? 1 : 0))
  const [curbside, setCurbside] = useState(initial.curbside || [])
  const [ruleOut, setRuleOut] = useState(initial.ruleOut || null) // { texts, outsider }
  const [restored, setRestored] = useState(initial.restored || 0) // Second Opinion
  const [kit, setKit] = useState(() => readKit())
  const [xpResult, setXpResult] = useState(null)
  // One solved group's explanation open at a time.
  const [expandedCat, setExpandedCat] = useState(null)

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
      attemptId,
      ruleOut,
      restored,
    })
  }, [progressKey, puzzle.id, tiles, solvedCats, mistakes, guessLog, gameOver, won, toolsUsed, curbside, attemptId, ruleOut, restored])

  useEffect(() => {
    if (gameOver && !finishReported.current && !alreadyOverAtLoad.current) {
      finishReported.current = true
      const res = onFinish({ won, mistakes, guessLog, puzzle, toolsUsed })
      if (res && typeof res === 'object') setXpResult(res)
    }
  }, [gameOver, won, mistakes, guessLog, puzzle, onFinish, toolsUsed])

  // Systems: an attempt counts once the first guess is submitted (opening a
  // board and leaving is not an attempt). Same attempt id after a refresh.
  const attemptReported = useRef(false)
  useEffect(() => {
    if (!isSystem || !onAttemptStart || attemptReported.current || alreadyOverAtLoad.current) return
    if (guessLog.length > 0) {
      attemptReported.current = true
      onAttemptStart(attemptId)
    }
  }, [isSystem, onAttemptStart, guessLog.length, attemptId])

  // ---- Puzzle tools (Daily puzzles only) ----
  // One tool per board attempt. Tapping a tool explains exactly what it will
  // do and that it uses one; nothing is spent until the player confirms and
  // the effect is actually available. A refused or unavailable action spends
  // nothing.
  // Systems, the Archive and the timed modes show no tools; spendTool refuses
  // anything that is not a Daily attempt as well.
  const toolsAllowed = toolsAllowedIn(reportMode)
  const curbsideTiles = curbside.filter((text) => tiles.some((t) => t.text === text && !solvedCats.includes(t.catIndex)))
  const ruleOutActive = ruleOut && tiles.some((t) => t.text === ruleOut.outsider && !solvedCats.includes(t.catIndex)) ? ruleOut : null
  const [toolAsk, setToolAsk] = useState(null) // item being explained before use
  const catOf = (text) => tiles.find((t) => t.text === text)?.catIndex
  // The most recent submitted "one away" guess whose four tiles are all
  // still unsolved. Rule Out only ever works on such a guess, never on an
  // unsubmitted selection.
  const lastOneAway = useMemo(() => {
    for (let i = guessLog.length - 1; i >= 0; i--) {
      const g = guessLog[i]
      if (g.correct || !g.oneAway || !Array.isArray(g.texts) || g.texts.length !== 4) continue
      if (g.texts.every((tx) => tiles.some((t) => t.text === tx && !solvedCats.includes(t.catIndex)))) return g
    }
    return null
  }, [guessLog, tiles, solvedCats])
  const toolEffect = (item) => {
    if (gameOver || !toolsAllowed) return null
    if (item === 'curbside') {
      const unsolved = puzzle.categories
        .map((c, i) => ({ ...c, catIndex: i }))
        .filter((c) => !solvedCats.includes(c.catIndex))
        .sort((a, b) => a.level - b.level)
      const target = unsolved[0]
      if (!target) return null
      const pair = tiles.filter((t) => t.catIndex === target.catIndex).slice(0, 2).map((t) => t.text)
      return pair.length === 2 ? { pair } : null
    }
    if (item === 'lab') {
      if (!lastOneAway) return null
      // The board's intended grouping decides the outsider: three share a
      // group, one does not.
      const cats = lastOneAway.texts.map(catOf)
      const counts = {}
      cats.forEach((c) => (counts[c] = (counts[c] || 0) + 1))
      const outsider = lastOneAway.texts.find((tx, i) => counts[cats[i]] === 1)
      return outsider ? { texts: lastOneAway.texts, outsider } : null
    }
    if (item === 'second-opinion') {
      if (mistakes - restored <= 0) return null // before any mistake, or nothing spent to restore
      return { restore: 1 }
    }
    return null
  }
  const toolState = (item) => {
    const def = KIT[item]
    if (!itemOpen(item, kit.level)) return { ok: false, why: `Unlocks at Level ${def.unlock}` }
    if (toolsUsed > 0) return { ok: false, why: 'One tool per Daily' }
    if (!(kit.counts[item] > 0)) return { ok: false, why: 'None left' }
    if (!toolEffect(item)) {
      if (item === 'lab') return { ok: false, why: 'After a “one away” guess' }
      if (item === 'second-opinion') return { ok: false, why: 'After a mistake' }
      return { ok: false, why: 'Not available now' }
    }
    return { ok: true }
  }
  const confirmTool = (item) => {
    setToolAsk(null)
    const effect = toolEffect(item)
    if (!effect || !toolState(item).ok) {
      flashMessage('Not available right now. Nothing was used.')
      return
    }
    if (!spendTool(item, attemptId, { puzzle: puzzle.id, mode: reportMode })) {
      setKit(readKit())
      flashMessage('Not available right now. Nothing was used.')
      return
    }
    if (item === 'curbside') setCurbside(effect.pair)
    if (item === 'lab') setRuleOut({ texts: effect.texts, outsider: effect.outsider })
    if (item === 'second-opinion') setRestored((n) => n + 1)
    setToolsUsed((n) => n + 1)
    setKit(readKit())
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
      setExpandedCat(null)
      setTimeout(() => setPopCatIndex(null), 700)
      setSelected([])

      const isFinalGroup = solvedCats.length + 1 === 4
      if (isFinalGroup) {
        // The whole-puzzle payoff (mark + confetti + "Connected.") takes
        // over, with no individual microcopy on the final group.
        finishWon(500)
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
    const oneAway = isOneAway(selected)
    setGuessLog((prev) => [...prev, { levels, catIndexes, correct: false, attemptKey: key, oneAway, texts: selected.map((t) => t.text) }])
    haptics.incorrect()
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
    // Second Opinion restores one allowance; the mistake itself stays counted.
    if (newMistakes - restored >= MAX_MISTAKES) {
      setSelected([])
      setTimeout(() => {
        // Systems boards never reveal unsolved groups: the board comes back
        // round until it is solved.
        if (!isSystem) setSolvedCats([0, 1, 2, 3])
        setGameOver(true)
        setWon(false)
      }, 500)
    }
  }

  const mistakesLeft = Math.min(MAX_MISTAKES, MAX_MISTAKES - mistakes + restored)

  const finishTimer = useRef(null)
  const finishWon = (delay) => {
    clearTimeout(finishTimer.current)
    finishTimer.current = setTimeout(() => {
      haptics.complete() // the network completes
      setWon(true)
      setGameOver(true)
    }, delay)
  }
  // A board saved with all four groups solved but not finished (for example
  // from before naming was removed) completes when it is opened again.
  useEffect(() => {
    if (gameOver || solvedCats.length !== 4) return
    if (!guessLog.some((g) => g.correct)) return
    finishWon(650)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => () => clearTimeout(finishTimer.current), [])

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

  // What a report about one of this board's connections carries.
  const reportFor = (c) => reportContext(puzzle, puzzle.categories[c.catIndex] || c, { mode: reportMode, date: puzzleDate })

  const foundSet = new Set(guessLog.filter((g) => g.correct).map((g) => g.catIndexes[0]))
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

      {isSystem && systemAttempt && !gameOver && (
        <p className="system-attempt-chip" aria-label={`Try ${systemAttempt.n}. Solving it now earns ${systemAttempt.xp} XP.`}>
          <span className="system-attempt-node" aria-hidden="true" />
          {systemAttempt.n === 1 ? 'First try' : `Try ${systemAttempt.n}`} · solve for <b>{systemAttempt.xp} XP</b>
        </p>
      )}

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
            found={foundSet.has(c.catIndex)}
            forming={popCatIndex === c.catIndex}
            revealing={popCatIndex === c.catIndex}
            expanded={expandedCat === c.catIndex}
            onToggle={() => setExpandedCat((cur) => (cur === c.catIndex ? null : c.catIndex))}
            onReport={onReport ? () => onReport(reportFor(c)) : undefined}
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
                  } ${isOneAwayPulse ? 'tile-oneaway-pulse' : ''} ${curbsideTiles.includes(tile.text) ? 'tile-curbside' : ''} ${ruleOutActive?.outsider === tile.text ? 'tile-ruled-out' : ''} ${
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
            <button className="secondary-btn" onClick={handleShuffle} disabled={!!connecting}>
              Shuffle
            </button>
            <button className="secondary-btn" onClick={handleDeselect} disabled={selected.length === 0 || !!connecting}>
              Deselect
            </button>
            <button className="primary-btn" onClick={handleSubmit} disabled={selected.length !== 4 || !!connecting}>
              Submit
            </button>
          </div>
          {toolsAllowed && <ToolBar kit={kit} toolState={toolState} toolsUsed={toolsUsed} ask={toolAsk} setAsk={setToolAsk} onConfirm={confirmTool} isDaily={isDaily} consultTiles={curbsideTiles} ruleOut={ruleOutActive} restored={restored} />}
        </>
      )}

      {/* Systems board not solved this time: no answers, no groups revealed.
          It goes to the back of the subject's queue and comes round again. */}
      {gameOver && isSystem && !won && (
        <div className="result-card system-retry-card" role="status">
          <span className="system-retry-mark" aria-hidden="true">
            <span /><span /><span />
          </span>
          <h2>Still connecting…</h2>
          <p className="system-retry-line">
            {systemActions && systemActions.othersLeft === 0
              ? 'This puzzle stays open until you solve it. It’s the last one left here, so you can try it again right away.'
              : 'This puzzle will come back around after the other unsolved boards in this system. The answers stay hidden until you solve it.'}
          </p>
          {solvedCats.length > 0 && (
            <p className="system-retry-meta">
              You found {solvedCats.length} of 4 connections this time.
            </p>
          )}
          {systemActions && (
            <div className="result-actions">
              <button className="primary-btn" onClick={systemActions.primary.onClick}>
                {systemActions.primary.label}
              </button>
              <button className="secondary-btn" onClick={systemActions.secondary.onClick}>
                {systemActions.secondary.label}
              </button>
            </div>
          )}
        </div>
      )}

      {gameOver && !(isSystem && !won) && (
        <div className={`result-card ${won ? 'result-card-won' : ''} ${isPerfect ? 'result-card-perfect' : ''} ${systemCompletion ? 'result-card-system-complete' : ''}`}>
          {/* The completion payoff: the Plexus constellation assembles (four
              jewel-toned nodes wiring themselves together) as the centrepiece,
              and just as its nodes land a restrained jewel-tone confetti burst
              comes out of it, then settles as the result appears. The Daily
              gets a slightly fuller burst than a system puzzle. */}
          {won && <BrandMark size={58} className="result-brandmark" animate decorative />}
          {won && !isSystem && <Confetti count={isDaily ? 44 : 32} originY={45} seed={puzzle.id.length * 97 + mistakes} />}
          {/* A whole subject solved for the first time: the one bigger
              moment in Systems, in that subject's own node colour. */}
          {won && isSystem && systemCompletion && (
            <Confetti count={60} originY={45} seed={puzzle.id.length * 131 + 7} palette={systemCompletion.palette} shapes={['node', 'node', 'line', 'rect', 'node', 'line']} />
          )}

          <h2>{resultTitle || (isDaily ? 'Today’s Plexus' : 'Puzzle Results')}</h2>
          {systemCompletion && (
            <div className="system-connected" role="status" style={{ '--node-accent': systemCompletion.accent }}>
              <p className="system-connected-title">System connected.</p>
              <p className="system-connected-line">
                Every connection found. {systemCompletion.label}: {systemCompletion.total} of {systemCompletion.total} boards solved.
              </p>
            </div>
          )}

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
              return (
                <li key={g.catIndex} className={`rc-row ${g.found ? '' : 'is-missed'}`} style={{ '--strand-color': groupColor(g.level) }}>
                  <span className="rc-node" aria-hidden="true" />
                  <span className="rc-text">
                    <span className="rc-title ">
                      {g.title}
                    </span>
                    <span className="rc-meta">
                      {difficultyLabelOf(g)}
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
          {won && toolsUsed > 0 && <p className="result-assisted">Solved with assistance.</p>}

          {isDaily && dailyStreak > 0 && (
            <div className={`streak-banner ${isMilestone ? 'milestone' : ''}`}>
              {dailyStreak} day streak{isMilestone ? '!' : ''}
            </div>
          )}

          {dailyMicroStat && <p className="daily-micro-stat">{dailyMicroStat}</p>}

          {/* One takeaway right away (the same Connection of the day Home
              shows), with the full review one tap away. */}
          {connectionOfDay && (
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
          {showReview && <ReviewConnections puzzle={puzzle} onReport={onReport} reportMode={reportMode} puzzleDate={puzzleDate} />}


          {isSystem && systemActions ? (
            <div className="result-actions">
              <button className="primary-btn" onClick={systemActions.primary.onClick}>
                {systemActions.primary.label}
              </button>
              <button className="secondary-btn" onClick={systemActions.secondary.onClick}>
                {systemActions.secondary.label}
              </button>
              <button className="text-link result-share-link" onClick={handleShare}>
                {copied ? 'Copied!' : 'Share results'}
              </button>
            </div>
          ) : (
          <div className="result-actions">
            <button className="primary-btn" onClick={handleShare}>
              {copied ? 'Copied!' : 'Share Results'}
            </button>
            {challengeDayNumber != null && (
              <button className="secondary-btn" onClick={handleChallenge}>
                {challengeCopied ? 'Link copied!' : 'Challenge a friend'}
              </button>
            )}
            {onReplay && (
              <button className="secondary-btn" onClick={onReplay}>
                Play again
              </button>
            )}
            <button className="secondary-btn" onClick={onExit}>
              Back to Home
            </button>
          </div>
          )}

          {/* XP, level and Kit rewards: secondary, compact, after the actions. */}
          {xpResult && <XpResult result={xpResult} onOpenRecord={onOpenRecord} />}


        </div>
      )}
    </div>
  )
}

// Current tool balances and level, read fresh from the saved progression.
function readKit() {
  const st = loadProgression()
  return { counts: kitCounts(st), level: levelInfo(totalXp(st)).level }
}

// The puzzle tools, in their own section below the board controls. Each tool
// has a use button (asks before spending) and a separate info button that
// only explains: opening an explanation never spends anything. Info works by
// tap, click and keyboard (Enter/Space to open, Escape to close).
const TOOL_DETAIL = {
  curbside: {
    what: 'Highlights two tiles that belong together.',
    more: 'The two tiles come from the easiest group you have not solved yet.',
    when: 'Any time before the board ends.',
  },
  lab: {
    what: 'After a “one away” guess, identifies the tile that does not belong with the other three.',
    more: 'It works on your most recent submitted one-away guess, not on tiles you have only selected.',
    when: 'After you submit a guess and see “one away”.',
  },
  'second-opinion': {
    what: 'Restores one mistake allowance. The original mistake stays recorded.',
    more: 'Your results still count the mistake. You just get one more guess.',
    when: 'After at least one mistake.',
  },
}
function toolStatusText(item, st, count, level) {
  if (st.ok) return `Ready to use · ${count} left`
  const def = KIT[item]
  if (level < def.unlock) return `Locked · unlocks at Level ${def.unlock}`
  return `${st.why} · ${count} left`
}
function ToolBar({ kit, toolState, toolsUsed, ask, setAsk, onConfirm, isDaily, consultTiles, ruleOut, restored }) {
  const [info, setInfo] = useState(null)
  const def = ask ? KIT[ask] : null
  const effectLine = {
    curbside: 'Two tiles from the same unsolved group will be highlighted.',
    lab: 'In your last “one away” guess, the tile that doesn’t belong with the other three will be marked.',
    'second-opinion': 'You get one mistake allowance back. The mistake stays on your record.',
  }
  const toggleInfo = (item) => setInfo((cur) => (cur === item ? null : item))
  const onKey = (e) => {
    if (e.key === 'Escape' && info) {
      e.stopPropagation()
      const was = info
      setInfo(null)
      document.getElementById(`tool-info-btn-${was}`)?.focus()
    }
  }
  return (
    <section className="tool-section" aria-labelledby="tool-section-title" onKeyDown={onKey}>
      <div className="tool-section-head">
        <h3 id="tool-section-title" className="tool-section-title">Tools</h3>
        <p className="tool-section-rule">{toolsUsed > 0 ? 'Tool used. One tool per Daily.' : 'You can use one tool per Daily.'}</p>
      </div>
      <ul className="tool-list">
        {PUZZLE_TOOLS.map((item) => {
          const st = toolState(item)
          const count = kit.counts[item] || 0
          const locked = kit.level < KIT[item].unlock
          return (
            <li key={item} className={`tool-item ${locked ? 'is-locked' : ''}`}>
              <button
                className={`kit-use tool-btn ${st.ok ? '' : 'is-off'}`}
                onClick={() => st.ok && setAsk(item)}
                aria-disabled={!st.ok}
                aria-label={`Use ${KIT[item].name}, ${count} left${st.ok ? '' : `. ${locked ? `Unlocks at Level ${KIT[item].unlock}` : st.why}`}`}
              >
                <span className="tool-top">
                  <ToolArt item={item} locked={locked} size="icon" className="tool-btn-art" />
                  <span className="kit-use-name">{KIT[item].name}</span>
                  <span className="kit-use-count">×{count}</span>
                </span>
                {!st.ok && <span className="tool-why">{st.why}</span>}
              </button>
              <button
                type="button"
                id={`tool-info-btn-${item}`}
                className={`info-btn tool-info-btn ${info === item ? 'is-open' : ''}`}
                aria-expanded={info === item}
                aria-controls="tool-info-panel"
                aria-label={`About ${KIT[item].name}`}
                onClick={() => toggleInfo(item)}
              >
                <InfoIcon />
              </button>
            </li>
          )
        })}
      </ul>
      {info && (
        <div id="tool-info-panel" className="tool-info-panel" role="region" aria-label={`About ${KIT[info].name}`}>
          <p className="tool-info-name"><b>{KIT[info].name}</b></p>
          <p className="tool-info-what">{TOOL_DETAIL[info].what}</p>
          <p className="tool-info-more">{TOOL_DETAIL[info].more}</p>
          <dl className="tool-info-facts">
            <div><dt>When</dt><dd>{TOOL_DETAIL[info].when}</dd></div>
            <div><dt>Status</dt><dd>{toolStatusText(info, toolState(info), kit.counts[info] || 0, kit.level)}</dd></div>
            <div><dt>Limit</dt><dd>One tool per Daily. A Daily solved with a tool doesn’t count as Perfect.</dd></div>
            <div><dt>Get more</dt><dd>Level up and complete This Week.</dd></div>
          </dl>
          <button type="button" className="tool-info-close" onClick={() => { setInfo(null); document.getElementById(`tool-info-btn-${info}`)?.focus() }}>Close</button>
        </div>
      )}
      {consultTiles.length > 0 && <p className="kit-hint">Consult: these two belong together.</p>}
      {ruleOut && <p className="kit-hint">Rule Out: the marked tile doesn’t belong with the other three.</p>}
      {restored > 0 && <p className="kit-hint">Second Opinion: one mistake allowance restored. Your original mistake stays recorded.</p>}
      {ask && def && (
        <div className="kit-intro" role="group" aria-label={`Use ${def.name}?`}>
          <p className="kit-intro-text">
            <b>{def.name}</b>. {effectLine[ask]} It uses 1 of your {kit.counts[ask]}, and you can use one tool per Daily. A Daily solved with a tool doesn’t count as Perfect.
          </p>
          <div className="kit-intro-actions">
            <button className="kit-intro-use" onClick={() => onConfirm(ask)}>Use {def.name}</button>
            <button className="kit-intro-cancel" onClick={() => setAsk(null)}>Not now</button>
          </div>
        </div>
      )}
    </section>
  )
}

// ---- Solve animation helpers ----
// How long the four tiles spend connecting on the board before they become a
// solved group (the card then forms in about 300ms: about 650ms in all).
const CONNECT_MS = 520

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

