export interface TranscriptChunk {
  id: string
  text: string
  timestamp: number
}

export type SuggestionType = 'question' | 'talking_point' | 'answer' | 'fact_check' | 'clarification'

export interface SuggestionCard {
  id: string
  type: SuggestionType
  preview: string
  batchId: string
  timestamp: number
}

export interface SuggestionBatch {
  id: string
  cards: SuggestionCard[]
  timestamp: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AppSettings {
  groqApiKey: string
  suggestionPrompt: string
  detailPrompt: string
  chatPrompt: string
  suggestionContextWords: number
  chatContextWords: number
}

export interface SessionState {
  transcriptChunks: TranscriptChunk[]
  suggestionBatches: SuggestionBatch[]
  chatMessages: ChatMessage[]
  isRecording: boolean
  settings: AppSettings
}
