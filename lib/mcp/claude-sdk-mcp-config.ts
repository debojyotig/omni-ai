/**
 * Claude Agent SDK MCP Configuration for omni-api-mcp
 *
 * Configures the omni-api-mcp server for use with Claude Agent SDK.
 * This replaces the Mastra MCP client with native SDK support.
 */

export interface MCPServerConfig {
  type: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Configuration for omni-api-mcp MCP server
 *
 * Uses stdio transport to communicate with the omni-api-mcp subprocess.
 * All environment variables are passed to ensure API access.
 */
export const omniApiMcpConfig: MCPServerConfig = {
  type: 'stdio',
  command: 'node',
  args: [process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js'],
  env: {
    ...process.env, // Pass all environment variables (API keys, tokens, etc.)
  } as Record<string, string>
};

/**
 * All MCP servers available to Claude Agent SDK
 */
export const mcpServers = {
  'omni-api': omniApiMcpConfig
};
