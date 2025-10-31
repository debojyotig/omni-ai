/**
 * Standard Mastra Providers (OpenAI, Anthropic)
 *
 * These providers use Mastra's built-in support with API keys.
 */

import { Anthropic, OpenAI } from '@mastra/core'

export interface ModelConfig {
  id: string
  name: string
  provider: string
  maxTokens?: number
}

/**
 * Initialize standard providers with API keys
 */
export function createStandardProviders() {
  const providers: Record<string, any> = {}

  // OpenAI Provider
  if (process.env.OPENAI_API_KEY) {
    providers.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  // Anthropic Provider
  if (process.env.ANTHROPIC_API_KEY) {
    providers.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  return providers
}

/**
 * Model configurations for standard providers
 */
export const standardModels: Record<string, ModelConfig[]> = {
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000 },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', maxTokens: 8192 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385 }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', maxTokens: 200000 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 200000 },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', maxTokens: 200000 }
  ]
}

/**
 * Get all available standard providers
 */
export function getAvailableStandardProviders(): string[] {
  const available: string[] = []

  if (process.env.OPENAI_API_KEY) available.push('openai')
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic')

  return available
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(provider: string): ModelConfig[] {
  return standardModels[provider] || []
}
