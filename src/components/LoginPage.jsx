import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons/icons'
import { login } from '../api/auth'

const ENVIRONMENT_STORAGE_KEY = 'apSmartFlowEnvironment'

export default function LoginPage({ onLogin, sessionExpired }) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [environment, setEnvironment] = useState(() => localStorage.getItem(ENVIRONMENT_STORAGE_KEY) || '')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId.trim() || !password.trim() || !environment.trim()) {
      setError('Enter your user ID, password, and environment.')
      return
    }
    setError('')
    setPending(true)
    try {
      const result = await login(userId.trim(), password, environment.trim())
      localStorage.setItem(ENVIRONMENT_STORAGE_KEY, result.environment || environment.trim())
      onLogin({ userId: result.username, token: result.token })
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-brand">
          <div className="mark">AP</div>
          <div className="login-brand-text">
            <div className="name">AP SmartFlow AI</div>
            <div className="sub">Accounts Payable</div>
          </div>
        </div>
        <div className="login-tagline">Invoice Review &amp; Approval</div>
        <p className="login-blurb">
          AI-assisted invoice matching, exception review, and voucher creation for your accounts payable team.
        </p>
      </div>

      <div className="login-form-wrap">
        <div className="login-card">
          <h1>Sign In</h1>
          <p className="login-card-sub">Enter your credentials to continue</p>

          {sessionExpired && (
            <div className="login-notice">Your session has expired. Please sign in again.</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>User ID</label>
              <div className="input-wrap">
                <input
                  type="text"
                  placeholder="e.g. ashetty"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={pending}
                  autoFocus
                />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div className="field">
              <label>Environment</label>
              <div className="input-wrap">
                <input
                  type="text"
                  placeholder="e.g. AOC_Current"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  disabled={pending}
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn primary login-submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-hint">Sign in with your JD Edwards credentials.</div>
        </div>
      </div>
    </div>
  )
}
