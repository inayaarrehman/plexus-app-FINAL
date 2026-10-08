import React, { useLayoutEffect, useRef } from 'react'
import { DIFFICULTY_LABEL } from './DifficultyIcon.jsx'
import GroupMotif from './GroupMotif.jsx'
import { wordTokens } from '../recall/normalize.js'
import { softHyphenate } from './TileText.jsx'

// ---------------------------------------------------------------------
// A solved group: four concepts that have become one connection.
// ---------------------------------------------------------------------
// Two presentations:
//
// 1. Today's Daily (`naming`): one focused moment per group.
//    - active: the naming panel. "Name the connection · +10 XP", the four
//      concepts, the input, Skip and Submit. Only one group is ever active;
//      the board waits until it is named or skipped.
//    - queued: a group still waiting its turn (only possible in a save made
//      before the one-at-a-time rule). A quiet row, no input.
//    - done: a compact row with the group's node motif, the category and
//      "Medium · +10 XP". It can be opened to show the concepts and the
//      explanation; only one row is open at a time.
//    Resolving (name or skip) reveals the category, lights the group's nodes
//    and collapses the panel into its row, about 350ms, with the height
//    animated so the board below never jumps.
//
// 2. Everywhere else (Systems, Archive): the solved group as before, the
//    connection leading and the four concepts under it.

// The category name with the words a close answer did not cover in bold.
function TitleWithMissing({ title, missing = [] }) {
  if (!missing.length) return title
  const miss = new Set(missing)
  return wordTokens(title).map((w, i) =>
    w.toks.some((t) => miss.has(t)) ? <b key={i}>{w.part}</b> : <React.Fragment key={i}>{w.part}</React.Fragment>
  )
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

// Animate the box between its old and new height when its content changes
// shape (panel to row, row opening), so nothing below jumps.
function useHeightMorph(ref, key) {
  const last = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const next = el.scrollHeight
    const prev = last.current
    last.current = next
    if (prev == null || Math.abs(prev - next) < 2 || prefersReducedMotion()) return undefined
    el.style.height = `${prev}px`
    el.style.overflow = 'hidden'
    // Force the start height before transitioning to the end height.
    void el.offsetHeight
    el.style.transition = 'height 340ms cubic-bezier(0.2, 0.7, 0.2, 1)'
    el.style.height = `${next}px`
    const done = () => {
      el.style.height = ''
      el.style.overflow = ''
      el.style.transition = ''
      last.current = el.scrollHeight
    }
    const t = setTimeout(done, 380)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

function Concepts({ items, className = '' }) {
  return (
    <ul className={`np-concepts ${className}`}>
      {items.map((it) => (
        <li className="np-concept" key={it.term}>
          <span className="np-dot" aria-hidden="true" />
          <span className="np-term">{softHyphenate(it.term)}</span>
        </li>
      ))}
    </ul>
  )
}

function NamingGroup({ category, color, mode, entry, draft, flash, bonusXp, found, expanded, resolving, onToggle, onDraft, onSubmit, onSkip }) {
  const box = useRef(null)
  useHeightMorph(box, `${mode}-${expanded ? 1 : 0}`)
  const checking = entry?.status === 'checking'
  const level = category.level
  const diff = DIFFICULTY_LABEL[level]
  const outcome =
    entry?.status === 'correct' ? `+${bonusXp} XP` : entry?.status === 'close' ? 'Close' : found === false ? 'Not found' : ''
  const panelId = `np-detail-${category.catIndex ?? category.title}`

  return (
    <div ref={box} className={`np cream-surface np-${mode} ${resolving ? 'is-resolving' : ''} ${expanded ? 'is-expanded' : ''}`} style={{ '--strand-color': color }}>
      {mode === 'active' && (
        <form
          className="np-panel"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.()
          }}
          aria-label="Name the connection"
        >
          <div className="np-head">
            <span className="np-title">Name the connection</span>
            <span className="np-xp">+{bonusXp} XP</span>
          </div>
          <Concepts items={category.items} />
          <input
            className="np-input recall-input"
            type="text"
            value={draft}
            onChange={(e) => onDraft?.(e.target.value)}
            placeholder="Type the connection"
            aria-label="Type the connection"
            maxLength={120}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            disabled={checking}
          />
          {entry?.status === 'clarify' && (
            <p className="np-note recall-note" role="status">
              Close. Be a little more specific.
              <span className="recall-safe"> One more try. No mistake counted.</span>
            </p>
          )}
          <div className="np-actions">
            <button type="button" className="np-skip recall-skip" onClick={onSkip} disabled={checking}>
              Skip
            </button>
            <button type="submit" className="np-submit recall-submit" disabled={!draft.trim() || checking}>
              {checking ? 'Checking' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      {mode === 'queued' && (
        <div className="np-row np-row-queued">
          <GroupMotif level={level} title="" size={22} />
          <span className="np-row-text">
            <span className="np-row-title">Next to name</span>
            <span className="np-row-meta">{diff}</span>
          </span>
        </div>
      )}

      {mode === 'done' && (
        <>
          <button type="button" className="np-row" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId}>
            <GroupMotif level={level} title="" size={22} missed={found === false} animate={resolving} />
            <span className="np-row-text">
              <span className="np-row-title">
                <TitleWithMissing title={category.title} missing={entry?.status === 'close' ? entry.missing : []} />
              </span>
              <span className="np-row-meta">
                {diff}
                {outcome && (
                  <>
                    {' · '}
                    <span className={entry?.status === 'correct' ? 'np-row-xp' : ''}>{outcome}</span>
                  </>
                )}
              </span>
            </span>
            <span className="np-chevron" aria-hidden="true" />
          </button>
          {flash && (
            <p className={`np-flash recall-flash ${flash.kind === 'correct' ? 'is-correct' : ''}`} role="status">
              {flash.text}
            </p>
          )}
          {expanded && (
            <div className="np-detail" id={panelId}>
              <Concepts items={category.items} className="is-compact" />
              {category.explanation && <p className="np-explain">{category.explanation}</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SolvedGroup(props) {
  const {
    category,
    color,
    naming = false,
    forming = false, // just solved (the group settles)
    revealing = false, // title just revealed
    pending = false, // waiting for the naming step
    open = false, // the naming step is the active one
    entry = null, // recall entry: { status, clarified, broader, missing }
    found,
    expanded = false,
    onToggle,
  } = props

  if (naming) {
    const mode = pending ? (open ? 'active' : 'queued') : 'done'
    return <NamingGroup {...props} mode={mode} found={found} expanded={expanded} resolving={revealing && !pending} onToggle={onToggle} />
  }

  return (
    <div className={`strand ${forming ? 'strand-form' : ''} ${revealing ? 'is-revealing' : ''}`} style={{ '--strand-color': color }}>
      <div className="strand-head">
        <span className="strand-title">
          <TitleWithMissing title={category.title} missing={entry?.status === 'close' ? entry.missing : []} />
        </span>
        <span className="strand-meta" aria-label={`Difficulty: ${DIFFICULTY_LABEL[category.level]}`}>
          {DIFFICULTY_LABEL[category.level]}
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
    </div>
  )
}
