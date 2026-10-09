import React, { useEffect, useId, useState } from 'react'
import Modal from './Modal.jsx'
import { SUBMISSION_LIMITS, SUBMISSION_SYSTEMS, submitConnection, validateSubmission, submissionsAvailable } from '../lib/submissionRepo.js'

// "Submit a Connection": a player suggests a category of four concepts. It
// goes to a review queue (migration 0008), never straight into the library.
// What the player typed survives closing the dialog until it is sent.
const DRAFT_KEY = 'plexus.connectionDraft.v1'
const EMPTY = { title: '', tiles: ['', '', '', ''], explanation: '', system: '', source: '' }
function readDraft() {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')
    return d && Array.isArray(d.tiles) && d.tiles.length === 4 ? { ...EMPTY, ...d } : null
  } catch {
    return null
  }
}
function writeDraft(v) {
  try {
    if (v) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(v))
    else sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

export default function SubmitConnectionModal({ defaultSystem = '', onClose, submit = submitConnection }) {
  const ids = useId()
  const [form, setForm] = useState(() => readDraft() || { ...EMPTY, system: defaultSystem || '' })
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState(null) // { field, message }

  const dirty = form.title || form.explanation || form.source || form.tiles.some(Boolean)
  useEffect(() => {
    if (status !== 'sent') writeDraft(dirty ? form : null)
  }, [form, dirty, status])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setTile = (i) => (e) => setForm((f) => ({ ...f, tiles: f.tiles.map((t, j) => (j === i ? e.target.value.slice(0, SUBMISSION_LIMITS.tile) : t)) }))

  const send = async (e) => {
    e.preventDefault()
    const problem = validateSubmission(form)
    if (problem) {
      setStatus('error')
      setError(problem)
      document.getElementById(`${ids}-${problem.field === 'tiles' ? 'tile-0' : problem.field}`)?.focus()
      return
    }
    setStatus('sending')
    setError(null)
    let res
    try {
      res = await submit({ ...form, honeypot })
    } catch {
      res = { ok: false, message: 'Your suggestion didn’t go through. Everything you typed is still here, so try again.' }
    }
    if (res && res.ok) {
      writeDraft(null)
      setStatus('sent')
    } else {
      setStatus('error')
      setError({ field: res?.field || null, message: res?.message || 'Your suggestion didn’t go through. Try again.' })
    }
  }

  const sending = status === 'sending'
  const err = (field) => (status === 'error' && error?.field === field ? error.message : null)
  return (
    <Modal title="Submit a Connection" onClose={onClose} className="report-modal submit-connection-modal">
      {status === 'sent' ? (
        <div className="report-sent" role="status">
          <p className="report-sent-title">Thanks. Your connection is in the review queue.</p>
          <p className="report-sent-text">Every suggestion is checked for medical accuracy and for a single clear answer before anything is added to Plexus.</p>
          <button type="button" className="report-primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className="report-form" onSubmit={send} noValidate>
          <p className="submit-connection-lede">
            <b>Found a connection we missed?</b> Help expand the Plexus library. Suggestions are reviewed before anything is published, and they don’t earn XP.
          </p>
          {!submissionsAvailable() && <p className="report-error">Suggestions can’t be sent from this version of the app right now.</p>}

          <label className="report-label" htmlFor={`${ids}-title`}>
            Connection title
          </label>
          <input id={`${ids}-title`} className="report-input" value={form.title} onChange={set('title')} maxLength={SUBMISSION_LIMITS.title} placeholder="For example, Causes of a widened pulse pressure" disabled={sending} aria-invalid={!!err('title')} aria-describedby={err('title') ? `${ids}-err` : undefined} />

          <fieldset className="submit-connection-tiles" disabled={sending} aria-invalid={!!err('tiles')}>
            <legend className="report-label">Four concepts</legend>
            <div className="submit-connection-tile-grid">
              {form.tiles.map((t, i) => (
                <input key={i} id={`${ids}-tile-${i}`} className="report-input" value={t} onChange={setTile(i)} maxLength={SUBMISSION_LIMITS.tile} aria-label={`Concept ${i + 1}`} placeholder={`Concept ${i + 1}`} />
              ))}
            </div>
          </fieldset>

          <label className="report-label" htmlFor={`${ids}-explanation`}>
            Why do these four belong together?
          </label>
          <textarea id={`${ids}-explanation`} className="report-text" rows={4} value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value.slice(0, SUBMISSION_LIMITS.explanation) }))} maxLength={SUBMISSION_LIMITS.explanation} placeholder="The link that ties them, in a sentence or two." disabled={sending} />

          <label className="report-label" htmlFor={`${ids}-system`}>
            Organ system
          </label>
          <select id={`${ids}-system`} className="report-input submit-connection-select" value={form.system} onChange={set('system')} disabled={sending}>
            <option value="">Choose a system</option>
            {SUBMISSION_SYSTEMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="report-label" htmlFor={`${ids}-source`}>
            Source or reference <span className="report-optional">(optional)</span>
          </label>
          <input id={`${ids}-source`} className="report-input" value={form.source} onChange={set('source')} maxLength={SUBMISSION_LIMITS.source} placeholder="A textbook, guideline or link" disabled={sending} />

          {/* Left empty by people; filled by bots. */}
          <input className="report-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

          {status === 'error' && error?.message && (
            <p className="report-error" role="alert" id={`${ids}-err`}>
              {error.message}
            </p>
          )}
          <div className="report-actions">
            <button type="button" className="report-secondary" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button type="submit" className="report-primary" disabled={sending}>
              {sending ? 'Sending…' : 'Submit for review'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
