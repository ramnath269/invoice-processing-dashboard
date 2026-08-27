const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL

export async function askAssistant(prompt, token, conversationId) {
  if (!CHAT_SERVER_URL) {
    throw new Error('VITE_CHAT_SERVER_URL is not configured')
  }
  if (!token) {
    throw new Error('Not signed in')
  }
  const res = await fetch(`${CHAT_SERVER_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, conversation_id: conversationId || null }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : Array.isArray(data.detail) ? data.detail[0]?.msg : null
    const err = new Error(detail || `Assistant request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return {
    answer: data.response || "I couldn't find an answer to that.",
    conversationId: data.conversation_id || null,
  }
}
