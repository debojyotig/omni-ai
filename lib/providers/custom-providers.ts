/**
 * Custom OAuth2 Providers (Azure, AWS, GCP)
 *
 * NOTE: These providers are placeholders for future OAuth2 implementation.
 * Currently not in use - standard providers (OpenAI, Anthropic) work via env vars.
 */

import { oauth2Gateway, type OAuth2Config } from '@/lib/auth/oauth2-gateway'
import type { ModelConfig } from './standard-providers'

/**
 * Azure OpenAI Provider (Placeholder)
 * Future: OAuth2 authentication
 */
export class AzureOpenAIProvider {
  private provider: any = null
  private readonly providerId = 'azure-openai'

  constructor(config?: {
    endpoint?: string
    deployment?: string
  }) {
    // Register OAuth2 config if environment variables are set
    if (process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_TOKEN_ENDPOINT &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET) {

      const oauth2Config: OAuth2Config = {
        tokenEndpoint: process.env.AZURE_TOKEN_ENDPOINT,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        scope: 'https://cognitiveservices.azure.com/.default'
      }

      oauth2Gateway.registerProvider(this.providerId, oauth2Config)
    }
  }

  /**
   * Get provider instance with OAuth2 token
   * NOTE: Placeholder - not currently functional
   */
  async getProvider(): Promise<any> {
    // TODO: Implement with AI SDK v5 providers
    // Get fresh OAuth2 token
    const token = await oauth2Gateway.getToken(this.providerId)

    // Future: Create provider with token
    // this.provider = createAzureOpenAI({ token, baseURL: ... })

    return this.provider
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.AZURE_OPENAI_ENDPOINT &&
      process.env.AZURE_TOKEN_ENDPOINT &&
      process.env.AZURE_CLIENT_ID &&
      process.env.AZURE_CLIENT_SECRET
    )
  }
}

/**
 * AWS Bedrock Provider
 * Uses OAuth2 for AWS credentials
 */
export class AWSBedrockProvider {
  private readonly providerId = 'aws-bedrock'

  constructor() {
    // Register OAuth2 config if environment variables are set
    if (process.env.AWS_TOKEN_ENDPOINT &&
        process.env.AWS_CLIENT_ID &&
        process.env.AWS_CLIENT_SECRET) {

      const oauth2Config: OAuth2Config = {
        tokenEndpoint: process.env.AWS_TOKEN_ENDPOINT,
        clientId: process.env.AWS_CLIENT_ID,
        clientSecret: process.env.AWS_CLIENT_SECRET,
        scope: process.env.AWS_SCOPE
      }

      oauth2Gateway.registerProvider(this.providerId, oauth2Config)
    }
  }

  /**
   * Get OAuth2 token for AWS Bedrock
   */
  async getToken(): Promise<string> {
    return oauth2Gateway.getToken(this.providerId)
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.AWS_TOKEN_ENDPOINT &&
      process.env.AWS_CLIENT_ID &&
      process.env.AWS_CLIENT_SECRET
    )
  }
}

/**
 * GCP Vertex AI Provider
 * Uses OAuth2 for GCP credentials
 */
export class GCPVertexProvider {
  private readonly providerId = 'gcp-vertex'

  constructor() {
    // Register OAuth2 config if environment variables are set
    if (process.env.GCP_TOKEN_ENDPOINT &&
        process.env.GCP_CLIENT_ID &&
        process.env.GCP_CLIENT_SECRET) {

      const oauth2Config: OAuth2Config = {
        tokenEndpoint: process.env.GCP_TOKEN_ENDPOINT,
        clientId: process.env.GCP_CLIENT_ID,
        clientSecret: process.env.GCP_CLIENT_SECRET,
        scope: 'https://www.googleapis.com/auth/cloud-platform'
      }

      oauth2Gateway.registerProvider(this.providerId, oauth2Config)
    }
  }

  /**
   * Get OAuth2 token for GCP Vertex AI
   */
  async getToken(): Promise<string> {
    return oauth2Gateway.getToken(this.providerId)
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.GCP_TOKEN_ENDPOINT &&
      process.env.GCP_CLIENT_ID &&
      process.env.GCP_CLIENT_SECRET
    )
  }
}

/**
 * Model configurations for custom providers
 */
export const customModels: Record<string, ModelConfig[]> = {
  'azure-openai': [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Azure)', provider: 'azure-openai', maxTokens: 128000 },
    { id: 'gpt-4', name: 'GPT-4 (Azure)', provider: 'azure-openai', maxTokens: 8192 },
    { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo (Azure)', provider: 'azure-openai', maxTokens: 16385 }
  ],
  'aws-bedrock': [
    { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet (Bedrock)', provider: 'aws-bedrock', maxTokens: 200000 },
    { id: 'anthropic.claude-3-opus-20240229-v1:0', name: 'Claude 3 Opus (Bedrock)', provider: 'aws-bedrock', maxTokens: 200000 },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku (Bedrock)', provider: 'aws-bedrock', maxTokens: 200000 }
  ],
  'gcp-vertex': [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gcp-vertex', maxTokens: 2000000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gcp-vertex', maxTokens: 1000000 }
  ]
}

/**
 * Initialize all custom providers
 */
export function createCustomProviders() {
  return {
    azureOpenAI: new AzureOpenAIProvider(),
    awsBedrock: new AWSBedrockProvider(),
    gcpVertex: new GCPVertexProvider()
  }
}

/**
 * Get all available custom providers (configured ones only)
 */
export function getAvailableCustomProviders(): string[] {
  const providers = createCustomProviders()
  const available: string[] = []

  if (providers.azureOpenAI.isConfigured()) available.push('azure-openai')
  if (providers.awsBedrock.isConfigured()) available.push('aws-bedrock')
  if (providers.gcpVertex.isConfigured()) available.push('gcp-vertex')

  return available
}

/**
 * Get models for a custom provider
 */
export function getModelsForCustomProvider(provider: string): ModelConfig[] {
  return customModels[provider] || []
}
