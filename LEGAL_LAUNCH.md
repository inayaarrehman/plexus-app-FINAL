# Legal and privacy: launch steps (October 14, 2026)

This pass lined up the app, the database and the public pages. It is launch preparation, not a certification that Plexus complies with any law.

## Deploy, in this order

1. Supabase SQL editor: migrations up to `0011` if not run yet, then `0012_privacy_deletion_retention.sql`.
2. Supabase Dashboard > Integrations > Cron: enable it, then run `0012` again. The end of the file schedules `privacy_cleanup()` daily (job `plexus-privacy-cleanup`). Until Cron runs it, the retention periods on the Privacy Policy are not being applied. Check with `select * from cron.job;`.
3. Deploy the app. The Terms and Privacy Policy versions are `2026-10-14` (src/legal/config.js); every visitor sees a short notice on Home once.
4. Prelaunch reset (Saturday): `supabase/reset/2026-10-14-prelaunch-progression-reset.sql`. Once you have checked the result, drop its `backup_20261014_*` tables. They hold copies of progress and race data that account deletion does not reach.

## Check in the dashboards (not visible from the code)

- Supabase Auth: anonymous sign-ins on (guest racing), email confirmation as you want it, and a custom SMTP sender for production. Supabase's built-in email sender is limited and not meant for production use.
- Supabase project region and plan (backups and log retention). The Privacy Policy only says providers may store data in the United States and other countries.
- Database Webhooks for `reports` and `connection_submissions` send to `/api/notify` with the shared secret (EMAIL_SETUP.md). Send one real test report and confirm it arrives at contact@playplexus.com.
- Vercel environment variables: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` and `NOTIFY_WEBHOOK_SECRET` are server-only (no `VITE_` prefix).

## Retention settings

`public.privacy_settings` holds the periods (days). Change a row there and update the Privacy Policy and its version in the same change.

| key | days | what |
|---|---|---|
| guest_race_ids | 30 | guest race IDs with no race in this time are deleted |
| race_details | 30 | per-round answers and in-race events are cleared after a race ends |
| stale_lobbies | 7 | lobbies that never started |
| browser_ids | 7 | the random browser ID on reports and suggestions |
| report_emails | 365 | reply emails on connection reports |
| support_messages | 730 | support messages |
| closed_suggestions | 365 | rejected or duplicate suggestions |

## Requests from players

- Account deletion is self-serve (Account > Delete account). Guests delete their race ID from Account in the same browser.
- Requests by email (copy, correction, deletion of something sent without an account): reply within 30 days. For accounts, answer only when the request comes from the account's email. Never send one player another player's race data.
- A child under 13: in the SQL editor, `select public.privacy_delete_user((select id from auth.users where email = '...'));` deletes the account the same way Delete account does. Then delete any reports, messages or suggestions they sent without an account, found by the email or date they give.

## Tests

`npm run test:legal` (pages match the code) and `npm run test:privacy-db` (deletion, access and retention on a Postgres with every migration applied).
