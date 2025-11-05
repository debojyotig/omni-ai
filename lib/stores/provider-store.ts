/**
 * Provider Store (Zustand)
 *
 * Manages selected provider and model state with localStorage persistence.
 * Enables runtime switching without app restart.
 * Supports per-model configuration (temperature, max tokens, iterations).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getAvailableProviders,
  getModelsForProvider,
  getAllModels,
  getDefaultProvider,
  getDefaultModel,
  type ProviderInfo,
  type ModelConfig
} from '@/lib/config/provider-config'

/**
 * Runtime configuration for a specific model
 */
export interface RuntimeSettings {
  maxOutputTokens: number
  temperature: number
  maxIterations: number
}

/**
 * Default settings per model type (determined by model name patterns)
 */
const DEFAULT_SETTINGS: Record<string, RuntimeSettings> = {
  haiku: {
    maxOutputTokens: 2000,
    temperature: 0.7,
    maxIterations: 10
  },
  sonnet: {
    maxOutputTokens: 4096,
    temperature: 0.7,
    maxIterations: 15
  },
  opus: {
    maxOutputTokens: 8192,
    temperature: 0.5,
    maxIterations: 20
  },
  'gpt-4-turbo': {
    maxOutputTokens: 8192,
    temperature: 0.7,
    maxIterations: 15
  },
  'gpt-4': {
    maxOutputTokens: 8192,
    temperature: 0.7,
    maxIterations: 15
  },
  'gpt-3.5': {
    maxOutputTokens: 4096,
    temperature: 0.7,
    maxIterations: 10
  }
}

/**
 * Get default settings based on model name
 *
 * Matches model patterns from all providers:
 * - Anthropic Direct: claude-sonnet-4-5-20250929, claude-opus-4-1-20250805, claude-haiku-4-5-20251001
 * - AWS Bedrock: anthropic.claude-3-5-sonnet-20241022-v2:0, anthropic.claude-3-opus-20240229-v1:0
 * - GCP Vertex: claude-3-5-sonnet@20241022, claude-3-opus@20240229
 * - OpenAI: gpt-4-turbo, gpt-4, gpt-3.5-turbo
 */
function getDefaultSettingsForModel(modelId: string): RuntimeSettings {
  // Match by model name patterns (case-insensitive for flexibility)
  const lowerModelId = modelId.toLowerCase()

  if (lowerModelId.includes('haiku')) return DEFAULT_SETTINGS.haiku
  if (lowerModelId.includes('opus')) return DEFAULT_SETTINGS.opus
  if (lowerModelId.includes('sonnet')) return DEFAULT_SETTINGS.sonnet
  if (lowerModelId.includes('gpt-4-turbo')) return DEFAULT_SETTINGS['gpt-4-turbo']
  if (lowerModelId.includes('gpt-4')) return DEFAULT_SETTINGS['gpt-4']
  if (lowerModelId.includes('gpt-3.5')) return DEFAULT_SETTINGS['gpt-3.5']

  // Default fallback
  return DEFAULT_SETTINGS.sonnet
}

interface ProviderState {
  // Current selections
  selectedProviderId: string | null
  selectedModelId: string | null

  // Per-model runtime settings
  // Key format: "providerId:modelId"
  modelSettings: Record<string, RuntimeSettings>

  // Actions
  setProvider: (providerId: string) => void
  setModel: (modelId: string) => void
  initializeDefaults: () => void
  reset: () => void

  // Settings actions
  setModelSetting: (
    providerId: string,
    modelId: string,
    settings: Partial<RuntimeSettings>
  ) => void

  // Getters
  getAvailableProviders: () => ProviderInfo[]
  getAvailableModels: () => ModelConfig[]
  getAllModels: () => ModelConfig[]
  isReady: () => boolean
  getModelSettings: (providerId: string, modelId: string) => RuntimeSettings
  getActiveModelSettings: () => RuntimeSettings
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      // State
      selectedProviderId: null,
      selectedModelId: null,
      modelSettings: {},

      // Actions
      setProvider: (providerId: string) => {
        // Get default model for this provider
        const defaultModel = getDefaultModel(providerId)

        set({
          selectedProviderId: providerId,
          selectedModelId: defaultModel?.id || null
        })
      },

      setModel: (modelId: string) => {
        // Find which provider this model belongs to
        const allModels = getAllModels()
        const modelConfig = allModels.find(m => m.id === modelId)

        if (modelConfig) {
          set({
            selectedProviderId: modelConfig.provider,
            selectedModelId: modelId
          })
        }
      },

      initializeDefaults: () => {
        const state = get()

        // Only initialize if not already set
        if (state.selectedProviderId && state.selectedModelId) {
          return // Current selections exist
        }

        // Get default provider and model
        const defaultProvider = getDefaultProvider()
        if (!defaultProvider) {
          console.warn('No providers available')
          return
        }

        const defaultModel = getDefaultModel(defaultProvider.id)
        if (!defaultModel) {
          console.warn(`No models available for provider: ${defaultProvider.id}`)
          return
        }

        set({
          selectedProviderId: defaultProvider.id,
          selectedModelId: defaultModel.id
        })
      },

      reset: () => {
        set({
          selectedProviderId: null,
          selectedModelId: null,
          modelSettings: {}
        })
      },

      /**
       * Update runtime settings for a specific model
       */
      setModelSetting: (providerId: string, modelId: string, settings: Partial<RuntimeSettings>) => {
        const key = `${providerId}:${modelId}`
        const state = get()
        const existing = state.modelSettings[key] || getDefaultSettingsForModel(modelId)

        set({
          modelSettings: {
            ...state.modelSettings,
            [key]: { ...existing, ...settings }
          }
        })
      },

      // Getters
      getAvailableProviders: () => {
        return getAvailableProviders()
      },

      getAvailableModels: () => {
        const state = get()
        if (!state.selectedProviderId) return []

        return getModelsForProvider(state.selectedProviderId)
      },

      getAllModels: () => {
        return getAllModels()
      },

      isReady: () => {
        const state = get()
        return !!(state.selectedProviderId && state.selectedModelId)
      },

      /**
       * Get settings for a specific model
       */
      getModelSettings: (providerId: string, modelId: string): RuntimeSettings => {
        const key = `${providerId}:${modelId}`
        const state = get()
        return state.modelSettings[key] || getDefaultSettingsForModel(modelId)
      },

      /**
       * Get settings for currently selected model
       */
      getActiveModelSettings: (): RuntimeSettings => {
        const state = get()
        if (!state.selectedProviderId || !state.selectedModelId) {
          return DEFAULT_SETTINGS.sonnet
        }
        return state.getModelSettings(state.selectedProviderId, state.selectedModelId)
      }
    }),
    {
      name: 'omni-ai-provider-storage',
      // Persist selections and all model settings
      partialize: (state) => ({
        selectedProviderId: state.selectedProviderId,
        selectedModelId: state.selectedModelId,
        modelSettings: state.modelSettings
      })
    }
  )
)

/**
 * Get current model config
 */
export function getCurrentModel(): ModelConfig | null {
  const { selectedModelId } = useProviderStore.getState()

  if (!selectedModelId) {
    return null
  }

  const allModels = getAllModels()
  return allModels.find(m => m.id === selectedModelId) || null
}

/**
 * Get current model settings
 */
export function getCurrentModelSettings(): RuntimeSettings {
  return useProviderStore.getState().getActiveModelSettings()
}
