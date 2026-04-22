import { useState } from 'react'
import { Download } from 'lucide-react'
import { useSession } from '../store/sessionStore'

function formatHHMMSS(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function filenameTimestamp(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}-${hh}-${min}`
}

export default function ExportButton() {
  const { state } = useSession()
  const [hovered, setHovered] = useState(false)

  const isEmpty = state.transcriptChunks.length === 0 && state.chatMessages.length === 0

  function handleExport() {
    if (isEmpty) return

    const data = {
      exportedAt: new Date().toISOString(),
      session: {
        transcript: state.transcriptChunks.map(c => ({
          timestamp: formatHHMMSS(c.timestamp),
          text: c.text,
        })),
        suggestionBatches: state.suggestionBatches.map(b => ({
          batchTimestamp: formatHHMMSS(b.timestamp),
          suggestions: b.cards.map(c => ({ type: c.type, preview: c.preview })),
        })),
        chat: state.chatMessages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: formatHHMMSS(m.timestamp),
        })),
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `twinmind-session-${filenameTimestamp()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isEmpty}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Export session"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: hovered && !isEmpty ? '#1e2028' : 'transparent',
        border: `1px solid ${hovered && !isEmpty ? '#2a2d3a' : 'transparent'}`,
        borderRadius: '6px',
        color: isEmpty ? '#374151' : hovered ? '#e5e7eb' : '#6b7280',
        fontSize: '12px',
        padding: '5px 10px',
        cursor: isEmpty ? 'not-allowed' : 'pointer',
        opacity: isEmpty ? 0.45 : 1,
        transition: 'all 0.15s',
      }}
    >
      <Download size={13} />
      Export
    </button>
  )
}
