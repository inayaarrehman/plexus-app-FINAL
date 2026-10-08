import { useEffect, useRef, useState } from 'react'
import { levelInfo } from '../progression/engine.js'

// ---------------------------------------------------------------------
// XP arriving in My Plexus.
// ---------------------------------------------------------------------
// Plays the XP earned since the last visit into the network:
//   1. the XP total counts up while the link to the next level extends, with
//      a small coloured pulse at its head;
//   2. if a level is reached, the link finishes, the next node lights up,
//      the level number changes and the reward just earned shows on that node;
//   3. the window moves forward to the new level and the rest of the XP fills.
// It only reads numbers: nothing is awarded or saved here except the
// "last seen" XP marker below, which is display state on this device.
// requestAnimationFrame and timers only, so it behaves the same on desktop
// and mobile; with reduced motion it jumps straight to the end.

export const SEEN_KEY = 'plexus.myplexus.seenXp.v1'

export function readSeenXp() {
  try {
    const v = localStorage.getItem(SEEN_KEY)
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}
export function writeSeenXp(xp) {
  try {
    localStorage.setItem(SEEN_KEY, String(xp))
  } catch {
    // ignore
  }
}

function reducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Display state at an XP value, optionally pinned to a level so the fill can
// reach the very end of a level before the level changes.
function at(xp, level) {
  const i = levelInfo(xp)
  if (level && level < i.level) {
    // Pinned to the earlier level: show it full.
    const p = levelInfo(xp - 1)
    return { xp, level, intoLevel: p.cost, cost: p.cost, toNext: 0 }
  }
  return { xp, level: i.level, intoLevel: i.intoLevel, cost: i.cost, toNext: i.toNext }
}

// Steps from `from` to `to`: fills within a level, then a level-up, and so on.
export function growthSteps(from, to) {
  const steps = []
  let x = from
  let guard = 0
  while (levelInfo(x).level < levelInfo(to).level && guard++ < 200) {
    const i = levelInfo(x)
    steps.push({ kind: 'fill', a: x, b: i.levelEnd, level: i.level })
    steps.push({ kind: 'up', level: i.level + 1, xp: i.levelEnd })
    x = i.levelEnd
  }
  if (to > x) steps.push({ kind: 'fill', a: x, b: to, level: levelInfo(x).level })
  return steps
}

const ease = (t) => 1 - Math.pow(1 - t, 3)

export function useGrowthAnimation({ from, to, runKey, rewardsFor }) {
  const [st, setSt] = useState(() => ({ ...at(from ?? to), moving: false, activating: false, earned: null }))
  const live = useRef(true)

  useEffect(() => {
    live.current = true
    const timers = []
    let raf = 0
    const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms)))
    const frame = () => new Promise((res) => (raf = requestAnimationFrame(res)))

    const start = from == null || from > to ? to : from
    if (start >= to) {
      setSt({ ...at(to), moving: false, activating: false, earned: null })
      return undefined
    }
    if (reducedMotion()) {
      const gained = levelInfo(to).level - levelInfo(start).level
      const L = levelInfo(to).level
      setSt({ ...at(to), moving: false, activating: false, earned: gained > 0 ? { level: L, items: rewardsFor(L) } : null })
      if (gained > 0) timers.push(setTimeout(() => live.current && setSt((s) => ({ ...s, earned: null })), 3500))
      return () => timers.forEach(clearTimeout)
    }

    setSt({ ...at(start), moving: false, activating: false, earned: null })
    ;(async () => {
      await wait(420) // let the page settle first
      for (const step of growthSteps(start, to)) {
        if (!live.current) return
        if (step.kind === 'fill') {
          const cost = levelInfo(step.a).cost || 1
          const dur = Math.max(450, Math.min(1200, (1300 * (step.b - step.a)) / cost))
          const t0 = performance.now()
          for (;;) {
            await frame()
            if (!live.current) return
            const t = Math.min(1, (performance.now() - t0) / dur)
            const v = Math.round(step.a + (step.b - step.a) * ease(t))
            setSt((s) => ({ ...s, ...at(v, step.level), moving: t < 1 }))
            if (t >= 1) break
          }
        } else {
          setSt((s) => ({ ...s, moving: false, activating: true, earned: { level: step.level, items: rewardsFor(step.level) } }))
          await wait(1300)
          if (!live.current) return
          setSt((s) => ({ ...s, ...at(step.xp), activating: false }))
          await wait(260)
        }
      }
      if (!live.current) return
      setSt((s) => ({ ...s, moving: false }))
      await wait(1400)
      if (live.current) setSt((s) => ({ ...s, earned: null }))
    })()
    return () => {
      live.current = false
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, from, to])

  return st
}
