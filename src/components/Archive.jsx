import React, { useMemo, useState } from 'react'
import { getPlayableDailyForDate, isFutureDateKey } from '../utils/dailyPuzzle.js'
import { dateKey, dayNumber } from '../utils/game.js'
import { parseKey, daysBetween, weekdayOf } from '../utils/calendar.js'
import { getSavedConnections, toggleSavedConnection } from '../utils/storage.js'
import PuzzleSignature from './PuzzleSignature.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// The last Daily opened from the Archive, so coming back from a revisited
// puzzle lands on the same month with that day marked as selected.
const SELECTED_KEY = 'plexus.archiveSelected.v1'
function readSelected() {
  try {
    return sessionStorage.getItem(SELECTED_KEY) || null
  } catch {
    return null
  }
}
function writeSelected(key) {
  try {
    sessionStorage.setItem(SELECTED_KEY, key)
  } catch {
    // ignore
  }
}

const monthIndex = (y, m) => y * 12 + m

// Archive: the month as a calendar of completed Dailies. Every finished Daily
// leaves a small Plexus on its date: the puzzle's own signature, drawn with
// four nodes in the four connection colours. No line runs between days; the
// month fills up as marks accumulate. Data is the existing Daily history
// (completion) and the existing stats streak, nothing new is tracked here.
// Past days that were not played stay playable, as before.
export default function Archive({ dailyHistory, onOpenDay, onBack, currentStreak = 0 }) {
  // The player's own calendar date (utils/calendar.js); the grid is built
  // from date keys, never from Date objects, so no time zone can shift a day.
  const todayKey = dateKey(Date.now())
  const nowParts = parseKey(todayKey)
  const nowIndex = monthIndex(nowParts.y, nowParts.m - 1)

  // Months reachable with the arrows: back to the earliest month that holds a
  // completed Daily, never past the current month.
  const earliestIndex = useMemo(() => {
    let min = nowIndex
    for (const [key, entry] of Object.entries(dailyHistory || {})) {
      if (!entry?.completed) continue
      const [y, m] = key.split('-').map(Number)
      if (y && m) min = Math.min(min, monthIndex(y, m - 1))
    }
    return min
  }, [dailyHistory, nowIndex])

  const [selected, setSelected] = useState(() => readSelected())
  const [viewIndex, setViewIndex] = useState(() => {
    const sel = readSelected()
    if (sel) {
      const [y, m] = sel.split('-').map(Number)
      const idx = monthIndex(y, m - 1)
      if (idx <= nowIndex) return idx
    }
    return nowIndex
  })
  const year = Math.floor(viewIndex / 12)
  const month = viewIndex % 12
  const canPrev = viewIndex > earliestIndex
  const canNext = viewIndex < nowIndex

  const { cells, completedCount, availableCount } = useMemo(() => {
    const pad = (n) => String(n).padStart(2, '0')
    const first = `${year}-${pad(month + 1)}-01`
    const nextFirst = month === 11 ? `${year + 1}-01-01` : `${year}-${pad(month + 2)}-01`
    const count = daysBetween(first, nextFirst)
    const lead = (weekdayOf(first) + 1) % 7 // grid starts on Sunday
    const list = []
    for (let i = 0; i < lead; i++) list.push({ blank: true, id: `b${i}` })
    let completed = 0
    let available = 0
    for (let d = 1; d <= count; d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`
      const isFuture = isFutureDateKey(key)
      const exists = dayNumber(key) >= 0
      // Retired Dailies (before the new library) still show their completion
      // mark but can no longer be opened.
      const puzzle = !isFuture && exists ? getPlayableDailyForDate(key, todayKey) : null
      const done = !!dailyHistory?.[key]?.completed
      if (puzzle) available += 1
      if (done && puzzle) completed += 1
      list.push({ id: key, key, day: d, puzzle, done, isFuture, isToday: key === todayKey })
    }
    return { cells: list, completedCount: completed, availableCount: available }
  }, [dailyHistory, year, month, todayKey])

  const open = (cell) => {
    writeSelected(cell.key)
    setSelected(cell.key)
    onOpenDay(cell.key, cell.puzzle, cell.done)
  }

  const [saved, setSaved] = useState(() => getSavedConnections())
  const unsave = (conn) => {
    toggleSavedConnection(conn)
    setSaved(getSavedConnections())
  }

  const monthName = MONTH_NAMES[month]
  const showYear = year !== nowParts.y

  return (
    <div className="archive">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>Archive</span>
        </div>
        <div />
      </div>

      <div className="archive-month">
        <div className="archive-month-row">
          <button
            className="archive-month-step"
            onClick={() => canPrev && setViewIndex((v) => v - 1)}
            disabled={!canPrev}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h1 className="monthly-title" aria-live="polite">
            {monthName}
            {showYear && <span className="archive-month-year"> {year}</span>}
          </h1>
          <button
            className="archive-month-step"
            onClick={() => canNext && setViewIndex((v) => v + 1)}
            disabled={!canNext}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <p className="archive-sub">Revisit a Daily.</p>
      </div>

      <div className="archive-cal">
        <div className="archive-weekdays" aria-hidden="true">
          {WEEKDAYS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="archive-grid">
          {cells.map((c) => {
            if (c.blank) return <span key={c.id} className="archive-cell is-blank" aria-hidden="true" />
            const playable = !!c.puzzle
            const state = c.done ? 'is-done' : c.isFuture || !playable ? 'is-future' : c.isToday ? 'is-open' : 'is-missed'
            const label = `${monthName} ${c.day}${
              c.done ? ', completed' : c.isToday ? ', today, not completed' : c.isFuture ? '' : ', not played'
            }`
            return (
              <button
                key={c.id}
                className={`archive-cell ${state} ${c.isToday ? 'is-today' : ''} ${
                  c.done && selected === c.key ? 'is-selected' : ''
                }`}
                onClick={() => playable && open(c)}
                disabled={!playable}
                aria-label={label}
              >
                <span className="archive-mark">
                  {c.done && <PuzzleSignature seed={c.puzzle ? c.puzzle.id : c.key} resolved size={34} nodeCount={4} bold />}
                </span>
                <span className="archive-day">{c.day}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="archive-summary">
        <p className="archive-count">
          {completedCount} / {availableCount} completed
        </p>
        {currentStreak > 0 && <p className="archive-streak">{currentStreak} day streak</p>}
      </div>

      {saved.length > 0 && (
        <div className="saved-connections">
          <h2 className="home-section-heading">Saved connections</h2>
          <div className="saved-list">
            {saved.map((c) => (
              <div className="saved-item" key={c.key}>
                <div className="saved-item-head">
                  <span className="saved-item-title">{c.title}</span>
                  <button className="saved-unsave" onClick={() => unsave(c)} aria-label={`Unsave ${c.title}`}>
                    ★
                  </button>
                </div>
                {c.items && c.items.length > 0 && (
                  <p className="saved-item-terms">{c.items.map((it) => it.term).join(' · ')}</p>
                )}
                {c.remember && <p className="saved-item-remember">{c.remember}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
