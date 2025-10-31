# Checkpoint WS3: MCP Integration

**Project**: omni-ai
**Duration**: 2-3 days
**Priority**: Critical Path
**Dependencies**: WS1 (Mastra setup), WS2 (Provider system)

## Overview

Integrate omni-api-mcp server with Mastra using the `@mastra/mcp` package. This allows Mastra agents to call MCP tools (discover_datasets, build_query, call_rest_api, etc.) from omni-api-mcp.

## Goals

1. Install and configure `@mastra/mcp` package
2. Connect to omni-api-mcp server process
3. Expose MCP tools to Mastra agents
4. Test tool calling (discover_datasets, build_query, call_rest_api)
5. Create tool call visualization UI component
6. Verify end-to-end integration

## Prerequisites

- [ ] WS1 complete (Mastra + Next.js setup)
- [ ] WS2 complete (Provider system working)
- [ ] omni-api-mcp built and ready at `../omni-api-mcp/dist/index.js`

## Tasks

### Task 1: Install @mastra/mcp Package

**Commands**:
```bash
npm install @mastra/mcp
```

**Verify Package**:
```bash
npm list @mastra/mcp
# Should show installed version
```

**Acceptance Criteria**:
- [ ] @mastra/mcp installed
- [ ] No dependency conflicts

### Task 2: Configure MCP Server Connection

**File**: `lib/mcp/mcp-client.ts` (new)

**Purpose**: Start omni-api-mcp as subprocess and establish MCP connection

**Implementation**:
```typescript
import { MCPClient } from '@mastra/mcp'
import { spawn } from 'child_process'

/**
 * MCP Client Manager for omni-api-mcp
 */
export class OmniAPIMCPClient {
  private client: MCPClient | null = null
  private serverProcess: any = null

  /**
   * Start omni-api-mcp server and connect
   */
  async connect(): Promise<void> {
    const mcpServerPath = process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js'

    // Start omni-api-mcp as subprocess
    this.serverProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Handle server errors
    this.serverProcess.stderr.on('data', (data: Buffer) => {
      console.error(`[omni-api-mcp] ${data.toString()}`)
    })

    this.serverProcess.on('error', (error: Error) => {
      console.error('[omni-api-mcp] Process error:', error)
    })

    // Create MCP client
    this.client = new MCPClient({
      stdin: this.serverProcess.stdin,
      stdout: this.serverProcess.stdout
    })

    // Initialize connection
    await this.client.connect()

    console.log('[omni-api-mcp] Connected successfully')
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
      await this.client.disconnect()
      this.client = null
    }

    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }

    console.log('[omni-api-mcp] Disconnected')
  }
}

// Singleton instance
let mcpClient: OmniAPIMCPClient | null = null

export async function getMCPClient(): Promise<OmniAPIMCPClient> {
  if (!mcpClient) {
    mcpClient = new OmniAPIMCPClient()
    await mcpClient.connect()
  }
  return mcpClient
}
```

**Environment Variables** (`.env.local`):
```env
# MCP Server
OMNI_API_MCP_PATH=../omni-api-mcp/dist/index.js
```

**Acceptance Criteria**:
- [ ] MCP client connects to omni-api-mcp
- [ ] Subprocess management works
- [ ] Error handling implemented
- [ ] Singleton pattern prevents multiple connections

### Task 3: Create Mastra Tool Wrappers for MCP Tools

**File**: `lib/mcp/tools.ts` (new)

**Purpose**: Wrap MCP tools to be compatible with Mastra's Tool interface

**Implementation**:
```typescript
import { createTool } from '@mastra/core'
import { getMCPClient } from './mcp-client'

/**
 * discover_datasets - List available API services
 */
export const discoverDatasetsTool = createTool({
  id: 'discover_datasets',
  description: 'Discover all available datasets/services with their capabilities and metadata',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Optional: Filter by category (monitoring, code, payments, etc.)'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Filter by tags'
      },
      includeExamples: {
        type: 'boolean',
        description: 'Include example queries (default: false)'
      }
    }
  },
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('discover_datasets', context)
    return result
  }
})

/**
 * build_query - Build API query from natural language intent
 */
export const buildQueryTool = createTool({
  id: 'build_query',
  description: 'Build service-specific API query from natural language intent',
  inputSchema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        description: 'Natural language description of what to query (e.g., "Find 500 errors in production")'
      },
      targetService: {
        type: 'string',
        description: 'Optional: Target service ID (e.g., "datadog", "github"). Auto-detected if not provided.'
      },
      context: {
        type: 'object',
        description: 'Optional: Additional context (environment, timeRange, filters)'
      }
    },
    required: ['intent']
  },
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('build_query', context)
    return result
  }
})

/**
 * call_rest_api - Execute REST API call
 */
export const callRestAPITool = createTool({
  id: 'call_rest_api',
  description: 'Execute a REST API call to a configured service',
  inputSchema: {
    type: 'object',
    properties: {
      service: {
        type: 'string',
        description: 'Service identifier (e.g., "datadog", "github", "stripe")'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        description: 'HTTP method'
      },
      path: {
        type: 'string',
        description: 'API path (e.g., "/api/v1/members/{id}"). Use {param} for path parameters.'
      },
      queryParams: {
        type: 'object',
        description: 'Query string parameters (e.g., {"limit": 10, "status": "active"})'
      },
      pathParams: {
        type: 'object',
        description: 'Path parameter substitutions (e.g., {"id": "12345"})'
      },
      body: {
        type: 'object',
        description: 'Request body for POST/PUT/PATCH requests'
      }
    },
    required: ['service', 'method', 'path']
  },
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('call_rest_api', context)
    return result
  }
})

/**
 * summarize_multi_api_results - Correlate data from multiple API responses
 */
export const summarizeMultiAPIResultsTool = createTool({
  id: 'summarize_multi_api_results',
  description: 'Correlate data from multiple API responses, detect inconsistencies, and generate unified summary',
  inputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        description: 'Array of API responses to correlate and summarize',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source API or service name' },
            response: { description: 'The API response data' }
          },
          required: ['source', 'response']
        }
      },
      correlationKey: {
        type: 'string',
        description: 'Optional: Field name to use for correlation (e.g., "id", "orderId")'
      },
      intent: {
        type: 'string',
        description: 'Optional: Overall intent of the multi-API operation'
      }
    },
    required: ['results']
  },
  execute: async ({ context }) => {
    const mcpClient = await getMCPClient()
    const result = await mcpClient.callTool('summarize_multi_api_results', context)
    return result
  }
})

/**
 * All MCP tools available to Mastra agents
 */
export const mcpTools = [
  discoverDatasetsTool,
  buildQueryTool,
  callRestAPITool,
  summarizeMultiAPIResultsTool
]
```

**Acceptance Criteria**:
- [ ] 4 core MCP tools wrapped for Mastra
- [ ] Input schemas match omni-api-mcp tool definitions
- [ ] execute() functions call MCP client correctly
- [ ] Tools can be passed to Mastra Agent

### Task 4: Create Test Agent to Verify MCP Integration

**File**: `lib/mastra/test-agent.ts` (new)

**Purpose**: Simple agent to test MCP tool calling

**Implementation**:
```typescript
import { Agent } from '@mastra/core'
import { providerManager } from './hybrid-provider-manager'
import { mcpTools } from '@/lib/mcp/tools'

/**
 * Test Agent for verifying MCP integration
 */
export function createTestAgent() {
  const provider = providerManager.getProvider('anthropic')

  return new Agent({
    name: 'MCP Test Agent',
    instructions: `You are a test agent for verifying MCP tool integration.

When asked to test MCP tools, you should:
1. Use discover_datasets to list available services
2. Use build_query to build a simple DataDog query
3. Report what you find

Be concise and factual.`,
    model: {
      provider: provider,
      name: 'claude-3-5-sonnet-20241022'
    },
    tools: mcpTools
  })
}
```

**Acceptance Criteria**:
- [ ] Test agent created with MCP tools
- [ ] Agent can be instantiated without errors

### Task 5: Create API Route to Test MCP Integration

**File**: `app/api/test-mcp/route.ts` (new)

**Purpose**: API endpoint to test MCP integration

**Implementation**:
```typescript
import { NextResponse } from 'next/server'
import { createTestAgent } from '@/lib/mastra/test-agent'
import { getMCPClient } from '@/lib/mcp/mcp-client'

export async function GET() {
  try {
    // Test 1: MCP Client Connection
    const mcpClient = await getMCPClient()
    const tools = await mcpClient.getTools()

    // Test 2: Direct MCP Tool Call
    const discoverResult = await mcpClient.callTool('discover_datasets', {
      category: 'monitoring'
    })

    // Test 3: Agent with MCP Tools
    const agent = createTestAgent()
    const agentResponse = await agent.generate({
      messages: [{
        role: 'user',
        content: 'Use discover_datasets to list monitoring services. Just tell me how many you found.'
      }]
    })

    return NextResponse.json({
      success: true,
      tests: {
        mcpConnection: {
          status: 'success',
          toolsFound: tools.length
        },
        directToolCall: {
          status: 'success',
          datasetsFound: discoverResult.total || 0
        },
        agentToolCall: {
          status: 'success',
          agentResponse: agentResponse.text
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

**Acceptance Criteria**:
- [ ] API route tests MCP connection
- [ ] API route tests direct tool call
- [ ] API route tests agent tool call
- [ ] Returns clear success/failure status

### Task 6: Manual Testing

**Test MCP Integration**:
```bash
# 1. Ensure omni-api-mcp is built
cd ../omni-api-mcp
npm run build

# 2. Start omni-ai dev server
cd ../omni-ai
npm run dev

# 3. Call test endpoint
curl http://localhost:3000/api/test-mcp
```

**Expected Response**:
```json
{
  "success": true,
  "tests": {
    "mcpConnection": {
      "status": "success",
      "toolsFound": 18
    },
    "directToolCall": {
      "status": "success",
      "datasetsFound": 5
    },
    "agentToolCall": {
      "status": "success",
      "agentResponse": "I found 5 monitoring services using discover_datasets."
    }
  }
}
```

**Acceptance Criteria**:
- [ ] MCP connection succeeds
- [ ] discover_datasets returns data
- [ ] Agent successfully calls MCP tools
- [ ] No errors in console

### Task 7: Create Tool Call Visualization Component

**File**: `components/tool-call-card.tsx` (new)

**Reference**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/tool-call-card.tsx`

**Implementation**:
```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  startTime: number
  endTime?: number
}

interface ToolCallCardProps {
  toolCall: ToolCall
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const duration = toolCall.endTime
    ? `${toolCall.endTime - toolCall.startTime}ms`
    : 'Running...'

  const StatusIcon = {
    pending: Loader2,
    running: Loader2,
    success: CheckCircle2,
    error: XCircle
  }[toolCall.status]

  const statusColor = {
    pending: 'text-muted-foreground',
    running: 'text-blue-500',
    success: 'text-green-500',
    error: 'text-red-500'
  }[toolCall.status]

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${statusColor} ${toolCall.status === 'running' ? 'animate-spin' : ''}`} />
              {toolCall.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {duration}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            MCP Tool
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Arguments */}
        {Object.keys(toolCall.arguments).length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium mb-1 text-muted-foreground">Arguments:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
        )}

        {/* Result */}
        {toolCall.status === 'success' && toolCall.result && (
          <div>
            <p className="text-xs font-medium mb-1 text-muted-foreground">Result:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {toolCall.status === 'error' && toolCall.error && (
          <div>
            <p className="text-xs font-medium mb-1 text-red-500">Error:</p>
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
              {toolCall.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**Acceptance Criteria**:
- [ ] Tool call card component created
- [ ] Shows tool name, status, duration
- [ ] Displays arguments and results
- [ ] Handles error state
- [ ] Matches omni-agent styling

### Task 8: Create Tool Call Store (for UI updates)

**File**: `lib/stores/tool-call-store.ts` (new)

**Implementation**:
```typescript
import { create } from 'zustand'
import type { ToolCall } from '@/components/tool-call-card'

interface ToolCallState {
  toolCalls: ToolCall[]
  addToolCall: (toolCall: ToolCall) => void
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void
  clearToolCalls: () => void
}

export const useToolCallStore = create<ToolCallState>((set) => ({
  toolCalls: [],
  addToolCall: (toolCall) =>
    set((state) => ({
      toolCalls: [...state.toolCalls, toolCall]
    })),
  updateToolCall: (id, updates) =>
    set((state) => ({
      toolCalls: state.toolCalls.map((tc) =>
        tc.id === id ? { ...tc, ...updates } : tc
      )
    })),
  clearToolCalls: () => set({ toolCalls: [] })
}))
```

**Acceptance Criteria**:
- [ ] Tool call store manages tool call history
- [ ] Can add, update, clear tool calls
- [ ] Reactive updates for UI

## Testing

### Integration Tests

**File**: `tests/mcp-integration.test.ts`

```typescript
import { getMCPClient } from '@/lib/mcp/mcp-client'

describe('MCP Integration', () => {
  let mcpClient: any

  beforeAll(async () => {
    mcpClient = await getMCPClient()
  })

  afterAll(async () => {
    await mcpClient.disconnect()
  })

  it('should connect to omni-api-mcp', async () => {
    const tools = await mcpClient.getTools()
    expect(tools.length).toBeGreaterThan(0)
  })

  it('should call discover_datasets', async () => {
    const result = await mcpClient.callTool('discover_datasets', {})
    expect(result.success).toBe(true)
    expect(result.datasets).toBeDefined()
  })

  it('should call build_query', async () => {
    const result = await mcpClient.callTool('build_query', {
      intent: 'Find errors in production'
    })
    expect(result.success).toBe(true)
    expect(result.query).toBeDefined()
  })
})
```

### Manual Testing Checklist

- [ ] Start omni-api-mcp manually, verify it runs
- [ ] Start omni-ai dev server, verify MCP connection in console
- [ ] Call `/api/test-mcp`, verify all 3 tests pass
- [ ] Check omni-api-mcp logs for incoming tool calls
- [ ] Test error handling (stop omni-api-mcp, verify graceful failure)

## Documentation

**File**: `docs/MCP_INTEGRATION_GUIDE.md` (new)

Document:
1. How @mastra/mcp works
2. How to add new MCP tools from omni-api-mcp
3. How Mastra agents call MCP tools
4. Tool call visualization architecture
5. Debugging MCP connection issues

## Acceptance Criteria (Summary)

- [ ] @mastra/mcp package installed
- [ ] MCP client connects to omni-api-mcp subprocess
- [ ] 4 core MCP tools wrapped for Mastra (discover_datasets, build_query, call_rest_api, summarize_multi_api_results)
- [ ] Test agent created and working
- [ ] API route tests MCP integration (3 tests pass)
- [ ] Tool call visualization component created
- [ ] Tool call store for UI updates
- [ ] Manual testing complete
- [ ] Integration tests pass
- [ ] No console errors

## Next Workstream

After completing WS3, proceed to:
- **WS4: Agents + Workflows** - Build 3 agents (DataDog Champion, API Correlator, Smart Agent) and 2 workflows

## Notes

- **MCP subprocess management** - Ensure omni-api-mcp process is killed on app shutdown
- **Error handling** - MCP connection failures should be gracefully handled
- **Tool call tracking** - Store tool calls for debugging and UI visualization
- **Performance** - MCP communication is fast (<50ms overhead per call)
- **Future enhancement** - Add retry logic for failed MCP tool calls

## Common Issues

**Issue**: MCP client fails to connect
**Solution**: Verify omni-api-mcp is built (`npm run build` in omni-api-mcp), check OMNI_API_MCP_PATH in .env.local

**Issue**: Tool calls timeout
**Solution**: Check omni-api-mcp logs for errors, verify API credentials are configured

**Issue**: Agent doesn't call tools
**Solution**: Verify tools are passed to Agent constructor, check agent instructions mention tool usage
