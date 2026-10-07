import React from 'react'
import DifficultyIcon, { DIFFICULTY_LABEL } from './DifficultyIcon.jsx'
import { wordTokens } from '../recall/normalize.js'
import { softHyphenate } from './TileText.jsx'

// ---------------------------------------------------------------------
// A solved group: four concepts that have become one connection.
// ---------------------------------------------------------------------
// Hierarchy: the connection (category title) leads, the four concepts sit
// under it, difficulty is small metadata in the corner. A small converge mark
// (four nodes drawn into one) sits beside the title, and when the title is
// revealed the lines draw in and the title settles (about 250ms).
//
// On today's Daily the title first waits behind an optional "Name the
// connection" step. Only one group is open for naming at a time; any other
// unnamed group stays as a compact row the player can open or skip.

export function ConvergeMark({ className = '' }) {
  const ys = [3, 9, 15, 21]
  return (
    <svg className={`converge-mark ${className}`} width="28" height="24" viewBox="0 0 28 24" aria-hidden="true" focusable="false">
      {ys.map((y) => (
        <line key={`l${y}`} className="cm-line" x1="3" y1={y} x2="23" y2="12" pathLength="1" />
      ))}
      {ys.map((y) => (
        <circle key={`n${y}`} className="cm-node" cx="3" cy={y} r="2" />
      ))}
      <circle className="cm-hub" cx="23.5" cy="12" r="3.2" />
    </svg>
  )
}

// The category name with the words a close answer did not cover in bold.
function TitleWithMissing({ title, missing = [] }) {
  if (!missing.length) return title
  const miss = new Set(missing)
  return wordTokens(title).map((w, i) =>
    w.toks.some((t) => miss.has(t)) ? <b key={i}>{w.part}</b> : <React.Fragment key={i}>{w.part}</React.Fragment>
  )
}

export default function SolvedGroup({
  category,
  color,
  forming = false, // just solved (the strand settles)
  revealing = false, // title just revealed (lines draw in)
  pending = false, // waiting for the optional naming step
  open = false, // the naming step is the active one
  entry = null, // recall entry: { status, clarified, broader, missing }
  draft = '',
  flash = null, // brief confirmation text after naming
  bonusXp = 10,
  onOpen,
  onDraft,
  onSubmit,
  onSkip,
}) {
  const checking = entry?.status === 'checking'
  return (
    <div
      className={`strand ${forming ? 'strand-form' : ''} ${pending ? 'is-pending' : ''} ${pending && !open ? 'is-compact' : ''} ${
        revealing ? 'is-revealing' : ''
      }`}
      style={{ '--strand-color': color }}
    >
      <div className="strand-head">
        {pending ? (
          <span className="strand-title strand-title-recall">Name the connection · +{bonusXp} XP</span>
        ) : (
          <>
            <ConvergeMark className="strand-converge" />
            <span className="strand-title">
              <TitleWithMissing title={category.title} missing={entry?.status === 'close' ? entry.missing : []} />
            </span>
          </>
        )}
        <span className="strand-meta" aria-label={`Difficulty: ${DIFFICULTY_LABEL[category.level]}`}>
          <DifficultyIcon level={category.level} size={15} decorative />
          {DIFFICULTY_LABEL[category.level]}
        </span>
      </div>

      {flash && (
        <p className={`recall-flash ${flash.kind === 'correct' ? 'is-correct' : ''}`} role="status">
          {flash.text}
        </p>
      )}

      <ol className="strand-nodes">
        {category.items.map((it) => (
          <li className="strand-node" key={it.term}>
            <span className="strand-dot" aria-hidden="true" />
            <span className="strand-term">{softHyphenate(it.term)}</span>
          </li>
        ))}
      </ol>

      {pending && open && (
        <form
          className="recall-form"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.()
          }}
        >
          <input
            className="recall-input"
            type="text"
            value={draft}
            onChange={(e) => onDraft?.(e.target.value)}
            placeholder="Type the connection"
            aria-label="Name the connection"
            maxLength={120}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            disabled={checking}
          />
          <button type="submit" className="recall-submit" disabled={!draft.trim() || checking}>
            {checking ? 'Checking' : 'Submit'}
          </button>
          <button type="button" className="recall-skip" onClick={onSkip} disabled={checking}>
            Skip
          </button>
          {entry?.status === 'clarify' && (
            <p className="recall-note" role="status">
              Close. Be a little more specific.
              <span className="recall-safe">One more try. No mistake counted.</span>
            </p>
          )}
        </form>
      )}

      {pending && !open && (
        <div className="recall-compact">
          <button type="button" className="recall-open" onClick={onOpen}>
            Name it
          </button>
          <button type="button" className="recall-skip recall-skip-small" onClick={onSkip}>
            Skip
          </button>
        </div>
      )}
    </div>
  )
}
