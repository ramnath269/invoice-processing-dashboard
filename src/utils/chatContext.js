import { STATUS_META } from '../data/invoices'
import { money } from './format'

// Prepends the open invoice's identifying details to the user's question as
// background context, rather than trying to classify whether the question is
// "about" the invoice — the model is better at ignoring irrelevant context
// than we are at guessing intent from a keyword match.
export function buildInvoiceContextPrompt(invoice, question) {
  if (!invoice) return question

  const po = invoice.raw?.pdf_fields?.purchase_order
  const parts = [
    `Invoice #${invoice.invoiceNumber}`,
    `vendor "${invoice.vendor}"${invoice.vendorId ? ` (ID ${invoice.vendorId})` : ''}`,
    po ? `PO ${po}` : null,
    `total ${money(invoice.amount)} USD`,
    `status: ${STATUS_META[invoice.status]?.label || invoice.status}`,
  ].filter(Boolean).join(', ')

  return `Context (use only if relevant to the question below): ${parts}.\n\nQuestion: ${question}`
}
