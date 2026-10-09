# Race server setup (Mutation, CRISPR, Race rewards)

Signed-in Races are run by a small server function so results, rewards and power-ups can't be faked from a browser. Players who are not signed in, or any deployment where the steps below are not done, keep the original shared-code Race (no rewards, no Chaos). Nothing else in the app depends on this.

## One-time setup

1. **Supabase SQL editor**: run `supabase/migrations/0006_race_rewards.sql`. It is safe to run again. Your earlier pending migrations (0004, 0005) are unrelated and can run before or after it.
2. **Supabase → Project Settings → API**: copy the `service_role` key. Never paste it into the code or share it.
3. **Vercel → plexus-beta → Settings → Environment Variables** (Production, and Preview if you test there):
   - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key
   - `SUPABASE_URL` = your project URL (the same value as `VITE_SUPABASE_URL`; optional if that one is already set)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must already be set for sign-in to work.
4. **Supabase → Database → Replication**: confirm `race_matches`, `race_participants` and `race_events` are listed under `supabase_realtime` (the migration adds them; if Realtime is off, the app still works through its 1.5 second polling fallback).
5. Redeploy on Vercel after adding the variables.

## How to check it is live

Open the site signed in, start a Race: the entry screen says "Signed-in races are scored by the Plexus server". A browser call to `/api/race` without a sign-in returns `{"reason":"signed-out"}`; `{"reason":"race-server-not-configured"}` means step 3 is missing.

## What the server decides

- Answers are scored on the server by rebuilding the round from the race code. The browser sends which option was tapped, never a score or a winner.
- A race **qualifies** for rewards only if: both players are different signed-in accounts, the match was started through the server, both answered all 10 rounds, each got at least 3 right, each run took at least 20 seconds, and neither lost contact for more than 60 seconds. A tie counts as a race, not a win.
- **Rewards**: one Mutation per 5 qualifying wins, one CRISPR per 10 qualifying races (win or lose). Caps of 3 each; extras wait as pending claims and move in when a slot frees. Per player per day (in the player's own time zone, changeable once a week): at most 3 qualifying races against the same opponent (A vs B = B vs A) and 6 in total.
- **Chaos**: both players accept and see both loadouts before the start. One Mutation and one CRISPR per player per race. Mutation scrambles letters on the opponent's answer tiles for 2 seconds; no overlap, 5 seconds of immunity after each effect, never against a finished or disconnected player. A rejected attack spends nothing; a blocked one spends the Mutation and the CRISPR. Unused CRISPR stays in the inventory.
- Every number above lives in the `race_config` table and can be changed there without a code change.

These limits make farming harder; they do not stop collusion or a second account, and a modified browser could still read answers (the question bank ships with the app). The server prevents fabricated results, double awards, double spending and actions on someone else's match.

## Tests

```
# local Postgres with Supabase-like stubs (see scripts/race-sql-setup.sql)
npm run test:race-db
npm run test:race-server
npm run test:tools
```
