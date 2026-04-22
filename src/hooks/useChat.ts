import { useState, useCallback } from 'react'
import { useSession } from '../store/sessionStore'
import { streamChatAnswer } from '../lib/groq'

function getRecentContext(chunks: { text: string }[], maxWords: number): string {
  const words = chunks.map(c => c.text).join(' ').trim().split(/\s+/)
  return words.slice(-maxWords).join(' ')
}

export function useChat(): {
  isStreaming: boolean
  sendMessage: (text: string, isFromSuggestion?: boolean) => Promise<void>
} {
  const { state, dispatch } = useSession()
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (text: string, isFromSuggestion = false) => {
    const apiKey = state.settings.groqApiKey
    if (!apiKey) return

    const transcriptContext = state.transcriptChunks.length > 0
      ? getRecentContext(state.transcriptChunks, state.settings.chatContextWords)
      : 'No transcript yet - session just started'

    // Snapshot history before appending new messages
    const chatHistory = state.chatMessages

    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() },
    })

    const assistantId = crypto.randomUUID()
    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
    })

    setIsStreaming(true)
    let accumulated = ''

    const systemPrompt = isFromSuggestion
      ? state.settings.detailPrompt.replace('{suggestion}', text)
      : state.settings.chatPrompt

    try {
      const stream = streamChatAnswer(
        text,
        transcriptContext,
        chatHistory,
        apiKey,
        systemPrompt,
      )

      for await (const token of stream) {
        accumulated += token
        dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: accumulated })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Streaming failed.'
      dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: accumulated + `\n\n⚠ ${msg}` })
    } finally {
      setIsStreaming(false)
    }
  }, [state, dispatch])

  return { isStreaming, sendMessage }
}
