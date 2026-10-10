import React from 'react'
import Modal from './Modal.jsx'
import BrandMark from './BrandMark.jsx'
import { MAX_MISTAKES } from '../utils/game.js'
import { XP, KIT, TIMED_XP } from '../progression/config.js'

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
      'Tools work in Dailies only, one per Daily. A Daily solved with a tool shows “Solved with assistance.” You earn tools from levels, This Week and Coverage.',
    ],
  },
  {
    id: 'coverage',
    title: 'Streaks and Coverage',
    body: [
      'Your streak grows each day you finish the Daily. Coverage protects it through a missed day and is used automatically.',
      `You earn one Coverage for every 7 Dailies you complete. If you already hold ${KIT.shield.max}, you get a puzzle tool instead, or 50 XP if your tools are full.`,
    ],
  },
  {
    id: 'week',
    title: 'This Week',
    body: [
      `Finish any 2 of 3 goals by Sunday for ${XP.rounds} XP and a tool of your choice: complete 3 Dailies, finish 2 timed sessions, or complete the Daily every day from Monday to Sunday (Coverage counts for a missed day). Goals reset on Monday.`,
    ],
  },
  {
    id: 'xp',
    title: 'XP and levels',
    body: [
      'Every puzzle you finish earns XP and grows My Plexus. New levels bring tools.',
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
