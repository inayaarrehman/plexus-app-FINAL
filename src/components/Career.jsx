import React, { useMemo, useState } from 'react'
import { careerSnapshot } from '../progression/store.js'
import { KIT, KIT_ORDER, STAGES, MILESTONES, levelRewards, levelCost, XP, ROUNDS_ITEM_ROTATION } from '../progression/config.js'
import { itemOpen } from '../progression/engine.js'
import { CareerPath, MilestonePath, KitIcon, fmt } from './CareerParts.jsx'

// Career: the player's Plexus rank. The current stage leads, then the whole
// career path (Premed to Attending) with the current stage lit, then the
// stage's milestone path (its levels, with progress to the next level), then
// XP, compact stats and This Week. Your Kit is the second tab. Never locked.
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
  // How far through the current stage (by XP), for the career path link.
  const stageFrac = useMemo(() => {
    const idx = STAGES.findIndex((st) => st.key === info.stage.key)
    const next = STAGES[idx + 1]
    if (!next) return 0
    const xpAt = (lvl) => {
      let t = 0
      for (let L = 1; L < lvl; L++) t += levelCost(L)
      return t
    }
    const a = xpAt(info.stage.from)
    const b = xpAt(next.from)
    return Math.max(0, Math.min(1, (xp - a) / (b - a)))
  }, [info, xp])
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
            {name && <p className="career-name">{name}</p>}
            <h1 className="career-stage">{info.stage.name}</h1>
            <p className="career-level">
              Level {info.level} <span className="career-milestone">· {info.milestone}</span>
            </p>
          </section>

          <CareerPath info={info} stageFrac={stageFrac} />

          <MilestonePath info={info} milestones={MILESTONES} />

          <section className="career-xp-block">
            <p className="career-xp">{fmt(xp)} XP</p>
            <p className="career-tonext">{fmt(info.toNext)} XP to Level {info.level + 1}</p>
            {nextRewards.length > 0 && (
              <p className="career-next">Next: {nextRewards.map((it) => `${KIT[it].name} +1`).join(' · ')}</p>
            )}
          </section>

          <dl className="career-stats">
            <div><dd>{fmt(stats?.gamesWon || 0)}</dd><dt>Puzzles</dt></div>
            <div><dd>{fmt(connections)}</dd><dt>Connections</dt></div>
            <div><dd>{fmt(perfectDailies)}</dd><dt>Perfect Dailies</dt></div>
            <div><dd>{systemsComplete} / 16</dd><dt>Systems</dt></div>
            <div><dd>{streak.current} {streak.current === 1 ? 'day' : 'days'}</dd><dt>Current streak</dt></div>
            <div><dd>{streak.longest} {streak.longest === 1 ? 'day' : 'days'}</dd><dt>Best streak</dt></div>
          </dl>

          <section className="career-week" aria-labelledby="this-week">
            <h2 className="career-section" id="this-week">This Week</h2>
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
          <p className="kit-foot">Earned from levels, This Week, finished systems, streaks and every fifth perfect Daily. Rewards are fixed and shown before you earn them. Tools are off in Race, and a Daily solved with a tool doesn't count as perfect.</p>
        </section>
      )}
    </div>
  )
}
