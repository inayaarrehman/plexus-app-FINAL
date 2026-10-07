import React from 'react'

// ---------------------------------------------------------------------
// Tile label: long medical terms stay inside the tile at every width.
// ---------------------------------------------------------------------
// 1. The text sits in its own element, so the tile's flex layout cannot force
//    it wider than the tile (the cause of "Primary hyperparathyroidism"
//    spilling out on desktop).
// 2. The tile scales its text so the longest word fits (container query
//    units, see .tile-text in styles.css), never below a readable floor.
// 3. Long words carry soft hyphens at medical word boundaries
//    (hyper-para-thyroid-ism, sarcoid-osis). They are invisible unless the
//    word truly has to break, and then it breaks there with a hyphen
//    instead of at an arbitrary letter.

const PREFIXES = [
  'pseudo', 'hyper', 'hypo', 'para', 'poly', 'glomerulo', 'granulo', 'eosino', 'membrano', 'myco', 'cardio', 'gastro',
  'hepato', 'nephro', 'neuro', 'osteo', 'thrombo', 'hemato', 'hemo', 'immuno', 'lympho', 'myelo', 'angio', 'broncho',
  'cholangio', 'spondylo', 'arthro', 'dermato', 'encephalo', 'meningo', 'pneumo', 'retro', 'trans', 'intra', 'inter',
  'supra', 'anti', 'oligo', 'sclero', 'fibro', 'histio', 'plasmo', 'rhabdo', 'leiomyo', 'adeno', 'carcino', 'chondro',
  'cyto', 'endo', 'erythro', 'leuko', 'macro', 'micro', 'mono', 'pharmaco', 'pyelo', 'spleno', 'tachy', 'brady',
  'acantho', 'actino', 'blasto', 'crypto', 'histo', 'toxo', 'strepto', 'staphylo', 'entero', 'coccidio', 'triglycer',
  'cholester', 'aldostero', 'parathyro', 'thyro', 'gluco', 'glyco', 'lipo', 'proteo', 'electro', 'radio', 'cerebro',
  'vaso', 'veno', 'arterio', 'athero', 'cranio', 'oculo', 'oto', 'rhino', 'laryngo', 'naso', 'uro', 'cysto', 'colo',
  'procto', 'chole', 'pancreato', 'salpingo', 'oophoro', 'hystero', 'mammo', 'mast', 'phospho', 'sulfo', 'amino',
  'fluoro', 'quino', 'psycho', 'chloro', 'benzo', 'oxy', 'sympatho', 'cortico', 'gonado', 'pituitar', 'hypophys',
]
const SUFFIXES = [
  'thyroidism', 'ism', 'osis', 'itis', 'emia', 'pathy', 'megaly', 'ectomy', 'plasia', 'trophy', 'philia', 'philic',
  'penia', 'cytosis', 'genesis', 'lysis', 'algia', 'uria', 'sclerosis', 'angiitis', 'cocci', 'bacter', 'iasis',
  'glyceride', 'globulin', 'ectasis', 'plegia', 'paresis', 'trophic', 'genic', 'toxic', 'static', 'lytic', 'phritis',
  'nephritis', 'ectomy', 'otomy', 'oscopy', 'gram', 'graphy', 'cele', 'rrhea', 'rrhage', 'spasm', 'stenosis',
  'ptosis', 'tension', 'ventricular', 'vascular', 'ation', 'ence', 'ance', 'ology', 'ologic', 'opathy',
]
const MIN_PART = 3
const SOFT = '­'

// Break opportunities in one long word, at prefix ends and suffix starts.
function softHyphenateWord(word) {
  if (word.length < 8 || /[^A-Za-z]/.test(word)) return word
  const lower = word.toLowerCase()
  const cuts = new Set()
  // Prefixes only at the start of the word, chained (hyper + para + ...), so a
  // prefix inside another word ("hemato" in "exanthematous") is not a cut.
  let pos = 0
  for (let guard = 0; guard < 6; guard++) {
    const p = PREFIXES.filter((x) => lower.startsWith(x, pos)).sort((a, b) => b.length - a.length)[0]
    if (!p) break
    pos += p.length
    if (pos >= MIN_PART && pos <= lower.length - MIN_PART) cuts.add(pos)
  }
  for (const s of SUFFIXES) {
    const i = lower.lastIndexOf(s)
    if (i >= MIN_PART && i <= lower.length - MIN_PART) cuts.add(i)
  }
  // Keep cuts at least MIN_PART apart, preferring earlier ones.
  const kept = []
  for (const c of [...cuts].sort((a, b) => a - b)) {
    if (c - (kept[kept.length - 1] ?? 0) >= MIN_PART && lower.length - c >= MIN_PART) kept.push(c)
  }
  // Any piece still longer than 8 letters gets one break near its middle,
  // between two consonants if possible (tam-ponade, malig-nancy).
  const bounds = [0, ...kept, word.length]
  for (let b = 0; b < bounds.length - 1; b++) {
    const [from, to] = [bounds[b], bounds[b + 1]]
    if (to - from <= 9) continue
    const cut = middleCut(lower, from, to)
    if (cut) kept.push(cut)
  }
  kept.sort((a, b) => a - b)
  let out = ''
  let last = 0
  for (const c of kept) {
    out += word.slice(last, c) + SOFT
    last = c
  }
  return out + word.slice(last)
}

const VOWEL = /[aeiouy]/
function middleCut(lower, from, to) {
  const mid = Math.floor((from + to) / 2)
  // Never split a letter pair that is read as one sound (th, ch, ph, sh, gh, rh).
  const ok = (k) => k - from >= MIN_PART && to - k >= MIN_PART && !/^[ctpsgr]h$/.test(lower.slice(k - 1, k + 1))
  for (let d = 0; d <= 3; d++) {
    for (const k of [mid - d, mid + d]) {
      if (ok(k) && !VOWEL.test(lower[k - 1]) && !VOWEL.test(lower[k]) && VOWEL.test(lower[k + 1] || '')) return k
    }
  }
  for (let d = 0; d <= 3; d++) {
    for (const k of [mid - d, mid + d]) {
      if (ok(k) && VOWEL.test(lower[k - 1]) && !VOWEL.test(lower[k])) return k
    }
  }
  return null
}

export function softHyphenate(text) {
  return String(text || '').replace(/[A-Za-z]{8,}/g, softHyphenateWord)
}

export function longestWord(text) {
  return Math.max(4, ...String(text || '').split(/[\s/()-]+/).map((w) => w.length))
}

export default function TileText({ children }) {
  const text = String(children ?? '')
  return (
    <span className="tile-text" style={{ '--lw': longestWord(text) }}>
      {softHyphenate(text)}
    </span>
  )
}
