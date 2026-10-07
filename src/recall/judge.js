// ---------------------------------------------------------------------
// Name the connection: the full decision, local first.
// ---------------------------------------------------------------------
//   1-3. the local matcher (normalize, aliases, weighted overlap). Instant.
//   4.   a semantic check, only when the local matcher is not sure. It runs
//        on the server (/api/recall-judge) so no API key ever reaches the
//        browser. If it is not set up, slow or offline, the local answer
//        stands. Results are cached per group and answer.
//
// The semantic check only compares two phrases. The canonical name and its
// aliases stay the source of truth, and an answer listed under doNotAccept
// is never sent to it.

import { matchAnswer, recallTarget, buildVocabulary, vocabularyReady } from './matcher.js'
import { bagKey } from './normalize.js'
import connectionBank from '../data/connectionBank.js'
import connectionBankExtra from '../data/connectionBankExtra.js'
import connectionBankExtra2 from '../data/connectionBankExtra2.js'
import migratedBankCategories from '../data/migratedBankCategories.js'

const ENDPOINT = '/api/recall-judge'
const TIMEOUT_MS = 3500
let semanticOff = false
const cache = new Map()

function ensureVocabulary() {
  if (!vocabularyReady()) buildVocabulary([...connectionBank, ...connectionBankExtra, ...connectionBankExtra2, ...migratedBankCategories])
}

async function semantic(answer, target, tiles) {
  if (semanticOff || typeof fetch !== 'function') return null
  const key = `${target.canonical}|${bagKey(answer)}`
  if (cache.has(key)) return cache.get(key)
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, canonical: target.canonical, aliases: target.aliases, doNotAccept: target.doNotAccept, tiles }),
      signal: ctrl?.signal,
    })
    if ([404, 405, 501, 503].includes(res.status)) {
      semanticOff = true // not deployed or not configured: stop asking this session
      return null
    }
    if (!res.ok) return null
    const data = await res.json()
    const band = { same: 'high', close: 'medium', different: 'low' }[data?.verdict] || null
    if (band) cache.set(key, band)
    return band
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// judge(answer, category) -> Promise<{ band: 'high'|'medium'|'low', via }>
export async function judgeAnswer(answer, category) {
  ensureVocabulary()
  const target = recallTarget(category)
  const local = matchAnswer(answer, target)
  if (local.band === 'high' || local.via === 'empty' || local.via === 'rejected-phrase') return local
  const tiles = (category.items || []).map((i) => i.term)
  const band = await semantic(answer, target, tiles)
  if (!band) return local
  return { band, via: 'semantic', score: local.score }
}

// For tests and the matcher harness.
export function _resetSemantic() {
  semanticOff = false
  cache.clear()
}
