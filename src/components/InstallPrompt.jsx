import React, { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------
// InstallPrompt — unobtrusive "Add to Home Screen" hint.
// ---------------------------------------------------------------------
// Two paths, because the platforms differ:
//   • Android / Chrome / Edge fire `beforeinstallprompt`; we capture it and
//     show a real "Install" button that triggers the native prompt.
//   • iOS Safari has no such event, so when we're in Safari and NOT already
//     running as an installed app, we show the manual Share → Add to Home
//     Screen instructions instead.
// It never shows once installed (display-mode: standalone / navigator.standalone)
// and remembers a dismissal so it doesn't nag. Purely additive — no effect on
// gameplay.

const DISMISS_KEY = 'plexus.installHintDismissed.v1'
const VISITS_KEY = 'plexus.visits.v1'

// Only suggest installing once Plexus has earned it: after the player has
// finished a puzzle, or on a later visit. Never on the very first look.
// A visit is one browser session; it is counted once per session.
function countVisit() {
  try {
    const data = JSON.parse(localStorage.getItem(VISITS_KEY) || '{"sessions":0}')
    if (!sessionStorage.getItem(VISITS_KEY)) {
      data.sessions = (data.sessions || 0) + 1
      localStorage.setItem(VISITS_KEY, JSON.stringify(data))
      sessionStorage.setItem(VISITS_KEY, '1')
    }
    return data.sessions || 1
  } catch {
    return 1
  }
}
function hasFinishedAPuzzle() {
  try {
    const stats = JSON.parse(localStorage.getItem('medconnections.stats.v1') || '{}')
    if ((stats.gamesPlayed || 0) > 0) return true
    const history = JSON.parse(localStorage.getItem('medconnections.dailyHistory.v1') || '{}')
    return Object.values(history).some((e) => e && e.completed)
  } catch {
    return false
  }
}
export function installPromptEligible() {
  const sessions = countVisit()
  return sessions >= 2 || hasFinishedAPuzzle()
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true
  )
}

function isIos() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [eligible] = useState(() => installPromptEligible())
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (dismissed || !eligible || isStandalone()) return undefined

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS gives no event — decide from the environment.
    if (isIos()) setShowIosHint(true)

    const onInstalled = () => close()
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed])

  const close = () => {
    setDismissed(true)
    setDeferred(null)
    setShowIosHint(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* ignore */
    }
    close()
  }

  const visible = !dismissed && !isStandalone() && Boolean(deferred || showIosHint)
  // While the hint is fixed to the bottom, the page reserves its height so it
  // never covers the last content (styles.css, body.has-install-hint).
  const hintRef = useRef(null)
  useEffect(() => {
    if (!visible) return undefined
    const body = document.body
    const el = hintRef.current
    const set = () => body.style.setProperty('--install-hint-space', `${Math.ceil(el?.getBoundingClientRect().height || 96)}px`)
    body.classList.add('has-install-hint')
    set()
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(set) : null
    ro?.observe(el)
    return () => {
      ro?.disconnect()
      body.classList.remove('has-install-hint')
      body.style.removeProperty('--install-hint-space')
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="install-hint" role="dialog" aria-label="Install Plexus" ref={hintRef}>
      <div className="install-hint-body">
        <span className="install-hint-title">Add Plexus to your home screen</span>
        {deferred ? (
          <span className="install-hint-text">Install it like an app. Full screen, opens in one tap.</span>
        ) : (
          <span className="install-hint-text">
            Tap the Share icon, then <strong>Add to Home Screen</strong>.
          </span>
        )}
      </div>
      <div className="install-hint-actions">
        {deferred && (
          <button className="install-hint-install" onClick={install}>
            Install
          </button>
        )}
        <button className="install-hint-dismiss" onClick={close} aria-label="Dismiss">
          {deferred ? 'Not now' : 'Got it'}
        </button>
      </div>
    </div>
  )
}
