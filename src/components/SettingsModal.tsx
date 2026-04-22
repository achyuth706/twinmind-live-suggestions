import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const PANEL_BG = '#13151c'
const BORDER = '1px solid #1e2028'

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '24px',
}

const panel: React.CSSProperties = {
  backgroundColor: PANEL_BG,
  border: BORDER,
  borderRadius: '12px',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
}

const stickyHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 24px',
  borderBottom: BORDER,
  position: 'sticky',
  top: 0,
  backgroundColor: PANEL_BG,
  zIndex: 1,
}

const body: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
}

const sectionStyle: React.CSSProperties = {
  paddingTop: '24px',
  paddingBottom: '24px',
  borderTop: BORDER,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const firstSectionStyle: React.CSSProperties = {
  ...sectionStyle,
  borderTop: 'none',
  paddingTop: '0',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6b7280',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#9ca3af',
  marginBottom: '4px',
}

const inputBase: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0d0f14',
  border: '1px solid #2a2d3a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '13px',
  padding: '8px 12px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'border-color 0.15s',
}

const textareaStyle: React.CSSProperties = {
  ...inputBase,
  resize: 'vertical',
  lineHeight: '1.6',
}

const helperText: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
  marginTop: '4px',
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#6b7280',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
}

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#3b82f6'
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#2a2d3a'
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { settings, updateSettings } = useSettings()

  const [groqApiKey, setGroqApiKey] = useState(settings.groqApiKey)
  const [showKey, setShowKey] = useState(false)
  const [suggestionPrompt, setSuggestionPrompt] = useState(settings.suggestionPrompt)
  const [detailPrompt, setDetailPrompt] = useState(settings.detailPrompt)
  const [chatPrompt, setChatPrompt] = useState(settings.chatPrompt)
  const [suggestionContextWords, setSuggestionContextWords] = useState(settings.suggestionContextWords)
  const [chatContextWords, setChatContextWords] = useState(settings.chatContextWords)
  const [saveHover, setSaveHover] = useState(false)

  if (!isOpen) return null

  function handleSave() {
    updateSettings({ groqApiKey, suggestionPrompt, detailPrompt, chatPrompt, suggestionContextWords, chatContextWords })
    onClose()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={stickyHeader}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#e5e7eb' }}>Settings</span>
          <button style={iconBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div style={body}>

          {/* Groq API Key */}
          <section style={firstSectionStyle}>
            <div style={sectionTitle}>Groq API Key</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={groqApiKey}
                onChange={e => setGroqApiKey(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="gsk_..."
                style={{ ...inputBase, paddingRight: '40px' }}
                spellCheck={false}
              />
              <button
                style={{ ...iconBtn, position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setShowKey(v => !v)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p style={helperText}>Your key is stored locally and never sent anywhere except Groq.</p>
          </section>

          {/* Prompts */}
          <section style={sectionStyle}>
            <div style={sectionTitle}>Prompts</div>
            <div>
              <label style={labelStyle}>Live Suggestion Prompt</label>
              <textarea
                rows={8}
                value={suggestionPrompt}
                onChange={e => setSuggestionPrompt(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Detailed Answer Prompt</label>
              <textarea
                rows={8}
                value={detailPrompt}
                onChange={e => setDetailPrompt(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                style={textareaStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Chat Prompt</label>
              <textarea
                rows={6}
                value={chatPrompt}
                onChange={e => setChatPrompt(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                style={textareaStyle}
              />
            </div>
          </section>

          {/* Context Windows */}
          <section style={sectionStyle}>
            <div style={sectionTitle}>Context Windows</div>
            <div>
              <label style={labelStyle}>Suggestion context (words)</label>
              <input
                type="number"
                min={50}
                value={suggestionContextWords}
                onChange={e => setSuggestionContextWords(Number(e.target.value))}
                onFocus={onFocus}
                onBlur={onBlur}
                style={inputBase}
              />
            </div>
            <div>
              <label style={labelStyle}>Chat context (words)</label>
              <input
                type="number"
                min={50}
                value={chatContextWords}
                onChange={e => setChatContextWords(Number(e.target.value))}
                onFocus={onFocus}
                onBlur={onBlur}
                style={inputBase}
              />
            </div>
          </section>

          {/* Save */}
          <section style={{ ...sectionStyle, paddingBottom: '0' }}>
            <button
              onClick={handleSave}
              onMouseEnter={() => setSaveHover(true)}
              onMouseLeave={() => setSaveHover(false)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: saveHover ? '#2563eb' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Save
            </button>
          </section>

        </div>
      </div>
    </div>
  )
}
