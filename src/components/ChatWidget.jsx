import { useEffect, useRef, useState } from 'react'
import AiPanel from './AiPanel'
import { SparkleIcon } from '../icons/icons'

export default function ChatWidget({ userId, messages, chatInput, chatPending, onChatInputChange, onSend }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const seenCount = useRef(messages.length)

  useEffect(() => {
    if (messages.length > seenCount.current) {
      const newMessages = messages.slice(seenCount.current)
      if (!open) {
        setUnread((u) => u + newMessages.filter((m) => m.role === 'bot').length)
      }
    }
    seenCount.current = messages.length
  }, [messages, open])

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => { setOpen(true); setUnread(0) }} title="Open AI Assistant">
        <SparkleIcon />
        {unread > 0 && <span className="chat-fab-badge">{unread}</span>}
      </button>
    )
  }

  return (
    <div className="chat-popup">
      <AiPanel
        userId={userId}
        messages={messages}
        chatInput={chatInput}
        chatPending={chatPending}
        onChatInputChange={onChatInputChange}
        onSend={onSend}
        onMinimize={() => setOpen(false)}
      />
    </div>
  )
}
