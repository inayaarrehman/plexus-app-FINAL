import React from 'react'
import { COPYRIGHT } from '../legal/config.js'

// Quiet footer: Help & Support · Terms · Privacy · Disclaimer and the copyright line.
// `newTab` opens the pages in a new tab (used inside forms and dialogs, so
// nothing typed there is lost).
export default function LegalFooter({ onNavigate, current = null, className = '', newTab = false }) {
  const link = (page, label) => (
    <a
      href={newTab ? `/#${page}` : `#${page}`}
      {...(newTab ? { target: '_blank', rel: 'noopener' } : {})}
      className={`legal-link ${current === page ? 'is-current' : ''}`}
      aria-current={current === page ? 'page' : undefined}
      onClick={(e) => {
        if (!onNavigate || newTab) return
        e.preventDefault()
        onNavigate(page)
      }}
    >
      {label}
    </a>
  )
  return (
    <footer className={`legal-footer ${className}`}>
      <nav className="legal-links" aria-label="Help and legal">
        {link('support', 'Help & Support')}
        <span aria-hidden="true">·</span>
        {link('terms', 'Terms')}
        <span aria-hidden="true">·</span>
        {link('privacy', 'Privacy')}
        <span aria-hidden="true">·</span>
        {link('disclaimer', 'Disclaimer')}
      </nav>
      <p className="legal-copyright">{COPYRIGHT}</p>
    </footer>
  )
}
