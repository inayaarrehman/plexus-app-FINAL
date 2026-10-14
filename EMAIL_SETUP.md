# Getting reports and suggestions by email

Report this connection, the Support form and Submit a Connection save into your Supabase database (they never sent email):

| Form | Table (Supabase → Table Editor) | Migration |
|---|---|---|
| Report this connection, Support | `reports` (`kind` is `connection` or `support`) | 0005 |
| Submit a Connection | `connection_submissions` | 0008 |

If those tables do not exist, run the two migrations in Supabase → SQL Editor first; until then the forms show "didn't go through".

To also get an email for every new row, the app has `POST /api/notify`. Supabase calls it when a row is added, and it emails you through Resend.

## 1. Resend (sends the email)
1. Sign up at resend.com.
2. Domains → Add `playplexus.com` and add the DNS records it shows at your domain host. Wait until it says Verified.
3. API Keys → Create (sending access is enough). Copy it.

## 2. Vercel (environment variables)
Project → Settings → Environment Variables, for Production:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the key from Resend |
| `NOTIFY_WEBHOOK_SECRET` | a long random string you make up (for example from a password manager) |
| `NOTIFY_TO` | optional; defaults to contact@playplexus.com (comma-separate several) |
| `NOTIFY_FROM` | optional; defaults to `Plexus <notifications@playplexus.com>` (must be on the verified domain) |

Redeploy after adding them.

## 3. Supabase (calls the endpoint)
Database → Webhooks (Integrations → Database Webhooks) → Create a new hook. Make two, one per table:

- Table: `reports` (second hook: `connection_submissions`)
- Events: Insert only
- Type: HTTP Request, Method POST
- URL: `https://playplexus.com/api/notify`
- HTTP header: `x-plexus-webhook-secret` = the same value as `NOTIFY_WEBHOOK_SECRET`

## 4. Test
Send a report from the site. The email arrives within a few seconds; replying goes to the player when they left an email. If nothing arrives, open the webhook's logs in Supabase: 401 means the secret differs, 503 means the Vercel variables are missing, 502 means Resend refused (usually an unverified sender domain).
