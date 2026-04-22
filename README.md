# TwinMind Live Suggestions

A live meeting copilot that transcribes your microphone in real time and 
surfaces 3 contextual suggestions based on what's being said.

## Live Demo
https://twinmind-live-suggestions-umber.vercel.app/ 

## Quick Start

### 1. Get a Groq API Key (free)
1. Go to https://console.groq.com
2. Sign up for a free account
3. Click "API Keys" in the left sidebar
4. Click "Create API Key"
5. Copy the key (starts with gsk_...)

### 2. Run Locally
Prerequisites: Node.js 18+ (download from nodejs.org)

```
git clone https://github.com/achyuth706/twinmind-live-suggestions.git
cd twinmind-live-suggestions
npm install
npm run dev
```

Open http://localhost:5173 in Chrome.

### 3. First Time Setup
1. The Settings modal opens automatically on first visit
2. Paste your Groq API key
3. Click Save
4. Click the mic button and start talking

## How It Works

**Left column — Transcript**
Your speech is captured in 10-second chunks, sent to Groq Whisper Large V3 
for transcription, and displayed as scrollable paragraphs. Live interim 
text shows as grey italic while transcribing.

**Middle column — Live Suggestions**
Every 30 seconds (or on manual refresh), the last 300 words of transcript 
are sent to GPT-OSS 120B. The model generates exactly 3 contextual 
suggestions based on what was just said. Suggestion types:
- Question to ask — a natural follow-up question
- Talking point — something worth expanding on
- Answer — a response to a question just asked
- Fact check — verify a claim or statistic just stated
- Clarification — something ambiguous that needs clarifying

**Right column — Chat**
Click any suggestion to get a detailed answer. Or type questions directly.
Full transcript context is included in every chat request.
One continuous thread per session — no persistence on reload.

## Tech Stack
- React + Vite + TypeScript
- Tailwind CSS v4
- Groq API:
  - Whisper Large V3 for transcription
  - openai/gpt-oss-120b for suggestions and chat
- No backend — all API calls direct from browser (Groq supports CORS)
- No database — session only, clears on reload

## Why No Backend?
Groq supports CORS, so the browser can call it directly. The API key is 
the user's own key stored in their localStorage. No persistence is needed 
per the assignment spec. A backend would add complexity with zero benefit.

## Prompt Strategy

### Live Suggestions
The suggestion prompt uses a decision tree approach:
- Reads transcript carefully to identify what just happened
- If a factual claim was made → surfaces a fact_check
- If a question was asked → surfaces an answer
- If discussion is flowing → surfaces talking_points  
- Forces type variety — never 3 of the same type
- Previews are self-contained and useful without clicking
- Passes previous batch to the model to avoid repeating suggestions

### Chat & Detailed Answers
- Chat prompt keeps answers concise for active meeting context
- Detail prompt adapts response style based on suggestion type
- Full transcript context included for grounded answers

### Context Windows
- Suggestions: last 300 words (recency focused — what was just said)
- Chat: last 800 words (more background needed for thorough answers)
- Both configurable in Settings

## Settings (all editable in the gear icon)
| Setting | Default | Description |
|---|---|---|
| Groq API Key | — | Your key from console.groq.com |
| Suggestion Prompt | (optimized) | Controls suggestion generation |
| Detail Prompt | (optimized) | Controls click-to-chat answers |
| Chat Prompt | (optimized) | Controls direct chat responses |
| Suggestion Context | 300 words | How much transcript to send for suggestions |
| Chat Context | 800 words | How much transcript to send for chat |

## Export
Click Export in the top bar to download a JSON file with:
- Full transcript with timestamps
- All suggestion batches with timestamps  
- Complete chat history
This file is used to evaluate the session.

## Tradeoffs
- **10s chunking** — transcript updates every 10 seconds. Feels live with 
  interim grey text, but confirmed text lags slightly. This is the tradeoff 
  for accurate Whisper transcription vs browser SpeechRecognition.
- **Whisper accuracy** — occasional mishearing of names or technical terms 
  on the free tier. Not fixable without paid tier.
- **Single model for all** — GPT-OSS 120B for both suggestions and chat 
  keeps evaluation fair per assignment spec.
- **No persistence** — session clears on reload by design per spec.

## Project Structure
```
src/
  components/
    TranscriptPanel.tsx    — mic, audio capture, transcript display
    SuggestionsPanel.tsx   — suggestion cards, auto-refresh, countdown
    ChatPanel.tsx          — streaming chat, message bubbles
    SettingsModal.tsx      — API key, prompt editing, context windows
    ExportButton.tsx       — session export to JSON
  hooks/
    useAudioRecorder.ts    — MediaRecorder, 10s cycle, stream management
    useSuggestions.ts      — suggestion generation, auto-refresh loop
    useChat.ts             — streaming chat, message history
    useSettings.ts         — localStorage persistence, settings management
  lib/
    groq.ts                — all Groq API calls (Whisper, suggestions, chat)
    prompts.ts             — default prompt strings and settings
    types.ts               — shared TypeScript types
  store/
    sessionStore.ts        — React context + useReducer global state
```
