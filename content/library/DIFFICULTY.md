# Puzzle difficulty and construction (October 2026)

How Plexus judges difficulty and builds puzzles in every mode, and how to rerun it.

## Content

| File | What it holds |
|---|---|
| `content/library/audit/difficulty-audit.json` | AI content audit of every eligible Daily/Systems connection: audience recognition 1 to 5, reasoning type, tile kinds, tile associations (facets), issues. |
| `content/timed/audit/difficulty-audit.json` | The same for the timed bank (3 Minutes, Race), plus near-miss findings. |
| `content/library/revisions.json`, `content/timed/revisions.json` | Revisions that passed two separate AI passes (finalize, then an independent check). Overlaid at activation; `library.json` keeps the original rows and their OpenEvidence labels. Basis `ai-revision-check`, never human verified. |
| `content/library/audit/revision-log.json` | Every proposed revision and its outcome (applied, rejected, failed the check), with the check notes. |
| `content/library/audit/rerate.json` | Fresh recognition ratings for revised connections. |
| `content/library/copy-edits.json` | Wording-only edits (removing "the source" from player text). Tiles unchanged. |
| `content/library/audit/explanation-check.json` | Independent AI check of every fuller explanation and tile note now served (`AI_CHECKED`, basis `ai-check`). An OpenEvidence import replaces them; set `AI_CHECKED_EXPLANATIONS_SERVED` in `scripts/library/lib.mjs` to false to hold them back. |
| `content/timed/audit/near-miss-check.json` | Timed wrong answers: kept, held as format giveaways, removed as wrong, and checked replacements. |
| `content/library/board-review.json` | AI fairness review of every rebuilt board. A failed board is never formed again, and the pair it named is kept apart everywhere. |
| `content/timed/audit/round-review.json` | AI fairness review of generated 3 Minutes rounds, by round of fixes. |
| `content/library/board-config.json` (optional) | Overrides for the board target (default 1 approachable, 2 moderate, 1 challenging) and scoring weights. |

## Daily and Systems boards

`scripts/library/boards.mjs` scores a whole 16-tile board: estimated difficulty mix against the target, wording that isolates a group (`src/utils/surfaceSignals.js`), tile kinds no other group uses, tempting cross-group associations, and fairness risks (a tile whose common association is another group's subject blocks the pair). `activate.mjs` builds with a seeded greedy start and local search, so the same inputs give the same boards.

Rebuild everything (a content reset; dates already played get new boards and players' saved puzzle progress is cleared once):

```
node scripts/library/activate.mjs --rebuild --epoch <new-label> --plan   # build, no outputs frozen
# review content/library/activation/plan-boards.json boards, record results:
node scripts/library/board-review.mjs add <reviews.json>
# repeat --plan until every board has a review, then:
node scripts/library/activate.mjs --rebuild --epoch <new-label>
node scripts/library/activate.mjs --check
```

A normal run without `--rebuild` reads the boards back from the ledger and never reshuffles them.

## 3 Minutes and Race

`src/utils/timedPacing.js` holds the difficulty mix per format (`TIMED_DIFFICULTY`) and the Race curve (`RACE_TIER_CURVE`, the same ten tiers in every race). Builders pick wrong answers that read like the right ones and reject rounds a wording pattern alone would solve. Mini Connections pairs groups from different systems with the same tile kind; Match the Link uses four systems and only concepts listed under one category; Double Agent wrong options are always checked near misses. Pairs found sharing members in review are listed in `TIMED_BLOCKED_PAIRS`. 3 Minutes passes over categories this device saw in recent sessions.

## Validation

```
node scripts/difficulty-test.mjs
node scripts/library/difficulty-validate.mjs --old <pre-change copy>
```

The second writes `content/library/activation/difficulty-validation.md`. All difficulty numbers are estimates from content metadata and wording signals, not player data, and no check proves medical uniqueness.
