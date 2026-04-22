import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useSession } from './store/sessionStore'
import { useSettings } from './hooks/useSettings'
import SettingsModal from './components/SettingsModal'
import TranscriptPanel from './components/TranscriptPanel'
import SuggestionsPanel from './components/SuggestionsPanel'
import ChatPanel from './components/ChatPanel'
import ExportButton from './components/ExportButton'
import type { SuggestionCard } from './lib/types'

function ColHeader({ title, badge, badgeColor = '#4b5563' }: {
  title: string
  badge: string
  badgeColor?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        backgroundColor: '#080c14',
        borderBottom: '1px solid #1e2d3d',
        flexShrink: 0,
        height: '44px',
      }}
    >
      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
        {title}
      </span>
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: badgeColor }}>
        {badge}
      </span>
    </div>
  )
}

export default function App() {
  const { state } = useSession()
  useSettings()
  const batchCount = state.suggestionBatches.length
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('twinmind_settings')
    if (!saved) return true
    try {
      const parsed = JSON.parse(saved) as { groqApiKey?: string }
      return !parsed.groqApiKey || parsed.groqApiKey.trim() === ''
    } catch {
      return true
    }
  })
const [settingsHovered, setSettingsHovered] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  function handleCardClick(card: SuggestionCard) {
    setPendingMessage(card.preview)
  }

  useEffect(() => {
    const saved = localStorage.getItem('twinmind_settings')
    if (!saved) {
      setIsSettingsOpen(true)
      return
    }
    try {
      const parsed = JSON.parse(saved)
      if (!parsed.groqApiKey || parsed.groqApiKey.trim() === '') {
        setIsSettingsOpen(true)
      }
    } catch {
      setIsSettingsOpen(true)
    }
  }, [])

  const recBadge = state.isRecording ? 'Recording' : 'Idle'
  const recBadgeColor = state.isRecording ? '#ef4444' : '#4b5563'
  const batchBadge = `${batchCount} ${batchCount === 1 ? 'Batch' : 'Batches'}`

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#080c14', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Premium gradient top border */}
      <div style={{ height: '3px', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', flexShrink: 0 }} />

      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: '3px',
          left: 0,
          right: 0,
          height: '44px',
          backgroundColor: '#0d1117',
          borderBottom: '1px solid #1e2d3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 40,
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.02em' }}>
          TwinMind
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExportButton />

        <button
          onClick={() => setIsSettingsOpen(true)}
          onMouseEnter={() => setSettingsHovered(true)}
          onMouseLeave={() => setSettingsHovered(false)}
          aria-label="Open settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: settingsHovered ? '#1e2d3d' : 'transparent',
            border: `1px solid ${settingsHovered ? '#1e2d3d' : 'transparent'}`,
            borderRadius: '6px',
            color: settingsHovered ? '#60a5fa' : '#6b7280',
            fontSize: '12px',
            padding: '5px 10px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Settings size={13} />
          Settings
        </button>
        </div>
      </div>

      {/* Columns — pushed down below the gradient bar + top bar (3px + 44px) */}
      <div style={{ display: 'flex', width: '100%', height: '100%', paddingTop: '47px', boxSizing: 'border-box', minWidth: 0 }}>

        {/* Left column */}
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #1e2d3d', overflow: 'hidden' }}>
          <ColHeader title="1. Mic & Transcript" badge={recBadge} badgeColor={recBadgeColor} />
          <div style={{ flex: 1, minHeight: 0 }}>
            <TranscriptPanel />
          </div>
        </div>

        {/* Middle column */}
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #1e2d3d', overflow: 'hidden' }}>
          <ColHeader title="2. Live Suggestions" badge={batchBadge} />
          <div style={{ flex: 1, minHeight: 0 }}>
            <SuggestionsPanel onSuggestionClick={handleCardClick} />
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <ColHeader title="3. Chat (Detailed Answers)" badge="Session-only" />
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatPanel pendingMessage={pendingMessage} onPendingConsumed={() => setPendingMessage(null)} />
          </div>
        </div>

      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
