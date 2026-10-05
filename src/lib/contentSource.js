// ---------------------------------------------------------------------
// Content source — merges the signed-off Supabase library into the game
// ---------------------------------------------------------------------
// The bundled connection bank (src/data/connectionBank.js) is always the base:
// it ships with the app, works offline, and is what the Daily is generated from
// (so the Daily stays identical for everyone and never shifts when content is
// added). On top of that, this module loads any VERIFIED, non-archived
// connections from Supabase and merges them in, so connections authored in the
// Editor or generated and inserted via SQL appear in Systems practice, the
// 3-Minute Challenge and Race — with no redeploy.
//
// Everything degrades safely: not configured, offline, empty, or malformed rows
// → the game simply uses the bundled bank. Only rows that form a valid, playable
// 4-tile group are included; anything incomplete is skipped rather than breaking
// a puzzle.

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'
import { SYSTEMS } from '../puzzles.js'
import { DIFFICULTY_TIERS, CONNECTION_TYPES } from '../data/connectionBank.js'

// Turn one Supabase connection row (with its linked concepts) into the bank
// group shape the game engine expects, or null if it can't form a playable group.
function mapRow(row) {
  const links = (row.connection_concepts || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
  const tiles = links.map((l) => String(l.concept?.canonical_name || '').trim()).filter(Boolean)
  if (tiles.length !== 4) return null
  if (new Set(tiles.map((t) => t.toLowerCase())).size !== 4) return null // 4 distinct tiles

  const systems = (row.organ_systems || []).filter((s) => SYSTEMS.includes(s))
  if (systems.length === 0) return null

  const difficulty = DIFFICULTY_TIERS.includes(row.difficulty) ? row.difficulty : null
  if (!difficulty) return null

  if (!row.title || !row.explanation) return null

  const connectionType = CONNECTION_TYPES.includes(row.connection_type) ? row.connection_type : 'knowledge'
  const tileExplanations = links.map((l) => String(l.tile_note || '').trim())

  return {
    id: `supa-${row.id}`,
    title: String(row.title),
    tiles,
    difficulty,
    systems,
    primarySystem: systems[0],
    secondarySystems: systems.slice(1),
    connectionType,
    explanation: String(row.explanation),
    tileExplanations,
    remember: row.remember ? String(row.remember) : '',
    tags: Array.isArray(row.tags) && row.tags.length ? row.tags : ['user-added'],
    overlapTags: [],
    status: 'verified',
    source: 'supabase',
  }
}

// Load every verified, non-archived connection from Supabase as playable groups.
// Returns [] when not configured / offline / empty.
export async function loadExtraConnections() {
  if (!isSupabaseConfigured()) return []
  const sb = await getSupabase()
  if (!sb) return []
  try {
    const { data, error } = await sb
      .from('connections')
      .select(
        'id,title,organ_systems,difficulty,connection_type,explanation,remember,tags,connection_concepts(position,tile_note,concept:concepts(canonical_name))'
      )
      .eq('verification_status', 'verified')
      .eq('archived', false)
      .limit(2000)
    if (error) return []
    return (data || []).map(mapRow).filter(Boolean)
  } catch {
    return []
  }
}

// Merge extra (Supabase) groups onto the bundled base, de-duplicated by title so
// a Supabase row that repeats a bundled title never doubles it (the bundled one
// wins). The base is never mutated.
export function mergeBank(base, extra) {
  if (!extra || extra.length === 0) return base
  const seen = new Set(base.map((c) => String(c.title || '').trim().toLowerCase()))
  const additions = extra.filter((c) => {
    const key = String(c.title || '').trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  return additions.length ? [...base, ...additions] : base
}

// Exposed for tests.
export { mapRow }
