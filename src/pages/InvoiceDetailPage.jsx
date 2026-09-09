import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Topbar from '../components/Topbar'
import DetailScreen from '../components/DetailScreen'
import ClarificationModal from '../components/ClarificationModal'
import { STATUS_META } from '../data/invoices'
import { fetchInvoiceRecord, saveItemCrossref, updatePurchaseOrderStatus } from '../api/records'
import { askAssistant } from '../api/assistant'
import { buildVoucherPayload, createVoucher, extractVoucherNumber } from '../api/voucher'
import { mapLineItemsFromInvoice, mapChargesFromInvoice, isItemNumberResolved } from '../utils/detailMapping'
import { buildInvoiceContextPrompt } from '../utils/chatContext'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId, authToken, onSessionExpired, showToast } = useOutletContext()

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['invoice', id], queryFn: () => fetchInvoiceRecord(id) })

  const [lineItems, setLineItems] = useState([])
  const [charges, setCharges] = useState([])

  // Reset the editable line items/charges whenever a different invoice loads. Adjusting
  // state during render (rather than in an effect) avoids an extra render pass — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [lineItemsLoadedFor, setLineItemsLoadedFor] = useState(null)
  if (invoice && invoice.id !== lineItemsLoadedFor) {
    setLineItemsLoadedFor(invoice.id)
    setLineItems(mapLineItemsFromInvoice(invoice))
    setCharges(mapChargesFromInvoice(invoice))
  }

  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatPending, setChatPending] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  const [clarifyOpen, setClarifyOpen] = useState(false)
  const [clarifyEmail, setClarifyEmail] = useState('ap@abcsupplies.com')
  const [clarifyMessage, setClarifyMessage] = useState('')
  const [clarifyInvalid, setClarifyInvalid] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') closeClarificationModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

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
      const promptWithContext = buildInvoiceContextPrompt(invoice, trimmed)
      const { answer, conversationId: nextConversationId } = await askAssistant(promptWithContext, authToken, conversationId)
      if (nextConversationId) setConversationId(nextConversationId)
      setChatMessages((msgs) => [...msgs, { role: 'bot', text: answer }])
    } catch (err) {
      if (err.status === 401) {
        onSessionExpired()
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

  const voucherMutation = useMutation({
    mutationFn: async () => {
      const payload = buildVoucherPayload(invoice, lineItems)
      const response = await createVoucher(payload)
      const voucherNumber = extractVoucherNumber(response)
      const extraPdfFields = voucherNumber ? { voucher_number: voucherNumber } : {}

      let statusSaved = true
      try {
        await updatePurchaseOrderStatus(invoice, 'VOUCHER_CREATED', extraPdfFields)
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
                supplierNumber: Number(invoice.vendorId),
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

      return { voucherNumber, statusSaved, crossrefSaved }
    },
    onSuccess: ({ statusSaved, crossrefSaved }) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })

      const warnings = []
      if (!statusSaved) warnings.push('status sync failed')
      if (!crossrefSaved) warnings.push('item cross-reference sync failed')

      showToast(
        warnings.length === 0
          ? `Voucher created for ${invoice.invoiceNumber}`
          : `Voucher created for ${invoice.invoiceNumber}, but ${warnings.join(' and ')} — a refresh may show stale data`,
      )
    },
    onError: (err) => {
      showToast(err.message || 'Failed to create voucher')
    },
  })

  function openClarificationModal() {
    const invId = invoice?.invoiceNumber || ''
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

  function handleBack() {
    navigate('/invoices')
  }

  if (isLoading) {
    return (
      <>
        <Topbar pageTitle="Invoice Review & Approval" showBack onBack={handleBack} />
        <div className="queue-empty">Loading invoice…</div>
      </>
    )
  }

  if (error || !invoice) {
    return (
      <>
        <Topbar pageTitle="Invoice Review & Approval" showBack onBack={handleBack} />
        <div className="queue-empty">
          Couldn't load this invoice: {error?.message || 'not found'}
          <div style={{ marginTop: '10px' }}>
            <button className="btn" onClick={() => refetch()}>Retry</button>
          </div>
        </div>
      </>
    )
  }

  const hasMissingItemNumbers = lineItems.some((item) => !isItemNumberResolved(item))
  const badge = { label: STATUS_META[invoice.status].label, status: invoice.status }

  return (
    <>
      <Topbar
        pageTitle="Invoice Review & Approval"
        badge={badge}
        showBack
        onBack={handleBack}
        showDetailActions
        onRequestClarification={openClarificationModal}
        onCreateVoucher={() => voucherMutation.mutate()}
        voucherPending={voucherMutation.isPending}
        voucherCreated={invoice.status === 'processed'}
        missingItemNumbers={hasMissingItemNumbers}
        onCloseInvoice={() => showToast(`${invoice.invoiceNumber} closed`)}
      />

      <DetailScreen
        invoice={invoice}
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

      <ClarificationModal
        open={clarifyOpen}
        invoiceNum={invoice.invoiceNumber}
        email={clarifyEmail}
        message={clarifyMessage}
        emailInvalid={clarifyInvalid}
        onEmailChange={(v) => { setClarifyEmail(v); setClarifyInvalid(false) }}
        onMessageChange={setClarifyMessage}
        onClose={closeClarificationModal}
        onSend={sendClarification}
      />
    </>
  )
}
