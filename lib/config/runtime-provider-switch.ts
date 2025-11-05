/**
 * Runtime Provider Switching
 *
 * Handles switching between Anthropic, AWS Bedrock, and GCP Vertex AI
 * at runtime by setting appropriate environment variables.
 *
 * The Claude Agent SDK reads these environment variables to determine
 * which provider to use for LLM calls.
 */

import { ProviderId } from './server-provider-config';

/**
 * Configure Claude Agent SDK for a specific provider
 *
 * This is called on the server before each query() call to ensure
 * the SDK uses the correct provider.
 */
export function configureProviderForSDK(providerId: ProviderId): void {
  // Clear all provider-specific environment variables first
  delete process.env.CLAUDE_CODE_USE_BEDROCK;
  delete process.env.CLAUDE_CODE_USE_VERTEX;

  switch (providerId) {
    case 'bedrock':
      // AWS Bedrock uses native Claude Agent SDK support
      process.env.CLAUDE_CODE_USE_BEDROCK = '1';
      // Ensure AWS credentials are set
      if (!process.env.AWS_REGION) {
        process.env.AWS_REGION = 'us-east-1'; // Default region
      }
      console.log('[PROVIDER] Configured for AWS Bedrock');
      break;

    case 'vertex':
      // GCP Vertex uses native Claude Agent SDK support
      process.env.CLAUDE_CODE_USE_VERTEX = '1';
      console.log('[PROVIDER] Configured for GCP Vertex AI');
      break;

    case 'azure-openai':
      // Azure uses ANTHROPIC_BASE_URL gateway
      // ANTHROPIC_BASE_URL should already be set in environment
      console.log(`[PROVIDER] Configured for Azure OpenAI: ${process.env.ANTHROPIC_BASE_URL}`);
      break;

    case 'anthropic':
    default:
      // Anthropic Direct API (default)
      // Just ensure API key is set
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('[PROVIDER] Warning: ANTHROPIC_API_KEY not set');
      }
      console.log('[PROVIDER] Configured for Anthropic (Direct API)');
      break;
  }
}

/**
 * Get provider-specific model ID for display
 *
 * Some providers use different model ID formats than others.
 * This helper standardizes the display format.
 */
export function getProviderDisplayModelId(providerId: ProviderId, modelId: string): string {
  switch (providerId) {
    case 'bedrock':
      // Bedrock uses anthropic.claude-3-5-sonnet-20241022-v2:0 format
      // Extract friendly name from ID
      if (modelId.includes('sonnet')) return 'Claude 3.5 Sonnet (Bedrock)';
      if (modelId.includes('opus')) return 'Claude 3 Opus (Bedrock)';
      if (modelId.includes('haiku')) return 'Claude 3 Haiku (Bedrock)';
      return 'Bedrock Model';

    case 'vertex':
      // Vertex uses claude-3-5-sonnet@20241022 format
      if (modelId.includes('sonnet')) return 'Claude 3.5 Sonnet (Vertex)';
      if (modelId.includes('opus')) return 'Claude 3 Opus (Vertex)';
      if (modelId.includes('haiku')) return 'Claude 3 Haiku (Vertex)';
      return 'Vertex Model';

    case 'azure-openai':
      // Azure uses GPT-4, GPT-4 Turbo, etc.
      return `${modelId} (Azure)`;

    case 'anthropic':
    default:
      // Just use the model ID as-is
      return modelId;
  }
}

/**
 * Validate that the required environment variables are set for a provider
 *
 * For AWS Bedrock:
 * - Required: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * - Optional: AWS_SESSION_TOKEN (for temporary credentials via STS, MFA, or IAM roles)
 */
export function validateProviderEnvironment(providerId: ProviderId): {
  valid: boolean;
  missingVars: string[];
} {
  const missingVars: string[] = [];

  switch (providerId) {
    case 'bedrock':
      if (!process.env.AWS_REGION) missingVars.push('AWS_REGION');
      if (!process.env.AWS_ACCESS_KEY_ID) missingVars.push('AWS_ACCESS_KEY_ID');
      if (!process.env.AWS_SECRET_ACCESS_KEY) missingVars.push('AWS_SECRET_ACCESS_KEY');
      // AWS_SESSION_TOKEN is optional (for temporary credentials)
      break;

    case 'vertex':
      if (!process.env.GCP_PROJECT_ID) missingVars.push('GCP_PROJECT_ID');
      if (!process.env.GCP_SERVICE_ACCOUNT_KEY) missingVars.push('GCP_SERVICE_ACCOUNT_KEY');
      break;

    case 'azure-openai':
      if (!process.env.ANTHROPIC_BASE_URL) missingVars.push('ANTHROPIC_BASE_URL');
      if (!process.env.ANTHROPIC_API_KEY) missingVars.push('ANTHROPIC_API_KEY');
      break;

    case 'anthropic':
    default:
      if (!process.env.ANTHROPIC_API_KEY) missingVars.push('ANTHROPIC_API_KEY');
      break;
  }

  return {
    valid: missingVars.length === 0,
    missingVars
  };
}
