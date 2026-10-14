import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { signInWithPassword, signUpWithPassword, signOut, getCurrentUser, deleteMyAccount, requestPasswordReset, updatePassword, hasGuestRaceId, deleteGuestRaceId } from '../lib/auth.js'
import { clearAuthHash } from '../lib/authRedirect.js'
import { clearDeviceData } from '../legal/deviceData.js'
import { CONTACT_EMAIL } from '../legal/config.js'
import LegalFooter from './LegalFooter.jsx'
import PolicyLink from './PolicyLink.jsx'

// ---------------------------------------------------------------------
// AuthModal: optional account sign-in so a player's streak and history
// follow them across devices. Playing is never gated behind this; it only
// adds cloud save. Email + password (matches the Editor's auth). On success
// it calls onAuthChanged so the app runs a progress sync.
// ---------------------------------------------------------------------
// initialMode: 'in' | 'up' | 'forgot' | 'reset' (arrived from a reset link) |
// 'expired' (the link was expired or already used).
// Policy links open in a new tab so nothing typed here is lost.
// eslint-disable-next-line no-unused-vars
export default function AuthModal({ onClose, onAuthChanged, onOpenLegal, initialMode = 'in' }) {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState(initialMode)
  const [password2, setPassword2] = useState('')
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
  // Arriving from an email link: the address no longer needs the token.
  useEffect(() => {
    if (initialMode === 'reset' || initialMode === 'expired') clearAuthHash()
  }, [initialMode])

  const switchMode = (m) => {
    setMode(m)
    setMsg('')
    setNotice('')
    setPassword('')
    setPassword2('')
  }

  const doForgot = async () => {
    const addr = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setMsg('Enter the email address you signed up with.')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      const r = await requestPasswordReset(addr)
      if (!r.ok) {
        setMsg(r.status === 429 || /rate|too many|seconds/i.test(r.error || '') ? 'Too many requests. Wait a minute, then try again.' : 'Could not send the email right now. Please try again.')
        return
      }
      setNotice(`If an account uses ${addr}, a reset link is on its way. Open it on this device. It works once and expires after a while.`)
    } finally {
      setBusy(false)
    }
  }

  const doReset = async () => {
    if (password.length < 6) {
      setMsg('Use at least 6 characters.')
      return
    }
    if (password !== password2) {
      setMsg('The two passwords don’t match.')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      const r = await updatePassword(password)
      if (!r.ok) {
        if (r.reason === 'no-session') {
          switchMode('expired')
          return
        }
        setMsg(r.error || 'Could not update the password. Please try again.')
        return
      }
      setPassword('')
      setPassword2('')
      const u = await getCurrentUser()
      setUser(u)
      setMode('in')
      setNotice('Password updated. You’re signed in, and your progress is saved to your account.')
      onAuthChanged?.()
    } finally {
      setBusy(false)
    }
  }

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
        setNotice('Your account has been deleted from Plexus, as described in the Privacy Policy. Progress saved in this browser is still here; use Clear data on this device to remove it.')
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

  const [guestId, setGuestId] = useState(() => hasGuestRaceId())
  const doDeleteGuest = async () => {
    setBusy(true)
    setDataMsg('')
    try {
      const r = await deleteGuestRaceId()
      if (r.ok) {
        setGuestId(false)
        setConfirm(null)
        setNotice('Your guest race data has been deleted.')
        return
      }
      setDataMsg(`Could not delete your guest race data right now. Try again, or email ${CONTACT_EMAIL}.`)
    } finally {
      setBusy(false)
    }
  }

  const doClearDevice = async () => {
    setBusy(true)
    try {
      if (user) await signOut()
      // A guest race ID can only be deleted from the browser that holds it,
      // so delete it on the server before forgetting it here.
      if (hasGuestRaceId()) {
        const g = await deleteGuestRaceId()
        if (!g.ok) {
          setDataMsg('Could not reach Plexus to delete your guest race data. Check your connection and try again.')
          return
        }
      }
      clearDeviceData()
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  const yourData = (
    <section className="auth-data" aria-labelledby="auth-data-title">
      <h3 className="auth-data-title" id="auth-data-title">Your data</h3>
      {confirm === 'delete' ? (
        <div className="auth-confirm" role="alertdialog" aria-label="Delete account">
          <p className="auth-sub">This permanently deletes your account, profile, cloud progress, race items and your support messages, removes your email from reports you sent, and deletes suggestions not yet accepted. It cannot be undone. Progress saved in this browser stays until you clear it.</p>
          <div className="auth-confirm-row">
            <button className="auth-btn-danger" onClick={doDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button className="auth-btn-secondary" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : confirm === 'guest' ? (
        <div className="auth-confirm" role="alertdialog" aria-label="Delete guest race data">
          <p className="auth-sub">This deletes the guest race ID this browser used and its races on our servers. Players you raced keep their own results. Your game progress in this browser stays.</p>
          <div className="auth-confirm-row">
            <button className="auth-btn-danger" onClick={doDeleteGuest} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete guest race data'}
            </button>
            <button className="auth-btn-secondary" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      ) : confirm === 'clear' ? (
        <div className="auth-confirm" role="alertdialog" aria-label="Clear data on this device">
          <p className="auth-sub">
            This removes your progress, history, streaks and XP from this browser{user ? ' and signs you out. Your account and its cloud copy are kept' : ''}.{hasGuestRaceId() ? ' Your guest race data on our servers is deleted too.' : ''} It cannot be undone.
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
          {!user && guestId && (
            <button className="auth-link-btn" onClick={() => setConfirm('guest')} disabled={busy}>
              Delete guest race data
            </button>
          )}
          <button className="auth-link-btn" onClick={() => setConfirm('clear')} disabled={busy}>
            Clear data on this device
          </button>
        </div>
      )}
      <p className="auth-data-note">
        Clearing this device doesn’t delete anything stored with your account. <PolicyLink page="privacy">How long data is kept</PolicyLink>
      </p>
      {dataMsg && <p className="auth-error">{dataMsg}</p>}
    </section>
  )

  const canSubmit = email.trim() && password && !busy

  return (
    <Modal title="Account" onClose={onClose}>
      {user && mode !== 'reset' ? (
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
          <LegalFooter newTab className="auth-legal" />
        </div>
      ) : mode === 'forgot' ? (
        <div className="auth-modal">
          <h3 className="auth-step-title">Reset your password</h3>
          <p className="auth-sub">Enter your account email and we’ll send a link to choose a new password.</p>
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input type="email" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !busy && doForgot()} placeholder="you@example.com" />
          </label>
          {msg && <p className="auth-error" role="alert">{msg}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button className="auth-btn-primary" onClick={doForgot} disabled={busy || !email.trim()}>
            {busy ? 'Sending…' : notice ? 'Send again' : 'Send reset link'}
          </button>
          <button className="auth-switch" onClick={() => switchMode('in')} disabled={busy}>
            Back to sign in
          </button>
        </div>
      ) : mode === 'reset' ? (
        <div className="auth-modal">
          <h3 className="auth-step-title">Choose a new password</h3>
          <p className="auth-sub">Your reset link worked. Pick a new password for your account.</p>
          <label className="auth-field">
            <span className="auth-label">New password</span>
            <input type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </label>
          <label className="auth-field">
            <span className="auth-label">Repeat new password</span>
            <input type="password" value={password2} autoComplete="new-password" onChange={(e) => setPassword2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !busy && doReset()} />
          </label>
          {msg && <p className="auth-error" role="alert">{msg}</p>}
          <button className="auth-btn-primary" onClick={doReset} disabled={busy || !password || !password2}>
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </div>
      ) : mode === 'expired' ? (
        <div className="auth-modal">
          <h3 className="auth-step-title">This link has expired</h3>
          <p className="auth-sub">Reset links work once and only for a limited time. Request a new one and open the newest email.</p>
          <button className="auth-btn-primary" onClick={() => switchMode('forgot')}>
            Send a new link
          </button>
          <button className="auth-switch" onClick={() => switchMode('in')}>
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="auth-modal">
          <p className="auth-sub">
            {mode === 'in'
              ? 'Sign in to keep your streak, XP and tools safe and on every device.'
              : 'A free account keeps your streak, XP and tools safe if you switch devices or clear your browser. Everything you’ve played as a guest comes with you.'}
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

          {msg && <p className="auth-error" role="alert">{msg}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}

          {mode === 'up' && (
            <p className="auth-terms-note" id="auth-terms-note">
              By creating an account, you agree to the <PolicyLink page="terms">Terms of Use</PolicyLink> and acknowledge the <PolicyLink page="privacy">Privacy Policy</PolicyLink>. Plexus is for people 13 and older.
            </p>
          )}
          <button className="auth-btn-primary" onClick={mode === 'in' ? doSignIn : doSignUp} disabled={!canSubmit} aria-describedby={mode === 'up' ? 'auth-terms-note' : undefined}>
            {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
          {mode === 'in' && (
            <button className="auth-switch auth-forgot" onClick={() => switchMode('forgot')} disabled={busy}>
              Forgot password?
            </button>
          )}

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

          <p className="auth-guest-note">You can keep playing as a guest. Your game progress stays in this browser until you sign in.</p>
          {yourData}
          <LegalFooter newTab className="auth-legal" />
        </div>
      )}
    </Modal>
  )
}
