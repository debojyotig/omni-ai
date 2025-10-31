/**
 * Agent Config Store (Zustand)
 *
 * Manages dynamic agent configuration (token limits, temperature, iterations)
 * per provider/model combination with localStorage persistence.
 *
 * This enables runtime token optimization that works with ALL providers:
 * - Anthropic Claude (40k/min rate limit)
 * - OpenAI GPT-4o (higher rate limits)
 * - Custom OAuth2 enterprise providers (variable limits)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Agent Configuration Interface
 *
 * These settings control token usage and behavior for each provider/model.
 */
export interface AgentConfig {
  providerId: string
  modelId: string
  maxOutputTokens: number // For TokenLimiter processor (controls memory pruning)
  temperature: number // For Agent (controls randomness)
  maxIterations: number // For Agent (controls reasoning loops)
}

/**
 * Default configurations for different provider types
 */
const DEFAULT_CONFIGS: Record<string, Partial<AgentConfig>> = {
  // Anthropic Claude models - Very conservative due to 40k/min rate limit
  anthropic: {
    maxOutputTokens: 4096, // Very safe: 4k × 10 requests = 40k/min max
    temperature: 0.7,
    maxIterations: 15,
  },
  // OpenAI GPT-4o models - Higher limits available
  openai: {
    maxOutputTokens: 16384, // Higher limit, faster rate limits
    temperature: 0.7,
    maxIterations: 15,
  },
  // Custom OAuth2 enterprise providers - Conservative defaults
  oauth2: {
    maxOutputTokens: 4096, // Conservative for unknown rate limits
    temperature: 0.7,
    maxIterations: 10,
  },
}

/**
 * Global fallback default if provider type is unknown
 */
const GLOBAL_DEFAULT_CONFIG: Omit<AgentConfig, 'providerId' | 'modelId'> = {
  maxOutputTokens: 4096,
  temperature: 0.7,
  maxIterations: 10,
}

interface AgentConfigState {
  // Storage for all configs (keyed by provider-model)
  configs: Record<string, AgentConfig>

  // Actions
  getConfig: (providerId: string, modelId: string) => AgentConfig
  setConfig: (config: AgentConfig) => void
  resetConfig: (providerId: string, modelId: string) => void
  resetAllConfigs: () => void
}

/**
 * Generate storage key for provider/model combination
 */
function getStorageKey(providerId: string, modelId: string): string {
  return `${providerId}:${modelId}`
}

/**
 * Get default config for a provider/model combination
 */
function getDefaultConfig(
  providerId: string,
  modelId: string
): AgentConfig {
  // Check if we have a default for this provider type
  const providerDefault = DEFAULT_CONFIGS[providerId] || GLOBAL_DEFAULT_CONFIG

  return {
    providerId,
    modelId,
    maxOutputTokens:
      providerDefault.maxOutputTokens || GLOBAL_DEFAULT_CONFIG.maxOutputTokens,
    temperature: providerDefault.temperature || GLOBAL_DEFAULT_CONFIG.temperature,
    maxIterations:
      providerDefault.maxIterations || GLOBAL_DEFAULT_CONFIG.maxIterations,
  }
}

/**
 * Zustand store for agent configurations
 */
export const useAgentConfigStore = create<AgentConfigState>()(
  persist(
    (set, get) => ({
      // State
      configs: {},

      // Actions
      getConfig: (providerId: string, modelId: string) => {
        const key = getStorageKey(providerId, modelId)
        const state = get()

        // Return existing config if available
        if (state.configs[key]) {
          return state.configs[key]
        }

        // Otherwise return default config
        return getDefaultConfig(providerId, modelId)
      },

      setConfig: (config: AgentConfig) => {
        const key = getStorageKey(config.providerId, config.modelId)

        set((state) => ({
          configs: {
            ...state.configs,
            [key]: config,
          },
        }))
      },

      resetConfig: (providerId: string, modelId: string) => {
        const key = getStorageKey(providerId, modelId)

        set((state) => {
          const newConfigs = { ...state.configs }
          delete newConfigs[key]
          return { configs: newConfigs }
        })
      },

      resetAllConfigs: () => {
        set({ configs: {} })
      },
    }),
    {
      name: 'omni-ai-agent-config-storage',
    }
  )
)

/**
 * Helper: Get config for current provider/model selection
 *
 * Use this in the chat API route to load config before creating agents.
 */
export function getAgentConfig(
  providerId: string,
  modelId: string
): AgentConfig {
  return useAgentConfigStore.getState().getConfig(providerId, modelId)
}

/**
 * Helper: Save config for a provider/model
 */
export function setAgentConfig(config: AgentConfig): void {
  useAgentConfigStore.getState().setConfig(config)
}

/**
 * Helper: Reset config to default for a provider/model
 */
export function resetAgentConfig(
  providerId: string,
  modelId: string
): void {
  useAgentConfigStore.getState().resetConfig(providerId, modelId)
}

/**
 * Helper: Get all default configurations (for UI reference)
 */
export function getAllDefaultConfigs(): typeof DEFAULT_CONFIGS {
  return DEFAULT_CONFIGS
}
