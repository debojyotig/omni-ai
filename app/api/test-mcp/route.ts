import { NextResponse } from 'next/server'
import { createTestAgent } from '@/lib/mastra/test-agent'
import { getMCPClient } from '@/lib/mcp/mcp-client'

/**
 * Test MCP Integration Endpoint
 *
 * This endpoint performs 3 tests to verify MCP integration:
 * 1. MCP Client Connection - Verify connection to omni-api-mcp
 * 2. Direct MCP Tool Call - Call discover_datasets directly
 * 3. Agent with MCP Tools - Test agent tool calling
 *
 * Usage: GET /api/test-mcp
 */
export async function GET() {
  const testResults = {
    mcpConnection: {
      status: 'pending' as 'success' | 'error' | 'pending',
      message: '',
      toolsFound: 0
    },
    directToolCall: {
      status: 'pending' as 'success' | 'error' | 'pending',
      message: '',
      datasetsFound: 0
    },
    agentToolCall: {
      status: 'pending' as 'success' | 'error' | 'pending',
      message: '',
      agentResponse: ''
    }
  }

  try {
    // Test 1: MCP Client Connection
    console.log('[Test 1] Testing MCP connection...')
    try {
      const mcpClient = await getMCPClient()
      const tools = await mcpClient.getTools()

      testResults.mcpConnection.status = 'success'
      testResults.mcpConnection.message = `Connected to omni-api-mcp successfully`
      testResults.mcpConnection.toolsFound = tools.length

      console.log(`[Test 1] ✓ Found ${tools.length} MCP tools`)
    } catch (error: any) {
      testResults.mcpConnection.status = 'error'
      testResults.mcpConnection.message = error.message
      console.error('[Test 1] ✗ MCP connection failed:', error)

      // If connection fails, skip other tests
      return NextResponse.json({
        success: false,
        error: 'MCP connection failed',
        tests: testResults
      }, { status: 500 })
    }

    // Test 2: Direct MCP Tool Call
    console.log('[Test 2] Testing direct MCP tool call...')
    try {
      const mcpClient = await getMCPClient()
      const result = await mcpClient.callTool('discover_datasets', {
        category: 'monitoring'
      })

      testResults.directToolCall.status = 'success'
      testResults.directToolCall.message = 'discover_datasets called successfully'
      testResults.directToolCall.datasetsFound = result.total || result.datasets?.length || 0

      console.log(`[Test 2] ✓ Found ${testResults.directToolCall.datasetsFound} monitoring datasets`)
    } catch (error: any) {
      testResults.directToolCall.status = 'error'
      testResults.directToolCall.message = error.message
      console.error('[Test 2] ✗ Direct tool call failed:', error)
    }

    // Test 3: Agent with MCP Tools
    console.log('[Test 3] Testing agent with MCP tools...')
    try {
      const agent = createTestAgent()
      const agentResponse = await agent.generate([
        {
          role: 'user',
          content: 'Use discover_datasets to list monitoring services. Just tell me how many you found.'
        }
      ])

      testResults.agentToolCall.status = 'success'
      testResults.agentToolCall.message = 'Agent called MCP tools successfully'
      testResults.agentToolCall.agentResponse = agentResponse.text || 'No response'

      console.log('[Test 3] ✓ Agent response:', agentResponse.text)
    } catch (error: any) {
      testResults.agentToolCall.status = 'error'
      testResults.agentToolCall.message = error.message
      testResults.agentToolCall.agentResponse = ''
      console.error('[Test 3] ✗ Agent tool call failed:', error)
    }

    // Determine overall success
    const allTestsPassed =
      testResults.mcpConnection.status === 'success' &&
      testResults.directToolCall.status === 'success' &&
      testResults.agentToolCall.status === 'success'

    return NextResponse.json({
      success: allTestsPassed,
      summary: allTestsPassed
        ? 'All MCP integration tests passed ✓'
        : 'Some MCP integration tests failed',
      tests: testResults
    })
  } catch (error: any) {
    console.error('[MCP Test] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        tests: testResults
      },
      { status: 500 }
    )
  }
}
