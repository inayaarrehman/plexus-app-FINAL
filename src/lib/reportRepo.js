// ---------------------------------------------------------------------
// Reports and support messages.
// ---------------------------------------------------------------------
// Sent to Supabase through the `submit_report` database function (migration
// 0005_reports.sql). The function validates every field, rate-limits, and
// writes to a table nobody can read through the public API: only the project
// owner, in the Supabase dashboard, sees reports. Uses the public anon key
// like the rest of the app; no private key is ever in the browser.
//
// submitReport() resolves to { ok: true } only when the database confirmed
// the insert. Anything else is { ok: false, reason, message }, and the form
// keeps what the player typed.

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'

export const REPORT_REASONS = [
  { id: 'medical', label: 'Medical accuracy' },
  { id: 'ambiguous', label: 'Ambiguous connection' },
  { id: 'typo', label: 'Typo' },
  { id: 'technical', label: 'Technical problem' },
  { id: 'other', label: 'Other' },
]
export const SUPPORT_TOPICS = [
  { id: 'technical', label: 'Technical problem' },
  { id: 'account', label: 'Account or progress' },
  { id: 'feedback', label: 'Feedback or idea' },
  { id: 'other', label: 'Something else' },
]
export const LIMITS = { description: 2000, email: 254, minDescription: 5 }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CLIENT_KEY = 'plexus.reportClient.v1'
const RECENT_KEY = 'plexus.reportRecent.v1'
const LOCAL_LIMIT = 5 // per 10 minutes on this device (the server enforces its own)

// The app version, set at build time (vite.config.js), when available.
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null // eslint-disable-line no-undef

// A random id for this browser, so the server can rate-limit without knowing
// who anyone is. Not linked to anything else.
function clientId() {
  try {
    let id = localStorage.getItem(CLIENT_KEY)
    if (!id) {
      id = (crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`).slice(0, 64)
      localStorage.setItem(CLIENT_KEY, id)
    }
    return id
  } catch {
    return 'no-storage'
  }
}
function recentCount(now) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter((t) => now - t < 10 * 60000)
    return list
  } catch {
    return []
  }
}
function noteSent(now) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([...recentCount(now), now].slice(-20)))
  } catch {
    // ignore
  }
}

// Field checks shared by the forms and submitReport. Returns a message or null.
export function validateReport({ kind, reason, description, email }) {
  const reasons = (kind === 'support' ? SUPPORT_TOPICS : REPORT_REASONS).map((r) => r.id)
  if (!reasons.includes(reason)) return kind === 'support' ? 'Choose a topic.' : 'Choose a reason.'
  const text = String(description || '').trim()
  if (text.length < LIMITS.minDescription) return 'Add a few words about what you noticed.'
  if (text.length > LIMITS.description) return `Keep it under ${LIMITS.description} characters.`
  const mail = String(email || '').trim()
  if (mail && (mail.length > LIMITS.email || !EMAIL_RE.test(mail))) return 'That email address does not look right.'
  return null
}

export function reportsAvailable() {
  return isSupabaseConfigured()
}

// payload: { kind: 'connection' | 'support', reason, description, email,
//            context?: { puzzleId, categoryId, title, tiles, mode, puzzleDate },
//            honeypot? }
export async function submitReport(payload, { now = Date.now() } = {}) {
  const problem = validateReport(payload)
  if (problem) return { ok: false, reason: 'invalid', message: problem }
  if (payload.honeypot) return { ok: false, reason: 'invalid', message: 'Could not send this report.' }
  if (recentCount(now).length >= LOCAL_LIMIT) return { ok: false, reason: 'rate', message: 'Too many reports from this device. Try again in a few minutes.' }
  let sb = null
  try {
    sb = await getSupabase()
  } catch {
    sb = null
  }
  if (!sb) return { ok: false, reason: 'unavailable', message: 'Reports can’t be sent right now. Check your connection and try again.' }
  const c = payload.context || {}
  const args = {
    p_kind: payload.kind === 'support' ? 'support' : 'connection',
    p_reason: payload.reason,
    p_description: String(payload.description).trim(),
    p_contact_email: String(payload.email || '').trim() || null,
    p_puzzle_id: c.puzzleId || null,
    p_category_id: c.categoryId || null,
    p_connection_title: c.title || null,
    p_tiles: Array.isArray(c.tiles) ? c.tiles.slice(0, 8).map(String) : null,
    p_game_mode: c.mode || null,
    p_puzzle_date: c.puzzleDate || null,
    p_app_version: APP_VERSION,
    p_client_id: clientId(),
  }
  try {
    const { data, error } = await sb.rpc('submit_report', args)
    if (error || !data) {
      const rate = /rate|too many/i.test(error?.message || '')
      return {
        ok: false,
        reason: rate ? 'rate' : 'server',
        message: rate ? 'Too many reports right now. Try again in a few minutes.' : 'Your report didn’t go through. Your text is still here, so try again.',
      }
    }
    noteSent(now)
    return { ok: true, id: data }
  } catch {
    return { ok: false, reason: 'network', message: 'Your report didn’t go through. Your text is still here, so try again.' }
  }
}
