import React, { useEffect } from 'react'
import { CONTACT_EMAIL, LEGAL_UPDATED, DISCLAIMER_TEXT, ACCURACY_TEXT, AGE_TEXT } from '../legal/config.js'
import LegalFooter from './LegalFooter.jsx'

// ---------------------------------------------------------------------
// Terms, Privacy and Disclaimer. Plain pages on the Home room, reachable from
// the Home footer, the Account screen and their own links (#terms, #privacy,
// #disclaimer). Never locked.
//
// The Privacy page describes what the code actually does. If data handling
// changes (a new table, a tracker, a new provider), update this page in the
// same change. scripts/selftest.mjs checks a few of these statements.
// ---------------------------------------------------------------------

export const LEGAL_PAGES = ['terms', 'privacy', 'disclaimer']
const TITLES = { terms: 'Terms', privacy: 'Privacy', disclaimer: 'Disclaimer' }

function Contact({ children }) {
  if (!CONTACT_EMAIL) return null
  return (
    <p>
      {children} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>
  )
}

function Disclaimer() {
  return (
    <>
      <p className="legal-lead">{DISCLAIMER_TEXT}</p>
      <h2>Accuracy</h2>
      <p>{ACCURACY_TEXT}</p>
      <p>Puzzles simplify on purpose. A connection that is true for a board exam can leave out exceptions that matter for a real patient.</p>
      <h2>No medical relationship</h2>
      <p>Using Plexus does not create a doctor and patient relationship, or any other professional relationship. If you have a medical emergency, call your local emergency number.</p>
      <h2>Age</h2>
      <p>{AGE_TEXT}</p>
    </>
  )
}

function Terms() {
  return (
    <>
      <p className="legal-lead">These terms apply when you use Plexus. By playing or creating an account, you agree to them.</p>
      <h2>Who can use Plexus</h2>
      <p>{AGE_TEXT} If you are under the age of majority where you live, use Plexus with permission from a parent or guardian.</p>
      <h2>Educational use only</h2>
      <p>{DISCLAIMER_TEXT}</p>
      <p>{ACCURACY_TEXT}</p>
      <h2>Your account</h2>
      <p>An account is optional. If you create one, use an email address you control and keep your password to yourself. You are responsible for what happens under your account. You can delete it at any time from the Account screen.</p>
      <h2>Fair use</h2>
      <p>Do not try to break, overload or get around how Plexus works, access other people's accounts or data, or use automated tools to scrape the puzzles. We may suspend or remove accounts that do.</p>
      <h2>Content</h2>
      <p>The puzzles, text and design of Plexus belong to Plexus. You are welcome to play, study with it and share your results. Please do not copy or republish the puzzle content.</p>
      <h2>No warranty</h2>
      <p>Plexus is provided as it is, without promises that it will always be available, error free or suited to a particular purpose. To the extent the law allows, Plexus is not liable for losses that come from using the app or relying on its content.</p>
      <h2>Changes</h2>
      <p>We may update Plexus and these terms. When the terms change, the date below changes too. Continuing to use Plexus after an update means you accept the new terms.</p>
      <Contact>Questions about these terms:</Contact>
    </>
  )
}

function Privacy() {
  return (
    <>
      <p className="legal-lead">You can play Plexus without an account. Without one, your progress stays in this browser and Plexus does not receive it.</p>

      <h2>On your device</h2>
      <p>Plexus saves your game in your browser's local storage: puzzle progress, Daily history, streaks and stats, XP, level and Your Tools, and a few settings. If you send a report, it also keeps a random ID for this browser (used only to limit spam) and, until you close the tab, any report you have not sent yet. If you sign in, your browser also keeps a sign-in session.</p>

      <h2>If you create an account</h2>
      <ul>
        <li><b>Email address and password.</b> Sign-in is handled by Supabase, our database and sign-in provider. Supabase stores your password in hashed form; Plexus never sees it.</li>
        <li><b>A profile record</b> linked to your account. Plexus does not ask for your name.</li>
        <li><b>A cloud copy of your progress</b> so it follows you between devices: streaks and stats, Daily history (including dates, mistakes, finish times and the time zone offset at each finish), 3-Minute bests, Systems boards finished, and your XP history and Your Tools.</li>
        <li><b>Account records kept by Supabase</b>, such as when the account was created and last signed in, and security logs that can include your IP address. Supabase may also send account emails, such as confirming your sign-up.</li>
      </ul>

      <h2>Live races</h2>
      <p>A live race connects two players through Supabase Realtime. During the race, the other player receives a random temporary player ID, the name "Player" and your running score.</p>
      <p>If you are signed in, the race is run by the Plexus server and saved so results and Race rewards can be checked: the race code, both players' account IDs, each answer you give and whether it was right, your score and time, connection status during the race, whether you turned on Chaos and which power-ups you equipped, armed or used, and the time zone your device reports (used to decide which day a race counts toward). Your Race power-up inventory and reward progress are stored with your account. The other player sees your Chaos choices, loadout and power-up effects during the race.</p>

      <h2>Reports and support messages</h2>
      <p>When you report a connection or send a message from Help &amp; Support, Plexus stores what you chose and wrote, the email address if you add one, and for reports the puzzle and connection it is about (puzzle ID, connection ID, title and tiles, game mode and puzzle date). It also stores the app version and the random browser ID above. If you are signed in, the report is linked to your account. Reports are stored in Supabase, and only Plexus can read them. We use your email only to reply about that report. If you delete your account, your reports stay but are no longer linked to it.</p>

      <h2>Hosting</h2>
      <p>Plexus is hosted by Vercel. Like most web hosts, Vercel processes standard request information, such as your IP address and browser type, to deliver and protect the site.</p>

      <h2>What Plexus does not collect</h2>
      <p>No analytics or advertising trackers, no tracking cookies, no location, and no health, school or demographic information. Plexus does not sell your data.</p>

      <h2>How it is used</h2>
      <p>Only to run the game, save and sync your progress, and keep accounts working and secure. It is shared only with the providers named above, as needed to run Plexus, or if the law requires it.</p>

      <h2>Keeping and deleting your data</h2>
      <p>Account data is kept until you delete your account. To delete it, open Account and choose Delete account. This removes your account, profile and cloud progress. Data in your browser stays until you clear it; Account has a button for that too, or you can clear your browser's site data.</p>
      <Contact>To ask about your data or request deletion, email</Contact>

      <h2>Children</h2>
      <p>{AGE_TEXT} We do not knowingly collect information from children under 13. If you believe a child under 13 has created an account, delete it from the Account screen{CONTACT_EMAIL ? ' or contact us' : ''}.</p>

      <h2>Security</h2>
      <p>Connections to Plexus are encrypted, and the database only lets each account read and change its own progress. No method of storing or sending data is completely secure, so we cannot guarantee it.</p>

      <h2>Changes</h2>
      <p>If what Plexus collects changes, this page will be updated and the date below will change.</p>
    </>
  )
}

export default function Legal({ page, onBack, onNavigate }) {
  useEffect(() => {
    try {
      window.scrollTo(0, 0)
    } catch {
      /* ignore */
    }
  }, [page])
  const Body = page === 'terms' ? Terms : page === 'privacy' ? Privacy : Disclaimer
  return (
    <div className="legal">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>{TITLES[page]}</span>
        </div>
        <div />
      </div>
      <article className="legal-body">
        <h1 className="legal-title">{TITLES[page]}</h1>
        <Body />
        <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>
      </article>
      <LegalFooter onNavigate={onNavigate} current={page} />
    </div>
  )
}
