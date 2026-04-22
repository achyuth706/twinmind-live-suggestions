import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from '../store/sessionStore'
import { generateSuggestions } from '../lib/groq'

const INTERVAL_SECONDS = 30

export function useSuggestions(): {
  isLoading: boolean
  countdown: number
  error: string | null
  refresh: () => void
} {
  const { state, dispatch } = useSession()
  const settings = state.settings
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(INTERVAL_SECONDS)
  const [error, setError] = useState<string | null>(null)

  const isLoadingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (isLoadingRef.current) return
    if (!state.transcriptChunks?.length) return
    if (!settings.groqApiKey) {
      setError('No API key set. Open Settings (⚙) and enter your Groq API key.')
      return
    }

    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    const fullText = state.transcriptChunks.map(c => c.text).join(' ')
    const words = fullText.split(/\s+/).filter(Boolean)
    const context = words.slice(-(settings.suggestionContextWords || 300)).join(' ')

    try {
      const batchId = crypto.randomUUID()
      const previousPreviews = state.suggestionBatches.length > 0
        ? state.suggestionBatches[0].cards.map(c => c.preview)
        : []
      const cards = await generateSuggestions(
        context,
        settings.groqApiKey,
        settings.suggestionPrompt,
        previousPreviews,
        batchId,
      )
      dispatch({
        type: 'ADD_SUGGESTION_BATCH',
        payload: { id: batchId, cards, timestamp: Date.now() },
      })
    } catch (e) {
      console.error('Suggestion generation failed:', e)
      // Don't set error state for empty responses — just skip silently
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
      setCountdown(INTERVAL_SECONDS)
    }
  }, [state.transcriptChunks, settings, dispatch])

  // Keep refreshRef current so the interval always calls the latest version
  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!state.isRecording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setCountdown(INTERVAL_SECONDS)
      return
    }

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          refreshRef.current()
          return INTERVAL_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isRecording])

  return { isLoading, countdown, error, refresh }
}
