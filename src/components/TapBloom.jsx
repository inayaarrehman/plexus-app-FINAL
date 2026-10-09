import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { makeBurst, makeBloom, frame, tapKind, LOGO, MAX_BURSTS, MIN_GAP_MS, TAP_SLOP_PX, TAP_MAX_MS } from '../utils/tapBloom.js'

// Homepage only: a tap or click on empty space sends out a few small nodes
// that join into a little network, carry a pulse and fade (about 1.2s). A
// tap on the Plexus logo blooms a slightly larger ring round the wordmark.
//
// One canvas, fixed to the viewport, pointer-events: none and aria-hidden,
// so it never takes a click, never changes layout and never adds width.
// Pointer events only (no click/touchend pairs), so a tap fires once on
// touch and mouse alike. A tap is a primary pointer that went down and up
// within 10px and 600ms with no scroll in between; scrolling cancels it.
// Controls, navigation, dialogs and notices never bloom (utils/tapBloom.js).
// Off entirely under prefers-reduced-motion. Colours are read from the
// active theme's tokens when a burst starts. Everything (listeners, the
// animation frame, the canvas) goes when Home unmounts.
const COLOR_TOKENS = [
  'var(--node-plum)',
  'color-mix(in srgb, var(--node-plum) 55%, var(--text))', // lavender
  'var(--node-cobalt)',
  'var(--node-peacock)',
]
function resolveColors(host) {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
  host.appendChild(probe)
  const read = (v) => {
    probe.style.color = ''
    probe.style.color = v
    return getComputedStyle(probe).color
  }
  const out = {
    nodes: COLOR_TOKENS.map(read),
    rim: read('var(--node-rim)'),
    link: read('color-mix(in srgb, var(--text) 42%, transparent)'),
    pulse: read('color-mix(in srgb, var(--node-plum) 30%, var(--text))'),
    glitter: read('color-mix(in srgb, var(--node-plum) 40%, var(--text))'),
  }
  probe.remove()
  return out
}

export default function TapBloom() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof window === 'undefined') return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const host = canvas.parentElement || document.body
    const motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    let reduced = Boolean(motion?.matches)
    const bursts = []
    let raf = 0
    let lastAt = 0
    let down = null
    let colors = null

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = window.innerWidth
      const h = window.innerHeight
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (now) => {
      raf = 0
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const sx = window.scrollX
      const sy = window.scrollY
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        const t = (now - b.start) / b.duration
        if (t >= 1) {
          bursts.splice(i, 1)
          continue
        }
        const f = frame(b, Math.max(0, t))
        const ox = b.x - sx
        const oy = b.y - sy
        const at = (n) => [ox + f.nodes[n].x, oy + f.nodes[n].y]
        const c = b.colors
        // Links first, behind the nodes: thin, round-capped, growing outward.
        ctx.lineCap = 'round'
        ctx.lineWidth = b.kind === 'logo' ? 1.5 : 1.3
        for (const l of f.links) {
          if (l.drawn <= 0) continue
          const [x1, y1] = at(l.a)
          const [x2, y2] = at(l.b)
          ctx.globalAlpha = l.alpha
          ctx.strokeStyle = c.link
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x1 + (x2 - x1) * l.drawn, y1 + (y2 - y1) * l.drawn)
          ctx.stroke()
        }
        // Nodes: filled jewel circles with the Plexus rim.
        f.nodes.forEach((n, k) => {
          if (n.alpha <= 0.01) return
          const [x, y] = at(k)
          ctx.globalAlpha = n.alpha
          ctx.fillStyle = c.nodes[n.color % c.nodes.length]
          ctx.beginPath()
          ctx.arc(x, y, n.size, 0, Math.PI * 2)
          ctx.fill()
          if (c.rim && !/rgba\(0, 0, 0, 0\)|transparent/.test(c.rim)) {
            ctx.strokeStyle = c.rim
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
        // The pulse: a small light bead running along each link in turn.
        for (const l of f.links) {
          if (l.pulse == null) continue
          const [x1, y1] = at(l.a)
          const [x2, y2] = at(l.b)
          const k = l.pulse
          ctx.globalAlpha = l.alpha * Math.sin(k * Math.PI) * 0.95
          ctx.fillStyle = c.pulse
          ctx.beginPath()
          ctx.arc(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, b.kind === 'logo' ? 2 : 1.7, 0, Math.PI * 2)
          ctx.fill()
        }
        // Glitter: a few tiny dots that flicker on and off.
        for (const g of f.glitter) {
          if (g.alpha <= 0.02) continue
          ctx.globalAlpha = g.alpha
          ctx.fillStyle = c.glitter
          ctx.beginPath()
          ctx.arc(ox + g.x, oy + g.y, g.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      if (bursts.length) raf = requestAnimationFrame(draw)
    }

    const add = (b) => {
      const now = performance.now()
      if (now - lastAt < MIN_GAP_MS) return
      lastAt = now
      if (!colors) colors = resolveColors(host)
      b.colors = colors
      b.start = now
      bursts.push(b)
      while (bursts.length > MAX_BURSTS) bursts.shift()
      // Counters for automated checks; not shown anywhere.
      canvas.dataset.bursts = String(Number(canvas.dataset.bursts || 0) + 1)
      canvas.dataset.last = b.kind
      size()
      if (!raf) raf = requestAnimationFrame(draw)
    }

    const onDown = (e) => {
      if (reduced || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) {
        down = null
        return
      }
      down = { x: e.clientX, y: e.clientY, at: performance.now(), sx: window.scrollX, sy: window.scrollY, kind: tapKind(e.target), target: e.target }
    }
    const onUp = (e) => {
      const d = down
      down = null
      if (!d || !e.isPrimary || !d.kind) return
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_SLOP_PX) return // a drag
      if (performance.now() - d.at > TAP_MAX_MS) return // a long press
      if (Math.abs(window.scrollX - d.sx) > 2 || Math.abs(window.scrollY - d.sy) > 2) return // scrolled
      const sel = window.getSelection?.()
      if (sel && !sel.isCollapsed && String(sel).trim()) return // selecting text
      if (d.kind === 'logo') {
        const logo = d.target.closest(LOGO)
        const r = logo.getBoundingClientRect()
        add(makeBloom({ x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }, { seed: performance.now() * 1000 }))
      } else {
        add(makeBurst(e.clientX + window.scrollX, e.clientY + window.scrollY, { seed: performance.now() * 1000 }))
      }
    }
    const cancel = () => {
      down = null
    }
    const onMotion = () => {
      reduced = Boolean(motion?.matches)
      if (reduced) {
        bursts.length = 0
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    const onResize = () => {
      if (bursts.length) size()
    }
    // Theme or room colours may change while Home is open; read them afresh
    // on the next burst.
    const recolor = new MutationObserver(() => {
      colors = null
    })
    recolor.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })

    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointercancel', cancel, { passive: true })
    window.addEventListener('scroll', cancel, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    motion?.addEventListener?.('change', onMotion)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', cancel)
      window.removeEventListener('scroll', cancel)
      window.removeEventListener('resize', onResize)
      motion?.removeEventListener?.('change', onMotion)
      recolor.disconnect()
      if (raf) cancelAnimationFrame(raf)
      bursts.length = 0
    }
  }, [])
  // On <body>, so no transformed ancestor can turn `fixed` into `absolute`.
  if (typeof document === 'undefined') return null
  return createPortal(<canvas ref={canvasRef} className="tap-bloom" aria-hidden="true" />, document.body)
}
