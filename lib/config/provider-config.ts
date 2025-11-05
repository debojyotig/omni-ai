/**
 * Provider Configuration (Client-Safe)
 *
 * Contains provider metadata without importing Mastra classes.
 * Actual provider instantiation happens server-side only (in API routes).
 */

export interface ModelConfig {
  id: string
  name: string
  provider: string
  maxTokens?: number
}

export interface ProviderInfo {
  id: string
  name: string
  type: 'standard' | 'native' | 'gateway'
  requiresAuth: boolean
  envVars: string[]
}

/**
 * Available providers metadata
 *
 * Types:
 * - standard: Mastra built-in providers (OpenAI, Anthropic)
 * - native: Claude Agent SDK native support (Bedrock, Vertex)
 * - gateway: Enterprise gateway via ANTHROPIC_BASE_URL (Azure)
 */
export const PROVIDERS: Record<string, ProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'standard',
    requiresAuth: true,
    envVars: ['OPENAI_API_KEY']
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'standard',
    requiresAuth: true,
    envVars: ['ANTHROPIC_API_KEY']
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    type: 'native',
    requiresAuth: true,
    envVars: [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ]
  },
  vertex: {
    id: 'vertex',
    name: 'GCP Vertex AI',
    type: 'native',
    requiresAuth: true,
    envVars: [
      'GCP_PROJECT_ID',
      'GCP_SERVICE_ACCOUNT_KEY'
    ]
  },
  'azure-openai': {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    type: 'gateway',
    requiresAuth: true,
    envVars: [
      'ANTHROPIC_BASE_URL',
      'ANTHROPIC_API_KEY'
    ]
  }
}

/**
 * Available models metadata
 */
export const MODELS: Record<string, ModelConfig[]> = {
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000 },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', maxTokens: 8192 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385 }
  ],
  anthropic: [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5 (Latest)',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-opus-4-1-20250805',
      name: 'Claude Opus 4.1',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      maxTokens: 200000
    }
  ],
  bedrock: [
    {
      id: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      name: 'Claude Sonnet 4 (Bedrock)',
      provider: 'bedrock',
      maxTokens: 200000
    },
    {
      id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      name: 'Claude 3.7 Sonnet (Bedrock)',
      provider: 'bedrock',
      maxTokens: 200000
    },
    {
      id: 'us.anthropic.claude-opus-4-20250514-v1:0',
      name: 'Claude Opus 4 (Bedrock)',
      provider: 'bedrock',
      maxTokens: 200000
    },
    {
      id: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      name: 'Claude Haiku 4.5 (Bedrock)',
      provider: 'bedrock',
      maxTokens: 200000
    }
  ],
  vertex: [
    {
      id: 'claude-3-5-sonnet@20241022',
      name: 'Claude 3.5 Sonnet (Vertex)',
      provider: 'vertex',
      maxTokens: 200000
    },
    {
      id: 'claude-3-opus@20240229',
      name: 'Claude 3 Opus (Vertex)',
      provider: 'vertex',
      maxTokens: 200000
    },
    {
      id: 'claude-3-haiku@20240307',
      name: 'Claude 3 Haiku (Vertex)',
      provider: 'vertex',
      maxTokens: 200000
    }
  ],
  'azure-openai': [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo (Azure)',
      provider: 'azure-openai',
      maxTokens: 128000
    },
    { id: 'gpt-4', name: 'GPT-4 (Azure)', provider: 'azure-openai', maxTokens: 8192 },
    {
      id: 'gpt-35-turbo',
      name: 'GPT-3.5 Turbo (Azure)',
      provider: 'azure-openai',
      maxTokens: 16385
    }
  ]
}

/**
 * Get all available providers (checks if env vars are set)
 */
export function getAvailableProviders(): ProviderInfo[] {
  const available: ProviderInfo[] = []

  for (const provider of Object.values(PROVIDERS)) {
    // In browser environment, we can't check process.env
    // So we'll just return all providers and let server-side validate
    available.push(provider)
  }

  return available
}

/**
 * Get models for a provider
 */
export function getModelsForProvider(providerId: string): ModelConfig[] {
  return MODELS[providerId] || []
}

/**
 * Get all models across all providers
 */
export function getAllModels(): ModelConfig[] {
  return Object.values(MODELS).flat()
}

/**
 * Get default provider
 */
export function getDefaultProvider(): ProviderInfo | null {
  // Priority: OpenAI > Anthropic > others
  return PROVIDERS.openai || PROVIDERS.anthropic || Object.values(PROVIDERS)[0] || null
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(providerId: string): ModelConfig | null {
  const models = getModelsForProvider(providerId)
  return models[0] || null
}
