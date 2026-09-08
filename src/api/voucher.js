const VOUCHER_URL = import.meta.env.VITE_VOUCHER_CREATION_URL

const NON_STOCK_FIELDS = ['total_freight', 'handling_fee']

export function buildVoucherPayload(invoice, lineItems = []) {
  const record = invoice.raw || {}
  const pdf = record.pdf_fields || {}
  const erp = record.erp_fields || {}

  // Build from the line items as currently edited in the UI, not the raw ERP receipt
  // rows — those can still carry placeholder 0 quantity/price that the user has since
  // corrected, either by hand or by confirming a suggested JDE item match.
  const items = lineItems.map((item) => {
    const quantity = item.poQty ?? item.qty ?? 0
    const unitPrice = item.poPrice ?? item.price ?? 0
    return {
      ItemNumber: item.erpItemNumber || item.itemNumber,
      Quantity: quantity,
      UnitOfMeasure: item.uom,
      AmountPaid: quantity * unitPrice,
    }
  })

  NON_STOCK_FIELDS.forEach((field) => {
    const charge = pdf[field]
    if (charge) {
      items.push({
        ItemNumber: '',
        Quantity: 0,
        UnitOfMeasure: 'EA',
        TransactionType: 'J',
        AmountPaid: charge.amount,
        AccountNo: charge.AccountNo,
      })
    }
  })

  return {
    username: 'ORCHSVC',
    password: 'fHs2O$j0',
    OrderNumber: erp.OrderNumber,
    TotalAmountPaid: pdf.total_amount_due,
    CustomerInvoiceNo: pdf.invoice_number,
    FileURL: invoice.fileUrl,
    Items: items,
  }
}

export async function createVoucher(payload) {
  if (!VOUCHER_URL) {
    throw new Error('VITE_VOUCHER_CREATION_URL is not configured')
  }
  const res = await fetch(VOUCHER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(`Voucher creation failed (${res.status})`)
  }
  return res.json()
}

// The exact shape of the orchestrator's success response hasn't been confirmed against
// a live call — this checks the field names JDE's F0411 (voucher ledger) convention would
// suggest ("DocumentNumber" is the confirmed column there). Update this list if the real
// response uses a different key.
const VOUCHER_NUMBER_KEYS = ['DocumentNumber', 'documentNumber', 'VoucherNumber', 'voucherNumber', 'DocNumber', 'docNumber']

export function extractVoucherNumber(response) {
  if (!response) return null
  if (Array.isArray(response)) return extractVoucherNumber(response[0])
  if (typeof response !== 'object') return null
  for (const key of VOUCHER_NUMBER_KEYS) {
    if (response[key] != null && response[key] !== '') return String(response[key])
  }
  if (response.data) return extractVoucherNumber(response.data)
  return null
}
