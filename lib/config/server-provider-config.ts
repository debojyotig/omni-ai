/**
 * Server-Side Provider Configuration for Claude Agent SDK
 *
 * Supports runtime model switching with native third-party provider support:
 * - Anthropic: Direct API via ANTHROPIC_API_KEY
 * - AWS Bedrock: Native support via CLAUDE_CODE_USE_BEDROCK=1 + AWS credentials
 *   Required: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   Optional: AWS_SESSION_TOKEN (for temporary credentials via STS, MFA, or IAM roles)
 * - GCP Vertex AI: Native support via CLAUDE_CODE_USE_VERTEX=1 + GCP credentials
 * - Azure OpenAI: Via gateway using ANTHROPIC_BASE_URL
 *
 * The Claude Agent SDK automatically detects environment variables and uses
 * the appropriate provider at runtime.
 *
 * Reference: https://docs.claude.com/en/docs/claude-code/amazon-bedrock.md
 */

export interface ProviderConfig {
  provider: string
  apiKey: string
  baseURL?: string
  awsRegion?: string
  gcpProjectId?: string
  models: string[]
}

export type ProviderId = 'anthropic' | 'bedrock' | 'vertex' | 'azure-openai'

/**
 * Get current provider configuration from environment variables
 *
 * Runtime Provider Switching:
 * - Anthropic: Uses ANTHROPIC_API_KEY directly (default)
 * - Bedrock: Set CLAUDE_CODE_USE_BEDROCK=1 + AWS credentials
 *   Required: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   Optional: AWS_SESSION_TOKEN (for temporary credentials)
 * - Vertex: Set CLAUDE_CODE_USE_VERTEX=1 + GCP credentials
 * - Azure: Set ANTHROPIC_BASE_URL + Azure Gateway credentials
 *
 * Reference: https://docs.claude.com/en/docs/claude-code/amazon-bedrock.md
 */
export function getProviderConfig(): ProviderConfig {
  // Check for native third-party provider indicators
  if (process.env.CLAUDE_CODE_USE_BEDROCK === '1') {
    // AWS Bedrock - Claude Agent SDK will use environment variables directly
    // It automatically picks up: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
    return {
      provider: 'bedrock',
      apiKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      models: [
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'anthropic.claude-3-opus-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0'
      ]
    }
  }

  if (process.env.CLAUDE_CODE_USE_VERTEX === '1') {
    return {
      provider: 'vertex',
      apiKey: process.env.GCP_SERVICE_ACCOUNT_KEY || '',
      gcpProjectId: process.env.GCP_PROJECT_ID,
      models: [
        'claude-3-5-sonnet@20241022',
        'claude-3-opus@20240229',
        'claude-3-haiku@20240307'
      ]
    }
  }

  // Check for Azure gateway
  if (process.env.ANTHROPIC_BASE_URL && process.env.ANTHROPIC_BASE_URL.includes('azure')) {
    return {
      provider: 'azure-openai',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseURL: process.env.ANTHROPIC_BASE_URL,
      models: [
        'claude-sonnet-4-5-20250929',
        'claude-opus-4-1-20250805',
        'claude-haiku-4-5-20251001'
      ]
    }
  }

  // Default: Anthropic Direct API
  return {
    provider: 'anthropic',
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
  const config = getProviderConfig()

  const providerNames: Record<string, string> = {
    anthropic: 'Anthropic (Direct API)',
    bedrock: 'AWS Bedrock',
    vertex: 'GCP Vertex AI',
    'azure-openai': 'Azure OpenAI (Gateway)'
  }

  return providerNames[config.provider] || 'Unknown Provider'
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
      name: 'Anthropic (Direct API)',
      configured: !!process.env.ANTHROPIC_API_KEY
    },
    {
      id: 'bedrock',
      name: 'AWS Bedrock',
      configured:
        !!process.env.AWS_REGION &&
        !!process.env.AWS_ACCESS_KEY_ID &&
        !!process.env.AWS_SECRET_ACCESS_KEY
    },
    {
      id: 'vertex',
      name: 'GCP Vertex AI',
      configured:
        !!process.env.GCP_PROJECT_ID &&
        !!process.env.GCP_SERVICE_ACCOUNT_KEY
    },
    {
      id: 'azure-openai',
      name: 'Azure OpenAI (Gateway)',
      configured:
        !!process.env.ANTHROPIC_BASE_URL &&
        !!process.env.ANTHROPIC_API_KEY &&
        process.env.ANTHROPIC_BASE_URL.includes('azure')
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

  // All providers need API key
  if (!config.apiKey) {
    errors.push(`Missing API key for provider: ${config.provider}`)
  }

  // AWS Bedrock needs AWS region
  if (config.provider === 'bedrock' && !config.awsRegion) {
    errors.push('Missing AWS_REGION for Bedrock')
  }

  // GCP Vertex needs project ID
  if (config.provider === 'vertex' && !config.gcpProjectId) {
    errors.push('Missing GCP_PROJECT_ID for Vertex AI')
  }

  // Azure OpenAI needs base URL
  if (config.provider === 'azure-openai' && !config.baseURL) {
    errors.push('Missing ANTHROPIC_BASE_URL for Azure OpenAI')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
