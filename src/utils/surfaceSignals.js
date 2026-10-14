// ---------------------------------------------------------------------
// Surface signals: wording and format patterns that let a player sort
// tiles without medical reasoning.
// ---------------------------------------------------------------------
// Shared by the board builder (scripts/library/boards.mjs) and the timed
// round builders. These are review signals, not rules: medically necessary
// terminology ("dehydrogenase", "Type II") stays allowed. What matters is
// whether a pattern ISOLATES a group from everything else on the board or
// in the round. The same stem spread across two groups is a fair red
// herring; the same stem on three or four tiles of one group and nowhere
// else is a giveaway.
//
// Nothing here proves medical uniqueness or difficulty.

const STOP = new Set(['of', 'the', 'a', 'an', 'and', 'or', 'in', 'to', 'with', 'for', 'on', 'by', 'from', 'at', 'as', 'its', 'is'])
// Leading words that describe a change or state ("Increased stroke volume").
export const DIRECTION_WORDS = new Set(['increased', 'decreased', 'elevated', 'reduced', 'low', 'high', 'raised', 'prolonged', 'shortened', 'positive', 'negative', 'absent', 'loss', 'impaired', 'enhanced', 'inhibited', 'inhibition', 'excess', 'deficient', 'hyper', 'hypo', 'more', 'less', 'lower', 'higher', 'normal'])
const ROMAN = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii)$/i

export function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9α-ω]+/i)
    .filter(Boolean)
}
const content = (ws) => ws.filter((w) => !STOP.has(w))

// One tile's surface profile.
export function tileSurface(text) {
  const raw = String(text || '').trim()
  const ws = words(raw)
  const cw = content(ws)
  const first = cw[0] || ''
  const last = cw[cw.length - 1] || ''
  // Numbered or lettered series: "Type II collagen", "Factor X", "CN III",
  // "V3", "HPV 16", "Class IC".
  const series =
    ws.some((w) => ROMAN.test(w) && w !== 'i') ||
    /\b(type|class|factor|grade|stage|phase|lead|cn|cranial nerve|hpv|gm|mody|men|hla)[\s-]*([ivx]+|\d+[a-z]?)\b/i.test(raw) ||
    /\b[a-z]?\d+[a-z]?\b/i.test(raw.replace(/\b(19|20)\d\d\b/g, ''))
  return {
    text: raw,
    words: ws,
    first,
    last,
    // suffixes of the last word, used for drug stems and disease endings
    ends: [3, 4, 5].filter((n) => last.length >= n + 3).map((n) => last.slice(-n)),
    direction: DIRECTION_WORDS.has(ws[0]) || /^(hyper|hypo)/.test(ws[0] || '') ? ws[0].replace(/^(hyper|hypo).*/, '$1') : '',
    series,
    paren: /\(.+\)/.test(raw),
    abbrev: /^[A-Z0-9][A-Z0-9-]{1,6}$/.test(raw.replace(/\s/g, '')),
    nWords: ws.length,
    length: raw.length,
  }
}

// Features shared by at least `min` tiles of a group. Each feature has a key
// so it can be counted elsewhere on the board.
export function sharedFeatures(tiles, min = 3) {
  const S = tiles.map((t) => (typeof t === 'string' ? tileSurface(t) : t))
  const counts = new Map()
  const bump = (key, label) => {
    const c = counts.get(key) || { key, label, n: 0 }
    c.n++
    counts.set(key, c)
  }
  for (const s of S) {
    const seen = new Set()
    const once = (key, label) => {
      if (seen.has(key)) return
      seen.add(key)
      bump(key, label)
    }
    if (s.first && s.first.length >= 3) once(`first:${s.first}`, `start with "${s.first}"`)
    if (s.last && s.last.length >= 3) once(`last:${s.last}`, `end with "${s.last}"`)
    for (const e of s.ends) once(`end:${e}`, `end in "-${e}"`)
    if (s.direction) once('dir:any', 'are change statements ("Increased...", "Low...")')
    if (s.series) once('series', 'are a numbered or lettered series')
    if (s.paren) once('paren', 'carry a parenthetical')
    if (s.abbrev) once('abbrev', 'are abbreviations')
  }
  return collapse([...counts.values()].filter((c) => c.n >= min))
}
// Keep the most specific feature of overlapping ones: a whole shared last
// word beats its suffixes, and a longer suffix beats a shorter one.
function collapse(list) {
  const lasts = list.filter((f) => f.key.startsWith('last:')).map((f) => f.key.slice(5))
  const ends = list.filter((f) => f.key.startsWith('end:'))
  return list.filter((f) => {
    if (!f.key.startsWith('end:')) return true
    const e = f.key.slice(4)
    if (lasts.some((w) => w.endsWith(e))) return false
    return !ends.some((g) => g !== f && g.n >= f.n && g.key.length > f.key.length && g.key.endsWith(e))
  })
}

// Does a tile carry a feature key?
export function hasFeature(s, key) {
  if (typeof s === 'string') s = tileSurface(s)
  const [kind, val] = key.includes(':') ? [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)] : [key, '']
  switch (kind) {
    case 'first':
      return s.first === val
    case 'last':
      return s.last === val
    case 'end':
      return s.last.length >= val.length + 3 && s.last.endsWith(val)
    case 'dir':
      return val === 'any' ? !!s.direction : s.direction === val
    case 'series':
      return s.series
    case 'paren':
      return s.paren
    case 'abbrev':
      return s.abbrev
    default:
      return false
  }
}

// Surface isolation on a board: groups is an array of 4-tile arrays. A group
// is isolated by a feature when 3+ of its tiles share it and at most one tile
// elsewhere on the board does. Returns, per group, the isolating features,
// plus the features that spread across groups (red herrings).
export function boardSurface(groups) {
  const surf = groups.map((g) => g.map(tileSurface))
  const all = surf.flat()
  const isolated = groups.map(() => [])
  const herrings = []
  surf.forEach((g, gi) => {
    for (const f of sharedFeatures(g, 3)) {
      const outside = all.filter((s, k) => Math.floor(k / 4) !== gi && hasFeature(s, f.key)).length
      if (outside <= 1) isolated[gi].push(f)
    }
  })
  // Herrings: a feature on 2+ tiles of each of 2+ groups, or 4+ tiles spread
  // over 3+ groups.
  const seen = new Set()
  surf.forEach((g) => {
    for (const f of sharedFeatures(g, 2)) {
      if (seen.has(f.key)) continue
      seen.add(f.key)
      const per = surf.map((h) => h.filter((s) => hasFeature(s, f.key)).length)
      const groupsWith = per.filter((n) => n > 0).length
      if (groupsWith >= 2 && per.reduce((a, b) => a + b, 0) >= 3) herrings.push({ ...f, per })
    }
  })
  return { isolated, herrings }
}

// Round-level shortcut for timed formats: do the correct answers share a
// feature the wrong ones lack (or the reverse)? `right` and `wrong` are tile
// texts. Returns the giveaway features (empty when none).
export function answerShortcuts(right, wrong) {
  const R = right.map(tileSurface)
  const W = wrong.map(tileSurface)
  const out = []
  const minRight = Math.max(2, Math.ceil(R.length * 0.75))
  for (const f of sharedFeatures(R, minRight)) {
    const inWrong = W.filter((s) => hasFeature(s, f.key)).length
    if (inWrong === 0) out.push({ ...f, side: 'right' })
  }
  if (W.length >= 2) {
    for (const f of sharedFeatures(W, Math.max(2, Math.ceil(W.length * 0.75)))) {
      const inRight = R.filter((s) => hasFeature(s, f.key)).length
      if (inRight === 0) out.push({ ...f, side: 'wrong' })
    }
  }
  return out
}

// How alike two tiles look (0..1): word count, length, shared stem or form.
// Used to prefer wrong answers that read like the right ones.
export function lookAlike(a, b) {
  const A = typeof a === 'string' ? tileSurface(a) : a
  const B = typeof b === 'string' ? tileSurface(b) : b
  let s = 0
  s += 1 - Math.min(1, Math.abs(A.nWords - B.nWords) / 3)
  s += 1 - Math.min(1, Math.abs(A.length - B.length) / 20)
  if (A.ends[1] && A.ends[1] === B.ends[1]) s += 1
  if (A.first && A.first === B.first) s += 0.5
  if (!!A.direction === !!B.direction) s += 0.5
  if (A.series === B.series) s += 0.5
  if (A.abbrev === B.abbrev) s += 0.25
  return s / 4.75
}

// Content words of a title that also appear in tiles ("Collagen types" and
// "Type I collagen"): the title gives the group away in Common Link rounds.
// Matching ignores a plural "s" and catches a title word inside a longer
// tile word ("acidosis" in "ketoacidosis").
const stemS = (w) => (w.length > 4 && w.endsWith('s') && !/[siu]s$/.test(w) ? w.slice(0, -1) : w)
export function titleLeak(title, tiles) {
  const tw = [...new Set(content(words(title)).map(stemS).filter((w) => w.length >= 4 && !GENERIC_TITLE.has(w)))]
  const hits = new Set()
  for (const t of tiles)
    for (const w0 of words(t)) {
      const w = stemS(w0)
      for (const x of tw) if (w === x || (x.length >= 6 && w.includes(x)) || (w.length >= 6 && x.includes(w))) hits.add(x)
    }
  return [...hits]
}
// Does a title carry a leaked word (same matching as titleLeak)?
export const titleHas = (title, word) => content(words(title)).map(stemS).some((w) => w === word || (word.length >= 6 && w.includes(word)) || (w.length >= 6 && word.includes(w)))
const GENERIC_TITLE = new Set(['causes', 'cause', 'features', 'feature', 'findings', 'finding', 'clues', 'clue', 'classic', 'associations', 'associated', 'conditions', 'condition', 'disease', 'diseases', 'drugs', 'drug', 'effects', 'effect', 'adverse', 'signs', 'symptoms', 'common', 'major', 'recognized', 'typical', 'types', 'that', 'with', 'from', 'which', 'used', 'treatments', 'treatment', 'risk', 'factors'])
