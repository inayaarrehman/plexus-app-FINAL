import React, { useRef, useState } from 'react'
import { appLink } from '../utils/appUrl.js'
import { normalizeJoinCode } from '../utils/raceEngine.js'

// How Race is scored, from the rules both race versions use: ten rounds, one
// answer each; more correct answers wins and a tie goes to the faster finish
// (server: race_try_settle; shared-code race: raceVerdict). There are no
// speed bonuses or penalties to mention.
export const RACE_SCORING_COPY = 'Ten rounds, one answer each. The most correct answers wins, and a tie goes to whoever finishes faster.'

// Why a race could not be joined, by the server's reason.
export function raceJoinError(reason) {
  return (
    {
      'race-full': 'That race already has two players. Ask for a new code, or create your own race.',
      'no-such-race': 'No race found with that code. Check the code, or create a new race.',
      'already-started': 'That race has already started. Ask your friend to start a new one.',
      'race-finished': 'That race has finished. Create a new race to play again.',
      'bad-code': 'That code is not valid. Codes are four letters and numbers.',
    }[reason] || null
  )
}

export function raceLink(code) {
  return appLink(`#race=${normalizeJoinCode(code)}`)
}

// The lobby's invitation card: the code to read out or type, plus Copy Code,
// Copy Race Link and Share Race. Both lead to the same race and the same
// joining rules (a link just fills in the code and joins).
export default function RaceInvite({ code }) {
  const [done, setDone] = useState('')
  const timer = useRef(null)
  const say = (text) => {
    setDone(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDone(''), 1800)
  }
  const link = raceLink(code)
  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text)
      say(what)
    } catch {
      say('Copy didn’t work here. Read out the code instead.')
    }
  }
  const share = async () => {
    const payload = { title: 'Plexus Race', text: `Race me in Plexus. Join code ${code}.`, url: link }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(payload)
        say('Shared')
        return
      } catch (e) {
        if (e && e.name === 'AbortError') return
      }
    }
    // No share sheet on this device: copy the same invitation instead.
    copy(`${payload.text}\n${link}`, 'Invitation copied')
  }
  return (
    <div className="race-code-card race-invite">
      <span className="race-code-label">Join code</span>
      <span className="race-code-value">{code}</span>
      <div className="race-invite-actions">
        <button type="button" className="race-copy-btn" onClick={() => copy(code, 'Code copied')}>
          Copy Code
        </button>
        <button type="button" className="race-copy-btn" onClick={() => copy(link, 'Link copied')}>
          Copy Race Link
        </button>
        <button type="button" className="race-copy-btn" onClick={share}>
          Share Race
        </button>
      </div>
      <p className="race-invite-status" role="status" aria-live="polite">
        {done}
      </p>
    </div>
  )
}
