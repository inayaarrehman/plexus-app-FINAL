import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Splash, { shouldShowSplash } from './components/Splash.jsx'
import './styles.css'

// Decided once at load (not inside a component) so StrictMode's double
// render can't consume the once-per-launch flag before the splash shows.
const SHOW_SPLASH = shouldShowSplash()
if (!SHOW_SPLASH) document.getElementById('boot-splash')?.remove()

// App renders underneath from the start, so when the splash fades Home is
// already there with no loading gap.
function Root() {
  const [splash, setSplash] = useState(SHOW_SPLASH)
  return (
    <>
      <App />
      {splash && <Splash onDone={() => setSplash(false)} />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)

// Register the service worker so Plexus installs and works offline. Only in a
// real browser over https (or localhost); never in the SSR test harness. The
// SW itself is network-first for navigations, so a new deploy is always picked
// up when online — installing never traps players on a stale build.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a progressive enhancement — ignore failures */
    })
  })
}
