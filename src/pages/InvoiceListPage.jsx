import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import QueueScreen from '../components/QueueScreen'
import { VIEW_META } from '../data/invoices'

export default function InvoiceListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { invoices, invoicesLoading, invoicesError, refetchInvoices, counts } = useOutletContext()
  const [queueSearch, setQueueSearch] = useState('')

  const view = searchParams.get('view') || 'dashboard'
  const flag = searchParams.get('flag')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const filteredRows = useMemo(() => {
    const meta = VIEW_META[view] || VIEW_META.dashboard
    let rows = invoices.slice()
    // Exception invoices are only ever surfaced in the Exceptions view - every other
    // view (including "everything" views like Dashboard/My Queue, which have no
    // filterStatus of their own) excludes them rather than mixing them into the
    // normal queue.
    if (meta.filterStatus !== 'exception') rows = rows.filter((i) => i.status !== 'exception')
    if (meta.filterStatus) rows = rows.filter((i) => i.status === meta.filterStatus)
    if (flag) rows = rows.filter((i) => i.flags.includes(flag))
    if (from) rows = rows.filter((i) => i.invoiceDate >= from)
    if (to) rows = rows.filter((i) => i.invoiceDate <= to)
    const search = queueSearch.trim().toLowerCase()
    if (search) rows = rows.filter((i) => i.invoiceNumber.toLowerCase().includes(search) || i.vendor.toLowerCase().includes(search))
    return rows
  }, [invoices, view, flag, from, to, queueSearch])

  function onNavigate(nextView) {
    const params = new URLSearchParams(searchParams)
    params.set('view', nextView)
    navigate(`/invoices?${params.toString()}`)
  }

  return (
    <>
      <Topbar pageTitle={(VIEW_META[view] || VIEW_META.dashboard).title} />
      <QueueScreen
        showStatCards={view === 'dashboard'}
        counts={counts}
        search={queueSearch}
        onSearchChange={setQueueSearch}
        rows={filteredRows}
        onNavigate={onNavigate}
        onSelectInvoice={(id) => navigate(`/invoices/${id}`)}
        loading={invoicesLoading}
        error={invoicesError}
        onRetry={refetchInvoices}
      />
    </>
  )
}
