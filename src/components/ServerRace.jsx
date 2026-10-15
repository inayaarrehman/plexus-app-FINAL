import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TileText from './TileText.jsx'
import { INSTRUCTIONS } from '../utils/challengeEngine.js'
import { RACE_LENGTH, normalizeJoinCode, isValidJoinCode, buildRaceChallenge } from '../utils/raceEngine.js'
import { timedCanonicalId } from '../utils/timedLibrary.js'
import { raceCall, subscribeMatch, getRaceSummary, startGuestRacing, isGuestRacing, upgradeGuestSeat, saveRaceResume, readRaceResume, clearRaceResume } from '../lib/raceApi.js'
import { scrambleLabel, activeEffect } from '../utils/mutation.js'
import { haptics } from '../utils/haptics.js'
import { recordRaceFinish, recordRaceWin, toolKit } from '../progression/store.js'
import { RACE_REWARDS, MUTATION_MS, CRISPR_UNLOCK_LEVEL, nextCrisprLevel, lastMilestoneLevel } from '../progression/config.js'
import PlexusBadge from './PlexusBadge.jsx'
import RaceArt from './RaceArt.jsx'
import ToolReveal from './ToolReveal.jsx'
import RaceInvite, { RACE_SCORING_COPY, raceJoinError } from './RaceInvite.jsx'
import { RewardMoments } from './XpResult.jsx'
import { TimedXpNote, TimedResultLine } from './TimedXp.jsx'

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

const MUTATION_SECONDS = Math.round(MUTATION_MS / 1000)
const CHAOS_COPY = 'Chaos: Use earned Mutation and CRISPR power-ups during this race. Both players must agree.'
const CHAOS_COPY_FREE = `Chaos: Each player gets one Mutation for this race. Players at Level ${CRISPR_UNLOCK_LEVEL} or above can also bring an earned CRISPR. Both players must agree.`
// Shown before a Chaos race starts. Matches the server rules (effect_ms
// 10000, one charge of each per race, CRISPR spent when it blocks and only
// from Level 12).
function PowerupExplainer({ free }) {
  return (
    <div className="race-powerup-explainer">
      <p className="race-powerup-explainer-head">{free ? 'Your Chaos loadout for this race' : 'How power-ups work'}</p>
      <dl>
        <div>
          <dt>Mutation</dt>
          <dd>Scrambles the letters on your opponent’s answer choices for {MUTATION_SECONDS} seconds.</dd>
        </div>
        <div>
          <dt>CRISPR</dt>
          <dd>Level {CRISPR_UNLOCK_LEVEL} and above, after {RACE_REWARDS.crisprUnlockRaces} counted races. Arm it to block the next Mutation sent at you. It is used up when it blocks.</dd>
        </div>
      </dl>
      <p className="race-powerup-explainer-foot">
        {free
          ? `One Mutation each, for this race only; it never uses Your Tools. CRISPR comes from levels (one at Level ${CRISPR_UNLOCK_LEVEL} after ${RACE_REWARDS.crisprUnlockRaces} counted races, then one every ${RACE_REWARDS.crisprLevelEvery} levels) and, rarely, from winning races.`
          : 'Each player can bring at most one of each, from items they have earned.'}
      </p>
    </div>
  )
}
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
  'not-equipped': 'No Mutation left for this race.',
  'no-mutation': 'You have no Mutation left.',
  'target-finished': 'Your opponent has finished.',
  'target-disconnected': 'Your opponent is not connected right now.',
  'target-no-challenge': 'Your opponent has no round on screen.',
  'effect-active': 'A Mutation is already running.',
  'target-immune': 'Your opponent is immune for a few seconds.',
  'not-started': 'The race has not started yet.',
  'not-available': 'Chaos is off for this race.',
  'crispr-locked': `CRISPR unlocks at Level ${CRISPR_UNLOCK_LEVEL} after ${RACE_REWARDS.crisprUnlockRaces} counted races.`,
  'no-crispr': 'You have no CRISPR left.',
}
const NOT_COUNTED = {
  'opponent-limit': 'You can keep racing. Reward progress against this opponent resets tomorrow.',
  'daily-limit': 'You can keep racing. Today’s Race reward progress is full; it resets tomorrow.',
  'not-qualifying': 'This race didn’t count toward Race rewards: both players need to answer all 10 rounds with at least 3 right, take at least 20 seconds, and stay connected.',
  abandoned: 'This race was abandoned, so it didn’t count toward Race rewards.',
  'opponent-left': 'Your opponent left, so this race didn’t count toward Race rewards.',
  guest: 'Guest races don’t earn Race rewards. Sign in to earn them.',
  'opponent-guest': 'Your opponent raced as a guest, so this race didn’t count toward Race rewards.',
}

// A player's latest milestone badge in the lobby; an empty ring before
// Level 10, for guests, or while the level is unknown.
function PlayerBadge({ level }) {
  const ms = level ? lastMilestoneLevel(level) : null
  if (!ms) return <span className="race-badge-empty" aria-hidden="true" />
  return <PlexusBadge level={ms} size={44} label={`Level ${ms} milestone badge`} />
}

export default function ServerRace({ bank, initialCode = '', onExit, account = true, onFallback, onSignIn }) {
  const [view, setView] = useState('entry') // entry | lobby | race | results
  const [joinInput, setJoinInput] = useState(initialCode ? normalizeJoinCode(initialCode) : '')
  const [state, setState] = useState(null) // server state
  const [offset, setOffset] = useState(0) // server clock minus this device's clock
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadout, setLoadout] = useState({ mutation: false, crispr: false })
  const [selected, setSelected] = useState([])
  const [verdict, setVerdict] = useState(null)
  // The tiles of a wrong answer, marked red (and shaken) for a moment.
  const [wrongTiles, setWrongTiles] = useState([])
  const [notice, setNotice] = useState('')
  const [summary, setSummary] = useState(null)
  const [tick, setTick] = useState(0)
  const [me, setMe] = useState(null)
  // This device's own level (what My Plexus shows), for the lobby card.
  const [myLevel] = useState(() => {
    try {
      return toolKit().level
    } catch {
      return null
    }
  })
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

  // Resume a match after a reload or reconnect. Otherwise a race link
  // (#race=CODE) joins that race's lobby straight away, under the same rules
  // as typing the code.
  const autoJoined = useRef(false)
  useEffect(() => {
    let id = null
    try {
      id = sessionStorage.getItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    // Signed-out players keep their one-tap join step: the code is filled in
    // and they choose to join as a guest (no guest identity is made for them).
    const joinFromLink = () => {
      const c = normalizeJoinCode(initialCode)
      if (autoJoined.current || !isValidJoinCode(c)) return
      autoJoined.current = true
      // Back from signing in: the seat is moved instead (see below).
      if (account && readRaceResume()?.matchId) return
      if (account || isGuestRacing()) join(c)
    }
    if (!id) {
      joinFromLink()
      return
    }
    raceCall('state', { matchId: id }).then((r) => {
      if (r.ok && ['lobby', 'active'].includes(r.match.status) && (!initialCode || r.match.code === normalizeJoinCode(initialCode))) {
        apply(r)
        setMe(r.you || null)
      } else {
        try {
          sessionStorage.removeItem(SESSION_KEY)
        } catch {
          /* ignore */
        }
        joinFromLink()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply])

  const players = state?.players || []
  const mine = players.find((p) => p.user_id === me) || null
  const opp = players.find((p) => p.user_id !== me) || null
  const status = state?.match?.status || null
  const chaos = !!state?.match?.chaos
  const free = !!state?.free_loadout
  const guest = !account
  const hasMut = (p) => !!(p && (p.temp_mutation || p.equip_mutation))
  const hasCrispr = (p) => !!(p && (p.temp_crispr || p.equip_crispr))

  // ---- signing in from Race ----
  // The guest message offers Sign in. The account dialog opens over Race, so
  // the code, the invite and the lobby stay on screen. Once signed in, a guest
  // seat in a lobby moves to the account (the server checks both sessions);
  // a race already under way stays a guest race.
  const [signedInHere, setSignedInHere] = useState(false)
  const [seatNote, setSeatNote] = useState('')
  const signIn = () => {
    saveRaceResume({ code: code || joinInput || normalizeJoinCode(initialCode), matchId })
    onSignIn?.()
  }
  const upgrading = useRef(false)
  const moveSeat = async (id) => {
    if (upgrading.current) return null
    upgrading.current = true
    const r = await upgradeGuestSeat(id)
    upgrading.current = false
    if (r.ok) {
      apply(r)
      setMe(r.you)
      setSeatNote('')
    } else {
      setSeatNote(
        {
          'not-in-lobby': 'You’re signed in. This race already started, so it stays a guest race. Your next race can count.',
          'already-in-match': 'You’re signed in, and your account is already in this race on another device.',
        }[r.reason] || 'You’re signed in, but this lobby couldn’t move to your account. You can keep racing as a guest, or leave and join again.',
      )
    }
    return r
  }
  const wasAccount = useRef(account)
  useEffect(() => {
    if (!account) {
      wasAccount.current = false
      return
    }
    if (wasAccount.current) return
    wasAccount.current = true
    setSignedInHere(true)
    clearRaceResume()
    if (matchId && status === 'lobby' && mine?.guest) moveSeat(matchId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])
  // Back from a sign-in that left the page: pick up the guest seat if this
  // device still has it, otherwise keep the code ready to join.
  useEffect(() => {
    const resume = account ? readRaceResume() : null
    if (!resume) return
    clearRaceResume()
    if (resume.matchId) {
      moveSeat(resume.matchId).then((r) => {
        if (r && !r.ok && resume.code) setJoinInput(normalizeJoinCode(resume.code))
      })
    } else if (resume.code) setJoinInput(normalizeJoinCode(resume.code))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // A guest who signs in moves to the account's session: subscribe again.
  }, [matchId, apply, account])

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
        flash(`Mutation! Letters scrambled for ${MUTATION_SECONDS} seconds.`, 2400)
      }
      if (e.kind === 'mutation' && e.from_user === me) flash('Mutation sent.')
      if (e.kind === 'armed' && e.from_user !== me) flash('Your opponent armed CRISPR.')
    }
  }, [state?.events, me])

  const rounds = useMemo(() => (code ? buildRaceChallenge(bank, { code, length: RACE_LENGTH, canonicalOf: timedCanonicalId }) : []), [bank, code])
  // While an answer's verdict shows, the answered round stays on screen even
  // if a realtime update or poll already moved the match on, so the
  // wrong-answer marking is always seen for its full half second.
  const [heldIdx, setHeldIdx] = useState(null)
  const idx = heldIdx ?? (mine?.answered || 0)
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
      setError(raceJoinError(r.reason) || REJECT[r.reason] || 'Something went wrong. Try again.')
      return r
    }
    return apply(r)
  }
  // Signed-out players get a guest identity on the server first (only when
  // they actually create or join).
  const ensureGuest = async () => {
    if (account || isGuestRacing()) return true
    setBusy(true)
    const g = await startGuestRacing()
    setBusy(false)
    if (!g.ok) {
      onFallback?.()
      return false
    }
    return true
  }
  const create = async () => {
    if (!(await ensureGuest())) return
    const r = await act('create')
    if (r?.ok) setMe(r.players[0].user_id)
  }
  const join = async (fromLink) => {
    const c = normalizeJoinCode(typeof fromLink === 'string' ? fromLink : joinInput)
    if (!isValidJoinCode(c)) return
    if (!(await ensureGuest())) return
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
      setHeldIdx(idx)
      setVerdict(right ? 'correct' : 'incorrect')
      if (!right) setWrongTiles(Array.isArray(answer) ? answer : [answer])
      right ? haptics.correct() : haptics.incorrect()
      // About half a second to register, then the next round. The race clock
      // (the server's) keeps running throughout.
      setTimeout(() => {
        setVerdict(null)
        setWrongTiles([])
        setSelected([])
        setHeldIdx(null)
        apply(r)
        lockRef.current = false
      }, 460)
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
    else flash(REJECT[r.reason] || 'CRISPR could not be armed.')
  }

  // XP on this device (same rules as before), once per match.
  const recorded = useRef({})
  const [raceXp, setRaceXp] = useState(null)
  useEffect(() => {
    if (!matchId || !mine?.finished_at || recorded.current[matchId]) return
    recorded.current[matchId] = true
    setRaceXp(recordRaceFinish({ raceId: matchId, solo: false, answered: mine.answered || 0, correct: mine.correct || 0, runMs: mine.run_ms ?? null, rounds: RACE_LENGTH }))
  }, [matchId, mine?.finished_at])
  useEffect(() => {
    if (!matchId || mine?.outcome !== 'win' || recorded.current[`${matchId}:win`]) return
    recorded.current[`${matchId}:win`] = true
    const w = recordRaceWin({ raceId: matchId })
    // Show the win bonus in the same XP line as the finish.
    setRaceXp((prev) => (prev && w ? { ...prev, gained: prev.gained + w.gained, lines: [...prev.lines, ...w.lines], timedNote: w.timedNote || prev.timedNote, after: w.after, levelUp: prev.levelUp || w.levelUp, grants: [...(prev.grants || []), ...(w.grants || [])], pending: [...(prev.pending || []), ...(w.pending || [])], milestones: [...(prev.milestones || []), ...(w.milestones || [])], counts: w.counts || prev.counts, caps: w.caps || prev.caps } : prev))
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

  // The guest rewards message, with Sign in beside it; after signing in, what
  // the existing reward rules mean for this race.
  const opponentGuest = !!opp?.guest
  const rewardNote = guest ? (
    <div className="race-guest">
      <p className="race-guest-text">You’re racing as a guest. Guest races don’t earn Race rewards.</p>
      {onSignIn && (
        <button type="button" className="race-signin-btn" onClick={signIn}>
          Sign in
        </button>
      )}
    </div>
  ) : seatNote ? (
    <p className="race-note race-signed-note" role="status">
      {seatNote}
    </p>
  ) : (
    <p className={`race-note ${signedInHere ? 'race-signed-note' : ''}`} role={signedInHere ? 'status' : undefined}>
      {signedInHere ? 'You’re signed in. ' : ''}
      {view === 'lobby' && opponentGuest
        ? 'Your opponent is racing as a guest, so this race won’t count toward Race rewards.'
        : view === 'lobby'
          ? 'This race can count toward your Race rewards.'
          : 'Your races can count toward Race rewards.'}
    </p>
  )

  if (view === 'entry' || !state) {
    const invited = isValidJoinCode(initialCode) && !error
    return (
      <div className="race race-entry">
        {header}
        <div className="race-hero">
          <RaceArt />
          <h1 className="race-title">Race</h1>
          <p className="race-lede">Race a friend through the same Plexus, live.</p>
        </div>
        {invited &&
          (busy ? (
            <p className="race-note race-joining" role="status">
              Joining race {normalizeJoinCode(initialCode)}…
            </p>
          ) : (
            <p className="race-note race-invite-note" role="status">
              You’ve been invited to race <b>{normalizeJoinCode(initialCode)}</b>. Tap Join to enter the lobby{account || isGuestRacing() ? '' : ' as a guest'}.
            </p>
          ))}
        <div className="race-panel race-entry-actions">
          <button className="race-primary-btn" onClick={create} disabled={busy}>
            Create a race
          </button>
          <p className="race-or" aria-hidden="true">
            <span>or join with a code</span>
          </p>
          <div className="race-join-row">
            <input className="race-code-input" value={joinInput} onChange={(e) => setJoinInput(normalizeJoinCode(e.target.value))} placeholder="Code" aria-label="Race join code" autoCapitalize="characters" maxLength={4} />
            <button className="race-secondary-btn" onClick={() => join()} disabled={!isValidJoinCode(joinInput) || busy}>
              Join
            </button>
          </div>
        </div>
        {error && <p className="race-error" role="alert">{error}</p>}
        {rewardNote}
        <div className="race-rules">
          <p className="race-scoring">{RACE_SCORING_COPY}</p>
          <TimedXpNote />
        </div>
      </div>
    )
  }

  if (view === 'lobby') {
    const both = players.length === 2
    const canStart = both && (!chaos || players.every((p) => p.chaos_accepted))
    const loadoutText = (p) => (p ? [hasMut(p) ? 'Mutation' : null, hasCrispr(p) ? 'CRISPR' : null].filter(Boolean).join(' + ') || 'nothing equipped' : '')
    const myShownLevel = guest ? null : mine?.level ?? myLevel
    const setType = (on) => {
      if (on !== chaos && !busy) toggleChaos()
    }
    return (
      <div className="race race-lobby">
        {header}
        <div className="race-hero race-hero-small">
          <h1 className="race-title">Race lobby</h1>
        </div>
        <RaceInvite code={code} />
        <div className={`race-players ${opp ? 'is-paired' : ''}`}>
          <div className="race-player race-player-you">
            <div className="race-player-head">
              <PlayerBadge level={myShownLevel} />
              <div className="race-player-text">
                <span className="race-player-name">You{guest ? ' (guest)' : ''}</span>
                {myShownLevel ? <span className="race-player-level">Level {myShownLevel}</span> : null}
                <span className="race-player-status is-ready">{chaos ? (mine?.chaos_accepted ? `Chaos accepted · ${loadoutText(mine)}` : 'Chaos not accepted yet') : 'Ready'}</span>
              </div>
            </div>
          </div>
          <div className="race-player race-player-opp">
            <div className="race-player-head">
              <PlayerBadge level={opp && !opp.guest ? opp.level : null} />
              <div className="race-player-text">
                <span className="race-player-name">Opponent{opp?.guest ? ' (guest)' : ''}</span>
                {opp && !opp.guest && opp.level ? <span className="race-player-level">Level {opp.level}</span> : null}
                <span className={`race-player-status ${opp ? 'is-ready' : 'is-offline'}`}>
                  {!opp ? 'Waiting to join…' : chaos ? (opp.chaos_accepted ? `Chaos accepted · ${loadoutText(opp)}` : 'Chaos not accepted yet') : 'In the lobby'}
                </span>
              </div>
            </div>
          </div>
          <span className="race-players-link" aria-hidden="true">
            <span className="race-players-node" />
          </span>
        </div>

        <section className={`race-panel race-chaos ${chaos ? 'is-on' : ''}`} aria-labelledby="race-type-label">
          <h2 className="race-panel-title" id="race-type-label">
            Race type
          </h2>
          <div className="race-type" role="radiogroup" aria-labelledby="race-type-label">
            <button type="button" role="radio" aria-checked={!chaos} className={`race-type-option ${!chaos ? 'is-active' : ''}`} onClick={() => setType(false)} disabled={busy}>
              Classic
            </button>
            <button type="button" role="radio" aria-checked={chaos} className={`race-type-option ${chaos ? 'is-active' : ''}`} onClick={() => setType(true)} disabled={busy}>
              Chaos
            </button>
          </div>
          {!chaos ? <p className="race-chaos-classic">Classic: no power-ups.</p> : <p className="race-chaos-copy">{free ? CHAOS_COPY_FREE : CHAOS_COPY}</p>}
          {chaos && <PowerupExplainer free={free} />}
          {chaos && free && (
            <div className="race-chaos-loadout">
              <CrisprChoice mine={mine} loadout={loadout} setLoadout={setLoadout} />
              {!mine?.chaos_accepted ? (
                <button className="race-secondary-btn" onClick={acceptChaos} disabled={busy}>
                  Accept Chaos
                </button>
              ) : (
                <p className="race-chaos-head">Accepted. Waiting for {opp?.chaos_accepted ? 'start' : 'your opponent'}.</p>
              )}
            </div>
          )}
          {chaos && !free && (
            <div className="race-chaos-loadout">
              <p className="race-chaos-head">Your loadout (at most one of each, used only in this race)</p>
              <label className={!mine?.has_mutation ? 'is-off' : ''}>
                <input type="checkbox" checked={loadout.mutation} disabled={!mine?.has_mutation || mine?.chaos_accepted} onChange={(e) => setLoadout((l) => ({ ...l, mutation: e.target.checked }))} />
                Mutation {mine?.has_mutation ? '' : '(none earned yet)'}
              </label>
              <CrisprChoice mine={mine} loadout={loadout} setLoadout={setLoadout} />
              {!mine?.chaos_accepted ? (
                <button className="race-secondary-btn" onClick={acceptChaos} disabled={busy}>
                  Accept Chaos
                </button>
              ) : (
                <p className="race-chaos-head">Accepted. Waiting for {opp?.chaos_accepted ? 'start' : 'your opponent'}.</p>
              )}
            </div>
          )}
        </section>
        {error && <p className="race-error" role="alert">{error}</p>}
        {rewardNote}
        <div className="race-start">
          <p className="race-note race-start-note">{!both ? 'Share the code or link. The race starts once your opponent joins.' : chaos && !canStart ? 'Both players must accept Chaos before the race can start. Choose Classic to race without power-ups.' : 'Either of you can start. It begins the race for both.'}</p>
          <button className="race-primary-btn" onClick={start} disabled={!canStart || busy}>
            Start race
          </button>
        </div>
        <div className="race-rules">
          <p className="race-scoring">{RACE_SCORING_COPY}</p>
        </div>
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
    if (!round) return <div className="race"><p className="race-note">Getting the round ready…</p></div>
    const isRapid = round.type === 'rapidAssociation'
    // Mutation: the answer tiles only, a fixed scrambled rendering until the
    // effect's stored end, then exactly the original text.
    const label = (text) => (effect ? scrambleLabel(text, effect.seed) : text)
    const effectLeft = effect ? Math.max(1, Math.ceil((effect.endsAt - nowServer()) / 1000)) : 0
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
            {hasMut(mine) && (
              <button className="race-powerup" onClick={attack} disabled={mine.mutation_spent || !opp || !!opp.finished_at}>
                {mine.mutation_spent ? 'Mutation spent' : 'Send Mutation'}
              </button>
            )}
            {hasCrispr(mine) && (
              <button className="race-powerup" onClick={arm} disabled={mine.crispr_armed || mine.crispr_spent}>
                {mine.crispr_spent ? 'CRISPR spent' : mine.crispr_armed ? 'CRISPR armed' : 'Arm CRISPR'}
              </button>
            )}
            <span className="race-powerup-opp">
              Opponent: {opp?.crispr_spent ? 'CRISPR spent' : opp?.crispr_armed ? 'CRISPR armed' : hasCrispr(opp) ? 'CRISPR ready' : 'no CRISPR'}
              {hasMut(opp) ? (opp.mutation_spent ? ' · Mutation spent' : ' · Mutation ready') : ''}
            </span>
          </div>
        )}
        {effect && (
          <p className="race-mutation-banner" aria-live="off">
            <span className="race-mutation-dot" aria-hidden="true" />
            Mutation: letters scrambled · {effectLeft}s
          </p>
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
                  className={`race-option ${isSel ? 'is-selected' : ''} ${wrongTiles.includes(opt.text) ? 'is-wrong-tile' : ''}`}
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
                  <TileText>{label(opt.text)}</TileText>
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
      <TimedResultLine result={raceXp} kind="Race" />
          <RewardMoments result={raceXp} />
      {outcome && outcome !== 'abandoned' && (
        <div className={`race-outcome race-outcome-${outcome}`}>{outcome === 'win' ? 'You win!' : outcome === 'lose' ? 'You lost' : 'It’s a tie'}</div>
      )}
      {chaos && <p className="race-note">Chaos race. Results are kept apart from standard races.{free ? ' This race’s power-ups have ended.' : ''}</p>}
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
      {prog && !guest && (
        <p className="race-note race-reward-progress">
          Mutation: {prog.qualifyingWins % RACE_REWARDS.mutationEveryWins}/{RACE_REWARDS.mutationEveryWins} qualifying wins · CRISPR:{' '}
          {summary?.crisprUnlocked
            ? `next at Level ${nextCrisprLevel(summary.level)}, ${Math.round((summary.crisprDropChance ?? RACE_REWARDS.crisprDropChance) * 100)}% chance after each counted win`
            : summary?.level >= CRISPR_UNLOCK_LEVEL
              ? `unlocks after ${summary.crisprUnlockRaces ?? RACE_REWARDS.crisprUnlockRaces} counted races (${summary.countedRaces ?? 0} so far)`
              : `unlocks at Level ${CRISPR_UNLOCK_LEVEL}`}
        </p>
      )}
      {log?.granted?.some((g) => g.source === 'drop') && (
        <div className="race-drop has-reveal" role="status">
          <ToolReveal item="crispr" width={144} delay={0.5} />
          <p>
            <b>Rare find: CRISPR.</b> A {Math.round((summary?.crisprDropChance ?? RACE_REWARDS.crisprDropChance) * 100)}% chance after a counted win, and this one landed.
            {log.granted.some((g) => g.source === 'drop' && g.as === 'pending') ? ' Your CRISPR slots are full, so it waits as a claim in Your Tools.' : ' It is in Your Tools.'}
          </p>
        </div>
      )}
      {log?.granted?.some((g) => g.source !== 'drop') && (
        <p className="race-note race-earned-reveal">
          {log.granted.some((g) => g.source !== 'drop' && g.item === 'mutation') && <ToolReveal item="mutation" width={56} delay={0.3} />}
          Earned:{' '}
          {log.granted
            .filter((g) => g.source !== 'drop')
            .map((g) => `${g.item === 'mutation' ? 'Mutation' : 'CRISPR'}${g.as === 'pending' ? ' (inventory full, waiting as a claim)' : ''}`)
            .join(', ')}
        </p>
      )}
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

// The CRISPR line of a Chaos loadout: equippable only at Level 12 and above
// with an earned charge; otherwise it says what is needed (the server checks
// the same rule when the loadout is accepted).
function CrisprChoice({ mine, loadout, setLoadout }) {
  const unlocked = !!mine?.crispr_unlocked
  const can = unlocked && !!mine?.has_crispr
  return (
    <label className={`race-crispr-choice ${can ? '' : 'is-off'}`}>
      <input type="checkbox" checked={can && loadout.crispr} disabled={!can || mine?.chaos_accepted} onChange={(e) => setLoadout((l) => ({ ...l, crispr: e.target.checked }))} />
      CRISPR{' '}
      {!unlocked ? (
        <span className="race-lock-note">(unlocks at Level {CRISPR_UNLOCK_LEVEL} after {RACE_REWARDS.crisprUnlockRaces} counted races)</span>
      ) : !mine?.has_crispr ? (
        <span className="race-lock-note">(none held)</span>
      ) : null}
    </label>
  )
}
