const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL

// btoa() only handles Latin1/binary strings; this detour through
// encodeURIComponent keeps non-ASCII passwords from throwing.
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

export async function login(username, password, environment) {
  if (!CHAT_SERVER_URL) {
    throw new Error('VITE_CHAT_SERVER_URL is not configured')
  }
  const res = await fetch(`${CHAT_SERVER_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: toBase64(password), environment }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail[0]?.msg : null
    throw new Error(detail || `Sign-in failed (${res.status})`)
  }
  return { username: data.username, token: data.session_token, environment: data.environment }
}
