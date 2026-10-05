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

// Write the given snapshot to the signed-in user's cloud row (upsert).
export async function pushProgress(snapshot) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const user = await currentUser(sb)
  if (!user) return { ok: false, reason: 'guest' }
  const { error } = await sb
    .from('user_progress')
    .upsert({ user_id: user.id, data: snapshot, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  return error ? { ok: false, error: error.message } : { ok: true }
}

// Full two-way sync: pull cloud, merge with local (monotonic — never loses
// progress), write the merged result BOTH to localStorage and back to the
// cloud, and return it so the UI can refresh. Safe no-op (returns null) when
// not configured or signed out.
export async function syncProgress() {
  const sb = await getSupabase()
  if (!sb) return null
  const user = await currentUser(sb)
  if (!user) return null

  const local = snapshotLocal()
  let cloud = null
  try {
    const { data } = await sb.from('user_progress').select('data').eq('user_id', user.id).maybeSingle()
    cloud = data?.data || null
  } catch {
    cloud = null
  }

  const merged = mergeSnapshots(local, cloud || {})
  applySnapshot(merged)
  await pushProgress(merged)
  return merged
}
