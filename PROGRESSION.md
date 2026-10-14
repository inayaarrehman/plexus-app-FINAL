# Plexus progression (October 2026)

Every number below lives in `src/progression/config.js` (app) and `race_config` (Race server, migrations 0006, 0009, 0010, 0011). Change it there; nothing else needs to move.

## XP by mode

| Mode | XP |
|---|---|
| Daily (today's) | 75 for finishing, win or lose · +25 for solving · +5 / 10 / 15 / 20 per group solved · +25 perfect (won, no mistakes, no tools). Max 175. |
| Archive (past Daily, first finish) | 40 for solving + groups solved. A lost Archive Daily pays only its solved groups. |
| Systems | Solved board: 100 first try, 75, 50, then 25. Paid once per board. Every board a subject offers solved: +300 once. No daily taper. |
| 3 Minutes | 3 per correct answer, minus 1 per wrong answer (never below 0), up to 60 a session · +15 for a new personal best. |
| Race | 25 for a qualifying run (every round answered, at least 3 correct, at least 20 seconds) · +15 for a win. A run on this device with no live opponent: 10. |
| Timed limit | 3 Minutes and Race share one daily budget: first 150 XP full, then half rate up to 225. Resets at local midnight. |
| This Week | Any 2 of 3 goals (3 Dailies, 2 timed sessions, a Daily solved without a tool): 250 XP + a tool you pick. Once per week, Monday to Monday local time. |
| Streak milestones | 3, 7, 14, 30, 60, 100, 180, 365 days: 50 to 1000 XP, each once. |
| Coverage | One per 7 scheduled Dailies; at the cap of 2 it becomes a puzzle tool, or 50 XP if every tool is full. |

## Levels and unlocks

Cost of level L = round((100 + 70n + 6n²) / 10) × 10, n = L − 1. No maximum.

| Level | Total XP | Reward |
|---|---|---|
| 2 | 100 | Consult +1 |
| 3 | 280 | Rule Out (new) |
| 5 | 900 | Second Opinion (new) |
| 6 to 11 | 1,380 to 5,860 | one puzzle tool every level (Consult, Rule Out, Second Opinion in turn) |
| 12 | 7,260 | Consult +1, CRISPR unlocks (also needs 5 counted races) |
| 16, 20, 24 … | 14,940, 26,520, 42,780 … | CRISPR +1 (plus that level's tool) |

Never more than two levels without a reward. Puzzle tools start with a limit of 5 each; extras wait as claims.

## Milestones

Level 10, 20 and 30, then every 5 levels (35, 40, 45 ...). Each milestone:

* grows the player's badge (a plexus drawn from the level number: more branches each time, the endings link into a web from Level 30, a second ring from Level 40);
* gives one Consult, one Rule Out and one Second Opinion (`ms:<level>:<tool>`, paid once);
* raises every puzzle tool's limit by one, with no maximum (5, then 6 at Level 10, 7 at 20, 8 at 30 ...). Coverage stays at 2, Race items at 3;
* from Level 20, one CRISPR, paid by the Race server once CRISPR is unlocked (migration 0011, `race_level_grants` item `crispr-ms`). A milestone on a CRISPR level (20, 40 ...) pays both. None at Level 10, which comes before the unlock.

Where it shows: the badge sits in the level ring on My Plexus, beside the level on Home, and on both player cards in the Race lobby (the opponent's level comes from the server, stored when they join). Crossing a milestone plays the Milestone reached moment once per device (tap to skip; reduced motion shows it still).

## Tool arrivals

Each tool has its own short animation, played where it is earned: the result card (level tools, Coverage), the Milestone reached list, the weekly choice, a claim in Your Tools, the Race results (Mutation, the CRISPR rare find) and the Race cards in Your Tools (level and milestone CRISPRs). Each plays once; several play in turn.

## Race power-ups

* **Mutation**: one for every 5 counted race wins.
* **CRISPR**: unlocks at Level 12 once 5 races have counted. One at Level 12, one every 4 levels after, and a **2% chance after each eligible Race win**.
* **Eligible win** (all checked on the server): a win (not a tie) in a race settled as finished; both players different signed-in accounts; every round answered, at least 3 correct and at least 20 seconds each; contact kept; within the counted limits (6 counted races a day, 3 against the same opponent); CRISPR unlocked for the winner.
* The roll happens once per player per race, inside the database transaction that writes the reward log row (`race_reward_log.crispr_roll`, `crispr_drop`). That row is the idempotency key, so refreshes, retries, reconnects and duplicate requests never roll again, and the item and the record are saved together. No pity timer: every eligible win is an independent 2%. Over the cap of 3 a CRISPR waits as a claim.
* Caps: 3 of each item held. CRISPR only blocks a Mutation, so holding one never scores points.

## Trust

* Race results, Mutation, CRISPR and the drop are decided by the server (`api/race`, migrations 0006 to 0010).
* XP is recorded by the app and synced. The server uses it only for the CRISPR level, after ignoring entries dated in the future or before the account existed and capping 1000 XP per entry and 3000 per day (`race_trusted_xp`). CRISPR also needs 5 counted races, which only the server records.
* Every award is keyed by a stable id. Saving merges with what is stored (two tabs), applying a cloud copy merges with what is stored (a sync in flight), and cloud writes are read-merge-write with a check that the row did not change meanwhile (two devices).

## Rerun the checks

```
node scripts/progression-test.mjs
node scripts/progression-sim.mjs
PGTEST="psql -h <host> -p <port> -U postgres -d <db>" node scripts/race-sql-test.mjs
```

The simulator models assumed players (see `PROFILES` in the script). It is not player data.

## Run order for this update

1. Supabase SQL editor: migrations 0005, 0008, 0009 if not run yet, then `0010_progression_crispr_drop.sql`, then `0011_milestones_race_levels.sql`.
2. Prelaunch only: `supabase/reset/2026-10-14-prelaunch-progression-reset.sql` (backs up, then clears test races, Race items and the cloud copy of progress).
3. Deploy. Each device clears its saved progress once on first load (progress epoch).
