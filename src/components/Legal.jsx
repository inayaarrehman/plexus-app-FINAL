import React, { useEffect } from 'react'
import { CONTACT_EMAIL, LEGAL_UPDATED, PRIVACY_UPDATED, DISCLAIMER_TEXT, ACCURACY_TEXT, AGE_TEXT, TERMS_VERSION, PRIVACY_VERSION, SUBMISSION_TERMS_VERSION, OPERATOR_TEXT } from '../legal/config.js'
import LegalFooter from './LegalFooter.jsx'

// ---------------------------------------------------------------------
// Terms, Privacy Policy and Disclaimer. Plain pages on the Home room,
// reachable from the Home footer, the Account screen and their own links
// (#terms, #privacy, #disclaimer). Never locked.
//
// The Privacy Policy describes what the code and database actually do
// (October 2026 audit: src, api, server, supabase/migrations 0001-0012). If
// data handling changes (a new table, field, provider or retention rule),
// update this page and its version in src/legal/config.js in the same change.
// scripts/selftest.mjs and scripts/legal-test.mjs check some statements.
// ---------------------------------------------------------------------

export const LEGAL_PAGES = ['terms', 'privacy', 'disclaimer']
const TITLES = { terms: 'Terms of Use', privacy: 'Privacy Policy', disclaimer: 'Medical Disclaimer' }
const VERSIONS = { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, disclaimer: TERMS_VERSION }

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
const Section = ({ id, title, children }) => (
  <section id={id} className="legal-section">
    <h2>{title}</h2>
    {children}
  </section>
)

function Disclaimer() {
  return (
    <>
      <p className="legal-lead">{DISCLAIMER_TEXT}</p>
      <Section id="disclaimer-education" title="For studying, not for patient care">
        <p>Plexus is a game for learning and reviewing medical concepts. It does not give medical advice, diagnose or treat anyone, or replace clinical judgment, supervision or your program's teaching. Never use a Plexus puzzle, explanation or result to decide how to care for a patient.</p>
      </Section>
      <Section id="disclaimer-simplified" title="Puzzles simplify on purpose">
        <p>Each puzzle groups concepts so they are easier to learn and remember. A connection can leave out exceptions, variations, newer guidance and the context that matters for a real person. Treat a connection as a study prompt, not as a clinical rule.</p>
      </Section>
      <Section id="disclaimer-accuracy" title="Accuracy and review">
        <p>{ACCURACY_TEXT}</p>
        <p>Puzzle content is checked before it is published, and some of that checking uses an AI review tool. Review lowers the chance of mistakes but does not remove it, and Plexus content is not independently verified by a licensed clinician. If something looks wrong, use Report this connection and we will look at it.</p>
      </Section>
      <Section id="disclaimer-competence" title="Scores are not credentials">
        <p>XP, levels, streaks, milestone badges, race results and other scores show how you have played Plexus. They do not certify knowledge or clinical competence, and they do not predict or guarantee how you will do on any exam.</p>
      </Section>
      <Section id="disclaimer-relationship" title="No medical relationship">
        <p>Using Plexus does not create a doctor and patient relationship, or any other professional relationship, with anyone. If you have a medical emergency, call your local emergency number. For a health question about yourself or someone else, ask a qualified clinician.</p>
      </Section>
      <Section id="disclaimer-affiliation" title="Not affiliated">
        <p>Plexus is independent. It is not affiliated with, sponsored by or endorsed by any exam organization (including the NBME, the FSMB, the USMLE program, the NBOME and the AAMC), any medical school, hospital or professional society, any publisher or exam prep company, or The New York Times or its Connections game. Drug names, product names and other trademarks mentioned in puzzles belong to their owners and are used only to identify the concepts being taught.</p>
      </Section>
      <Section id="disclaimer-age" title="Age">
        <p>{AGE_TEXT}</p>
      </Section>
    </>
  )
}

function Terms() {
  return (
    <>
      <p className="legal-lead">These Terms of Use are the rules for using Plexus at playplexus.com, with or without an account. By using Plexus, you agree to them. If you do not agree, please do not use Plexus.</p>

      <Section id="terms-about" title="About Plexus and these Terms">
        <p>{OPERATOR_TEXT} You can reach us at <Mail />.</p>
        <p>The <a href="#privacy">Privacy Policy</a> explains what information Plexus collects and how it is used. The <a href="#disclaimer">Medical Disclaimer</a> is part of these Terms.</p>
      </Section>

      <Section id="terms-eligibility" title="Who can use Plexus">
        <p>{AGE_TEXT} If you are under 18, or under the age of majority where you live, you may use Plexus only with permission from a parent or guardian, who agrees to these Terms for you. If we learn that a child under 13 is using Plexus, we will delete their account and information as described in the Privacy Policy.</p>
      </Section>

      <Section id="terms-education" title="Educational use only">
        <p>{DISCLAIMER_TEXT} Do not rely on Plexus for patient care, and verify anything you plan to use outside the game with authoritative clinical and educational sources.</p>
      </Section>

      <Section id="terms-accounts" title="Accounts and guest play">
        <p>You can play without an account. An account is optional and is for one person. If you create one, use an email address you control, keep your password private, and tell us if you think someone else has used your account. You are responsible for what happens under your account.</p>
        <p>If you race without an account, Plexus creates an anonymous guest race ID in your browser for that race. You can delete it from Account.</p>
        <p>You can stop using Plexus and delete your account at any time from Account.</p>
      </Section>

      <Section id="terms-fair-play" title="Fair play">
        <p>Please do not:</p>
        <ul>
          <li>cheat, including using bots or scripts, changing the app or its saved data, or manipulating XP, levels, tools, race results or rewards;</li>
          <li>take advantage of a bug instead of reporting it;</li>
          <li>harass or impersonate anyone, or use Plexus to break the law;</li>
          <li>access other people's accounts or data, or parts of Plexus you are not meant to reach;</li>
          <li>scrape, copy in bulk, or build a database or competing product from Plexus puzzles, explanations or answers;</li>
          <li>overload, attack or interfere with Plexus or the services it runs on.</li>
        </ul>
        <p>We may remove progress, rewards or race results gained this way and may suspend or close accounts that break these rules.</p>
      </Section>

      <Section id="terms-progress" title="XP, levels, tools and rewards">
        <p>XP, levels, streaks, milestone badges, puzzle tools, Race power-ups, unlocks and other rewards are features of the game. They have no cash value, cannot be bought (Plexus does not sell them), and cannot be sold, traded or transferred to anyone else. You do not own them.</p>
        <p>We may change how they are earned or how they work, rebalance them, fix mistakes in them, or reset them, for example to correct a bug, to keep play fair, or before or after a major update. We may remove any that were gained through cheating or a bug.</p>
      </Section>

      <Section id="terms-content" title="Plexus content">
        <p>Plexus, including its name, logo, design, code, puzzles and explanations, is made available by Plexus for you to play. Medical facts themselves belong to no one.</p>
        <p>You may use Plexus for your own personal, non-commercial study. Please do not copy, republish, sell or redistribute the puzzle content, or use it to build a database or a competing product, except as allowed below or by law.</p>
      </Section>

      <Section id="terms-sharing" title="Sharing your results">
        <p>You are welcome to share your own results using the sharing features in Plexus, such as the results grid and race invitations, and screenshots of your own results.</p>
      </Section>

      <Section id="terms-submissions" title="Suggested connections, reports and messages">
        <p>When you use Submit a Connection, Report this connection or the support form, these terms apply to what you send (your "submission"):</p>
        <ul>
          <li><b>Only send what you may share.</b> Send only material you wrote or have permission to share. A short citation of a source is fine.</li>
          <li><b>Never include patient information or confidential records.</b> Do not include anything that could identify a patient, confidential records, or other people's personal information.</li>
          <li><b>No copied exam or course material.</b> Do not copy questions or text from exams, question banks, textbooks, courses or other paid or proprietary materials.</li>
          <li><b>You keep ownership.</b> You keep any rights you have in your submission.</li>
          <li><b>Your permission to us.</b> You give Plexus a nonexclusive, worldwide, royalty-free, perpetual and irrevocable license to review, use, edit, adapt, reproduce, display and publish your submission as part of Plexus, including its puzzle library, and to let the people and service providers who help run Plexus do the same for that purpose. This license does not let us sell your submission on its own or use it to train AI models.</li>
          <li><b>Review and editing.</b> We may accept, decline, edit or combine any submission and have no duty to use it or reply. Accepted connections may be rewritten before they appear.</li>
          <li><b>No credit or payment.</b> Plexus does not pay for submissions or name contributors, and submissions do not earn XP or rewards.</li>
          <li><b>After you delete your account.</b> A suggestion we have already accepted can stay in Plexus, no longer linked to you. Suggestions not yet accepted are deleted. The Privacy Policy explains what happens to reports and messages.</li>
        </ul>
        <p className="legal-version">Submission terms version {SUBMISSION_TERMS_VERSION}.</p>
      </Section>

      <Section id="terms-changes-service" title="Changes to Plexus and ending access">
        <p>Plexus is a new and changing service. We may add, change or remove modes, puzzles, features and rewards, and we may stop offering Plexus. We may suspend or end your access, or remove your content, if you break these Terms, if needed to protect Plexus or other players, or if the law requires it. You can stop using Plexus at any time.</p>
      </Section>

      <Section id="terms-warranty" title="No warranty">
        <p>Plexus is provided free, as it is and as available. To the extent the law allows, we make no promises that Plexus will always be available, free of errors, secure, or suited to a particular purpose, or that its content is complete, accurate or current.</p>
      </Section>

      <Section id="terms-liability" title="Limits on our liability">
        <p>To the extent the law allows, Plexus and the people who run it are not liable for indirect, incidental, special, consequential or punitive damages, or for lost data, lost progress or decisions made using Plexus content. Some places do not allow some of these limits, so they may not apply to you. Nothing in these Terms limits any right you have, or any liability we have, that the law does not allow to be limited.</p>
      </Section>

      <Section id="terms-updates" title="Changes to these Terms">
        <p>We may update these Terms. The version and date below change with each update. For a significant change, we will show a notice in Plexus before or when it takes effect, and signed-in players will be asked to accept the new Terms. If you keep using Plexus after an update takes effect, the updated Terms apply. If you do not agree, stop using Plexus and delete your account.</p>
      </Section>

      <Section id="terms-contact" title="Questions and problems">
        <p>If you have a question or a problem with Plexus, email <Mail /> first and we will try to sort it out.</p>
      </Section>
    </>
  )
}

function Privacy() {
  return (
    <>
      <p className="legal-lead">This policy explains what Plexus collects, why, who else handles it, how long it is kept, and how to get a copy of it or have it deleted.</p>
      <ul className="legal-summary">
        <li>You can play without an account. Most of your game then stays in your browser.</li>
        <li>Some features send information to our servers even without an account: live races, reports, support messages and suggested connections.</li>
        <li>Plexus has no ads and no tracking cookies. It counts visits with Cloudflare Web Analytics, which uses no cookies and does not follow you across sites. We do not sell personal information.</li>
      </ul>

      <Section id="privacy-who" title="Who we are">
        <p>{OPERATOR_TEXT} Questions about this policy or your information: <Mail />.</p>
      </Section>

      <Section id="privacy-device" title="What stays in your browser">
        <p>Plexus saves your game in your browser's storage: puzzle progress, Daily history (the dates you played, your mistakes and finish times, and your time zone offset when you finished), streaks, stats, XP, levels, tools, badges and settings. It also keeps simple counts of what you have done in the app, which are never sent anywhere, and caches the app's files so it loads quickly.</p>
        <p>Depending on what you use, it may also keep a random ID for this browser (if you send a report or suggestion), an unsent suggestion draft, your sign-in session (if you have an account) and a guest race ID (if you raced as a guest).</p>
        <p>Without an account, your game progress stays in this browser and is not sent to us. To remove it, use Account, then Clear data on this device, or clear this site's data in your browser settings. Clearing your browser does not delete anything stored on our servers; see Your choices below.</p>
      </Section>

      <Section id="privacy-server" title="What is sent to our servers">
        <h3>If you create an account (optional)</h3>
        <ul>
          <li><b>Email address and password.</b> Sign-in runs on Supabase, our database and sign-in provider, which stores your password in hashed form. We cannot see your password.</li>
          <li><b>A profile record</b> linked to your account. Plexus does not ask for your name.</li>
          <li><b>A cloud copy of your progress</b>, so it follows you between devices: the same game information listed above for your browser.</li>
          <li><b>Race items and reward progress</b>, kept by the race server (see Live races).</li>
          <li><b>Which version of the Terms of Use and Privacy Policy you agreed to and acknowledged, and when.</b></li>
          <li><b>Account records kept by Supabase</b>, such as when the account was created and last signed in, and security logs that can include your IP address and browser details. Supabase also sends account emails, such as sign-up confirmation and password resets.</li>
        </ul>

        <h3>Live races</h3>
        <p>Signed-in races are run and saved by the Plexus race server so that results and rewards can be checked. It stores the race code, each player's account ID, every answer you give and whether it was right, your score and time, whether you stayed connected, your Chaos choice and the power-ups you equipped, armed or used, the rewards you earned, your level when you joined, and the time zone your device reports (used to decide which day a race counts toward).</p>
        <p>The other player sees your running score and finish, your level and milestone badge, your Chaos choices and power-up effects, and your account ID in the race data their browser receives. They never see your email address.</p>
        <p>If you race without an account, Plexus asks Supabase for an anonymous guest race ID when you choose Race as a guest. It has no email or name and is kept in this browser. Guest races are saved the same way, except that no time zone, level, rewards or items are kept. Supabase keeps its usual records for the guest ID, which can include your IP address.</p>
        <p>If the race server cannot be reached, a race can run over a temporary Supabase Realtime channel instead. The other player then receives a random temporary ID, the name "Player" and your running score. Plexus does not save these races.</p>

        <h3>Reports and support messages</h3>
        <p>When you report a connection or send a message from Help &amp; Support, we store what you chose and wrote, the email address if you add one, and, for reports, the puzzle and connection it is about (puzzle ID, connection ID, title and tiles, game mode and puzzle date). We also store the app version and the random browser ID, which is used only to limit spam. If you are signed in, it is linked to your account.</p>

        <h3>Suggested connections</h3>
        <p>When you use Submit a Connection, we store the title, the four concepts, your explanation, the organ system you chose, any source you add, the version of the submission terms you confirmed, the app version and the random browser ID. If you are signed in, the suggestion is linked to your account. Suggestions are not shown to other players unless a reviewed version is added to the puzzle library.</p>

        <h3>Visit counts</h3>
        <p>Plexus uses Cloudflare Web Analytics to count visits and to find pages that load slowly. When you open playplexus.com, a small Cloudflare script sends Cloudflare the page address, the site that linked you there (if any), your browser and device type, and page load timings. Cloudflare also receives your IP address, which it uses to estimate your country. Cloudflare states that this service does not use cookies or your browser's storage and does not use your IP address to identify or follow you. We see only totals, such as the number of visits per page and per country, never a record of one person.</p>

        <h3>What you type</h3>
        <p>Reports, messages and suggestions are stored as you write them. Please do not include patient information, confidential records or other people's personal information. We use your reply email only to answer you about that message or report.</p>
      </Section>

      <Section id="privacy-not" title="What we do not ask for">
        <p>Plexus does not ask for your name, birth date, phone number, school, address, precise location or health information, and it does not use your device's location services. Our providers do receive your IP address, which can show a general area, and Plexus uses the time zone your device reports to reset the Daily at your midnight and to date races. Anything you choose to type into a free-text field is stored as written.</p>
      </Section>

      <Section id="privacy-use" title="How we use information">
        <ul>
          <li>to run the game, save your progress and sync it between your devices;</li>
          <li>to run live races, decide results and rewards, and keep them fair;</li>
          <li>to keep accounts working and secure, and to prevent spam and abuse;</li>
          <li>to read and answer reports and messages, review suggestions and fix problems;</li>
          <li>to count visits and find pages that load slowly (as totals only);</li>
          <li>to meet legal obligations.</li>
        </ul>
        <p>We do not sell or rent personal information, use it for advertising, build profiles of you, or use it to train AI models. If we use an outside tool, including an AI tool, to help check the medical accuracy of a suggested connection, we send only the connection itself (its title, concepts, explanation and source), never your email or account details.</p>
      </Section>

      <Section id="privacy-sharing" title="Who else handles it">
        <ul>
          <li><b>Supabase</b>: database, sign-in, account emails, race server data and live race connections.</li>
          <li><b>Vercel</b>: hosts the site and runs the race and email functions. Like most hosts, it processes standard request information such as your IP address and browser type to deliver and protect the site.</li>
          <li><b>Cloudflare</b>: Cloudflare Web Analytics counts visits and page load times (see Visit counts).</li>
          <li><b>Resend</b>: sends us an email copy of each new report, support message and suggestion, including any reply email you add.</li>
          <li><b>Our email provider</b>: receives those copies and any email you send to <Mail />.</li>
        </ul>
        <p>These providers handle information to provide their services to us. The people who run Plexus can see reports, messages, suggestions and stored account and race records when needed to run and support Plexus. We may also disclose information if the law requires it, to protect the safety, rights or security of players or Plexus, or as part of a transfer of Plexus to someone who will run it under this policy, with notice to you. Our providers may store and process information in the United States and other countries.</p>
      </Section>

      <Section id="privacy-retention" title="How long it is kept">
        <ul>
          <li><b>In your browser:</b> until you clear it.</li>
          <li><b>Account, profile, cloud progress, race items, reward progress and acceptance records:</b> until you delete your account.</li>
          <li><b>Race results</b> (scores, times, outcomes, rewards): with each player's account, and deleted with it. Your account ID is removed from the other player's records when you delete your account.</li>
          <li><b>Race answers and in-race events:</b> cleared 30 days after the race ends.</li>
          <li><b>Guest race IDs:</b> deleted, with their races, after 30 days without a race, or sooner if you delete it from Account.</li>
          <li><b>Race lobbies that never started:</b> deleted after 7 days.</li>
          <li><b>Support messages:</b> deleted after 24 months, or when you delete your account.</li>
          <li><b>Connection reports:</b> kept to keep puzzles accurate. Any reply email is removed after 12 months, or when you delete your account.</li>
          <li><b>Suggested connections:</b> rejected or duplicate suggestions are deleted after 12 months, and suggestions not yet accepted are deleted when you delete your account. Accepted suggestions become part of the puzzle library.</li>
          <li><b>The random browser ID</b> on reports and suggestions: removed after 7 days.</li>
          <li><b>Provider records</b> (Supabase sign-in and security logs, Vercel request logs, Cloudflare visit counts, Resend and our inbox): kept for the periods those services use.</li>
          <li><b>Backups:</b> our database provider may keep backups for a limited time, so deleted information can remain in a backup until it expires.</li>
        </ul>
      </Section>

      <Section id="privacy-choices" title="Your choices">
        <ul>
          <li><b>Delete your account:</b> Account, then Delete account. This deletes your sign-in, profile, cloud progress, acceptance records, race items, reward progress, your own race records and your support messages. It removes your email, browser ID and account link from your connection reports, deletes suggestions not yet accepted, and removes your account ID from other players' race records.</li>
          <li><b>Delete a guest race ID:</b> Account, then Delete guest race data, in the browser you raced on. Clearing this device also does this first.</li>
          <li><b>Clear this device:</b> Account, then Clear data on this device. This removes Plexus data from this browser only.</li>
          <li><b>Ask us:</b> email <Mail /> to ask for a copy of your information, to correct it, or to delete something, such as a message you sent without an account. For an account, write from the email on the account so we know it is you. For guest activity we may not be able to tell which records are yours, and we will never share another player's information to answer a request. We aim to reply within 30 days.</li>
        </ul>
        <p>Depending on where you live, local law may give you other rights over your information. Email us and we will respond as the law where you live requires.</p>
      </Section>

      <Section id="privacy-dnt" title="Do Not Track and Global Privacy Control">
        <p>Plexus does not track you across other websites, does not let other companies collect information about your activity across sites through Plexus, and does not sell or share personal information for targeted advertising. Because of that, a Do Not Track or Global Privacy Control signal from your browser does not change anything: Plexus already works the way those signals ask for, for everyone.</p>
      </Section>

      <Section id="privacy-children" title="Children">
        <p>{AGE_TEXT} Plexus is not directed to children under 13, and we do not knowingly collect personal information from them. If we learn that we have, we will delete it, including any account, cloud progress, messages, reports and suggestions linked to it. If you think a child under 13 has used Plexus, email <Mail />, and include the account email or the date of a message if you know it.</p>
      </Section>

      <Section id="privacy-security" title="Security">
        <p>Connections to Plexus are encrypted. The database lets each account read and change only its own progress, and nobody can read reports, messages or suggestions through the app. Server keys are kept off your browser. No way of storing or sending information is completely secure, so we cannot guarantee it.</p>
      </Section>

      <Section id="privacy-changes" title="Changes to this policy">
        <p>When this policy changes, the version and date below change. For a significant change, such as collecting something new or using information in a new way, we will show a notice in Plexus before or when it takes effect, and signed-in players will be asked to acknowledge it. Earlier versions are available on request.</p>
      </Section>
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
        <p className="legal-updated">
          Version {VERSIONS[page]} · Effective and last updated {page === 'privacy' ? PRIVACY_UPDATED : LEGAL_UPDATED}
        </p>
      </article>
      <LegalFooter onNavigate={onNavigate} current={page} />
    </div>
  )
}
