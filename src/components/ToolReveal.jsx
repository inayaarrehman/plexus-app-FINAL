// A tool arriving in Your Tools: one short animation per tool, built from
// its Your Tools drawing (ToolArt) and acting out what the tool does.
//   Consult         two nodes slide in, link, and a pulse runs between them
//   Rule Out        the group forms; the odd node lands, shakes, is pushed out
//   Second Opinion  the arrow rewinds round a mistake, which turns back to teal
//   Coverage        seven spokes light in turn, then the ring closes
//   Mutation        the chain glitches, nodes swap places, then snap back
//   CRISPR          the guard drops into place and blocks an incoming hit
// It plays once when mounted (mount it when the tool is earned). `delay`
// (seconds) staggers several in a row. With reduced motion, or after a tap
// to skip (.is-skipped on an ancestor), it shows the final drawing at once.
// Decorative: the text beside it says what was earned.

const S = (d) => ({ '--d': `${d}s` })

function Consult() {
  return (
    <>
      <line className="tr-link tr-sx" x1="20" y1="28" x2="52" y2="28" style={S(0.45)} />
      <circle className="tr-node tr-peacock tr-slide-l" cx="20" cy="28" r="9" style={S(0.05)} />
      <circle className="tr-node tr-peacock tr-slide-r" cx="52" cy="28" r="9" style={S(0.05)} />
      <circle className="tr-pulse" cx="20" cy="28" r="2.6" style={S(0.8)} />
      <circle className="tr-pulse" cx="20" cy="28" r="2.6" style={S(1.05)} />
      <circle className="tr-rip tr-rip-peacock" cx="20" cy="28" r="9" style={S(1.3)} />
      <circle className="tr-rip tr-rip-peacock" cx="52" cy="28" r="9" style={S(1.3)} />
    </>
  )
}
function RuleOut() {
  return (
    <>
      <path className="tr-line tr-plum-line tr-draw" d="M12 41L26 15L40 41Z" style={{ ...S(0.35), '--len': 87.06, strokeDasharray: 87.06 }} />
      <line className="tr-dash tr-fade" x1="40" y1="40" x2="58" y2="22" style={S(1.25)} />
      <circle className="tr-node tr-plum tr-pop" cx="26" cy="15" r="6" style={S(0.1)} />
      <circle className="tr-node tr-plum tr-pop" cx="12" cy="41" r="6" style={S(0.18)} />
      <circle className="tr-node tr-plum tr-pop" cx="40" cy="41" r="6" style={S(0.26)} />
      <g className="tr-odd" style={S(0.7)}>
        <circle className="tr-node tr-terracotta" cx="59" cy="21" r="6.5" />
        <circle className="tr-rip tr-rip-terracotta" cx="59" cy="21" r="6.5" style={S(1.3)} />
      </g>
    </>
  )
}
function SecondOpinion() {
  return (
    <>
      <circle className="tr-node tr-terracotta tr-bad" cx="36" cy="28" r="7.5" style={S(0)} />
      <g className="tr-spin" style={S(0.2)}>
        <path className="tr-line tr-cobalt-line tr-draw" d="M46.32 13.25A18 18 0 1 1 25.68 13.25" style={{ ...S(0.2), '--len': 91.11, strokeDasharray: 91.11, '--dur': '0.9s' }} />
        <path className="tr-line tr-cobalt-line tr-fade" d="M17.2 12.47L26.91 12.39L23.51 21.48" style={S(0.95)} />
        <circle className="tr-node tr-cobalt tr-pop tr-small" cx="52.31" cy="35.61" r="3.6" style={S(0.6)} />
        <circle className="tr-node tr-cobalt tr-pop tr-small" cx="28.39" cy="44.31" r="3.6" style={S(0.72)} />
        <circle className="tr-node tr-cobalt tr-pop tr-small" cx="18" cy="28" r="3.6" style={S(0.84)} />
      </g>
      <circle className="tr-node tr-peacock tr-pop" cx="36" cy="28" r="7.5" style={S(1.15)} />
      <circle className="tr-rip tr-rip-peacock" cx="36" cy="28" r="7.5" style={S(1.35)} />
    </>
  )
}
const COVER = [
  [36, 8],
  [51.64, 15.53],
  [55.5, 32.45],
  [44.68, 46.02],
  [27.32, 46.02],
  [16.5, 32.45],
  [20.36, 15.53],
]
function Coverage() {
  return (
    <>
      <circle className="tr-faint" cx="36" cy="28" r="20" />
      <circle className="tr-line tr-peacock-line tr-draw" cx="36" cy="28" r="20" transform="rotate(-90 36 28)" style={{ ...S(1), '--len': 125.66, strokeDasharray: 125.66, '--dur': '0.6s' }} />
      {COVER.map(([x, y], i) => (
        <line key={`l${i}`} className="tr-spoke tr-fade" x1="36" y1="28" x2={x} y2={y} style={S(0.15 + i * 0.1)} />
      ))}
      {COVER.map(([x, y], i) => (
        <circle key={i} className="tr-node tr-peacock tr-pop tr-small" cx={x} cy={y} r="4" style={S(0.2 + i * 0.1)} />
      ))}
      <circle className="tr-node tr-peacock-deep" cx="36" cy="28" r="7" />
      <circle className="tr-rip tr-rip-peacock" cx="36" cy="28" r="20" style={S(1.55)} />
    </>
  )
}
function Mutation() {
  return (
    <>
      <g className="tr-glitch" style={S(0.75)}>
        <path className="tr-chain tr-draw" d="M8 34L21 22L35 34L49 22L63 32" style={{ ...S(0.05), '--len': 71.77, strokeDasharray: 71.77 }} />
      </g>
      <circle className="tr-node tr-terracotta tr-pop tr-small" cx="8" cy="34" r="5" style={S(0.15)} />
      <g className="tr-swap-a" style={S(0.75)}>
        <circle className="tr-node tr-terracotta tr-pop tr-small" cx="21" cy="22" r="5" style={S(0.22)} />
      </g>
      <g className="tr-swap-c" style={S(0.75)}>
        <circle className="tr-node tr-alt tr-pop tr-small" cx="35" cy="34" r="5" style={S(0.29)} />
      </g>
      <g className="tr-swap-b" style={S(0.75)}>
        <circle className="tr-node tr-terracotta tr-pop tr-small" cx="49" cy="22" r="5" style={S(0.36)} />
      </g>
      <g className="tr-swap-d" style={S(0.75)}>
        <circle className="tr-node tr-alt tr-pop tr-small" cx="63" cy="32" r="5" style={S(0.43)} />
      </g>
      <path className="tr-spark" d="M40 10l3 4-3 4M30 42l-3 4 3 4" style={S(0.75)} />
    </>
  )
}
const BURST = [
  [9, -7],
  [11, 2],
  [3, -11],
  [-6, -9],
  [12, -3],
]
function Crispr() {
  return (
    <>
      <line className="tr-faint" x1="14" y1="42" x2="58" y2="42" />
      <line className="tr-stem tr-fade" x1="36" y1="20" x2="36" y2="34" style={S(0.4)} />
      <path className="tr-guard" d="M14 42C16 20 56 20 58 42" style={S(0.55)} />
      <circle className="tr-node tr-plum tr-pop tr-small" cx="36" cy="20" r="5" style={S(0.62)} />
      <circle className="tr-node tr-plum tr-pop tr-small" cx="14" cy="42" r="5" style={S(0.05)} />
      <circle className="tr-node tr-plum tr-pop tr-small" cx="58" cy="42" r="5" style={S(0.12)} />
      <circle className="tr-node tr-peacock tr-pop" cx="36" cy="36" r="6" style={S(0.3)} />
      <circle className="tr-hit" cx="44" cy="22" r="3.4" style={S(0.5)} />
      {BURST.map(([dx, dy], i) => (
        <circle key={i} className={`tr-part ${i % 2 ? 'tr-part-light' : ''}`} cx="44" cy="22" r="1.4" style={{ ...S(0.98), '--dx': `${dx}px`, '--dy': `${dy}px` }} />
      ))}
      <circle className="tr-rip tr-rip-peacock" cx="36" cy="36" r="6" style={S(1.15)} />
    </>
  )
}

const ART = { curbside: Consult, lab: RuleOut, 'second-opinion': SecondOpinion, shield: Coverage, mutation: Mutation, crispr: Crispr }
// How long each one runs, in seconds (for staggering several in a row).
export const REVEAL_SECONDS = { curbside: 1.6, lab: 2.1, 'second-opinion': 1.8, shield: 1.9, mutation: 2.0, crispr: 1.6 }

export default function ToolReveal({ item, width = 72, delay = 0, className = '' }) {
  const Art = ART[item]
  if (!Art) return null
  return (
    <svg className={`tool-reveal ${className}`} width={width} height={(width * 56) / 72} viewBox="0 0 72 56" fill="none" aria-hidden="true" focusable="false" style={{ '--tr-base': `${delay}s` }}>
      <Art />
    </svg>
  )
}
