# New content library (staged, not live)

Plexus is moving to two separate content libraries:

| Library | Feeds | Source | Where it lives now |
|---|---|---|---|
| **New library** | Daily and Systems only | Reviewed system files, uploaded one system at a time | `content/library/library.json` (staging) |
| **Timed library** | 3 Minutes and Race only | The existing bank, `src/data/connectionBank.js` | unchanged; recorded in `content/timed/manifest.json` |

Nothing in `src/` reads `content/`, so importing a system changes nothing players see. The live Daily and Systems keep using the existing bank until activation.

## Importing a system

```
node scripts/library/import.mjs <file.json|.csv|.xlsx> --system "Cardiology"
node scripts/library/import.mjs <file> --system "Cardiology" --dry-run   # report only, saves nothing
node scripts/library/import.mjs --status                                 # cumulative report
```

Each import writes a report to `content/library/reports/`.

- **Incremental.** Earlier systems are never removed. If a later file for the same system leaves a row out, the earlier row is kept and the report says so.
- **Idempotent.** Re-importing the same file changes nothing.
- **IDs.** The file's own id is used when present. It must not clash with a timed-library id or with another system's id. A clash is refused and reported. Rows without an id get a stable id (`nl-<system>-<hash>`). When re-uploaded, they match the existing record that has the same four tiles.
- **Revisions.** A changed row keeps its id and bumps `version`. The previous content goes into `history`. If a revision changes the title and tiles almost entirely under the same id, it is flagged for confirmation.
- **Preserved as written:** tiles, tile explanations, explanation, remember line, qualifiers, sources, verification status and reviewer fields. Any column the importer does not recognise is kept under `content.extra`. Content is never rewritten. A malformed row is reported, not repaired.

## Verification status

Only `approved`, `verified`, `reviewed and approved` and `final` count as approved. `rejected`, `retired` and `withdrawn` are excluded. Any other status, or a missing one, stays **unresolved**. Unresolved rows are kept but go into no pool, and are never marked approved.

## Duplicate checks

Every connection is compared:

- with every other connection in the new library: the same system and all earlier uploads
- with the timed library

Tiles and titles are compared after normalising case, punctuation, plurals and word order. Different wording, ids, tile order or file format do not make a connection new.

| Result | Rule | What happens |
|---|---|---|
| Same relationship | Same four tiles with a similar title, or the same title with 3+ shared tiles | **Within the new library:** one copy is set aside as `duplicate`. The approved one is kept, otherwise the earlier one. **Against the timed library:** the new entry is kept, and the timed entry is listed in `timedExclusionsAtActivation`. |
| Unclear | 3 or 4 shared tiles with a different title, the same title with 2 or fewer shared tiles, or very similar titles with 2 shared tiles | **Within the new library:** the later one is `held` out of every pool. **Against the timed library:** the pair is listed for you. Nothing is merged. |
| Shared concepts | 2 shared tiles, different relationship | Allowed. Recorded for information only. |

To settle an unclear pair, add it to `content/library/decisions.json`, then re-run the import (or `--status`):

```json
{ "pairs": { "idA | idB": "distinct" } }
```

The two ids are sorted and joined with `" | "`. Use `"distinct"` when both relationships stay, or `"same"` when they are one relationship.

## Pools

Each record has an explicit `pool`:

| Pool | Meaning |
|---|---|
| `systemsStarter` | One of 20 connections reserved for its system's five starter boards (`starterBoard` names the board) |
| `daily` | Approved and unique, reserved for Daily |
| `review` | Not approved yet |
| `held` | Possible duplicate waiting for a decision |
| `duplicate` | Same relationship as another record |
| `needsFix` | Structurally incomplete |
| `excluded` | Rejected |

**Starter boards.** Each system reserves 20 connections for five starter boards, provided they can form fair boards. Once formed, a starter board stays fixed through later uploads and revisions unless one of its members stops being eligible.

A board is structurally fair when it meets all of these:

- it has one connection per difficulty tier
- no tile text repeats (so there is one solution)
- no two of its connections share a title or two concept tags
- no two of its connections are possible duplicates

Whether a tile medically also fits another group still needs a person to judge. When a file supplies `nearMisses`, they are recorded so a reviewer can check them.

**Shortages.** When a system cannot fill five boards, the report gives the shortfall and the approved count per difficulty. Nothing is invented or reused to fill the gap.

**Daily.** Every other approved, unique connection is reserved for Daily. The report gives two Daily figures:

- an **estimate**: connections ÷ 4
- the number of **disjoint fair boards actually formed** from that pool

## At activation (not done yet; only when every upload is in)

1. Generate an app module from `library.json` with only the `systemsStarter` and `daily` pools.
2. **Daily:**
   - Every Daily already published stays exactly as it was: the pinned Dailies in `dailyLock.js`, plus every date up to the activation date. These are locked before the switch, so ids `daily-YYYY-MM-DD`, results and streaks are untouched.
   - New dates draw only from the `daily` pool.
3. **Systems:**
   - Each system starts from its five starter boards.
   - It grows only from Dailies that have already been released, so future Daily content is never spent early.
4. **3 Minutes and Race:** draw only from the timed library, minus `timedExclusionsAtActivation`.
5. **Every selection path follows the same split:**
   - bundled content
   - Supabase library additions (`mergeBank` needs a library column)
   - generators: `buildDailyFromSeed`, `assembleSystemPuzzle`, `autoGeneratePuzzles`, `composeNextRound`, `buildRaceChallenge`
   - fallbacks

   A mode with too little content in its own library reports a shortage. It never falls back to the other library.
6. Player progress (history, XP ledger, streaks, Systems mastery) is keyed by puzzle and category ids. It is kept as is.

## Checks

```
node scripts/library/test.mjs          # importer checks on placeholder rows (21 checks)
node scripts/library/timed-snapshot.mjs  # refresh the timed-library manifest
```
