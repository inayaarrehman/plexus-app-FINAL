import React, { useLayoutEffect, useRef, useState } from 'react'
// ---------------------------------------------------------------------
// Tile label: long medical terms stay inside the tile at every width.
// ---------------------------------------------------------------------
// 1. Labels wrap between whole words. No hyphens are inserted while every
//    word fits, so "Subchondral sclerosis" never becomes "Subchond-ral".
// 2. The label shrinks, within a readable floor, until its longest word fits
//    the tile. The size comes from measuring the words in the tile's own font
//    (a first guess from the word length is set in CSS for the first paint).
// 3. Real hyphens and slashes are kept and may start a new line after them
//    in longer compounds ("kappa/ lambda", "therapeutic-to- toxic"). Short
//    compounds such as HMG-CoA stay on one line.
// 4. Only when a single word cannot fit even at the floor (for example
//    "Pseudohypoparathyroidism" on a 320 px phone) does that word get break
//    points, at its prefix and suffix boundaries (Pseudo-hypo-para-thyroidism).

const PREFIXES = [
  'pseudo', 'sub', 'iso', 'dorso', 'cavo', 'atrio', 'peri', 'over', 'under', 'pheo', 'chorio', 'ventriculo', 'cryo', 'post', 'pre', 'non', 'auto', 'hetero',
  'homo', 'megalo', 'mega', 'semi', 'contra', 'infra', 'ultra', 'multi', 'dys', 'neo', 'meta', 'epi', 'hemi', 'tri', 'bi', 'un', 're', 'hyper', 'hypo', 'para', 'poly', 'glomerulo', 'granulo', 'eosino', 'membrano', 'myco', 'cardio', 'gastro',
  'hepato', 'nephro', 'neuro', 'osteo', 'thrombo', 'hemato', 'hemo', 'immuno', 'lympho', 'myelo', 'angio', 'broncho',
  'cholangio', 'spondylo', 'arthro', 'dermato', 'encephalo', 'meningo', 'pneumo', 'retro', 'trans', 'intra', 'inter',
  'supra', 'anti', 'oligo', 'sclero', 'fibro', 'histio', 'plasmo', 'rhabdo', 'leiomyo', 'adeno', 'carcino', 'chondro',
  'cyto', 'endo', 'erythro', 'leuko', 'macro', 'micro', 'mono', 'pharmaco', 'pyelo', 'spleno', 'tachy', 'brady',
  'acantho', 'actino', 'blasto', 'crypto', 'histo', 'toxo', 'strepto', 'staphylo', 'entero', 'coccidio', 'triglycer',
  'cholester', 'aldosteron', 'parathyro', 'thyro', 'gluco', 'glyco', 'lipo', 'proteo', 'electro', 'radio', 'cerebro',
  'vaso', 'veno', 'arterio', 'athero', 'cranio', 'oculo', 'oto', 'rhino', 'laryngo', 'naso', 'uro', 'cysto', 'colo',
  'procto', 'chole', 'pancreato', 'salpingo', 'oophoro', 'hystero', 'mammo', 'mast', 'phospho', 'sulfo', 'amino',
  'fluoro', 'quino', 'psycho', 'chloro', 'benzo', 'oxy', 'sympatho', 'cortico', 'gonado', 'pituitar', 'hypophys',
]
const SUFFIXES = [
  'ization', 'izing', 'olemia', 'idemia', 'inemia', 'ferative', 'romocytoma', 'cytoma', 'carcinoma', 'oma', 'virus', 'mentary', 'ment', 'ness', 'metric', 'cuspid', 'ification', 'aminidase', 'idase',
  'thyroidism', 'ism', 'osis', 'itis', 'emia', 'pathy', 'megaly', 'ectomy', 'plasia', 'trophy', 'philia', 'philic',
  'penia', 'cytosis', 'genesis', 'lysis', 'algia', 'uria', 'sclerosis', 'angiitis', 'cocci', 'bacter', 'iasis',
  'glyceride', 'globulin', 'ectasis', 'plegia', 'paresis', 'trophic', 'genic', 'toxic', 'static', 'lytic', 'phritis',
  'nephritis', 'ectomy', 'otomy', 'oscopy', 'gram', 'graphy', 'cele', 'rrhea', 'rrhage', 'spasm', 'stenosis',
  'ptosis', 'tension', 'ventricular', 'vascular', 'ation', 'ence', 'ance', 'ology', 'ologic',
]
const MIN_PART = 3
const SOFT = '­'

// Break opportunities in one long word, at prefix ends and suffix starts.
function softHyphenateWord(word) {
  if (word.length < 7 || /[^A-Za-z]/.test(word)) return word
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
  // The longest matching suffix only (-ization, not also -ation).
  const suf = SUFFIXES.filter((x) => lower.endsWith(x) || lower.endsWith(x + 's')).sort((a, b) => b.length - a.length)[0]
  if (suf) {
    const i = lower.lastIndexOf(suf)
    if (i >= MIN_PART && i <= lower.length - MIN_PART) cuts.add(i)
  }
  // Keep cuts at least MIN_PART apart, preferring earlier ones.
  const kept = []
  for (const c of [...cuts].sort((a, b) => a - b)) {
    if (c - (kept[kept.length - 1] ?? 0) >= MIN_PART && lower.length - c >= MIN_PART) kept.push(c)
  }
  // Any piece still longer than 10 letters gets one break near its middle,
  // at a syllable boundary (con-centrated, peri-cardium).
  const bounds = [0, ...kept, word.length]
  for (let b = 0; b < bounds.length - 1; b++) {
    const [from, to] = [bounds[b], bounds[b + 1]]
    // (A word with no other break point gets one from 7 letters up.)
    if (to - from <= (kept.length ? 10 : 6)) continue
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
// Consonant pairs that start a syllable together (con-trast, re-flux) or are
// read as one sound (th, ch, ph): never split between them.
const ONSET = /^(?:bl|br|ch|cl|cr|dr|fl|fr|gl|gr|ph|pl|pr|rh|sc|sh|sk|sl|sm|sn|sp|st|sw|th|tr|tw|wh)$/
const PAIR = /^(?:ck|qu|gh|ng)$/
function middleCut(lower, from, to) {
  const mid = (from + to) / 2
  let best = null
  for (let k = from + MIN_PART; k <= to - MIN_PART; k++) {
    const a = lower[k - 1]
    const b = lower[k]
    const c = lower[k + 1] || ''
    let score
    if (/^(?:thr|chr|phr|shr|str|spr|scr|spl)$/.test(lower.slice(k - 2, k + 1))) continue // pro-thrombin, not proth-rombin
    if (!VOWEL.test(a) && !VOWEL.test(b) && !ONSET.test(a + b) && !PAIR.test(a + b) && (VOWEL.test(c) || ONSET.test(b + c))) score = 0 // con-cen, car-dium
    else if (VOWEL.test(a) && !VOWEL.test(b) && (VOWEL.test(c) || ONSET.test(b + c)) && !ONSET.test(lower[k - 2] + a)) score = 1.5 // mo-tor, re-trac
    else continue
    score += Math.abs(k - mid) * 0.5
    if (!best || score < best.score) best = { k, score }
  }
  return best ? best.k : null
}

// Break points for a word that cannot fit at the readable floor: prefix and
// suffix boundaries first; a break near the middle only if a piece is still long.
export function softHyphenate(text) {
  return String(text || '').replace(/[A-Za-z]{8,}/g, softHyphenateWord)
}

// Pieces that must stay on one line: words, with long hyphenated or slashed
// compounds split after the hyphen or slash.
const SHORT_COMPOUND = 10
function pieces(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (w.length <= SHORT_COMPOUND ? [w] : w.split(/(?<=[-/*])(?=[A-Za-z0-9(])/)))
}

export function longestWord(text) {
  return Math.max(4, ...pieces(text).map((w) => w.length))
}

let canvas
function measure(word, font) {
  if (typeof document === 'undefined') return word.length * 0.62
  canvas = canvas || document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.font = font
  return ctx.measureText(word).width
}

const breakable = (w) => w.replace(/[A-Za-z]{7,}/g, (x) => softHyphenateWord(x))

// Render one label: words with a space between, a line break allowed after a
// slash or hyphen in long compounds, and break points inside the words in
// `split` only.
function renderLabel(text, split) {
  const words = String(text || '').split(/(\s+)/)
  return words.map((w, i) => {
    if (/^\s+$/.test(w) || !w) return w
    if (split.has(w)) return breakable(w)
    if (w.length <= SHORT_COMPOUND && /[-/*]/.test(w)) return <span key={i} className="tile-nobreak">{w}</span>
    if (/[-/*]/.test(w)) {
      const parts = w.split(/(?<=[-/*])(?=[A-Za-z0-9(])/)
      return (
        <React.Fragment key={i}>
          {parts.map((p, j) => (
            <React.Fragment key={j}>
              {j > 0 && <wbr />}
              {split.has(p) ? breakable(p) : p}
            </React.Fragment>
          ))}
        </React.Fragment>
      )
    }
    return w
  })
}

const FLOOR_PX = 11

export default function TileText({ children }) {
  const text = String(children ?? '')
  const ref = useRef(null)
  const [fit, setFit] = useState(null) // { size, split: Set of words to break }

  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box || typeof ResizeObserver === 'undefined') return undefined
    let raf = 0
    const run = () => {
      const cs = getComputedStyle(box)
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const base = parseFloat(cs.fontSize)
      if (!(avail > 0) || !(base > 0)) return
      const font = `${cs.fontWeight} ${base}px ${cs.fontFamily}`
      const tracking = parseFloat(cs.letterSpacing) || 0
      const width = (w) => {
        const m = measure(w, font)
        return m == null ? null : m + tracking * w.length
      }
      const ws = pieces(text).map((w) => [w, width(w)])
      if (ws.some(([, m]) => m == null)) return
      const widest = Math.max(1, ...ws.map(([, m]) => m))
      // A little room for rounding and font hinting.
      const room = avail - 3
      const floor = Math.min(base, FLOOR_PX)
      const size = Math.max(floor, Math.min(base, (base * room) / widest))
      const scale = size / base
      // At the floor, letters may close up very slightly (up to 0.03 em)
      // before a word is broken.
      const over = ws.filter(([, m]) => m * scale > room + 0.5)
      let squeeze = 0
      if (over.length) {
        const need = Math.max(...over.map(([w, m]) => (m * scale - room) / Math.max(1, w.length - 1)))
        if (need <= 0.03 * size) squeeze = need
      }
      const split = new Set(squeeze ? [] : over.map(([w]) => w))
      setFit((prev) =>
        prev && Math.abs(prev.size - size) < 0.1 && Math.abs(prev.squeeze - squeeze) < 0.01 && prev.split.size === split.size && [...split].every((w) => prev.split.has(w))
          ? prev
          : { size, split, squeeze, tracking },
      )
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(run)
    }
    run()
    const ro = new ResizeObserver(schedule)
    ro.observe(box)
    document.fonts?.ready?.then(schedule)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [text])

  const split = fit?.split || new Set()
  return (
    <span
      ref={ref}
      className={`tile-text${split.size ? ' is-split' : ''}`}
      style={{
        '--lw': longestWord(text),
        ...(fit ? { fontSize: `${fit.size.toFixed(2)}px` } : null),
        ...(fit?.squeeze ? { letterSpacing: `${(fit.tracking - fit.squeeze).toFixed(3)}px` } : null),
      }}
    >
      {renderLabel(text, split)}
    </span>
  )
}
