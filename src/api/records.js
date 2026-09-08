const API_BASE = import.meta.env.VITE_API_URL

function parseAmount(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeYear(y) {
  // 2-digit years (e.g. "26") must be expanded before use — passing them straight
  // into Date.UTC() triggers JS's legacy 1900+year behavior (26 -> 1926).
  if (y.length <= 2) return String(2000 + parseInt(y, 10)).padStart(4, '0')
  return y.padStart(4, '0')
}

function mdyToISO(mdy) {
  if (!mdy) return null
  const [m, d, y] = mdy.split('/')
  if (!m || !d || !y) return null
  return `${normalizeYear(y)}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function netDaysFromTerms(terms) {
  const match = /net\s*(\d+)/i.exec(terms || '')
  return match ? parseInt(match[1], 10) : 30
}

function mapStatus(rawStatus) {
  const s = (rawStatus || '').toUpperCase()
  if (s.includes('EXCEPTION') || s.includes('ERROR')) return 'exception'
  if (s.includes('VOUCHER') || s.includes('PROCESSED') || s.includes('PAID') || s.includes('COMPLETE')) return 'processed'
  if (s.includes('REVIEW')) return 'review'
  return 'pending'
}

function fileUrlFor(record) {
  if (!API_BASE) return null
  if (record.isDriveWF) {
    return record.file_path ? `${API_BASE}/drive-file/${record.file_path}` : null
  }
  return record._id ? `${API_BASE}/file/${record._id}` : null
}

function deriveFlags(record) {
  const pdf = record.pdf_fields || {}
  const erp = record.erp_fields || {}
  const flags = []
  const pdfTotal = parseAmount(pdf.total_amount_due)
  const erpTotal = parseAmount(erp.TotalAmount)
  if (pdfTotal && erpTotal && Math.abs(pdfTotal - erpTotal) > 0.01) flags.push('priceVariance')
  if (erp.ErrorCode) flags.push('poMismatch')
  return flags
}

function mapRecord(record) {
  const pdf = record.pdf_fields || {}
  const erp = record.erp_fields || {}
  const invoiceDate = mdyToISO(pdf.invoice_date) || new Date().toISOString().slice(0, 10)
  const dueDate = mdyToISO(pdf.due_date) || addDaysISO(invoiceDate, netDaysFromTerms(pdf.payment_terms))

  return {
    id: pdf.invoice_number || pdf.purchase_order || record._id,
    vendor: erp.VendorName || pdf.vendor || 'Unknown Vendor',
    vendorId: erp.VendorNumber != null ? String(erp.VendorNumber) : '—',
    invoiceDate,
    dueDate,
    amount: parseAmount(pdf.total_amount_due),
    status: mapStatus(pdf.status),
    flags: deriveFlags(record),
    fileUrl: fileUrlFor(record),
    voucherNumber: pdf.voucher_number || null,
    raw: record,
  }
}

export async function fetchInvoiceRecords() {
  if (!API_BASE) {
    throw new Error('VITE_API_URL is not configured')
  }
  const res = await fetch(`${API_BASE}/po`)
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice records (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data.map(mapRecord) : []
}

export async function updatePurchaseOrderStatus(invoice, status, extraPdfFields = {}) {
  if (!API_BASE) {
    throw new Error('VITE_API_URL is not configured')
  }
  const record = invoice.raw
  if (!record?._id) {
    throw new Error('Missing record id for status update')
  }
  const payload = {
    ...record,
    pdf_fields: { ...record.pdf_fields, status, ...extraPdfFields },
    erp_fields: record.erp_fields,
  }
  const res = await fetch(`${API_BASE}/update-po/${record._id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(`Failed to update purchase order status (${res.status})`)
  }
  return res.json()
}

export async function saveItemCrossref({ supplierNumber, itemNumber, assignedItemNumber, confirmedBy }) {
  if (!API_BASE) {
    throw new Error('VITE_API_URL is not configured')
  }
  const res = await fetch(`${API_BASE}/item-crossref`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supplier_number: supplierNumber,
      item_number: itemNumber,
      assigned_item_number: assignedItemNumber,
      confirmed_by: confirmedBy,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Failed to save item cross-reference (${res.status})`)
  }
  return data
}
