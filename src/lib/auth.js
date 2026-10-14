// ---------------------------------------------------------------------
// Supabase Auth (optional) — magic link / email+password, with guest play
// ---------------------------------------------------------------------
// Auth is NOT required to play Plexus. Today (and whenever Supabase is not
// configured) every function here is a safe no-op and the app plays as a guest
// on localStorage, exactly as before. Once Supabase is configured, these back
// the account/profile/cloud-progress features. Nothing here forces a login.

import { getSupabase, getGuestSupabase, isSupabaseConfigured } from './supabaseClient.js'
import { TERMS_VERSION, PRIVACY_VERSION } from '../legal/config.js'

export { isSupabaseConfigured }

// Sign in / up ------------------------------------------------------------
export async function signInWithMagicLink(email, redirectTo) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined) },
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signInWithPassword(email, password) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  return error ? { ok: false, error: error.message } : { ok: true, user: data.user }
}

// Sign-up sends the Terms and Privacy Policy versions the player agreed to
// and acknowledged next to the button; the database records them with the
// server's time when the account is created (migration 0012). No name is
// asked for or derived.
export async function signUpWithPassword(email, password) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION } },
  })
  return error ? { ok: false, error: error.message } : { ok: true, user: data.user }
}

// Password recovery ---------------------------------------------------------
// Sends Supabase's reset email. The link returns to this site, signs the
// player in for the reset, and the Account panel asks for a new password
// (lib/authRedirect.js). The reply never says whether the email has an
// account.
export async function requestPasswordReset(email) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo })
  return error ? { ok: false, error: error.message, status: error.status } : { ok: true }
}

// Sets a new password for the player signed in by a reset link.
export async function updatePassword(password) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data } = await sb.auth.getSession()
  if (!data?.session) return { ok: false, reason: 'no-session' }
  const { error } = await sb.auth.updateUser({ password })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signOut() {
  const sb = await getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}

// Session / profile -------------------------------------------------------
export async function getCurrentUser() {
  const sb = await getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

// Subscribe to auth changes; returns an unsubscribe function (no-op when off).
export function onAuthChange(cb) {
  let sub = null
  getSupabase().then((sb) => {
    if (!sb) return
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user || null))
    sub = data?.subscription || null
  })
  return () => {
    try {
      sub?.unsubscribe()
    } catch {
      /* ignore */
    }
  }
}

// Ensure a profile row exists for the signed-in user (the DB trigger also does
// this; this is a safe client-side backstop and lets us set a username).
export async function ensureProfile(fields = {}) {
  const sb = await getSupabase()
  if (!sb) return null
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return null
  const { data, error } = await sb
    .from('profiles')
    .upsert({ id: user.id, ...fields }, { onConflict: 'id' })
    .select()
    .single()
  return error ? null : data
}

export async function getProfile() {
  const sb = await getSupabase()
  if (!sb) return null
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return null
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single()
  return data || null
}

export async function isAdmin() {
  const p = await getProfile()
  return Boolean(p?.is_admin)
}

// Account deletion ----------------------------------------------------------
// Deletes the signed-in player's account and, through the database's cascade
// rules, their profile and cloud progress (supabase/migrations/0004). Runs as
// the player, so no service-role key is involved. Returns
// { ok } | { ok: false, reason: 'not-configured' | 'guest' | 'unavailable', error }
export async function deleteMyAccount() {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data: userData } = await sb.auth.getUser()
  if (!userData?.user) return { ok: false, reason: 'guest' }
  const { error } = await sb.rpc('delete_my_account')
  if (error) {
    // The function is missing until migration 0004 has been run.
    const missing = /delete_my_account|function|schema cache|not find/i.test(error.message || '')
    return { ok: false, reason: missing ? 'unavailable' : 'error', error: error.message }
  }
  try {
    await sb.auth.signOut()
  } catch {
    /* the session is already invalid once the user is gone */
  }
  return { ok: true }
}

// Policy acceptance ---------------------------------------------------------
// The latest Terms and Privacy versions this account accepted, or null.
export async function getMyAcceptance() {
  const sb = await getSupabase()
  if (!sb) return null
  try {
    const { data: u } = await sb.auth.getUser()
    if (!u?.user || u.user.is_anonymous) return null
    const { data, error } = await sb.rpc('my_terms_acceptance')
    return error ? null : data || null
  } catch {
    return null
  }
}
// Records that the signed-in account accepted the current versions.
export async function recordAcceptance() {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  try {
    const { data, error } = await sb.rpc('record_terms_acceptance', { p_terms_version: TERMS_VERSION, p_privacy_version: PRIVACY_VERSION })
    return error ? { ok: false, error: error.message } : data || { ok: false }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

// Guest race ID --------------------------------------------------------------
// A signed-out player who raced has an anonymous race ID (supabaseClient.js
// getGuestSupabase). True when this browser holds one.
export function hasGuestRaceId() {
  try {
    return !!localStorage.getItem('plexus.race.guest.v1')
  } catch {
    return false
  }
}
// Deletes the guest race ID and its race rows on the server (the same
// delete_my_account function, run as the guest), then forgets it here.
// { ok } | { ok: false, reason }
export async function deleteGuestRaceId() {
  if (!hasGuestRaceId()) return { ok: true, none: true }
  const sb = await getGuestSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  try {
    const { data } = await sb.auth.getSession()
    if (data?.session) {
      const { error } = await sb.rpc('delete_my_account')
      if (error && !/not signed in|JWT|jwt|user/i.test(error.message || '')) return { ok: false, reason: 'error', error: error.message }
    }
    try {
      await sb.auth.signOut()
    } catch {
      /* already gone */
    }
    try {
      localStorage.removeItem('plexus.race.guest.v1')
      sessionStorage.removeItem('plexus.race.guestChosen.v1')
    } catch {
      /* ignore */
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: 'network', error: String(e?.message || e) }
  }
}
