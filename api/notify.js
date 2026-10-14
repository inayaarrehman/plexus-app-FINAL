// Vercel serverless function: POST /api/notify
// Called by Supabase Database Webhooks when a report or a suggested
// connection is saved; emails it to you. Keys come from environment
// variables set in Vercel (see server/notifyCore.js and EMAIL_SETUP.md).
import { handleNotify, resendSender } from '../server/notifyCore.js'

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method' })
    return
  }
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }
  const env = process.env
  const out = await handleNotify({ headers: req.headers, body }, { env, send: resendSender(env.RESEND_API_KEY) })
  res.status(out.status).json(out.json)
}
