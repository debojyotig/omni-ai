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
  type: 'standard' | 'oauth2'
  requiresAuth: boolean
  envVars: string[]
}

/**
 * Available providers metadata
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
  'azure-openai': {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    type: 'oauth2',
    requiresAuth: true,
    envVars: [
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_TOKEN_ENDPOINT',
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET'
    ]
  },
  'aws-bedrock': {
    id: 'aws-bedrock',
    name: 'AWS Bedrock',
    type: 'oauth2',
    requiresAuth: true,
    envVars: [
      'AWS_BEDROCK_ENDPOINT',
      'AWS_TOKEN_ENDPOINT',
      'AWS_CLIENT_ID',
      'AWS_CLIENT_SECRET'
    ]
  },
  'gcp-vertex': {
    id: 'gcp-vertex',
    name: 'GCP Vertex AI',
    type: 'oauth2',
    requiresAuth: true,
    envVars: [
      'GCP_VERTEX_ENDPOINT',
      'GCP_TOKEN_ENDPOINT',
      'GCP_CLIENT_ID',
      'GCP_CLIENT_SECRET'
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
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      maxTokens: 200000
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
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
  ],
  'aws-bedrock': [
    {
      id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      name: 'Claude 3.5 Sonnet (Bedrock)',
      provider: 'aws-bedrock',
      maxTokens: 200000
    },
    {
      id: 'anthropic.claude-3-haiku-20240307-v1:0',
      name: 'Claude 3 Haiku (Bedrock)',
      provider: 'aws-bedrock',
      maxTokens: 200000
    }
  ],
  'gcp-vertex': [
    {
      id: 'claude-3-5-sonnet@20241022',
      name: 'Claude 3.5 Sonnet (Vertex)',
      provider: 'gcp-vertex',
      maxTokens: 200000
    },
    {
      id: 'claude-3-haiku@20240307',
      name: 'Claude 3 Haiku (Vertex)',
      provider: 'gcp-vertex',
      maxTokens: 200000
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
