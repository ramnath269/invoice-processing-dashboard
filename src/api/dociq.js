const DOCIQ_ASK_URL = 'https://invprocessing.duckdns.org/dociq/ask/'

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return []
  return sources.map((s) => {
    if (typeof s === 'string') return s
    return s?.name || s?.title || s?.file || s?.file_path || JSON.stringify(s)
  })
}

export async function askDocIQ(question) {
  const res = await fetch(DOCIQ_ASK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) {
    throw new Error(`DocIQ request failed (${res.status})`)
  }
  const data = await res.json()
  return {
    answer: data.answer || "I couldn't find an answer to that.",
    sources: normalizeSources(data.sources),
  }
}
