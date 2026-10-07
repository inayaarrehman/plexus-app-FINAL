import React, { useMemo, useState } from 'react'
import { recordSnapshot } from '../progression/store.js'
import { KIT, KIT_ORDER, levelRewards, XP, ROUNDS_ITEM_ROTATION } from '../progression/config.js'
import { itemOpen } from '../progression/engine.js'
import { LevelPath, KitIcon, fmt } from './RecordParts.jsx'

// Record: the player's Plexus progress. Level first, then the level path,
// the next level's reward, compact stats and This Week. Your Kit is the
// second tab. Never locked.
export default function Record({ history, todayKey, stats, onBack, initialTab = 'record' }) {
  const [tab, setTab] = useState(initialTab)
  const snap = useMemo(() => recordSnapshot({ history, todayKey }), [history, todayKey])
  const { info, xp, counts, streak, systemsComplete, connections, rounds } = snap
  const nextRewards = levelRewards(info.level + 1)
  const perfectDailies = useMemo(
    () => Object.entries(history || {}).filter(([, e]) => e?.completed && e.won && e.mistakes === 0).length,
    [history]
  )
  const roundsItem = rounds.week.index % 2 === 0 ? ROUNDS_ITEM_ROTATION[(rounds.week.index / 2) % ROUNDS_ITEM_ROTATION.length] : null
  const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`

  return (
    <div className="record">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>Record</span>
        </div>
        <div />
      </div>

      <div className="record-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'record'} className={`record-tab ${tab === 'record' ? 'is-active' : ''}`} onClick={() => setTab('record')}>
          Record
        </button>
        <button role="tab" aria-selected={tab === 'kit'} className={`record-tab ${tab === 'kit' ? 'is-active' : ''}`} onClick={() => setTab('kit')}>
          Your Kit
        </button>
      </div>

      {tab === 'record' ? (
        <>
          <section className="record-head">
            <h1 className="record-level">Level {info.level}</h1>
            <p className="record-xp">{fmt(xp)} XP</p>
            <p className="record-tonext">{fmt(info.toNext)} XP to Level {info.level + 1}</p>
          </section>

          <LevelPath info={info} />

          {nextRewards.length > 0 && (
            <p className="record-reward">
              Level {info.level + 1}: {nextRewards.map((it) => `${KIT[it].name} +1`).join(' · ')}
            </p>
          )}

          <dl className="record-stats">
            <div><dd>{days(streak.current)}</dd><dt>Current streak</dt></div>
            <div><dd>{days(streak.longest)}</dd><dt>Best streak</dt></div>
            <div><dd>{fmt(stats?.gamesWon || 0)}</dd><dt>Puzzles</dt></div>
            <div><dd>{fmt(connections)}</dd><dt>Connections</dt></div>
            <div><dd>{fmt(perfectDailies)}</dd><dt>Perfect Dailies</dt></div>
            <div><dd>{systemsComplete} / 16</dd><dt>Systems</dt></div>
          </dl>

          <section className="record-week" aria-labelledby="this-week">
            <h2 className="record-section" id="this-week">This Week</h2>
            <ul className="rounds-list">
              {rounds.goals.map((g) => (
                <li key={g.id} className={`rounds-goal ${g.done ? 'is-done' : ''}`}>
                  <span className="rounds-node" aria-hidden="true" />
                  <span className="rounds-label">{g.label}</span>
                  <span className="rounds-count">{g.count}/{g.target}</span>
                </li>
              ))}
            </ul>
            <p className="rounds-reward">
              {rounds.complete ? `All 3 done · +${XP.rounds} XP` : `Complete all 3 · +${XP.rounds} XP${roundsItem ? ` · ${KIT[roundsItem].name} +1` : ''}`}
            </p>
            <p className="rounds-foot">Resets Monday</p>
          </section>
        </>
      ) : (
        <section className="record-kit" aria-label="Your Kit">
          <ul className="kit-list">
            {KIT_ORDER.map((item) => {
              const def = KIT[item]
              const open = itemOpen(item, info.level)
              return (
                <li key={item} className={`kit-item ${open ? '' : 'is-locked'}`}>
                  <KitIcon item={item} size={26} />
                  <div className="kit-text">
                    <span className="kit-name">{def.name}</span>
                    <span className="kit-desc">{def.desc}</span>
                    {open && !def.ready && counts[item] > 0 && <span className="kit-soon">Ready in a later update.</span>}
                  </div>
                  <span className="kit-count">{open ? `×${counts[item]}` : <>Unlocks at<br />Level {def.unlock}</>}</span>
                </li>
              )
            })}
          </ul>
          <p className="kit-foot">Earned from levels, This Week, finished systems, streaks and every fifth perfect Daily. Rewards are fixed and shown before you earn them. Tools are off in Race, and a Daily solved with a tool doesn't count as perfect.</p>
        </section>
      )}
    </div>
  )
}
