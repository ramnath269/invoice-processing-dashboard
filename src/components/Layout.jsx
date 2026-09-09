import { useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Toast from './Toast'
import { QUICK_FILTERS } from '../data/invoices'
import { fetchInvoiceRecords } from '../api/records'

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

export default function Layout({ userId, authToken, onLogout, onSessionExpired }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const currentView = searchParams.get('view') || 'dashboard'
  const activeFlagFilter = searchParams.get('flag')

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return toISODate(d)
  })
  const [dateTo, setDateTo] = useState(() => toISODate(new Date()))

  const [toastMessage, setToastMessage] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const toastTimer = useRef(null)

  function showToast(message) {
    setToastMessage(message)
    setToastShow(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastShow(false), 3200)
  }

  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    error: invoicesErrorObj,
    refetch: refetchInvoices,
  } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoiceRecords })
  const invoicesError = invoicesErrorObj?.message || null

  const counts = useMemo(
    () => ({
      // Excludes exceptions - they're only ever counted/shown under Exceptions.
      queue: invoices.filter((i) => i.status !== 'exception').length,
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

  function navigateToInvoices(params) {
    const qs = params.toString()
    navigate(`/invoices${qs ? `?${qs}` : ''}`)
  }

  function onNavigate(view) {
    const params = new URLSearchParams(searchParams)
    params.set('view', view)
    navigateToInvoices(params)
  }

  function onQuickFilter(key, label) {
    const params = new URLSearchParams(searchParams)
    if (activeFlagFilter === key) {
      params.delete('flag')
      showToast('Filter cleared')
    } else {
      params.set('flag', key)
      showToast(`Filtering by: ${label}`)
    }
    params.set('view', currentView === 'dashboard' ? 'queue' : currentView)
    navigateToInvoices(params)
  }

  function onApplyDateFilter() {
    const params = new URLSearchParams(searchParams)
    if (!dateFrom && !dateTo) {
      params.delete('from')
      params.delete('to')
      showToast('Date filter cleared')
    } else {
      if (dateFrom) params.set('from', dateFrom)
      else params.delete('from')
      if (dateTo) params.set('to', dateTo)
      else params.delete('to')
      showToast(`Filtering by date: ${dateFrom || 'any date'} → ${dateTo || 'any date'}`)
    }
    params.set('view', currentView === 'dashboard' ? 'queue' : currentView)
    navigateToInvoices(params)
  }

  return (
    <div className="app">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        currentView={currentView}
        onNavigate={onNavigate}
        counts={counts}
        activeFlagFilter={activeFlagFilter}
        onQuickFilter={onQuickFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApplyDateFilter={onApplyDateFilter}
        onAnalyticsClick={() => showToast('Analytics is not part of this prototype yet')}
        quickFilterCounts={quickFilterCounts}
        userId={userId}
        onLogout={onLogout}
      />

      <div className="main">
        <Outlet
          context={{
            invoices,
            invoicesLoading,
            invoicesError,
            refetchInvoices,
            counts,
            showToast,
            userId,
            authToken,
            onSessionExpired,
          }}
        />
      </div>

      <Toast message={toastMessage} show={toastShow} />
    </div>
  )
}
