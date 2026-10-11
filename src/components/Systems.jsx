import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { systemAccent } from '../utils/systemAccent.js'
import { categoriesForSystem } from '../utils/mastery.js'
import { LIBRARY_SUBJECTS, subjectLabel, subjectProgress } from '../utils/newLibrary.js'
import { getSystemGlyph, resolveGlyph } from '../utils/systemGlyphs.js'
import { haptics } from '../utils/haptics.js'
import SubmitConnectionModal from './SubmitConnectionModal.jsx'
import { loadProgress } from '../utils/storage.js'
import BodyMap from './BodyMap.jsx'

// ---------------------------------------------------------------------
// Systems: a body map of the organ systems with a preview of the chosen one.
// ---------------------------------------------------------------------
// Desktop (900px and up): heading and overall progress on the left, a body
// map in the middle, and a preview of the selected system on the right.
// Choosing an organ or its label only changes the preview; the preview's
// button opens the next eligible board (App.playSystem, the existing
// rotation). Phone and tablet: the heading, the body map and the rows
// "Beyond the body map"; choosing a system opens its own landing page. The
// map itself is BodyMap.jsx (one SVG with label and organ targets over it).
// Every count comes from subjectProgress (the real boards and the player's
// solved boards and attempts). Nothing here picks a board or shows answers.

// Systems not drawn on the body: compact rows under the map.
const BEYOND_SYSTEMS = ['Heme/Onc', 'Microbiology', 'Immunology', 'Pharmacology', 'Biochemistry/Genetics', 'Genetics']
const LAST_KEY = 'plexus.systems.last.v1'
const readLast = () => {
  try {
    const v = window.localStorage.getItem(LAST_KEY)
    return LIBRARY_SUBJECTS.includes(v) ? v : null
  } catch {
    return null
  }
}
const writeLast = (s) => {
  try {
    window.localStorage.setItem(LAST_KEY, s)
  } catch {
    // ignore
  }
}

function useWide(query = '(min-width: 900px)') {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)
  const [wide, setWide] = useState(get)
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const mq = window.matchMedia(query)
    const on = () => setWide(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [query])
  return wide
}

// The node organ artwork (utils/systemGlyphs.js). The whole network is faint;
// a share of it lights in the system's colour in proportion to boards solved.
function Glyph({ system, fraction, empty, tone = 'accent' }) {
  const glyph = useMemo(() => getSystemGlyph(system), [system])
  const state = useMemo(() => resolveGlyph(glyph, fraction, { empty }), [glyph, fraction, empty])
  return (
    <svg className={`system-glyph tone-${tone}`} viewBox="8 8 84 84" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      <g transform={glyph.scale !== 1 ? `translate(50 50) scale(${glyph.scale}) translate(-50 -50)` : undefined}>
        <g className="system-glyph-inner">
          {glyph.links.map((link, i) => {
            const [a, b] = link
            return <line key={`l${i}`} className={`glyph-link ${state.isLinkOn(link) ? 'is-on' : ''}`} x1={glyph.nodes[a].x} y1={glyph.nodes[a].y} x2={glyph.nodes[b].x} y2={glyph.nodes[b].y} />
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

// The system's state for the preview and the landing page: counts, the next
// eligible board (a board left mid-attempt by a refresh first, as
// App.playSystem resumes it), and the button's label.
function systemState(system, todayKey, finishedBoards, boardAttempts) {
  const p = subjectProgress(system, todayKey, finishedBoards, boardAttempts)
  const inProgress = p.queue.find((x) => {
    const saved = loadProgress(x.board.id)
    return saved && !saved.gameOver && Array.isArray(saved.guessLog) && saved.guessLog.length > 0
  })
  const upNext = inProgress || p.next
  const returning = p.queue.filter((x) => x.tries > 0)
  let action = null
  if (upNext) {
    const n = upNext.index + 1
    if (inProgress) action = `Continue Board ${n}`
    else if (upNext.tries > 0) action = `Try Board ${n} again`
    else if (p.completed === 0 && !returning.length) action = `Start Board ${n}`
    else action = `Next Board ${n}`
  }
  return { ...p, upNext, inProgress, returning, action, complete: p.total > 0 && p.completed >= p.total }
}

// One node per board, in board order: solved boards filled with a check,
// the next eligible board ringed, the rest open. Informational only.
function BoardPath({ st, accent }) {
  const nextId = st.upNext?.board.id
  return (
    <ol className="board-path" style={{ '--node-accent': accent }} aria-label={`Board progress: ${st.completed} of ${st.total} solved${st.upNext ? `, up next Board ${st.upNext.index + 1}` : ''}`}>
      {st.boards.map((b, i) => {
        const solved = st.solvedIds.has(b.id)
        const next = b.id === nextId
        return (
          <li key={b.id} className={`board-path-node ${solved ? 'is-solved' : ''} ${next ? 'is-next' : ''}`} aria-hidden="true">
            {solved && (
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M3.5 8.4 6.6 11.3 12.5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="sr-only">Board {i + 1}</span>
          </li>
        )
      })}
    </ol>
  )
}

// The selected system: artwork, name, counts, board path, next board and the
// primary action. Used for the desktop preview and the phone landing page.
function SystemPanel({ system, st, onPlay, onReplayBoard, finishedBoards, notice, playNotice, onDismissPlayNotice, variant }) {
  const accent = systemAccent(system)
  const name = subjectLabel(system)
  const solvedBoards = st.boards.map((b, i) => ({ b, i })).filter(({ b }) => finishedBoards[b.id]?.won)
  return (
    <section className={`system-panel is-${variant}`} style={{ '--node-accent': accent }} aria-labelledby={`system-panel-title-${variant}`} aria-live="polite">
      <div className="system-panel-art" aria-hidden="true">
        <Glyph system={system} fraction={st.total ? st.completed / st.total : 0} empty={st.total === 0} />
      </div>
      <h2 className="system-panel-title" id={`system-panel-title-${variant}`}>
        {name}
      </h2>
      <p className="system-panel-count">
        {st.completed} of {st.total} boards solved
      </p>
      <BoardPath st={st} accent={accent} />
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
      {st.upNext ? (
        <>
          <p className="system-next-line">
            Up next: Board {st.upNext.index + 1}
            {st.inProgress ? ' · in progress' : st.upNext.tries > 0 ? ` · try ${st.upNext.tries + 1}` : ''}
          </p>
          <button className="system-play-btn" onClick={() => onPlay(system)}>
            {st.action} <span className="system-play-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </>
      ) : (
        <p className="system-all-solved" role="status">
          <span className="system-all-solved-mark" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path d="M3.5 8.4 6.6 11.3 12.5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <b>All boards solved.</b> System connected. Every connection found. New boards arrive as more Dailies are released.
          </span>
        </p>
      )}
      <details className="system-howto">
        <summary>
          <svg className="system-howto-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M3 5.5c3-1.2 6-1.2 9 .8 3-2 6-2 9-.8v13c-3-1.2-6-1.2-9 .8-3-2-6-2-9-.8z M12 6.3v13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          How Systems works
          <span className="system-howto-chev" aria-hidden="true" />
        </summary>
        <p>Boards you leave or miss come back after the others, until you solve them. Answers stay hidden until then.</p>
        <p>Solving pays 100 XP on the first try, then 75, 50, and 25 from the fourth try on.</p>
      </details>
      <p className="system-helper">Unfinished boards return after the others.</p>
      {onReplayBoard && solvedBoards.length > 0 && (
        <div className="system-replays">
          <p className="system-replays-head">Replay a solved board</p>
          <div className="system-replays-row">
            {solvedBoards.map(({ b, i }) => (
              <button key={b.id} className="system-replay-btn" onClick={() => onReplayBoard(system, b, i)}>
                Board {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// A system on the map or in More systems. The label is the button; on the
// desktop map the organ icon is a second, pointer-only target for the same
// system so either can be clicked.
function systemLabel(name, total, solved) {
  if (total === 0) return `${name}. Coming soon.`
  if (solved >= total) return `${name}, ${solved} of ${total} boards completed`
  return `${name}, ${solved} of ${total} boards solved`
}

export default function Systems({ todayKey, finishedBoards, boardAttempts = {}, initialSelected = null, onSelectedChange, landing = null, onOpenLanding, onCloseLanding, notice = null, onClearNotice, onPlaySystem, onReplayBoard, onBack, playNotice, onDismissPlayNotice }) {
  const wide = useWide()
  // Preview selection (desktop): the system returned to, the last visited, or Cardiology.
  const [preview, setPreview] = useState(() => initialSelected || landing || readLast() || 'Cardiology')
  // Landing page (phone): controlled by the app so browser Back and Forward
  // move between the directory and a system's page.
  const [suggesting, setSuggesting] = useState(false)

  const rows = useMemo(
    () =>
      Object.fromEntries(
        LIBRARY_SUBJECTS.map((s) => {
          const p = subjectProgress(s, todayKey, finishedBoards, boardAttempts)
          return [s, { total: p.total, solved: p.completed }]
        })
      ),
    [todayKey, finishedBoards, boardAttempts]
  )
  const overall = useMemo(() => Object.values(rows).reduce((a, r) => ({ total: a.total + r.total, solved: a.solved + r.solved }), { total: 0, solved: 0 }), [rows])
  const pct = overall.total ? Math.round((overall.solved / overall.total) * 100) : 0

  const choose = useCallback(
    (system) => {
      haptics.select()
      writeLast(system)
      if (wide) {
        setPreview(system)
        onSelectedChange?.(system)
      } else {
        setPreview(system)
        onSelectedChange?.(system)
        onOpenLanding?.(system)
        window.scrollTo?.(0, 0)
      }
    },
    [wide, onSelectedChange, onOpenLanding]
  )
  const backToSystems = () => {
    onCloseLanding?.()
    onClearNotice?.()
  }
  const play = (system) => {
    writeLast(system)
    onPlaySystem(system)
  }

  const suggestLink = (
    <>
      <div className="systems-suggest">
        <p className="systems-suggest-line">Found a connection we missed?</p>
        <button type="button" className="systems-suggest-btn" onClick={() => setSuggesting(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Submit a connection
        </button>
      </div>
      {suggesting && <SubmitConnectionModal defaultSystem={(wide ? preview : landing) || ''} onClose={() => setSuggesting(false)} />}
    </>
  )

  // ---- Phone landing page ----
  if (!wide && landing) {
    const st = systemState(landing, todayKey, finishedBoards, boardAttempts)
    return (
      <div className="systems system-landing" style={{ '--node-accent': systemAccent(landing) }}>
        <button className="system-landing-back" onClick={backToSystems}>
          <span aria-hidden="true">&larr;</span> Back to Systems
        </button>
        <SystemPanel
          system={landing}
          st={st}
          onPlay={play}
          onReplayBoard={onReplayBoard}
          finishedBoards={finishedBoards}
          notice={notice}
          playNotice={playNotice}
          onDismissPlayNotice={onDismissPlayNotice}
          variant="landing"
        />
        {suggestLink}
      </div>
    )
  }

  const bodyMap = (
    <>
    <p className="bm-hint" id="bm-hint">
      Tap a system to explore.
    </p>
    <BodyMap
      rows={rows}
      wide={wide}
      selected={wide ? preview : null}
      onChoose={choose}
      label={(system, r) => systemLabel(subjectLabel(system), r.total, r.solved)}
    />
    </>
  )

  const beyondList = (
    <section className="beyond-map" aria-labelledby="beyond-map-title">
      <h2 className="beyond-map-title" id="beyond-map-title">
        Beyond the body map
      </h2>
      <ul className="beyond-list">
        {BEYOND_SYSTEMS.map((system) => {
          const r = rows[system] || { total: 0, solved: 0 }
          const name = subjectLabel(system)
          const selected = wide && preview === system
          const complete = r.total > 0 && r.solved >= r.total
          return (
            <li key={system}>
              <button
                type="button"
                className={`beyond-row ${selected ? 'is-selected' : ''} ${complete ? 'is-complete' : ''}`}
                style={{ '--node-accent': systemAccent(system) }}
                data-system={system}
                aria-pressed={wide ? selected : undefined}
                aria-label={systemLabel(name, r.total, r.solved)}
                onClick={() => choose(system)}
              >
                <span className="beyond-icon" aria-hidden="true">
                  <Glyph system={system} fraction={r.total ? r.solved / r.total : 0} empty={r.total === 0} />
                </span>
                <span className="beyond-text">
                  <span className="beyond-name">{name}</span>
                  <span className="beyond-count">
                    {complete ? (
                      <>
                        {r.solved}/{r.total} <span className="bm-done" aria-hidden="true">✓</span>
                      </>
                    ) : (
                      `${r.solved} of ${r.total}`
                    )}
                  </span>
                </span>
                <svg className="beyond-chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
                  <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )

  const head = (
    <div className="systems-intro">
      <div className="systems-head">
        <button className="icon-btn systems-back" onClick={onBack} aria-label="Back">
          &larr;
        </button>
        <h1 className="systems-title">Systems</h1>
      </div>
      <p className="systems-sub">Practice one system at a time.</p>
      <p className="systems-overall">
        <b>{overall.solved}</b> of <b>{overall.total}</b> boards solved
      </p>
      <div className="systems-overall-bar" role="progressbar" aria-label="Boards solved across all systems" aria-valuemin={0} aria-valuemax={overall.total} aria-valuenow={overall.solved} aria-valuetext={`${overall.solved} of ${overall.total} boards solved`}>
        <span className="systems-overall-track">
          <span className="systems-overall-fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="systems-overall-pct">{pct}%</span>
      </div>
    </div>
  )

  if (!wide) {
    return (
      <div className="systems systems-directory is-phone">
        {head}
        {bodyMap}
        {beyondList}
        {suggestLink}
      </div>
    )
  }

  const st = systemState(preview, todayKey, finishedBoards, boardAttempts)
  return (
    <div className="systems systems-directory is-wide">
      <div className="systems-columns">
        <div className="systems-left">
          {head}
          {suggestLink}
        </div>
        <div className="systems-map-col">{bodyMap}</div>
        <SystemPanel
          system={preview}
          st={st}
          onPlay={play}
          onReplayBoard={onReplayBoard}
          finishedBoards={finishedBoards}
          notice={notice}
          playNotice={playNotice}
          onDismissPlayNotice={onDismissPlayNotice}
          variant="preview"
        />
      </div>
      {beyondList}
    </div>
  )
}

export { categoriesForSystem }
