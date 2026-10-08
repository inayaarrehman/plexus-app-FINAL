import React from 'react'
import Modal from './Modal.jsx'
import ReportForm from './ReportForm.jsx'

// "Report this connection": the shared form in a dialog.
export default function ReportModal({ context, onClose }) {
  return (
    <Modal title="Report this connection" onClose={onClose} className="report-modal">
      <ReportForm kind="connection" context={context} onDone={onClose} onCancel={onClose} />
    </Modal>
  )
}
