// ---------------------------------------------------------------------
// Clear everything Plexus keeps in this browser.
// ---------------------------------------------------------------------
// Removes game progress, history, streaks, XP, settings, the device-only
// event counts and any saved sign-in session (Supabase keys start with
// "sb-"). Cloud data is not touched: deleting an account is separate.

const PREFIXES = ['medconnections.', 'plexus.', 'sb-']

export function plexusKeys(storage) {
  const keys = []
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k && PREFIXES.some((p) => k.startsWith(p))) keys.push(k)
    }
  } catch {
    /* storage unavailable */
  }
  return keys
}

export function clearDeviceData() {
  let removed = 0
  for (const store of [globalThis.localStorage, globalThis.sessionStorage]) {
    if (!store) continue
    for (const k of plexusKeys(store)) {
      try {
        store.removeItem(k)
        removed++
      } catch {
        /* ignore */
      }
    }
  }
  return removed
}
