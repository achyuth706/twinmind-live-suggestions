import { RefreshCw } from 'lucide-react'
import { useSession } from '../store/sessionStore'
import { useSuggestions } from '../hooks/useSuggestions'
import SuggestionCard from './SuggestionCard'
import type { SuggestionCard as SuggestionCardType } from '../lib/types'

interface Props {
  onSuggestionClick: (card: SuggestionCardType) => void
}

function formatHHMMSS(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: '#0d1117',
        border: '1px solid #1e2d3d',
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'skeletonPulse 1.4s ease-in-out infinite',
      }}
    >
      <div style={{ height: '18px', width: '90px', backgroundColor: '#1e2d3d', borderRadius: '10px' }} />
      <div style={{ height: '13px', width: '100%', backgroundColor: '#1e2d3d', borderRadius: '4px' }} />
      <div style={{ height: '13px', width: '75%', backgroundColor: '#1e2d3d', borderRadius: '4px' }} />
      <div style={{ height: '10px', width: '36px', backgroundColor: '#1e2d3d', borderRadius: '4px', alignSelf: 'flex-end' }} />
    </div>
  )
}

export default function SuggestionsPanel({ onSuggestionClick }: Props) {
  const { state } = useSession()
  const { isLoading, countdown, error, refresh } = useSuggestions()

  const batches = state.suggestionBatches
  const showCountdown = state.isRecording

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #1e2d3d',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: '1px solid #1e2d3d',
            borderRadius: '6px',
            color: isLoading ? '#64748b' : '#94a3b8',
            fontSize: '12px',
            padding: '5px 10px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.borderColor = '#3b82f6' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2d3d' }}
        >
          <RefreshCw
            size={12}
            style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }}
          />
          Reload suggestions
        </button>

        {showCountdown && (
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            auto-refresh in {countdown}s
          </span>
        )}
      </div>

      {/* Loading bar */}
      {isLoading && batches.length > 0 && (
        <div style={{ height: '2px', backgroundColor: '#1e2d3d', flexShrink: 0 }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#3b82f6',
              animation: 'loadingBar 1.2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '8px 14px',
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          fontSize: '11px',
          color: '#f87171',
          flexShrink: 0,
        }}>
          {error}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Empty state */}
        {!isLoading && batches.length === 0 && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            Suggestions appear here once recording starts.
          </div>
        )}

        {/* Skeleton cards */}
        {isLoading && batches.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Batches */}
        {batches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {batches.map((batch, batchIndex) => (
              <div key={batch.id}>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginBottom: '8px',
                    letterSpacing: '0.04em',
                  }}
                >
                  Batch at {formatHHMMSS(batch.timestamp)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {batch.cards.map(card => (
                    <SuggestionCard
                      key={card.id}
                      card={card}
                      isLatestBatch={batchIndex === 0}
                      onClick={onSuggestionClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes loadingBar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
