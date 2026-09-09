function toNumber(value) {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

// erpItemNumber can be populated even on a placeholder JDE receipt row, so it isn't
// trustworthy by itself — a real ERP match requires quantity and price to also be
// present and non-zero. This is the single source of truth for that check; both the
// line-items table and the Create Voucher gate must agree on it.
export function hasErpItemInfo(item) {
  return (
    !!item.erpItemNumber &&
    typeof item.poQty === 'number' &&
    typeof item.poPrice === 'number' &&
    item.poQty !== 0 &&
    item.poPrice !== 0
  )
}

// A line's item number counts as resolved either when the ERP receipt data backs it
// up (hasErpItemInfo), or when the user has manually confirmed a suggested JDE item
// number via "Use this match" — that's a deliberate human decision and shouldn't be
// overridden by the receipt line still showing placeholder zeros.
export function isItemNumberResolved(item) {
  return hasErpItemInfo(item) || !!item.itemNumberConfirmed
}

export function mapLineItemsFromInvoice(invoice) {
  const raw = invoice?.raw
  if (!raw) return []
  const pdfProducts = raw.pdf_fields?.products || []
  const erpRows = raw.erp_fields?.['55_DREQ_PO_ReceiptFile_Inquiry_V2']?.rowset || []
  const itemSuggestions = raw.item_suggestions || []

  return pdfProducts.map((p, i) => {
    const erpLine = erpRows[i]
    const suggestion = itemSuggestions.find((s) => s.line_index === i) || null
    const po = p.purchase_order_number
      ? `PO ${p.purchase_order_number}${p.line_number ? ` / L${p.line_number}` : ''}`
      : '—'
    return {
      desc: p.description || p.item || 'Line item',
      itemNumber: p.item_number || p.supplier_item_number || p.item || '—',
      // erpItemNumber can be populated on a placeholder receipt row too, so it isn't
      // trustworthy by itself — LineItemsCard only treats it as a real match once
      // poQty/poPrice are both present and non-zero.
      erpItemNumber: erpLine?.ItemNumber || null,
      qty: toNumber(p.quantity),
      poQty: erpLine ? toNumber(erpLine.QuantityOrdered) : undefined,
      uom: p.unit_of_measure || erpLine?.UOM || 'EA',
      price: toNumber(p.unit_price),
      poPrice: erpLine ? toNumber(erpLine.UnitPrice) : undefined,
      po,
      suggestedItemNumber: isActionableSuggestion(suggestion) ? suggestion.suggested_jde_item_number : null,
      suggestedQty: isActionableSuggestion(suggestion) && suggestion.quantity != null ? toNumber(suggestion.quantity) : null,
      suggestedPrice: isActionableSuggestion(suggestion) && suggestion.unit_price != null ? toNumber(suggestion.unit_price) : null,
      suggestionMatchBasis: suggestion?.match_basis || null,
      // Raw field -> DocAI confidence (0-1) for this line, e.g. {item: 0.99,
      // quantity: 1.0, ...} - see app/document_ai.py::parse_entities. A field
      // DocAI never returned at all has no key here, not a fabricated 0.
      confidence: p.confidence || {},
    }
  })
}

function isActionableSuggestion(suggestion) {
  return !!suggestion && (!suggestion.status || suggestion.status === 'pending')
}

// The single number LineItemsCard shows per row: the weakest field on that
// line, since that's the one that would actually need a human look. Returns
// null (not 0) when there's no confidence data at all for the line - either
// an invoice created before this field existed, or every value on the line
// was defaulted rather than extracted - so the UI can render "—" instead of
// a misleading 0%.
export function lineItemConfidence(item) {
  const values = Object.values(item.confidence || {}).filter((v) => typeof v === 'number')
  if (!values.length) return null
  return Math.min(...values)
}

// Matches app/document_ai.py's CONFIDENCE_THRESHOLD (0.80) for the "high"
// cutoff, so a green badge means DocAI's own retry logic was satisfied with
// this line too - "medium" is the band we've actually seen trigger a retry
// in practice (0.5-0.8), "low" below that is rarely worth trusting.
export function confidenceTier(value) {
  if (value == null) return 'unknown'
  if (value >= 0.8) return 'high'
  if (value >= 0.5) return 'medium'
  return 'low'
}

export function confidenceTitle(item) {
  const entries = Object.entries(item.confidence || {})
  if (!entries.length) return 'No confidence data for this line'
  return entries
    .map(([field, value]) => `${field}: ${Math.round(value * 100)}%`)
    .join(' · ')
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
