import { CheckIcon, EditIcon } from '../icons/icons'

// Header fields for an exception invoice - PDF-extracted values only, no
// JDE comparison. JDE's response for a duplicate/order-not-found invoice
// isn't a real match (it's the error that caused the exception), so showing
// it alongside these fields the way HeaderCard does for a normal invoice
// would be misleading rather than useful.
export default function ExceptionHeaderCard({ invoice }) {
  const pdf = invoice.raw?.pdf_fields || {}

  return (
    <div className="card">
      <div className="card-head">
        <h2>Header Information</h2>
        <div className="spacer"></div>
        <button className="link-btn"><EditIcon />Edit</button>
      </div>
      <div className="field-grid">
        <div className="field">
          <label>Invoice Number <span className="req">*</span></label>
          <div className="input-wrap">
            <input className="mono" key={invoice.id} defaultValue={pdf.invoice_number || invoice.invoiceNumber} />
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
