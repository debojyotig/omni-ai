import { MCPClient } from '@mastra/mcp'

/**
 * MCP Client Manager for omni-api-mcp
 *
 * Manages connection to omni-api-mcp server via MCP protocol.
 * Provides tool discovery and execution capabilities.
 */
export class OmniAPIMCPClient {
  private client: MCPClient | null = null
  private isConnecting = false

  /**
   * Connect to omni-api-mcp server
   */
  async connect(): Promise<void> {
    if (this.client) {
      return // Already connected
    }

    if (this.isConnecting) {
      // Wait for connection to complete
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    this.isConnecting = true

    try {
      const mcpServerPath = process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js'

      console.log(`[omni-api-mcp] Configuring MCP client for: ${mcpServerPath}`)

      // Create MCP client using Mastra's MCPClient API
      this.client = new MCPClient({
        id: 'omni-api-mcp',
        servers: {
          'omni-api': {
            command: 'node',
            args: [mcpServerPath],
          },
        },
      })

      console.log('[omni-api-mcp] MCP client configured successfully')
    } catch (error) {
      console.error('[omni-api-mcp] Configuration failed:', error)
      this.client = null
      throw error
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Get all tools from MCP servers as Mastra tools
   */
  async getTools() {
    if (!this.client) {
      throw new Error('MCP client not connected. Call connect() first.')
    }

    return await this.client.getTools()
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect()
      } catch (error) {
        console.error('[omni-api-mcp] Disconnect error:', error)
      }
      this.client = null
    }

    console.log('[omni-api-mcp] Disconnected')
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.client !== null
  }
}

// Singleton instance
let mcpClient: OmniAPIMCPClient | null = null

/**
 * Get or create MCP client singleton
 */
export async function getMCPClient(): Promise<OmniAPIMCPClient> {
  if (!mcpClient) {
    mcpClient = new OmniAPIMCPClient()
    await mcpClient.connect()
  } else if (!mcpClient.isConnected()) {
    // Reconnect if disconnected
    await mcpClient.connect()
  }
  return mcpClient
}

/**
 * Cleanup MCP client on process exit
 */
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (mcpClient) {
      mcpClient.disconnect()
    }
  })

  process.on('SIGINT', () => {
    if (mcpClient) {
      mcpClient.disconnect()
    }
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    if (mcpClient) {
      mcpClient.disconnect()
    }
    process.exit(0)
  })
}
