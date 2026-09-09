import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import InvoiceListPage from './pages/InvoiceListPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import LoginPage from './components/LoginPage'
import './App.css'

const AUTH_STORAGE_KEY = 'apSmartFlowUserId'
const TOKEN_STORAGE_KEY = 'apSmartFlowToken'

export default function App() {
  const [userId, setUserId] = useState(() => sessionStorage.getItem(AUTH_STORAGE_KEY) || '')
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [sessionExpired, setSessionExpired] = useState(false)

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

  function handleSessionExpired() {
    setSessionExpired(true)
    handleLogout()
  }

  if (!userId) {
    return <LoginPage onLogin={handleLogin} sessionExpired={sessionExpired} />
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route
          path="/"
          element={<Layout userId={userId} authToken={authToken} onLogout={handleLogout} onSessionExpired={handleSessionExpired} />}
        >
          <Route index element={<Navigate to="/invoices" replace />} />
          <Route path="invoices" element={<InvoiceListPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="*" element={<Navigate to="/invoices" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
