// ---------------------------------------------------------------------
// Race server client: trusted matches, rewards and power-ups
// ---------------------------------------------------------------------
// Every action that matters (creating and joining a match, answers, Chaos
// consent and loadouts, arming CRISPR, Mutation attacks) goes to the server
// endpoint api/race.js with the player's Supabase session token. The server
// scores answers, decides results, applies rewards and spends items inside
// database transactions; the browser never decides any of that.
//
// Match updates arrive two ways: Supabase Realtime (row changes on the match,
// its players and its events, filtered by RLS to participants) and a light
// poll of the same server state as a fallback, so a missed realtime message or
// a reconnect never leaves a player out of date.
import { getSupabase, getGuestSupabase, isSupabaseConfigured } from './supabaseClient.js'

const ENDPOINT = '/api/race'

// Which session races: the player's account when signed in; otherwise a
// guest session, but only after the player chose "Race as a guest" (so no
// anonymous account is created just by opening Race).
let guestChosen = false
try {
  guestChosen = sessionStorage.getItem('plexus.race.guestChosen.v1') === '1'
} catch {
  /* ignore */
}
async function accountToken() {
  const sb = await getSupabase()
  if (!sb) return null
  try {
    const { data } = await sb.auth.getSession()
    const s = data?.session
    return s && !s.user?.is_anonymous ? s.access_token : null
  } catch {
    return null
  }
}
async function guestToken({ create = false } = {}) {
  const sb = await getGuestSupabase()
  if (!sb) return null
  try {
    const { data } = await sb.auth.getSession()
    if (data?.session?.access_token) return data.session.access_token
    if (!create || typeof sb.auth.signInAnonymously !== 'function') return null
    const { data: d2, error } = await sb.auth.signInAnonymously()
    if (error) return null
    return d2?.session?.access_token || null
  } catch {
    return null
  }
}
async function token() {
  const t = await accountToken()
  if (t) return { token: t, guest: false }
  if (!guestChosen) return null
  const g = await guestToken()
  return g ? { token: g, guest: true } : null
}
// Signed-out player taps "Race as a guest". Resolves { ok } or { ok: false, reason }.
export async function startGuestRacing() {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not-configured' }
  const g = await guestToken({ create: true })
  if (!g) return { ok: false, reason: 'guest-unavailable' }
  guestChosen = true
  try {
    sessionStorage.setItem('plexus.race.guestChosen.v1', '1')
  } catch {
    /* ignore */
  }
  return { ok: true }
}
export function isGuestRacing() {
  return guestChosen
}

// Calls the race endpoint. Resolves { ok: true, ...data } or
// { ok: false, error, reason }. Never throws.
export async function raceCall(action, payload = {}) {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not-configured' }
  const who = await token()
  if (!who && action !== 'config') return { ok: false, reason: 'signed-out' }
  const t = who?.token || ''
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(t ? { authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ action, ...payload }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body.ok === false) return { ok: false, error: body.error || `HTTP ${res.status}`, reason: body.reason || 'server' }
    return { ok: true, ...body }
  } catch (e) {
    return { ok: false, error: String(e?.message || e), reason: 'network' }
  }
}

// The signed-in player's race inventory and reward progress, or null.
export async function getRaceSummary() {
  const r = await raceCall('me')
  return r.ok ? r : null
}

// Realtime: any change to this match's rows. Returns an unsubscribe function.
export async function subscribeMatch(matchId, onChange) {
  const who = await token()
  const sb = who?.guest ? await getGuestSupabase() : await getSupabase()
  if (!sb || !matchId) return () => {}
  const ch = sb.channel(`race-match-${matchId}`)
  for (const table of ['race_matches', 'race_participants', 'race_events']) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: table === 'race_matches' ? `id=eq.${matchId}` : `match_id=eq.${matchId}` }, (payload) => onChange?.(table, payload))
  }
  ch.subscribe()
  return () => {
    try {
      sb.removeChannel(ch)
    } catch {
      /* ignore */
    }
  }
}

// Is there a real account session (not a guest)?
export async function hasAccountSession() {
  return Boolean(await accountToken())
}
