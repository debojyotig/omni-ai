/**
 * Hybrid Provider Manager
 *
 * Unifies standard Mastra providers and custom OAuth2 providers
 * into a single interface for runtime provider/model switching.
 */

import {
  createStandardProviders,
  standardModels,
  getAvailableStandardProviders,
  getModelsForProvider,
  type ModelConfig
} from './standard-providers'

import {
  createCustomProviders,
  customModels,
  getAvailableCustomProviders,
  getModelsForCustomProvider
} from './custom-providers'

export interface ProviderInfo {
  id: string
  name: string
  type: 'standard' | 'custom'
  isConfigured: boolean
}

export interface ProviderSelection {
  providerId: string
  modelId: string
}

export class HybridProviderManager {
  private standardProviders: Record<string, any> = {}
  private customProviders: ReturnType<typeof createCustomProviders>

  constructor() {
    this.standardProviders = createStandardProviders()
    this.customProviders = createCustomProviders()
  }

  /**
   * Get all available providers (both standard and custom)
   */
  getAvailableProviders(): ProviderInfo[] {
    const providers: ProviderInfo[] = []

    // Standard providers
    const standardIds = getAvailableStandardProviders()
    for (const id of standardIds) {
      providers.push({
        id,
        name: this.getProviderDisplayName(id),
        type: 'standard',
        isConfigured: true
      })
    }

    // Custom providers
    const customIds = getAvailableCustomProviders()
    for (const id of customIds) {
      providers.push({
        id,
        name: this.getProviderDisplayName(id),
        type: 'custom',
        isConfigured: true
      })
    }

    return providers
  }

  /**
   * Get all available models for a provider
   */
  getModels(providerId: string): ModelConfig[] {
    // Check standard providers first
    const standardModelsForProvider = getModelsForProvider(providerId)
    if (standardModelsForProvider.length > 0) {
      return standardModelsForProvider
    }

    // Check custom providers
    return getModelsForCustomProvider(providerId)
  }

  /**
   * Get all models across all providers
   */
  getAllModels(): ModelConfig[] {
    const models: ModelConfig[] = []

    // Standard models
    for (const provider of getAvailableStandardProviders()) {
      models.push(...(standardModels[provider] || []))
    }

    // Custom models
    for (const provider of getAvailableCustomProviders()) {
      models.push(...(customModels[provider] || []))
    }

    return models
  }

  /**
   * Get provider instance (standard providers only)
   */
  getProvider(providerId: string): any {
    return this.standardProviders[providerId]
  }

  /**
   * Get custom provider instance
   */
  getCustomProvider(providerId: string) {
    switch (providerId) {
      case 'azure-openai':
        return this.customProviders.azureOpenAI
      case 'aws-bedrock':
        return this.customProviders.awsBedrock
      case 'gcp-vertex':
        return this.customProviders.gcpVertex
      default:
        return null
    }
  }

  /**
   * Get provider for a model (returns provider instance)
   */
  async getProviderForModel(modelId: string): Promise<any> {
    // Find which provider this model belongs to
    const allModels = this.getAllModels()
    const modelConfig = allModels.find(m => m.id === modelId)

    if (!modelConfig) {
      throw new Error(`Model not found: ${modelId}`)
    }

    const providerId = modelConfig.provider

    // Check if it's a standard provider
    if (this.standardProviders[providerId]) {
      return this.standardProviders[providerId]
    }

    // Check if it's a custom provider
    const customProvider = this.getCustomProvider(providerId)
    if (customProvider) {
      // For Azure OpenAI, get the provider instance with OAuth2 token
      if ('getProvider' in customProvider) {
        return await customProvider.getProvider()
      }
      return customProvider
    }

    throw new Error(`Provider not found for model: ${modelId}`)
  }

  /**
   * Validate if a provider is available
   */
  isProviderAvailable(providerId: string): boolean {
    const available = this.getAvailableProviders()
    return available.some(p => p.id === providerId)
  }

  /**
   * Validate if a model is available
   */
  isModelAvailable(modelId: string): boolean {
    const allModels = this.getAllModels()
    return allModels.some(m => m.id === modelId)
  }

  /**
   * Get display name for a provider
   */
  private getProviderDisplayName(providerId: string): string {
    const names: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'azure-openai': 'Azure OpenAI',
      'aws-bedrock': 'AWS Bedrock',
      'gcp-vertex': 'GCP Vertex AI'
    }
    return names[providerId] || providerId
  }

  /**
   * Get default provider (first available)
   */
  getDefaultProvider(): ProviderInfo | null {
    const providers = this.getAvailableProviders()
    return providers.length > 0 ? providers[0] : null
  }

  /**
   * Get default model for a provider
   */
  getDefaultModel(providerId: string): ModelConfig | null {
    const models = this.getModels(providerId)
    return models.length > 0 ? models[0] : null
  }
}

// Singleton instance
export const hybridProviderManager = new HybridProviderManager()
