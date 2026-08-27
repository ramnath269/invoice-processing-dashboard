function toNumber(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export function mapLineItemsFromInvoice(invoice) {
  const raw = invoice?.raw
  if (!raw) return []
  const pdfProducts = raw.pdf_fields?.products || []
  const erpRows = raw.erp_fields?.['55_DREQ_PO_ReceiptFile_Inquiry_V2']?.rowset || []

  return pdfProducts.map((p, i) => {
    const erpLine = erpRows[i]
    const po = p.purchase_order_number
      ? `PO ${p.purchase_order_number}${p.line_number ? ` / L${p.line_number}` : ''}`
      : '—'
    return {
      desc: p.description || p.item || 'Line item',
      itemNumber: p.item_number || p.supplier_item_number || p.item || '—',
      erpItemNumber: erpLine?.ItemNumber || null,
      qty: toNumber(p.quantity),
      poQty: erpLine ? toNumber(erpLine.QuantityOrdered) : undefined,
      uom: p.unit_of_measure || erpLine?.UOM || 'EA',
      price: toNumber(p.unit_price),
      poPrice: erpLine ? toNumber(erpLine.UnitPrice) : undefined,
      po,
    }
  })
}

const CHARGE_FIELDS = [
  { key: 'total_freight', label: 'Freight', account: '6210 - Freight' },
  { key: 'handling_fee', label: 'Handling Fee', account: '6220 - Handling' },
  { key: 'sales_tax', label: 'Sales Tax', account: '2100 - Sales Tax' },
  { key: 'state_level_tax', label: 'State Level Tax', account: '2100 - Sales Tax' },
  { key: 'county_level_tax', label: 'County Level Tax', account: '2100 - Sales Tax' },
  { key: 'special_level_tax', label: 'Special Level Tax', account: '2100 - Sales Tax' },
]

function chargeAmount(value) {
  if (value == null || value === '') return null
  if (typeof value === 'object') return toNumber(value.amount)
  return toNumber(value)
}

// The API doesn't expose a per-charge ERP figure to compare against (only an
// aggregate erp_fields.TotalAmount), so these always render as "matched" —
// that's honest given what the data provides, not a fabricated match.
export function mapChargesFromInvoice(invoice) {
  const raw = invoice?.raw
  if (!raw) return []
  const pdf = raw.pdf_fields || {}
  const allocate = pdf.purchase_order ? `PO ${pdf.purchase_order}` : '—'

  return CHARGE_FIELDS.reduce((charges, { key, label, account }) => {
    const value = pdf[key]
    const amount = chargeAmount(value)
    if (!amount) return charges
    charges.push({
      type: label,
      desc: label,
      inv: amount,
      po: amount,
      allocate,
      account: (typeof value === 'object' && value.AccountNo) || account,
      status: 'matched',
    })
    return charges
  }, [])
}
