import React, { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { unlockRequirement } from '../utils/featureUnlocks.js'

// A restrained Thread view (Sections 5 + 6): a tiny cross-system explainer
// showing how one concept recurs across areas of medicine. Every node is a
// VERIFIED bank category (passed in via the derived thread) — the UI adds
// no medical claims of its own. Members are grouped by their primary
// system and joined by a vertical connecting path; a node is tappable only
// when it has verified explanation text behind it, and expands to show
// that verified explanation + takeaway. No graph visualization.
// Verified Connections are spoiler-safe: they open after more play
// (`verified`, utils/featureUnlocks.js), and even then only connections the
// player has already met (`encountered`) are named. The others are counted.
export default function ThreadModal({ thread, onClose, verified = { unlocked: true }, encountered = null }) {
  const [openId, setOpenId] = useState(null)
  const met = (m) => !encountered || encountered.has(String(m.id))
  const shown = thread.members.filter(met)
  const hidden = thread.members.length - shown.length

  // Group members across the systems the thread actually spans, so the view
  // reads as a cross-system explainer. Systems are filled rarest-first and
  // each verified member is placed once, under the first (rarest) spanned
  // system it touches — so distinct concepts distribute across systems
  // instead of all collapsing under the one they happen to share.
  const groups = useMemo(() => {
    const members = thread.members.filter(met)
    const touchCount = (sys) => members.filter((m) => (m.systems || []).includes(sys)).length
    const order = [...thread.systems].sort((a, b) => touchCount(a) - touchCount(b))
    const placed = new Set()
    const bySystem = new Map(order.map((s) => [s, []]))
    for (const sys of order) {
      for (const m of members) {
        if (placed.has(m.id)) continue
        if ((m.systems || []).includes(sys) || m.system === sys) {
          bySystem.get(sys).push(m)
          placed.add(m.id)
        }
      }
    }
    // Any member not matching a spanned system (shouldn't happen) falls back
    // to its own primary system so nothing is silently dropped.
    for (const m of members) {
      if (placed.has(m.id)) continue
      if (!bySystem.has(m.system)) bySystem.set(m.system, [])
      bySystem.get(m.system).push(m)
      placed.add(m.id)
    }
    return [...bySystem.entries()].filter(([, members]) => members.length > 0).map(([system, members]) => ({ system, members }))
  }, [thread, encountered])

  return (
    <Modal title={thread.label.toUpperCase()} onClose={onClose}>
      {!verified.unlocked ? (
        <div className="thread-locked" role="note">
          <span className="thread-locked-mark" aria-hidden="true">
            <span /><span /><span />
          </span>
          <p className="thread-locked-title">Verified Connections are locked</p>
          <p className="thread-locked-text">
            They show where this idea turns up in other connections, so they open once you’ve played more: {unlockRequirement('verified')}.
          </p>
          <p className="thread-locked-progress">
            <span>
              <b>
                {verified.have.dailies}/{verified.need.dailies}
              </b>{' '}
              Dailies
            </span>
            {verified.need.systems > 0 && (
              <span>
                <b>
                  {verified.have.systems}/{verified.need.systems}
                </b>{' '}
                Systems boards
              </span>
            )}
          </p>
        </div>
      ) : (
      <>
      <p className="thread-systems">{groups.map((g) => g.system).join(' · ')}</p>
      <p className="thread-lede">
        {shown.length === 1 ? 'One verified connection you’ve met' : `${shown.length} verified connections you’ve met`} on this idea.
        {hidden > 0 && ` ${hidden} more will appear here as you meet them in Dailies and Systems.`}
      </p>

      <div className="thread-body">
        {groups.map((group, gi) => (
          <div className="thread-group" key={group.system}>
            <div className="thread-system-label">{group.system}</div>
            {group.members.map((m) => {
              const canOpen = !!m.explanation
              const isOpen = openId === m.id
              return (
                <div className="thread-node-row" key={m.id}>
                  <span className="thread-node-dot" aria-hidden="true" />
                  <div className="thread-node-main">
                    <button
                      className="thread-node-title"
                      onClick={() => canOpen && setOpenId(isOpen ? null : m.id)}
                      aria-expanded={isOpen}
                      disabled={!canOpen}
                    >
                      {m.title}
                      {canOpen && <span className="thread-node-caret">{isOpen ? '−' : '+'}</span>}
                    </button>
                    {isOpen && (
                      <div className="thread-node-detail">
                        <p className="thread-node-explanation">{m.explanation}</p>
                        {m.remember && (
                          <p className="thread-node-remember">
                            <span className="remember-label">Remember this</span>
                            {m.remember}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {gi < groups.length - 1 && <div className="thread-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
      </>
      )}
    </Modal>
  )
}
