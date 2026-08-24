import { SendIcon } from '../icons/icons'
import { SUGGESTED_PROMPTS } from '../data/invoices'

export default function AiPanel({ messages, chatInput, chatPending, onChatInputChange, onSend, onAskPrompt }) {
  return (
    <div className="ai-panel">
      <div className="ai-head">
        <div className="ai-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
          </svg>
        </div>
        <div className="ai-title">AI Assistant</div>
        <div className="spacer"></div>
        <button className="icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
      <div className="ai-tabs">
        <div className="ai-tab active">Chat</div>
        <div className="ai-tab">Invoice Insights</div>
      </div>
      <div className="ai-chat">
        <div className="msg bot">Hi Ashok, I'm your AP AI Assistant. How can I help you with this invoice?</div>
        <div className="suggested">
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p} onClick={() => onAskPrompt(p)} disabled={chatPending}>{p}</button>
          ))}
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
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
