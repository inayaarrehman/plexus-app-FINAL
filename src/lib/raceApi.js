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
import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'

const ENDPOINT = '/api/race'

async function token() {
  const sb = await getSupabase()
  if (!sb) return null
  try {
    const { data } = await sb.auth.getSession()
    return data?.session?.access_token || null
  } catch {
    return null
  }
}

// Calls the race endpoint. Resolves { ok: true, ...data } or
// { ok: false, error, reason }. Never throws.
export async function raceCall(action, payload = {}) {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not-configured' }
  const t = await token()
  if (!t) return { ok: false, reason: 'signed-out' }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${t}` },
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
  const sb = await getSupabase()
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
