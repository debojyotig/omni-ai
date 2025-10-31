/**
 * Provider Store (Zustand)
 *
 * Manages selected provider and model state with localStorage persistence.
 * Enables runtime switching without app restart.
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

interface ProviderState {
  // Current selections
  selectedProviderId: string | null
  selectedModelId: string | null

  // Actions
  setProvider: (providerId: string) => void
  setModel: (modelId: string) => void
  initializeDefaults: () => void
  reset: () => void

  // Getters
  getAvailableProviders: () => ProviderInfo[]
  getAvailableModels: () => ModelConfig[]
  getAllModels: () => ModelConfig[]
  isReady: () => boolean
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      // State
      selectedProviderId: null,
      selectedModelId: null,

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
          selectedModelId: null
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
      }
    }),
    {
      name: 'omni-ai-provider-storage',
      // Only persist the selections
      partialize: (state) => ({
        selectedProviderId: state.selectedProviderId,
        selectedModelId: state.selectedModelId
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
