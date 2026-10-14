import React, { useEffect, useState } from 'react'
import { TERMS_VERSION, PRIVACY_VERSION, LEGAL_UPDATED } from '../legal/config.js'
import { getCurrentUser, getMyAcceptance, recordAcceptance } from '../lib/auth.js'

// A short notice on Home, never a pop-up: on a first visit it says what
// Plexus is for and links the Terms, Privacy Policy and Disclaimer before
// someone starts playing; after a policy update it says so. "Got it" is
// remembered in this browser (by version). A signed-in account whose
// accepted versions are older than the current ones is asked to accept, and
// that is recorded with the account (terms_acceptances, migration 0012).
const KEY = 'plexus.policyAck.v1'
function readAck() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}
function writeAck() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ terms: TERMS_VERSION, privacy: PRIVACY_VERSION, at: Date.now() }))
  } catch {
    /* storage unavailable: the notice may show again */
  }
}
const current = (a) => a && a.terms === TERMS_VERSION && a.privacy === PRIVACY_VERSION

export default function PolicyNotice({ onOpenLegal }) {
  const [ack] = useState(readAck)
  const [state, setState] = useState(() => (current(ack) ? null : ack ? 'updated' : 'first'))
  const [account, setAccount] = useState(false) // signed in and needs to accept
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    getCurrentUser()
      .then(async (u) => {
        if (!live || !u || u.is_anonymous) return
        const a = await getMyAcceptance()
        if (!live) return
        if (!a || a.terms_version !== TERMS_VERSION || a.privacy_version !== PRIVACY_VERSION) {
          setAccount(true)
          setState((s) => s || 'updated')
        }
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  if (!state) return null
  const link = (page, label) => (
    <a
      href={`#${page}`}
      onClick={(e) => {
        if (!onOpenLegal) return
        e.preventDefault()
        onOpenLegal(page)
      }}
    >
      {label}
    </a>
  )
  const done = async () => {
    setBusy(true)
    try {
      if (account) {
        const r = await recordAcceptance()
        if (!r?.ok) return // keep showing; it will be asked again
      }
      writeAck()
      setState(null)
    } finally {
      setBusy(false)
    }
  }
  return (
    <aside className="policy-notice" aria-label="Terms and privacy">
      {state === 'first' ? (
        <p className="policy-notice-text">
          Plexus is a study game, not medical advice ({link('disclaimer', 'Disclaimer')}). By playing, you agree to the {link('terms', 'Terms of Use')}. The {link('privacy', 'Privacy Policy')} explains what stays in your browser and what we store.
        </p>
      ) : (
        <p className="policy-notice-text">
          We updated the {link('terms', 'Terms of Use')} and {link('privacy', 'Privacy Policy')} on {LEGAL_UPDATED}.{' '}
          {account ? 'Please review them and accept to keep using your account.' : 'By continuing to play, you agree to the updated Terms.'}
        </p>
      )}
      <button type="button" className="policy-notice-btn" onClick={done} disabled={busy}>
        {account ? (busy ? 'Saving…' : 'Accept') : 'Got it'}
      </button>
    </aside>
  )
}
