# Mastra MCP Integration - Best Practices

**Purpose**: Document correct patterns for integrating omni-api-mcp via Mastra's MCP system

**Source**: https://mastra.ai/en/docs/tools-mcp/mcp-overview

**Last Updated**: 2025-10-30

---

## Folder Structure ✅ CORRECT

### ❌ INCORRECT (from initial checkpoint):
```
lib/
├── mcp/
│   └── mcp-client.ts          # WRONG: Not organized under mastra/
```

### ✅ CORRECT (Official Mastra structure):
```
src/
└── mastra/                     # Official Mastra folder
    ├── agents/
    │   ├── datadog-champion.ts
    │   ├── api-correlator.ts
    │   └── smart-agent.ts
    ├── tools/
    ├── workflows/
    ├── mcp/
    │   └── omni-api-client.ts  # MCP client configuration
    └── index.ts                # Main Mastra entry point
```

**Why**: Official Mastra structure from https://mastra.ai/en/docs/getting-started/project-structure

---

## Implementation Pattern ✅ CORRECT

### Step 1: Create MCP Client Configuration

**File**: `src/mastra/mcp/omni-api-client.ts`

```typescript
import { MCPClient } from '@mastra/mcp'

/**
 * omni-api-mcp server configuration
 * Connects to local omni-api-mcp subprocess
 */
export const omniApiMcpClient = new MCPClient({
  name: 'omni-api',  // Unique identifier
  command: 'node',   // Command to run
  args: [
    process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js'
  ]
})

/**
 * Get all MCP tools from omni-api-mcp
 * Call this when creating agents
 */
export async function getOmniApiTools() {
  return await omniApiMcpClient.getTools()
}

/**
 * Get toolsets for multi-tenant scenarios (future enhancement)
 * Useful if we need per-user credentials
 */
export async function getOmniApiToolsets() {
  return await omniApiMcpClient.getToolsets()
}
```

**Key Points**:
- ✅ Use Mastra's built-in `MCPClient` (no custom wrapper needed)
- ✅ Configure with `command` for local server (subprocess)
- ✅ Would use `url` for remote server (HTTPS endpoint)
- ✅ `.getTools()` returns static tool list
- ✅ `.getToolsets()` for multi-tenant (per-user credentials)

---

### Step 2: Register MCP Server in Main Mastra Instance

**File**: `src/mastra/index.ts`

```typescript
import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import path from 'path'
import { omniApiMcpClient } from './mcp/omni-api-client'

/**
 * Main Mastra instance with LibSQL storage and MCP servers
 */
export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: `file:${path.join(process.cwd(), '.mastra', 'data.db')}`
  }),
  mcpServers: [
    omniApiMcpClient  // Register omni-api-mcp here
    // Add more MCP servers as needed
  ]
})
```

**Key Points**:
- ✅ Register MCP servers in `mcpServers` array
- ✅ Centralized configuration
- ✅ Can register multiple MCP servers (e.g., omni-api-mcp + shadcn MCP + GitHub MCP)

---

### Step 3: Use MCP Tools in Agents

**File**: `src/mastra/agents/datadog-champion.ts`

```typescript
import { Agent } from '@mastra/core'
import { Memory } from '@mastra/memory'
import { providerManager } from '@/lib/providers/hybrid-manager'
import { getOmniApiTools } from '../mcp/omni-api-client'

/**
 * DataDog Champion Agent
 */
export async function createDataDogChampion(provider: string, model: string) {
  const providerInstance = providerManager.getProvider(provider as any)
  const tools = await getOmniApiTools()  // Get MCP tools

  return new Agent({
    name: 'DataDog Champion',
    instructions: `You are a DataDog expert...`,
    model: {
      provider: providerInstance,
      name: model
    },
    tools,  // Pass MCP tools directly
    memory: new Memory()
  })
}
```

**Key Points**:
- ✅ Call `getOmniApiTools()` to fetch tools
- ✅ Pass tools directly to Agent constructor
- ✅ Mastra handles tool execution automatically

---

## Abort Signal Support ✅ ADVANCED FEATURE

**Source**: https://mastra.ai/en/docs/tools-mcp/advanced-usage

### How It Works

Mastra automatically forwards abort signals to tools when you call `.generate()` or `.stream()` with an `AbortSignal`.

### Implementation in Chat API

**File**: `app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSmartAgent } from '@/lib/mastra/agents/smart-agent'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, provider, model, threadId } = await req.json()

    // Get abort signal from request (Next.js provides this)
    const abortSignal = req.signal

    const selectedAgent = await createSmartAgent(provider, model)

    // Mastra automatically forwards abort signal to tools
    const result = await selectedAgent.generate({
      messages: [{ role: 'user', content: message }],
      threadId: threadId || 'default',
      abortSignal  // Pass abort signal here
    })

    return NextResponse.json({
      success: true,
      response: result.text
    })
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Request aborted by user'
      }, { status: 499 })
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

**Key Points**:
- ✅ Next.js provides `req.signal` (AbortSignal)
- ✅ Pass to agent's `.generate()` method
- ✅ Mastra forwards to all tool executions
- ✅ Tools can check `abortSignal?.aborted` and throw errors

---

## Static Tools vs Toolsets

### Use `.getTools()` - Static (Single-User)

**When**: Single-tenant application, same credentials for all users

```typescript
const tools = await omniApiMcpClient.getTools()
// All users share same omni-api-mcp credentials
```

### Use `.getToolsets()` - Dynamic (Multi-Tenant)

**When**: Multi-tenant application, per-user credentials

```typescript
const toolsets = await omniApiMcpClient.getToolsets()
// Each user can have their own DataDog API key, GitHub token, etc.
```

**For omni-ai**: Use `.getTools()` (single-user desktop/web app)

---

## Remote MCP Servers (Future Enhancement)

### Local Server (Current):
```typescript
export const omniApiMcpClient = new MCPClient({
  name: 'omni-api',
  command: 'node',
  args: ['../omni-api-mcp/dist/index.js']
})
```

### Remote Server (Future):
```typescript
export const omniApiMcpClient = new MCPClient({
  name: 'omni-api',
  url: new URL('https://api.example.com/mcp')
})
```

**When to Use Remote**:
- Deployed omni-api-mcp as a service
- Multiple users sharing same MCP server
- Need centralized API rate limiting

---

## Multiple MCP Servers Example

**File**: `src/mastra/index.ts`

```typescript
import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import { omniApiMcpClient } from './mcp/omni-api-client'
import { shadcnMcpClient } from './mcp/shadcn-client'
import { githubMcpClient } from './mcp/github-client'

export const mastra = new Mastra({
  storage: new LibSQLStore({ url: ':memory:' }),
  mcpServers: [
    omniApiMcpClient,   // 30+ API integrations
    shadcnMcpClient,    // shadcn component installation
    githubMcpClient     // GitHub API (official Anthropic MCP)
  ]
})
```

**Benefits**:
- ✅ Single Mastra instance manages all MCP servers
- ✅ Agents can use tools from any server
- ✅ Centralized error handling and logging

---

## Error Handling Best Practices

### MCP Connection Errors

```typescript
export async function getOmniApiTools() {
  try {
    return await omniApiMcpClient.getTools()
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'omni-api-mcp not found. Ensure OMNI_API_MCP_PATH is correct and server is built.'
      )
    }
    throw error
  }
}
```

### Tool Execution Errors

Mastra automatically catches tool errors and returns them to the agent. The agent can:
1. Retry with different parameters
2. Ask user for clarification
3. Fall back to alternative approach

---

## Security Best Practices

### 1. Treat MCP URLs as Secrets

```typescript
// ❌ WRONG: Hardcoded URL
url: new URL('https://mcp.run/abc123')

// ✅ CORRECT: Environment variable
url: new URL(process.env.MCP_SERVER_URL!)
```

### 2. Validate Environment Variables

```typescript
if (!process.env.OMNI_API_MCP_PATH) {
  throw new Error('OMNI_API_MCP_PATH environment variable is required')
}
```

### 3. Use .env.local (Never Commit)

```env
# .env.local (in .gitignore)
OMNI_API_MCP_PATH=../omni-api-mcp/dist/index.js
```

---

## Testing MCP Integration

### Unit Test Example

**File**: `tests/mastra/mcp/omni-api-client.test.ts`

```typescript
import { getOmniApiTools } from '@/src/mastra/mcp/omni-api-client'

describe('omni-api MCP Client', () => {
  it('should fetch tools from omni-api-mcp', async () => {
    const tools = await getOmniApiTools()

    expect(tools.length).toBeGreaterThan(0)
    expect(tools.find(t => t.name === 'discover_datasets')).toBeDefined()
    expect(tools.find(t => t.name === 'build_query')).toBeDefined()
    expect(tools.find(t => t.name === 'call_rest_api')).toBeDefined()
  })
})
```

### Integration Test Example

**File**: `tests/integration/agent-mcp.test.ts`

```typescript
import { createSmartAgent } from '@/src/mastra/agents/smart-agent'

describe('Agent MCP Integration', () => {
  it('should use MCP tools in agent execution', async () => {
    const agent = await createSmartAgent('anthropic', 'claude-3-5-sonnet-20241022')

    const result = await agent.generate({
      messages: [{
        role: 'user',
        content: 'Use discover_datasets to list monitoring services'
      }]
    })

    expect(result.text).toContain('monitoring')
  })
})
```

---

## Common Issues & Solutions

### Issue 1: "MCPClient is not a constructor"

**Cause**: Incorrect import

**Solution**:
```typescript
// ❌ WRONG
import MCPClient from '@mastra/mcp'

// ✅ CORRECT
import { MCPClient } from '@mastra/mcp'
```

### Issue 2: "Cannot find module '@mastra/mcp'"

**Cause**: Package not installed

**Solution**:
```bash
npm install @mastra/mcp
```

### Issue 3: Tools not showing up in agent

**Cause**: Forgot to await `getOmniApiTools()`

**Solution**:
```typescript
// ❌ WRONG
const tools = getOmniApiTools()  // Returns Promise

// ✅ CORRECT
const tools = await getOmniApiTools()  // Returns tools array
```

---

## Checkpoint Updates Needed

### WS3 Checkpoint Changes

**File**: `.claude-code/checkpoints/checkpoint-ws3-mcp-integration.md`

**Changes**:
1. Update folder structure: `lib/mcp/` → `lib/mastra/mcp/`
2. Simplify MCP client: Use `MCPClient` directly (no custom wrapper)
3. Register in Mastra instance: Add `mcpServers` to main Mastra config
4. Update tool usage: `await getOmniApiTools()` in agent files
5. Add abort signal support to Chat API route

**Task 2 Updated**:
```typescript
// lib/mastra/mcp/omni-api-client.ts
export const omniApiMcpClient = new MCPClient({
  name: 'omni-api',
  command: 'node',
  args: [process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js']
})

export async function getOmniApiTools() {
  return await omniApiMcpClient.getTools()
}
```

**Task 3 REMOVED** (no need for manual tool wrappers - Mastra handles it)

---

## Summary

### ✅ Use This Pattern:

1. **Folder**: `src/mastra/mcp/omni-api-client.ts` (Official Mastra structure)
2. **Client**: `new MCPClient({ name, command, args })`
3. **Register**: `mcpServers: [omniApiMcpClient]` in `src/mastra/index.ts`
4. **Usage**: `const tools = await getOmniApiTools()`
5. **Abort**: Pass `abortSignal` to agent's `.generate()`

### ❌ Don't Do This:

1. ❌ Custom wrapper classes around MCPClient
2. ❌ Folder structure: `lib/mcp/` or `lib/mastra/mcp/` (should be `src/mastra/mcp/`)
3. ❌ Manual tool definitions (Mastra auto-fetches from MCP server)
4. ❌ Hardcoded URLs/paths (use environment variables)
5. ❌ File named `instance.ts` (should be `index.ts`)

---

**Last Updated**: 2025-10-30
**Status**: Ready for WS3 implementation
**Reference**: https://mastra.ai/en/docs/tools-mcp/mcp-overview
