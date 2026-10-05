import React, { useEffect, useState } from 'react'

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
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (dismissed || isStandalone()) return undefined

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

  if (dismissed || isStandalone()) return null
  if (!deferred && !showIosHint) return null

  return (
    <div className="install-hint" role="dialog" aria-label="Install Plexus">
      <div className="install-hint-body">
        <span className="install-hint-title">Add Plexus to your home screen</span>
        {deferred ? (
          <span className="install-hint-text">Install it like an app — full screen, one tap to open.</span>
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
