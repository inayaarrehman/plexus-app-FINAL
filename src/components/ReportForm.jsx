import React, { useEffect, useId, useState } from 'react'
import { REPORT_REASONS, SUPPORT_TOPICS, LIMITS, submitReport, validateReport } from '../lib/reportRepo.js'

// One form for "Report this connection" (kind 'connection') and the Help &
// Support message (kind 'support'). The connection's details are attached
// automatically and shown so the player knows what is being sent.
// Success is shown only after the server confirms; on failure everything
// typed stays in place (and survives closing and reopening, per connection).

const draftKey = (kind, context) => `plexus.reportDraft.v1:${kind}:${context?.puzzleId || ''}:${context?.categoryId || ''}`
function readDraft(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}
function writeDraft(key, value) {
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value))
    else sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export default function ReportForm({ kind = 'connection', context = null, onDone, onCancel, submit = submitReport }) {
  const ids = useId()
  const key = draftKey(kind, context)
  const saved = readDraft(key)
  const options = kind === 'support' ? SUPPORT_TOPICS : REPORT_REASONS
  const [reason, setReason] = useState(saved?.reason || '')
  const [description, setDescription] = useState(saved?.description || '')
  const [email, setEmail] = useState(saved?.email || '')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status !== 'sent') writeDraft(key, reason || description || email ? { reason, description, email } : null)
  }, [key, reason, description, email, status])

  const send = async (e) => {
    e.preventDefault()
    const problem = validateReport({ kind, reason, description, email })
    if (problem) {
      setStatus('error')
      setMessage(problem)
      return
    }
    setStatus('sending')
    setMessage('')
    let res
    try {
      res = await submit({ kind, reason, description, email, context, honeypot })
    } catch {
      res = { ok: false, message: 'Your report didn’t go through. Your text is still here, so try again.' }
    }
    if (res && res.ok) {
      writeDraft(key, null)
      setStatus('sent')
    } else {
      setStatus('error')
      setMessage(res?.message || 'Your report didn’t go through. Your text is still here, so try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="report-sent" role="status">
        <p className="report-sent-title">{kind === 'support' ? 'Message sent.' : 'Report sent.'}</p>
        <p className="report-sent-text">
          {kind === 'support'
            ? 'Thanks for getting in touch.'
            : 'Thanks. We review every report and fix connections that need it.'}
          {email.trim() ? ' We’ll use your email only to reply about this.' : ''}
        </p>
        <button type="button" className="report-primary" onClick={onDone}>
          Done
        </button>
      </div>
    )
  }

  const sending = status === 'sending'
  const left = LIMITS.description - description.length
  return (
    <form className="report-form" onSubmit={send} noValidate>
      {kind === 'connection' && context && (
        <div className="report-context">
          <p className="report-context-title">{context.title}</p>
          <p className="report-context-tiles">{(context.tiles || []).join(' · ')}</p>
          <p className="report-context-note">The puzzle, connection and date are attached automatically.</p>
        </div>
      )}

      <fieldset className="report-reasons" disabled={sending}>
        <legend className="report-label">{kind === 'support' ? 'Topic' : 'What kind of problem?'}</legend>
        <div className="report-reason-list">
          {options.map((o) => (
            <label key={o.id} className={`report-reason ${reason === o.id ? 'is-selected' : ''}`}>
              <input type="radio" name={`${ids}-reason`} value={o.id} checked={reason === o.id} onChange={() => setReason(o.id)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="report-label" htmlFor={`${ids}-desc`}>
        {kind === 'support' ? 'Message' : 'What’s wrong?'}
      </label>
      <textarea
        id={`${ids}-desc`}
        className="report-text"
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, LIMITS.description))}
        rows={4}
        maxLength={LIMITS.description}
        placeholder={kind === 'support' ? 'How can we help?' : 'For example, which tile does not fit and why.'}
        disabled={sending}
        aria-describedby={`${ids}-count`}
      />
      <p className="report-count" id={`${ids}-count`}>
        {left < 200 ? `${left} characters left` : ' '}
      </p>

      <label className="report-label" htmlFor={`${ids}-email`}>
        Email <span className="report-optional">(optional, only if you’d like a reply)</span>
      </label>
      <input
        id={`${ids}-email`}
        className="report-input"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.slice(0, LIMITS.email))}
        disabled={sending}
      />

      {/* Left empty by people; filled by bots. */}
      <input className="report-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

      {status === 'error' && message && (
        <p className="report-error" role="alert">
          {message}
        </p>
      )}

      <div className="report-actions">
        {onCancel && (
          <button type="button" className="report-secondary" onClick={onCancel} disabled={sending}>
            Cancel
          </button>
        )}
        <button type="submit" className="report-primary" disabled={sending}>
          {sending ? 'Sending' : kind === 'support' ? 'Send message' : 'Send report'}
        </button>
      </div>
    </form>
  )
}
