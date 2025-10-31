import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getMCPClient } from './mcp-client';

/**
 * MCP Tools from omni-api-mcp
 *
 * Mastra's MCPClient.getTools() automatically converts MCP tools
 * into Mastra-compatible tools that can be used by agents.
 *
 * For workflows, we export individual tool wrappers.
 */

let cachedTools: Record<string, any> | null = null;

/**
 * Get all MCP tools from omni-api-mcp server
 *
 * Tools are cached after first load to avoid reconnecting on every agent creation.
 * Tool names are transformed to remove the mcp__omni-api__ prefix so agents can use simple names.
 *
 * CRITICAL: Adds Anthropic prompt caching to the LAST tool to cache all 14 tools,
 * reducing input tokens from ~10,000 to ~100 per request after first call (90% reduction).
 */
export async function getMCPTools() {
  if (cachedTools) {
    console.log('[getMCPTools] Returning cached tools. Available tool names:', Object.keys(cachedTools));
    return cachedTools;
  }

  console.log('[getMCPTools] Loading tools from MCP client...');
  const mcpClient = await getMCPClient();
  const toolsWithPrefix = await mcpClient.getTools();

  console.log('[getMCPTools] Received tools from MCP with keys:', Object.keys(toolsWithPrefix));

  // Transform tool keys to remove the omni-api_ prefix
  // This allows agents to call tools using simple names like "call_rest_api"
  // instead of "omni-api_call_rest_api"
  const tools: Record<string, any> = {};
  const toolEntries = Object.entries(toolsWithPrefix);

  for (let i = 0; i < toolEntries.length; i++) {
    const [key, tool] = toolEntries[i];
    const simpleName = key.replace('omni-api_', '');
    console.log(`[getMCPTools] Transforming key: "${key}" -> "${simpleName}"`);

    // CRITICAL: Add cacheControl to the LAST tool to cache all tools (per Anthropic docs)
    // This caches all 14 tool definitions (~10k tokens) for 5 minutes
    const isLastTool = i === toolEntries.length - 1;
    if (isLastTool) {
      tools[simpleName] = {
        ...tool,
        providerOptions: {
          anthropic: {
            cacheControl: { type: 'ephemeral' as const }, // Cache for 5 minutes
          },
        },
      };
      console.log(`[getMCPTools] Added cacheControl to last tool: "${simpleName}" (will cache all ${toolEntries.length} tools)`);
    } else {
      tools[simpleName] = tool;
    }
  }

  console.log('[getMCPTools] Final tool names after transformation:', Object.keys(tools));
  cachedTools = tools;
  return tools;
}

/**
 * Individual tool wrappers for workflow usage
 */

export const discoverDatasetsTool = createTool({
  id: 'discover_datasets',
  description: 'Find available API services',
  inputSchema: z.object({
    category: z.string().optional().describe('Filter by category (e.g., "monitoring")'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
  }),
  outputSchema: z.any(),
  execute: async ({ context, mastra, runtimeContext }) => {
    const mcpTools = await getMCPTools();
    const tool = mcpTools['discover_datasets'];
    if (!tool) {
      throw new Error('Tool discover_datasets not found');
    }
    return await tool.execute({ context, mastra, runtimeContext });
  },
});

export const buildQueryTool = createTool({
  id: 'build_query',
  description: 'Convert natural language intent to API query',
  inputSchema: z.object({
    intent: z.string().describe('Natural language description of what to query'),
    targetService: z.string().optional().describe('Target service ID (e.g., "datadog")'),
    context: z.any().optional().describe('Additional context'),
  }),
  outputSchema: z.any(),
  execute: async ({ context, mastra, runtimeContext }) => {
    const mcpTools = await getMCPTools();
    const tool = mcpTools['build_query'];
    if (!tool) {
      throw new Error('Tool build_query not found');
    }
    return await tool.execute({ context, mastra, runtimeContext });
  },
});

export const callRestAPITool = createTool({
  id: 'call_rest_api',
  description: 'Execute REST API call',
  inputSchema: z.object({
    service: z.string().describe('Service identifier'),
    method: z.string().describe('HTTP method'),
    path: z.string().describe('API path'),
    queryParams: z.any().optional().describe('Query parameters'),
    body: z.any().optional().describe('Request body'),
    headers: z.any().optional().describe('Additional headers'),
  }),
  outputSchema: z.any(),
  execute: async ({ context, mastra, runtimeContext }) => {
    const mcpTools = await getMCPTools();
    const tool = mcpTools['call_rest_api'];
    if (!tool) {
      throw new Error('Tool call_rest_api not found');
    }
    return await tool.execute({ context, mastra, runtimeContext });
  },
});

export const callGraphQLTool = createTool({
  id: 'call_graphql',
  description: 'Execute GraphQL query',
  inputSchema: z.object({
    service: z.string().describe('Service identifier'),
    query: z.string().describe('GraphQL query'),
    variables: z.any().optional().describe('Query variables'),
    operationName: z.string().optional().describe('Operation name'),
  }),
  outputSchema: z.any(),
  execute: async ({ context, mastra, runtimeContext }) => {
    const mcpTools = await getMCPTools();
    const tool = mcpTools['call_graphql'];
    if (!tool) {
      throw new Error('Tool call_graphql not found');
    }
    return await tool.execute({ context, mastra, runtimeContext });
  },
});

export const summarizeMultiAPIResultsTool = createTool({
  id: 'summarize_multi_api_results',
  description: 'Correlate data from multiple API responses',
  inputSchema: z.object({
    results: z.array(
      z.object({
        source: z.string().describe('Source API or service name'),
        response: z.any().describe('API response data'),
        intent: z.string().optional().describe('Purpose of this API call'),
        timestamp: z.string().optional().describe('When the response was received'),
      })
    ),
    correlationKey: z.string().optional().describe('Field name to use for correlation'),
    intent: z.string().optional().describe('Overall intent of the multi-API operation'),
  }),
  outputSchema: z.any(),
  execute: async ({ context, mastra, runtimeContext }) => {
    const mcpTools = await getMCPTools();
    const tool = mcpTools['summarize_multi_api_results'];
    if (!tool) {
      throw new Error('Tool summarize_multi_api_results not found');
    }
    return await tool.execute({ context, mastra, runtimeContext });
  },
});
