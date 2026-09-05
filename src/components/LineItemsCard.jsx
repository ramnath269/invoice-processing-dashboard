import { CheckIcon, WarnIcon, TrashIcon, PlusIcon } from '../icons/icons'
import { money } from '../utils/format'

export default function LineItemsCard({ lineItems, onUpdate, onRemove, onAdd }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Invoice Line Items</h2>
        <div className="spacer"></div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lineItems.length} lines</span>
      </div>
      <div className="table-scroll">
        <table className="line-table">
          <thead>
            <tr>
              <th style={{ width: '20px' }}>#</th>
              <th style={{ width: '100px' }}>Item Number</th>
              <th>Description</th>
              <th className="num" style={{ width: '1%' }}>Qty</th>
              <th className="num" style={{ width: '1%' }}>Price</th>
              <th className="num" style={{ width: '1%' }}>Amount</th>
              <th className="center" style={{ width: '36px' }}>Status</th>
              <th style={{ width: '24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => {
              const amount = item.qty * item.price
              const hasPoPrice = typeof item.poPrice === 'number'
              const hasPoQty = typeof item.poQty === 'number'
              const priceMatched = !hasPoPrice || Math.abs(item.price - item.poPrice) < 0.005
              const qtyMatched = !hasPoQty || item.qty === item.poQty
              const matched = priceMatched && qtyMatched
              const hasPoAmount = hasPoPrice && hasPoQty
              const poAmount = hasPoAmount ? item.poQty * item.poPrice : undefined
              const amountMatched = !hasPoAmount || Math.abs(amount - poAmount) < 0.005
              const itemNumberMatched = item.erpItemNumber && String(item.erpItemNumber) === String(item.itemNumber)
              // JDE returns a zero qty/price placeholder row (rather than omitting it) when it
              // couldn't actually resolve this line's item - e.g. "Unable to fetch Order/Item
              // information" - so any erpItemNumber attached to one of those isn't a real match
              // and showing it would be misleading.
              const hasUnresolvedErpLine = item.poQty === 0 && item.poPrice === 0
              const hasReliableErpItemNumber = item.erpItemNumber && !hasUnresolvedErpLine
              return (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {item.itemNumber}
                    {hasReliableErpItemNumber ? (
                      <span className={`erp-mini left ${itemNumberMatched ? 'match' : 'mismatch'}`}>JDE {item.erpItemNumber}</span>
                    ) : (
                      <span className="erp-mini left unavailable">Item number not available</span>
                    )}
                  </td>
                  <td className="desc">{item.desc}<span className="sub">{item.po}</span></td>
                  <td className="num">
                    <input
                      type="number"
                      className="fit-input"
                      value={item.qty}
                      step="1"
                      size={Math.max(2, String(item.qty).length)}
                      onChange={(e) => onUpdate(i, 'qty', e.target.value)}
                    />
                    {hasPoQty && (
                      <span className={`erp-mini ${qtyMatched ? 'match' : 'mismatch'}`}>JDE {item.poQty}</span>
                    )}
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      className="fit-input"
                      value={item.price}
                      step="0.01"
                      size={Math.max(4, String(item.price).length)}
                      onChange={(e) => onUpdate(i, 'price', e.target.value)}
                    />
                    {hasPoPrice && (
                      <span className={`erp-mini ${priceMatched ? 'match' : 'mismatch'}`}>JDE {money(item.poPrice)}</span>
                    )}
                  </td>
                  <td className="num">
                    <span className="amount-value">{money(amount)}</span>
                    {hasPoAmount && (
                      <span className={`erp-mini ${amountMatched ? 'match' : 'mismatch'}`}>JDE {money(poAmount)}</span>
                    )}
                  </td>
                  <td className="center">
                    <span className={`status-pill ${matched ? 'matched' : 'review'}`}>
                      {matched ? <CheckIcon /> : <WarnIcon />}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" title="Delete" onClick={() => onRemove(i)}>
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <button className="add-row-btn" onClick={onAdd}>
          <PlusIcon />
          Add Line
        </button>
      </div>
    </div>
  )
}
