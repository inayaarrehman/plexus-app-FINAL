/* Plexus service worker — offline shell + fresh deploys.
 * Strategy:
 *   - Navigations (HTML): network-first, fall back to cached shell when offline.
 *     This guarantees a new Vercel deploy is picked up as soon as the user is
 *     online, so the SW never traps players on a stale build.
 *   - Same-origin static assets (Vite's hashed JS/CSS, icons): stale-while-
 *     revalidate — instant from cache, refreshed in the background.
 *   - Cross-origin (e.g. Supabase API/realtime): never touched — always network.
 * Bump CACHE_VERSION to force-retire old caches on the next deploy.
 */
const CACHE_VERSION = 'plexus-v5'
const APP_SHELL = [
  '/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png',
  '/fonts/outfit-400.woff', '/fonts/outfit-700.woff',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only handle our own origin; let Supabase and any other host go straight to network.
  if (url.origin !== self.location.origin) return

  // Navigations → network-first (so new deploys win), cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE_VERSION).then((c) => c.put('/index.html', copy)).catch(() => {})
          return resp
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    )
    return
  }

  // Static assets → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {})
          }
          return resp
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
