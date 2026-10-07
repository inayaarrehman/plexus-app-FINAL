// ---------------------------------------------------------------------
// Name the connection: text normalization.
// ---------------------------------------------------------------------
// Turns a category name or a player's answer into a bag of comparable tokens.
// Both sides go through the SAME steps, so a rule that is slightly crude (a
// plural rule, say) still compares like with like.
//
// Steps: lowercase, strip punctuation, expand common abbreviations, drop
// filler words, reduce plurals and verb forms, then map relation words onto a
// small set of shared concepts (causes / etiology / reasons all become CAUSE;
// bacteria / pathogens / organisms all become ORGANISM). Medical terms
// themselves are never rewritten into other medical terms: "nephrotic" and
// "nephritic" stay different words.

// Phrase-level abbreviations and fixed phrases, applied before tokenizing.
// Keys are matched as whole words.
const PHRASES = [
  ['side effects?', ' ADVERSE '],
  ['adverse (?:drug )?(?:effects?|reactions?|events?)', ' ADVERSE '],
  ['s/e', ' ADVERSE '],
  ['w/o', ' without '],
  ['w/', ' with '],
  ['ace[\\s-]?is?', ' ace inhibitor '],
  ["ace[\\s-]?i's", ' ace inhibitor '],
  ['ace inhibitors?', ' ace inhibitor '],
  ['angiotensin converting enzyme inhibitors?', ' ace inhibitor '],
  ['arbs?', ' angiotensin receptor blocker '],
  ['ie', ' infective endocarditis '],
  ['abx', ' antibiotic '],
  ['htn', ' hypertension '],
  ['mi', ' myocardial infarction '],
  ['chf', ' heart failure '],
  ['hf', ' heart failure '],
  ['ckd', ' chronic kidney disease '],
  ['aki', ' acute kidney injury '],
  ['dm', ' diabetes mellitus '],
  ['t1dm', ' type 1 diabetes mellitus '],
  ['t2dm', ' type 2 diabetes mellitus '],
  ['copd', ' chronic obstructive pulmonary disease '],
  ['uti', ' urinary tract infection '],
  ['tb', ' tuberculosis '],
  ['ra', ' rheumatoid arthritis '],
  ['sle', ' lupus '],
  ['systemic lupus erythematosus', ' lupus '],
  ['rta', ' renal tubular acidosis '],
  ['dx', ' diagnosis '],
  ['ddx', ' differential '],
  ['tx', ' treatment '],
  ['rx', ' treatment '],
  ['sx', ' symptom '],
  ['ekg', ' ecg '],
  ['electrocardiogram', ' ecg '],
  ['cn', ' cranial nerve '],
  ['meds?', ' drug '],
  ['ppis?', ' proton pump inhibitor '],
  ['nsaids?', ' nsaid '],
  ['ssris?', ' ssri '],
  ['gi', ' gastrointestinal '],
  ['jvd', ' elevated jvp '],
  ['jugular venous distension', ' elevated jvp '],
  ['jugular venous pressure', ' jvp '],
  ['caused by', ' CAUSE '],
  ['leads? to', ' CAUSE '],
  ['due to', ' CAUSE '],
  ['responsible for', ' CAUSE '],
  ['seen in', ' ASSOC '],
  ['found in', ' ASSOC '],
  ['linked (?:to|with)', ' ASSOC '],
  ['associated with', ' ASSOC '],
  ['related to', ' ASSOC '],
]
const PHRASE_RES = PHRASES.map(([pat, rep]) => [new RegExp(`(^|\\s)(?:${pat})(?=\\s|$)`, 'g'), `$1${rep}`])

// Words that carry no meaning for this comparison.
const STOP = new Set(
  'a an the of that which who whom whose with in on at for to from by and or are is be been being can could may might will would this these those it its their there here as into onto than then so such some any all each every one ones thing things stuff list group set kind kinds sort examples example word words term terms name names answer connection category basically mostly usually often typically commonly common classic classically'.split(' ')
)

// Single words that map to shared relation concepts. Concept tokens are
// written in capitals so they never collide with a real word.
const CONCEPTS = {
  CAUSE: 'cause causes causing caused causative causal etiology etiologies aetiology aetiologies reason reasons trigger triggers induce induces induced inducing precipitant precipitants precipitate source sources'.split(' '),
  ASSOC: 'associated association associations linked link related relationship'.split(' '),
  ORGANISM: 'organism organisms bacteria bacterium bacterial bug bugs pathogen pathogens pathogenic microbe microbes microbial microorganism microorganisms germ germs'.split(' '),
  DRUG: 'drug drugs medication medications medicine medicines agent agents pharmacologic pharmacological'.split(' '),
  ADVERSE: 'toxicity toxicities complication complications adr adrs'.split(' '),
  TREAT: 'treatment treatments therapy therapies management manage managing treat treats treating treated'.split(' '),
  DISEASE: 'disease diseases disorder disorders condition conditions illness illnesses'.split(' '),
  NEG: 'non not no without absent absence lack lacking'.split(' '),
  UP: 'elevated elevation raised high increased increase increases increasing rise rising excess'.split(' '),
  DOWN: 'low decreased decrease decreases decreasing reduced reduction drop deficient'.split(' '),
  PROLONG: 'prolong prolongs prolonged prolonging prolongation lengthen lengthens lengthened lengthening long'.split(' '),
  DERIVE: 'derive derives derived deriving derivative derivatives derivation origin'.split(' '),
  PLACE: 'place places location locations geographic geographical geography city cities region regions country countries town towns'.split(' '),
  FINDING: 'sign signs finding findings feature features manifestation manifestations presentation presentations'.split(' '),
}
const CONCEPT_OF = new Map()
for (const [concept, words] of Object.entries(CONCEPTS)) words.forEach((w) => CONCEPT_OF.set(w, concept))
export const CONCEPT_NAMES = new Set([...Object.keys(CONCEPTS)])

// Light plural / inflection reduction. Applied to both sides identically.
const KEEP = new Set(['diabetes', 'syphilis', 'mumps', 'measles', 'rabies', 'herpes', 'tetanus', 'lupus', 'virus', 'sinus', 'pancreas', 'bronchus', 'thalamus', 'uterus', 'fetus', 'stenosis', 'sepsis', 'sinus', 'status', 'gas', 'plus', 'minus', 'bus', 'mass', 'loss', 'stress', 'class', 'cross', 'process'])
const IRREGULAR = { fungi: 'fungus', foci: 'focus', nuclei: 'nucleus', emboli: 'embolus', thrombi: 'thrombus', bacilli: 'bacillus', cocci: 'coccus', calculi: 'calculus', diverticula: 'diverticulum', ova: 'ovum', criteria: 'criterion', phenomena: 'phenomenon', vertebrae: 'vertebra', bodies: 'body', children: 'child', feet: 'foot', teeth: 'tooth', women: 'woman', men: 'man' }
export function lemma(w) {
  if (IRREGULAR[w]) return IRREGULAR[w]
  if (/oses$/.test(w)) return w.slice(0, -4) + 'osis'
  if (w.length <= 3 || KEEP.has(w) || /\d/.test(w)) return w
  if (/(?:is|us|ss|os|as)$/.test(w)) return w
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (/(?:ches|shes|xes|zes|sses)$/.test(w)) return w.slice(0, -2)
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1)
  return w
}

export function basicClean(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u2018\u2019\u201c\u201d"]/g, "'")
    .replace(/[\u2010-\u2015]/g, ' ')
    .replace(/_{2,}/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 $2')
    .replace(/[^a-z0-9'/+\s-]/g, ' ')
    .replace(/(^|\s)'+|'+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Main entry: text -> array of tokens (words and CONCEPT tokens), deduped,
// order kept (order is never used for matching).
// British and American spellings compare equal (anaemia, oedema, tumour).
function spelling(w) {
  return w
    .replace(/^(an|isch|leuk|hyperk|hypok|hypern|hypon|hyperc|hypoc|hyperm|hypom|hyperg|hypog|bacter|sept|ur|hyperlipid|vir|tox)aem/, '$1em')
    .replace(/^haem/, 'hem')
    .replace(/^paed/, 'ped')
    .replace(/^oe(soph|dem|strog)/, 'e$1')
    .replace(/^(tum|col|behavi|fav)our/, '$1or')
}

// Organ words and their adjectives name the same thing (lung = pulmonary).
const ORGAN = {
  lung: 'pulmonary', lungs: 'pulmonary', pulmonary: 'pulmonary', respiratory: 'pulmonary',
  kidney: 'renal', kidneys: 'renal', renal: 'renal', nephric: 'renal',
  liver: 'hepatic', hepatic: 'hepatic',
  heart: 'cardiac', cardiac: 'cardiac',
  skin: 'cutaneous', cutaneous: 'cutaneous', dermatologic: 'cutaneous', dermal: 'cutaneous',
  brain: 'cerebral', cerebral: 'cerebral',
  stomach: 'gastric', gastric: 'gastric',
  bowel: 'intestinal', intestinal: 'intestinal', gut: 'intestinal',
  eye: 'ocular', eyes: 'ocular', ocular: 'ocular', ophthalmic: 'ocular',
  bone: 'bone', bones: 'bone', skeletal: 'bone', osseous: 'bone',
}

// "Hypercalcemia" and "high calcium" are the same idea: split the electrolyte
// words into direction + substance so either phrasing matches. (Directions
// stay opposite: hypo is never hyper.)
const ELECTROLYTE = { calc: 'calcium', kal: 'potassium', natr: 'sodium', magnes: 'magnesium', phosphat: 'phosphate', glyc: 'glucose' }
function electrolyte(w) {
  // Any ending, so typos still match (hypercalcmia); urine terms (hypercalciuria)
  // are a different finding and are left alone.
  const m = w.match(/^(hyper|hypo)(calc|kal|natr|magnes|phosphat|glyc)(?![a-z]*uri)[a-z]*$/)
  if (!m) return null
  return [m[1] === 'hyper' ? 'UP' : 'DOWN', ELECTROLYTE[m[2]]]
}

export function tokens(text) {
  let s = ` ${basicClean(text)} `
  for (const [re, rep] of PHRASE_RES) s = s.replace(re, rep)
  s = s.replace(/[-/]/g, ' ')
  const out = []
  for (const raw of s.split(/\s+/)) {
    if (!raw) continue
    if (CONCEPT_NAMES.has(raw)) {
      out.push(raw)
      continue
    }
    const w = spelling(raw.replace(/'s$/, '').replace(/'/g, ''))
    if (!w || STOP.has(w)) continue
    const el = electrolyte(w)
    if (el) {
      out.push(...el)
      continue
    }
    if (ORGAN[w]) {
      out.push(ORGAN[w])
      continue
    }
    const c = CONCEPT_OF.get(w)
    out.push(c || lemma(w))
  }
  return [...new Set(out)]
}

// Map each word of a phrase to its token, so the UI can point at the words of
// the category name a player's answer did not cover.
export function wordTokens(text) {
  return String(text || '')
    .split(/(\s+)/)
    .map((part) => ({ part, toks: /\S/.test(part) ? tokens(part) : [] }))
}

// A stable key for "same words, any order".
export function bagKey(text) {
  return tokens(text).slice().sort().join(' ')
}
