/**
 * Server-Side Provider Configuration for Claude Agent SDK
 *
 * Supports multi-LLM via enterprise OAuth2 gateway using ANTHROPIC_BASE_URL.
 * Provider selection requires app restart (no runtime switching).
 *
 * Architecture:
 * omni-ai → ANTHROPIC_BASE_URL → Enterprise Gateway → Azure/AWS/GCP
 */

export interface ProviderConfig {
  provider: string
  baseURL?: string
  apiKey: string
  models: string[]
}

export type ProviderId = 'anthropic' | 'azure' | 'aws' | 'gcp'

/**
 * Get current provider configuration from environment variables
 */
export function getProviderConfig(): ProviderConfig {
  const selectedProvider = (process.env.SELECTED_PROVIDER || 'anthropic') as ProviderId

  switch (selectedProvider) {
    case 'azure':
      return {
        provider: 'azure',
        baseURL: process.env.AZURE_GATEWAY_URL,
        apiKey: process.env.AZURE_CLIENT_SECRET || '',
        models: [
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-1-20250805',
          'claude-haiku-4-5-20251001'
        ]
      }

    case 'aws':
      return {
        provider: 'aws',
        baseURL: process.env.AWS_GATEWAY_URL,
        apiKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        models: [
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-1-20250805',
          'claude-haiku-4-5-20251001'
        ]
      }

    case 'gcp':
      return {
        provider: 'gcp',
        baseURL: process.env.GCP_GATEWAY_URL,
        apiKey: process.env.GCP_SERVICE_ACCOUNT_KEY || '',
        models: [
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-1-20250805',
          'claude-haiku-4-5-20251001'
        ]
      }

    case 'anthropic':
    default:
      return {
        provider: 'anthropic',
        baseURL: undefined, // Use default Anthropic API
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        models: [
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-1-20250805',
          'claude-haiku-4-5-20251001',
          'claude-3-7-sonnet-20250219',
          'claude-3-opus-20240229',
          'claude-3-haiku-20240307'
        ]
      }
  }
}

/**
 * Get Anthropic SDK configuration options
 */
export function getAnthropicConfig(): {
  apiKey: string
  baseURL?: string
} {
  const config = getProviderConfig()

  return {
    apiKey: config.apiKey,
    baseURL: config.baseURL
  }
}

/**
 * Get current provider name for display
 */
export function getCurrentProviderName(): string {
  const selectedProvider = process.env.SELECTED_PROVIDER || 'anthropic'

  const providerNames: Record<string, string> = {
    anthropic: 'Anthropic (Direct)',
    azure: 'Azure OpenAI (via Gateway)',
    aws: 'AWS Bedrock (via Gateway)',
    gcp: 'GCP Vertex AI (via Gateway)'
  }

  return providerNames[selectedProvider] || 'Unknown Provider'
}

/**
 * Get all available providers (for display purposes)
 */
export function getAvailableProvidersList(): Array<{
  id: ProviderId
  name: string
  configured: boolean
}> {
  return [
    {
      id: 'anthropic',
      name: 'Anthropic (Direct)',
      configured: !!process.env.ANTHROPIC_API_KEY
    },
    {
      id: 'azure',
      name: 'Azure OpenAI (via Gateway)',
      configured:
        !!process.env.AZURE_GATEWAY_URL &&
        !!process.env.AZURE_CLIENT_ID &&
        !!process.env.AZURE_CLIENT_SECRET
    },
    {
      id: 'aws',
      name: 'AWS Bedrock (via Gateway)',
      configured:
        !!process.env.AWS_GATEWAY_URL &&
        !!process.env.AWS_ACCESS_KEY_ID &&
        !!process.env.AWS_SECRET_ACCESS_KEY
    },
    {
      id: 'gcp',
      name: 'GCP Vertex AI (via Gateway)',
      configured:
        !!process.env.GCP_GATEWAY_URL &&
        !!process.env.GCP_PROJECT_ID &&
        !!process.env.GCP_SERVICE_ACCOUNT_KEY
    }
  ]
}

/**
 * Validate current provider configuration
 */
export function validateProviderConfig(): {
  valid: boolean
  errors: string[]
} {
  const config = getProviderConfig()
  const errors: string[] = []

  // Check if API key is set
  if (!config.apiKey) {
    errors.push(`Missing API key for provider: ${config.provider}`)
  }

  // Check if gateway URL is set for non-Anthropic providers
  if (config.provider !== 'anthropic' && !config.baseURL) {
    errors.push(`Missing gateway URL for provider: ${config.provider}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
