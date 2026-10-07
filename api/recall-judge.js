// ---------------------------------------------------------------------
// Vercel serverless function: semantic check for "Name the connection".
// ---------------------------------------------------------------------
// Called by the app only when its on-device matcher is unsure. Compares a
// player's phrase with the puzzle's own category name and answers SAME,
// CLOSE or DIFFERENT. It never states medical facts; the stored category is
// the source of truth.
//
// Setup: add ANTHROPIC_API_KEY in Vercel (Project > Settings > Environment
// Variables). The key stays on the server. Without it this returns 503 and
// the app quietly uses its on-device matcher alone.

const MODEL = process.env.RECALL_JUDGE_MODEL || 'claude-haiku-4-5'
const LIMIT_PER_MIN = 30
const hits = new Map() // best-effort per-instance rate limit

const SYSTEM = `You grade one answer in a medical connections puzzle. The player solved a group of four items and was asked to name what connects them. Decide whether the player's answer names the same connection as the reference name.

Judge meaning, not wording. Count as SAME: synonyms, abbreviations, reordered phrasing, singular or plural, and wording a little broader or narrower that still clearly points at this connection (for example "bacteria" for "organisms").
Answer CLOSE when the answer is on the right topic but too vague, or misses the key relationship (for example it names the disease but not that these are its causes).
Answer DIFFERENT when it names another connection, an opposite, a different relationship (causes vs signs vs treatment vs adverse effects), or something too broad to identify this group.
Phrases listed as not accepted are never SAME. Do not use outside facts to stretch a match. When unsure, prefer CLOSE or DIFFERENT over SAME.

Reply with exactly one word: SAME, CLOSE or DIFFERENT.`

const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(503).json({ error: 'not configured' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000)
  if (recent.length >= LIMIT_PER_MIN) return res.status(429).json({ error: 'slow down' })
  recent.push(now)
  hits.set(ip, recent)

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  const answer = clip(body?.answer, 120)
  const canonical = clip(body?.canonical, 160)
  if (!answer || !canonical) return res.status(400).json({ error: 'missing fields' })
  const aliases = (Array.isArray(body.aliases) ? body.aliases : []).slice(0, 8).map((a) => clip(a, 100)).filter(Boolean)
  const reject = (Array.isArray(body.doNotAccept) ? body.doNotAccept : []).slice(0, 8).map((a) => clip(a, 100)).filter(Boolean)
  const tiles = (Array.isArray(body.tiles) ? body.tiles : []).slice(0, 4).map((t) => clip(t, 80)).filter(Boolean)

  const prompt = [
    `Reference name: ${canonical}`,
    aliases.length ? `Also accepted: ${aliases.join('; ')}` : '',
    reject.length ? `Not accepted (too broad): ${reject.join('; ')}` : '',
    tiles.length ? `The four items: ${tiles.join('; ')}` : '',
    `Player's answer: ${answer}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 5, temperature: 0, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!r.ok) return res.status(502).json({ error: 'upstream' })
    const data = await r.json()
    const text = String(data?.content?.[0]?.text || '').trim().toUpperCase()
    const verdict = text.startsWith('SAME') ? 'same' : text.startsWith('CLOSE') ? 'close' : text.startsWith('DIFFERENT') ? 'different' : null
    if (!verdict) return res.status(502).json({ error: 'unclear' })
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ verdict })
  } catch {
    return res.status(502).json({ error: 'upstream' })
  }
}
