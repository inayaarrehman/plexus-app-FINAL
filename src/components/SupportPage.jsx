import React, { useState } from 'react'
import ReportForm from './ReportForm.jsx'
import HowToModal from './HowToModal.jsx'
import LegalFooter from './LegalFooter.jsx'
import { SUPPORT_EMAIL, CONTACT_EMAIL } from '../legal/config.js'

// Help & Support: how to play, how to report a connection, and a message form
// (saved to Supabase like reports). Shows a support email only when one is
// configured (src/legal/config.js or VITE_SUPPORT_EMAIL).
export default function SupportPage({ onBack, onNavigate }) {
  const [howTo, setHowTo] = useState(false)
  const [formKey, setFormKey] = useState(0)
  return (
    <div className="legal support-page">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>Help &amp; Support</span>
        </div>
        <div />
      </div>
      <article className="legal-body">
        <h1 className="legal-title">Help &amp; Support</h1>

        <h2>How to play</h2>
        <p>
          Find four groups of four medical concepts.{' '}
          <button type="button" className="support-inline-link" onClick={() => setHowTo(true)}>
            Read how to play
          </button>
        </p>

        <h2>Something wrong with a connection?</h2>
        <p>After you solve a group, open Explanation and choose Report this connection. You can also report from Show connections on the results screen and from Connection of the day. The puzzle and connection are attached for you.</p>

        <h2>Contact us</h2>
        {SUPPORT_EMAIL ? (
          <p>
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or send a message here.
          </p>
        ) : (
          <p>Send us a message here. Add your email if you’d like a reply.</p>
        )}
        <p className="report-privacy-note">Please don’t include patient details or other people’s personal information.</p>
        <div className="support-form">
          <ReportForm key={formKey} kind="support" onDone={() => setFormKey((k) => k + 1)} />
        </div>

        <h2>Your data</h2>
        <p>
          You can delete your account, a guest race ID or this device’s data from Account. To ask for a copy of your information, a correction, or deletion of something you sent, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. The{' '}
          <a href="#privacy" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('privacy') } }}>Privacy Policy</a> explains what is kept and for how long.
        </p>
      </article>
      <LegalFooter onNavigate={onNavigate} current="support" />
      {howTo && <HowToModal onClose={() => setHowTo(false)} />}
    </div>
  )
}
