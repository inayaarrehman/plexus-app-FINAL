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

import { composeNextRound, roundRelationships } from './challengeEngine.js'
import { seededRng } from './puzzleAssembler.js'
import { RACE_TIER_CURVE } from './timedPacing.js'

// Single-screen round types, so both clients render the identical set simply
// and deterministically. The live (server) race also uses Split, Chain and
// Complete the Chain, at most one of each per race (RACE_TYPE_CAP), so those
// slower formats never crowd out the rest. The shared-code fallback race
// (Race.jsx) keeps the original four.
export const RACE_CLASSIC_TYPES = ['rapidAssociation', 'commonLink', 'completeConnection', 'impostor']
export const RACE_ROUND_TYPES = [...RACE_CLASSIC_TYPES, 'split', 'chain', 'completeTheChain']
export const RACE_TYPE_CAP = { split: 1, chain: 1, completeTheChain: 1 }

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
// rounds while staying fully reproducible, and never repeats a relationship
// (by canonical id) within one race. `bank` must be the timed library.
// Every race follows the same difficulty curve (RACE_TIER_CURVE): both
// players get the identical rounds, options and order, and every race has
// the same shape, so a harder generator gives neither player an edge.
export function buildRaceChallenge(bank, { code, length = RACE_LENGTH, canonicalOf, roundTypes = RACE_ROUND_TYPES } = {}) {
  const seed = `race:${normalizeJoinCode(code)}`
  const typeCount = {}
  const rng = seededRng(seed)
  const rounds = []
  const used = new Set()
  let recent = []
  let guard = 0
  while (rounds.length < length && guard < length * 8) {
    guard++
    const tier = RACE_TIER_CURVE[rounds.length % RACE_TIER_CURVE.length]
    const allowed = roundTypes.filter((t) => !(t in RACE_TYPE_CAP) || (typeCount[t] || 0) < RACE_TYPE_CAP[t])
    const round = composeNextRound(bank, { rng, roundTypes: allowed, recent, used, canonicalOf, tier })
    if (!round) break
    typeCount[round.type] = (typeCount[round.type] || 0) + 1
    rounds.push(round)
    roundRelationships(round, bank, canonicalOf).forEach((id) => used.add(id))
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
