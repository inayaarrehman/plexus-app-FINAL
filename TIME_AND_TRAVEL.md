# Dates, resets and travel

All date logic lives in `src/utils/calendar.js`. Nothing else in the app turns time into days.

## Two kinds of time

- **Instants** are absolute timestamps (UTC), for example when a puzzle was finished (`completedAt`, ledger `at`). They are never used as a date.
- **Calendar dates** are `YYYY-MM-DD` keys in the player's time zone, for example which Daily it is. A Daily's identity is its date: the puzzle for 2026-10-07 is `daily-2026-10-07` for everyone in the world. Each player reaches it at their own local midnight.

The time zone is the browser's IANA zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`). Day arithmetic uses date keys, never "add 24 hours", so daylight-saving changes cannot move a date. Midnights are found by asking `Intl` for the zone's offset at that moment, so 23- and 25-hour days end at the right instant. A zone whose midnight is skipped by a clock change starts the day at its first instant.

## Resets

- **Daily:** at local midnight. Home shows "Resets at midnight · <City> time".
- **This Week:** Monday 00:00 to Monday 00:00, local time.
- **Open tabs:** the app re-checks the date and time zone when the tab is shown again or focused, once a minute while visible, and at local midnight. A tab left open overnight, or a laptop that changed time zones, moves to the new date without a reload.

## What is stored

- **Daily history:** each finish stores `completedAt` (instant), `completedDay` (the local date at that moment) and `completedOffset` (the UTC offset in minutes at that moment), separately from the puzzle's date key.
- **XP ledger:** each event stores `at` (instant) and `d` (the local date it was earned on). Rewards have stable ids keyed by what they are for (`daily:2026-10-07`, `rounds:2026-W41`), so nothing can pay twice.
- **Cloud:** the `user_daily_results` table already keeps `puzzle_date` (a date) apart from `completed_at` (a timestamptz). No change needed.

## Travel policy

1. **Today's Daily is always the player's current local date.** After a trip, the app follows the new date.
2. **Finished stays finished.** Results and rewards are keyed by the puzzle's date, so moving back across a date line shows that Daily as already done. It never pays again or erases anything. Moving forward simply reaches a new date.
3. **On time is judged where you were.** A Daily counts toward the streak when it was finished on its own date in the time zone you were in when you finished (`completedDay`). Older results without that field count when the finish instant falls on that date somewhere on Earth (UTC-12 to UTC+14), so viewing them from another zone later cannot make them late.
4. **A date lost to travel does not break a streak.** Flying east can skip a calendar date entirely. A one-date gap between streak days is forgiven when both of these hold:
   - the player moved at least 3 hours east (by the stored UTC offsets)
   - the two finishes were under 48 hours apart

   The same allowance applies to today before it is played. A daylight-saving change (1 hour) never counts. No Streak Shield is spent on such a gap. Results from before offsets were stored get no allowance.
5. **Weekly goals count events on the date they were earned** (`d`), so later travel never moves an event into another week. The weekly reward is paid once per week. It is also checked by date range, so a reward recorded under an older week label, or in another zone, still counts as paid.
6. **Modes stay open after travel west.** The clock guard remembers the newest Daily the device has reached. If the player finished that newer Daily and then crossed back to the previous date, 3 Minutes, Race, Systems and the Archive stay open. Turning the clock back to a finished date still does not unlock anything while a newer Daily is unfinished.

## Upgrading existing saves

- The app used the device's local date before this change too, so existing Daily history keys and reward ids are already calendar dates. No data migration is needed and nothing is discarded.
- Results saved before `completedDay` existed are judged by rule 3 above.
- **Week labels:** the old week label (`2026-W40`) was one week low between the spring daylight-saving change and the autumn one in years starting on a Thursday, such as 2026. The label is now the correct ISO week. Rule 5's date-range check keeps a reward already paid this week from being paid again under the new label.
- **Goal rotation:** the running week index that rotates weekly goals is computed exactly as before, so nobody's goals change on upgrade.

## Checks

`node scripts/datetest.mjs` covers all of the above. Run it under several zones, for example `TZ=America/Los_Angeles`, `TZ=Asia/Tokyo` and `TZ=Pacific/Auckland`.
