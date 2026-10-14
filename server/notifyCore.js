// ---------------------------------------------------------------------
// Email notifications for new reports and suggested connections.
// ---------------------------------------------------------------------
// The forms write to Supabase (public.reports, migration 0005, and
// public.connection_submissions, migration 0008). A Supabase Database Webhook
// on each table (INSERT) calls POST /api/notify (api/notify.js), which sends
// one plain-text email per new row through Resend. See EMAIL_SETUP.md.
//
// Nothing secret is in the repository: the Resend key, the webhook secret and
// the addresses come from environment variables set in Vercel.
//   RESEND_API_KEY          Resend API key (server only)
//   NOTIFY_WEBHOOK_SECRET   shared secret; the webhook sends it in the
//                           x-plexus-webhook-secret header
//   NOTIFY_TO               where emails go (default contact@playplexus.com)
//   NOTIFY_FROM             sender on a domain verified in Resend
//                           (default "Plexus <notifications@playplexus.com>")
// Emails are plain text, so nothing a player types can run as HTML.
import { timingSafeEqual } from 'node:crypto'

export const DEFAULT_TO = 'contact@playplexus.com'
export const DEFAULT_FROM = 'Plexus <notifications@playplexus.com>'

const REASONS = { medical: 'Medical accuracy', ambiguous: 'Ambiguous connection', typo: 'Typo', technical: 'Technical problem', other: 'Other', account: 'Account or progress', feedback: 'Feedback or idea' }
const clip = (s, n) => {
  const t = String(s ?? '').replace(/\r/g, '').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}
const oneLine = (s, n) => clip(String(s ?? '').replace(/\s+/g, ' '), n)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Builds { subject, text, replyTo } for one new row, or null for anything else.
export function buildEmail(table, r) {
  if (!r || typeof r !== 'object') return null
  const when = r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : ''
  if (table === 'reports') {
    const support = r.kind === 'support'
    const reason = REASONS[r.reason] || oneLine(r.reason, 40)
    const subject = support ? `Plexus support: ${reason}` : `Plexus report: ${reason}${r.connection_title ? ` · ${oneLine(r.connection_title, 80)}` : ''}`
    const lines = [
      support ? 'A player sent a support message.' : 'A player reported a connection.',
      '',
      `Reason: ${reason}`,
      ...(support ? [] : [`Connection: ${oneLine(r.connection_title, 300) || '(not given)'}`, `Tiles: ${(r.tiles || []).map((t) => oneLine(t, 80)).join(', ') || '(not given)'}`, `Mode: ${oneLine(r.game_mode, 20) || '-'}${r.puzzle_date ? ` · ${r.puzzle_date}` : ''}`, `Puzzle: ${oneLine(r.puzzle_id, 120) || '-'} · Connection id: ${oneLine(r.category_id, 200) || '-'}`]),
      '',
      'Message:',
      clip(r.description, 2000),
      '',
      `Reply to: ${r.contact_email && EMAIL_RE.test(r.contact_email) ? r.contact_email : '(no email given)'}`,
      `Sent: ${when} · App ${oneLine(r.app_version, 60) || '-'} · Report id ${oneLine(r.id, 60)}`,
      '',
      'Open it in Supabase: Table Editor > reports.',
    ]
    return { subject, text: lines.join('\n'), replyTo: r.contact_email && EMAIL_RE.test(r.contact_email) ? r.contact_email : null }
  }
  if (table === 'connection_submissions') {
    const subject = `Plexus suggestion: ${oneLine(r.title, 100)}`
    const lines = [
      'A player suggested a connection. It is waiting in the review queue (status: pending).',
      '',
      `Title: ${oneLine(r.title, 120)}`,
      `Organ system: ${oneLine(r.system, 60)}`,
      'Four concepts:',
      ...(r.tiles || []).slice(0, 4).map((t, i) => `  ${i + 1}. ${oneLine(t, 80)}`),
      '',
      'Why they belong together:',
      clip(r.explanation, 1500),
      '',
      `Source: ${oneLine(r.source, 500) || '(none given)'}`,
      `Sent: ${when} · App ${oneLine(r.app_version, 60) || '-'} · Suggestion id ${oneLine(r.id, 60)}`,
      '',
      'Open it in Supabase: Table Editor > connection_submissions.',
    ]
    return { subject, text: lines.join('\n'), replyTo: null }
  }
  return null
}

function sameSecret(a, b) {
  const x = Buffer.from(String(a || ''))
  const y = Buffer.from(String(b || ''))
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y)
}

// { status, json }. `send(message)` posts to the mail provider and resolves
// { ok, error }. Only INSERTs on the two tables send anything.
export async function handleNotify({ headers = {}, body }, { env = {}, send }) {
  if (!env.NOTIFY_WEBHOOK_SECRET || !env.RESEND_API_KEY) return { status: 503, json: { ok: false, reason: 'not-configured' } }
  const given = headers['x-plexus-webhook-secret'] || headers['X-Plexus-Webhook-Secret']
  if (!sameSecret(given, env.NOTIFY_WEBHOOK_SECRET)) return { status: 401, json: { ok: false, reason: 'bad-secret' } }
  if (!body || body.type !== 'INSERT' || body.schema !== 'public') return { status: 200, json: { ok: true, skipped: 'not-an-insert' } }
  const mail = buildEmail(body.table, body.record)
  if (!mail) return { status: 200, json: { ok: true, skipped: 'other-table' } }
  const message = {
    from: env.NOTIFY_FROM || DEFAULT_FROM,
    to: (env.NOTIFY_TO || DEFAULT_TO).split(',').map((s) => s.trim()).filter(Boolean),
    subject: mail.subject,
    text: mail.text,
    ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
  }
  const r = await send(message)
  if (!r || !r.ok) return { status: 502, json: { ok: false, reason: 'send-failed', error: r?.error || null } }
  return { status: 200, json: { ok: true } }
}

// Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
export function resendSender(apiKey, fetchImpl = fetch) {
  return async (message) => {
    try {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(message),
      })
      if (res.ok) return { ok: true }
      const t = await res.text().catch(() => '')
      return { ok: false, error: `HTTP ${res.status} ${t.slice(0, 200)}` }
    } catch (e) {
      return { ok: false, error: String(e?.message || e) }
    }
  }
}
