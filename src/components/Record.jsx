import React, { useEffect, useMemo, useRef, useState } from 'react'
import { recordSnapshot } from '../progression/store.js'
import { KIT, KIT_ORDER, levelRewards, XP, ROUNDS_ITEM_ROTATION } from '../progression/config.js'
import { itemOpen, levelInfo } from '../progression/engine.js'
import { PlexusGrowth, WeekGoals, KitIcon, fmt } from './RecordParts.jsx'
import { useGrowthAnimation, readSeenXp, writeSeenXp } from './useGrowthAnimation.js'

// My Plexus (internally "Record"): the player's own Plexus, growing as they
// level up. The level leads with one line of XP under it, then the network
// (the next reward sits on the next level's node), compact stats and This
// Week. Your Kit is the second tab. Never locked.
//
// XP earned since the last visit plays into the network when the page opens
// (see useGrowthAnimation). `preview` ({ from, to }) replays that sequence for
// any XP range without reading or writing the saved marker, for checking the
// level-up moment during development; nothing is ever awarded here.

const rewardLabel = (items) => items.map((it) => `${KIT[it].name} +1`).join(' · ')

function useWide(ref, min = 620) {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const check = () => setWide(el.getBoundingClientRect().width >= min)
    check()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, min])
  return wide
}

// The weekly reward: two parts (XP and, every other week, a Kit tool) with
// what state it is in. It is added automatically the moment the third goal is
// done; nothing needs claiming. `pending`: not all goals done. `earned`: done
// and paid. `due`: done but not yet paid (it is paid with the next puzzle
// you finish, for example after a sync from another device).
function WeekReward({ xp, item, state }) {
  const label = state === 'earned' ? 'Weekly reward earned' : 'Weekly reward'
  const foot =
    state === 'earned'
      ? 'Added to your XP and Kit. New goals Monday.'
      : state === 'due'
        ? 'Added with the next puzzle you finish. New goals Monday.'
        : 'Added automatically when all 3 are done. Resets Monday.'
  return (
    <div className={`week-reward is-${state}`}>
      <span className="week-reward-label">{label}</span>
      <div className="week-reward-items">
        <span className="week-reward-item">
          <span className="week-reward-node" aria-hidden="true" />
          <b>{fmt(xp)} XP</b>
        </span>
        {item && (
          <span className="week-reward-item">
            <KitIcon item={item} size={18} />
            <b>{KIT[item].name} +1</b>
          </span>
        )}
      </div>
      <p className="rounds-foot">{foot}</p>
    </div>
  )
}

export default function Record({ history, todayKey, stats, onBack, initialTab = 'record', initialSection = null, preview = null }) {
  const [tab, setTab] = useState(initialTab)
  const snap = useMemo(() => recordSnapshot({ history, todayKey }), [history, todayKey])
  const { counts, streak, systemsComplete, connections, rounds } = snap
  const perfectDailies = useMemo(
    () => Object.entries(history || {}).filter(([, e]) => e?.completed && e.won && e.mistakes === 0).length,
    [history]
  )
  const roundsItem = rounds.week.index % 2 === 0 ? ROUNDS_ITEM_ROTATION[(rounds.week.index / 2) % ROUNDS_ITEM_ROTATION.length] : null
  const unit = (n) => (n === 1 ? 'day' : 'days')
  const weekState = !rounds.complete ? 'pending' : rounds.paid ? 'earned' : 'due'

  // Opened from Home's This Week line: bring This Week into view.
  useEffect(() => {
    if (initialSection !== 'week') return undefined
    const t = setTimeout(() => {
      const el = document.getElementById('this-week')
      if (el) el.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }, 120)
    return () => clearTimeout(t)
  }, [initialSection])

  // Where the XP animation starts and ends. Read the marker once per mount,
  // then move it to the current total so a reload never replays the same XP.
  const target = preview ? preview.to : snap.xp
  const [from] = useState(() => {
    if (preview) return preview.from
    const seen = readSeenXp()
    // First visit on this device: a gentle fill within the current level.
    if (seen == null || !(seen <= snap.xp)) return levelInfo(snap.xp).levelStart
    return seen
  })
  useEffect(() => {
    if (!preview) writeSeenXp(snap.xp)
  }, [preview, snap.xp])
  const [runKey, setRunKey] = useState(0)
  const anim = useGrowthAnimation({ from, to: target, runKey, rewardsFor: levelRewards })
  const heroLevel = anim.activating && anim.earned ? anim.earned.level : anim.level
  const shown = { level: anim.level, intoLevel: anim.intoLevel, cost: anim.cost, toNext: anim.toNext }
  const toNextLevel = heroLevel + 1
  const toNextXp = anim.activating ? levelInfo(anim.xp).toNext : anim.toNext
  // Your Kit always reads the real saved level, never a preview.
  const info = snap.info

  const netRef = useRef(null)
  const wide = useWide(netRef)

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
            <h1 className="record-level" key={heroLevel}>Level {heroLevel}</h1>
            <p className="record-xpline">
              <span className="record-tonext">{fmt(toNextXp)} XP to Level {toNextLevel}</span>
              <span className="record-dot" aria-hidden="true"> · </span>
              <span className="record-xp">{fmt(anim.xp)} XP</span>
            </p>
            {anim.earned && !anim.activating && (
              <p className="record-earned" role="status">
                Level {anim.earned.level} · {rewardLabel(anim.earned.items)}
              </p>
            )}
            {anim.earned && anim.activating && (
              <p className="sr-only" role="status">
                Level {anim.earned.level}. {rewardLabel(anim.earned.items)} added to Your Kit.
              </p>
            )}
            {preview && (
              <p className="record-preview">
                Preview · nothing is saved{' '}
                <button type="button" className="record-preview-replay" onClick={() => setRunKey((k) => k + 1)}>
                  Replay
                </button>
              </p>
            )}
          </section>

          <div className="record-net" ref={netRef}>
            <PlexusGrowth
              key={anim.level}
              info={shown}
              rewardsFor={levelRewards}
              rewardText={rewardLabel(levelRewards(anim.level + 1))}
              size={wide ? 'wide' : 'compact'}
              moving={anim.moving}
              activating={anim.activating}
              label={anim.activating && anim.earned ? { kicker: `Level ${anim.earned.level}`, text: rewardLabel(anim.earned.items) } : null}
            />
          </div>

          <div className="record-side">
            <div className="record-stats">
              <dl className="record-streaks">
                <div><dd>{fmt(streak.current)}<span className="record-unit"> {unit(streak.current)}</span></dd><dt>Current streak</dt></div>
                <div><dd>{fmt(streak.longest)}<span className="record-unit"> {unit(streak.longest)}</span></dd><dt>Best streak</dt></div>
              </dl>
              <dl className="record-totals">
                <div><dd>{fmt(stats?.gamesWon || 0)}</dd><dt>Puzzles</dt></div>
                <div><dd>{fmt(connections)}</dd><dt>Connections</dt></div>
                <div><dd>{fmt(perfectDailies)}</dd><dt>Perfect Dailies</dt></div>
                <div><dd>{systemsComplete}<span className="record-unit">/16</span></dd><dt>Systems</dt></div>
              </dl>
            </div>

            <section className="record-week" aria-labelledby="this-week">
              <h2 className="record-section" id="this-week">This Week</h2>
              <WeekGoals goals={rounds.goals} complete={rounds.complete} />
              <WeekReward xp={XP.rounds} item={roundsItem} state={weekState} />
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
