// ---------------------------------------------------------------------
// What an email link brought the player back with, read once at start-up
// before the Supabase client reads (and clears) the address.
//   • a password reset link: #access_token=…&type=recovery
//   • an expired or already used link: #error=…&error_code=otp_expired…
// Supabase signs the player in from the recovery link itself; this only
// tells the app to open the "choose a new password" step or explain the
// expired link.
// ---------------------------------------------------------------------
function read() {
  if (typeof window === 'undefined') return null
  const raw = (window.location.hash || '').replace(/^#/, '')
  if (!raw || !/(access_token|error|type)=/.test(raw)) return null
  const q = new URLSearchParams(raw)
  if (q.get('type') === 'recovery' && q.get('access_token')) return { kind: 'recovery' }
  const code = q.get('error_code') || q.get('error')
  if (code) return { kind: 'link-error', code, description: q.get('error_description') || '' }
  return null
}

export const AUTH_REDIRECT = read()

// Remove the token or error from the address (keeps the app's history state).
export function clearAuthHash() {
  try {
    if (/(access_token|error|type)=/.test(window.location.hash)) history.replaceState(history.state, '', window.location.pathname + window.location.search)
  } catch {
    /* ignore */
  }
}
