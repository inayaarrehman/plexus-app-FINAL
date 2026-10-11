// The public address of the app, for links people send to each other.
// In the browser it is the address the app is running at (playplexus.com in
// production, a preview address on a preview), so a shared link always opens
// the same deployment. Outside the browser it falls back to the public site.
export const PUBLIC_APP_URL = 'https://playplexus.com'

export function appUrl() {
  try {
    const o = window.location.origin
    if (o && o !== 'null' && /^https?:/.test(o)) return o
  } catch {
    /* not in a browser */
  }
  return PUBLIC_APP_URL
}

// A link to a screen of the app: appLink('#race=ABCD').
export function appLink(hash = '') {
  return `${appUrl()}/${hash}`
}
