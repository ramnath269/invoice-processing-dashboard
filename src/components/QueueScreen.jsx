import { SearchIcon } from '../icons/icons'
import { FLAG_META, STATUS_META } from '../data/invoices'
import { money, fmtDate } from '../utils/format'

const STAT_CARDS = [
  { key: 'queue', label: 'My Queue', color: '#2563eb' },
  { key: 'inreview', label: 'In Review', color: '#d97706' },
  { key: 'exceptions', label: 'Exceptions', color: '#dc2626' },
  { key: 'processed', label: 'Processed Payment', color: '#16a34a' },
]

export default function QueueScreen({ showStatCards, counts, search, onSearchChange, rows, onNavigate, onSelectInvoice, loading, error, onRetry }) {
  return (
    <div id="queueScreen">
      <div className="queue-toolbar">
        <div className="queue-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search invoice #, vendor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="queue-summary">
          {loading ? 'Loading…' : `${rows.length} invoice${rows.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {showStatCards && (
        <div className="stat-cards">
          {STAT_CARDS.map((c) => (
            <div key={c.key} className="stat-card" onClick={() => onNavigate(c.key)}>
              <div className="n">{counts[c.key]}</div>
              <div className="l">{c.label}</div>
              <div className="bar" style={{ background: c.color }}></div>
            </div>
          ))}
        </div>
      )}

      <div className="queue-table-wrap">
        {!loading && !error && (
          <table className="queue-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Vendor</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const sm = STATUS_META[inv.status]
                return (
                  <tr key={inv.id} onClick={() => onSelectInvoice(inv.id)}>
                    <td className="inv-num">{inv.invoiceNumber}</td>
                    <td className="vendor-cell">{inv.vendor}</td>
                    <td>{fmtDate(inv.invoiceDate)}</td>
                    <td>{fmtDate(inv.dueDate)}</td>
                    <td className="num amount-cell">{money(inv.amount)}</td>
                    <td><span className={`row-status ${sm.cls}`}>{sm.label}</span></td>
                    <td>
                      <div className="flag-chips">
                        {inv.flags.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>}
                        {inv.flags.map((f) => {
                          const fm = FLAG_META[f]
                          return (
                            <span key={f} className="flag-chip">
                              <span className="fdot" style={{ background: fm.color }}></span>
                              {fm.label}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {loading && <div className="queue-empty">Loading invoice records…</div>}
        {!loading && error && (
          <div className="queue-empty">
            Couldn't load invoice records: {error}
            <div style={{ marginTop: '10px' }}>
              <button className="btn" onClick={onRetry}>Retry</button>
            </div>
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="queue-empty">No invoices match the current filters.</div>
        )}
      </div>
    </div>
  )
}
