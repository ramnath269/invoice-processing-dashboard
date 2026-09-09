import { TrashIcon, PlusIcon } from '../icons/icons'

// Charges for an exception invoice - PDF values only. The normal ChargesCard
// shows a "JDE {amount}" figure next to each charge, but that's not a real
// ERP comparison (there's no per-charge figure the API exposes - see
// mapChargesFromInvoice's comment); it's a placeholder that always reads as
// matched. That's misleading enough on a normal invoice and worse on an
// exception one, so it's left out here entirely.
export default function ExceptionChargesCard({ charges, onUpdate, onRemove, onAdd }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>Additional Charges</h2>
        <div className="spacer"></div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{charges.length} charges</span>
      </div>
      <div className="table-scroll charges">
        <table className="line-table">
          <thead>
            <tr>
              <th style={{ width: '20px' }}>#</th>
              <th>Charge</th>
              <th className="num" style={{ width: '76px' }}>Inv. Amt</th>
              <th style={{ width: '172px' }}>Account</th>
              <th style={{ width: '22px' }}></th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="desc"><span className="cell-value">{c.type}</span><span className="sub">{c.desc}</span></td>
                <td className="num">
                  <input
                    type="number"
                    value={c.inv}
                    step="0.01"
                    onChange={(e) => onUpdate(i, 'inv', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="account-input"
                    value={c.account}
                    onChange={(e) => onUpdate(i, 'account', e.target.value)}
                  />
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="Delete" onClick={() => onRemove(i)}>
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <button className="add-row-btn" onClick={onAdd}>
          <PlusIcon />
          Add Charge
        </button>
      </div>
    </div>
  )
}
