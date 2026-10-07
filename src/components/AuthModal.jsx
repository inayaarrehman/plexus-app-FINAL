import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { signInWithPassword, signUpWithPassword, signOut, getCurrentUser, deleteMyAccount } from '../lib/auth.js'
import { clearDeviceData } from '../legal/deviceData.js'
import { CONTACT_EMAIL } from '../legal/config.js'
import LegalFooter from './LegalFooter.jsx'

// ---------------------------------------------------------------------
// AuthModal: optional account sign-in so a player's streak and history
// follow them across devices. Playing is never gated behind this; it only
// adds cloud save. Email + password (matches the Editor's auth). On success
// it calls onAuthChanged so the app runs a progress sync.
// ---------------------------------------------------------------------
export default function AuthModal({ onClose, onAuthChanged, onOpenLegal }) {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('in') // 'in' | 'up'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [notice, setNotice] = useState('')
  // Your data: 'delete' or 'clear' while a confirmation is showing.
  const [confirm, setConfirm] = useState(null)
  const [dataMsg, setDataMsg] = useState('')

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u))
  }, [])

  const afterSignedIn = async () => {
    setNotice('Signed in. Your progress is now saved to the cloud.')
    const u = await getCurrentUser()
    setUser(u)
    onAuthChanged?.()
  }

  const doSignIn = async () => {
    setBusy(true)
    setMsg('')
    try {
      const r = await signInWithPassword(email.trim(), password)
      if (!r.ok) {
        setMsg(r.error || 'Could not sign in.')
        return
      }
      setPassword('')
      await afterSignedIn()
    } finally {
      setBusy(false)
    }
  }

  const doSignUp = async () => {
    setBusy(true)
    setMsg('')
    try {
      const r = await signUpWithPassword(email.trim(), password)
      if (!r.ok) {
        setMsg(r.error || 'Could not create the account.')
        return
      }
      // If email confirmation is OFF, we can sign in right away. If it's ON,
      // the sign-in will report the email isn't confirmed yet.
      const si = await signInWithPassword(email.trim(), password)
      if (si.ok) {
        setPassword('')
        await afterSignedIn()
      } else {
        setNotice('Account created. Check your email to confirm it, then sign in.')
        setMode('in')
      }
    } finally {
      setBusy(false)
    }
  }

  const doSignOut = async () => {
    setBusy(true)
    try {
      await signOut()
      setUser(null)
      setNotice('Signed out. Your progress is still saved on this device.')
      onAuthChanged?.()
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    setBusy(true)
    setDataMsg('')
    try {
      const r = await deleteMyAccount()
      if (r.ok) {
        setUser(null)
        setConfirm(null)
        setNotice('Your account and cloud progress have been deleted. Progress saved in this browser is still here.')
        onAuthChanged?.()
        return
      }
      setDataMsg(
        r.reason === 'unavailable'
          ? `Account deletion is not available right now.${CONTACT_EMAIL ? ` Email ${CONTACT_EMAIL} to request it.` : ' Please try again later.'}`
          : 'Could not delete the account. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  const doClearDevice = async () => {
    setBusy(true)
    try {
      if (user) await signOut()
      clearDeviceData()
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  const openLegal = onOpenLegal
    ? (page) => {
        onClose?.()
        onOpenLegal(page)
      }
    : null

  const yourData = (
    <section className="auth-data" aria-labelledby="auth-data-title">
      <h3 className="auth-data-title" id="auth-data-title">Your data</h3>
      {confirm === 'delete' ? (
        <div className="auth-confirm" role="alertdialog" aria-label="Delete account">
          <p className="auth-sub">This permanently deletes your account, profile and cloud progress. It cannot be undone. Progress saved in this browser stays.</p>
          <div className="auth-confirm-row">
            <button className="auth-btn-danger" onClick={doDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button className="auth-btn-secondary" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : confirm === 'clear' ? (
        <div className="auth-confirm" role="alertdialog" aria-label="Clear data on this device">
          <p className="auth-sub">
            This removes your progress, history, streaks and XP from this browser{user ? ' and signs you out. Your cloud copy is kept' : ''}. It cannot be undone.
          </p>
          <div className="auth-confirm-row">
            <button className="auth-btn-danger" onClick={doClearDevice} disabled={busy}>
              Clear this device
            </button>
            <button className="auth-btn-secondary" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-data-actions">
          {user && (
            <button className="auth-link-btn" onClick={() => setConfirm('delete')} disabled={busy}>
              Delete account
            </button>
          )}
          <button className="auth-link-btn" onClick={() => setConfirm('clear')} disabled={busy}>
            Clear data on this device
          </button>
        </div>
      )}
      {dataMsg && <p className="auth-error">{dataMsg}</p>}
    </section>
  )

  const canSubmit = email.trim() && password && !busy

  return (
    <Modal title="Account" onClose={onClose}>
      {user ? (
        <div className="auth-modal">
          <p className="auth-signed-in">
            Signed in as <strong>{user.email}</strong>
          </p>
          <p className="auth-sub">
            Your streak, daily history, and challenge bests are saved to the cloud and will follow you to any
            device you sign in on.
          </p>
          {notice && <p className="auth-notice">{notice}</p>}
          <button className="auth-btn-secondary" onClick={doSignOut} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
          {yourData}
          <LegalFooter onNavigate={openLegal} className="auth-legal" />
        </div>
      ) : (
        <div className="auth-modal">
          <p className="auth-sub">
            {mode === 'in' ? 'Sign in to save your streak and sync it across devices.' : 'Create an account to keep your streak safe and synced across devices.'}
          </p>

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              type="password"
              value={password}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) (mode === 'in' ? doSignIn : doSignUp)()
              }}
              placeholder={mode === 'up' ? 'At least 6 characters' : 'Your password'}
            />
          </label>

          {msg && <p className="auth-error">{msg}</p>}
          {notice && <p className="auth-notice">{notice}</p>}

          <button className="auth-btn-primary" onClick={mode === 'in' ? doSignIn : doSignUp} disabled={!canSubmit}>
            {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>

          <button
            className="auth-switch"
            onClick={() => {
              setMode((m) => (m === 'in' ? 'up' : 'in'))
              setMsg('')
            }}
            disabled={busy}
          >
            {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </button>

          {mode === 'up' && (
            <p className="auth-terms-note">
              By creating an account you agree to the{' '}
              <a href="#terms" onClick={(e) => { if (openLegal) { e.preventDefault(); openLegal('terms') } }}>Terms</a> and{' '}
              <a href="#privacy" onClick={(e) => { if (openLegal) { e.preventDefault(); openLegal('privacy') } }}>Privacy</a> page and confirm you are 13 or older.
            </p>
          )}

          <p className="auth-guest-note">You can keep playing as a guest. Signing in just backs up your progress.</p>
          {yourData}
          <LegalFooter onNavigate={openLegal} className="auth-legal" />
        </div>
      )}
    </Modal>
  )
}
