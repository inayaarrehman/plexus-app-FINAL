import React from 'react'
import { COPYRIGHT } from '../legal/config.js'

// Quiet footer: Terms · Privacy · Disclaimer and the copyright line.
export default function LegalFooter({ onNavigate, current = null, className = '' }) {
  const link = (page, label) => (
    <a
      href={`#${page}`}
      className={`legal-link ${current === page ? 'is-current' : ''}`}
      aria-current={current === page ? 'page' : undefined}
      onClick={(e) => {
        if (!onNavigate) return
        e.preventDefault()
        onNavigate(page)
      }}
    >
      {label}
    </a>
  )
  return (
    <footer className={`legal-footer ${className}`}>
      <nav className="legal-links" aria-label="Legal">
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
