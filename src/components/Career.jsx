import React, { useMemo, useState } from 'react'
import { careerSnapshot } from '../progression/store.js'
import { KIT, KIT_ORDER, STAGES, levelRewards, XP, ROUNDS_ITEM_ROTATION } from '../progression/config.js'
import { itemOpen } from '../progression/engine.js'
import { LevelLine, StageBadge, KitIcon, fmt } from './CareerParts.jsx'

// Career: the player's Plexus rank. Stage is the focal point, then the level
// line and XP, then quiet stat rows and this week's Rounds. Your Kit is the
// second tab. Never locked by the Daily.
export default function Career({ history, todayKey, stats, onBack, initialTab = 'career' }) {
  const [tab, setTab] = useState(initialTab)
  const snap = useMemo(() => careerSnapshot({ history, todayKey }), [history, todayKey])
  const { info, xp, counts, streak, systemsComplete, connections, rounds } = snap
  const name = snap.state.profile?.displayName
  const nextRewards = levelRewards(info.level + 1)
  const perfectDailies = useMemo(
    () => Object.entries(history || {}).filter(([, e]) => e?.completed && e.won && e.mistakes === 0).length,
    [history]
  )
  const roundsItem = rounds.week.index % 2 === 0 ? ROUNDS_ITEM_ROTATION[(rounds.week.index / 2) % ROUNDS_ITEM_ROTATION.length] : null

  return (
    <div className="career">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>Career</span>
        </div>
        <div />
      </div>

      <div className="career-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'career'} className={`career-tab ${tab === 'career' ? 'is-active' : ''}`} onClick={() => setTab('career')}>
          Career
        </button>
        <button role="tab" aria-selected={tab === 'kit'} className={`career-tab ${tab === 'kit' ? 'is-active' : ''}`} onClick={() => setTab('kit')}>
          Your Kit
        </button>
      </div>

      {tab === 'career' ? (
        <>
          <section className="career-head">
            <StageBadge stageKey={info.stage.key} size={46} className="career-badge" />
            {name && <p className="career-name">{name}</p>}
            <h1 className="career-stage">{info.stage.name}</h1>
            <p className="career-level">
              Level {info.level} <span className="career-milestone">· {info.milestone}</span>
            </p>
            <LevelLine info={info} width={300} className="career-line" />
            <p className="career-xp">
              {fmt(xp)} XP <span>{fmt(info.toNext)} XP to Level {info.level + 1}</span>
            </p>
            {nextRewards.length > 0 && (
              <p className="career-next">
                Level {info.level + 1}: {nextRewards.map((it) => `${KIT[it].name} +1`).join(' · ')}
              </p>
            )}
          </section>

          <dl className="career-stats">
            <div><dt>Puzzles solved</dt><dd>{fmt(stats?.gamesWon || 0)}</dd></div>
            <div><dt>Connections solved</dt><dd>{fmt(connections)}</dd></div>
            <div><dt>Perfect Dailies</dt><dd>{fmt(perfectDailies)}</dd></div>
            <div><dt>Systems complete</dt><dd>{systemsComplete} of 16</dd></div>
            <div><dt>Current streak</dt><dd>{streak.current} {streak.current === 1 ? 'day' : 'days'}</dd></div>
            <div><dt>Longest streak</dt><dd>{streak.longest} {streak.longest === 1 ? 'day' : 'days'}</dd></div>
          </dl>

          <section className="career-rounds" aria-label="Rounds this week">
            <h2 className="career-section">Rounds this week</h2>
            <ul className="rounds-list">
              {rounds.goals.map((g) => (
                <li key={g.id} className={`rounds-goal ${g.done ? 'is-done' : ''}`}>
                  <span className="rounds-node" aria-hidden="true" />
                  <span className="rounds-label">{g.label}</span>
                  <span className="rounds-count">{g.count}/{g.target}</span>
                </li>
              ))}
            </ul>
            <p className="rounds-foot">
              {rounds.complete
                ? 'Rounds complete. Resets Monday.'
                : `+${XP.rounds} XP${roundsItem ? ` and ${KIT[roundsItem].name} +1` : ''} for all three. Resets Monday.`}
            </p>
          </section>
        </>
      ) : (
        <section className="career-kit" aria-label="Your Kit">
          <ul className="kit-list">
            {KIT_ORDER.map((item) => {
              const def = KIT[item]
              const open = itemOpen(item, info.stage.key)
              const stageName = STAGES.find((s) => s.key === def.stage)?.name
              return (
                <li key={item} className={`kit-item ${open ? '' : 'is-locked'}`}>
                  <KitIcon item={item} size={26} />
                  <div className="kit-text">
                    <span className="kit-name">{def.name}</span>
                    <span className="kit-desc">{def.desc}</span>
                    {open && !def.ready && counts[item] > 0 && <span className="kit-soon">Ready in a later update.</span>}
                  </div>
                  <span className="kit-count">{open ? `×${counts[item]}` : <>Opens at<br />{stageName}</>}</span>
                </li>
              )
            })}
          </ul>
          <p className="kit-foot">Earned from levels, Rounds, finished systems, streaks and every fifth perfect Daily. Rewards are fixed and shown before you earn them. Tools are off in Race, and a Daily solved with a tool doesn't count as perfect.</p>
        </section>
      )}
    </div>
  )
}
