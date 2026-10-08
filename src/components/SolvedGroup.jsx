import React from 'react'
import { DIFFICULTY_LABEL } from './DifficultyIcon.jsx'
import { softHyphenate } from './TileText.jsx'

// ---------------------------------------------------------------------
// A solved group: four concepts that have become one connection.
// ---------------------------------------------------------------------
// The connection (category title) leads, difficulty is quiet metadata, the
// four concepts sit under it as linked nodes. "Explanation" opens the group's
// existing explanation (one group open at a time) with a link to report the
// connection. The same card on every board.

export default function SolvedGroup({
  category,
  color,
  forming = false, // just solved (the strand settles)
  revealing = false, // title resolving
  found = true, // false for a group revealed after a lost board
  expanded = false,
  onToggle,
  onReport,
}) {
  const detailId = `strand-detail-${category.catIndex ?? category.title}`
  const hasExplanation = Boolean(category.explanation)
  return (
    <div
      className={`strand ${forming ? 'strand-form' : ''} ${revealing ? 'is-revealing' : ''} ${found ? '' : 'is-missed-group'} ${expanded ? 'is-expanded' : ''}`}
      style={{ '--strand-color': color }}
    >
      <div className="strand-head">
        <span className="strand-title">{category.title}</span>
        <span className="strand-meta" aria-label={`Difficulty: ${DIFFICULTY_LABEL[category.level]}`}>
          {DIFFICULTY_LABEL[category.level]}
          {!found && ' · not found'}
        </span>
      </div>
      <ol className="strand-nodes">
        {category.items.map((it) => (
          <li className="strand-node" key={it.term}>
            <span className="strand-dot" aria-hidden="true" />
            <span className="strand-term">{softHyphenate(it.term)}</span>
          </li>
        ))}
      </ol>
      {(hasExplanation || onReport) && onToggle && (
        <button type="button" className="strand-why-toggle" aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}>
          {expanded ? 'Hide explanation' : 'Explanation'}
          <span className="strand-why-chevron" aria-hidden="true" />
        </button>
      )}
      {expanded && (
        <div className="strand-why" id={detailId}>
          {hasExplanation && <p className="strand-why-text">{category.explanation}</p>}
          {onReport && (
            <button type="button" className="report-link" onClick={onReport}>
              Report this connection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
