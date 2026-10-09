import React, { useState } from 'react'
import { isConnectionSaved, toggleSavedConnection } from '../utils/storage.js'
import { groupColor } from './GroupMotif.jsx'
import { difficultyLabelOf } from './DifficultyIcon.jsx'
import { reportContext } from '../utils/reportContext.js'

const levelColor = (level) => groupColor(level)

// onReport(context): opens Report this connection for a category.
export default function ReviewConnections({ puzzle, onReport, reportMode = 'daily', puzzleDate = null }) {
  const [openIndex, setOpenIndex] = useState(null)
  // Reflects saved state per category so the toggle updates instantly;
  // seeded lazily from persistence the first time a category is checked.
  const [savedMap, setSavedMap] = useState({})

  const savedFor = (cat) => (cat.catIndex in savedMap ? savedMap[cat.catIndex] : isConnectionSaved(cat))
  const handleSave = (cat) => {
    const nowSaved = toggleSavedConnection(cat)
    setSavedMap((prev) => ({ ...prev, [cat.catIndex]: nowSaved }))
  }

  const ordered = puzzle.categories
    .map((c, i) => ({ ...c, catIndex: i }))
    .sort((a, b) => a.level - b.level)

  return (
    <div className="review-panel">
      {ordered.map((cat) => {
        const isOpen = openIndex === cat.catIndex
        return (
          <div className="accordion-item" key={cat.catIndex}>
            <button
              className="accordion-header"
              style={{ borderLeftColor: levelColor(cat.level) }}
              onClick={() => setOpenIndex(isOpen ? null : cat.catIndex)}
              aria-expanded={isOpen}
            >
              <span className="accordion-title">{cat.title}</span>
              <span className="accordion-meta">
                <span className="accordion-level">{difficultyLabelOf(cat)}</span>
                <span className="accordion-caret">{isOpen ? 'Hide why' : 'Why?'}</span>
              </span>
            </button>
            {isOpen && (
              <div className="accordion-body">
                <p className="accordion-explanation">{cat.explanation}</p>
                <ul className="accordion-item-list">
                  {cat.items.map((item) => (
                    <li key={item.term}>
                      <strong>{item.term}</strong>
                      {item.why && <span>{item.why}</span>}
                    </li>
                  ))}
                </ul>
                {cat.remember && (
                  <p className="remember-line">
                    <span className="remember-label">Remember this</span>
                    {cat.remember}
                  </p>
                )}
                {/* Save and Report sit in one action row that wraps (and stacks
                    on narrow screens) instead of running into each other. */}
                <div className="card-actions accordion-actions">
                  <button
                    className={`save-connection-btn ${savedFor(cat) ? 'is-saved' : ''}`}
                    onClick={() => handleSave(cat)}
                    aria-pressed={savedFor(cat)}
                  >
                    <span className="save-connection-mark" aria-hidden="true">
                      {savedFor(cat) ? '★' : '☆'}
                    </span>
                    {savedFor(cat) ? 'Saved' : 'Save'}
                  </button>
                  {onReport && (
                    <button type="button" className="report-link" onClick={() => onReport(reportContext(puzzle, puzzle.categories[cat.catIndex], { mode: reportMode, date: puzzleDate }))}>
                      Report this connection
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

