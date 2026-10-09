import React, { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { unlockRequirement } from '../utils/featureUnlocks.js'

// Verified Connections: where one idea turns up in other VERIFIED bank
// connections, grouped by organ system. Every entry comes from the verified
// bank (passed in as a derived concept group, utils/threads.js); the UI adds
// no medical claims of its own. An entry opens to its verified explanation
// and takeaway when it has one.
// Spoiler-safe: it opens after more play (`verified`, utils/featureUnlocks.js),
// and even then only connections the player has already met (`encountered`)
// are named; the others are counted.
// Kept in the codebase without an entry point (owner's decision when Follow
// the Thread was removed). Nothing in the app renders it today.
export default function VerifiedConnectionsModal({ concept, onClose, verified = { unlocked: true }, encountered = null }) {
  const [openId, setOpenId] = useState(null)
  const met = (m) => !encountered || encountered.has(String(m.id))
  const shown = concept.members.filter(met)
  const hidden = concept.members.length - shown.length

  // Group members across the systems the idea spans, so the view
  // reads as a cross-system explainer. Systems are filled rarest-first and
  // each verified member is placed once, under the first (rarest) spanned
  // system it touches — so distinct concepts distribute across systems
  // instead of all collapsing under the one they happen to share.
  const groups = useMemo(() => {
    const members = concept.members.filter(met)
    const touchCount = (sys) => members.filter((m) => (m.systems || []).includes(sys)).length
    const order = [...concept.systems].sort((a, b) => touchCount(a) - touchCount(b))
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
  }, [concept, encountered])

  return (
    <Modal title="Verified Connections" onClose={onClose}>
      {!verified.unlocked ? (
        <div className="verified-locked" role="note">
          <span className="verified-locked-mark" aria-hidden="true">
            <span /><span /><span />
          </span>
          <p className="verified-locked-title">Verified Connections are locked</p>
          <p className="verified-locked-text">
            They show where this idea turns up in other connections, so they open once you’ve played more: {unlockRequirement('verified')}.
          </p>
          <p className="verified-locked-progress">
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
      <p className="verified-systems">{groups.map((g) => g.system).join(' · ')}</p>
      <p className="verified-lede">
        {shown.length === 1 ? 'One verified connection you’ve met' : `${shown.length} verified connections you’ve met`} on this idea.
        {hidden > 0 && ` ${hidden} more will appear here as you meet them in Dailies and Systems.`}
      </p>

      <div className="verified-body">
        {groups.map((group, gi) => (
          <div className="verified-group" key={group.system}>
            <div className="verified-system-label">{group.system}</div>
            {group.members.map((m) => {
              const canOpen = !!m.explanation
              const isOpen = openId === m.id
              return (
                <div className="verified-node-row" key={m.id}>
                  <span className="verified-node-dot" aria-hidden="true" />
                  <div className="verified-node-main">
                    <button
                      className="verified-node-title"
                      onClick={() => canOpen && setOpenId(isOpen ? null : m.id)}
                      aria-expanded={isOpen}
                      disabled={!canOpen}
                    >
                      {m.title}
                      {canOpen && <span className="verified-node-caret">{isOpen ? '−' : '+'}</span>}
                    </button>
                    {isOpen && (
                      <div className="verified-node-detail">
                        <p className="verified-node-explanation">{m.explanation}</p>
                        {m.remember && (
                          <p className="verified-node-remember">
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
            {gi < groups.length - 1 && <div className="verified-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
      </>
      )}
    </Modal>
  )
}
