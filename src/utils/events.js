// ---------------------------------------------------------------------
// Lightweight product events.
// ---------------------------------------------------------------------
// Plexus has no analytics service. This keeps simple counts on the device
// (localStorage) and fires a `plexus:event` DOM event, so a real analytics
// hook can be attached later in one place without touching feature code.
// Nothing is sent anywhere.

const KEY = 'plexus.events.v1'

export function logEvent(name, props = {}) {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? JSON.parse(raw) : { counts: {} }
    data.counts[name] = (data.counts[name] || 0) + 1
    data.last = { name, at: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable: counts are best-effort */
  }
  try {
    window.dispatchEvent(new CustomEvent('plexus:event', { detail: { name, ...props } }))
  } catch {
    /* non-browser environment */
  }
}

export function eventCounts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"counts":{}}').counts
  } catch {
    return {}
  }
}
