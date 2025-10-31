import { createTool } from '@mastra/core'
import { getMCPClient } from './mcp-client'
import { z } from 'zod'

/**
 * discover_datasets - List available API services
 *
 * Discovers all available datasets/services with their capabilities and metadata.
 * Useful for understanding what services are available before building queries.
 */
export const discoverDatasetsTool = createTool({
  id: 'discover_datasets',
  description: 'Discover all available datasets/services with their capabilities and metadata. Use this to find out what monitoring services, APIs, or data sources are available.',
  inputSchema: z.object({
    category: z.string().optional().describe('Optional: Filter by category (monitoring, code, payments, etc.)'),
    tags: z.array(z.string()).optional().describe('Optional: Filter by tags (any match)'),
    includeExamples: z.boolean().optional().describe('Include example queries (default: false)'),
    includeDataModel: z.boolean().optional().describe('Include data model information (default: false)')
  }),
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('discover_datasets', context)
    return result
  }
})

/**
 * build_query - Build API query from natural language intent
 *
 * Translates natural language investigation intents into service-specific API queries.
 * This is the primary tool for converting user requests into executable API calls.
 *
 * Example intents:
 * - "Find all 500 errors in production API from the last 24 hours"
 * - "Show top 10 slow requests in auth service"
 * - "Get monitor status for production environment"
 */
export const buildQueryTool = createTool({
  id: 'build_query',
  description: 'Build service-specific API query from natural language intent. Translates investigation requests (like "Find 500 errors in production") into executable API queries. Returns a query with high confidence score that can be used with call_rest_api or call_graphql.',
  inputSchema: z.object({
    intent: z.string().describe('Natural language description of what to query (e.g., "Find 500 errors in production from last 24 hours")'),
    targetService: z.string().optional().describe('Optional: Target service ID (e.g., "datadog", "github", "stripe"). Auto-detected if not provided.'),
    context: z.object({
      environment: z.string().optional().describe('Environment (e.g., "production", "staging")'),
      timeRange: z.string().optional().describe('Time range (e.g., "last 24 hours", "last week")'),
      filters: z.record(z.any()).optional().describe('Additional filters as key-value pairs')
    }).optional().describe('Optional: Additional context (environment, timeRange, filters)')
  }),
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('build_query', context)
    return result
  }
})

/**
 * call_rest_api - Execute REST API call
 *
 * Executes a REST API call to a configured service with automatic authentication.
 * Supports all HTTP methods and handles path parameters, query parameters, and request bodies.
 */
export const callRestAPITool = createTool({
  id: 'call_rest_api',
  description: 'Execute a REST API call to a configured service with automatic authentication. Supports GET, POST, PUT, PATCH, DELETE methods. Returns the API response with status code and data.',
  inputSchema: z.object({
    service: z.string().describe('Service identifier (e.g., "datadog", "github", "stripe")'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).describe('HTTP method'),
    path: z.string().describe('API path (e.g., "/api/v1/query"). Use {param} for path parameters.'),
    queryParams: z.record(z.any()).optional().describe('Query string parameters (e.g., {"limit": 10, "status": "active"})'),
    pathParams: z.record(z.string()).optional().describe('Path parameter substitutions (e.g., {"id": "12345"})'),
    body: z.record(z.any()).optional().describe('Request body for POST/PUT/PATCH requests'),
    headers: z.record(z.string()).optional().describe('Additional HTTP headers')
  }),
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('call_rest_api', context)
    return result
  }
})

/**
 * call_graphql - Execute GraphQL query
 *
 * Executes a GraphQL query or mutation against a configured service.
 */
export const callGraphQLTool = createTool({
  id: 'call_graphql',
  description: 'Execute a GraphQL query or mutation against a configured service with automatic authentication. Returns the GraphQL response data.',
  inputSchema: z.object({
    service: z.string().describe('Service identifier (e.g., "countries", "spacex")'),
    query: z.string().describe('GraphQL query or mutation string'),
    variables: z.record(z.any()).optional().describe('Variables for the GraphQL query'),
    operationName: z.string().optional().describe('Optional operation name when the query contains multiple operations')
  }),
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('call_graphql', context)
    return result
  }
})

/**
 * summarize_multi_api_results - Correlate data from multiple API responses
 *
 * Analyzes and correlates data from multiple API calls, detecting inconsistencies
 * and generating a unified summary. Essential for cross-service investigations.
 *
 * Example use case:
 * - After fetching error logs from DataDog and deployment info from GitHub,
 *   use this tool to correlate the data and identify relationships.
 */
export const summarizeMultiAPIResultsTool = createTool({
  id: 'summarize_multi_api_results',
  description: 'Correlate data from multiple API responses, detect inconsistencies, and generate unified summary. Use this after calling multiple APIs to find relationships and patterns across different data sources.',
  inputSchema: z.object({
    results: z.array(
      z.object({
        source: z.string().describe('Source API or service name'),
        response: z.any().describe('The API response data'),
        intent: z.string().optional().describe('Optional: Purpose of this API call'),
        timestamp: z.string().optional().describe('Optional: When the response was received')
      })
    ).describe('Array of API responses to correlate and summarize'),
    correlationKey: z.string().optional().describe('Optional: Field name to use for correlation (e.g., "id", "orderId", "timestamp")'),
    intent: z.string().optional().describe('Optional: Overall intent of the multi-API operation')
  }),
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('summarize_multi_api_results', context)
    return result
  }
})

/**
 * All MCP tools available to Mastra agents
 *
 * These tools provide access to omni-api-mcp's capabilities:
 * 1. discover_datasets - Find available services
 * 2. build_query - Translate natural language to API queries
 * 3. call_rest_api - Execute REST API calls
 * 4. call_graphql - Execute GraphQL queries
 * 5. summarize_multi_api_results - Correlate multi-API results
 */
export const mcpTools = [
  discoverDatasetsTool,
  buildQueryTool,
  callRestAPITool,
  callGraphQLTool,
  summarizeMultiAPIResultsTool
]

/**
 * Tool names for reference
 */
export const MCP_TOOL_NAMES = {
  DISCOVER_DATASETS: 'discover_datasets',
  BUILD_QUERY: 'build_query',
  CALL_REST_API: 'call_rest_api',
  CALL_GRAPHQL: 'call_graphql',
  SUMMARIZE_MULTI_API_RESULTS: 'summarize_multi_api_results'
} as const
