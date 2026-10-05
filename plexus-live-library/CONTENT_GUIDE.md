# Updating the Plexus library

There are two libraries, and this is how they fit together:

- **Bundled bank** (`src/data/connectionBank.js` + packs) — ships with the app,
  works offline, and is what the **Daily** is generated from. The Daily stays on
  this bank so it's identical for everyone and never shifts when you add content.
- **Supabase library** (the Editor) — connections you author or generate. The app
  now **merges every verified, non-archived Supabase connection** on top of the
  bundled bank for **Systems practice, 3-Minute, and Race** — no redeploy. If
  Supabase is empty or offline, the game just uses the bundled 212.

A connection needs: a title, **exactly 4 tiles** (the terms players tap, each with
a one-line "why"), a difficulty, at least one organ system, a type, and an
explanation. Set its status to **verified** for it to appear in the game.

## Way 1 — Author your own in the Editor
1. Open the app at `#dev` → **Editor** → **Connections** → **+ New**.
2. Fill in the title, pick difficulty / type / organ system(s), and enter the
   **four tiles** (term + why) inline.
3. Set status to **verified** and **Save**.
4. It appears in Systems / 3-Minute / Race within a moment (reload if needed).
   Use **Edit** to change tiles later, **Archive** to retire one.

Writes require being signed in as an admin (the Editor header shows your status).

## Way 2 — Assisted generation (you upload, I generate)
For turning source material into accurate connections at volume:
1. Send me the material (your notes, a question bank, a chapter, a PDF) and say
   roughly what you want (e.g. "20 renal pharmacology connections, mixed
   difficulty").
2. I author verified groups in the house style and run
   `scripts/genConnectionSQL.mjs` to produce a **paste-ready SQL file**.
3. You open Supabase → **SQL Editor → New query**, paste it, **Run** (it's
   idempotent — safe to re-run, never duplicates).
4. The connections are live in Systems / 3-Minute / Race.

Generated content is always reviewed before it's marked verified — medical
accuracy comes first, so nothing is auto-published.

## Notes
- To put new content into the **Daily** rotation specifically, that's a separate
  step (official curated dailies) — ask when you want it.
- The bundled bank remains the offline/base layer; you don't need to migrate it
  into Supabase.
