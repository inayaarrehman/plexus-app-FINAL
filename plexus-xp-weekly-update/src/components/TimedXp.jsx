import React, { useEffect, useState } from 'react'
import { timedStatus } from '../progression/store.js'
import { TIMED_XP, TIMED_QUALIFY } from '../progression/config.js'

// Timed XP (3 Minutes and Race share one daily budget, config.TIMED_XP).
// TimedXpNote sits on the start screens and says, before a session starts,
// when XP is reduced or used up for today. With full XP it shows nothing.
export function TimedXpNote({ className = '' }) {
  const [st, setSt] = useState(() => timedStatus())
  useEffect(() => {
    const refresh = () => document.visibilityState !== 'hidden' && setSt(timedStatus())
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  if (st.tier === 'full') return null
  return (
    <p className={`timed-xp-note is-${st.tier} ${className}`} role="note">
      <span className="timed-xp-node" aria-hidden="true" />
      {st.tier === 'reduced'
        ? `Half XP for the rest of today, up to ${st.left} more XP. Full XP again after midnight.`
        : 'Today’s timed XP is used up. You can keep playing, and finished sessions still count toward This Week. XP resets at midnight.'}
    </p>
  )
}

// One line on a timed result: what the session earned and whether it counts
// toward This Week. `result` is what recordChallengeSession/recordRaceFinish
// returned (or null when nothing was recorded).
export function TimedResultLine({ result, kind = '3 Minutes' }) {
  if (!result) return null
  const gained = result.lines?.filter((l) => l[0] === kind).reduce((a, l) => a + l[1], 0) || 0
  const counts = result.qualified === true
  let text
  if (result.qualified === false || (!counts && gained === 0)) {
    text = `This session did not count toward This Week. A session counts when you play it to the end with at least ${TIMED_QUALIFY.minAnswers} answers and ${TIMED_QUALIFY.minCorrect} correct.`
  } else if (result.timedNote === 'limit') {
    text = 'No XP: today’s timed XP is used up. It still counts toward This Week.'
  } else if (result.timedNote === 'reduced') {
    text = `+${gained} XP at half rate (after the first ${TIMED_XP.full} timed XP today). Counts toward This Week.`
  } else {
    text = `+${gained} XP. Counts toward This Week.`
  }
  return (
    <p className="timed-xp-result" role="status">
      {text}
    </p>
  )
}
