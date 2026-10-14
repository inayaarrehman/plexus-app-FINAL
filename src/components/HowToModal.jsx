import React from 'react'
import Modal from './Modal.jsx'
import BrandMark from './BrandMark.jsx'
import { MAX_MISTAKES } from '../utils/game.js'
import { XP, KIT, TIMED_XP, RACE_QUALIFY } from '../progression/config.js'

// How to play. The rules fit in a few seconds: three short steps and a small
// example drawn with demo tiles (everyday words, never a real or upcoming
// puzzle). Everything else (tools, Coverage, This Week, XP, Systems) sits in
// closed sections below, there when wanted and never required reading.
// Numbers come from the game's own constants, so the text cannot drift.
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six']
const say = (n) => words[n] || String(n)
const ordinal = (n) => ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'][n] || `${n}th`

const DEMO = [
  { t: 'Apple', on: true },
  { t: 'Oak' },
  { t: 'Pear', on: true },
  { t: 'Pine' },
  { t: 'Elm' },
  { t: 'Plum', on: true },
  { t: 'Ash' },
  { t: 'Fig', on: true },
]

const MORE = [
  {
    id: 'unlock',
    title: 'Other ways to play',
    body: ['Finish today’s Daily, win or lose, to open 3 Minutes, Race, Systems and the Archive for the day. They lock again when the next Daily arrives.'],
  },
  {
    id: 'tools',
    title: 'Tools',
    body: [
      'Consult highlights two tiles that belong together. Rule Out finds the odd tile in a “one away” guess. Second Opinion gives back one mistake.',
      'Tools work in Dailies and 3 Minutes: one per Daily, one per 3 Minutes session. A Daily solved with a tool shows “Solved with assistance.” You earn tools from levels, This Week and Coverage. Race has its own power-ups, Mutation and CRISPR, for Chaos races only.',
    ],
  },
  {
    id: 'coverage',
    title: 'Streaks and Coverage',
    body: [
      'Your streak grows each day you solve the Daily on its day. A loss or a missed day ends it; Coverage protects a missed day and is used automatically.',
      `You earn one Coverage for every 7 Dailies you complete. If you already hold ${KIT.shield.max}, you get a puzzle tool instead, or ${XP.coverageAlt} XP if your tools are full.`,
    ],
  },
  {
    id: 'week',
    title: 'This Week',
    body: [
      `Finish any 2 of 3 goals by Sunday for ${XP.rounds} XP and a tool of your choice: complete 3 Daily Challenges, finish 2 timed sessions (3 Minutes or Race), or solve a Daily without using a tool. Goals reset on Monday.`,
    ],
  },
  {
    id: 'study',
    title: 'Study, not patient care',
    body: [
      'Plexus is a study game. Puzzles simplify on purpose and can leave out exceptions, so never use them for patient care. The Medical Disclaimer, Terms and Privacy Policy are linked at the bottom of Home.',
    ],
  },
  {
    id: 'xp',
    title: 'XP and levels',
    body: [
      'Every puzzle you finish earns XP and grows My Plexus. New levels bring tools, and CRISPR from Level 12.',
      'Milestones come at Level 10, 20 and 30, then every 5 levels. Each one grows your badge, gives one of each puzzle tool and room to hold one more of each. From Level 20 it also brings a CRISPR for Race.',
      `Daily: ${XP.daily} for finishing, ${XP.dailyWin} more for solving, 5 to 20 for each group, ${XP.perfect} for a perfect solve. Archive: ${XP.archive} for a solved past Daily plus its groups. 3 Minutes: ${XP.challengePerCorrect} per correct answer, minus ${XP.challengePerWrong} per wrong one, up to ${XP.challengeMax}. Race: ${XP.raceFinish} for a finished race (every round answered, at least ${RACE_QUALIFY.minCorrect} correct), ${XP.raceWin} more for a win.`,
      `3 Minutes and Race share one daily XP limit: the first ${TIMED_XP.full} XP is full, then half rate up to ${TIMED_XP.cap} XP. After that you can keep playing for practice, and finished sessions still count toward This Week.`,
    ],
  },
  {
    id: 'systems',
    title: 'Systems',
    body: [
      'Practice one organ system at a time. Boards stay open until you solve them: leave or miss one and it comes back after the others, answers still hidden.',
      'Solving pays 100 XP on the first try, then 75, 50, and 25 from the fourth try on.',
    ],
  },
]

export default function HowToModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="How to play" className="howto-modal">
      <ol className="howto-rules">
        <li>
          <span className="howto-num" aria-hidden="true">1</span>
          <span>Find four related concepts among the 16 tiles.</span>
        </li>
        <li>
          <span className="howto-num" aria-hidden="true">2</span>
          <span>Select four and submit. Uncover all four groups.</span>
        </li>
        <li>
          <span className="howto-num" aria-hidden="true">3</span>
          <span>
            You have {say(MAX_MISTAKES)} mistakes. The {ordinal(MAX_MISTAKES)} ends the Daily.
          </span>
        </li>
      </ol>

      <figure className="howto-demo">
        <div className="howto-demo-grid" aria-hidden="true">
          {DEMO.map((d) => (
            <span key={d.t} className={`howto-demo-tile ${d.on ? 'is-on' : ''}`}>
              {d.t}
            </span>
          ))}
        </div>
        <figcaption className="howto-demo-caption">
          Example: Apple, Pear, Plum and Fig are all fruits, so those four make a group. Real Dailies use medical concepts.
        </figcaption>
      </figure>

      <p className="howto-unlock">Finish today’s Daily, win or lose, to unlock more ways to play.</p>

      <div className="howto-more">
        <h3 className="howto-more-title">More details</h3>
        {MORE.map((m) => (
          <details key={m.id} className="howto-detail">
            <summary>
              {m.title}
              <span className="howto-detail-chev" aria-hidden="true" />
            </summary>
            {m.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </details>
        ))}
      </div>

      <p className="howto-signoff">
        <BrandMark size={22} decorative />
        <span>Good luck, doctor.</span>
      </p>
    </Modal>
  )
}
