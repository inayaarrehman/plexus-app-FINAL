import React from 'react'
import LockGlyph from './LockGlyph.jsx'
import { LOCK_COPY } from '../utils/dailyGate.js'

// Understated text navigation — no icons, no cards. Rendered above Home,
// Systems and Archive/Review; deliberately NOT rendered around an active
// Daily Puzzle or a running 3-Minute Challenge, which stay full-screen and
// distraction-free (the same treatment Game.jsx already used before this
// nav existed).
const ITEMS = [
  { key: 'home', label: 'Today' },
  { key: 'systems', label: 'Systems' },
  { key: 'challenge', label: '3-Minute' },
  { key: 'archive', label: 'Review' },
]

// `locked`: before today's Daily is finished, every destination except Today
// stays visible with a small lock; tapping it calls `onLocked` (the shared
// restrained notice) instead of navigating.
export default function AppNav({ active, onNavigate, locked = false, onLocked }) {
  return (
    <nav className="app-nav" aria-label="Primary">
      {ITEMS.map((item) => {
        const isLocked = locked && item.key !== 'home'
        return (
          <button
            key={item.key}
            className={`app-nav-item ${active === item.key ? 'active' : ''} ${isLocked ? 'is-locked' : ''}`}
            onClick={() => (isLocked ? onLocked && onLocked() : onNavigate(item.key))}
            aria-disabled={isLocked ? 'true' : undefined}
            aria-label={isLocked ? `${item.label}. ${LOCK_COPY}` : undefined}
          >
            {item.label}
            {isLocked && <LockGlyph size={11} className="app-nav-lock" />}
          </button>
        )
      })}
    </nav>
  )
}
