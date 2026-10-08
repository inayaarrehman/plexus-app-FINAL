import React, { useEffect, useId, useRef } from 'react'

// Shared dialog. Keyboard and focus: focus moves into the dialog when it
// opens (to the close button), Tab and Shift+Tab stay inside it, Escape or
// the close button closes it, and focus goes back to whatever opened it.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ title, onClose, children, footer, className = '' }) {
  const titleId = useId()
  const box = useRef(null)
  const closeBtn = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement
    closeBtn.current?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !box.current) return
      const items = [...box.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || !box.current.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !box.current.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={box} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Close" ref={closeBtn}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
