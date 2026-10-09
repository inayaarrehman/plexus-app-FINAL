import React, { useEffect, useMemo, useRef, useState } from 'react'
import { recordSnapshot, claimTool, chooseWeeklyTool } from '../progression/store.js'
import { KIT, PUZZLE_TOOLS, RACE_ITEMS, RACE_REWARDS, REMOVED_NAMES, COVERAGE_EVERY, levelRewards, XP, WEEKLY_GOALS_NEEDED } from '../progression/config.js'
import { itemOpen, levelInfo } from '../progression/engine.js'
import { formatDayKey } from '../utils/calendar.js'
import { getRaceSummary } from '../lib/raceApi.js'
import { PlexusGrowth, WeekGoals, ToolArt, Pips, fmt } from './RecordParts.jsx'
import InfoIcon from './InfoIcon.jsx'
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
    <div className={`week-reward mp-reward is-${state}`}>
      <div className="mp-reward-main">
        <RewardMark state={state} />
        <div className="mp-reward-text">
          <span className="week-reward-label">{state === 'earned' ? 'Weekly reward earned' : state === 'due' ? 'Weekly reward unlocked' : 'Weekly reward'}</span>
          <p className="mp-reward-title">
            <b>{fmt(XP.rounds)} XP</b> + 1 tool of your choice
          </p>
        </div>
      </div>
      {due && (
        <div className="week-choice" role="group" aria-label="Choose your weekly tool">
          <p className="week-choice-head">Choose your tool</p>
          <div className="week-choice-row">
            {PUZZLE_TOOLS.map((item) => {
              const open = itemOpen(item, level)
              return (
                <button key={item} className="week-choice-btn" disabled={!open} onClick={() => onChoose(due, item)}>
                  <ToolArt item={item} locked={!open} size="icon" />
                  <span>
                    {KIT[item].name}
                    {!open && <span className="week-choice-lock"> · Level {KIT[item].unlock}</span>}
                  </span>
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

// The weekly reward's mark: three goal nodes joining into one reward node.
// Open while pending, filled once the week's two goals are done.
function RewardMark({ state }) {
  const lit = state !== 'pending'
  return (
    <svg className={`mp-reward-mark ${lit ? 'is-lit' : ''}`} width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true" focusable="false">
      <path d="M10 13 26 26M10 39 26 26M42 13 26 26" className="mrm-link" />
      <circle cx="10" cy="13" r="4" className="mrm-node n1" />
      <circle cx="10" cy="39" r="4" className="mrm-node n2" />
      <circle cx="42" cy="13" r="4" className="mrm-node n3" />
      <circle cx="26" cy="26" r="9" className="mrm-core" />
      <path d="M26 21.5v9M21.5 26h9" className="mrm-plus" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="tool-lock-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
      <rect x="2" y="5.2" width="8" height="5.8" rx="1.4" fill="currentColor" />
      <path d="M3.9 5.4V3.9a2.1 2.1 0 0 1 4.2 0v1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

// One tool, as a card: its drawing, what it does, how many you hold of the
// cap (as nodes and as a number) or what unlocks it, and any claims waiting.
function ToolCard({ item, def, count, open, pending = [], onClaim, art = {}, children }) {
  const waiting = pending.length
  const full = def.max && count >= def.max
  return (
    <li className={`tool-card kit-item ${open ? '' : 'is-locked'} ${count > 0 && open ? 'has-some' : ''}`}>
      <span className="tool-card-art">
        <ToolArt item={item} locked={!open} {...art} />
      </span>
      <div className="tool-card-body kit-text">
        <h3 className="kit-name">{def.name}</h3>
        <p className="kit-desc">{def.desc}</p>
        {open ? (
          <div className="tool-card-qty" aria-label={`${count} of ${def.max} held`}>
            <Pips value={count} max={def.max} />
            <span className="kit-count">
              {count}
              <span className="kit-cap"> / {def.max}</span>
            </span>
          </div>
        ) : (
          <span className="tool-lock">
            <LockIcon /> Unlocks at Level {def.unlock}
          </span>
        )}
        {children}
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
          <section className="record-hero mp-hero" aria-label="Level">
            <h1 className="record-level" key={heroLevel}>Level {heroLevel}</h1>
            <p className="mp-total">
              <b>{fmt(target)}</b> total XP
              {gained > 0 && (
                <span className="record-gain" key={`${runKey}-${target}`} aria-label={`${fmt(gained)} XP since your last visit`}>
                  +{fmt(gained)}
                </span>
              )}
            </p>
            <p className="mp-tonext">
              <b>{fmt(live.toNext)} XP</b> to Level {heroLevel + 1}
            </p>
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

          <div className="record-net mp-path" ref={netRef}>
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
            <div className="record-progress mp-progress">
              <span className="record-progress-label" id="lvl-progress-label">
                <span className="sr-only">Level {heroLevel} progress: {fmt(live.intoLevel)} of {fmt(live.cost)} XP</span>
                <span aria-hidden="true">
                  <b>{fmt(live.intoLevel)}</b> / {fmt(live.cost)} XP
                </span>
              </span>
              <div className="record-progress-track" role="progressbar" aria-labelledby="lvl-progress-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <span className={`record-progress-fill ${barFrom !== pct ? 'is-growing' : ''}`} key={`${runKey}-${pct}`} style={{ width: `${pct}%`, '--bar-from': `${barFrom}%` }} />
              </div>
              {nextReward && !preview && (
                <p className="record-next sr-only">
                  Next reward: Level {nextReward.level} · {rewardLabel(nextReward.items)}
                </p>
              )}
            </div>
          </div>

          <div className="record-side">
            <section className="mp-stats" aria-labelledby="mp-stats-head">
              <h2 className="record-section mp-stats-head" id="mp-stats-head">
                Your stats
              </h2>
              <dl className="mp-stat-grid">
                <div className="mp-stat jewel-peacock">
                  <dt>Current streak</dt>
                  <dd>
                    {fmt(streak.current)}
                    <span className="record-unit"> {unit(streak.current)}</span>
                  </dd>
                </div>
                <div className="mp-stat jewel-cobalt">
                  <dt>Best streak</dt>
                  <dd>
                    {fmt(streak.longest)}
                    <span className="record-unit"> {unit(streak.longest)}</span>
                  </dd>
                </div>
                <div className="mp-stat jewel-plum">
                  <dt>Puzzles</dt>
                  <dd>{fmt(stats?.gamesWon || 0)}</dd>
                </div>
                <div className="mp-stat jewel-plum">
                  <dt>Connections</dt>
                  <dd>{fmt(connections)}</dd>
                </div>
                <div className="mp-stat jewel-terracotta">
                  <dt>Perfect Dailies</dt>
                  <dd>{fmt(perfectDailies)}</dd>
                </div>
                <div className="mp-stat jewel-peacock">
                  <dt>Systems boards</dt>
                  <dd>
                    {fmt(systemsBoards?.completed || 0)}
                    <span className="record-unit">/{fmt(systemsBoards?.available || 0)}</span>
                  </dd>
                </div>
              </dl>
            </section>

            <section className="record-week mp-week" aria-labelledby="this-week">
              <div className="mp-week-head">
                <h2 className="record-section" id="this-week">This Week</h2>
                <div className="mp-week-meta">
                  <p className="week-progress" aria-live="polite">
                    <b>{Math.min(rounds.done, WEEKLY_GOALS_NEEDED)}/{WEEKLY_GOALS_NEEDED}</b> goals completed for your weekly reward
                  </p>
                  <p className="week-rule">Complete any {WEEKLY_GOALS_NEEDED} of the {rounds.goals.length} goals below.</p>
                </div>
              </div>
              <WeekGoals goals={rounds.goals} complete={rounds.complete} />
              <WeekReward rounds={rounds} choices={weeklyChoices} level={info.level} onChoose={onChoose} />
            </section>
          </div>
        </div>
      ) : (
        <section className="record-kit" aria-label="Your Tools">
          <div className="kit-section">
            <h2 className="kit-group-head">
              Puzzle Tools <span className="kit-group-sub">Dailies only · one per Daily</span>
            </h2>
            <ul className="kit-list tool-cards">
              {PUZZLE_TOOLS.map((item) => (
                <ToolCard key={item} item={item} def={KIT[item]} count={counts[item]} open={itemOpen(item, info.level)} pending={pending[item] || []} onClaim={onClaim} />
              ))}
            </ul>
            <details className="kit-more">
              <summary>
                <span className="kit-more-mark" aria-hidden="true" />
                How to earn tools
                <span className="kit-more-chev" aria-hidden="true" />
              </summary>
              <ul className="kit-more-list">
                {PUZZLE_TOOLS.map((item) => (
                  <li key={item}>
                    <b>{KIT[item].name}.</b> {EARN[item].replace(/^Earned: (.)/, (_, c) => c.toUpperCase())}
                  </li>
                ))}
                <li>
                  <b>{KIT.shield.name}.</b> One for every {COVERAGE_EVERY} Dailies you complete on their day (Archive replays don’t count).
                </li>
              </ul>
            </details>
          </div>

          <div className="kit-section">
            <h2 className="kit-group-head">Streak Protection</h2>
            <ul className="kit-list tool-cards">
              <ToolCard item="shield" def={KIT.shield} count={counts.shield} open pending={pending.shield || []} onClaim={onClaim} art={{ lit: coverage.count % COVERAGE_EVERY }}>
                <p className="tool-card-progress">
                  <b>
                    {coverage.count % COVERAGE_EVERY}/{COVERAGE_EVERY}
                  </b>{' '}
                  Dailies toward your next Coverage
                </p>
              </ToolCard>
            </ul>
          </div>

          <div className="kit-section">
            <h2 className="kit-group-head">
              Race Power-ups <span className="kit-group-sub">Chaos races only</span>
            </h2>
            <ul className="kit-list race-cards">
              {Object.entries(RACE_ITEMS).map(([item, def]) => {
                const inv = race?.inventory?.[item] ?? 0
                const prog =
                  item === 'mutation'
                    ? `${(race?.progress?.qualifyingWins ?? 0) % RACE_REWARDS.mutationEveryWins}/${RACE_REWARDS.mutationEveryWins} qualifying wins to the next`
                    : `${(race?.progress?.qualifyingRaces ?? 0) % RACE_REWARDS.crisprEveryRaces}/${RACE_REWARDS.crisprEveryRaces} qualifying races to the next`
                return (
                  <li key={item} className={`race-card kit-item ${race ? '' : 'is-locked'}`}>
                    <ToolArt item={item} locked={!race} size="sm" />
                    <h3 className="kit-name">{def.name}</h3>
                    <p className="kit-desc">{def.desc}</p>
                    <div className="tool-card-qty" aria-label={`${inv} of ${def.max} held`}>
                      <Pips value={inv} max={def.max} />
                      <span className="kit-count">
                        {inv}
                        <span className="kit-cap"> / {def.max}</span>
                      </span>
                    </div>
                    {race && <p className="tool-card-progress">{prog}</p>}
                    {race && (race.pending?.[item] || 0) > 0 && <span className="kit-pending">{race.pending[item]} waiting (inventory full)</span>}
                  </li>
                )
              })}
            </ul>
            <p className="kit-note">
              <InfoIcon size={15} />
              <span>
                {race === undefined
                  ? 'Loading…'
                  : race
                    ? `Earned in qualifying races: a Mutation every ${RACE_REWARDS.mutationEveryWins} wins, a CRISPR every ${RACE_REWARDS.crisprEveryRaces} races.`
                    : 'Sign in to earn and use Race power-ups.'}
              </span>
            </p>
          </div>

          <details className="kit-more">
            <summary>
              <span className="kit-more-mark is-rules" aria-hidden="true" />
              Tool rules and limits
              <span className="kit-more-chev" aria-hidden="true" />
            </summary>
            <p className="kit-foot">
              Caps: puzzle tools {KIT.curbside.max} each, Coverage {KIT.shield.max}, Race power-ups {RACE_ITEMS.mutation.max} each. Rewards that arrive when you are full wait here as claims, nothing is lost. A Daily solved with a tool earns its normal XP and shows {'“'}Solved with assistance{'”'}; Perfect needs no mistakes and no tools. Tools can be used in Dailies only, not in Systems, 3 Minutes or Race. Tools earned in Systems are saved for your Dailies. Race rewards count up to {RACE_REWARDS.perOpponentPerDay} qualifying races per opponent and {RACE_REWARDS.perDay} in total each day.
            </p>
          </details>
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
