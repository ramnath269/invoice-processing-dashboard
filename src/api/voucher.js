const VOUCHER_URL = import.meta.env.VITE_VOUCHER_CREATION_URL

const NON_STOCK_FIELDS = ['total_freight', 'handling_fee']

export function buildVoucherPayload(invoice) {
  const record = invoice.raw || {}
  const pdf = record.pdf_fields || {}
  const erp = record.erp_fields || {}
  const erpLines = erp['55_DREQ_PO_ReceiptFile_Inquiry_V2']?.rowset || []

  const items = erpLines.map((line) => ({
    ItemNumber: line.ItemNumber,
    Quantity: line.QuantityOrdered,
    UnitOfMeasure: line.UOM,
    AmountPaid: line.NetAmount,
  }))

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
    username: 'ELAN',
    password: 'HelloWorld',
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
