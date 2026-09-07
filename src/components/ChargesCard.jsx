import { CheckIcon, WarnIcon, TrashIcon, PlusIcon } from '../icons/icons'
import { money } from '../utils/format'

export default function ChargesCard({ charges, onUpdate, onRemove, onAdd }) {
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
              <th className="num" style={{ width: '36px' }}>Var.</th>
              <th style={{ width: '172px' }}>Account</th>
              <th className="center" style={{ width: '34px' }}>Status</th>
              <th style={{ width: '22px' }}></th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c, i) => {
              const variance = c.inv - c.po
              const flagged = Math.abs(variance) > 0.001
              return (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="desc"><span className="cell-value">{c.type}</span><span className="sub">{c.desc} · {c.allocate}</span></td>
                  <td className="num">
                    <input
                      type="number"
                      value={c.inv}
                      step="0.01"
                      onChange={(e) => onUpdate(i, 'inv', e.target.value)}
                    />
                    <span className={`erp-mini ${flagged ? 'mismatch' : 'match'}`}>ERP {money(c.po)}</span>
                  </td>
                  <td className={`num variance ${flagged ? 'flag' : 'ok'}`}>{flagged ? money(variance) : '0.00'}</td>
                  <td>
                    <input
                      type="text"
                      className="account-input"
                      value={c.account}
                      onChange={(e) => onUpdate(i, 'account', e.target.value)}
                    />
                  </td>
                  <td className="center">
                    <span className={`status-pill ${c.status}`}>
                      {c.status === 'matched' ? <CheckIcon /> : <WarnIcon />}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Delete" onClick={() => onRemove(i)}>
                        <TrashIcon />
                      </button>
                    </div>
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
          Add Charge
        </button>
      </div>
    </div>
  )
}
