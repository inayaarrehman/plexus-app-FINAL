// Layout regression checks for the shared layouts that used to collide:
// card action rows (Save / Report), title rows with a difficulty badge and
// "Why?", the Systems detail progress line and Next Puzzle, the Submit a
// Connection row, headers, the primary nav, the Archive month selector and
// info buttons. Runs in a real browser at 320, 375, 390, 430, 768 and 1280px,
// at normal and 150% text, and also checks that Follow the Thread is gone.
//
// Needs Playwright and a running dev server:
//   npm run dev            (or any server for the app)
//   BASE_URL=http://localhost:5173 node scripts/layout-regression.mjs
// PLAYWRIGHT_PATH can point at a folder whose node_modules has playwright.
import { createRequire } from 'node:module'
import { checkLayout } from './layoutCheck.mjs'

const BASE = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
let chromium
try {
  const req = createRequire(process.env.PLAYWRIGHT_PATH ? process.env.PLAYWRIGHT_PATH.replace(/\/?$/, '/') : import.meta.url)
  ;({ chromium } = req('playwright'))
} catch {
  console.log('Playwright is not installed. Install it (npm i -D playwright) or set PLAYWRIGHT_PATH, then run again.')
  process.exit(2)
}
const root = new URL('..', import.meta.url)
const { getDailyPuzzleForDate } = await import(new URL('src/utils/dailyPuzzle.js', root).href)
const NL = await import(new URL('src/utils/newLibrary.js', root).href)

const WIDTHS = [320, 375, 390, 430, 768, 1280]
let fails = 0
let passes = 0
const ok = (c, m) => {
  if (c) passes++
  else {
    fails++
    console.log(`FAIL - ${m}`)
  }
}
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())
const dayOff = (n) => {
  const [y, m, d] = today.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
const entry = (k) => ({ date: k, puzzleId: `daily-${k}`, completed: true, won: true, mistakes: 1, completedDay: k })
const history = (withToday) => {
  const h = {}
  for (let i = 1; i <= 12; i++) h[dayOff(-i)] = entry(dayOff(-i))
  if (withToday) h[today] = entry(today)
  return h
}
const SUBJECT = NL.LIBRARY_SUBJECTS.includes('Cardiology') ? 'Cardiology' : NL.LIBRARY_SUBJECTS[0]
const sysBoards = NL.systemsBoardsFor(SUBJECT, today)
const boards = Object.fromEntries(sysBoards.slice(0, 2).map((b) => [b.id, { finishedAt: new Date().toISOString(), won: true }]))
const daily = getDailyPuzzleForDate(today)
const LONG = 'Pharmacokinetics of renally cleared antimicrobials in older adults with chronic kidney disease'

const browser = await chromium.launch()
async function open({ done = true, big = false, width = 390 } = {}) {
  const ctx = await browser.newContext({ timezoneId: 'America/Los_Angeles', viewport: { width, height: 800 } })
  await ctx.addInitScript(
    ([h, b, big]) => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1')
        sessionStorage.setItem('plexus.splashShown.v1', '1')
        localStorage.setItem('medconnections.dailyHistory.v1', JSON.stringify(h))
        localStorage.setItem('medconnections.systemsBoards.v1', JSON.stringify(b))
      }
      if (big) document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style')
        s.textContent = 'html{font-size:150% !important}'
        document.head.appendChild(s)
      })
    },
    [history(done), boards, big]
  )
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE + '/')
  await page.waitForSelector('.app-nav')
  return { ctx, page, errors }
}
const rect = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } })
const rects = (page, sel) => page.$$eval(sel, (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }))
const apart = (a, b) => Math.max(a.l - b.r, b.l - a.r, a.t - b.b, b.t - a.b)
// Generic checks (overlap, text under controls, spills, clipping, sideways
// scroll, 44px targets) on whatever is on screen, at every width.
async function sweep(page, label) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 800 })
    await page.waitForTimeout(150)
    const issues = (await checkLayout(page, { tight: true })).filter((i) => !(i.kind === 'target' && /archive-cell/.test(i.els[0])))
    ok(issues.length === 0, `${label} @${w}: ${issues.map((i) => `${i.kind} ${i.msg} :: ${i.els.join(' <> ')}`).join(' | ')}`)
  }
}
async function solve(page, puzzle) {
  for (const c of puzzle.categories) {
    if (await page.$('button:has-text("Deselect"):not([disabled])')) await page.click('button:has-text("Deselect")')
    for (const it of c.items) await page.click(`.tile-grid .tile[data-term="${it.term.replace(/"/g, '\\"')}"]`)
    await page.click('button:has-text("Submit")')
    await page.waitForTimeout(850)
  }
  await page.waitForSelector('.result-card', { timeout: 10000 })
}

for (const big of [false, true]) {
  const tag = big ? '150% text' : 'normal text'

  // 1. Connection explanation card: Save and Report, plus long titles next
  //    to the difficulty badge and Why?, and no Follow the Thread.
  {
    const { page, ctx, errors } = await open({ done: false, big })
    await page.click('.play-today-btn')
    await page.waitForSelector('.tile-grid .tile')
    await solve(page, daily)
    await page.click('.result-review-toggle')
    for (const h of await page.$$('.accordion-header')) await h.click()
    ok(!/follow the thread/i.test(await page.textContent('body')) && !(await page.$('.follow-thread-btn, .verified-locked')), `${tag}: no Follow the Thread anywhere on results`)
    await page.evaluate((L) => { const t = document.querySelector('.accordion-title'); if (t) t.textContent = L; const s = document.querySelector('.strand-title'); if (s) s.textContent = L }, LONG)
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 800 })
      await page.waitForTimeout(120)
      const s = await rect(page, '.accordion-body .save-connection-btn')
      const r = await rect(page, '.accordion-body .report-link')
      ok(apart(s, r) >= 8, `${tag} @${w}: Save and Report are at least 8px apart (${apart(s, r).toFixed(1)})`)
      if (w <= 359) ok(r.t >= s.b, `${tag} @${w}: Save and Report stack on a narrow screen`)
      const head = await page.$eval('.accordion-header', (h) => [...h.children].map((c) => { const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom } }))
      const hb = await rect(page, '.accordion-header')
      let clash = false
      for (let i = 0; i < head.length; i++) for (let j = i + 1; j < head.length; j++) if (apart(head[i], head[j]) < 0) clash = true
      ok(!clash && head.every((c) => c.l >= hb.l - 1 && c.r <= hb.r + 1 && c.b <= hb.b + 1), `${tag} @${w}: long title, difficulty badge and Why? each keep their own space`)
      const sh = await page.$eval('.strand-head', (h) => [...h.children].map((c) => { const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom } })).catch(() => [])
      ok(sh.length < 2 || apart(sh[0], sh[1]) >= 0, `${tag} @${w}: results title and difficulty do not overlap`)
    }
    await sweep(page, `${tag} results with review open`)
    ok(errors.length === 0, `${tag}: no page errors on results ${errors.join(' | ')}`)
    await ctx.close()
  }

  // 2 + 3. Systems detail: progress line and Next Puzzle; Submit a Connection row.
  {
    const { page, ctx, errors } = await open({ big })
    await page.click('.app-nav >> text=Systems')
    await page.click(`:is(.map-cell, .more-system, .map-label)[aria-label^="${SUBJECT}"]`)
    await page.waitForSelector('.system-play-btn')
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 800 })
      await page.waitForTimeout(120)
      const prog = await rect(page, '.system-panel .board-path')
      const play = await rect(page, '.system-play-btn')
      ok(play.t - prog.b >= 16, `${tag} @${w}: at least 16px between the board progress line and ${await page.textContent('.system-play-btn')} (${(play.t - prog.b).toFixed(1)})`)
      const line = await rect(page, '.systems-suggest-line')
      const btn = await rect(page, '.systems-suggest-btn')
      ok(apart(line, btn) >= 6 && btn.r <= w && btn.l >= 0, `${tag} @${w}: "Found a connection we missed?" and Submit a Connection keep apart and on screen`)
      if (w < 480) ok(btn.t >= line.b, `${tag} @${w}: they stack on a small screen`)
    }
    await sweep(page, `${tag} Systems detail`)
    await page.click('.systems-suggest-btn')
    await page.waitForSelector('.modal')
    await sweep(page, `${tag} Submit a Connection form`)
    ok(errors.length === 0, `${tag}: no page errors on Systems ${errors.join(' | ')}`)
    await ctx.close()
  }

  // Home (nav, Connection of the day actions, info button), Archive header.
  {
    const { page, ctx, errors } = await open({ big })
    await page.click('.home-cotd-toggle')
    const info = await rect(page, '.home-reset-info')
    ok(info.w >= 44 && info.h >= 44, `${tag}: info button is a real 44px target (${info.w}x${info.h})`)
    await sweep(page, `${tag} Home`)
    await page.click('.app-nav >> text=Archive')
    await page.waitForSelector('.archive-grid')
    await sweep(page, `${tag} Archive`)
    ok(errors.length === 0, `${tag}: no page errors on Home/Archive ${errors.join(' | ')}`)
    await ctx.close()
  }
}
await browser.close()
console.log(fails ? `${fails} FAILED (${passes} passed)` : `LAYOUT REGRESSION CHECKS PASSED (${passes} passed)`)
process.exit(fails ? 1 : 0)
