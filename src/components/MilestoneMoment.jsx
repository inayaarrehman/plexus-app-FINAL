// Milestone reached: the screen dims, the new badge grows, and the bundle
// arrives one tool at a time. Shown once per milestone on this device (the
// highest one shown is remembered), over whatever result card crossed it.
// Tap anywhere to skip to the end; Escape or Continue closes it. With
// reduced motion everything is shown at once.
import { useEffect, useRef, useState } from 'react'
import PlexusBadge from './PlexusBadge.jsx'
import ToolReveal from './ToolReveal.jsx'
import { KIT } from '../progression/config.js'

const SEEN_KEY = 'plexus.milestone.shown'
export function milestoneShown() {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0
  } catch {
    return 0
  }
}
function markShown(level) {
  try {
    if (level > milestoneShown()) localStorage.setItem(SEEN_KEY, String(level))
  } catch {
    /* storage unavailable: it may show again, nothing else breaks */
  }
}
// The milestone to celebrate from a result, if it has not been shown here.
export function milestoneToShow(result) {
  const list = result?.milestones || []
  if (!list.length) return null
  const top = list[list.length - 1]
  return top.level > milestoneShown() ? top : null
}

const PART_COLOURS = ['#e07a5f', '#3fb3aa', '#6f98e2', '#ad86d6']
const PARTS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + (i % 2 ? 0.18 : 0)
  const dist = i % 2 ? 128 : 108
  return { c: PART_COLOURS[i % 4], s: i % 3 === 0 ? 10 : 7, dx: Math.round(Math.cos(a) * dist), dy: Math.round(Math.sin(a) * dist), d: 1950 + (i % 4) * 40 }
})

export default function MilestoneMoment({ milestone, caps = {}, onClose, onOpenRecord }) {
  const [skipped, setSkipped] = useState(false)
  const btn = useRef(null)
  const level = milestone.level
  useEffect(() => {
    markShown(level)
    btn.current?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [level, onClose])

  const rows = milestone.tools.map((t) => ({ item: t.item, name: `${KIT[t.item]?.name || t.item} +1`, note: t.as === 'pending' ? 'Waiting as a claim in Your Tools' : null }))
  if (milestone.crispr) rows.push({ item: 'crispr', name: 'CRISPR +1', note: 'Race power-up, once CRISPR is unlocked' })
  const cap = caps.curbside
  const itemAt = (i) => 2.45 + i * 0.12

  return (
    <div className={`ms-overlay ${skipped ? 'is-skipped' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ms-title" onClick={() => setSkipped(true)}>
      <div className="ms-panel">
        <div className="ms-stage" aria-hidden="true">
          <span className="ms-wave" />
          <span className="ms-wave" />
          {PARTS.map((p, i) => (
            <span key={i} className="ms-part" style={{ width: p.s, height: p.s, background: p.c, '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animationDelay: `${p.d}ms` }} />
          ))}
          <PlexusBadge level={level} size={200} animate decorative />
        </div>
        <h2 id="ms-title" className="ms-title ms-rise" style={{ animationDelay: '2.2s' }}>
          Level {level} reached
        </h2>
        <p className="ms-sub ms-rise" style={{ animationDelay: '2.35s' }}>
          Your plexus grew. A new badge is on My Plexus.
        </p>
        <ul className="ms-list" aria-label="Milestone rewards">
          {rows.map((r, i) => (
            <li key={r.item} className="ms-item ms-rise" style={{ animationDelay: `${itemAt(i)}s` }}>
              <ToolReveal item={r.item} width={40} delay={itemAt(i) + 0.1} />
              <span className="ms-item-name">
                {r.name}
                {r.note && <span className="ms-item-note">{r.note}</span>}
              </span>
            </li>
          ))}
          {cap ? (
            <li className="ms-item ms-rise" style={{ animationDelay: `${itemAt(rows.length)}s` }}>
              <span className="ms-cap" aria-hidden="true">
                +1
              </span>
              <span className="ms-item-name">
                {`Tool limit: ${cap} of each`}
                <span className="ms-item-note">Consult, Rule Out and Second Opinion</span>
              </span>
            </li>
          ) : null}
        </ul>
        <div className="ms-actions ms-rise" style={{ animationDelay: `${itemAt(rows.length + 1) + 0.3}s` }}>
          <button
            type="button"
            ref={btn}
            className="ms-continue"
            onClick={(e) => {
              e.stopPropagation()
              onClose?.()
            }}
          >
            Continue
          </button>
          {onOpenRecord && (
            <button
              type="button"
              className="ms-open"
              onClick={(e) => {
                e.stopPropagation()
                onClose?.()
                onOpenRecord()
              }}
            >
              See My Plexus
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
