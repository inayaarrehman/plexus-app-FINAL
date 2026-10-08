import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// The app version attached to reports: package.json version, plus the commit
// on Vercel (VERCEL_GIT_COMMIT_SHA is set there automatically).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
const APP_VERSION = commit ? `${pkg.version}+${commit}` : pkg.version

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
})
