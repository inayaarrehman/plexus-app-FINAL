import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
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
