import { useEffect, useRef } from 'react'
import { SendIcon, SparkleIcon, ChevronDownIcon } from '../icons/icons'
import { parseMessageContent, parseInline } from '../utils/chatMarkdown'

function Inline({ text }) {
  return parseInline(text).map((p, i) => {
    if (p.type === 'bold') return <strong key={i}>{p.content}</strong>
    if (p.type === 'italic') return <em key={i}>{p.content}</em>
    return <span key={i}>{p.content}</span>
  })
}

function MessageContent({ segments }) {
  return segments.map((seg, i) =>
    seg.type === 'table' ? (
      <div className="msg-table-wrap" key={i}>
        <table className="msg-table">
          <thead>
            <tr>{seg.headers.map((h, hi) => <th key={hi}><Inline text={h} /></th>)}</tr>
          </thead>
          <tbody>
            {seg.rows.map((row, ri) => (
              <tr key={ri}>{row.map((cell, ci) => <td key={ci}><Inline text={cell} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p key={i} className="msg-text"><Inline text={seg.content} /></p>
    ),
  )
}

export default function AiPanel({ userId, messages, chatInput, chatPending, onChatInputChange, onSend, onMinimize }) {
  const chatRef = useRef(null)

  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, chatPending])

  return (
    <div className="ai-panel">
      <div className="ai-head">
        <div className="ai-icon">
          <SparkleIcon />
        </div>
        <div className="ai-title">AI Assistant</div>
        <div className="spacer"></div>
        <button className="icon-btn" onClick={onMinimize} title="Close">
          <ChevronDownIcon />
        </button>
      </div>
      <div className="ai-chat" ref={chatRef}>
        <div className="msg bot">Hi {userId}, I'm your AP AI Assistant. How can I help you with this invoice?</div>
        {messages.map((m, i) => {
          if (m.role !== 'bot') {
            return <div key={i} className={`msg ${m.role}`}>{m.text}</div>
          }
          const segments = parseMessageContent(m.text)
          const hasTable = segments.some((s) => s.type === 'table')
          return (
            <div key={i} className={`msg bot${hasTable ? ' has-table' : ''}`}>
              <MessageContent segments={segments} />
            </div>
          )
        })}
        {chatPending && <div className="msg bot pending">Thinking…</div>}
      </div>
      <div className="ai-input-bar">
        <input
          type="text"
          placeholder="Ask anything about this invoice..."
          value={chatInput}
          disabled={chatPending}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSend() }}
        />
        <button onClick={onSend} disabled={chatPending}><SendIcon /></button>
      </div>
      <div className="ai-disclaimer">AI responses may be inaccurate. Verify important information.</div>
    </div>
  )
}
