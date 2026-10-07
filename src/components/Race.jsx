import { INSTRUCTIONS } from '../utils/challengeEngine.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  RACE_LENGTH,
  makeJoinCode,
  normalizeJoinCode,
  isValidJoinCode,
  buildRaceChallenge,
  raceLinkForCode,
} from '../utils/raceEngine.js'
import { openLiveRace, isSupabaseConfigured } from '../lib/liveRace.js'
import { haptics } from '../utils/haptics.js'
import { recordRaceFinish, recordRaceWin } from '../progression/store.js'

// ---------------------------------------------------------------------
// Race Mode — "Race a friend through the same Plexus," live.
// ---------------------------------------------------------------------
// The challenge set is a deterministic function of the join code, so two
// players who enter the same code independently build the identical set in the
// identical order — the channel only relays progress, never the questions.
//
// When Supabase is configured, Race opens a live Realtime channel keyed by the
// code: presence shows the opponent in the lobby, one tap starts BOTH players,
// and each side sees the other's live progress and final result. With no second
// player on the channel (or no Supabase), it stays an honest solo timed run —
// it never invents an opponent.
// ---------------------------------------------------------------------

function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

// Decide the head-to-head result: more correct wins; ties break on faster time.
function raceVerdict(you, opp) {
  if (!opp) return null
  if (you.correct !== opp.correct) return you.correct > opp.correct ? 'win' : 'lose'
  if (you.timeMs !== opp.timeMs) return you.timeMs < opp.timeMs ? 'win' : 'lose'
  return 'tie'
}

export default function Race({ bank, initialCode = '', onExit }) {
  const live = isSupabaseConfigured()
  const [phase, setPhase] = useState(initialCode ? 'join' : 'entry') // entry | join | lobby | countdown | playing | results
  const [code, setCode] = useState(initialCode ? normalizeJoinCode(initialCode) : '')
  const [joinInput, setJoinInput] = useState(initialCode ? normalizeJoinCode(initialCode) : '')
  const [isHost, setIsHost] = useState(false)
  const [copied, setCopied] = useState(false)

  // Round run state
  const [rounds, setRounds] = useState([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState([])
  const [verdict, setVerdict] = useState(null) // 'correct' | 'incorrect' | null
  const [shake, setShake] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [misses, setMisses] = useState([])
  const [countdown, setCountdown] = useState(3)
  const startRef = useRef(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const lockRef = useRef(false)
  const shakeTimer = useRef(null)

  // Live opponent state
  const liveRef = useRef(null)
  const phaseRef = useRef(phase)
  const [oppOnline, setOppOnline] = useState(false)
  const [oppName, setOppName] = useState('Opponent')
  const [oppProgress, setOppProgress] = useState({ correct: 0, answered: 0, finished: false })
  const [oppResult, setOppResult] = useState(null) // { correct, total, timeMs }

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // XP: finishing a race pays once per run; a win adds a bonus when the
  // opponent's result arrives. A run with no opponent counts as a solo run.
  const raceRunRef = useRef(null)
  const raceRecordedRef = useRef({ finish: false, win: false })
  useEffect(() => {
    if (phase === 'playing' && !raceRunRef.current) {
      raceRunRef.current = `${code}:${Date.now()}`
      raceRecordedRef.current = { finish: false, win: false }
    }
    if (phase !== 'playing' && phase !== 'results') raceRunRef.current = null
    if (phase === 'results' && raceRunRef.current && !raceRecordedRef.current.finish) {
      raceRecordedRef.current.finish = true
      recordRaceFinish({ raceId: raceRunRef.current, solo: !(oppOnline || oppResult) })
    }
  }, [phase, code, oppOnline, oppResult])
  useEffect(() => {
    if (phase !== 'results' || !raceRunRef.current || !oppResult || raceRecordedRef.current.win) return
    if (raceVerdict({ correct: correctCount, timeMs: elapsedMs }, oppResult) === 'win') {
      raceRecordedRef.current.win = true
      recordRaceWin({ raceId: raceRunRef.current })
    }
  }, [phase, oppResult, correctCount, elapsedMs])

  useEffect(
    () => () => {
      clearTimeout(shakeTimer.current)
      liveRef.current?.leave()
    },
    []
  )

  // Build the deterministic set from the code and roll into the countdown.
  // Both players call this (host on tap, guest on the broadcast) → same set.
  const buildAndCountdown = () => {
    const built = buildRaceChallenge(bank, { code, length: RACE_LENGTH })
    setRounds(built)
    setIdx(0)
    setSelected([])
    setVerdict(null)
    setCorrectCount(0)
    setMisses([])
    setOppProgress({ correct: 0, answered: 0, finished: false })
    setOppResult(null)
    lockRef.current = false
    setCountdown(3)
    setPhase('countdown')
  }

  // Open (or reuse) the live channel for a code. Safe no-op when not configured.
  const connectLive = async (c) => {
    if (!live || liveRef.current) return
    const handle = await openLiveRace(c, {
      name: 'Player',
      onPresence: (state, myId) => {
        const others = Object.entries(state).filter(([k]) => k !== myId)
        setOppOnline(others.length > 0)
        const first = others[0]?.[1]?.[0]
        if (first?.name) setOppName(first.name)
      },
      onStart: () => {
        // Opponent (or host) kicked it off — only act if we're still waiting.
        if (phaseRef.current === 'lobby' || phaseRef.current === 'results') buildAndCountdown()
      },
      onProgress: (p) =>
        setOppProgress({ correct: p.correct || 0, answered: p.answered || 0, finished: !!p.finished }),
      onFinish: (p) => setOppResult({ correct: p.correct || 0, total: p.total || 0, timeMs: p.timeMs || 0 }),
    })
    liveRef.current = handle
  }

  const createRace = async () => {
    const c = makeJoinCode()
    setCode(c)
    setIsHost(true)
    await connectLive(c)
    setPhase('lobby')
  }

  const confirmJoin = async () => {
    const c = normalizeJoinCode(joinInput)
    if (!isValidJoinCode(c)) return
    setCode(c)
    setIsHost(false)
    await connectLive(c)
    setPhase('lobby')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(raceLinkForCode(code))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — the code is shown on screen to read out instead
    }
  }

  // Anyone can start; the first tap starts BOTH via the broadcast.
  const startRace = () => {
    liveRef.current?.sendStart?.({ at: Date.now() })
    buildAndCountdown()
  }

  // 3-2-1 countdown, then start the clock.
  useEffect(() => {
    if (phase !== 'countdown') return undefined
    if (countdown <= 0) {
      startRef.current = Date.now()
      setPhase('playing')
      return undefined
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 700)
    return () => clearTimeout(t)
  }, [phase, countdown])

  const round = rounds[idx] || null

  const triggerWrong = () => {
    haptics.incorrect()
    clearTimeout(shakeTimer.current)
    setShake(false)
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        setShake(true)
        shakeTimer.current = setTimeout(() => setShake(false), 340)
      })
    }
  }

  const advance = (finalCorrect) => {
    const next = idx + 1
    if (next >= rounds.length) {
      const ms = Date.now() - startRef.current
      setElapsedMs(ms)
      liveRef.current?.sendFinish?.({ correct: finalCorrect, total: rounds.length, timeMs: ms })
      setPhase('results')
      return
    }
    setIdx(next)
    setSelected([])
    setVerdict(null)
    lockRef.current = false
  }

  const resolve = (correct, missLabel, missAnswer) => {
    if (lockRef.current) return
    lockRef.current = true
    const nextCorrect = correct ? correctCount + 1 : correctCount
    setVerdict(correct ? 'correct' : 'incorrect')
    if (correct) {
      setCorrectCount(nextCorrect)
      haptics.correct()
    } else {
      setMisses((m) => [...m, { label: missLabel, answer: missAnswer }])
      triggerWrong()
    }
    // Live progress — aggregate counts only.
    liveRef.current?.sendProgress?.({
      correct: nextCorrect,
      answered: idx + 1,
      finished: idx + 1 >= rounds.length,
    })
    setTimeout(() => advance(nextCorrect), 480)
  }

  // Single-answer rounds: one tap answers.
  const answerSingle = (option) => {
    if (lockRef.current || verdict) return
    const label = round.categoryTitle || round.anchor || 'Connection'
    resolve(!!option.correct, label, round.correctAnswer)
  }

  // rapidAssociation: toggle up to 4, then submit.
  const toggle = (text) => {
    if (lockRef.current || verdict) return
    setSelected((prev) => {
      if (prev.includes(text)) return prev.filter((t) => t !== text)
      if (prev.length >= 4) return prev
      haptics.select()
      return [...prev, text]
    })
  }
  const submitRapid = () => {
    if (selected.length !== 4 || lockRef.current) return
    const correctSet = new Set(round.correctAnswers)
    const correct = selected.every((t) => correctSet.has(t))
    resolve(correct, round.anchor, round.correctAnswers.join(', '))
  }

  const total = rounds.length || RACE_LENGTH

  // ---------- Render ----------

  if (phase === 'entry' || phase === 'join') {
    return (
      <div className="race">
        <div className="game-header">
          <button className="icon-btn" onClick={onExit} aria-label="Back">
            &larr;
          </button>
          <div className="game-header-title"><span>Race</span></div>
          <div />
        </div>
        <h1 className="race-title">Race</h1>
        <p className="race-lede">Race a friend through the same Plexus, live.</p>

        <div className="race-entry-actions">
          <button className="race-primary-btn" onClick={createRace}>
            Create a race
          </button>
          <div className="race-join-row">
            <input
              className="race-code-input"
              value={joinInput}
              onChange={(e) => setJoinInput(normalizeJoinCode(e.target.value))}
              placeholder="Enter code"
              aria-label="Race join code"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={4}
            />
            <button className="race-secondary-btn" onClick={confirmJoin} disabled={!isValidJoinCode(joinInput)}>
              Join
            </button>
          </div>
        </div>

        <p className="race-note">
          {live
            ? 'One of you taps “Create a race” and shares the code or link; the other enters it. Then either of you starts, and you’ll both race the same board at the same time.'
            : 'Both players enter the same code to get the identical challenge set, then compare times.'}
        </p>
      </div>
    )
  }

  if (phase === 'lobby') {
    return (
      <div className="race">
        <div className="game-header">
          <button className="icon-btn" onClick={onExit} aria-label="Back">
            &larr;
          </button>
          <div className="game-header-title"><span>Race</span></div>
          <div />
        </div>
        <h1 className="race-title">Race lobby</h1>

        <div className="race-code-card">
          <span className="race-code-label">Join code</span>
          <span className="race-code-value">{code}</span>
          <button className="race-copy-btn" onClick={copyLink}>
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        </div>

        <div className="race-players">
          <div className="race-player">
            <span className="race-player-name">You</span>
            <span className="race-player-status is-ready">Ready</span>
          </div>
          <div className="race-player">
            <span className="race-player-name">Opponent</span>
            <span className={`race-player-status ${oppOnline ? 'is-ready' : 'is-offline'}`}>
              {oppOnline ? 'In the lobby' : live ? 'Waiting to join…' : 'Offline'}
            </span>
          </div>
        </div>

        <p className="race-note">
          {live
            ? oppOnline
              ? 'Your opponent is here. Tap start when you’re both ready. It begins the race for both of you.'
              : 'Share the code or link above. Once your friend joins you’ll see them here, or start now for a solo timed run.'
            : 'Live sync is off (Supabase not configured). You can run the seeded race solo; a friend with the same code gets the identical questions.'}
        </p>

        <button className="race-primary-btn" onClick={startRace}>
          {live && oppOnline ? 'Start race' : 'Start'}
        </button>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="race race-countdown-screen">
        <div className="race-countdown" aria-live="assertive">
          {countdown > 0 ? countdown : 'Go'}
        </div>
      </div>
    )
  }

  if (phase === 'playing' && round) {
    const isRapid = round.type === 'rapidAssociation'
    const showOpp = live && (oppOnline || oppProgress.answered > 0)
    return (
      <div className={`race race-playing ${shake ? 'is-shake' : ''} ${verdict === 'incorrect' ? 'is-wrong' : ''}`}>
        <div className="race-live">
          <span className="race-live-you">You {correctCount}/{total}</span>
          <span className="race-live-opp">
            {oppName} {showOpp ? `${oppProgress.correct}/${total}` : `?/${total}`}
          </span>
        </div>
        <div className="race-progress-track" aria-hidden="true">
          <div className="race-progress-fill" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        {showOpp && (
          <div className="race-progress-track race-progress-opp" aria-hidden="true">
            <div className="race-progress-fill" style={{ width: `${(oppProgress.answered / total) * 100}%` }} />
          </div>
        )}

        <div className="race-round">
          {isRapid && <p className="race-anchor">{round.anchor}</p>}
          {round.type === 'commonLink' && (
            <>
              <p className="race-prompt">{INSTRUCTIONS.commonLink}</p>
              <p className="race-shown">{round.shown.join(' · ')}</p>
            </>
          )}
          {round.type === 'completeConnection' && (
            <>
              <p className="race-prompt">{INSTRUCTIONS.completeConnection}</p>
              <p className="race-shown">{round.shown.join(' · ')}</p>
            </>
          )}
          {round.type === 'impostor' && (
            <>
              <p className="race-prompt">One of these is not in this group. Tap it.</p>
              <p className="race-shown">{round.categoryTitle}</p>
            </>
          )}
          {isRapid && <p className="race-prompt">{INSTRUCTIONS.rapidAssociation}</p>}

          <div className="race-options">
            {round.options.map((opt) => {
              const isSel = selected.includes(opt.text)
              return (
                <button
                  key={opt.text}
                  className={`race-option ${isSel ? 'is-selected' : ''}`}
                  onClick={() => (isRapid ? toggle(opt.text) : answerSingle(opt))}
                  disabled={!!verdict}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>

          {isRapid && (
            <button className="race-submit-btn" onClick={submitRapid} disabled={selected.length !== 4 || !!verdict}>
              Submit ({selected.length}/4)
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const you = { correct: correctCount, timeMs: elapsedMs }
    const verdictResult = live && oppResult ? raceVerdict(you, oppResult) : null
    const oppStillRacing = live && oppOnline && !oppResult

    return (
      <div className="race race-results">
        <h1 className="race-title">Race complete</h1>

        {verdictResult && (
          <div className={`race-outcome race-outcome-${verdictResult}`}>
            {verdictResult === 'win' ? 'You win! 🏆' : verdictResult === 'lose' ? 'You lost' : "It's a tie"}
          </div>
        )}

        <div className="race-result-grid">
          <div className="race-result-stat">
            <span className="race-result-num">{fmtTime(elapsedMs)}</span>
            <span className="race-result-label">Your time</span>
          </div>
          <div className="race-result-stat">
            <span className="race-result-num">{correctCount}/{total}</span>
            <span className="race-result-label">Correct</span>
          </div>
          <div className="race-result-stat">
            <span className="race-result-num">{accuracy}%</span>
            <span className="race-result-label">Accuracy</span>
          </div>
        </div>

        {live && oppResult && (
          <div className="race-opp-result">
            <span className="race-opp-result-name">{oppName}</span>
            <span className="race-opp-result-stat">
              {oppResult.correct}/{oppResult.total} · {fmtTime(oppResult.timeMs)}
            </span>
          </div>
        )}

        <p className="race-note">
          {oppStillRacing
            ? `${oppName} is still racing. Their result will appear here when they finish.`
            : live && oppResult
              ? 'Good race. Tap “Race again” for a fresh board with the same opponent.'
              : (
                <>No opponent joined. Compare your time with a friend running code <strong>{code}</strong>.</>
              )}
        </p>

        {misses.length > 0 && (
          <div className="race-misses">
            <h2 className="home-section-heading">Connections missed</h2>
            {misses.map((m, i) => (
              <div className="race-miss" key={i}>
                <span className="race-miss-label">{m.label}</span>
                {m.answer && <span className="race-miss-answer">{m.answer}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="race-results-actions">
          <button className="race-primary-btn" onClick={startRace}>
            Race again
          </button>
          <button className="race-secondary-btn" onClick={onExit}>
            Done
          </button>
        </div>
      </div>
    )
  }

  // Fallback (e.g. no rounds could be built)
  return (
    <div className="race">
      <h1 className="race-title">Race</h1>
      <p className="race-note">Couldn&rsquo;t build a race right now. Please try again.</p>
      <button className="race-secondary-btn" onClick={onExit}>Back</button>
    </div>
  )
}
