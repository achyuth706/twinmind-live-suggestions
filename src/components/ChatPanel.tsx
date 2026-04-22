import { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import { useSession } from '../store/sessionStore'
import { useChat } from '../hooks/useChat'

marked.setOptions({ breaks: true, gfm: true })

interface Props {
  pendingMessage: string | null
  onPendingConsumed: () => void
}

function formatHHMM(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ChatPanel({ pendingMessage, onPendingConsumed }: Props) {
  const { state } = useSession()
  const { isStreaming, sendMessage } = useChat()
  const messages = state.chatMessages
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Consume pendingMessage from suggestion card clicks
  useEffect(() => {
    if (!pendingMessage) return
    onPendingConsumed()
    sendMessage(pendingMessage, true)
  // sendMessage identity is stable (useCallback), onPendingConsumed is a setter — safe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage])

  // Auto-scroll on every new token
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function submit() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage(text)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Info box — only before first message */}
      {messages.length === 0 && (
        <div style={{
          margin: '12px 14px 0',
          padding: '10px 13px',
          backgroundColor: '#0d1117',
          border: '1px solid #1e2d3d',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748b',
          lineHeight: 1.6,
          flexShrink: 0,
        }}>
          Clicking a suggestion adds it to this chat and streams a detailed answer.
          You can also type questions directly.
        </div>
      )}

      {/* Messages area — wrapper gives us the fade overlay without cutting off scroll */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Bottom fade */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          background: 'linear-gradient(to bottom, transparent, #080c14)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      <div style={{ height: '100%', overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            Click a suggestion or type a question below.
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const isLastMsg = i === messages.length - 1
          const showCursor = !isUser && isLastMsg && isStreaming

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  padding: '10px 13px',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  backgroundColor: isUser ? '#1d4ed8' : '#0d1117',
                  border: isUser ? 'none' : '1px solid #1e2d3d',
                  fontSize: '13px',
                  color: '#f1f5f9',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                }}
              >
                {isUser ? (
                  <>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                    {showCursor && (
                      <span style={{ animation: 'blink 1s step-start infinite', marginLeft: '1px' }}>|</span>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      className="chat-markdown"
                      dangerouslySetInnerHTML={{ __html: marked(msg.content) as string }}
                    />
                    {showCursor && (
                      <span style={{ animation: 'blink 1s step-start infinite', marginLeft: '1px' }}>|</span>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', paddingLeft: isUser ? 0 : '4px', paddingRight: isUser ? '4px' : 0 }}>
                {!isUser && (
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>TwinMind</span>
                )}
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {formatHHMM(msg.timestamp)}
                </span>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0d1117',
        borderTop: '1px solid #1e2d3d',
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isStreaming}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f1f5f9',
            fontSize: '13px',
            padding: '12px 16px',
            caretColor: '#60a5fa',
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={isStreaming}
          style={{
            flexShrink: 0,
            margin: '6px 10px 6px 0',
            padding: '6px 14px',
            backgroundColor: isStreaming ? '#1e2d3d' : '#60a5fa',
            color: isStreaming ? '#64748b' : '#080c14',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: isStreaming ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s, color 0.15s',
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
