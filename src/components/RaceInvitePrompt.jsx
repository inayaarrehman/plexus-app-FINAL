import React from 'react'
import Modal from './Modal.jsx'
import RaceArt from './RaceArt.jsx'
import { normalizeJoinCode } from '../utils/raceEngine.js'

// Opened from a shared race link (#race=CODE): one tap to join that race's
// lobby. A link always works, even before today's Daily is finished; Race
// opened from Home still needs the Daily.
export default function RaceInvitePrompt({ code, signedIn, onJoin, onClose }) {
  const c = normalizeJoinCode(code)
  return (
    <Modal title="Join the race" onClose={onClose} className="race-invite-prompt">
      <RaceArt className="race-invite-art" />
      <p className="race-invite-lede">
        A friend invited you to race in Plexus. Race code <b>{c}</b>.
      </p>
      <p className="race-invite-sub">Ten rounds, live. Most right answers wins.</p>
      <button type="button" className="auth-btn-primary race-invite-join" onClick={onJoin}>
        Join the race
      </button>
      <button type="button" className="race-invite-later" onClick={onClose}>
        Not now
      </button>
      {!signedIn && <p className="race-invite-note-small">You’ll join as a guest. You can sign in from the lobby to earn Race rewards.</p>}
    </Modal>
  )
}
