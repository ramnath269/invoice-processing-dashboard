import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import QueueScreen from './components/QueueScreen'
import DetailScreen from './components/DetailScreen'
import ClarificationModal from './components/ClarificationModal'
import Toast from './components/Toast'
import LoginPage from './components/LoginPage'
import { VIEW_META, STATUS_META, QUICK_FILTERS } from './data/invoices'
import { fetchInvoiceRecords, updatePurchaseOrderStatus, saveItemCrossref } from './api/records'
import { askAssistant } from './api/assistant'
import { buildVoucherPayload, createVoucher, extractVoucherNumber } from './api/voucher'
import { mapLineItemsFromInvoice, mapChargesFromInvoice, isItemNumberResolved } from './utils/detailMapping'
import { buildInvoiceContextPrompt } from './utils/chatContext'
import './App.css'

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

const AUTH_STORAGE_KEY = 'apSmartFlowUserId'
const TOKEN_STORAGE_KEY = 'apSmartFlowToken'

export default function App() {
  const [userId, setUserId] = useState(() => sessionStorage.getItem(AUTH_STORAGE_KEY) || '')
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [lastListView, setLastListView] = useState('dashboard')
  const [activeFlagFilter, setActiveFlagFilter] = useState(null)
  const [dateFilterActive, setDateFilterActive] = useState(false)
  const [queueSearch, setQueueSearch] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return toISODate(d)
  })
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()))

  const [lineItems, setLineItems] = useState([])
  const [charges, setCharges] = useState([])

  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatPending, setChatPending] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  const [clarifyOpen, setClarifyOpen] = useState(false)
  const [clarifyEmail, setClarifyEmail] = useState('ap@abcsupplies.com')
  const [clarifyMessage, setClarifyMessage] = useState('')
  const [clarifyInvalid, setClarifyInvalid] = useState(false)

  const [toastMessage, setToastMessage] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const toastTimer = useRef(null)

  const [invoices, setInvoices] = useState([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [invoicesError, setInvoicesError] = useState(null)
  const [invoicesReloadToken, setInvoicesReloadToken] = useState(0)

  const [voucherPending, setVoucherPending] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') closeClarificationModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const records = await fetchInvoiceRecords()
        if (cancelled) return
        setInvoices(records)
        setInvoicesError(null)
      } catch (err) {
        if (cancelled) return
        setInvoicesError(err.message || 'Failed to load invoice records')
      } finally {
        if (!cancelled) setInvoicesLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [invoicesReloadToken])

  function retryLoadInvoices() {
    setInvoicesLoading(true)
    setInvoicesError(null)
    setInvoicesReloadToken((t) => t + 1)
  }

  function showToast(message) {
    setToastMessage(message)
    setToastShow(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastShow(false), 3200)
  }

  function handleLogin({ userId: id, token }) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, id)
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
    setUserId(id)
    setAuthToken(token)
    setSessionExpired(false)
  }

  function handleLogout() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    setUserId('')
    setAuthToken('')
  }

  function showQueueView(view) {
    setCurrentView(view)
    setLastListView(view)
    setSelectedInvoiceId(null)
  }

  function openInvoiceDetail(id) {
    setSelectedInvoiceId(id)
  }

  function handleBack() {
    setSelectedInvoiceId(null)
  }

  function applyQuickFilter(key, label) {
    if (activeFlagFilter === key) {
      setActiveFlagFilter(null)
      showToast('Filter cleared')
      return
    }
    setActiveFlagFilter(key)
    if (currentView === 'dashboard') showQueueView('queue')
    showToast(`Filtering by: ${label}`)
  }

  function applyDateFilter() {
    if (!dateFrom && !dateTo) {
      setDateFilterActive(false)
      showToast('Date filter cleared')
      return
    }
    setDateFilterActive(true)
    showQueueView(lastListView === 'dashboard' ? 'queue' : lastListView)
    showToast(`Filtering by date: ${dateFrom || 'any date'} → ${dateTo || 'any date'}`)
  }

  const filteredRows = useMemo(() => {
    const meta = VIEW_META[currentView]
    let rows = invoices.slice()
    if (meta.filterStatus) rows = rows.filter((i) => i.status === meta.filterStatus)
    if (activeFlagFilter) rows = rows.filter((i) => i.flags.includes(activeFlagFilter))
    if (dateFilterActive) {
      if (dateFrom) rows = rows.filter((i) => i.invoiceDate >= dateFrom)
      if (dateTo) rows = rows.filter((i) => i.invoiceDate <= dateTo)
    }
    const search = queueSearch.trim().toLowerCase()
    if (search) rows = rows.filter((i) => i.invoiceNumber.toLowerCase().includes(search) || i.vendor.toLowerCase().includes(search))
    return rows
  }, [invoices, currentView, activeFlagFilter, dateFilterActive, dateFrom, dateTo, queueSearch])

  const counts = useMemo(
    () => ({
      queue: invoices.length,
      inreview: invoices.filter((i) => i.status === 'review').length,
      exceptions: invoices.filter((i) => i.status === 'exception').length,
      processed: invoices.filter((i) => i.status === 'processed').length,
    }),
    [invoices],
  )

  const quickFilterCounts = useMemo(() => {
    const result = {}
    QUICK_FILTERS.forEach((f) => {
      result[f.key] = invoices.filter((i) => i.flags.includes(f.key)).length
    })
    return result
  }, [invoices])

  const selectedInvoice = selectedInvoiceId ? invoices.find((i) => i.id === selectedInvoiceId) : null

  // Reset the editable line items/charges whenever a different invoice is opened.
  // Adjusting state during render (rather than in an effect) avoids an extra render pass —
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [lineItemsLoadedFor, setLineItemsLoadedFor] = useState(null)
  if (selectedInvoiceId !== lineItemsLoadedFor) {
    setLineItemsLoadedFor(selectedInvoiceId)
    setLineItems(mapLineItemsFromInvoice(selectedInvoice))
    setCharges(mapChargesFromInvoice(selectedInvoice))
  }

  function updateLineItem(i, field, value) {
    const numericField = field === 'qty' || field === 'price'
    setLineItems((items) =>
      items.map((it, idx) => (idx === i ? { ...it, [field]: numericField ? parseFloat(value) || 0 : value } : it)),
    )
  }

  function updateCharge(i, field, value) {
    setCharges((items) =>
      items.map((c, idx) => (idx === i ? { ...c, [field]: field === 'inv' ? parseFloat(value) || 0 : value } : c)),
    )
  }
  function removeCharge(i) {
    setCharges((items) => items.filter((_, idx) => idx !== i))
  }
  function addCharge() {
    setCharges((items) => [
      ...items,
      { type: 'New Charge', desc: 'Description', inv: 0, po: 0, allocate: 'Both POs', account: '— Select account —', status: 'review' },
    ])
  }

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || chatPending) return
    setChatMessages((msgs) => [...msgs, { role: 'user', text: trimmed }])
    setChatInput('')
    setChatPending(true)
    try {
      const promptWithContext = buildInvoiceContextPrompt(selectedInvoice, trimmed)
      const { answer, conversationId: nextConversationId } = await askAssistant(promptWithContext, authToken, conversationId)
      if (nextConversationId) setConversationId(nextConversationId)
      setChatMessages((msgs) => [...msgs, { role: 'bot', text: answer }])
    } catch (err) {
      if (err.status === 401) {
        setSessionExpired(true)
        handleLogout()
        return
      }
      setChatMessages((msgs) => [
        ...msgs,
        { role: 'bot', text: "Sorry, I couldn't reach the AI assistant right now. Please try again." },
      ])
    } finally {
      setChatPending(false)
    }
  }

  async function handleCreateVoucher() {
    if (!selectedInvoice || voucherPending || selectedInvoice.status === 'processed' || hasMissingItemNumbers) return
    setVoucherPending(true)
    try {
      const payload = buildVoucherPayload(selectedInvoice, lineItems)
      const response = await createVoucher(payload)
      const voucherNumber = extractVoucherNumber(response)
      const extraPdfFields = voucherNumber ? { voucher_number: voucherNumber } : {}

      let statusSaved = true
      try {
        await updatePurchaseOrderStatus(selectedInvoice, 'VOUCHER_CREATED', extraPdfFields)
      } catch {
        statusSaved = false
      }

      // Only line items the user actually resolved via a suggested match carry a
      // crossref pair — persist those so the same supplier/item combo auto-resolves
      // next time. This runs after voucher creation succeeds, per the given rule.
      const confirmedMatches = lineItems.filter((item) => item.crossrefSupplierItemNumber && item.crossrefAssignedItemNumber)
      let crossrefSaved = true
      if (confirmedMatches.length > 0) {
        try {
          await Promise.all(
            confirmedMatches.map((item) =>
              saveItemCrossref({
                supplierNumber: Number(selectedInvoice.vendorId),
                itemNumber: item.crossrefSupplierItemNumber,
                assignedItemNumber: item.crossrefAssignedItemNumber,
                confirmedBy: userId,
              }),
            ),
          )
        } catch {
          crossrefSaved = false
        }
      }

      setInvoices((items) =>
        items.map((i) =>
          i.id === selectedInvoice.id
            ? {
                ...i,
                status: 'processed',
                voucherNumber: voucherNumber || i.voucherNumber,
                raw: { ...i.raw, pdf_fields: { ...i.raw.pdf_fields, status: 'VOUCHER_CREATED', ...extraPdfFields } },
              }
            : i,
        ),
      )

      const warnings = []
      if (!statusSaved) warnings.push('status sync failed')
      if (!crossrefSaved) warnings.push('item cross-reference sync failed')

      showToast(
        warnings.length === 0
          ? `Voucher created for ${selectedInvoice.invoiceNumber}`
          : `Voucher created for ${selectedInvoice.invoiceNumber}, but ${warnings.join(' and ')} — a refresh may show stale data`,
      )
    } catch (err) {
      showToast(err.message || 'Failed to create voucher')
    } finally {
      setVoucherPending(false)
    }
  }

  function openClarificationModal() {
    const invId = selectedInvoice?.invoiceNumber || ''
    setClarifyMessage(
      `Hi, we're reviewing invoice ${invId} and need clarification on the freight charge — the invoiced amount is $25 over the matching PO. Could you confirm the correct amount? Thanks.`,
    )
    setClarifyOpen(true)
  }
  function closeClarificationModal() {
    setClarifyOpen(false)
    setClarifyInvalid(false)
  }
  function sendClarification() {
    const email = clarifyEmail.trim()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setClarifyInvalid(true)
      return
    }
    closeClarificationModal()
    showToast(`Clarification request sent to ${email}`)
  }

  const pageTitle = selectedInvoice ? 'Invoice Review & Approval' : VIEW_META[currentView].title
  const badge = selectedInvoice ? { label: STATUS_META[selectedInvoice.status].label, status: selectedInvoice.status } : null
  const hasMissingItemNumbers = lineItems.some((item) => !isItemNumberResolved(item))

  if (!userId) {
    return <LoginPage onLogin={handleLogin} sessionExpired={sessionExpired} />
  }

  return (
    <div className="app">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        currentView={currentView}
        onNavigate={showQueueView}
        counts={counts}
        activeFlagFilter={activeFlagFilter}
        onQuickFilter={applyQuickFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApplyDateFilter={applyDateFilter}
        onAnalyticsClick={() => showToast('Analytics is not part of this prototype yet')}
        quickFilterCounts={quickFilterCounts}
        userId={userId}
        onLogout={handleLogout}
      />

      <div className="main">
        <Topbar
          pageTitle={pageTitle}
          badge={badge}
          showBack={!!selectedInvoice}
          onBack={handleBack}
          showDetailActions={!!selectedInvoice}
          onRequestClarification={openClarificationModal}
          onCreateVoucher={handleCreateVoucher}
          voucherPending={voucherPending}
          voucherCreated={selectedInvoice?.status === 'processed'}
          missingItemNumbers={hasMissingItemNumbers}
          onCloseInvoice={() => showToast(`${selectedInvoice.invoiceNumber} closed`)}
        />

        {selectedInvoice ? (
          <DetailScreen
            invoice={selectedInvoice}
            userId={userId}
            lineItems={lineItems}
            charges={charges}
            onUpdateLineItem={updateLineItem}
            onUpdateCharge={updateCharge}
            onRemoveCharge={removeCharge}
            onAddCharge={addCharge}
            chatMessages={chatMessages}
            chatInput={chatInput}
            chatPending={chatPending}
            onChatInputChange={setChatInput}
            onSendChat={() => sendMessage(chatInput)}
          />
        ) : (
          <QueueScreen
            showStatCards={currentView === 'dashboard'}
            counts={counts}
            search={queueSearch}
            onSearchChange={setQueueSearch}
            rows={filteredRows}
            onNavigate={showQueueView}
            onSelectInvoice={openInvoiceDetail}
            loading={invoicesLoading}
            error={invoicesError}
            onRetry={retryLoadInvoices}
          />
        )}
      </div>

      <ClarificationModal
        open={clarifyOpen}
        invoiceNum={selectedInvoice?.invoiceNumber || ''}
        email={clarifyEmail}
        message={clarifyMessage}
        emailInvalid={clarifyInvalid}
        onEmailChange={(v) => { setClarifyEmail(v); setClarifyInvalid(false) }}
        onMessageChange={setClarifyMessage}
        onClose={closeClarificationModal}
        onSend={sendClarification}
      />

      <Toast message={toastMessage} show={toastShow} />
    </div>
  )
}
