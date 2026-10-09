// ---------------------------------------------------------------------
// Race server logic (runs only on the server, inside api/race.js)
// ---------------------------------------------------------------------
// Verifies the caller's Supabase session, scores answers by rebuilding the
// round from the race code with the same engine and timed library the app
// uses, and hands every state change to the database functions in migration
// 0006, which apply it atomically under a lock. Nothing the browser sends is
// trusted as a result: it sends which option it picked, never whether it was
// right, and never a score or a winner.
//
// Pure module: database and auth are injected ({ rpc, getUser }), so it is
// tested directly (scripts/race-server-test.mjs) without a network.
import { buildRaceChallenge, makeJoinCode, normalizeJoinCode, isValidJoinCode, RACE_LENGTH } from '../src/utils/raceEngine.js'
import { timedBank, timedCanonicalId } from '../src/utils/timedLibrary.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ACTIONS = new Set(['config', 'me', 'create', 'join', 'state', 'chaos', 'accept', 'start', 'answer', 'heartbeat', 'leave', 'arm', 'attack', 'rematch'])

// Rounds for a code, built once per server instance.
const roundsCache = new Map()
export function roundsFor(code) {
  const c = normalizeJoinCode(code)
  if (!roundsCache.has(c)) roundsCache.set(c, buildRaceChallenge(timedBank, { code: c, length: RACE_LENGTH, canonicalOf: timedCanonicalId }))
  return roundsCache.get(c)
}

// Is `answer` right for this round? Single-answer rounds take the option
// text; Rapid Association takes the four chosen texts (any order).
export function scoreAnswer(round, answer) {
  if (!round) return null
  if (round.type === 'rapidAssociation') {
    if (!Array.isArray(answer) || answer.length !== 4 || new Set(answer).size !== 4) return false
    const want = new Set(round.correctAnswers)
    return answer.every((t) => want.has(t))
  }
  if (typeof answer !== 'string') return false
  return answer === round.correctAnswer
}

const tzOf = (body) => (typeof body.tz === 'string' && body.tz.length <= 64 ? body.tz : 'UTC')
const bad = (reason, status = 400) => ({ status, json: { ok: false, reason } })
const fromDb = (data) => (data && data.ok === false ? { status: 409, json: data } : { status: 200, json: data })

export async function handleRace({ token, body }, { rpc, getUser, makeCode = makeJoinCode }) {
  if (!body || typeof body !== 'object' || !ACTIONS.has(body.action)) return bad('bad-action')
  // Public: lets a signed-out device know the race server is up (so it can
  // offer guest racing). Reveals nothing about players or matches.
  if (body.action === 'config') return { status: 200, json: { ok: true, rounds: RACE_LENGTH, guests: true } }
  if (!token) return bad('signed-out', 401)
  const user = await getUser(token).catch(() => null)
  if (!user || !user.id) return bad('signed-out', 401)
  const u = user.id
  // Guests race with an anonymous Supabase session (a real, verified server
  // identity). They can play Classic and Chaos with the introductory loadout,
  // but never earn Race rewards: the database marks their seat as guest.
  const guest = user.is_anonymous === true
  const a = body.action
  const matchId = body.matchId
  if (!['config', 'me', 'create', 'join'].includes(a) && !UUID.test(String(matchId || ''))) return bad('bad-match')

  try {
    const out = await dispatch()
    if (out.status === 200 && out.json && typeof out.json === 'object') {
      out.json.you = u
      out.json.guest = guest
    }
    return out
  } catch (e) {
    return { status: 500, json: { ok: false, reason: 'server', error: String(e?.message || e).slice(0, 200) } }
  }

  async function dispatch() {
    switch (a) {
      case 'config':
        return { status: 200, json: { ok: true, rounds: RACE_LENGTH } }
      case 'me':
        if (guest) return { status: 200, json: { ok: true, guest: true, inventory: { mutation: 0, crispr: 0 }, pending: { mutation: 0, crispr: 0 }, progress: null, today: null } }
        return fromDb(await rpc('race_me', { p_user: u, p_tz: tzOf(body) }))
      case 'create': {
        // A fresh code; retry a few times if it is already in use.
        for (let i = 0; i < 8; i++) {
          const code = makeCode()
          const r = await rpc('race_create', { p_user: u, p_code: code, p_tz: tzOf(body), p_guest: guest })
          if (r && r.ok === false && r.reason === 'code-taken') continue
          return fromDb(r)
        }
        return bad('busy', 503)
      }
      case 'join': {
        const code = normalizeJoinCode(body.code)
        if (!isValidJoinCode(code)) return bad('bad-code')
        return fromDb(await rpc('race_join', { p_user: u, p_code: code, p_tz: tzOf(body), p_guest: guest }))
      }
      case 'state':
        return fromDb(await rpc('race_state', { p_user: u, p_match: matchId }))
      case 'chaos':
        return fromDb(await rpc('race_set_chaos', { p_user: u, p_match: matchId, p_on: body.on === true }))
      case 'accept':
        return fromDb(await rpc('race_accept_chaos', { p_user: u, p_match: matchId, p_mutation: body.mutation === true, p_crispr: body.crispr === true }))
      case 'start':
        return fromDb(await rpc('race_start', { p_user: u, p_match: matchId }))
      case 'answer': {
        const round = Number(body.round)
        if (!Number.isInteger(round) || round < 0 || round >= RACE_LENGTH) return bad('bad-round')
        const st = await rpc('race_state', { p_user: u, p_match: matchId })
        if (!st || st.ok === false) return fromDb(st)
        const rounds = roundsFor(st.match.code)
        const correct = scoreAnswer(rounds[round], body.answer)
        if (correct === null) return bad('bad-round')
        const r = await rpc('race_answer', { p_user: u, p_match: matchId, p_round: round, p_correct: correct })
        if (r && r.ok !== false) r.lastAnswer = { round, correct }
        return fromDb(r)
      }
      case 'rematch': {
        for (let i = 0; i < 8; i++) {
          const r = await rpc('race_rematch', { p_user: u, p_match: matchId, p_code: makeCode(), p_tz: tzOf(body), p_guest: guest })
          if (r && r.ok === false && r.reason === 'code-taken') continue
          return fromDb(r)
        }
        return bad('busy', 503)
      }
      case 'heartbeat':
        return fromDb(await rpc('race_heartbeat', { p_user: u, p_match: matchId }))
      case 'leave':
        return fromDb(await rpc('race_leave', { p_user: u, p_match: matchId }))
      case 'arm':
        return fromDb(await rpc('race_arm', { p_user: u, p_match: matchId }))
      case 'attack':
        return fromDb(await rpc('race_attack', { p_user: u, p_match: matchId }))
      default:
        return bad('bad-action')
    }
  }
}
