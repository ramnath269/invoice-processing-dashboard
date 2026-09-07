import { Fragment, useState } from 'react'
import { CheckIcon, WarnIcon, TrashIcon, PlusIcon, ChevronDownIcon, SearchIcon } from '../icons/icons'
import { money } from '../utils/format'

function humanizeMatchBasis(basis) {
  if (!basis) return null
  const words = basis.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export default function LineItemsCard({ lineItems, onUpdate, onRemove, onAdd }) {
  const [openMatchIndex, setOpenMatchIndex] = useState(null)

  function applySuggestion(i, jdeItemNumber) {
    onUpdate(i, 'itemNumber', jdeItemNumber)
    onUpdate(i, 'erpItemNumber', jdeItemNumber)
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
              const itemNumberMatched = item.erpItemNumber && String(item.erpItemNumber) === String(item.itemNumber)
              const isOpen = openMatchIndex === i
              const hasSuggestion = !itemNumberMatched && !!item.suggestedItemNumber
              return (
                <Fragment key={i}>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                      <span className="cell-value">{item.itemNumber}</span>
                      {item.erpItemNumber ? (
                        <span className={`erp-mini left ${itemNumberMatched ? 'match' : 'mismatch'}`}>ERP {item.erpItemNumber}</span>
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
                        <button className="icon-btn" title="Delete" onClick={() => onRemove(i)}>
                          <TrashIcon />
                        </button>
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
                              <span className="mc-desc">
                                {humanizeMatchBasis(item.suggestionMatchBasis)
                                  ? `Matched by ${humanizeMatchBasis(item.suggestionMatchBasis)}`
                                  : 'Suggested by the invoice server'}
                              </span>
                              <button className="mc-use-btn" onClick={() => applySuggestion(i, item.suggestedItemNumber)}>Use this match</button>
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
      <div className="table-footer">
        <button className="add-row-btn" onClick={onAdd}>
          <PlusIcon />
          Add Line
        </button>
      </div>
    </div>
  )
}
