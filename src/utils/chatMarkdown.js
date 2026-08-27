function isSeparatorRow(line) {
  const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c))
}

function splitRow(line) {
  let trimmed = line.trim()
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1)
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1)
  return trimmed.split('|').map((c) => c.trim())
}

// Splits chat text into alternating text/table segments so a markdown table
// embedded in an AI response can be rendered as a real <table> instead of
// showing up as literal pipe characters.
export function parseMessageContent(text) {
  const lines = text.split('\n')
  const segments = []
  let textBuffer = []
  let i = 0

  function flushText() {
    const content = textBuffer.join('\n').trim()
    if (content) segments.push({ type: 'text', content })
    textBuffer = []
  }

  while (i < lines.length) {
    const line = lines[i]
    const nextLine = lines[i + 1]
    if (line.includes('|') && line.trim() !== '' && nextLine && isSeparatorRow(nextLine)) {
      flushText()
      const headers = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i]))
        i++
      }
      segments.push({ type: 'table', headers, rows })
    } else {
      textBuffer.push(line)
      i++
    }
  }
  flushText()
  return segments.length ? segments : [{ type: 'text', content: text }]
}

// **bold** and *italic* only — deliberately skips __bold__/_italic_ since
// underscore emphasis collides too easily with snake_case identifiers,
// account numbers, etc. that show up in AP chat responses.
const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*/g

export function parseInline(text) {
  const parts = []
  let lastIndex = 0
  let match
  INLINE_PATTERN.lastIndex = 0
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) {
      parts.push({ type: 'bold', content: match[1] })
    } else {
      parts.push({ type: 'italic', content: match[2] })
    }
    lastIndex = INLINE_PATTERN.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  return parts.length ? parts : [{ type: 'text', content: text }]
}
