import { Agent } from '@mastra/core'
import { hybridProviderManager } from '@/lib/providers/hybrid-manager'
import { mcpTools } from '@/lib/mcp/tools'

/**
 * Test Agent for verifying MCP integration
 *
 * This agent is used to test that MCP tools are working correctly
 * with the Mastra framework. It's a simple agent that can:
 * 1. Discover available datasets
 * 2. Build queries from natural language
 * 3. Execute API calls
 * 4. Correlate results
 */
export function createTestAgent() {
  // Get the first available provider (prefer Anthropic)
  const provider = hybridProviderManager.getProvider('anthropic') || hybridProviderManager.getProvider('openai')

  if (!provider) {
    throw new Error('No provider available. Please configure ANTHROPIC_API_KEY or OPENAI_API_KEY in .env.local')
  }

  // Get the first available model for the provider
  const providerInfo = hybridProviderManager.getAvailableProviders()[0]
  const model = hybridProviderManager.getDefaultModel(providerInfo.id)

  if (!model) {
    throw new Error(`No model available for provider: ${providerInfo.id}`)
  }

  return new Agent({
    name: 'MCP Test Agent',
    instructions: `You are a test agent for verifying MCP tool integration.

Your primary purpose is to test that MCP tools are working correctly:

1. **discover_datasets** - Use this to list available API services
   - Test with no parameters to see all services
   - Test with category filter (e.g., category: "monitoring")

2. **build_query** - Use this to build API queries from natural language
   - Test with simple intent: "Find errors in production"
   - Test with DataDog queries: "Show 500 errors from last 24 hours"

3. **call_rest_api** - Use this to execute API calls (requires valid credentials)
   - Only test if you have a valid query from build_query

4. **summarize_multi_api_results** - Use this to correlate multiple API responses
   - Only test if you have multiple API responses to correlate

When asked to test MCP tools:
- Start with discover_datasets to verify connection
- Try build_query with a simple intent
- Report what you find in a concise format
- If any tool fails, explain the error clearly

Be concise and factual in your responses.`,
    model: {
      provider: provider,
      name: model.id
    },
    tools: mcpTools
  })
}

/**
 * Create test agent with specific provider and model
 */
export function createTestAgentWithModel(providerId: string, modelId: string) {
  const provider = hybridProviderManager.getProvider(providerId)

  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`)
  }

  const model = hybridProviderManager.getModels(providerId).find(m => m.id === modelId)

  if (!model) {
    throw new Error(`Model not found: ${modelId}`)
  }

  return new Agent({
    name: 'MCP Test Agent',
    instructions: `You are a test agent for verifying MCP tool integration.

When asked to test MCP tools, use discover_datasets to list services and build_query to create queries.
Be concise and report findings clearly.`,
    model: {
      provider: provider,
      name: model.id
    },
    tools: mcpTools
  })
}
