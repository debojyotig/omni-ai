import { MCPClient } from '@mastra/mcp'
import { spawn, ChildProcess } from 'child_process'

/**
 * MCP Client Manager for omni-api-mcp
 *
 * Manages connection to omni-api-mcp server process via MCP protocol.
 * Provides tool discovery and execution capabilities.
 */
export class OmniAPIMCPClient {
  private client: MCPClient | null = null
  private serverProcess: ChildProcess | null = null
  private isConnecting = false

  /**
   * Start omni-api-mcp server and connect
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

      console.log(`[omni-api-mcp] Starting server at: ${mcpServerPath}`)

      // Start omni-api-mcp as subprocess
      this.serverProcess = spawn('node', [mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      // Handle server errors
      this.serverProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`[omni-api-mcp] ${data.toString()}`)
      })

      this.serverProcess.on('error', (error: Error) => {
        console.error('[omni-api-mcp] Process error:', error)
      })

      this.serverProcess.on('exit', (code: number | null) => {
        console.log(`[omni-api-mcp] Process exited with code ${code}`)
        this.client = null
        this.serverProcess = null
      })

      // Create MCP client
      this.client = new MCPClient({
        stdin: this.serverProcess.stdin!,
        stdout: this.serverProcess.stdout!
      })

      // Initialize connection
      await this.client.connect()

      console.log('[omni-api-mcp] Connected successfully')
    } catch (error) {
      console.error('[omni-api-mcp] Connection failed:', error)
      this.client = null
      if (this.serverProcess) {
        this.serverProcess.kill()
        this.serverProcess = null
      }
      throw error
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Get list of available MCP tools
   */
  async getTools() {
    if (!this.client) {
      throw new Error('MCP client not connected. Call connect() first.')
    }

    return await this.client.listTools()
  }

  /**
   * Call MCP tool
   */
  async callTool(name: string, arguments_: Record<string, any>) {
    if (!this.client) {
      throw new Error('MCP client not connected. Call connect() first.')
    }

    return await this.client.callTool({
      name,
      arguments: arguments_
    })
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

    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
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
