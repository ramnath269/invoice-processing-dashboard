import { CheckIcon, WarnIcon } from '../icons/icons'
import { money } from '../utils/format'

export default function TotalsCard({ merch, chargesTotal, tax, grand, statedTotal }) {
  const diff = grand - statedTotal
  const ok = Math.abs(diff) < 0.01

  return (
    <div className="card">
      <div className="totals-strip">
        <div className="tbox"><div className="l">Merchandise Subtotal</div><div className="v">{money(merch)}</div></div>
        <div className="tbox"><div className="l">Total Additional Charges</div><div className="v">{money(chargesTotal)}</div></div>
        <div className="tbox"><div className="l">Tax</div><div className="v">{money(tax)}</div></div>
        <div className="tbox grand">
          <div className="l">Invoice Total</div>
          <div className="v">{money(grand)} USD</div>
          <div className={`variance-note ${ok ? 'ok' : 'flag'}`}>
            {ok ? (
              <>
                <CheckIcon />Matches invoice total
              </>
            ) : (
              <>
                <WarnIcon />{diff > 0 ? '+' : '-'}{money(Math.abs(diff))} vs. invoice
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
