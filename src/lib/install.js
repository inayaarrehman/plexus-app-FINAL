// ---------------------------------------------------------------------
// Home Screen install: one place that knows whether Plexus can be installed.
// ---------------------------------------------------------------------
// Chrome, Edge and other Chromium browsers fire `beforeinstallprompt` once,
// early in the page's life. It is captured here at startup (main.jsx calls
// initInstall), so both the bottom hint and the guide in How to play can open
// the browser's own install prompt later. Safari and Firefox have no such
// event; the guide shows the manual steps there.

let deferred = null
let installedNow = false
const subs = new Set()
const emit = () => subs.forEach((fn) => fn())

export function initInstall() {
  if (typeof window === 'undefined' || initInstall.done) return
  initInstall.done = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installedNow = true
    emit()
  })
}

export function subscribeInstall(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

// Whether the browser has offered a native install prompt that is still usable.
export const canPromptInstall = () => Boolean(deferred)
export const wasInstalledNow = () => installedNow

// Opens the browser's install prompt. Resolves to 'accepted', 'dismissed' or
// 'unavailable'. The event can be used once, so it is cleared either way.
export async function promptInstall() {
  const e = deferred
  if (!e) return 'unavailable'
  deferred = null
  emit()
  try {
    await e.prompt()
    const choice = await e.userChoice
    if (choice?.outcome === 'accepted') {
      installedNow = true
      emit()
      return 'accepted'
    }
    return 'dismissed'
  } catch {
    return 'unavailable'
  }
}

// Running as the installed app (Android, desktop, or iOS Home Screen).
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
      window.navigator?.standalone === true,
  )
}

// Which set of steps fits this device: 'ios', 'android' or 'desktop'.
// iPadOS reports itself as a Mac, so a touch screen on "Macintosh" is an iPad.
export function installPlatform() {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

// iOS: Safari, or another browser (Chrome, Firefox and Edge on iOS add to the
// Home Screen from their own Share menus on iOS 16.4 and later).
export function iosBrowser() {
  if (typeof navigator === 'undefined') return 'safari'
  const ua = navigator.userAgent || ''
  if (/crios/i.test(ua)) return 'chrome'
  if (/fxios|edgios/i.test(ua)) return 'other'
  return 'safari'
}
