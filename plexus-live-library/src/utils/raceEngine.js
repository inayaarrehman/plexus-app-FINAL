// ---------------------------------------------------------------------
// Race Mode — seeded challenge engine + (isolated) sync boundary
// ---------------------------------------------------------------------
// Race lets two players run the EXACT same Plexus challenge at the same time.
// The core requirement that makes true multiplayer tractable later is already
// satisfied here: the challenge set is 100% a deterministic function of a
// short join code. Give two clients the same code and they independently
// build the identical ordered set of rounds — no server needs to send the
// questions, only to relay progress.
//
// The live head-to-head layer (presence + progress relay over Supabase
// Realtime) lives in src/lib/liveRace.js — this file stays backend-agnostic and
// only produces the deterministic set, codes and links. A solo player with no
// opponent on the channel runs the same seeded set honestly; nothing here
// fabricates an opponent.
// ---------------------------------------------------------------------

import { composeNextRound } from './challengeEngine.js'
import { seededRng } from './puzzleAssembler.js'

// Only single-screen round types are used in Race so both clients render the
// identical set simply and deterministically.
export const RACE_ROUND_TYPES = ['rapidAssociation', 'commonLink', 'completeConnection', 'impostor']

export const RACE_LENGTH = 10

// Unambiguous code alphabet (no 0/O/1/I/L) for easy sharing by voice/text.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4

// A fresh, shareable join code. The code is the ONLY thing two players must
// exchange — it fully determines the challenge set.
export function makeJoinCode(rng = Math.random) {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)]
  }
  return code
}

export function normalizeJoinCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)
}

export function isValidJoinCode(code) {
  const c = normalizeJoinCode(code)
  return c.length === CODE_LENGTH && [...c].every((ch) => CODE_ALPHABET.includes(ch))
}

// Deterministically build the race's ordered round set from a join code.
// Same code + same bank → identical rounds in identical order on every device.
// Uses composeNextRound so the set still varies format/system/concept across
// rounds (no back-to-back repeats) while staying fully reproducible.
export function buildRaceChallenge(bank, { code, length = RACE_LENGTH } = {}) {
  const seed = `race:${normalizeJoinCode(code)}`
  const rng = seededRng(seed)
  const rounds = []
  let recent = []
  let guard = 0
  while (rounds.length < length && guard < length * 8) {
    guard++
    const round = composeNextRound(bank, { rng, roundTypes: RACE_ROUND_TYPES, recent })
    if (!round) break
    rounds.push(round)
    recent = [{ type: round.type, systems: round.systems, conceptTags: round.conceptTags }, ...recent].slice(0, 3)
  }
  return rounds
}

// A shareable link that carries the code in the URL hash, so a tapped link
// drops the friend straight into the join screen for the same race.
export function raceLinkForCode(code, origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '')
  return `${base}#race=${normalizeJoinCode(code)}`
}

// Parse a race code out of a URL hash like "#race=ABCD" (returns null if none).
export function raceCodeFromHash(hash) {
  const m = /#race=([A-Za-z0-9]+)/.exec(String(hash || ''))
  return m ? normalizeJoinCode(m[1]) : null
}
