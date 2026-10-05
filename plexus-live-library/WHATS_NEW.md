# Plexus — Daily rotation, Live Race, and PWA (update)

Three additions, all built on the existing app with **no new setup required** and
no change to gameplay or identity.

## 1. Daily board changes every day
`src/utils/dailyPuzzle.js` now generates a **deterministic daily puzzle from the
verified connection bank**, seeded by the date (`PLEXUS-YYYY-MM-DD`):
- The board is **different every day**, drawn from 180+ verified connections
  (previously it cycled a tiny authored pool, which felt "stuck").
- It is **identical for everyone** on a given calendar date and **resets at local
  midnight** — same model as NYT Connections.
- Fully **client-side**: no database, no migration, no action needed.
- The three hand-authored launch dailies (Sep 17–19) are still served on their
  own dates for the archive.

## 2. Live private racing (two players)
`src/lib/liveRace.js` adds real head-to-head over **Supabase Realtime**
(broadcast + presence):
- One player taps **Create a race** and shares the code or link; the other
  **enters the code**. Either taps **Start** and both race the same board at once.
- Live **opponent progress bar**, and a real **winner** at the end (more correct;
  ties break on time).
- Uses only the **anon key you already configured** — **no database tables, no SQL
  migration, and no login required**. Realtime is on by default in Supabase.
- Honest when alone: with no second player on the channel it's a normal solo
  timed run — it never fakes an opponent.
- The join set is still a deterministic function of the code, so both clients
  build the identical rounds; the channel only relays progress, never answers.

## 3. Installable app (PWA)
Plexus can now be **added to a phone's home screen** and opens full-screen like a
native app:
- `public/manifest.webmanifest`, app icons in `public/icons/`, and iOS/Android
  meta tags in `index.html`.
- `public/sw.js` — a service worker for offline support. It is **network-first for
  pages**, so a new Vercel deploy is always picked up when online (installing
  never traps players on a stale build).
- A small, dismissible **"Add to Home Screen"** hint (`InstallPrompt.jsx`): a real
  Install button on Android/Chrome, and the Share → Add to Home Screen tip on iOS.

## Rollout
1. Upload the contents of this folder into the **root** of `plexus-app-FINAL`.
2. Vercel auto-deploys. That's it — nothing to run in Supabase.
3. Verify:
   - Open the site on two days (or two devices) → the Daily board differs.
   - Open **Race** in two browser windows/devices, same code → you see each other
     live and get a winner.
   - On a phone, use the browser's **Add to Home Screen** → it opens full-screen.

## Not included yet (future, needs the `0002_daily_race.sql` migration)
Accounts, cross-device streaks, saved race history/leaderboards, and
admin-curated official dailies. None are required for the three features above.
