import React, { useId, useState } from 'react'

// ---------------------------------------------------------------------
// One connection, explained: the shared connection first, then a note for
// each tile under "Explain each tile". Used by the solved group on the board,
// Review connections after a puzzle, and saved connections.
// ---------------------------------------------------------------------
// Text comes only from the content: `detail` (the fuller explanation) when
// the library served one after review, otherwise the reviewed one-line
// `explanation`; tile notes are each item's `why`, present only when served.
// Nothing is written here. On wide screens the tile notes start open; on a
// phone they start folded so the board stays short.
const startOpen = () => {
  try {
    return window.matchMedia('(min-width: 720px)').matches
  } catch {
    return false
  }
}

export default function ConnectionExplain({ category, className = '' }) {
  const id = useId()
  const [open, setOpen] = useState(startOpen)
  const text = category.detail || category.explanation || ''
  const items = category.items || []
  const hasNotes = items.length > 0 && items.some((it) => it.why)
  if (!text && !hasNotes) return null
  return (
    <div className={`cx ${className}`}>
      {text && (
        <div className="cx-connection">
          <span className="cx-label">The connection</span>
          <p className="cx-text">{text}</p>
        </div>
      )}
      {hasNotes && (
        <div className="cx-tiles">
          <button type="button" className="cx-toggle" aria-expanded={open} aria-controls={`${id}-tiles`} onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide tile explanations' : 'Explain each tile'}
            <span className="cx-chevron" aria-hidden="true" />
          </button>
          {open && (
            <dl className="cx-list" id={`${id}-tiles`}>
              {items.map((it) => (
                <div className="cx-tile" key={it.term}>
                  <dt className="cx-term">{it.term}</dt>
                  <dd className="cx-why">{it.why || 'No note for this tile yet.'}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  )
}
