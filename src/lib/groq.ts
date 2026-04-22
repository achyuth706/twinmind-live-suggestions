import type { SuggestionCard, SuggestionType, ChatMessage } from './types'

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm'

  const formData = new FormData()
  formData.append('file', audioBlob, `audio.${ext}`)
  formData.append('model', 'whisper-large-v3')
  formData.append('response_format', 'json')
  formData.append('language', 'en')

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Whisper error:', response.status, errorText)
    throw new Error(`Transcription failed: ${errorText}`)
  }

  const data = await response.json()
  const text = (data.text as string).trim()

  const hallucinations = [
    'thank you', 'thanks', 'thank you.', 'thanks.',
    'you', 'the', 'bye', 'bye.', 'goodbye',
    '.', '...', 'uh', 'um', 'hmm',
    'subscribe', 'like and subscribe',
    'subtitles by', 'transcribed by',
    'www.', 'http',
  ]

  const cleaned = text.toLowerCase()

  if (
    cleaned.length < 10 ||
    hallucinations.some(h => cleaned === h) ||
    cleaned.includes('amara.org') ||
    cleaned.includes('subscrib')
  ) {
    return ''
  }

  return text
}

export async function generateSuggestions(
  transcriptContext: string,
  apiKey: string,
  prompt: string,
  previousSuggestions: string[],
  batchId: string,
): Promise<SuggestionCard[]> {
  const previousBlock = previousSuggestions.length > 0
    ? `Previously shown suggestions (do not repeat these):\n${previousSuggestions.join('\n')}\n\n`
    : ''

  const userContent = `Here is the recent meeting transcript:\n\n"${transcriptContext}"\n\n${previousBlock}Generate 3 new suggestions based specifically on what was just said.`

  const payload = {
    model: 'openai/gpt-oss-120b',
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userContent },
    ],
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    const msg = data?.error?.message ?? 'Failed to generate suggestions'
    console.error('[groq] API error:', msg, data)
    if (msg.toLowerCase().includes('model') || msg.toLowerCase().includes('does not exist')) {
      console.error('Model error - check Groq model availability:', data)
      throw new Error('Model unavailable. Please check your Groq API key has access to gpt-oss-120b')
    }
    throw new Error(msg)
  }

  const raw = data.choices[0].message.content as string

  try {
    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    const arrayStart = cleaned.indexOf('[')
    const arrayEnd = cleaned.lastIndexOf(']')
    if (arrayStart === -1 || arrayEnd === -1) {
      throw new Error('Model returned empty response - skipping this batch')
    }

    const items = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)) as Array<{ type: SuggestionCard['type']; preview: string }>
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Model returned empty response - skipping this batch')
    }

    return items.map(item => ({
      id: crypto.randomUUID(),
      type: item.type,
      preview: item.preview,
      batchId,
      timestamp: Date.now(),
    }))
  } catch (e) {
    console.error('[groq] suggestion parse failed:', e)
    throw e
  }
}

export async function generateDetailedAnswer(
  cardType: SuggestionType,
  cardPreview: string,
  transcriptContext: string,
  apiKey: string,
  detailPrompt: string,
): Promise<string> {
  const userContent = `Suggestion type: ${cardType}\nSuggestion: ${cardPreview}\n\nMeeting transcript context:\n${transcriptContext}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      max_tokens: 400,
      temperature: 0.5,
      messages: [
        { role: 'system', content: detailPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    const msg = data?.error?.message ?? 'Failed to generate detail'
    if (msg.toLowerCase().includes('model') || msg.toLowerCase().includes('does not exist')) {
      console.error('Model error - check Groq model availability:', data)
      throw new Error('Model unavailable. Please check your Groq API key has access to gpt-oss-120b')
    }
    throw new Error(msg)
  }
  return data.choices[0].message.content as string
}

export async function* streamChatAnswer(
  userMessage: string,
  transcriptContext: string,
  chatHistory: ChatMessage[],
  apiKey: string,
  systemPrompt: string,
): AsyncGenerator<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      stream: true,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: `${systemPrompt}\n\nTranscript context:\n${transcriptContext}` },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } })?.error?.message ?? `Stream request failed: ${response.status}`
    if (msg.toLowerCase().includes('model') || msg.toLowerCase().includes('does not exist')) {
      console.error('Model error - check Groq model availability:', err)
      throw new Error('Model unavailable. Please check your Groq API key has access to gpt-oss-120b')
    }
    throw new Error(msg)
  }

  if (!response.body) throw new Error('Response body is null — streaming not supported')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const payload = trimmed.slice(6)
        if (payload === '[DONE]') return

        try {
          const json = JSON.parse(payload) as { choices: Array<{ delta: { content?: string } }> }
          const content = json.choices[0]?.delta?.content
          if (content) yield content
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
