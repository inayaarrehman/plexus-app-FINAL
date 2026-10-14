// ---------------------------------------------------------------------
// Progress repository — cloud save/restore of a player's progress
// ---------------------------------------------------------------------
// Stores one row per user in `user_progress (user_id, data jsonb, updated_at)`
// (see supabase/migrations/0003_profiles_progress.sql), guarded by RLS so a
// user can only read/write their own row. The `data` blob is the merged
// snapshot from utils/progressSync.js (stats + dailyHistory + challenge).
//
// Everything degrades safely: not configured, or signed out → no-op / null, and
// the app keeps using localStorage exactly as before (guest play unchanged).

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'
import { snapshotLocal, applySnapshot, mergeSnapshots } from '../utils/progressSync.js'
import { snapshotInEpoch } from '../utils/contentEpoch.js'

export { isSupabaseConfigured }

async function currentUser(sb) {
  try {
    const { data } = await sb.auth.getUser()
    return data?.user || null
  } catch {
    return null
  }
}

// Read the signed-in user's cloud snapshot, or null if none / not available.
export async function pullProgress() {
  const sb = await getSupabase()
  if (!sb) return null
  const user = await currentUser(sb)
  if (!user) return null
  const { data, error } = await sb.from('user_progress').select('data').eq('user_id', user.id).maybeSingle()
  if (error) return null
  return data?.data || null
}

// Write progress to the signed-in user's cloud row without losing anything
// another device wrote meanwhile: read the row, merge (every merge is
// monotonic and keyed by id, so nothing is counted twice), and write back
// only if the row has not changed since it was read; otherwise read and
// merge again. The merged result is also written locally, so this device
// picks up the other device's progress too.
export async function mergeWrite(sb, userId, local) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: row, error: readErr } = await sb.from('user_progress').select('data, updated_at').eq('user_id', userId).maybeSingle()
    if (readErr) return { ok: false, error: readErr.message }
    const cloud = row?.data || null
    // A cloud save from before a library rebuild (another content epoch) is
    // set aside: its dates and board ids now point at different puzzles.
    const merged = mergeSnapshots(local, snapshotInEpoch(cloud) ? cloud : {})
    const now = new Date().toISOString()
    if (!row) {
      const { error } = await sb.from('user_progress').insert({ user_id: userId, data: merged, updated_at: now })
      if (!error) return { ok: true, merged }
      continue // another device created the row first: merge with it
    }
    const { data: done, error } = await sb.from('user_progress').update({ data: merged, updated_at: now }).eq('user_id', userId).eq('updated_at', row.updated_at).select('user_id')
    if (error) return { ok: false, error: error.message }
    if (done && done.length) return { ok: true, merged }
    // Changed since it was read: try again with the newer copy.
  }
  return { ok: false, error: 'busy' }
}

export async function pushProgress(snapshot = snapshotLocal()) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const user = await currentUser(sb)
  if (!user) return { ok: false, reason: 'guest' }
  const r = await mergeWrite(sb, user.id, snapshot)
  if (r.ok && r.merged) applySnapshot(r.merged)
  return r.ok ? { ok: true } : { ok: false, error: r.error }
}

// Full two-way sync: merge local and cloud (monotonic, never loses
// progress), write the result to both, and return it so the UI can refresh.
// Safe no-op (returns null) when not configured or signed out.
export async function syncProgress() {
  const sb = await getSupabase()
  if (!sb) return null
  const user = await currentUser(sb)
  if (!user) return null
  const r = await mergeWrite(sb, user.id, snapshotLocal())
  if (!r.ok || !r.merged) return null
  applySnapshot(r.merged)
  return r.merged
}
