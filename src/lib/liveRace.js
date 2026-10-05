// ---------------------------------------------------------------------
// Live Race channel — real two-player head-to-head over Supabase Realtime
// ---------------------------------------------------------------------
// This uses Supabase Realtime BROADCAST + PRESENCE, which work with just the
// anon key over an ephemeral channel — no database tables, no migration, and
// no sign-in required. Two players who open the same join code land on the same
// channel ("plexus-race-<CODE>") and exchange:
//   • presence  → who is in the lobby (online / name)
//   • "start"   → one tap starts the countdown for BOTH players
//   • "progress"→ live {correct, answered, finished} as each person plays
//   • "finish"  → final {correct, total, timeMs} to decide the winner
//
// It NEVER fabricates an opponent: with no second client on the channel,
// presence simply reports nobody, and Race Mode stays an honest solo run.
// Progress payloads carry only aggregate counts — never which specific
// questions were answered — matching the product rule.
//
// Falls back to null when Supabase is not configured, so the caller runs the
// existing offline seeded race unchanged.

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'

export { isSupabaseConfigured }

// A fresh id per tab/session. Two tabs on one machine therefore read as two
// players — which is exactly what you want for testing a live race solo.
function makeClientId() {
  return 'p-' + Math.random().toString(36).slice(2, 10)
}

export async function openLiveRace(code, { name, onPresence, onStart, onProgress, onFinish } = {}) {
  const sb = await getSupabase()
  if (!sb) return null // not configured → caller falls back to solo

  const id = makeClientId()
  const channel = sb.channel(`plexus-race-${code}`, {
    config: {
      presence: { key: id },
      broadcast: { self: false }, // don't echo our own messages back to us
    },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      onPresence?.(channel.presenceState(), id)
    })
    .on('broadcast', { event: 'start' }, ({ payload }) => {
      onStart?.(payload || {})
    })
    .on('broadcast', { event: 'progress' }, ({ payload }) => {
      if (payload && payload.id !== id) onProgress?.(payload)
    })
    .on('broadcast', { event: 'finish' }, ({ payload }) => {
      if (payload && payload.id !== id) onFinish?.(payload)
    })

  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ id, name: name || 'Player', at: Date.now() })
    }
  })

  const send = (event, payload) => {
    try {
      channel.send({ type: 'broadcast', event, payload: { id, ...payload } })
    } catch {
      /* channel may be closing — ignore */
    }
  }

  return {
    id,
    sendStart: (payload = {}) => send('start', payload),
    sendProgress: (payload) => send('progress', payload),
    sendFinish: (payload) => send('finish', payload),
    leave: () => {
      try {
        sb.removeChannel(channel)
      } catch {
        /* ignore */
      }
    },
  }
}
