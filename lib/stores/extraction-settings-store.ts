/**
 * Extraction Settings Store
 *
 * Manages LLM extraction settings (enable/disable) with localStorage persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExtractionSettings {
  enableLLMExtraction: boolean
}

interface ExtractionSettingsStore extends ExtractionSettings {
  setEnableLLMExtraction: (enabled: boolean) => void
  resetToDefaults: () => void
}

const DEFAULT_SETTINGS: ExtractionSettings = {
  enableLLMExtraction: false, // Disabled by default for cost control
}

export const useExtractionSettingsStore = create<ExtractionSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setEnableLLMExtraction: (enabled: boolean) => {
        set({ enableLLMExtraction: enabled })
      },

      resetToDefaults: () => {
        set(DEFAULT_SETTINGS)
      },
    }),
    {
      name: 'extraction-settings-store',
      version: 1,
    }
  )
)

/**
 * Get all default extraction settings
 */
export function getDefaultExtractionSettings(): ExtractionSettings {
  return DEFAULT_SETTINGS
}
