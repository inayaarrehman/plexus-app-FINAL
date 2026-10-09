// ---------------------------------------------------------------------
// Player-suggested connections ("Submit a Connection" on Systems).
// ---------------------------------------------------------------------
// Sent to Supabase through the `submit_connection` database function
// (migration 0008). The function validates every field, refuses duplicates
// (the same four concepts in any order), rate-limits, and writes to a review
// queue nobody can read through the public API. Nothing submitted here is
// ever served as a puzzle: a suggestion reaches the library only after a
// person reviews it and adds it through the normal library import.
// No XP is awarded for suggestions.
import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'
import { APP_VERSION } from './reportRepo.js'
import { LIBRARY_SUBJECTS, subjectLabel } from '../utils/newLibrary.js'

export const SUBMISSION_LIMITS = { title: 120, minTitle: 3, tile: 80, explanation: 1500, minExplanation: 20, source: 500 }
export const SUBMISSION_SYSTEMS = [...LIBRARY_SUBJECTS.map((id) => ({ id, label: subjectLabel(id) })), { id: 'Other', label: 'Other or several systems' }]

const CLIENT_KEY = 'plexus.reportClient.v1' // the same random browser id reports use
const SENT_KEY = 'plexus.submissionsSent.v1'

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()
export const fingerprintOf = (tiles) => tiles.map((t) => clean(t).toLowerCase()).sort().join('|')

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
function sentPrints() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '[]')
  } catch {
    return []
  }
}
function noteSent(print) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify([...sentPrints(), print].slice(-50)))
  } catch {
    // ignore
  }
}

export const submissionsAvailable = () => isSupabaseConfigured()

// Field checks shared by the form and submitConnection. Returns { field, message } or null.
export function validateSubmission({ title, tiles, explanation, system, source }) {
  const t = clean(title)
  if (t.length < SUBMISSION_LIMITS.minTitle) return { field: 'title', message: 'Give the connection a title.' }
  if (t.length > SUBMISSION_LIMITS.title) return { field: 'title', message: `Keep the title under ${SUBMISSION_LIMITS.title} characters.` }
  const list = (tiles || []).map(clean)
  if (list.length !== 4 || list.some((x) => !x)) return { field: 'tiles', message: 'Add all four concepts.' }
  if (list.some((x) => x.length > SUBMISSION_LIMITS.tile)) return { field: 'tiles', message: `Keep each concept under ${SUBMISSION_LIMITS.tile} characters.` }
  if (new Set(list.map((x) => x.toLowerCase())).size !== 4) return { field: 'tiles', message: 'Each of the four concepts needs to be different.' }
  const e = clean(explanation)
  if (e.length < SUBMISSION_LIMITS.minExplanation) return { field: 'explanation', message: 'Add a sentence or two on why these four belong together.' }
  if (e.length > SUBMISSION_LIMITS.explanation) return { field: 'explanation', message: `Keep the explanation under ${SUBMISSION_LIMITS.explanation} characters.` }
  if (!SUBMISSION_SYSTEMS.some((s) => s.id === system)) return { field: 'system', message: 'Choose an organ system.' }
  if (clean(source).length > SUBMISSION_LIMITS.source) return { field: 'source', message: `Keep the source under ${SUBMISSION_LIMITS.source} characters.` }
  return null
}

const REASONS = {
  duplicate: 'Someone has already suggested these four concepts. Thanks for thinking of it.',
  rate: 'That’s a lot of suggestions in a short time. Try again in an hour.',
  title: 'Give the connection a title.',
  tiles: 'Add four different concepts.',
  'tiles-repeat': 'Each of the four concepts needs to be different.',
  explanation: 'Add a sentence or two on why these four belong together.',
  system: 'Choose an organ system.',
  source: 'The source is too long.',
}

// Resolves { ok: true } only when the database confirmed the insert.
export async function submitConnection(payload) {
  const problem = validateSubmission(payload)
  if (problem) return { ok: false, reason: 'invalid', ...problem }
  if (payload.honeypot) return { ok: false, reason: 'invalid', message: 'Could not send this suggestion.' }
  const tiles = payload.tiles.map(clean)
  const print = fingerprintOf(tiles)
  if (sentPrints().includes(print)) return { ok: false, reason: 'duplicate', message: 'You’ve already suggested these four concepts.' }
  let sb = null
  try {
    sb = await getSupabase()
  } catch {
    sb = null
  }
  if (!sb) return { ok: false, reason: 'unavailable', message: 'Suggestions can’t be sent right now. Check your connection and try again.' }
  try {
    const { data, error } = await sb.rpc('submit_connection', {
      p_title: clean(payload.title),
      p_tiles: tiles,
      p_explanation: clean(payload.explanation),
      p_system: payload.system,
      p_source: clean(payload.source) || null,
      p_client_id: clientId(),
      p_app_version: APP_VERSION,
    })
    if (error || !data) return { ok: false, reason: 'server', message: 'Your suggestion didn’t go through. Everything you typed is still here, so try again.' }
    if (data.ok !== true) {
      if (data.reason === 'duplicate') noteSent(print)
      return { ok: false, reason: data.reason, message: REASONS[data.reason] || 'Your suggestion didn’t go through. Try again.' }
    }
    noteSent(print)
    return { ok: true, id: data.id }
  } catch {
    return { ok: false, reason: 'network', message: 'Your suggestion didn’t go through. Everything you typed is still here, so try again.' }
  }
}
