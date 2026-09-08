import { Fragment, useState } from 'react'
import { CheckIcon, WarnIcon, ChevronDownIcon, SearchIcon } from '../icons/icons'
import { money } from '../utils/format'
import { isItemNumberResolved } from '../utils/detailMapping'

function humanizeMatchBasis(basis) {
  if (!basis) return null
  const words = basis.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export default function LineItemsCard({ lineItems, onUpdate }) {
  const [openMatchIndex, setOpenMatchIndex] = useState(null)

  function applySuggestion(i, item) {
    // itemNumber is about to be overwritten with the assigned JDE code — stash the
    // original supplier item number first so the pair survives for the item-crossref
    // sync that runs after voucher creation (see App.jsx's handleCreateVoucher).
    onUpdate(i, 'crossrefSupplierItemNumber', item.itemNumber)
    onUpdate(i, 'crossrefAssignedItemNumber', item.suggestedItemNumber)
    onUpdate(i, 'itemNumber', item.suggestedItemNumber)
    onUpdate(i, 'erpItemNumber', item.suggestedItemNumber)
    onUpdate(i, 'itemNumberConfirmed', true)
    // The suggestion carries its own quantity/price from the JDE item master, which is
    // real data — use it instead of leaving the placeholder 0s from the receipt line.
    if (item.suggestedQty != null) onUpdate(i, 'poQty', item.suggestedQty)
    if (item.suggestedPrice != null) onUpdate(i, 'poPrice', item.suggestedPrice)
    setOpenMatchIndex(null)
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Invoice Line Items</h2>
        <div className="spacer"></div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lineItems.length} lines</span>
      </div>
      <div className={`table-scroll${openMatchIndex !== null ? ' expanded' : ''}`}>
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
              const itemNumberMatched = isItemNumberResolved(item)
              const isOpen = openMatchIndex === i
              const hasSuggestion = !itemNumberMatched && !!item.suggestedItemNumber
              const suggestionDetails = [
                humanizeMatchBasis(item.suggestionMatchBasis)
                  ? `Matched by ${humanizeMatchBasis(item.suggestionMatchBasis)}`
                  : 'Suggested by the invoice server',
                item.suggestedQty != null ? `Qty ${item.suggestedQty}` : null,
                item.suggestedPrice != null ? money(item.suggestedPrice) : null,
              ].filter(Boolean).join(' · ')
              return (
                <Fragment key={i}>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                      <span className="cell-value">{item.itemNumber}</span>
                      {itemNumberMatched ? (
                        <span className="erp-mini left match">ERP {item.erpItemNumber}</span>
                      ) : (
                        <span className="erp-mini left unavailable">Item number not available</span>
                      )}
                    </td>
                    <td className="desc"><span className="cell-value">{item.desc}</span><span className="sub">{item.po}</span></td>
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
                    <td className="num">
                      <span className="amount-value">{money(amount)}</span>
                      {hasPoAmount && (
                        <span className={`erp-mini ${amountMatched ? 'match' : 'mismatch'}`}>ERP {money(poAmount)}</span>
                      )}
                    </td>
                    <td className="center">
                      <span className={`status-pill ${matched ? 'matched' : 'review'}`}>
                        {matched ? <CheckIcon /> : <WarnIcon />}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {hasSuggestion && (
                          <button
                            className="match-trigger"
                            onClick={() => setOpenMatchIndex(isOpen ? null : i)}
                            title="Resolve item number"
                          >
                            <WarnIcon />
                            Match suggested
                            <ChevronDownIcon />
                          </button>
                        )}
                        {/* <button className="icon-btn" title="Delete" onClick={() => onRemove(i)}>
                          <TrashIcon />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                  {isOpen && hasSuggestion && (
                    <tr className="match-row">
                      <td colSpan={8}>
                        <div className="match-panel">
                          <div className="match-panel-hd">
                            <SearchIcon />
                            "{item.itemNumber}" isn't in the ERP item master — the invoice server suggests a match
                          </div>
                          <div className="match-candidates">
                            <div className="match-candidate best">
                              <span className="mc-rank"><CheckIcon /></span>
                              <span className="mc-code">{item.suggestedItemNumber}</span>
                              <span className="mc-desc">{suggestionDetails}</span>
                              <button className="mc-use-btn" onClick={() => applySuggestion(i, item)}>Use this match</button>
                            </div>
                          </div>
                          <div className="match-panel-footer">
                            <a onClick={() => setOpenMatchIndex(null)}>Keep as unmatched</a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
