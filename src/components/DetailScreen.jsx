import DocumentViewer from './DocumentViewer'
import FormPanel from './FormPanel'
import ChatWidget from './ChatWidget'
import { money, fmtDate } from '../utils/format'

export default function DetailScreen({
  invoice,
  userId,
  lineItems,
  charges,
  onUpdateLineItem,
  onRemoveLineItem,
  onAddLineItem,
  onUpdateCharge,
  onRemoveCharge,
  onAddCharge,
  chatMessages,
  chatInput,
  chatPending,
  onChatInputChange,
  onSendChat,
}) {
  return (
    <div id="detailScreen">
      <div className="infobar">
        <div className="info-field">
          <div className="label">Vendor</div>
          <div className="value link">{invoice.vendor}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{invoice.vendorId}</div>
        </div>
        <div className="info-field"><div className="label">Invoice #</div><div className="value mono">{invoice.id}</div></div>
        <div className="info-field">
          <div className="label">Voucher #</div>
          <div
            className={`value mono${invoice.status === 'processed' ? ' success' : ''}`}
            style={invoice.status === 'processed' ? undefined : { color: 'var(--text-muted)', fontWeight: 500 }}
          >
            {invoice.status === 'processed' ? (invoice.voucherNumber || 'Voucher Created') : 'Voucher not created'}
          </div>
        </div>
        <div className="info-field"><div className="label">Invoice Date</div><div className="value mono">{fmtDate(invoice.invoiceDate)}</div></div>
        <div className="info-field"><div className="label">Due Date</div><div className="value mono">{fmtDate(invoice.dueDate)}</div></div>
        <div className="info-field"><div className="label">Total Amount</div><div className="value mono total">{money(invoice.amount)} USD</div></div>
        <div className="info-field"><div className="label">Document Type</div><div className="value">Invoice</div></div>
        <div className="info-field"><div className="label">Payment Terms</div><div className="value">Net 30</div></div>
      </div>

      <div className="panels">
        <DocumentViewer fileUrl={invoice.fileUrl} />
        <FormPanel
          invoice={invoice}
          lineItems={lineItems}
          charges={charges}
          onUpdateLineItem={onUpdateLineItem}
          onRemoveLineItem={onRemoveLineItem}
          onAddLineItem={onAddLineItem}
          onUpdateCharge={onUpdateCharge}
          onRemoveCharge={onRemoveCharge}
          onAddCharge={onAddCharge}
        />
      </div>

      <ChatWidget
        userId={userId}
        messages={chatMessages}
        chatInput={chatInput}
        chatPending={chatPending}
        onChatInputChange={onChatInputChange}
        onSend={onSendChat}
      />
    </div>
  )
}
