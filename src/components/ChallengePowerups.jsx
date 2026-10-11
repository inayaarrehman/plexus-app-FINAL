import React from 'react'
import { MUTATION_MS, CRISPR_UNLOCK_LEVEL } from '../progression/config.js'

// Powerups in 3 Minutes. The same earned items as Chaos races, spent from the
// same server inventory (raceCore 'solo' -> race_use_solo), with the same
// CRISPR level unlock. With no opponent, each one is adapted for solo play:
//   Mutation: scrambles your own answer tiles for 10 seconds, and every
//             correct answer in that window scores double.
//   CRISPR:   armed, it forgives your next wrong answer (no penalty, streak
//             kept). Like in races it is spent only when it actually blocks.
// One of each per session. Signed-in players only (guests hold no items).
export const MUTATION_SECONDS = Math.round(MUTATION_MS / 1000)
export const SOLO_MUTATION_TIP = `Scrambles your answer tiles for ${MUTATION_SECONDS} seconds. Correct answers in that time score double.`
export const SOLO_CRISPR_TIP = `Arm it to forgive your next wrong answer: no points off and your streak stays. Spent only when it blocks a miss. Unlocks at Level ${CRISPR_UNLOCK_LEVEL}.`

export function PowerupIntro({ summary, loaded }) {
  if (!loaded) return null
  if (!summary || summary.guest) {
    return <p className="challenge-power-intro">Sign in to bring powerups from races into 3 Minutes.</p>
  }
  const inv = summary.inventory || {}
  const locked = !summary.crisprUnlocked
  return (
    <p className="challenge-power-intro">
      <b>Powerups:</b> Mutation ×{inv.mutation || 0} · CRISPR {locked ? `unlocks at Level ${summary.crisprUnlockLevel || CRISPR_UNLOCK_LEVEL}` : `×${inv.crispr || 0}`}. One of each per session.
    </p>
  )
}

export default function ChallengePowerups({ summary, loaded, now, mutation, crisprArmed, used, busy, note, onMutation, onCrispr }) {
  if (!loaded) return null
  if (!summary || summary.guest) return null
  const inv = summary.inventory || {}
  const unlockLevel = summary.crisprUnlockLevel || CRISPR_UNLOCK_LEVEL
  const locked = !summary.crisprUnlocked
  const mutationLeft = mutation ? Math.max(0, Math.ceil((mutation.endsAt - now) / 1000)) : 0
  const mutationOn = mutationLeft > 0
  const canMutate = !busy && !used.mutation && !mutationOn && (inv.mutation || 0) > 0
  const canArm = !busy && !used.crispr && !crisprArmed && !locked && (inv.crispr || 0) > 0
  const mMeta = mutationOn ? `${mutationLeft}s` : used.mutation ? 'Used' : `×${inv.mutation || 0}`
  const cMeta = locked ? `Level ${unlockLevel}` : crisprArmed ? 'Armed' : used.crispr ? 'Used' : `×${inv.crispr || 0}`
  return (
    <div className="challenge-powerups-wrap">
      <div className="challenge-powerups" role="group" aria-label="Powerups">
        <button type="button" className={`challenge-power is-mutation ${mutationOn ? 'is-on' : ''}`} onClick={onMutation} disabled={!canMutate} title={SOLO_MUTATION_TIP} aria-label={`Mutation, ${mutationOn ? `active, ${mutationLeft} seconds left` : mMeta === 'Used' ? 'used this session' : `${inv.mutation || 0} held`}. ${SOLO_MUTATION_TIP}`}>
          <span className="challenge-power-dot" aria-hidden="true" />
          <span className="challenge-power-name">Mutation</span>
          <span className="challenge-power-meta">{mMeta}</span>
        </button>
        <button type="button" className={`challenge-power is-crispr ${crisprArmed ? 'is-on' : ''} ${locked ? 'is-locked' : ''}`} onClick={onCrispr} disabled={!canArm} title={SOLO_CRISPR_TIP} aria-label={`CRISPR, ${locked ? `locked until Level ${unlockLevel}` : crisprArmed ? 'armed' : cMeta === 'Used' ? 'used this session' : `${inv.crispr || 0} held`}. ${SOLO_CRISPR_TIP}`}>
          <span className="challenge-power-dot" aria-hidden="true" />
          <span className="challenge-power-name">CRISPR</span>
          <span className="challenge-power-meta">{cMeta}</span>
        </button>
      </div>
      <p className="challenge-power-status" role="status" aria-live="polite">
        {mutationOn ? (
          <>
            Mutation on: tiles scrambled, double points<span aria-hidden="true"> · {mutationLeft}s</span>
          </>
        ) : crisprArmed ? 'CRISPR armed: your next wrong answer is forgiven.' : note || ''}
      </p>
    </div>
  )
}
