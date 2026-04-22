import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../lib/types'
import { DEFAULT_SETTINGS } from '../lib/prompts'
import { useSession } from '../store/sessionStore'

const STORAGE_KEY = 'twinmind_settings'

function loadFromStorage(): { settings: AppSettings; isFirstVisit: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>

      // Migrate stale or invalid numeric settings
      if (!parsed.suggestionContextWords || parsed.suggestionContextWords < 100) {
        parsed.suggestionContextWords = 300
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }
      if (!parsed.chatContextWords || parsed.chatContextWords < 100) {
        parsed.chatContextWords = 1000
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }

      const settings = { ...DEFAULT_SETTINGS, ...parsed }

      // Reset any prompt that still contains the old placeholder value
      if (!settings.suggestionPrompt || settings.suggestionPrompt.includes('PLACEHOLDER')) {
        settings.suggestionPrompt = DEFAULT_SETTINGS.suggestionPrompt
      }
      if (!settings.detailPrompt || settings.detailPrompt.includes('PLACEHOLDER')) {
        settings.detailPrompt = DEFAULT_SETTINGS.detailPrompt
      }
      if (!settings.chatPrompt || settings.chatPrompt.includes('PLACEHOLDER')) {
        settings.chatPrompt = DEFAULT_SETTINGS.chatPrompt
      }

      return { settings, isFirstVisit: !settings.groqApiKey }
    }
  } catch {
    // corrupted storage — fall through to defaults
  }
  return { settings: DEFAULT_SETTINGS, isFirstVisit: true }
}

function saveToStorage(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function useSettings() {
  const { dispatch } = useSession()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  useEffect(() => {
    const { settings: loaded } = loadFromStorage()
    setSettings(loaded)
    dispatch({ type: 'UPDATE_SETTINGS', payload: loaded })
  }, [dispatch])

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      const next = { ...settings, ...partial }
      saveToStorage(next)
      setSettings(next)
      dispatch({ type: 'UPDATE_SETTINGS', payload: next })
    },
    [settings, dispatch],
  )

  return { settings, updateSettings }
}
