// ---------------------------------------------------------------------
// genConnectionSQL — turn authored connection groups into paste-ready SQL
// ---------------------------------------------------------------------
// Used for the assisted-generation workflow: you send source material, I author
// verified connection groups (the same shape as src/data/connectionBank.js),
// and this emits SQL you paste ONCE into the Supabase SQL Editor. The game then
// merges them into play (see src/lib/contentSource.js) with no redeploy.
//
// The SQL is IDEMPOTENT: connections upsert on external_key, concepts upsert on
// canonical_name, and links upsert on (connection_id, concept_id) — so running
// it twice never duplicates anything.
//
// Usage:  node scripts/genConnectionSQL.mjs path/to/groups.mjs > out.sql
//   where groups.mjs has `export default [ {group}, ... ]` in the bank shape:
//   { id, title, tiles[4], difficulty, systems[], connectionType, explanation,
//     tileExplanations[4], remember, tags[], status }

const q = (s) => `'${String(s ?? '').replace(/'/g, "''")}'`
const qArr = (a) => `ARRAY[${(a || []).map(q).join(', ')}]::text[]`

export function groupToSQL(g) {
  const ext = `bank-${g.id}`
  const systems = g.systems && g.systems.length ? g.systems : [g.primarySystem].filter(Boolean)
  const tiles = g.tiles || []
  const notes = g.tileExplanations || []
  if (tiles.length !== 4) throw new Error(`group ${g.id} must have exactly 4 tiles`)

  const conceptCTEs = tiles
    .map(
      (term, i) =>
        `c${i} as (insert into public.concepts (canonical_name, organ_systems, difficulty, verification_status)\n` +
        `  values (${q(term)}, ${qArr(systems)}, ${q(g.difficulty)}, 'verified')\n` +
        `  on conflict (canonical_name) do update set canonical_name = excluded.canonical_name returning id)`
    )
    .join(',\n')

  const linkValues = tiles
    .map((_, i) => `((select id from c${i}), ${i}, ${q(notes[i] || '')})`)
    .join(', ')

  return (
    `-- ${g.title}\n` +
    `with conn as (\n` +
    `  insert into public.connections\n` +
    `    (external_key, title, organ_systems, difficulty, connection_type, explanation, remember, tags, verification_status)\n` +
    `  values (${q(ext)}, ${q(g.title)}, ${qArr(systems)}, ${q(g.difficulty)}, ${q(g.connectionType || 'knowledge')}, ${q(g.explanation)}, ${q(g.remember || '')}, ${qArr(g.tags)}, 'verified')\n` +
    `  on conflict (external_key) do update set\n` +
    `    title = excluded.title, organ_systems = excluded.organ_systems, difficulty = excluded.difficulty,\n` +
    `    connection_type = excluded.connection_type, explanation = excluded.explanation,\n` +
    `    remember = excluded.remember, tags = excluded.tags, verification_status = excluded.verification_status\n` +
    `  returning id),\n` +
    conceptCTEs +
    `\n` +
    `insert into public.connection_concepts (connection_id, concept_id, position, tile_note)\n` +
    `select conn.id, v.cid, v.pos, v.note from conn, (values ${linkValues}) as v(cid, pos, note)\n` +
    `on conflict (connection_id, concept_id) do update set position = excluded.position, tile_note = excluded.tile_note;\n`
  )
}

export function groupsToSQL(groups) {
  const header =
    `-- Plexus connections — generated ${new Date().toISOString().slice(0, 10)}\n` +
    `-- Paste into Supabase → SQL Editor → New query → Run. Idempotent (safe to re-run).\n` +
    `-- ${groups.length} connection(s).\n\n`
  return header + groups.map(groupToSQL).join('\n')
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2]
  if (!path) {
    console.error('usage: node scripts/genConnectionSQL.mjs path/to/groups.mjs > out.sql')
    process.exit(1)
  }
  const mod = await import(path.startsWith('/') ? path : `${process.cwd()}/${path}`)
  const groups = mod.default || mod.groups || []
  process.stdout.write(groupsToSQL(groups))
}
