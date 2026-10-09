import React from 'react'
import Modal from './Modal.jsx'
import BrandMark from './BrandMark.jsx'
import { MAX_MISTAKES } from '../utils/game.js'

// How to play: three steps that match the game as built.
//   1. Sixteen concepts, four groups of four; select four and submit.
//      MAX_MISTAKES wrong guesses end the puzzle (the last one ends it).
//   2. A solved group shows its connection; Explanation opens why the four
//      belong together, with a way to report a problem.
//   3. Finishing today's Daily, won or lost, opens the other modes. Every
//      finished puzzle earns XP toward My Plexus.
// Numbers and values come from the game's own constants, so the text cannot
// drift from the rules.
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six']
const say = (n) => words[n] || String(n)

const STEPS = [
  {
    title: 'Find the connection',
    body: [
      'Each Daily has 16 medical concepts in four hidden groups. Select four tiles that share a connection and submit.',
      `You have ${say(MAX_MISTAKES)} mistakes. The ${MAX_MISTAKES === 4 ? 'fourth' : 'last'} one ends the puzzle. Watch for concepts that seem to fit two groups.`,
    ],
  },
  {
    title: 'See why they connect',
    body: [
      'A solved group shows its connection. Tap Explanation to see why the four belong together.',
      'If something looks wrong, you can report the connection from there.',
    ],
  },
  {
    title: 'Keep connecting',
    body: [
      'Finish today’s Daily, win or lose, to open 3 Minutes, Race, Systems and the Archive.',
      'Every puzzle you finish earns XP and grows My Plexus. Levels and This Week earn tools: Consult highlights two tiles that belong together, Rule Out finds the odd tile in a “one away” guess, and Second Opinion gives back one mistake. One tool per Daily or Systems board; a board solved with a tool shows “Solved with assistance.”',
      'Coverage protects your streak through a missed day, used automatically. You earn one for every 7 Dailies you complete.',
      'Systems boards stay open until you solve them. Leave or miss one and it comes back around after the others, answers still hidden. Solving pays 100 XP on the first try, then 75, 50, and 25 from the fourth try on.',
    ],
  },
]

export default function HowToModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="How to play" className="howto-modal">
      <ol className="howto-steps">
        {STEPS.map((s, i) => (
          <li className={`howto-step howto-step-${i + 1}`} key={s.title}>
            <span className="howto-num" aria-hidden="true">
              {i + 1}
            </span>
            <div className="howto-text">
              <h3 className="howto-title">{s.title}</h3>
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="howto-signoff">
        <BrandMark size={22} decorative />
        <span>Good luck, doctor.</span>
      </p>
    </Modal>
  )
}
