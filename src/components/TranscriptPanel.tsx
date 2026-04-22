import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSession } from '../store/sessionStore'
import { transcribeAudio } from '../lib/groq'

type Status = 'IDLE' | 'RECORDING' | 'TRANSCRIBING'

export default function TranscriptPanel() {
  const { state, dispatch } = useSession()
  const settings = state.settings
  const [status, setStatus] = useState<Status>('IDLE')
  const [liveText, setLiveText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(new Set<string>())

  const handleChunk = useCallback(async (blob: Blob) => {
    const chunkId = `${blob.size}-${Date.now()}`
    if (processingRef.current.has(chunkId)) return
    processingRef.current.add(chunkId)

    if (!settings.groqApiKey) {
      processingRef.current.delete(chunkId)
      return
    }
    setStatus('TRANSCRIBING')
    try {
      const text = await transcribeAudio(blob, settings.groqApiKey)
      if (text && text.trim().length > 0) {
        dispatch({
          type: 'ADD_TRANSCRIPT_CHUNK',
          payload: {
            id: crypto.randomUUID(),
            text: text.trim(),
            timestamp: Date.now(),
          },
        })
      }
    } catch (e) {
      console.error('Transcription error:', e)
    } finally {
      processingRef.current.delete(chunkId)
      setStatus('RECORDING')
    }
  }, [settings.groqApiKey, dispatch])

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recorderError,
  } = useAudioRecorder(handleChunk)

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording()
      dispatch({ type: 'SET_RECORDING', payload: false })
      setStatus('IDLE')
    } else {
      await startRecording()
      if (!recorderError) {
        dispatch({ type: 'SET_RECORDING', payload: true })
        setStatus('RECORDING')
      }
    }
  }

  // Auto-scroll when new chunk arrives or live text changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.transcriptChunks.length, liveText])

  // SpeechRecognition for live display text (display-only, does not affect Whisper)
  useEffect(() => {
    if (!isRecording) {
      setLiveText('')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: (new () => any) | undefined = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript
      }
      setLiveText(interim)
    }

    recognition.onerror = () => {}
    recognition.onend = () => { try { recognition.start() } catch { /* ignore */ } }
    try { recognition.start() } catch { /* ignore */ }

    return () => {
      recognition.onend = null
      recognition.onresult = null
      try { recognition.abort() } catch { /* ignore */ }
      setLiveText('')
    }
  }, [isRecording])

  useEffect(() => {
    if (!isRecording) {
      setLiveText('')
    }
  }, [isRecording])

  const micBg = isRecording ? '#dc2626' : '#1e2d3d'
  const wordCount = state.transcriptChunks.reduce(
    (sum, c) => sum + c.text.trim().split(/\s+/).filter(Boolean).length, 0
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Mic button section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 20px',
        gap: '12px',
        borderBottom: '1px solid #1e2d3d',
        flexShrink: 0,
      }}>
        {/* Mic button with pulse rings */}
        <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isRecording && (
            <>
              {[112, 96, 80].map((size, i) => (
                <div key={size} style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  backgroundColor: '#60a5fa',
                  opacity: 0.04 + i * 0.03,
                  animation: `ringPulse 2s ease-out ${i * 0.3}s infinite`,
                  pointerEvents: 'none',
                }} />
              ))}
            </>
          )}
          <button
            onClick={handleToggle}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: micBg,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              transition: 'background-color 0.2s',
              flexShrink: 0,
              animation: isRecording ? 'micPulse 1.5s ease-out infinite' : 'none',
            }}
          >
            {recorderError ? <MicOff size={26} color="#fff" /> : <Mic size={26} color="#fff" />}
          </button>
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {status === 'TRANSCRIBING' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#0d1117',
              border: '1px solid #1e2d3d',
              borderRadius: '20px',
              padding: '3px 10px 3px 7px',
            }}>
              <Loader2 size={11} color="#9ca3af" style={{ animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Transcribing…</span>
            </div>
          ) : (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: status === 'IDLE' ? '#64748b' : '#dc2626',
            }}>
              {status}
            </span>
          )}
        </div>

        {recorderError && (
          <span style={{ fontSize: '11px', color: '#ef4444', textAlign: 'center', maxWidth: '200px' }}>
            {recorderError}
          </span>
        )}
      </div>

      {/* Scrollable transcript area */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '16px',
      }}>
        {state.transcriptChunks.length === 0 && !isRecording && (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            No transcript yet — start the mic.
          </div>
        )}

        {state.transcriptChunks.map(chunk => (
          <div key={chunk.id} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
              {new Date(chunk.timestamp).toTimeString().slice(0, 8)}
            </div>
            <p style={{ margin: 0, color: '#f1f5f9', lineHeight: 1.6 }}>
              {chunk.text}
            </p>
          </div>
        ))}

        {liveText && (
          <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
            • {liveText}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Word count footer */}
      {state.transcriptChunks.length > 0 && (
        <div style={{
          flexShrink: 0,
          padding: '6px 16px',
          borderTop: '1px solid #1e2028',
          fontSize: '10px',
          color: '#64748b',
          fontVariantNumeric: 'tabular-nums',
        }}>
          ~{wordCount.toLocaleString()} words
        </div>
      )}

      <style>{`
        @keyframes micPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          70%  { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
