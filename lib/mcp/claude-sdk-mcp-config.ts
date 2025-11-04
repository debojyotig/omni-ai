/**
 * Claude Agent SDK MCP Configuration for omni-api-mcp
 *
 * Configures the omni-api-mcp server for use with Claude Agent SDK.
 * This replaces the Mastra MCP client with native SDK support.
 *
 * Path resolution strategy:
 * 1. Check OMNI_API_MCP_PATH environment variable (highest priority)
 * 2. Production: Use bundled MCP at ./bundled-mcp/omni-api-mcp/dist/index.js
 * 3. Development: Use sibling directory at ../omni-api-mcp/dist/index.js
 */

import path from 'path';

export interface MCPServerConfig {
  type: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Resolves the path to omni-api-mcp depending on environment
 */
function getOmniApiMcpPath(): string {
  // 1. Check environment variable (highest priority - for custom deployments)
  if (process.env.OMNI_API_MCP_PATH) {
    console.log('[MCP] Using custom OMNI_API_MCP_PATH:', process.env.OMNI_API_MCP_PATH);
    return process.env.OMNI_API_MCP_PATH;
  }

  // 2. Production: Use bundled MCP
  if (process.env.NODE_ENV === 'production') {
    const bundledPath = path.join(process.cwd(), 'bundled-mcp/omni-api-mcp/dist/index.js');
    console.log('[MCP] Production mode: using bundled MCP at', bundledPath);
    return bundledPath;
  }

  // 3. Development: Use sibling directory
  const devPath = path.join(process.cwd(), '../omni-api-mcp/dist/index.js');
  console.log('[MCP] Development mode: using sibling directory at', devPath);
  return devPath;
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
  args: [getOmniApiMcpPath()],
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
