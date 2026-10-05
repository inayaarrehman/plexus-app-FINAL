import React from 'react'
import Modal from './Modal.jsx'
import DifficultyIcon from './DifficultyIcon.jsx'

export default function HowToModal({ onClose }) {
  return (
    <Modal onClose={onClose} title="How to play">
      <ul className="howto-list">
        <li>Find groups of <strong>4 clinical concepts</strong> that share a hidden connection.</li>
        <li>Tap up to 4 tiles, then hit <strong>Submit</strong> to lock in a guess.</li>
        <li>Each puzzle has 4 categories, from <span className="howto-diff"><DifficultyIcon level={1} size={15} decorative /> easier</span> to <span className="howto-diff"><DifficultyIcon level={4} size={15} decorative /> trickier</span>.</li>
        <li>Watch for red herrings. An item may look like it fits more than one group.</li>
        <li>You get <strong>4 mistakes</strong> before the puzzle ends. Good luck, doctor.</li>
      </ul>
    </Modal>
  )
}
