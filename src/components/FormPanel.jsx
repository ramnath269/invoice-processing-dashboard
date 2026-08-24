import HeaderCard from './HeaderCard'
import LineItemsCard from './LineItemsCard'
import ChargesCard from './ChargesCard'
import TotalsCard from './TotalsCard'

export default function FormPanel({ invoice, lineItems, charges, onUpdateLineItem, onRemoveLineItem, onAddLineItem, onUpdateCharge, onRemoveCharge, onAddCharge }) {
  const merch = lineItems.reduce((s, it) => s + it.qty * it.price, 0)
  const chargesTotal = charges.reduce((s, c) => s + c.inv, 0)
  const taxRow = charges.find((c) => c.type.toLowerCase().includes('tax'))
  const tax = taxRow ? taxRow.inv : 0
  const grand = merch + chargesTotal

  return (
    <div className="form-panel">
      <HeaderCard invoice={invoice} />
      <LineItemsCard
        lineItems={lineItems}
        onUpdate={onUpdateLineItem}
        onRemove={onRemoveLineItem}
        onAdd={onAddLineItem}
      />
      <ChargesCard
        charges={charges}
        onUpdate={onUpdateCharge}
        onRemove={onRemoveCharge}
        onAdd={onAddCharge}
      />
      <TotalsCard merch={merch} chargesTotal={chargesTotal} tax={tax} grand={grand} statedTotal={invoice.amount} />
    </div>
  )
}
