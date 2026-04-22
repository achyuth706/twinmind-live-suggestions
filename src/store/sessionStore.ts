import { createContext, useContext, useReducer, createElement } from 'react'
import type { ReactNode } from 'react'
import type { SessionState, TranscriptChunk, SuggestionBatch, ChatMessage, AppSettings } from '../lib/types'

type Action =
  | { type: 'ADD_TRANSCRIPT_CHUNK'; payload: TranscriptChunk }
  | { type: 'ADD_SUGGESTION_BATCH'; payload: SuggestionBatch }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_CHAT_MESSAGE'; payload: string }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }

const initialState: SessionState = {
  transcriptChunks: [],
  suggestionBatches: [],
  chatMessages: [],
  isRecording: false,
  settings: {
    groqApiKey: '',
    suggestionPrompt: '',
    detailPrompt: '',
    chatPrompt: '',
    suggestionContextWords: 300,
    chatContextWords: 800,
  },
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'ADD_TRANSCRIPT_CHUNK': {
      const updated = [...state.transcriptChunks, action.payload]
      return { ...state, transcriptChunks: updated }
    }

    case 'ADD_SUGGESTION_BATCH':
      return { ...state, suggestionBatches: [action.payload, ...state.suggestionBatches] }

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] }

    case 'UPDATE_LAST_CHAT_MESSAGE': {
      if (state.chatMessages.length === 0) return state
      const messages = [...state.chatMessages]
      messages[messages.length - 1] = { ...messages[messages.length - 1], content: action.payload }
      return { ...state, chatMessages: messages }
    }

    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    default:
      return state
  }
}

interface SessionContextValue {
  state: SessionState
  dispatch: React.Dispatch<Action>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return createElement(SessionContext.Provider, { value: { state, dispatch } }, children)
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
