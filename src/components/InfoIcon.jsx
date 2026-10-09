import React from 'react'

// The one Plexus info mark, used wherever a small "i" opens an explanation
// (the Daily countdown, puzzle tools, 3 Minutes scoring). A thin ring with
// the "i" drawn as a node above a short stroke, so it matches the app's line
// weight and node language instead of a typed italic letter. It inherits
// the text colour and sits on the text's centre line.
export default function InfoIcon({ size = 16, className = '' }) {
  return (
    <svg className={`plexus-info-icon ${className}`} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.9" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="5.05" r="1.05" fill="currentColor" />
      <path d="M8 7.4v4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
