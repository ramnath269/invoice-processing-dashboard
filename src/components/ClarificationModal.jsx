import { CloseIcon, SendIcon } from '../icons/icons'

export default function ClarificationModal({ open, invoiceNum, email, message, emailInvalid, onEmailChange, onMessageChange, onClose, onSend }) {
  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3>Request Clarification</h3>
          <button className="icon-btn close-x" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-context">
            Send a question about invoice <strong>{invoiceNum}</strong> to the vendor. They'll receive it by email.
          </p>
          <div className={`modal-field${emailInvalid ? ' invalid' : ''}`}>
            <label>Send to (email) <span className="req">*</span></label>
            <input
              type="email"
              placeholder="vendor@abcsupplies.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
            <div className="error">Enter a valid email address.</div>
          </div>
          <div className="modal-field">
            <label>Message</label>
            <textarea value={message} onChange={(e) => onMessageChange(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn send" onClick={onSend}>
            <SendIcon />
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}
