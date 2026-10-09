import React, { useMemo, useState, useCallback } from 'react'
import { systemAccent } from '../utils/systemAccent.js'
import { categoriesForSystem } from '../utils/mastery.js'
import { LIBRARY_SUBJECTS, subjectLabel, subjectProgress, CAUGHT_UP_COPY } from '../utils/newLibrary.js'
import { getSystemGlyph, resolveGlyph } from '../utils/systemGlyphs.js'
import { haptics } from '../utils/haptics.js'
import SubmitConnectionModal from './SubmitConnectionModal.jsx'
import { loadProgress } from '../utils/storage.js'

// Each system's accent comes from utils/systemAccent.js (shared with the
// completion celebration), cycled through the four Plexus node colours.

// The detail-view progress chain — a short node chain (●—●—○—○—○) echoing
// the Plexus mark, kept ONLY on the system detail page. It was deliberately
// removed from the grid nodes (§12): the abstract topology already carries
// progress there, and topology + chain + X/Y read as crowded.
const CHAIN = 5
function ProgressBar({ value, max, accent }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  let filled = max > 0 ? Math.round((value / max) * CHAIN) : 0
  if (value > 0 && filled === 0) filled = 1
  if (value < max && filled === CHAIN) filled = CHAIN - 1
  if (max > 0 && value >= max) filled = CHAIN
  return (
    <div
      className="node-progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={accent ? { '--node-fill': accent } : undefined}
    >
      {Array.from({ length: CHAIN }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className={`node-link ${i < filled ? 'is-on' : ''}`} aria-hidden="true" />}
          <span className={`node-dot ${i < filled ? 'is-on' : ''}`} aria-hidden="true" />
        </React.Fragment>
      ))}
    </div>
  )
}

// The anatomical Plexus glyph drawn inside each system tile — the star of the
// page (§30). A hand-authored constellation (systemGlyphs.js) suggesting the
// organ/system form from nodes + paths. The FULL network is always faintly
// visible (§20); a deterministic prefix resolves in proportion to real X/Y,
// and a path brightens only once both its endpoints have (§22), so the network
// "comes alive" through the anatomy. Decorative — hidden from assistive tech.
// `tone` picks the ink: 'light' over a coloured tile, 'accent' on seafoam.
function Glyph({ system, fraction, empty, tone = 'light' }) {
  const glyph = useMemo(() => getSystemGlyph(system), [system])
  const state = useMemo(() => resolveGlyph(glyph, fraction, { empty }), [glyph, fraction, empty])
  return (
    <svg
      className={`system-glyph tone-${tone}`}
      viewBox="8 8 84 84"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Outer group carries the static per-glyph normalization scale (§8);
          the inner group handles the press-tighten transform, so the two
          never fight. */}
      <g transform={glyph.scale !== 1 ? `translate(50 50) scale(${glyph.scale}) translate(-50 -50)` : undefined}>
        <g className="system-glyph-inner">
          {glyph.links.map((link, i) => {
            const [a, b] = link
            const on = state.isLinkOn(link)
            return (
              <line
                key={`l${i}`}
                className={`glyph-link ${on ? 'is-on' : ''}`}
                x1={glyph.nodes[a].x}
                y1={glyph.nodes[a].y}
                x2={glyph.nodes[b].x}
                y2={glyph.nodes[b].y}
              />
            )
          })}
          {glyph.nodes.map((n, i) => {
            const on = state.isNodeOn(i)
            return <circle key={`n${i}`} className={`glyph-node ${on ? 'is-on' : ''}`} cx={n.x} cy={n.y} r={on ? 4.4 : 3.6} />
          })}
        </g>
      </g>
    </svg>
  )
}

// Render a system name with a clean break opportunity after any "/" so long
// compound labels wrap at the slash ("Biochemistry/ Genetics") rather than
// mid-word (§13/§32). Display-only — the underlying system string is untouched.
function nameWithBreaks(system) {
  const parts = system.split('/')
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, '/', <wbr key={`w${i}`} />]
      : [part]
  )
}

// One tactile Plexus node in the grid. The node itself IS the button (§24):
// no inner card, no badges. Press gives a restrained physical response
// (§29) and a light haptic on release (§17); Coming-Soon systems render as
// unformed, muted tiles with no haptic (§35).
function SystemNode({ system, total, solved, accent, onEnter }) {
  const [pressed, setPressed] = useState(false)
  const empty = total === 0
  const fraction = total > 0 ? solved / total : 0
  const complete = !empty && solved >= total

  const release = useCallback(() => setPressed(false), [])
  const name = subjectLabel(system)
  const label = empty
    ? `${name}. Coming soon.`
    : `${name}. ${solved} of ${total} boards completed.`

  return (
    <button
      type="button"
      className={`system-node ${empty ? 'is-empty' : ''} ${pressed ? 'is-pressed' : ''} ${complete ? 'is-complete' : ''}`}
      style={{ '--node-accent': accent }}
      aria-label={label}
      aria-disabled={empty || undefined}
      onPointerDown={() => !empty && setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={() => {
        if (empty) return
        haptics.select()
        onEnter(system)
      }}
    >
      <span className="system-node-glyph">
        <Glyph system={system} fraction={fraction} empty={empty} tone="accent" />
      </span>
      <span className="system-node-label">
        <span className="system-node-name">{nameWithBreaks(name)}</span>
        {empty ? (
          <span className="system-node-soon">Coming soon</span>
        ) : (
          <span className="system-node-count">
            {solved} of {total}
          </span>
        )}
      </span>
    </button>
  )
}

export default function Systems({ todayKey, finishedBoards, boardAttempts = {}, initialSelected = null, onSelectedChange, notice = null, onClearNotice, onPlaySystem, onReplayBoard, onBack, playNotice, onDismissPlayNotice }) {
  const [selected, setSelectedState] = useState(initialSelected)
  const setSelected = useCallback(
    (s) => {
      setSelectedState(s)
      onSelectedChange?.(s)
      if (!s) onClearNotice?.()
    },
    [onSelectedChange, onClearNotice]
  )
  const [entering, setEntering] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const suggest = (
    <>
      <div className="systems-suggest">
        <p className="systems-suggest-line">Found a connection we missed?</p>
        <button type="button" className="systems-suggest-btn" onClick={() => setSuggesting(true)}>
          Submit a Connection
        </button>
      </div>
      {suggesting && <SubmitConnectionModal defaultSystem={selected || ''} onClose={() => setSuggesting(false)} />}
    </>
  )

  // Systems content is the new library only: each subject's fixed starter
  // boards plus the boards released from past Dailies (utils/newLibrary.js).
  // Progress is boards finished out of boards available today.
  const rows = useMemo(
    () =>
      LIBRARY_SUBJECTS.map((system) => {
        const p = subjectProgress(system, todayKey, finishedBoards, boardAttempts)
        return { system, total: p.total, solved: p.completed }
      }),
    [todayKey, finishedBoards, boardAttempts]
  )

  // Restrained system-entry transition (§16): the tapped node's accent
  // briefly washes outward, then the system page appears. Kept simple — a
  // CSS animation on mount, no shared-element routing. Reduced-motion users
  // get the page immediately (the wash class is a no-op under the media query).
  const enterSystem = useCallback(
    (system) => {
      setSelected(system)
      setEntering(true)
    },
    [setSelected]
  )

  if (selected) {
    const p = subjectProgress(selected, todayKey, finishedBoards, boardAttempts)
    const returning = p.queue.filter((x) => x.tries > 0)
    // Same pick as App.playSystem: a board left mid-attempt by a refresh or
    // closed app resumes first.
    const inProgress = p.queue.find((x) => {
      const saved = loadProgress(x.board.id)
      return saved && !saved.gameOver && Array.isArray(saved.guessLog) && saved.guessLog.length > 0
    })
    const upNext = inProgress || p.next
    const comingBack = returning.filter((x) => x !== upNext)
    const total = p.total
    const solved = p.completed
    const accent = systemAccent(selected)
    const name = subjectLabel(selected)
    return (
      <div
        className={`systems system-detail-view ${entering ? 'is-entering' : ''}`}
        style={{ '--node-accent': accent }}
        onAnimationEnd={() => setEntering(false)}
      >
        <div className="system-enter-wash" aria-hidden="true" />
        <div className="game-header">
          <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Back to systems">
            &larr; Systems
          </button>
          <div className="game-header-title">
            <span>{name}</span>
          </div>
          <div />
        </div>

        <div className="system-detail">
          <div className="system-detail-sig" aria-hidden="true">
            <Glyph system={selected} fraction={total > 0 ? solved / total : 0} empty={total === 0} tone="accent" />
          </div>
          <h1 className="system-detail-title">{name}</h1>
          {total > 0 && solved >= total && <p className="system-detail-connected">System connected. Every connection found.</p>}
          <p className="system-detail-count">
            {solved} of {total} boards solved
          </p>
          <ProgressBar value={solved} max={total} accent={accent} />
          {playNotice && (
            <p className="system-play-notice" role="status">
              {playNotice}{' '}
              <button className="link-btn" onClick={onDismissPlayNotice}>
                Dismiss
              </button>
            </p>
          )}
          {notice && (
            <div className="system-still-connecting" role="status">
              <span className="system-still-node" aria-hidden="true" />
              <p>
                <b>{notice.title}</b> {notice.text}
              </p>
            </div>
          )}
          {p.next ? (
            <>
              <button
                className="system-play-btn"
                style={{ '--node-accent': accent }}
                onClick={() => onPlaySystem(selected)}
              >
                {inProgress ? 'Continue' : upNext.tries > 0 ? 'Try again' : solved > 0 || returning.length ? 'Next Puzzle' : 'Play'} <span className="system-play-arrow" aria-hidden="true">&rarr;</span>
              </button>
              <p className="system-next-line">
                Up next: Board {upNext.index + 1}
                {inProgress ? ' · in progress' : upNext.tries > 0 ? ` · back for try ${upNext.tries + 1}` : ''}
              </p>
              {returning.length > 0 && (
                <p className="system-rotation-note">
                  Boards you leave or miss come back around after the others, until you solve them. Answers stay hidden until then.
                  {comingBack.length > 0 && (
                    <>
                      {' '}
                      <span className="system-rotation-list">Coming back: {comingBack.map((x) => `Board ${x.index + 1}`).join(', ')}.</span>
                    </>
                  )}
                </p>
              )}
            </>
          ) : (
            <p className="system-caught-up" role="status">
              {CAUGHT_UP_COPY}
            </p>
          )}
          {onReplayBoard && p.boards.some((b) => finishedBoards[b.id]?.won) && (
            <div className="system-replays">
              <p className="system-replays-head">Replay a board</p>
              <div className="system-replays-row">
                {p.boards.map((b, i) =>
                  finishedBoards[b.id]?.won ? (
                    <button key={b.id} className="system-replay-btn" onClick={() => onReplayBoard(selected, b, i)}>
                      Board {i + 1}
                    </button>
                  ) : null
                )}
              </div>
            </div>
          )}
          {suggest}
        </div>
      </div>
    )
  }

  return (
    <div className="systems">
      <div className="systems-head">
        <button className="icon-btn systems-back" onClick={onBack} aria-label="Back">
          &larr;
        </button>
        <h1 className="systems-title">Systems</h1>
      </div>

      <div className="system-grid">
        {rows.map(({ system, total, solved }) => (
          <SystemNode
            key={system}
            system={system}
            total={total}
            solved={solved}
            accent={systemAccent(system)}
            onEnter={enterSystem}
          />
        ))}
      </div>
      {suggest}
    </div>
  )
}

export { categoriesForSystem }
