// Vercel serverless function: POST /api/race
// The only place the Supabase service-role key is used. It is read from the
// SUPABASE_SERVICE_ROLE_KEY environment variable (set in Vercel, never in the
// repository and never sent to the browser). See server/raceCore.js for what
// each action does and supabase/migrations/0006_race_rewards.sql for the
// database side.
import { createClient } from '@supabase/supabase-js'
import { handleRace } from '../server/raceCore.js'

let admin = null
function client() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!admin) admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return admin
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method' })
    return
  }
  const sb = client()
  if (!sb) {
    res.status(503).json({ ok: false, reason: 'race-server-not-configured' })
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
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const out = await handleRace(
    { token, body },
    {
      rpc: async (fn, args) => {
        const { data, error } = await sb.rpc(fn, args)
        if (error) throw new Error(error.message)
        return data
      },
      getUser: async (t) => {
        const { data, error } = await sb.auth.getUser(t)
        return error ? null : data?.user || null
      },
    }
  )
  res.status(out.status).json(out.json)
}
