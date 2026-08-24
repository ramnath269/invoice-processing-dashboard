import { ChevronLeftIcon, CheckIcon, CloseIcon } from '../icons/icons'

const BADGE_STYLES = {
  review: { background: 'var(--orange-badge-bg)', color: 'var(--orange-badge-text)' },
  exception: { background: 'var(--red-light)', color: 'var(--red)' },
  processed: { background: 'var(--green-light)', color: 'var(--green)' },
  pending: { background: '#eef1f6', color: 'var(--text-secondary)' },
}

export default function Topbar({
  pageTitle,
  badge,
  showBack,
  onBack,
  showDetailActions,
  onRequestClarification,
  onCreateVoucher,
  voucherPending,
  voucherCreated,
  onCloseInvoice,
}) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button className="back-btn" onClick={onBack} title="Back to list">
            <ChevronLeftIcon strokeWidth="2.3" />
          </button>
        )}
        <h1>{pageTitle}</h1>
        {badge && (
          <span className="badge review" style={BADGE_STYLES[badge.status]}>
            {badge.label}
          </span>
        )}
      </div>
      {showDetailActions && (
        <div className="topbar-actions">
          <button className="btn">Save Draft</button>
          <button className="btn" onClick={onRequestClarification}>Request Clarification</button>
          <button
            className="btn primary"
            onClick={onCreateVoucher}
            disabled={voucherPending || voucherCreated}
            title={voucherCreated ? 'A voucher has already been created for this invoice' : undefined}
          >
            <CheckIcon strokeWidth="2.5" />
            {voucherPending ? 'Creating Voucher…' : voucherCreated ? 'Voucher Created' : 'Create Voucher'}
          </button>
          <button className="btn danger" onClick={onCloseInvoice}>
            <CloseIcon strokeWidth="2.5" />
            Close
          </button>
          <button className="icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
