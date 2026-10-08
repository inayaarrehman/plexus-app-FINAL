import React, { useEffect, useMemo, useState } from 'react'
import { SYSTEMS } from '../puzzles.js'
import { subjectLabel } from '../utils/newLibrary.js'
import { getDailyPuzzleForDate } from '../utils/dailyPuzzle.js'
import { pickConnectionOfDay, firstSentence } from '../utils/connectionOfDay.js'
import { getSystemGlyph } from '../utils/systemGlyphs.js'
import BrandMark from './BrandMark.jsx'
import DailyPlexus from './DailyPlexus.jsx'
import LockGlyph from './LockGlyph.jsx'
import { loadProgress, getDailyHistory } from '../utils/storage.js'
import { dateKey } from '../utils/game.js'
import { formatDayKey, timeZoneLabel } from '../utils/calendar.js'
import { reportContext } from '../utils/reportContext.js'
import { LevelLine } from './RecordParts.jsx'
import LegalFooter from './LegalFooter.jsx'

// Each system takes one accent from the four-colour Plexus palette, cycled by
// position — same rule as the Systems page, so the home previews match.
const ACCENT_VARS = ['var(--node-terracotta)', 'var(--node-peacock)', 'var(--node-cobalt)', 'var(--node-plum)']
const accentForSystem = (system) => ACCENT_VARS[Math.max(0, SYSTEMS.indexOf(system)) % ACCENT_VARS.length]

// Three systems previewed on the home Systems row, drawn as the real organ
// glyphs (heart / lungs / brain) at small size in their accent colours.
const SYSTEMS_PREVIEW = ['Cardiology', 'Pulmonary', 'Neurology']

// A small organ glyph, reusing the Systems geometry. With `progress` (0..1)
// it shows real saved progress: that share of the organ's nodes (and the
// links between them) light up in the system's colour, the rest stay faint.
function MiniGlyph({ system, size = 38, progress = null }) {
  const g = useMemo(() => getSystemGlyph(system), [system])
  const n = g.nodes.length
  const lit = progress == null ? n : progress > 0 ? Math.max(1, Math.round(n * progress)) : 0
  return (
    <svg
      className={`mode-glyph-mini ${progress != null ? 'is-progress' : ''}`}
      width={size}
      height={size}
      viewBox="8 8 84 84"
      style={{ color: accentForSystem(system) }}
      aria-hidden="true"
    >
      <g transform={g.scale !== 1 ? `translate(50 50) scale(${g.scale}) translate(-50 -50)` : undefined}>
        {g.links.map(([a, b], i) => (
          <line
            key={i}
            className={`mg-organ-link ${a < lit && b < lit ? 'is-on' : ''}`}
            x1={g.nodes[a].x}
            y1={g.nodes[a].y}
            x2={g.nodes[b].x}
            y2={g.nodes[b].y}
          />
        ))}
        {g.nodes.map((nd, i) => (
          <circle key={i} className={`mg-organ-node ${i < lit ? 'is-on' : ''}`} cx={nd.x} cy={nd.y} r="4.2" />
        ))}
      </g>
    </svg>
  )
}

// 3 Minutes: a countdown ring of nodes with a hand from the centre to the
// head of the lit arc. On hover or press the arc steps forward once.
function TimerGlyph() {
  const N = 12
  const lit = 8
  const cx = 28
  const cy = 28
  const r = 19
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, on: i < lit }
  })
  const head = pts[lit - 1]
  return (
    <svg className="mode-glyph mg-timer" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <g className="mg-sweep">
        {pts.map((p, i) =>
          i > 0 && pts[i].on && pts[i - 1].on ? (
            <line key={`l${i}`} className="mg-link is-on" x1={pts[i - 1].x} y1={pts[i - 1].y} x2={p.x} y2={p.y} />
          ) : null
        )}
        {pts.map((p, i) => (
          <circle key={i} className={`mg-node ${p.on ? 'is-on' : ''}`} cx={p.x} cy={p.y} r={p.on ? 3 : 2.2} />
        ))}
        <line className="mg-hand" x1={cx} y1={cy} x2={head.x} y2={head.y} />
      </g>
      <circle className="mg-node is-on" cx={cx} cy={cy} r="3" />
    </svg>
  )
}

// Race: two players' paths through the same Plexus, meeting at one node.
function RaceGlyph() {
  const a = [[6, 14], [18, 10], [30, 18]]
  const b = [[6, 42], [18, 46], [30, 38]]
  const end = [48, 28]
  const path = (pts) => [...pts, end].map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  return (
    <svg className="mode-glyph mg-race" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <path className="mg-path mg-a" d={path(a)} />
      <path className="mg-path mg-b" d={path(b)} />
      <g className="mg-runner mg-a">
        {a.map(([x, y], i) => (
          <circle key={i} className="mg-dot" cx={x} cy={y} r="2.8" />
        ))}
      </g>
      <g className="mg-runner mg-b">
        {b.map(([x, y], i) => (
          <circle key={i} className="mg-dot" cx={x} cy={y} r="2.8" />
        ))}
      </g>
      <circle className="mg-goal" cx={end[0]} cy={end[1]} r="4.2" />
    </svg>
  )
}

// 3 Minutes and Race: a pair of light, side-by-side tiles. Before today's
// Daily is finished they stay visible but locked: the action line becomes the
// lock note and a tap gives the restrained notice. `justUnlocked` plays the
// one-time shackle lift right after the Daily is finished.
function ModeTile({ locked, justUnlocked, order, onOpen, onLocked, visual, title, sub, meta, action, className = '' }) {
  const cls = `mode-tile ${className} ${locked ? 'is-locked' : ''} ${justUnlocked ? 'is-unlocking' : ''}`
  return (
    <button className={cls} onClick={locked ? onLocked : onOpen} aria-disabled={locked ? 'true' : undefined} style={{ '--unlock-delay': `${order * 140}ms` }}>
      <span className="mode-visual">{visual}</span>
      <span className="mode-title">{title}</span>
      <span className="mode-sub">{sub}</span>
      {meta && !locked && <span className="mode-meta">{meta}</span>}
      {locked ? (
        <span className="mode-lock">
          <LockGlyph size={14} />
          Locked
        </span>
      ) : (
        <span className="mode-action">
          {justUnlocked && (
            <span className="mode-unlock-mark" aria-hidden="true">
              <LockGlyph size={14} open />
            </span>
          )}
          {action} <span className="mode-arrow" aria-hidden="true">&rarr;</span>
        </span>
      )}
    </button>
  )
}

// Connection of the day: the title, the first sentence of the explanation as
// a preview, and the full explanation (plus the takeaway) behind "Read
// explanation". The text is shown exactly as written, never rewritten; the
// preview only ever ends at a sentence boundary.
function ConnectionOfDay({ cotd, onReport }) {
  const [open, setOpen] = useState(false)
  const { first, rest } = firstSentence(cotd.explanation || cotd.remember)
  const more = Boolean(rest) || (cotd.explanation && cotd.remember)
  return (
    <div className="home-cotd">
      <span className="home-cotd-label">Connection of the day</span>
      <p className="home-cotd-title">{cotd.title}</p>
      <p className="home-cotd-note">
        {first}
        {open && rest ? ` ${rest}` : ''}
      </p>
      {open && cotd.explanation && cotd.remember && <p className="home-cotd-remember">{cotd.remember}</p>}
      <div className="home-cotd-actions">
        {more && (
          <button type="button" className="home-cotd-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? 'Hide explanation' : 'Read explanation'}
          </button>
        )}
        {onReport && (open || !more) && (
          <button type="button" className="report-link" onClick={onReport}>
            Report this connection
          </button>
        )}
      </div>
    </div>
  )
}

// What changed on today's board since Home was last shown, so only new
// progress animates. Display state on this device only.
const DAILY_SEEN_KEY = 'plexus.home.dailySeen.v1'
const ENTRANCE_KEY = 'plexus.home.entrance.v1'
function readJSON(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}
function writeJSON(key, v) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v))
  } catch {
    // ignore
  }
}

// The player's real progress on today's Daily: which groups they found and
// whether the board is over. From the saved game; if the Daily was finished
// on another device (history only), a win means all four were found.
function todayProgress(puzzle, dailyDone, history, key) {
  const saved = loadProgress(`daily-${key}`)
  const n = puzzle?.categories?.length || 4
  if (saved && (!saved.puzzleId || saved.puzzleId === puzzle?.id)) {
    const solved = [...new Set((saved.guessLog || []).filter((g) => g.correct).map((g) => g.catIndexes?.[0]))].filter((i) => Number.isInteger(i))
    return { solved, finished: Boolean(saved.gameOver) || dailyDone }
  }
  if (dailyDone) {
    const won = history?.won !== false
    return { solved: won ? Array.from({ length: n }, (_, i) => i) : [], finished: true }
  }
  return { solved: [], finished: false }
}

export default function Home({
  todayKey,
  timeZone,
  onOpenSupport,
  onReport,
  dailyNumber,
  dailyDone,
  currentStreak,
  continueSystem,
  continueSystemSolved,
  continueSystemTotal,
  challengeBest,
  onPlayDaily,
  onOpenSystems,
  onContinueStudying,
  onStartChallenge,
  onStartRace,
  onOpenStats,
  onOpenHowTo,
  onOpenAccount,
  onOpenRecord,
  onOpenLegal,
  record = null,
  locked = false,
  justUnlocked = false,
  onLocked,
  nudge = 0,
}) {
  // The player's own calendar date (utils/calendar.js), passed down from App
  // so it changes at local midnight even while Home stays open.
  const today = todayKey || dateKey(Date.now())
  const todayLabel = formatDayKey(today)
  const resetNote = `Resets at midnight · ${timeZoneLabel(timeZone)}`

  const todayPuzzle = useMemo(() => getDailyPuzzleForDate(today), [today])
  const progress = useMemo(() => todayProgress(todayPuzzle, dailyDone, getDailyHistory()[today], today), [todayPuzzle, dailyDone, today])
  const total = todayPuzzle?.categories?.length || 4
  const status = progress.finished ? 'finished' : progress.solved.length ? 'partial' : 'waiting'

  // Only what changed since Home was last shown animates; the first Home
  // view of a session gets a gentle entrance.
  const [motion] = useState(() => {
    const seen = readJSON(DAILY_SEEN_KEY)
    const same = seen && seen.date === today
    const before = new Set(same ? seen.solved || [] : [])
    let entrance = false
    try {
      entrance = !window.sessionStorage.getItem(ENTRANCE_KEY)
    } catch {
      entrance = false
    }
    return {
      fresh: progress.solved.filter((i) => !before.has(i)),
      freshFinish: progress.finished && !(same && seen.finished),
      entrance,
    }
  })
  useEffect(() => {
    writeJSON(DAILY_SEEN_KEY, { date: today, solved: progress.solved, finished: progress.finished })
    try {
      window.sessionStorage.setItem(ENTRANCE_KEY, '1')
    } catch {
      // ignore
    }
  }, [today, progress])

  // Connection of the day: a verified takeaway from today's completed Daily.
  // Same pick as the results screen (utils/connectionOfDay.js).
  const connectionOfDay = useMemo(() => {
    if (!dailyDone) return null
    const cotd = pickConnectionOfDay(todayPuzzle)
    if (!cotd) return null
    const cat = (todayPuzzle?.categories || []).find((c) => c.title === cotd.title)
    return { ...cotd, report: reportContext(todayPuzzle, cat, { mode: 'daily', date: today }) }
  }, [dailyDone, todayPuzzle, today])

  const found = progress.solved.length
  const plexusLabel =
    status === 'finished'
      ? `Today's Plexus: ${found} of ${total} connections found. View results.`
      : status === 'partial'
        ? `Today's Plexus: ${found} of ${total} connections found. Continue.`
        : "Today's Plexus: not started. Play."
  const streakText = currentStreak > 0 ? `${currentStreak} day streak` : null
  const continueOpen = Boolean(continueSystem) && continueSystemTotal > 0 && continueSystemSolved < continueSystemTotal

  return (
    <div className={`home is-${status}`}>
      {/* Deliberate top bar: the Plexus mark anchors the brand on the left,
          navigation sits as an evenly-spaced group on the right. */}
      <nav className="home-nav" aria-label="Main">
        <span className="home-nav-brand">
          <BrandMark size={22} decorative />
          <span className="home-nav-wordmark">Plexus</span>
        </span>
        <div className="home-nav-links">
          {onOpenRecord ? (
            <button className="home-nav-link" onClick={onOpenRecord}>My Plexus</button>
          ) : (
            <button className="home-nav-link" onClick={onOpenStats}>Stats</button>
          )}
          <button className="home-nav-link" onClick={onOpenHowTo}>How to play</button>
          {onOpenSupport && (
            <button className="home-nav-link home-nav-support" onClick={onOpenSupport} aria-label="Help & Support">
              <span className="nav-label-long">Help &amp; Support</span>
              <span className="nav-label-short" aria-hidden="true">Help</span>
            </button>
          )}
          {onOpenAccount && (
            <button className="home-nav-link" onClick={onOpenAccount}>Account</button>
          )}
        </div>
      </nav>

      {/* TODAY'S PLEXUS: the Daily as its own constellation, showing the
          player's real progress on today's board. */}
      <section className="home-hero">
        <div className="home-hero-head">
          <p className="home-hero-eyebrow">
            Daily No. {String(dailyNumber).padStart(3, '0')} &middot; {todayLabel}
          </p>
          <h1 className="home-hero-title">Today&rsquo;s Plexus</h1>
        </div>

        <DailyPlexus
          puzzle={todayPuzzle}
          solved={progress.solved}
          finished={progress.finished}
          fresh={motion.fresh}
          freshFinish={motion.freshFinish}
          entrance={motion.entrance}
          label={plexusLabel}
          onActivate={onPlayDaily}
        />

        <div className="home-hero-status">
          {status === 'waiting' && <p className="home-hero-sub">Sort 16 medical concepts into 4 groups that share a hidden link.</p>}
          {status === 'partial' && (
            <p className="home-hero-sub">
              <b>{found} of {total}</b> connections found
            </p>
          )}
          {status === 'finished' && <p className="home-hero-sub home-done">Today complete</p>}

          <div className="home-hero-actions">
            {status === 'finished' ? (
              <button className="home-results-btn" onClick={onPlayDaily}>
                View results <span aria-hidden="true">&rarr;</span>
              </button>
            ) : (
              <button key={`play-${nudge}`} className={`play-today-btn ${nudge ? 'is-nudged' : ''}`} onClick={onPlayDaily}>
                {status === 'partial' ? 'Continue' : 'Play'}
                <span className="play-today-btn-arrow" aria-hidden="true"> &rarr;</span>
              </button>
            )}
            {streakText && (
              <span className={`home-streak ${status === 'finished' ? 'is-kept' : ''}`}>
                <span className="home-streak-node" aria-hidden="true" />
                <span className="home-streak-count">{streakText}</span>
              </span>
            )}
          </div>

          <p className="home-reset-note">{resetNote}</p>

          {connectionOfDay && <ConnectionOfDay cotd={connectionOfDay} onReport={onReport ? () => onReport(connectionOfDay.report) : undefined} />}
        </div>
      </section>

      <div className="home-more">
        {/* CONTINUE: the natural next step once the Daily is done. */}
        {dailyDone && (
          <section className="home-continue" aria-label="Systems">
            {continueOpen ? (
              <button className="continue-row" onClick={onContinueStudying}>
                <span className="continue-visual">
                  <MiniGlyph system={continueSystem} size={64} progress={continueSystemSolved / continueSystemTotal} />
                </span>
                <span className="mode-body">
                  <span className="mode-title">Continue {subjectLabel(continueSystem)}</span>
                  <span className="mode-sub">
                    {continueSystemSolved} of {continueSystemTotal} boards completed
                  </span>
                  <span className="mode-action">
                    Continue <span className="mode-arrow" aria-hidden="true">&rarr;</span>
                  </span>
                </span>
              </button>
            ) : (
              <button className="continue-row" onClick={onOpenSystems}>
                <span className="continue-visual continue-visual-browse">
                  {SYSTEMS_PREVIEW.map((sys) => (
                    <MiniGlyph key={sys} system={sys} size={34} />
                  ))}
                </span>
                <span className="mode-body">
                  <span className="mode-title">Systems</span>
                  <span className="mode-sub">Practice one organ system at a time.</span>
                  <span className="mode-action">
                    Browse systems <span className="mode-arrow" aria-hidden="true">&rarr;</span>
                  </span>
                </span>
              </button>
            )}
          </section>
        )}

        {/* OTHER WAYS TO PLAY */}
        <section className="home-modes" aria-labelledby="other-ways">
          <h2 className="home-modes-label" id="other-ways">Other ways to play</h2>
          {locked && (
            <p className="home-unlock-note">
              <LockGlyph size={13} /> Finish today’s Plexus to unlock 3 Minutes, Race and Systems.
            </p>
          )}
          <div className="mode-pair">
            <ModeTile
              locked={locked}
              justUnlocked={justUnlocked}
              order={0}
              onOpen={onStartChallenge}
              onLocked={onLocked}
              className="mode-tile-timer"
              visual={<TimerGlyph />}
              title="3 Minutes"
              sub="How many can you solve in 3 minutes?"
              meta={challengeBest > 0 ? `Best ${challengeBest.toLocaleString()}` : null}
              action="Start"
            />
            <ModeTile
              locked={locked}
              justUnlocked={justUnlocked}
              order={1}
              onOpen={onStartRace}
              onLocked={onLocked}
              className="mode-tile-race"
              visual={<RaceGlyph />}
              title="Race"
              sub="Race a friend through the same Plexus."
              action="Start a race"
            />
          </div>
        </section>
      </div>

      {/* MY PLEXUS: where you see what you've built. Two quiet rows that both
          open My Plexus (the second straight to This Week). */}
      {record && onOpenRecord && (
        <section className="home-progress" aria-label="My Plexus">
          <button
            className="home-progress-row home-level"
            onClick={() => onOpenRecord()}
            aria-label={`My Plexus: level ${record.info.level}, ${record.info.toNext} XP to level ${record.info.level + 1}`}
          >
            <span className="home-progress-text">
              <b>Level {record.info.level}</b> · {record.info.toNext.toLocaleString('en-US')} XP to Level {record.info.level + 1}
            </span>
            <LevelLine info={record.info} width={84} height={14} className="home-level-line" />
            <span className="home-progress-arrow" aria-hidden="true">&rarr;</span>
          </button>
          <button
            className="home-progress-row home-rounds"
            onClick={() => onOpenRecord('week')}
            aria-label={`This Week in My Plexus: ${record.rounds.done} of ${record.rounds.goals.length} goals done`}
          >
            <span className="home-progress-text">
              {record.rounds.complete ? 'This Week: all 3 goals done' : `This Week: ${record.rounds.done} of ${record.rounds.goals.length} goals done`}
              <span className="home-progress-meta"> · resets Monday</span>
            </span>
            <span className="home-week-nodes" aria-hidden="true">
              {record.rounds.goals.map((g) => (
                <span key={g.id} className={`home-week-node ${g.done ? 'is-done' : ''}`} />
              ))}
            </span>
            <span className="home-progress-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </section>
      )}

      <LegalFooter onNavigate={onOpenLegal} className="home-legal" />
    </div>
  )
}
