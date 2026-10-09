import React, { useEffect, useMemo, useRef, useState } from 'react'
import { recordSnapshot, claimTool, chooseWeeklyTool } from '../progression/store.js'
import { KIT, PUZZLE_TOOLS, RACE_ITEMS, RACE_REWARDS, REMOVED_NAMES, COVERAGE_EVERY, levelRewards, XP, WEEKLY_GOALS_NEEDED } from '../progression/config.js'
import { itemOpen, levelInfo } from '../progression/engine.js'
import { formatDayKey } from '../utils/calendar.js'
import { getRaceSummary } from '../lib/raceApi.js'
import { PlexusGrowth, WeekGoals, KitIcon, fmt } from './RecordParts.jsx'
import { useGrowthAnimation, readSeenXp, writeSeenXp } from './useGrowthAnimation.js'

// My Plexus (internally "Record"): the player's own Plexus, growing as they
// level up. The level leads, then total XP and the XP still needed for the
// next level (kept apart, each labelled), a labelled progress bar and the
// next reward; then the network, compact stats and This Week. Your Tools is
// the second tab. Never locked.
//
// XP earned since the last visit plays into the network when the page opens
// (see useGrowthAnimation). `preview` ({ from, to }) replays that sequence for
// any XP range without reading or writing the saved marker, for checking the
// level-up moment during development; nothing is ever awarded here.

const rewardLabel = (items) => items.map((it) => `${KIT[it]?.name || it} +1`).join(' · ')

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

// The weekly reward: 250 XP plus one puzzle tool the player chooses. The XP
// is added the moment the second goal is done; the tool waits for a choice.
function WeekReward({ rounds, choices, level, onChoose }) {
  const resetKey = rounds.week.endKey
  const reset = formatDayKey(resetKey, { weekday: 'long', month: 'short', day: 'numeric' })
  const state = !rounds.complete ? 'pending' : rounds.paid ? 'earned' : 'due'
  const due = choices[0] || null
  return (
    <div className={`week-reward is-${state}`}>
      <span className="week-reward-label">{state === 'earned' ? 'Weekly reward earned' : 'Weekly reward'}</span>
      <div className="week-reward-items">
        <span className="week-reward-item">
          <span className="week-reward-node" aria-hidden="true" />
          <b>{fmt(XP.rounds)} XP</b>
        </span>
        <span className="week-reward-item">
          <KitIcon item="curbside" size={18} />
          <b>+1 puzzle tool of your choice</b>
        </span>
      </div>
      {due && (
        <div className="week-choice" role="group" aria-label="Choose your weekly tool">
          <p className="week-choice-head">Choose your tool</p>
          <div className="week-choice-row">
            {PUZZLE_TOOLS.map((item) => {
              const open = itemOpen(item, level)
              return (
                <button key={item} className="week-choice-btn" disabled={!open} onClick={() => onChoose(due, item)}>
                  {KIT[item].name}
                  {!open && <span className="week-choice-lock"> · Level {KIT[item].unlock}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <p className="rounds-foot">
        {state === 'pending' ? '' : 'Added to your XP. '}
        New goals {reset}.
      </p>
    </div>
  )
}

function ToolRow({ item, def, count, open, pending, onClaim, earn, extra }) {
  const waiting = pending.length
  const full = def.max && count >= def.max
  return (
    <li className={`kit-item ${open ? '' : 'is-locked'}`}>
      <KitIcon item={item} size={26} />
      <div className="kit-text">
        <span className="kit-name">{def.name}</span>
        <span className="kit-desc">{def.desc}</span>
        {earn && <span className="kit-earn">{earn}</span>}
        {extra && <span className="kit-earn">{extra}</span>}
        {waiting > 0 && (
          <span className="kit-pending">
            {waiting} waiting{full ? ' (inventory full)' : ''}
            {!full && (
              <button type="button" className="kit-claim" onClick={() => onClaim(item)}>
                Claim
              </button>
            )}
          </span>
        )}
      </div>
      <span className="kit-count">
        {open ? (
          <>
            ×{count}
            {def.max ? <span className="kit-cap"> / {def.max}</span> : null}
          </>
        ) : (
          <>
            Unlocks at
            <br />
            Level {def.unlock}
          </>
        )}
      </span>
    </li>
  )
}

const EARN = {
  curbside: 'Earned: one to start, Level 2, every third level from 6, and This Week.',
  lab: 'Earned: Level 3, every third level from 7, and This Week.',
  'second-opinion': 'Earned: Level 5, every third level from 8, and This Week.',
}

export default function Record({ history, todayKey, stats, onBack, systemsBoards = null, initialTab = 'record', initialSection = null, preview = null }) {
  const [tab, setTab] = useState(initialTab)
  const [tick, setTick] = useState(0)
  const snap = useMemo(() => recordSnapshot({ history, todayKey }), [history, todayKey, tick])
  const { counts, streak, connections, rounds, pending, weeklyChoices, coverage, nextReward, converted } = snap
  const perfectDailies = useMemo(
    () => Object.entries(history || {}).filter(([, e]) => e?.completed && e.won && e.mistakes === 0).length,
    [history]
  )
  const unit = (n) => (n === 1 ? 'day' : 'days')
  const [race, setRace] = useState(undefined) // undefined: loading, null: unavailable
  useEffect(() => {
    let live = true
    getRaceSummary().then((r) => live && setRace(r))
    return () => {
      live = false
    }
  }, [])

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
  const [{ from, hadSeen }] = useState(() => {
    if (preview) return { from: preview.from, hadSeen: true }
    const seen = readSeenXp()
    if (seen == null || !(seen <= snap.xp)) return { from: levelInfo(snap.xp).levelStart, hadSeen: false }
    return { from: seen, hadSeen: true }
  })
  useEffect(() => {
    if (!preview) writeSeenXp(snap.xp)
  }, [preview, snap.xp])
  const [runKey, setRunKey] = useState(0)
  const anim = useGrowthAnimation({ from, to: target, runKey, rewardsFor: levelRewards })
  // The numbers are always the true saved values, shown at once. Only the
  // network and the bar fill animate, so a paused or interrupted animation
  // can never leave a wrong total or a wrong "To Level" on screen.
  const truth = levelInfo(target)
  const heroLevel = truth.level
  const shown = { level: anim.level, intoLevel: anim.intoLevel, cost: anim.cost, toNext: anim.toNext }
  const live = { intoLevel: truth.intoLevel, cost: truth.cost, toNext: truth.toNext }
  const pctOf = (into, cost) => (cost > 0 ? Math.max(0, Math.min(100, Math.round((into / cost) * 100))) : 0)
  const pct = pctOf(live.intoLevel, live.cost)
  // Bar animation start: where this level's bar was at the last visit (0 if
  // a level was reached since). Pure CSS, so it ends at the true width even
  // if the tab is hidden while it plays.
  const fromInfo = levelInfo(Math.min(from ?? target, target))
  const barFrom = fromInfo.level === truth.level ? pctOf(fromInfo.intoLevel, fromInfo.cost) : 0
  // "+N" only for XP actually earned since the last visit (not on a first visit).
  const gained = hadSeen ? Math.max(0, target - (from ?? target)) : 0
  // Your Tools always reads the real saved level, never a preview.
  const info = snap.info

  const netRef = useRef(null)
  const wide = useWide(netRef)
  const refresh = () => setTick((t) => t + 1)
  const onClaim = (item) => {
    claimTool(item)
    refresh()
  }
  const onChoose = (weekKey, item) => {
    chooseWeeklyTool(weekKey, item)
    refresh()
  }
  const convertedList = Object.entries(converted || {}).filter(([, n]) => n > 0)

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
          Your Tools
        </button>
      </div>

      {tab === 'record' ? (
        <div className="record-main">
          <section className="record-hero" aria-label="Level">
            <h1 className="record-level" key={heroLevel}>Level {heroLevel}</h1>
            <dl className="record-xpstats">
              <div>
                <dt>Total XP</dt>
                <dd>
                  {fmt(target)}
                  {gained > 0 && (
                    <span className="record-gain" key={`${runKey}-${target}`} aria-label={`${fmt(gained)} XP since your last visit`}>
                      +{fmt(gained)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>To Level {heroLevel + 1}</dt>
                <dd>{fmt(live.toNext)} XP</dd>
              </div>
            </dl>
            <div className="record-progress">
              <span className="record-progress-label" id="lvl-progress-label">
                Level {heroLevel} progress: {fmt(live.intoLevel)} of {fmt(live.cost)} XP
              </span>
              <div className="record-progress-track" role="progressbar" aria-labelledby="lvl-progress-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <span className={`record-progress-fill ${barFrom !== pct ? 'is-growing' : ''}`} key={`${runKey}-${pct}`} style={{ width: `${pct}%`, '--bar-from': `${barFrom}%` }} />
              </div>
            </div>
            {nextReward && !preview && (
              <p className="record-next">
                Next reward: <b>Level {nextReward.level}</b> · {rewardLabel(nextReward.items)}
              </p>
            )}
            {anim.earned && !anim.activating && (
              <p className="record-earned" role="status">
                Level {anim.earned.level}
                {anim.earned.items.length ? ` · ${rewardLabel(anim.earned.items)}` : ''}
              </p>
            )}
            {anim.earned && anim.activating && (
              <p className="sr-only" role="status">
                Level {anim.earned.level}.{anim.earned.items.length ? ` ${rewardLabel(anim.earned.items)} added to Your Tools.` : ''}
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
              ariaInfo={{ level: truth.level, toNext: truth.toNext }}
              rewardsFor={levelRewards}
              rewardText={rewardLabel(levelRewards(anim.level + 1))}
              size={wide ? 'wide' : 'compact'}
              moving={anim.moving}
              activating={anim.activating}
              label={anim.activating && anim.earned && anim.earned.items.length ? { kicker: `Level ${anim.earned.level}`, text: rewardLabel(anim.earned.items) } : null}
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
                <div>
                  <dd>
                    {fmt(systemsBoards?.completed || 0)}
                    <span className="record-unit">/{fmt(systemsBoards?.available || 0)}</span>
                  </dd>
                  <dt>Systems boards</dt>
                </div>
              </dl>
            </div>

            <section className="record-week" aria-labelledby="this-week">
              <h2 className="record-section" id="this-week">This Week</h2>
              <p className="week-progress" aria-live="polite">
                <b>{Math.min(rounds.done, WEEKLY_GOALS_NEEDED)}/{WEEKLY_GOALS_NEEDED}</b> goals completed for your weekly reward
              </p>
              <p className="week-rule">Complete any {WEEKLY_GOALS_NEEDED} of the {rounds.goals.length} goals below.</p>
              <WeekGoals goals={rounds.goals} complete={rounds.complete} />
              <WeekReward rounds={rounds} choices={weeklyChoices} level={info.level} onChoose={onChoose} />
            </section>
          </div>
        </div>
      ) : (
        <section className="record-kit" aria-label="Your Tools">
          <h2 className="kit-group-head">Puzzle Tools <span className="kit-group-sub">Daily and Systems boards · one per board</span></h2>
          <ul className="kit-list">
            {PUZZLE_TOOLS.map((item) => (
              <ToolRow key={item} item={item} def={KIT[item]} count={counts[item]} open={itemOpen(item, info.level)} pending={pending[item] || []} onClaim={onClaim} earn={EARN[item]} />
            ))}
          </ul>
          <h2 className="kit-group-head">Streak Protection</h2>
          <ul className="kit-list">
            <ToolRow
              item="shield"
              def={KIT.shield}
              count={counts.shield}
              open
              pending={pending.shield || []}
              onClaim={onClaim}
              earn={`Earned: one for every ${COVERAGE_EVERY} Dailies you complete on their day (Archive replays don’t count).`}
              extra={`Next Coverage: ${coverage.count % COVERAGE_EVERY}/${COVERAGE_EVERY} Dailies`}
            />
          </ul>
          <h2 className="kit-group-head">Race Power-ups <span className="kit-group-sub">Chaos races only</span></h2>
          <ul className="kit-list">
            {Object.entries(RACE_ITEMS).map(([item, def]) => {
              const inv = race?.inventory?.[item] ?? 0
              const prog =
                item === 'mutation'
                  ? `Mutation: ${(race?.progress?.qualifyingWins ?? 0) % RACE_REWARDS.mutationEveryWins}/${RACE_REWARDS.mutationEveryWins} qualifying wins`
                  : `CRISPR: ${(race?.progress?.qualifyingRaces ?? 0) % RACE_REWARDS.crisprEveryRaces}/${RACE_REWARDS.crisprEveryRaces} qualifying races`
              return (
                <li key={item} className={`kit-item ${race ? '' : 'is-locked'}`}>
                  <KitIcon item={item} size={26} />
                  <div className="kit-text">
                    <span className="kit-name">{def.name}</span>
                    <span className="kit-desc">{def.desc}</span>
                    <span className="kit-earn">
                      {item === 'mutation'
                        ? `Earned: one for every ${RACE_REWARDS.mutationEveryWins} qualifying Race wins.`
                        : `Earned: one for every ${RACE_REWARDS.crisprEveryRaces} qualifying Races, win or lose.`}
                    </span>
                    {race ? <span className="kit-earn">{prog}</span> : <span className="kit-earn">{race === undefined ? 'Loading…' : 'Sign in to earn and use Race power-ups.'}</span>}
                    {race && (race.pending?.[item] || 0) > 0 && <span className="kit-pending">{race.pending[item]} waiting (inventory full)</span>}
                  </div>
                  <span className="kit-count">
                    ×{inv}
                    <span className="kit-cap"> / {def.max}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="kit-foot">
            Caps: puzzle tools {KIT.curbside.max} each, Coverage {KIT.shield.max}, Race power-ups {RACE_ITEMS.mutation.max} each. Rewards that arrive when you are full wait here as claims, nothing is lost. A Daily solved with a tool earns its normal XP and shows {'“'}Solved with assistance{'”'}; Perfect needs no mistakes and no tools. Tools are off in 3 Minutes and Race. Race rewards count up to {RACE_REWARDS.perOpponentPerDay} qualifying races per opponent and {RACE_REWARDS.perDay} in total each day.
          </p>
          {convertedList.length > 0 && (
            <p className="kit-foot">
              Retired tools converted 1:1: {convertedList.map(([old, n]) => `${REMOVED_NAMES[old] || old} ×${n}`).join(', ')} (Imaging to Consult, Readout to Rule Out, Time Out to Second Opinion).
            </p>
          )}
        </section>
      )}
    </div>
  )
}
