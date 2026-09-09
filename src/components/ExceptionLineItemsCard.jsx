import { money } from '../utils/format'
import { lineItemConfidence, confidenceTier, confidenceTitle } from '../utils/detailMapping'

// Line items for an exception invoice (duplicate_invoice / order_not_found)
// - JDE never got far enough to return receipt lines for these (graph.py's
// handle_duplicate_invoice / handle_order_not_found both short-circuit
// before resolve_item_numbers runs), so there's no ERP quantity/price/item
// to compare against and no suggested-match flow to offer. This shows only
// what was extracted from the PDF itself, plus its per-field confidence.
export default function ExceptionLineItemsCard({ lineItems, onUpdate }) {
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
              <th className="center" style={{ width: '80px' }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => {
              const amount = item.qty * item.price
              const confidence = lineItemConfidence(item)
              const tier = confidenceTier(confidence)
              return (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                    <span className="cell-value">{item.itemNumber}</span>
                  </td>
                  <td className="desc"><span className="cell-value">{item.desc}</span><span className="sub">{item.po}</span></td>
                  <td className="num">
                    <span className="amount-value">{item.qty}</span>
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      value={item.price}
                      step="0.01"
                      onChange={(e) => onUpdate(i, 'price', e.target.value)}
                    />
                  </td>
                  <td className="num">
                    <span className="amount-value">{money(amount)}</span>
                  </td>
                  <td className="center">
                    <span
                      className={`confidence${tier === 'high' ? '' : ` ${tier}`}`}
                      title={confidenceTitle(item)}
                    >
                      {confidence == null ? '—' : `${Math.round(confidence * 100)}%`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
