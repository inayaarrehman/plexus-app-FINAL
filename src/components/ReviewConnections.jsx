import React, { useState } from 'react'
import { getThreadForCategory } from '../utils/threads.js'
import { isConnectionSaved, toggleSavedConnection } from '../utils/storage.js'
import ThreadModal from './ThreadModal.jsx'
import { groupColor } from './GroupMotif.jsx'
import { difficultyLabelOf } from './DifficultyIcon.jsx'
import { reportContext } from '../utils/reportContext.js'
import { featureState, unlockRequirement, encounteredConnectionIds } from '../utils/featureUnlocks.js'

const levelColor = (level) => groupColor(level)

// onReport(context): opens Report this connection for a category.
// "Follow the thread" opens once the player has finished enough Dailies
// (utils/featureUnlocks.js); until then it shows as locked, without naming
// the thread or the systems it reaches, so nothing ahead is hinted at.
export default function ReviewConnections({ puzzle, onReport, reportMode = 'daily', puzzleDate = null }) {
  const [openIndex, setOpenIndex] = useState(null)
  const [activeThread, setActiveThread] = useState(null)
  const threadLock = featureState('thread')
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
        const thread = getThreadForCategory(cat)
        return (
          <div className="accordion-item" key={cat.catIndex}>
            <button
              className="accordion-header"
              style={{ borderLeftColor: levelColor(cat.level) }}
              onClick={() => setOpenIndex(isOpen ? null : cat.catIndex)}
              aria-expanded={isOpen}
            >
              <span className="accordion-title">{cat.title}</span>
              <span className="accordion-level">{difficultyLabelOf(cat)}</span>
              <span className="accordion-caret">{isOpen ? 'Hide why' : 'Why?'}</span>
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
                {thread &&
                  (threadLock.unlocked ? (
                    <button className="follow-thread-btn" onClick={() => setActiveThread(thread)}>
                      <span className="follow-thread-label">
                        {thread.label} &middot; {thread.systems.slice(0, 3).join(' · ')}
                      </span>
                      <span className="follow-thread-cta">
                        Follow the thread <span aria-hidden="true">&rarr;</span>
                      </span>
                    </button>
                  ) : (
                    <div className="follow-thread-btn is-locked" role="note">
                      <span className="follow-thread-cta">
                        <LockMark /> Follow the thread
                      </span>
                      <span className="follow-thread-label">
                        This connection links to others across Plexus. Unlocks after {unlockRequirement('thread')} ({threadLock.have.dailies}/{threadLock.need.dailies}).
                      </span>
                    </div>
                  ))}
                {onReport && (
                  <button type="button" className="report-link" onClick={() => onReport(reportContext(puzzle, puzzle.categories[cat.catIndex], { mode: reportMode, date: puzzleDate }))}>
                    Report this connection
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
      {activeThread && <ThreadModal thread={activeThread} verified={featureState('verified')} encountered={encounteredConnectionIds({ extra: [puzzle] })} onClose={() => setActiveThread(null)} />}
    </div>
  )
}

function LockMark() {
  return (
    <svg className="lock-mark" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
      <rect x="2" y="5.2" width="8" height="5.8" rx="1.4" fill="currentColor" />
      <path d="M3.9 5.4V3.9a2.1 2.1 0 0 1 4.2 0v1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
