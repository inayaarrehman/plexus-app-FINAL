import React from 'react'

// A link to Terms, Privacy or the Disclaimer that opens in a new tab, so a
// form someone is filling in (sign-up, a report, a suggestion) is never lost.
// The pages are also reachable in the same tab from the footer.
export default function PolicyLink({ page, children, className = '' }) {
  return (
    <a href={`/#${page}`} target="_blank" rel="noopener" className={`policy-link ${className}`}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
