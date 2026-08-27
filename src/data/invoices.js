export const FLAG_META = {
  poMismatch: { label: 'PO Mismatch', color: '#8b5cf6' },
  priceVariance: { label: 'Price Variance', color: '#f59e0b' },
  qtyVariance: { label: 'Qty Variance', color: '#f97316' },
  lowConfidence: { label: 'Low OCR Confidence', color: '#eab308' },
  duplicateSuspected: { label: 'Duplicate Suspected', color: '#ef4444' },
  overdue: { label: 'Overdue', color: '#dc2626' },
}

export const QUICK_FILTERS = [
  { key: 'poMismatch', label: 'PO Mismatch', color: '#8b5cf6' },
  { key: 'priceVariance', label: 'Price Variance', color: '#f59e0b' },
  { key: 'qtyVariance', label: 'Qty Variance', color: '#f97316' },
  { key: 'lowConfidence', label: 'Low OCR Confidence', color: '#eab308' },
  { key: 'duplicateSuspected', label: 'Duplicate Suspected', color: '#ef4444' },
  { key: 'overdue', label: 'Overdue Invoices', color: '#dc2626' },
]

export const STATUS_META = {
  review: { label: 'In Review', cls: 'st-review' },
  exception: { label: 'Exception', cls: 'st-exception' },
  processed: { label: 'Processed', cls: 'st-processed' },
  pending: { label: 'Pending Approval', cls: 'st-pending' },
}

export const VIEW_META = {
  dashboard: { title: 'Dashboard', filterStatus: null },
  queue: { title: 'My Queue', filterStatus: null },
  inreview: { title: 'In Review', filterStatus: 'review' },
  exceptions: { title: 'Exceptions', filterStatus: 'exception' },
  processed: { title: 'Processed Payment', filterStatus: 'processed' },
}
