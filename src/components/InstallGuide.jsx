import React, { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { canPromptInstall, installPlatform, iosBrowser, isStandalone, promptInstall, subscribeInstall, wasInstalledNow } from '../lib/install.js'

// Add Plexus to your Home Screen: the browser's own install prompt when it
// offers one, and short manual steps for every platform otherwise.
// Installing is optional and changes nothing about play or progress.

const PLATFORMS = [
  { id: 'ios', label: 'iPhone, iPad' },
  { id: 'android', label: 'Android' },
  { id: 'desktop', label: 'Computer' },
]

function desktopBrowser() {
  if (typeof navigator === 'undefined') return 'chrome'
  const ua = navigator.userAgent || ''
  if (/edg\//i.test(ua)) return 'edge'
  if (/firefox/i.test(ua)) return 'firefox'
  if (/safari/i.test(ua) && !/chrome|chromium/i.test(ua)) return 'safari'
  return 'chrome'
}

function Steps({ platform }) {
  if (platform === 'ios') {
    const other = iosBrowser() !== 'safari'
    return (
      <>
        <ol className="install-steps">
          <li>Open playplexus.com in Safari.</li>
          <li>
            Tap <b>Share</b>, the square with an arrow. If you don’t see it, tap <b>⋯</b> first.
          </li>
          <li>
            Tap <b>Add to Home Screen</b>. You may need to scroll or tap <b>View More</b>.
          </li>
          <li>
            Tap <b>Add</b>.
          </li>
        </ol>
        {other && <p className="install-note">In Chrome or another browser on iOS 16.4 or later, the same option is in that browser’s Share menu.</p>}
        <p className="install-note">On iPhone and iPad, the Home Screen app keeps its own data. Sign in there to bring your progress with you.</p>
      </>
    )
  }
  if (platform === 'android') {
    return (
      <ol className="install-steps">
        <li>Open playplexus.com in Chrome.</li>
        <li>
          Tap the menu, <b>⋮</b>, at the top right.
        </li>
        <li>
          Tap <b>Add to Home screen</b> or <b>Install app</b>.
        </li>
        <li>
          Tap <b>Install</b> to confirm.
        </li>
      </ol>
    )
  }
  const b = desktopBrowser()
  return (
    <>
      <ol className="install-steps">
        <li>
          In <b>Chrome</b> or <b>Edge</b>, click the install icon at the right end of the address bar.
        </li>
        <li>
          No icon? Open the browser menu and choose <b>Cast, save, and share</b>, then <b>Install page as app</b> in Chrome, or <b>Apps</b>, then{' '}
          <b>Install this site as an app</b> in Edge.
        </li>
        <li>
          In <b>Safari</b> on a Mac, choose <b>File</b>, then <b>Add to Dock</b>.
        </li>
      </ol>
      {b === 'firefox' && <p className="install-note">Firefox on a computer can’t install web apps. Use Chrome, Edge or Safari, or bookmark playplexus.com.</p>}
    </>
  )
}

export default function InstallGuide({ onClose }) {
  const [, force] = useState(0)
  const [platform, setPlatform] = useState(() => installPlatform())
  const [result, setResult] = useState(null)
  useEffect(() => subscribeInstall(() => force((n) => n + 1)), [])

  const standalone = isStandalone()
  const installed = wasInstalledNow() || result === 'accepted'
  const native = canPromptInstall()

  const install = async () => setResult(await promptInstall())

  return (
    <Modal onClose={onClose} title="Add Plexus to your Home Screen" className="install-guide">
      {standalone ? (
        <p className="install-status" role="status">
          You’re already playing from your Home Screen. Nothing else to do.
        </p>
      ) : installed ? (
        <p className="install-status" role="status">
          Plexus is installed. Open it from your Home Screen or app list.
        </p>
      ) : (
        <>
          <p className="install-lede">Open Plexus in one tap, like an app. It’s optional, and the game is the same either way.</p>
          {native && (
            <div className="install-native">
              <button type="button" className="auth-btn auth-btn-primary install-native-btn" onClick={install}>
                Install Plexus
              </button>
              <p className="install-note">Your browser will ask you to confirm.</p>
            </div>
          )}
          {result === 'dismissed' && <p className="install-note">No problem. You can install it any time from here.</p>}
          <div className="install-tabs" role="tablist" aria-label="Your device">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={`install-tab-${p.id}`}
                aria-selected={platform === p.id}
                aria-controls="install-panel"
                className={`install-tab ${platform === p.id ? 'is-active' : ''}`}
                onClick={() => setPlatform(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="install-panel" id="install-panel" role="tabpanel" aria-labelledby={`install-tab-${platform}`}>
            {native && <p className="install-note install-or">Or do it yourself:</p>}
            <Steps platform={platform} />
          </div>
        </>
      )}
    </Modal>
  )
}
