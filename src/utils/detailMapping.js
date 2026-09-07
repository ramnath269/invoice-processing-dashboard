function toNumber(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export function mapLineItemsFromInvoice(invoice) {
  const raw = invoice?.raw
  if (!raw) return []
  const pdfProducts = raw.pdf_fields?.products || []
  const erpRows = raw.erp_fields?.['55_DREQ_PO_ReceiptFile_Inquiry_V2']?.rowset || []
  const itemSuggestions = raw.item_suggestions || []

  return pdfProducts.map((p, i) => {
    const erpLine = erpRows[i]
    const poQty = erpLine ? toNumber(erpLine.QuantityOrdered) : undefined
    const poPrice = erpLine ? toNumber(erpLine.UnitPrice) : undefined
    // A receipt row with zero quantity and zero price isn't a real ERP match —
    // it's a placeholder row, so the item number it carries shouldn't be trusted either.
    const erpLineIsEmpty = erpLine && poQty === 0 && poPrice === 0
    const suggestion = itemSuggestions.find((s) => s.line_index === i) || null
    const po = p.purchase_order_number
      ? `PO ${p.purchase_order_number}${p.line_number ? ` / L${p.line_number}` : ''}`
      : '—'
    return {
      desc: p.description || p.item || 'Line item',
      itemNumber: p.item_number || p.supplier_item_number || p.item || '—',
      erpItemNumber: erpLineIsEmpty ? null : erpLine?.ItemNumber || null,
      qty: toNumber(p.quantity),
      poQty,
      uom: p.unit_of_measure || erpLine?.UOM || 'EA',
      price: toNumber(p.unit_price),
      poPrice,
      po,
      suggestedItemNumber:
        suggestion && (!suggestion.status || suggestion.status === 'pending') ? suggestion.suggested_jde_item_number : null,
      suggestionMatchBasis: suggestion?.match_basis || null,
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
