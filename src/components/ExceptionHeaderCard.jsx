import { CheckIcon } from '../icons/icons'

// Header fields for an exception invoice - PDF-extracted values only, no
// JDE comparison. JDE's response for a duplicate/order-not-found invoice
// isn't a real match (it's the error that caused the exception), so showing
// it alongside these fields the way HeaderCard does for a normal invoice
// would be misleading rather than useful.
//
// For a duplicate_invoice exception specifically, the Invoice Number field
// becomes editable and a Reprocess button appears - the invoice number is
// usually just a typo/OCR misread or a reused vendor number, so correcting
// it and retrying JDE's voucher-match in place is the actual fix, rather
// than a dead-end exception record.
export default function ExceptionHeaderCard({ invoice, invoiceNumber, onInvoiceNumberChange, onReprocess, reprocessPending }) {
  const pdf = invoice.raw?.pdf_fields || {}
  const canReprocess = invoice.exceptionReason === 'duplicate_invoice'
  const originalInvoiceNumber = pdf.invoice_number || invoice.invoiceNumber || ''
  // Only enabled once the field actually differs from what's stored -
  // reprocessing with the same invoice number would just reproduce the same
  // duplicate_invoice exception.
  const isInvoiceNumberEdited = invoiceNumber?.trim() && invoiceNumber.trim() !== originalInvoiceNumber

  return (
    <div className="card">
      <div className="card-head">
        <h2>Header Information</h2>
        <div className="spacer"></div>
        {canReprocess && (
          <button
            className="btn"
            onClick={onReprocess}
            disabled={reprocessPending || !isInvoiceNumberEdited}
          >
            {reprocessPending ? 'Reprocessing…' : 'Reprocess'}
          </button>
        )}
      </div>
      <div className="field-grid">
        <div className="field">
          <label>Invoice Number <span className="req">*</span></label>
          <div className="input-wrap">
            <input
              className="mono"
              key={invoice.id}
              value={canReprocess ? invoiceNumber : (pdf.invoice_number || invoice.invoiceNumber)}
              onChange={canReprocess ? (e) => onInvoiceNumberChange(e.target.value) : undefined}
              readOnly={!canReprocess}
            />
            <CheckIcon className="check" />
          </div>
        </div>
        <div className="field">
          <label>Invoice Date <span className="req">*</span></label>
          <div className="input-wrap"><input key={invoice.id} defaultValue={pdf.invoice_date || ''} /></div>
        </div>
        <div className="field">
          <label>Due Date</label>
          <div className="input-wrap"><input key={invoice.id} defaultValue={pdf.due_date || ''} placeholder="Not specified" /></div>
        </div>

        <div className="field">
          <label>PO References</label>
          <div className="input-wrap">
            <input className="mono" key={invoice.id} defaultValue={pdf.purchase_order || ''} />
            <CheckIcon className="check" />
          </div>
        </div>
        <div className="field">
          <label>Payment Terms</label>
          <div className="input-wrap">
            <select key={invoice.id} defaultValue={pdf.payment_terms || 'Net 30'}>
              <option>Net 30</option>
              <option>Net 45</option>
              <option>Net 60</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Document Type</label>
          <div className="input-wrap">
            <select defaultValue="Invoice">
              <option>Invoice</option>
              <option>Credit Memo</option>
            </select>
          </div>
        </div>

        <div className="field full">
          <label>Vendor <span className="req">*</span></label>
          <div className="input-wrap">
            <input key={invoice.id} defaultValue={pdf.vendor || invoice.vendor} />
            <CheckIcon className="check" />
          </div>
        </div>
        <div className="field">
          <label>Vendor ID</label>
          <div className="input-wrap">
            <input className="mono" key={invoice.id} defaultValue={invoice.vendorId} readOnly />
          </div>
        </div>
        <div className="field">
          <label>Currency</label>
          <div className="input-wrap">
            <select key={invoice.id} defaultValue={pdf.currency || 'USD'}>
              <option>USD</option>
              <option>CAD</option>
              <option>EUR</option>
            </select>
          </div>
        </div>

        <div className="field full">
          <label>Notes</label>
          <div className="input-wrap"><input placeholder="Enter header notes..." /></div>
        </div>
      </div>
    </div>
  )
}
