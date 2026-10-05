import React, { useMemo, useState } from 'react'
import { SYSTEMS, DIFFICULTY } from '../puzzles.js'
import { getDailyPuzzleForDate } from '../utils/dailyPuzzle.js'
import { getSystemGlyph } from '../utils/systemGlyphs.js'
import BrandMark from './BrandMark.jsx'
import HeroNetwork from './HeroNetwork.jsx'
import PuzzleSignature from './PuzzleSignature.jsx'
import SolvedRecap from './SolvedRecap.jsx'

// Each system takes one accent from the four-colour Plexus palette, cycled by
// position — same rule as the Systems page, so the home previews match.
const ACCENT_VARS = ['var(--jewel-terracotta)', 'var(--jewel-peacock)', 'var(--jewel-cobalt)', 'var(--jewel-plum)']
const accentForSystem = (system) => ACCENT_VARS[Math.max(0, SYSTEMS.indexOf(system)) % ACCENT_VARS.length]

// Three systems previewed on the home Systems row, drawn as the real organ
// glyphs (heart / lungs / brain) at small size in their accent colours.
const SYSTEMS_PREVIEW = ['Cardiology', 'Pulmonary', 'Neurology']

// A small organ glyph, reusing the Systems geometry. Faint paths + accent
// nodes; colour comes from `color` so it adapts to light/dark.
function MiniGlyph({ system, size = 38 }) {
  const g = useMemo(() => getSystemGlyph(system), [system])
  return (
    <svg
      className="mode-glyph-mini"
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
            x1={g.nodes[a].x}
            y1={g.nodes[a].y}
            x2={g.nodes[b].x}
            y2={g.nodes[b].y}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
          />
        ))}
        {g.nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r="4.2" fill="currentColor" opacity="0.9" />
        ))}
      </g>
    </svg>
  )
}

// 3-Minute mode: a countdown ring built from nodes — a contiguous arc is lit.
function TimerGlyph() {
  const N = 10
  const lit = 7
  const cx = 24
  const cy = 24
  const r = 15
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, on: i < lit }
  })
  return (
    <svg className="mode-glyph" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      {pts.map((p, i) =>
        i > 0 && pts[i].on && pts[i - 1].on ? (
          <line key={`l${i}`} className="mg-link is-on" x1={pts[i - 1].x} y1={pts[i - 1].y} x2={p.x} y2={p.y} />
        ) : null
      )}
      {pts.map((p, i) => (
        <circle key={i} className={`mg-node ${p.on ? 'is-on' : ''}`} cx={p.x} cy={p.y} r={p.on ? 3 : 2.2} />
      ))}
      <circle className="mg-node is-on" cx={cx} cy={cy} r="2.6" />
    </svg>
  )
}

// Race: two short node paths side by side, suggesting two players.
function RaceGlyph() {
  const rows = [
    { y: 16, cls: 'mg-a' },
    { y: 32, cls: 'mg-b' },
  ]
  const xs = [10, 24, 38]
  return (
    <svg className="mode-glyph" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      {rows.map((row) => (
        <g key={row.y} className={row.cls}>
          <line className="mg-path" x1={xs[0]} y1={row.y} x2={xs[2]} y2={row.y} />
          {xs.map((x, i) => (
            <circle key={i} className="mg-dot" cx={x} cy={row.y} r={i === xs.length - 1 ? 3.4 : 2.6} />
          ))}
        </g>
      ))}
    </svg>
  )
}

export default function Home({
  dailyNumber,
  dailyDone,
  currentStreak,
  continueSystem,
  continueSystemSolved,
  continueSystemTotal,
  challengeBest,
  dailiesCompleted = 0,
  onPlayDaily,
  onOpenSystems,
  onContinueStudying,
  onStartChallenge,
  onStartRace,
  onOpenStats,
  onOpenHowTo,
  onOpenAccount,
}) {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const todayPuzzle = useMemo(() => getDailyPuzzleForDate(new Date()), [])
  const [recapOpen, setRecapOpen] = useState(false)
  const todayCategories = dailyDone ? todayPuzzle?.categories || [] : []

  // Connection of the day: a verified takeaway from today's completed Daily.
  const connectionOfDay = useMemo(() => {
    if (!dailyDone || todayCategories.length === 0) return null
    const withRemember = todayCategories.filter((c) => c.remember)
    if (withRemember.length === 0) return null
    return withRemember[dailyNumber % withRemember.length]
  }, [dailyDone, todayCategories, dailyNumber])

  const seed = todayPuzzle?.id || `daily-${dailyNumber}`

  return (
    <div className="home">
      {/* Deliberate top bar: the Plexus mark anchors the brand on the left,
          navigation sits as an evenly-spaced group on the right. */}
      <nav className="home-nav" aria-label="Main">
        <span className="home-nav-brand">
          <BrandMark size={22} decorative />
          <span className="home-nav-wordmark">Plexus</span>
        </span>
        <div className="home-nav-links">
          <button className="home-nav-link" onClick={onOpenStats}>Stats</button>
          <button className="home-nav-link" onClick={onOpenHowTo}>How to play</button>
          {onOpenAccount && (
            <button className="home-nav-link" onClick={onOpenAccount}>Account</button>
          )}
        </div>
      </nav>

      {/* DAILY — the composed centrepiece. "Today's Plexus" is the heading;
          the Daily number and date are secondary metadata; the seeded node
          signature gives the puzzle its own small identity. */}
      <section className="home-hero">
        <HeroNetwork dailiesCompleted={dailiesCompleted} />

        <div className="home-hero-head">
          {dailyDone ? (
            <button
              className="home-sig-btn"
              onClick={() => setRecapOpen((o) => !o)}
              aria-label="Recap today’s connections"
              aria-expanded={recapOpen}
            >
              <PuzzleSignature seed={seed} resolved size={48} animate />
            </button>
          ) : (
            <PuzzleSignature seed={seed} resolved={false} size={48} className="home-sig" />
          )}
          <p className="home-hero-eyebrow">
            Daily No. {String(dailyNumber).padStart(3, '0')} &middot; {todayLabel}
          </p>
          <h1 className="home-hero-title">Today&rsquo;s Plexus</h1>
        </div>

        {!dailyDone ? (
          <>
            <p className="home-hero-sub">16 concepts, 4 connections</p>
            <button className="play-today-btn" onClick={onPlayDaily}>
              Play
              <span className="play-today-btn-arrow" aria-hidden="true"> &rarr;</span>
            </button>
          </>
        ) : (
          <>
            <p className="home-hero-sub">
              Today complete
              {currentStreak > 0 ? (
                <>
                  {' '}&middot; <span className="home-streak-count">{currentStreak} day streak</span>
                </>
              ) : null}
            </p>
            {connectionOfDay && (
              <div className="home-cotd">
                <span className="home-cotd-label">Connection of the day</span>
                <p className="home-cotd-title">{connectionOfDay.title}</p>
                <p className="home-cotd-note">{connectionOfDay.remember}</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* SECONDARY MODES — editorial feature rows, each anchored by its own
          Plexus node visual rather than a generic icon or card. */}
      <section className="home-modes">
        {dailyDone && continueSystem && (
          <button className="mode-row" onClick={onContinueStudying}>
            <span className="mode-visual" style={{ color: accentForSystem(continueSystem) }}>
              <MiniGlyph system={continueSystem} size={46} />
            </span>
            <span className="mode-body">
              <span className="mode-title">Continue {continueSystem}</span>
              <span className="mode-sub">{continueSystemSolved} of {continueSystemTotal} connections solved</span>
              <span className="mode-action">Continue <span aria-hidden="true">&rarr;</span></span>
            </span>
          </button>
        )}

        <button className="mode-row" onClick={onStartChallenge} style={{ '--mode-accent': 'var(--difficulty-medium)' }}>
          <span className="mode-visual">
            <TimerGlyph />
          </span>
          <span className="mode-body">
            <span className="mode-title">3 Minutes</span>
            <span className="mode-sub">How many can you solve in 3 minutes?</span>
            {challengeBest > 0 && <span className="mode-meta">Best {challengeBest.toLocaleString()}</span>}
            <span className="mode-action">Start <span aria-hidden="true">&rarr;</span></span>
          </span>
        </button>

        <button className="mode-row" onClick={onStartRace} style={{ '--mode-accent': 'var(--difficulty-easy)' }}>
          <span className="mode-visual mode-visual-race">
            <RaceGlyph />
          </span>
          <span className="mode-body">
            <span className="mode-title">Race</span>
            <span className="mode-sub">Race a friend through the same Plexus.</span>
            <span className="mode-action">Start a race <span aria-hidden="true">&rarr;</span></span>
          </span>
        </button>

        <button className="mode-row" onClick={onOpenSystems}>
          <span className="mode-visual mode-visual-systems">
            {SYSTEMS_PREVIEW.map((s) => (
              <MiniGlyph key={s} system={s} size={30} />
            ))}
          </span>
          <span className="mode-body">
            <span className="mode-title">Systems</span>
            <span className="mode-sub">Pick a system to practice.</span>
            <span className="mode-action">Browse systems <span aria-hidden="true">&rarr;</span></span>
          </span>
        </button>
      </section>

      {recapOpen && <SolvedRecap categories={todayCategories} onClose={() => setRecapOpen(false)} />}
    </div>
  )
}
