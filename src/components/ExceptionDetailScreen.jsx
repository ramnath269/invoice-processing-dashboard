import DocumentViewer from './DocumentViewer'
import ExceptionFormPanel from './ExceptionFormPanel'
import ChatWidget from './ChatWidget'
import { money, fmtDate } from '../utils/format'

const EXCEPTION_TITLES = {
  duplicate_invoice: 'Duplicate invoice',
  order_not_found: 'Order not found',
}

// Detail view for an exception invoice (duplicate_invoice / order_not_found).
// JDE's voucher-match never got past the error that caused the exception, so
// there's no reliable ERP data to show or compare against - this renders PDF
// values only, via ExceptionFormPanel, and has no Create Voucher path at all
// (see InvoiceDetailPage / Topbar).
export default function ExceptionDetailScreen({
  invoice,
  userId,
  lineItems,
  charges,
  onUpdateLineItem,
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
      <div className="exception-banner">
        <span className="exception-title">
          {EXCEPTION_TITLES[invoice.exceptionReason] || 'Exception'}:
        </span>
        <span>{invoice.exceptionMessage || 'This invoice could not be processed against JDE.'}</span>
      </div>
      <div className="infobar">
        <div className="info-field">
          <div className="label">Vendor</div>
          <div className="value link">{invoice.vendor}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{invoice.vendorId}</div>
        </div>
        <div className="info-field"><div className="label">Invoice #</div><div className="value mono">{invoice.invoiceNumber}</div></div>
        <div className="info-field">
          <div className="label">Voucher #</div>
          <div className="value mono" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Voucher not created</div>
        </div>
        <div className="info-field"><div className="label">Invoice Date</div><div className="value mono">{fmtDate(invoice.invoiceDate)}</div></div>
        <div className="info-field"><div className="label">Due Date</div><div className="value mono">{fmtDate(invoice.dueDate)}</div></div>
        <div className="info-field"><div className="label">Total Amount</div><div className="value mono total">{money(invoice.amount)} USD</div></div>
        <div className="info-field"><div className="label">Document Type</div><div className="value">Invoice</div></div>
        <div className="info-field"><div className="label">Payment Terms</div><div className="value">Net 30</div></div>
      </div>

      <div className="panels">
        <DocumentViewer fileUrl={invoice.fileUrl} />
        <ExceptionFormPanel
          invoice={invoice}
          lineItems={lineItems}
          charges={charges}
          onUpdateLineItem={onUpdateLineItem}
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
