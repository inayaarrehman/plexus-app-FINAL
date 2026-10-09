// In-page layout checker used by scripts/layout-regression.mjs (and the full audit).
// checkLayout(page) returns a list of issues:
//   hscroll   the page scrolls sideways
//   overlap   two separate interactive elements intersect
//   text      an interactive element covers text that is not its own
//   graphic   an interactive element covers an svg/graphic that is not its own
//   spill     a control's own label runs outside the control
//   clipped   a control is cut off by an ancestor that hides overflow, or by the viewport
//   target    a control is smaller than 44 x 44 CSS px
//   tight     two separate controls sit less than 4px apart
//   fixed     a fixed/sticky bar covers content when scrolled to the bottom
export async function checkLayout(page, { targets = true, tight = true } = {}) {
  return page.evaluate(({ targets, tight }) => {
    const out = []
    const W = window.innerWidth
    const SEL = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role="button"], [role="tab"], [role="switch"]'
    const desc = (el) => {
      if (!el || el.nodeType !== 1) return String(el)
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.') : ''
      const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)
      return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${t ? ` "${t}"` : ''}`
    }
    const shown = (el) => {
      if (el.closest('[aria-hidden="true"]') && !el.matches(SEL)) return false
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
        const cs = getComputedStyle(e)
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false
      }
      const r = el.getBoundingClientRect()
      return r.width > 0.5 && r.height > 0.5
    }
    const inter = (a, b) => {
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      return w > 1 && h > 1 ? w * h : 0
    }
    // Elements whose sideways overflow is meant to scroll.
    const inScroller = (el) => {
      for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
        const ox = getComputedStyle(e).overflowX
        if ((ox === 'auto' || ox === 'scroll') && e.scrollWidth > e.clientWidth + 1) return e
      }
      return null
    }
    // Ignore things under an open modal (they are behind its scrim).
    const modal = [...document.querySelectorAll('.modal, [role="dialog"], [role="alertdialog"]')].filter(shown).pop()
    const layer = modal ? modal.closest('.modal-backdrop, .modal-overlay') || modal : null
    const inLayer = (el) => !layer || layer.contains(el)

    // 1. Sideways page scroll, with the culprits.
    const sw = document.documentElement.scrollWidth
    if (sw > W + 1) {
      const wide = [...document.body.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0 && !inScroller(e) && shown(e) })
      const leaf = wide.filter((e) => !wide.some((o) => o !== e && e.contains(o))).slice(0, 4)
      out.push({ kind: 'hscroll', msg: `page is ${sw}px wide at ${W}px`, els: leaf.map(desc) })
    }

    const els = [...document.querySelectorAll(SEL)].filter((e) => shown(e) && inLayer(e))
    const rects = new Map(els.map((e) => [e, e.getBoundingClientRect()]))
    // Controls nested in another control (a summary inside details is fine).
    const top = els.filter((e) => !els.some((o) => o !== e && o.contains(e) && o.matches('button, a[href], [role="button"]')))

    // 2. Overlapping controls.
    for (let i = 0; i < top.length; i++)
      for (let j = i + 1; j < top.length; j++) {
        const a = top[i], b = top[j]
        if (a.contains(b) || b.contains(a)) continue
        if (a.tagName === 'INPUT' && b.tagName === 'LABEL') continue
        const ar = rects.get(a), br = rects.get(b)
        if (inter(ar, br) > 2) out.push({ kind: 'overlap', msg: 'controls overlap', els: [desc(a), desc(b)] })
        else if (tight) {
          const gx = Math.max(ar.left - br.right, br.left - ar.right)
          const gy = Math.max(ar.top - br.bottom, br.top - ar.bottom)
          const sideBySide = gy < 0 && gx >= 0 && gx < 4
          const stacked = gx < 0 && gy >= 0 && gy < 4
          if ((sideBySide || stacked) && !a.closest('[role="tablist"], .seg, .record-tabs') && !a.matches('.tile, .archive-cell')) out.push({ kind: 'tight', msg: `controls ${Math.round(Math.max(gx, gy))}px apart`, els: [desc(a), desc(b)] })
        }
      }

    // 3. Text and graphics under a control that are not its own.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) })
    const texts = []
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentElement
      if (!p || !shown(p) || !inLayer(p) || p.closest('svg, script, style, noscript')) continue
      const rg = document.createRange()
      rg.selectNodeContents(n)
      for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) texts.push({ n, p, r })
    }
    for (const c of top) {
      const cr = rects.get(c)
      for (const t of texts) {
        if (c.contains(t.p)) continue
        if (t.p.closest('label') && t.p.closest('label').contains(c)) continue
        if (inter(cr, t.r) > 6) { out.push({ kind: 'text', msg: 'control covers text', els: [desc(c), `"${t.n.nodeValue.trim().slice(0, 40)}" in ${desc(t.p)}`] }); break }
      }
      for (const g of document.querySelectorAll('svg, canvas, img')) {
        if (c.contains(g) || g.contains(c) || !shown(g) || !inLayer(g)) continue
        if (g.closest(SEL)) continue
        const gr = g.getBoundingClientRect()
        if (gr.width < 4 || gr.height < 4) continue
        // A graphic that fills the page background is not a collision.
        if (gr.width >= W * 0.95 && gr.height > 300) continue
        if (getComputedStyle(g).position === 'absolute' && g.closest('.modal')) continue
        if (inter(cr, gr) > 12) { out.push({ kind: 'graphic', msg: 'control covers a graphic', els: [desc(c), desc(g.closest('[class]') || g)] }); break }
      }
    }

    // 4. Labels spilling out of their control, and clipped controls.
    for (const c of top) {
      const cr = rects.get(c)
      if (c.matches('input, select, textarea')) continue
      const rg = document.createRange()
      rg.selectNodeContents(c)
      for (const r of rg.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue
        if (r.left < cr.left - 1.5 || r.right > cr.right + 1.5 || r.top < cr.top - 2 || r.bottom > cr.bottom + 2) { out.push({ kind: 'spill', msg: 'label runs outside its control', els: [desc(c)] }); break }
      }
      if (!inScroller(c) && (cr.left < -1 || cr.right > W + 1)) out.push({ kind: 'clipped', msg: `control outside the viewport (${Math.round(cr.left)}..${Math.round(cr.right)} of ${W})`, els: [desc(c)] })
      for (let e = c.parentElement; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e)
        if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) {
          const er = e.getBoundingClientRect()
          const xs = /(hidden|clip)/.test(cs.overflowX), ys = /(hidden|clip)/.test(cs.overflowY)
          if ((xs && (cr.left < er.left - 1 || cr.right > er.right + 1)) || (ys && (cr.top < er.top - 1 || cr.bottom > er.bottom + 1))) { out.push({ kind: 'clipped', msg: 'control cut off by an ancestor that hides overflow', els: [desc(c), desc(e)] }); break }
        }
        if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX)) break
      }
    }

    // 5. Touch targets. Links inside running text are exempt (WCAG 2.5.8).
    if (targets)
      for (const c of top) {
        const cr = rects.get(c)
        if (cr.width >= 43.5 && cr.height >= 43.5) continue
        if (c.matches('a') && c.closest('p, li') && (c.closest('p, li').textContent.trim().length > c.textContent.trim().length + 20)) continue
        if (c.matches('input[type=checkbox], input[type=radio]') && c.closest('label') && c.closest('label').getBoundingClientRect().height >= 43.5) continue
        out.push({ kind: 'target', msg: `${Math.round(cr.width)}x${Math.round(cr.height)}`, els: [desc(c)] })
      }
    return out
  }, { targets, tight })
}

// Fixed and sticky bars covering content: scroll to the bottom and look for
// controls or text under a fixed element that is not inside it.
export async function checkFixed(page) {
  return page.evaluate(async () => {
    const out = []
    const fixed = [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return (cs.position === 'fixed' || cs.position === 'sticky') && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05 && e.getBoundingClientRect().height > 8 && !e.closest('[aria-hidden="true"]') && !e.matches('.modal-backdrop, .modal-overlay, .confetti, .toast') })
    if (!fixed.length) return out
    const scroller = document.scrollingElement
    for (const pos of ['bottom']) {
      scroller.scrollTop = pos === 'bottom' ? scroller.scrollHeight : 0
      await new Promise((r) => setTimeout(r, 120))
      const items = [...document.querySelectorAll('button, a[href], input, p, h1, h2, h3, li')].filter((e) => e.getBoundingClientRect().height > 0)
      for (const f of fixed) {
        const fr = f.getBoundingClientRect()
        if (fr.bottom < 0 || fr.top > innerHeight) continue
        for (const it of items) {
          if (f.contains(it) || it.contains(f) || fixed.some((o) => o.contains(it))) continue
          const r = it.getBoundingClientRect()
          const w = Math.min(r.right, fr.right) - Math.max(r.left, fr.left)
          const h = Math.min(r.bottom, fr.bottom) - Math.max(r.top, fr.top)
          if (w > 2 && h > 2) {
            out.push({ kind: 'fixed', msg: `${getComputedStyle(f).position} element covers content at ${pos}`, els: [`${f.tagName.toLowerCase()}.${String(f.className).split(' ')[0]}`, `${it.tagName.toLowerCase()}.${String(it.className).split(' ')[0]} "${it.textContent.trim().slice(0, 30)}"`] })
            break
          }
        }
      }
    }
    scroller.scrollTop = 0
    return out
  })
}
