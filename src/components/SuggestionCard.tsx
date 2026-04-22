import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { SuggestionCard as SuggestionCardType } from '../lib/types'

interface Props {
  card: SuggestionCardType
  isLatestBatch: boolean
  onClick: (card: SuggestionCardType) => void
}

const badgeConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
  question:      { bg: '#1e3a5f', color: '#60a5fa', border: '#2563eb',  label: 'Question to ask' },
  talking_point: { bg: '#2d1b69', color: '#a78bfa', border: '#7c3aed',  label: 'Talking point' },
  answer:        { bg: '#064e3b', color: '#34d399', border: '#059669',  label: 'Answer' },
  fact_check:    { bg: '#451a03', color: '#fb923c', border: '#d97706',  label: 'Fact check' },
  clarification: { bg: '#1e293b', color: '#94a3b8', border: '#475569',  label: 'Clarification' },
}

function formatHHMM(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function SuggestionCard({ card, isLatestBatch, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const badge = badgeConfig[card.type] ?? { bg: '#1e293b', color: '#94a3b8', border: '#475569', label: card.type }

  return (
    <div
      onClick={() => onClick(card)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? '#131920' : '#0d1117',
        border: `1px solid ${hovered ? '#60a5fa' : '#1e2d3d'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        cursor: 'pointer',
        opacity: isLatestBatch ? 1 : 0.45,
        transition: 'border-color 0.15s, background-color 0.15s, opacity 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Type badge */}
      <span
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          backgroundColor: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
          fontSize: '10px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '10px',
        }}
      >
        {badge.label}
      </span>

      {/* Preview text */}
      <p style={{ margin: 0, fontSize: '13px', color: '#f1f5f9', lineHeight: 1.55 }}>
        {card.preview}
      </p>

      {/* Timestamp + arrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
          {formatHHMM(card.timestamp)}
        </span>
        <ChevronRight
          size={14}
          color="#94a3b8"
          style={{
            transform: hovered ? 'translateX(3px)' : 'translateX(0)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  )
}
