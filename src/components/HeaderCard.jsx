import { CheckIcon, WarnIcon, EditIcon } from '../icons/icons'

function ErpCompare({ erpValue, matches }) {
  if (erpValue == null || erpValue === '') return null
  return (
    <div className={`erp-compare ${matches ? 'match' : 'mismatch'}`}>
      {matches ? <CheckIcon /> : <WarnIcon />}
      ERP: {erpValue}
    </div>
  )
}

function fieldsMatch(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()
}

export default function HeaderCard({ invoice }) {
  const pdf = invoice.raw?.pdf_fields || {}
  const erp = invoice.raw?.erp_fields || {}
  const erpOrderNumber = erp.OrderNumber != null ? String(erp.OrderNumber) : ''

  return (
    <div className="card">
      <div className="card-head">
        <h2>Header Information</h2>
        <div className="spacer"></div>
        <span className="erp-legend"><span className="dotlegend erp"></span>ERP value shown below each field</span>
        <button className="link-btn"><EditIcon />Edit</button>
      </div>
      <div className="field-grid">
        <div className="field">
          <label>Invoice Number <span className="req">*</span></label>
          <div className="input-wrap">
            <input className="mono" key={invoice.id} defaultValue={pdf.invoice_number || invoice.id} />
            <CheckIcon className="check" />
          </div>
          <ErpCompare erpValue={erp.VendorInvoiceNo} matches={fieldsMatch(pdf.invoice_number, erp.VendorInvoiceNo)} />
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
          <ErpCompare erpValue={erpOrderNumber} matches={fieldsMatch(pdf.purchase_order, erpOrderNumber)} />
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
          <ErpCompare erpValue={erp.VendorName} matches={fieldsMatch(pdf.vendor, erp.VendorName) || fieldsMatch(invoice.vendor, erp.VendorName)} />
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
