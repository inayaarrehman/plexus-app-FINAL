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

## Punctuation rule: no em dashes

No em dash character (U+2014) in any Plexus copy: remember lines, explanations, tile notes ("why"), titles, sources, results, buttons, errors, anything a player can read. Do not swap it for a hyphen. Rewrite the sentence with a period, comma, colon or parentheses so it reads naturally.

The Library editor refuses to save a connection that contains one, and `node scripts/selftest.mjs` fails if any bundled content has one.

## Name the connection (optional fields)

On today's Daily, players can type what links a solved group for +10 XP. The
group's `title` is the answer. Wording does not have to match: the app
handles case, punctuation, plurals, word order, common abbreviations (IE,
ACEi, HTN, meds) and small typos, and asks a server check when it is unsure.

You can add up to four optional fields to a category. None is required.

| Field | What it is | Example |
|---|---|---|
| `canonical` | The answer, if it should differ from the title | `'Organisms causing infective endocarditis'` |
| `aliases` | A few obvious other ways to say it | `['Endocarditis pathogens', 'IE organisms']` |
| `keyTerms` | Words that carry the concept | `['endocarditis']` |
| `doNotAccept` | Phrases too broad to pass | `['Bacteria', 'Heart infection']` |

Three to five aliases is plenty. Use `doNotAccept` for the vague answers you
expect people to try. A few examples are already in the bank: QT-prolonging
drug classes, Nephrotic-pattern glomerular diseases, and Organisms causing
infective endocarditis.
