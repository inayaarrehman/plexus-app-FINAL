# Race server setup (Mutation, CRISPR, Race rewards)

Races are run by a small server function so results, rewards and power-ups can't be faked from a browser. Signed-in players race as themselves. Signed-out players race as guests: when they create or join a race the app gets an anonymous Supabase session (kept separate from any account session) and the server runs the race the same way, but guests never earn Race rewards. If the server or anonymous sign-ins are not set up, the app falls back to the original shared-code Race (no rewards, no Chaos). Nothing else in the app depends on this.

## One-time setup

1. **Supabase SQL editor**: run `supabase/migrations/0006_race_rewards.sql`, then `supabase/migrations/0007_chaos_loadout_guests.sql`. Each is safe to run again, but once 0007 has run, do not run 0006 again (it would bring back the old function versions); run 0007 again afterwards if that happens. Your earlier pending migrations (0004, 0005) are unrelated and can run before or after them.
2. **Supabase → Authentication → Sign In / Providers → Allow anonymous sign-ins**: turn it on so guests can race on the server. Leave it off to keep guests on the shared-code Race. Supabase rate-limits anonymous sign-ins per IP address; turning on CAPTCHA protection there is optional.
3. **Supabase → Project Settings → API**: copy the `service_role` key. Never paste it into the code or share it.
4. **Vercel → plexus-beta → Settings → Environment Variables** (Production, and Preview if you test there):
   - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key
   - `SUPABASE_URL` = your project URL (the same value as `VITE_SUPABASE_URL`; optional if that one is already set)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must already be set for sign-in to work.
5. **Supabase → Database → Replication**: confirm `race_matches`, `race_participants` and `race_events` are listed under `supabase_realtime` (the migration adds them; if Realtime is off, the app still works through its 1.5 second polling fallback).
6. Redeploy on Vercel after adding the variables.

## How to check it is live

Open the site signed in, start a Race: the entry screen says "Signed-in races are scored by the Plexus server". Signed out, Race says "You're racing as a guest". A POST to `/api/race` with `{"action":"config"}` returns `{"ok":true,...}`; any other action without a session returns `{"reason":"signed-out"}`; `{"reason":"race-server-not-configured"}` means step 4 is missing.

## What the server decides

- Answers are scored on the server by rebuilding the round from the race code. The browser sends which option was tapped, never a score or a winner.
- A race **qualifies** for rewards only if: both players are different signed-in accounts, the match was started through the server, both answered all 10 rounds, each got at least 3 right, each run took at least 20 seconds, and neither lost contact for more than 60 seconds. A tie counts as a race, not a win.
- **Rewards**: one Mutation per 5 qualifying wins, one CRISPR per 10 qualifying races (win or lose). Caps of 3 each; extras wait as pending claims and move in when a slot frees. Per player per day (in the player's own time zone, changeable once a week): at most 3 qualifying races against the same opponent (A vs B = B vs A) and 6 in total.
- **Guests** can create, join and play Classic and Chaos races. A race with a guest never qualifies (both players must be signed-in accounts) and guests get no inventory or reward progress.
- **Chaos introductory loadout** (`race_config` key `chaos_free_loadout`, 1 = on, the default from 0007): every player who accepts Chaos, guests included, gets one temporary Mutation and one temporary CRISPR for that race only. They are stored on that race's player row, end with the race, and never touch the inventory. While it is on, earned Mutations and CRISPRs are not equipped or spent in Chaos; they stay in the inventory and keep accruing. Set it to 0 to go back to equipping earned items only. Classic races have no power-ups either way.
- **Chaos**: both players accept and see both loadouts before the start. One Mutation and one CRISPR per player per race. Mutation scrambles letters on the opponent's answer tiles for 2 seconds; no overlap, 5 seconds of immunity after each effect, never against a finished or disconnected player. A rejected attack spends nothing; a blocked one spends the Mutation and the CRISPR. An unused earned CRISPR stays in the inventory.
- Every number above lives in the `race_config` table and can be changed there without a code change.

These limits make farming harder; they do not stop collusion or a second account, and a modified browser could still read answers (the question bank ships with the app). The server prevents fabricated results, double awards, double spending and actions on someone else's match.

## Tests

```
# local Postgres with Supabase-like stubs (see scripts/race-sql-setup.sql)
npm run test:race-db
npm run test:race-server
npm run test:tools
```
