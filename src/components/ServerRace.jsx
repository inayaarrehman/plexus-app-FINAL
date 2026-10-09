import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { INSTRUCTIONS } from '../utils/challengeEngine.js'
import { RACE_LENGTH, normalizeJoinCode, isValidJoinCode, buildRaceChallenge, raceLinkForCode } from '../utils/raceEngine.js'
import { timedCanonicalId } from '../utils/timedLibrary.js'
import { raceCall, subscribeMatch, getRaceSummary } from '../lib/raceApi.js'
import { scrambleLabel, activeEffect } from '../utils/mutation.js'
import { haptics } from '../utils/haptics.js'
import { recordRaceFinish, recordRaceWin } from '../progression/store.js'
import { RACE_REWARDS } from '../progression/config.js'

// ---------------------------------------------------------------------
// Race, run by the server (signed-in players)
// ---------------------------------------------------------------------
// Same race as always: the same code gives both players the same ten rounds.
// The difference is who decides: every answer goes to the server, which
// scores it, records it, decides the result and applies Race rewards. The
// optional Chaos toggle lives in this lobby; Mutation and CRISPR are sent to
// the server, which checks and applies them for both players at once. The
// opponent's effects arrive as server events (Realtime, with a polling
// fallback), never simulated on this device.
// ---------------------------------------------------------------------

const CHAOS_COPY = 'Chaos: Use earned Mutation and CRISPR power-ups during this race. Both players must agree.'
const SESSION_KEY = 'plexus.raceMatch.v1'
const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
const fmtTime = (ms) => {
  const s = Math.max(0, Math.round((ms || 0) / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const REJECT = {
  'not-equipped': 'No Mutation equipped for this race.',
  'no-mutation': 'You have no Mutation left.',
  'target-finished': 'Your opponent has finished.',
  'target-disconnected': 'Your opponent is not connected right now.',
  'target-no-challenge': 'Your opponent has no round on screen.',
  'effect-active': 'A Mutation is already running.',
  'target-immune': 'Your opponent is immune for a few seconds.',
  'not-started': 'The race has not started yet.',
  'not-available': 'Chaos is off for this race.',
}
const NOT_COUNTED = {
  'opponent-limit': 'You can keep racing. Reward progress against this opponent resets tomorrow.',
  'daily-limit': 'You can keep racing. Today’s Race reward progress is full; it resets tomorrow.',
  'not-qualifying': 'This race didn’t count toward Race rewards: both players need to answer all 10 rounds with at least 3 right, take at least 20 seconds, and stay connected.',
  abandoned: 'This race was abandoned, so it didn’t count toward Race rewards.',
  'opponent-left': 'Your opponent left, so this race didn’t count toward Race rewards.',
}

export default function ServerRace({ bank, initialCode = '', onExit }) {
  const [view, setView] = useState('entry') // entry | lobby | race | results
  const [joinInput, setJoinInput] = useState(initialCode ? normalizeJoinCode(initialCode) : '')
  const [state, setState] = useState(null) // server state
  const [offset, setOffset] = useState(0) // server clock minus this device's clock
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loadout, setLoadout] = useState({ mutation: false, crispr: false })
  const [selected, setSelected] = useState([])
  const [verdict, setVerdict] = useState(null)
  const [notice, setNotice] = useState('')
  const [summary, setSummary] = useState(null)
  const [tick, setTick] = useState(0)
  const [me, setMe] = useState(null)
  const lockRef = useRef(false)
  const noticeTimer = useRef(null)
  const seenEvents = useRef(new Set())

  const matchId = state?.match?.id || null
  const code = state?.match?.code || ''
  const nowServer = () => Date.now() + offset

  const apply = useCallback((r) => {
    if (!r || !r.ok) return r
    if (r.now) setOffset(Date.parse(r.now) - Date.now())
    if (r.you) setMe(r.you)
    setState(r)
    try {
      sessionStorage.setItem(SESSION_KEY, r.match.id)
    } catch {
      /* ignore */
    }
    return r
  }, [])
  const flash = (text, ms = 2200) => {
    setNotice(text)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(''), ms)
  }

  // Who am I? The server marks nothing as "you", so read it from the summary
  // call's user (the first player row we created or joined is ours).
  useEffect(() => {
    getRaceSummary().then((s) => setSummary(s))
  }, [])

  // Resume a match after a reload or reconnect.
  useEffect(() => {
    let id = null
    try {
      id = sessionStorage.getItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    if (!id) return
    raceCall('state', { matchId: id }).then((r) => {
      if (r.ok && ['lobby', 'active'].includes(r.match.status)) {
        apply(r)
        setMe(r.you || null)
      } else {
        try {
          sessionStorage.removeItem(SESSION_KEY)
        } catch {
          /* ignore */
        }
      }
    })
  }, [apply])

  const players = state?.players || []
  const mine = players.find((p) => p.user_id === me) || null
  const opp = players.find((p) => p.user_id !== me) || null
  const status = state?.match?.status || null
  const chaos = !!state?.match?.chaos

  // Phase from the server's view.
  useEffect(() => {
    if (!state) return
    if (status === 'lobby') setView('lobby')
    else if (status === 'active') setView(mine?.finished_at ? 'results' : 'race')
    else if (status === 'finished' || status === 'abandoned') setView('results')
  }, [state, status, mine?.finished_at])

  // Realtime + polling + heartbeat while in a match.
  useEffect(() => {
    if (!matchId) return undefined
    let off = () => {}
    let alive = true
    const refresh = () => raceCall('state', { matchId }).then((r) => alive && r.ok && apply(r))
    subscribeMatch(matchId, () => refresh()).then((f) => (off = f))
    const poll = setInterval(refresh, 1500)
    const beat = setInterval(() => raceCall('heartbeat', { matchId }).then((r) => alive && r.ok && apply(r)), 5000)
    return () => {
      alive = false
      off()
      clearInterval(poll)
      clearInterval(beat)
    }
  }, [matchId, apply])

  // Redraw while a countdown or effect is running.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 200)
    return () => clearInterval(t)
  }, [])

  // Announce power-up events once each.
  useEffect(() => {
    for (const e of state?.events || []) {
      if (seenEvents.current.has(e.id)) continue
      seenEvents.current.add(e.id)
      if (!me) continue
      if (e.kind === 'blocked') flash(e.to_user === me ? 'Your CRISPR blocked a Mutation.' : 'Your Mutation was blocked by CRISPR.')
      if (e.kind === 'mutation' && e.to_user === me) {
        haptics.incorrect()
        flash('Mutation! Letters scrambled for 2 seconds.', 2000)
      }
      if (e.kind === 'mutation' && e.from_user === me) flash('Mutation sent.')
      if (e.kind === 'armed' && e.from_user !== me) flash('Your opponent armed CRISPR.')
    }
  }, [state?.events, me])

  const rounds = useMemo(() => (code ? buildRaceChallenge(bank, { code, length: RACE_LENGTH, canonicalOf: timedCanonicalId }) : []), [bank, code])
  const idx = mine?.answered || 0
  const round = rounds[idx] || null
  const startAt = state?.match?.start_at ? Date.parse(state.match.start_at) : null
  const countdownLeft = startAt ? Math.ceil((startAt - nowServer()) / 1000) : null
  const effect = me ? activeEffect(state?.events, me, nowServer()) : null
  void tick

  // ---- actions ----
  const act = async (action, payload = {}) => {
    setBusy(true)
    setError('')
    const r = await raceCall(action, { tz: tz(), ...payload })
    setBusy(false)
    if (!r.ok) {
      setError(r.reason === 'race-full' ? 'That race already has two players.' : r.reason === 'no-such-race' ? 'No open race with that code.' : r.reason === 'already-started' ? 'That race has already started.' : r.error || 'Something went wrong. Try again.')
      return r
    }
    return apply(r)
  }
  const create = async () => {
    const r = await act('create')
    if (r?.ok) setMe(r.players[0].user_id)
  }
  const join = async () => {
    const c = normalizeJoinCode(joinInput)
    if (!isValidJoinCode(c)) return
    const r = await act('join', { code: c })
    if (r?.ok) setMe(r.you || r.players[r.players.length - 1].user_id)
  }
  const toggleChaos = () => act('chaos', { matchId, on: !chaos })
  const acceptChaos = () => act('accept', { matchId, mutation: loadout.mutation, crispr: loadout.crispr })
  const start = () => act('start', { matchId })
  const leave = async () => {
    if (matchId && status !== 'finished' && status !== 'abandoned') await raceCall('leave', { matchId })
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    onExit()
  }
  const rematch = async () => {
    seenEvents.current = new Set()
    setLoadout({ mutation: false, crispr: false })
    const r = await act('rematch', { matchId })
    if (r?.ok && !r.players.some((p) => p.user_id === me)) setMe(r.players[r.players.length - 1].user_id)
  }
  const sendAnswer = async (answer) => {
    if (lockRef.current || !round) return
    lockRef.current = true
    const r = await raceCall('answer', { matchId, round: idx, answer })
    if (r.ok) {
      const right = !!r.lastAnswer?.correct
      setVerdict(right ? 'correct' : 'incorrect')
      right ? haptics.correct() : haptics.incorrect()
      setTimeout(() => {
        setVerdict(null)
        setSelected([])
        apply(r)
        lockRef.current = false
      }, 420)
    } else {
      lockRef.current = false
      if (r.reason === 'out-of-order' || r.reason === 'finished') raceCall('state', { matchId }).then(apply)
      else flash('Connection problem. Your answer was not recorded; try again.')
    }
  }
  const attack = async () => {
    const r = await raceCall('attack', { matchId })
    if (r.ok) apply(r)
    else flash(REJECT[r.reason] || 'Mutation not sent. Nothing was used.')
  }
  const arm = async () => {
    const r = await raceCall('arm', { matchId })
    if (r.ok) apply(r)
    else flash('CRISPR could not be armed.')
  }

  // XP on this device (same rules as before), once per match.
  const recorded = useRef({})
  useEffect(() => {
    if (!matchId || !mine?.finished_at || recorded.current[matchId]) return
    recorded.current[matchId] = true
    recordRaceFinish({ raceId: matchId, solo: false })
  }, [matchId, mine?.finished_at])
  useEffect(() => {
    if (!matchId || mine?.outcome !== 'win' || recorded.current[`${matchId}:win`]) return
    recorded.current[`${matchId}:win`] = true
    recordRaceWin({ raceId: matchId })
  }, [matchId, mine?.outcome])
  // Fresh reward progress once settled.
  useEffect(() => {
    if (status === 'finished' || status === 'abandoned') getRaceSummary().then(setSummary)
  }, [status])

  const header = (
    <div className="game-header">
      <button className="icon-btn" onClick={leave} aria-label="Back">
        &larr;
      </button>
      <div className="game-header-title">
        <span>Race</span>
      </div>
      <div />
    </div>
  )

  if (view === 'entry' || !state) {
    return (
      <div className="race">
        {header}
        <h1 className="race-title">Race</h1>
        <p className="race-lede">Race a friend through the same Plexus, live.</p>
        <div className="race-entry-actions">
          <button className="race-primary-btn" onClick={create} disabled={busy}>
            Create a race
          </button>
          <div className="race-join-row">
            <input className="race-code-input" value={joinInput} onChange={(e) => setJoinInput(normalizeJoinCode(e.target.value))} placeholder="Enter code" aria-label="Race join code" autoCapitalize="characters" maxLength={4} />
            <button className="race-secondary-btn" onClick={join} disabled={!isValidJoinCode(joinInput) || busy}>
              Join
            </button>
          </div>
        </div>
        {error && <p className="race-error" role="alert">{error}</p>}
        <p className="race-note">Signed-in races are scored by the Plexus server and count toward Race rewards.</p>
      </div>
    )
  }

  if (view === 'lobby') {
    const both = players.length === 2
    const canStart = both && (!chaos || players.every((p) => p.chaos_accepted))
    const loadoutText = (p) => (p ? [p.equip_mutation ? 'Mutation' : null, p.equip_crispr ? 'CRISPR' : null].filter(Boolean).join(' + ') || 'nothing equipped' : '')
    return (
      <div className="race">
        {header}
        <h1 className="race-title">Race lobby</h1>
        <div className="race-code-card">
          <span className="race-code-label">Join code</span>
          <span className="race-code-value">{code}</span>
          <button
            className="race-copy-btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(raceLinkForCode(code))
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              } catch {
                /* the code is on screen */
              }
            }}
          >
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        </div>
        <div className="race-players">
          <div className="race-player">
            <span className="race-player-name">You</span>
            <span className="race-player-status is-ready">{chaos ? (mine?.chaos_accepted ? `Chaos accepted · ${loadoutText(mine)}` : 'Chaos not accepted yet') : 'Ready'}</span>
          </div>
          <div className="race-player">
            <span className="race-player-name">Opponent</span>
            <span className={`race-player-status ${opp ? 'is-ready' : 'is-offline'}`}>
              {!opp ? 'Waiting to join…' : chaos ? (opp.chaos_accepted ? `Chaos accepted · ${loadoutText(opp)}` : 'Chaos not accepted yet') : 'In the lobby'}
            </span>
          </div>
        </div>

        <div className={`race-chaos ${chaos ? 'is-on' : ''}`}>
          <label className="race-chaos-toggle">
            <input type="checkbox" checked={chaos} onChange={toggleChaos} disabled={busy} />
            <span>{CHAOS_COPY}</span>
          </label>
          {chaos && (
            <div className="race-chaos-loadout">
              <p className="race-chaos-head">Your loadout (at most one of each, used only in this race)</p>
              <label className={!mine?.has_mutation ? 'is-off' : ''}>
                <input type="checkbox" checked={loadout.mutation} disabled={!mine?.has_mutation || mine?.chaos_accepted} onChange={(e) => setLoadout((l) => ({ ...l, mutation: e.target.checked }))} />
                Mutation {mine?.has_mutation ? '' : '(none earned yet)'}
              </label>
              <label className={!mine?.has_crispr ? 'is-off' : ''}>
                <input type="checkbox" checked={loadout.crispr} disabled={!mine?.has_crispr || mine?.chaos_accepted} onChange={(e) => setLoadout((l) => ({ ...l, crispr: e.target.checked }))} />
                CRISPR {mine?.has_crispr ? '' : '(none earned yet)'}
              </label>
              {!mine?.chaos_accepted ? (
                <button className="race-secondary-btn" onClick={acceptChaos} disabled={busy}>
                  Accept Chaos
                </button>
              ) : (
                <p className="race-chaos-head">Accepted. Waiting for {opp?.chaos_accepted ? 'start' : 'your opponent'}.</p>
              )}
            </div>
          )}
        </div>
        {error && <p className="race-error" role="alert">{error}</p>}
        <p className="race-note">{!both ? 'Share the code or link. The race starts once your opponent joins.' : chaos && !canStart ? 'Both players must accept Chaos before the race can start. Turn Chaos off to race without power-ups.' : 'Either of you can start. It begins the race for both.'}</p>
        <button className="race-primary-btn" onClick={start} disabled={!canStart || busy}>
          Start race
        </button>
      </div>
    )
  }

  if (view === 'race') {
    if (countdownLeft !== null && countdownLeft > 0) {
      return (
        <div className="race race-countdown-screen">
          <div className="race-countdown" aria-live="assertive">
            {countdownLeft}
          </div>
        </div>
      )
    }
    if (!round) return <div className="race"><p className="race-note">Waiting for the server…</p></div>
    const isRapid = round.type === 'rapidAssociation'
    // Mutation: the answer tiles only, a fixed scrambled rendering until the
    // effect's stored end, then exactly the original text.
    const label = (text) => (effect ? scrambleLabel(text, effect.seed) : text)
    return (
      <div className={`race race-playing ${verdict === 'incorrect' ? 'is-wrong' : ''} ${effect ? 'is-mutated' : ''}`}>
        <div className="race-live">
          <span className="race-live-you">You {mine?.correct || 0}/{RACE_LENGTH}</span>
          <span className="race-live-opp">Opponent {opp?.correct || 0}/{RACE_LENGTH}</span>
        </div>
        <div className="race-progress-track" aria-hidden="true">
          <div className="race-progress-fill" style={{ width: `${(idx / RACE_LENGTH) * 100}%` }} />
        </div>
        <div className="race-progress-track race-progress-opp" aria-hidden="true">
          <div className="race-progress-fill" style={{ width: `${((opp?.answered || 0) / RACE_LENGTH) * 100}%` }} />
        </div>
        {chaos && (
          <div className="race-powerups" role="group" aria-label="Power-ups">
            {mine?.equip_mutation && (
              <button className="race-powerup" onClick={attack} disabled={mine.mutation_spent || !opp || !!opp.finished_at}>
                {mine.mutation_spent ? 'Mutation spent' : 'Send Mutation'}
              </button>
            )}
            {mine?.equip_crispr && (
              <button className="race-powerup" onClick={arm} disabled={mine.crispr_armed || mine.crispr_spent}>
                {mine.crispr_spent ? 'CRISPR spent' : mine.crispr_armed ? 'CRISPR armed' : 'Arm CRISPR'}
              </button>
            )}
            <span className="race-powerup-opp">
              Opponent: {opp?.crispr_spent ? 'CRISPR spent' : opp?.crispr_armed ? 'CRISPR armed' : opp?.equip_crispr ? 'CRISPR ready' : 'no CRISPR'}
              {opp?.equip_mutation ? (opp.mutation_spent ? ' · Mutation spent' : ' · Mutation ready') : ''}
            </span>
          </div>
        )}
        {notice && <div className="toast race-toast" role="status">{notice}</div>}
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
                  data-original={opt.text}
                  aria-label={opt.text}
                  onClick={() => {
                    if (isRapid) {
                      if (verdict) return
                      setSelected((prev) => (prev.includes(opt.text) ? prev.filter((t) => t !== opt.text) : prev.length >= 4 ? prev : [...prev, opt.text]))
                    } else sendAnswer(opt.text)
                  }}
                  disabled={!!verdict}
                >
                  {label(opt.text)}
                </button>
              )
            })}
          </div>
          {isRapid && (
            <button className="race-submit-btn" onClick={() => sendAnswer(selected)} disabled={selected.length !== 4 || !!verdict}>
              Submit ({selected.length}/4)
            </button>
          )}
        </div>
      </div>
    )
  }

  // ---- results ----
  const waiting = status === 'active'
  const outcome = mine?.outcome
  const log = state?.log
  const prog = summary?.progress
  return (
    <div className="race race-results">
      {header}
      <h1 className="race-title">{waiting ? 'Finished' : 'Race complete'}</h1>
      {outcome && outcome !== 'abandoned' && (
        <div className={`race-outcome race-outcome-${outcome}`}>{outcome === 'win' ? 'You win!' : outcome === 'lose' ? 'You lost' : 'It’s a tie'}</div>
      )}
      {chaos && <p className="race-note">Chaos race. Results are kept apart from standard races.</p>}
      <div className="race-result-grid">
        <div className="race-result-stat">
          <span className="race-result-num">{fmtTime(mine?.run_ms)}</span>
          <span className="race-result-label">Your time</span>
        </div>
        <div className="race-result-stat">
          <span className="race-result-num">
            {mine?.correct || 0}/{RACE_LENGTH}
          </span>
          <span className="race-result-label">Correct</span>
        </div>
      </div>
      {opp && (
        <div className="race-opp-result">
          <span className="race-opp-result-name">Opponent</span>
          <span className="race-opp-result-stat">{opp.finished_at ? `${opp.correct}/${RACE_LENGTH} · ${fmtTime(opp.run_ms)}` : opp.left_at || opp.outcome === 'abandoned' ? 'Left the race' : 'Still racing…'}</span>
        </div>
      )}
      {!waiting && log && <p className="race-note">{log.counted ? 'This race counted toward Race rewards.' : NOT_COUNTED[log.reason] || NOT_COUNTED['not-qualifying']}</p>}
      {prog && (
        <p className="race-note race-reward-progress">
          Mutation: {prog.qualifyingWins % RACE_REWARDS.mutationEveryWins}/{RACE_REWARDS.mutationEveryWins} qualifying wins · CRISPR: {prog.qualifyingRaces % RACE_REWARDS.crisprEveryRaces}/{RACE_REWARDS.crisprEveryRaces} qualifying races
        </p>
      )}
      {log?.granted?.length > 0 && <p className="race-note">Earned: {log.granted.map((g) => `${g.item === 'mutation' ? 'Mutation' : 'CRISPR'}${g.as === 'pending' ? ' (inventory full, waiting as a claim)' : ''}`).join(', ')}</p>}
      <div className="race-results-actions">
        {!waiting && (
          <button className="race-primary-btn" onClick={rematch} disabled={busy}>
            Race again
          </button>
        )}
        <button className="race-secondary-btn" onClick={leave}>
          Done
        </button>
      </div>
    </div>
  )
}
