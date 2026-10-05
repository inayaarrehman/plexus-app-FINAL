import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { signInWithPassword, signUpWithPassword, signOut, getCurrentUser } from '../lib/auth.js'

// ---------------------------------------------------------------------
// AuthModal — optional account sign-in so a player's streak and history
// follow them across devices. Playing is never gated behind this; it only
// adds cloud save. Email + password (matches the Editor's auth). On success
// it calls onAuthChanged so the app runs a progress sync.
// ---------------------------------------------------------------------
export default function AuthModal({ onClose, onAuthChanged }) {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('in') // 'in' | 'up'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u))
  }, [])

  const afterSignedIn = async () => {
    setNotice('Signed in — your progress is now saved to the cloud.')
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

          <p className="auth-guest-note">You can keep playing as a guest — signing in just backs up your progress.</p>
        </div>
      )}
    </Modal>
  )
}
