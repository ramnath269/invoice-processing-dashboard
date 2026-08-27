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
              <th className="num" style={{ width: '54px' }}>Qty</th>
              <th className="num" style={{ width: '80px' }}>Price</th>
              <th className="num" style={{ width: '76px' }}>Amount</th>
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
              const itemNumberMatched = item.erpItemNumber && String(item.erpItemNumber) === String(item.itemNumber)
              return (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {item.itemNumber}
                    {item.erpItemNumber ? (
                      <span className={`erp-mini left ${itemNumberMatched ? 'match' : 'mismatch'}`}>ERP {item.erpItemNumber}</span>
                    ) : (
                      <span className="erp-mini left unavailable">Item number not available</span>
                    )}
                  </td>
                  <td className="desc">{item.desc}<span className="sub">{item.po}</span></td>
                  <td className="num">
                    <input
                      type="number"
                      value={item.qty}
                      step="1"
                      onChange={(e) => onUpdate(i, 'qty', e.target.value)}
                    />
                    {hasPoQty && (
                      <span className={`erp-mini ${qtyMatched ? 'match' : 'mismatch'}`}>ERP {item.poQty}</span>
                    )}
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      value={item.price}
                      step="0.01"
                      onChange={(e) => onUpdate(i, 'price', e.target.value)}
                    />
                    {hasPoPrice && (
                      <span className={`erp-mini ${priceMatched ? 'match' : 'mismatch'}`}>ERP {money(item.poPrice)}</span>
                    )}
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>{money(amount)}</td>
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
