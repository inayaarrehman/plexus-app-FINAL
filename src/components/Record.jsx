import React, { useMemo, useState } from 'react'
import { recordSnapshot } from '../progression/store.js'
import { KIT, KIT_ORDER, levelRewards, XP, ROUNDS_ITEM_ROTATION } from '../progression/config.js'
import { itemOpen } from '../progression/engine.js'
import { PlexusGrowth, WeekGoals, KitIcon, levelJewel, fmt } from './RecordParts.jsx'

// My Plexus (internally "Record"): the player's own Plexus, growing as they
// level up. The level leads, then the network, the next reward, quiet stats
// and This Week. Your Kit is the second tab. Never locked.
// On wide screens the network and level sit on the left, stats and This Week
// on the right.
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
  const unit = (n) => (n === 1 ? 'day' : 'days')

  return (
    <div className={`record is-${tab}`}>
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>My Plexus</span>
        </div>
        <div />
      </div>

      <div className="record-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'record'} className={`record-tab ${tab === 'record' ? 'is-active' : ''}`} onClick={() => setTab('record')}>
          My Plexus
        </button>
        <button role="tab" aria-selected={tab === 'kit'} className={`record-tab ${tab === 'kit' ? 'is-active' : ''}`} onClick={() => setTab('kit')}>
          Your Kit
        </button>
      </div>

      {tab === 'record' ? (
        <div className="record-main">
          <section className="record-hero" aria-label="Level">
            <h1 className="record-level">Level {info.level}</h1>
            <p className="record-xp">{fmt(xp)} XP</p>
            <p className="record-tonext">{fmt(info.toNext)} XP to Level {info.level + 1}</p>

            <PlexusGrowth info={info} rewardsFor={levelRewards} />

            {nextRewards.length > 0 && (
              <p className={`record-reward jewel-${levelJewel(info.level + 1)}`}>
                <span className="record-reward-node" aria-hidden="true" />
                Next reward · {nextRewards.map((it) => `${KIT[it].name} +1`).join(' · ')}
              </p>
            )}
          </section>

          <div className="record-side">
            <dl className="record-stats">
              <div><dd>{fmt(streak.current)}<span className="record-unit"> {unit(streak.current)}</span></dd><dt>Current streak</dt></div>
              <div><dd>{fmt(streak.longest)}<span className="record-unit"> {unit(streak.longest)}</span></dd><dt>Best</dt></div>
              <div><dd>{fmt(stats?.gamesWon || 0)}</dd><dt>Puzzles</dt></div>
              <div><dd>{fmt(connections)}</dd><dt>Connections</dt></div>
              <div><dd>{fmt(perfectDailies)}</dd><dt>Perfect</dt></div>
              <div><dd>{systemsComplete}<span className="record-unit"> / 16</span></dd><dt>Systems</dt></div>
            </dl>

            <section className="record-week" aria-labelledby="this-week">
              <div className="record-week-head">
                <h2 className="record-section" id="this-week">This Week</h2>
                <span className="rounds-foot">Resets Monday</span>
              </div>
              <WeekGoals goals={rounds.goals} complete={rounds.complete} />
              <p className="rounds-reward">
                {rounds.complete ? 'Earned' : 'Reward'} · +{XP.rounds} XP{roundsItem ? ` · ${KIT[roundsItem].name} +1` : ''}
              </p>
            </section>
          </div>
        </div>
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
