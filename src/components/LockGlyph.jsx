import React from 'react'

// A small lock drawn in the Plexus node language: a node for the body and an
// arc shackle whose ends are two tiny nodes. `open` lifts the shackle off one
// node (used for the brief unlock moment on Home). Colour is currentColor.
export default function LockGlyph({ size = 14, open = false, className = '' }) {
  return (
    <svg
      className={`lock-glyph ${open ? 'is-open' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <g className="lock-shackle">
        <path d="M4.6 8.2V5.9a3.4 3.4 0 0 1 6.8 0v2.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <rect x="2.6" y="7.6" width="10.8" height="7" rx="2.2" fill="currentColor" />
      <circle className="lock-node" cx="8" cy="11.1" r="1.35" />
    </svg>
  )
}
