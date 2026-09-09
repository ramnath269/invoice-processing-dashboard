import ExceptionHeaderCard from './ExceptionHeaderCard'
import ExceptionLineItemsCard from './ExceptionLineItemsCard'
import ExceptionChargesCard from './ExceptionChargesCard'
import TotalsCard from './TotalsCard'

// TotalsCard is reused as-is - it's computed entirely from lineItems/charges
// (both PDF-sourced) and invoice.amount (pdf.total_amount_due), no ERP data
// involved.
export default function ExceptionFormPanel({ invoice, lineItems, charges, onUpdateLineItem, onUpdateCharge, onRemoveCharge, onAddCharge }) {
  const merch = lineItems.reduce((s, it) => s + it.qty * it.price, 0)
  const chargesTotal = charges.reduce((s, c) => s + c.inv, 0)
  const taxRow = charges.find((c) => c.type.toLowerCase().includes('tax'))
  const tax = taxRow ? taxRow.inv : 0
  const grand = merch + chargesTotal

  return (
    <div className="form-panel">
      <ExceptionHeaderCard invoice={invoice} />
      <ExceptionLineItemsCard lineItems={lineItems} onUpdate={onUpdateLineItem} />
      <ExceptionChargesCard
        charges={charges}
        onUpdate={onUpdateCharge}
        onRemove={onRemoveCharge}
        onAdd={onAddCharge}
      />
      <TotalsCard merch={merch} chargesTotal={chargesTotal} tax={tax} grand={grand} statedTotal={invoice.amount} />
    </div>
  )
}
