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
- **Preserved as written:** the full original row is kept verbatim under `content.raw`, alongside the mapped fields: tiles, tile explanations, explanation, remember line, qualifiers, sources, verification status and reviewer fields. Any column the importer does not recognise is kept under `content.extra`. Content is never rewritten. A malformed row is reported, not repaired.

## Verification status

Labels are stored exactly as written and never relabelled. `content/library/status-map.json` decides which labels make a row eligible, and only the project owner changes it. Every eligible row records its basis:

| Basis | Labels | Meaning |
|---|---|---|
| `human` | `approved`, `verified`, `reviewed and approved`, `final` | Independent human verification |
| `ai-review` | `AI_REVIEWED_PASS` | AI review (OpenEvidence) under the owner's authorized workflow. Eligible for staging, `humanVerified: false`. Never presented as human verified. |
| `ai-review-revised` | `AI_REVIEWED_REVISED` | Eligible only when `revision-reviews.json` records that the review endorsed the final corrected row with nothing outstanding. The determination is tied to the row's content hash, so a later change to that row holds it again. |

`rejected`, `retired` and `withdrawn` are excluded. Any other label stays unresolved: kept, but in no pool.

To see what the pools would look like if a label were approved, without saving anything, add `--dry-run --assume-approved "LABEL"`. `--assume-approved` is refused without `--dry-run`.

## Duplicate checks

Every connection is compared:

- with every other connection in the new library: the same system and all earlier uploads
- with the timed library

Tiles and titles are compared after normalising case, punctuation, plurals and word order.

- **Titles** are also reduced to a subject: filler such as "classic" or "source-listed" is dropped, and the kind of relationship is kept. So "Conditions that can produce X" matches "Causes of X", but "Causes of X" never matches "Findings of X".
- **Alternate names.** Subjects are also compared through each row's accepted alternate names, so "PNH diagnostic clues" meets "Clues to paroxysmal nocturnal hemoglobinuria".
- **Tile wording.** Direction synonyms count as the same word (elevated = increased = raised; reduced = decreased = low). Generic trailing words (vaccine, use, exposure, infection, therapy) are ignored, so "MMR vaccine" = "MMR". "Disease" and "syndrome" are kept, because Cushing disease and Cushing syndrome differ.
- **Reworded tiles** ("Overriding aorta" / "Aorta overriding the septum") are caught by comparing the words used across all four tiles, when the subjects also agree. These are always held for a decision, never merged automatically.
- **Reviewer-separated pairs.** When a row's notes name the other row's id (for example "shares 3 tiles with ENDO-034 - do not co-place"), the reviewer saw both and kept them as separate connections. They are recorded as distinct and kept off the same board. Different wording, ids, tile order or file format do not make a connection new.

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

**Starter boards.** Each system reserves 20 connections for five starter boards. Board checks come in two strengths.

**Block.** The board cannot be formed when any of these apply:
- the same tile appears twice, including a tile's alias in parentheses ("Cu/Zn superoxide dismutase (SOD1)" also blocks "SOD1")
- two connections share a title or accepted alternate name
- two connections may be the same connection
- an explicit reviewer instruction ("do not co-place", "do not combine", "keep separate", "keep ... off this board", "avoid ... on the board") names the other connection's id or one of its tiles

**Flag.** The board can be formed, but needs an ambiguity review before publication when:
- a note mentions the other connection's id or tiles without such an instruction
- a tile of one connection is named in another's title or explanation
- two connections share two concept tags
- two connections are about the same condition ("Down syndrome physical findings" and "Down syndrome congenital associations")
- a general board instruction, or any other note about the board or puzzle, names no specific id or tile ("avoid additional homocysteine-elevating tiles"), so a person has to judge whether the other groups qualify

Difficulty balance is a preference: mixed boards with a harder connection are chosen first, but a board where all four are the same difficulty is allowed. Boards without flags are preferred.

**Board states:**

| State | Meaning |
|---|---|
| `ready` | Passes structural checks, with no flags or with flags cleared. Publishable. |
| `review` | Passes structural checks, but has ambiguity flags. Clear it with `"boards": { "<id>": "cleared:<signature>" }` in `decisions.json`. The signature changes whenever a member's content changes, so a clearance lapses automatically after a revision. |
| `blocked` | A previously formed board that no longer passes, for example after a revision. It keeps its id and its reservation, but cannot be activated or published until it is fixed or you set `"rebuild"`. |

Manual ambiguity flags for medical overlaps the checks cannot see live in `board-flags.json`. Each flag names who raised it and is tied to the board's signature.

Starter boards are never reshuffled by later uploads; they are revalidated on every import.

A reviewer note asking for a connection to be reserved for other content ("reserve for embryology content") keeps it out of its system's starter boards. It stays in the shared Daily pool. To override, add `"starterAllow": { "<id>": true }` to `decisions.json`.

**Shortages.** When a system cannot fill five boards, the report gives the shortfall and the approved count per difficulty. Nothing is invented or reused to fill the gap.

**Daily.** Every other eligible, unique connection is reserved for Daily. Daily connections are **not** assigned to boards in staging. They stay one shared pool so later subjects can form mixed-system boards. Each report gives two figures:

- an **estimate**: connections ÷ 4
- a **capacity check**: how many disjoint boards passing structural checks can be formed from the whole pool right now, how many of those would need an ambiguity review, and how many mix systems

The capacity check is recomputed each time and saves nothing.

## At activation (not done yet; only when every upload is in)

1. Generate an app module from `library.json` with only the `systemsStarter` and `daily` pools.
2. **Daily:**
   - Every Daily already published stays exactly as it was: the pinned Dailies in `dailyLock.js`, plus every date up to the activation date. These are locked before the switch, so ids `daily-YYYY-MM-DD`, results and streaks are untouched.
   - New dates draw only from the `daily` pool.
3. **Systems:**
   - Each system starts from its five starter boards.
   - It grows only from Dailies that have already been released, so future Daily content is never spent early.
4. **3 Minutes and Race:** draw only from the timed library, minus `timedExclusionsAtActivation`.
5. **Difficulty colours:** new-library boards need not have one connection per tier (Biochemistry has no expert, for example). The board renderer must assign colour order from the board, not assume levels 1 to 4 are unique.
6. **Every selection path follows the same split:**
   - bundled content
   - Supabase library additions (`mergeBank` needs a library column)
   - generators: `buildDailyFromSeed`, `assembleSystemPuzzle`, `autoGeneratePuzzles`, `composeNextRound`, `buildRaceChallenge`
   - fallbacks

   A mode with too little content in its own library reports a shortage. It never falls back to the other library.
7. Player progress (history, XP ledger, streaks, Systems mastery) is keyed by puzzle and category ids. It is kept as is.

## Subjects and app systems

Each upload is staged under its own subject. "Genetics" is not one of the app's system names: the app combines it with Biochemistry as "Biochemistry/Genetics". It is staged separately with its own five starter boards. At activation, either add a Genetics system to the app or merge it into Biochemistry/Genetics, which would then have ten starter boards.

## Review queue, status counts and saving

- **`review-queue.md` / `review-queue.json`** are rebuilt on every import. They keep six categories apart:
  1. medical / source holds
  2. duplicate decisions in the new library
  3. timed-library overlaps
  4. board ambiguity reviews
  5. blocked boards
  6. difficulty-calibration warnings

  Each duplicate or overlap shows both titles, all eight tiles side by side, both statuses and the shared relationship.
- **Difficulty-calibration notes** ("may be too transparent for a Hard puzzle") are listed separately and never block or flag a board. Notes that confirm a difficulty ("Hard difficulty appropriate") are ignored.
- **Status counts** keep review outcome apart from current use:
  - **passed medical review:** eligible under the status map, with the basis recorded
  - **held for medical/source review**
  - **held or set aside as duplicates**
  - **usable now:** passed review and not held
- **Saving.** Every non-dry import saves `library.json`, which holds:
  - records with their version `history`
  - starter-board allocations and their states
  - match pairs and counts

  It also saves `review-queue.*`, `reports/`, the uploads, and `MANIFEST.json` (checksums of every staged file). `node scripts/library/verify.mjs` checks a saved or restored copy against the manifest, and confirms `active` is false and nothing in `src/` reads staging.

## Checks

```
node scripts/library/test.mjs          # importer checks on placeholder rows (66 checks)
node scripts/library/timed-snapshot.mjs  # refresh the timed-library manifest
```
