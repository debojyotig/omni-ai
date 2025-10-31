# Mastra → Claude Agent SDK: Migration Guide

**Purpose**: Step-by-step guide for migrating omni-ai from Mastra to Claude Agent SDK
**Target Audience**: Developers implementing WS8-WS13
**Date**: 2025-10-31

---

## Overview

This guide provides practical, hands-on instructions for migrating from Mastra to Claude Agent SDK. Follow these steps sequentially to ensure a smooth transition.

**Prerequisites**:
- WS1-WS7 complete (Mastra-based foundation)
- Node.js 18+, TypeScript 5+
- Understanding of async generators and SSE
- Familiarity with LibSQL and Zustand

**Timeline**: 5-7 weeks total (25-36 days)

---

## Phase 1: Foundation (WS8) - 3-4 Days

### Step 1.1: Install Claude Agent SDK

```bash
# Install SDK
npm install @anthropic-ai/claude-agent-sdk

# Verify installation
npx tsx -e "import { query } from '@anthropic-ai/claude-agent-sdk'; console.log('SDK installed!');"
```

**Troubleshooting**:
- If import fails: Check TypeScript version (must be 5+)
- If types missing: Run `npm install --save-dev @types/node`

---

### Step 1.2: Configure MCP Server

**Create MCP config file**:
```typescript
// lib/mcp/claude-sdk-mcp-config.ts
import type { MCPServerConfig } from '@anthropic-ai/claude-agent-sdk';

export const omniApiMcpConfig: MCPServerConfig = {
  type: 'stdio',
  command: 'node',
  args: [process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js'],
  env: {
    ...process.env, // Critical: Pass all environment variables
  },
};
```

**Test MCP connection**:
```typescript
// temp-test-mcp-connection.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { omniApiMcpConfig } from './lib/mcp/claude-sdk-mcp-config';

async function testMCP() {
  const result = query({
    prompt: 'List the available tools',
    options: {
      systemPrompt: 'You are a helpful assistant.',
      mcpServers: {
        'omni-api': omniApiMcpConfig,
      },
    },
  });

  for await (const chunk of result) {
    console.log('Chunk type:', chunk.type);
    if (chunk.type === 'tool_use') {
      console.log('Tool used:', chunk.name);
    }
  }
}

testMCP().catch(console.error);
```

**Run test**:
```bash
# Ensure omni-api-mcp is built
cd ../omni-api-mcp && npm run build && cd ../omni-ai

# Run test
npx tsx temp-test-mcp-connection.ts

# Expected output: Should list available tools
# Clean up
rm temp-test-mcp-connection.ts
```

---

### Step 1.3: Create Query Wrapper

**Build helper wrapper**:
```typescript
// lib/claude-sdk/query-wrapper.ts
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { omniApiMcpConfig } from '../mcp/claude-sdk-mcp-config';

export interface QueryResult {
  chunks: SDKMessage[];
  finalMessage: SDKMessage;
  text?: string;
  toolCalls?: any[];
}

export async function queryAgent(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTurns?: number;
    allowedTools?: string[];
  }
): Promise<QueryResult> {
  const result = query({
    prompt,
    options: {
      systemPrompt: options?.systemPrompt || {
        type: 'preset',
        preset: 'claude_code',
      },
      maxTurns: options?.maxTurns || 10,
      allowedTools: options?.allowedTools,
      mcpServers: {
        'omni-api': omniApiMcpConfig,
      },
    },
  });

  const chunks: SDKMessage[] = [];

  for await (const chunk of result) {
    chunks.push(chunk);
  }

  const finalMessage = chunks[chunks.length - 1];

  // Extract text and tool calls from chunks
  const textChunks = chunks.filter((c) => c.type === 'text');
  const toolCalls = chunks.filter((c) => c.type === 'tool_use');

  return {
    chunks,
    finalMessage,
    text: textChunks.map((c: any) => c.content).join(''),
    toolCalls: toolCalls.map((c: any) => ({
      name: c.name,
      input: c.input,
      result: c.result,
    })),
  };
}
```

**Test wrapper**:
```typescript
// temp-test-wrapper.ts
import { queryAgent } from './lib/claude-sdk/query-wrapper';

async function test() {
  const result = await queryAgent('What is 2+2?', { maxTurns: 1 });
  console.log('Result:', result.text);
}

test().catch(console.error);
```

---

## Phase 2: Agent Migration (WS9) - 5-7 Days

### Step 2.1: Create Agent Wrapper Class

**Design pattern**: Wrap Claude SDK to match Mastra API

```typescript
// lib/claude-sdk/agent.ts
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { omniApiMcpConfig } from '../mcp/claude-sdk-mcp-config';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  maxTurns?: number;
  memory?: {
    thread: string;
    resource: string;
  };
  temperature?: number;
}

export interface GenerateResult {
  text?: string;
  toolCalls?: any[];
  sessionId?: string;
}

export class ClaudeAgent {
  constructor(
    private name: string,
    private instructions: string,
    private allowedTools?: string[]
  ) {}

  async generate(
    messages: string | Message[],
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    // Convert messages to prompt
    const prompt = Array.isArray(messages)
      ? messages.map((m) => `${m.role}: ${m.content}`).join('\n')
      : messages;

    // TODO: Handle memory/session (WS11)
    // For now, execute without session

    const result = query({
      prompt,
      options: {
        systemPrompt: this.instructions,
        maxTurns: options?.maxTurns || 10,
        allowedTools: this.allowedTools,
        mcpServers: {
          'omni-api': omniApiMcpConfig,
        },
      },
    });

    const chunks: SDKMessage[] = [];

    for await (const chunk of result) {
      chunks.push(chunk);
    }

    // Extract results
    const textChunks = chunks.filter((c) => c.type === 'text');
    const toolCalls = chunks.filter((c) => c.type === 'tool_use');

    return {
      text: textChunks.map((c: any) => c.content).join(''),
      toolCalls: toolCalls.map((c: any) => ({
        name: c.name,
        input: c.input,
      })),
    };
  }

  async *stream(
    messages: string | Message[],
    options?: GenerateOptions
  ): AsyncGenerator<SDKMessage> {
    const prompt = Array.isArray(messages)
      ? messages.map((m) => `${m.role}: ${m.content}`).join('\n')
      : messages;

    const result = query({
      prompt,
      options: {
        systemPrompt: this.instructions,
        maxTurns: options?.maxTurns || 10,
        allowedTools: this.allowedTools,
        mcpServers: {
          'omni-api': omniApiMcpConfig,
        },
      },
    });

    for await (const chunk of result) {
      yield chunk;
    }
  }
}
```

---

### Step 2.2: Migrate Smart Agent

**Extract existing instructions**:
```bash
# Read current Mastra agent
cat src/mastra/agents/smart-agent.ts | grep -A 100 "instructions"
```

**Create new Claude SDK agent**:
```typescript
// lib/agents/smart-agent.ts
import { ClaudeAgent } from '../claude-sdk/agent';

// Same 1,800 token instructions from Mastra version
const SMART_AGENT_INSTRUCTIONS = `You are an intelligent API investigation agent with comprehensive knowledge of API architectures, data formats, and investigation methodologies...`;

export const smartAgent = new ClaudeAgent(
  'Smart Agent',
  SMART_AGENT_INSTRUCTIONS,
  undefined // All tools allowed
);
```

**Test migration**:
```typescript
// temp-test-smart-agent.ts
import { smartAgent } from './lib/agents/smart-agent';

async function test() {
  const result = await smartAgent.generate('What APIs are available?');
  console.log('Result:', result.text);
  console.log('Tools used:', result.toolCalls?.map((t) => t.name));
}

test().catch(console.error);
```

---

### Step 2.3: Migrate DataDog Champion & API Correlator

**Repeat pattern for other agents**:
```typescript
// lib/agents/datadog-champion.ts
export const datadogChampion = new ClaudeAgent(
  'DataDog Champion',
  DATADOG_CHAMPION_INSTRUCTIONS,
  ['discover_datasets', 'build_query', 'call_rest_api', 'summarize_multi_api_results']
);

// lib/agents/api-correlator.ts
export const apiCorrelator = new ClaudeAgent(
  'API Correlator',
  API_CORRELATOR_INSTRUCTIONS,
  ['call_rest_api', 'call_graphql', 'summarize_multi_api_results']
);
```

---

### Step 2.4: Update Chat API Route

**Before (Mastra)**:
```typescript
// app/api/chat/route.ts (old)
import { mastra } from '@/src/mastra';

export async function POST(req: Request) {
  const { message, agentId } = await req.json();

  const agent = mastra.getAgent(agentId);

  const result = await agent.generate(message, {
    memory: { thread, resource },
  });

  return Response.json(result);
}
```

**After (Claude SDK)**:
```typescript
// app/api/chat/route.ts (new)
import { smartAgent, datadogChampion, apiCorrelator } from '@/lib/agents';

const agents = {
  'smart-agent': smartAgent,
  'datadog-champion': datadogChampion,
  'api-correlator': apiCorrelator,
};

export async function POST(req: Request) {
  const { message, agentId, threadId, resourceId } = await req.json();

  const agent = agents[agentId];

  if (!agent) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  const result = await agent.generate(message, {
    memory: { thread: threadId, resource: resourceId }, // TODO: Implement in WS11
  });

  return Response.json(result);
}
```

---

## Phase 3: Enterprise Gateway (WS10) - 2-3 Days

### Step 3.1: Configure ANTHROPIC_BASE_URL

**Update .env.local**:
```bash
# Standard Anthropic (default)
ANTHROPIC_API_KEY=sk-ant-...

# For enterprise gateway
SELECTED_PROVIDER=azure
AZURE_GATEWAY_URL=https://enterprise-gateway.company.com/azure
AZURE_CLIENT_SECRET=...
```

**Create provider config**:
```typescript
// lib/config/provider-config.ts
export function getProviderConfig() {
  const provider = process.env.SELECTED_PROVIDER || 'anthropic';

  switch (provider) {
    case 'azure':
      process.env.ANTHROPIC_BASE_URL = process.env.AZURE_GATEWAY_URL;
      process.env.ANTHROPIC_API_KEY = process.env.AZURE_CLIENT_SECRET;
      break;
    case 'aws':
      process.env.ANTHROPIC_BASE_URL = process.env.AWS_GATEWAY_URL;
      process.env.ANTHROPIC_API_KEY = process.env.AWS_SECRET_ACCESS_KEY;
      break;
    // ... etc
  }
}

// Call at app startup
getProviderConfig();
```

---

## Key Differences: Mastra vs Claude SDK

| Feature | Mastra | Claude SDK | Migration Notes |
|---------|--------|------------|----------------|
| **Installation** | `@mastra/core` | `@anthropic-ai/claude-agent-sdk` | Simple package swap |
| **Agent Creation** | `new Agent({ ... })` | Custom wrapper class | Build ClaudeAgent wrapper |
| **Execution** | `agent.generate()` | `query()` + collect chunks | Wrap in generate() method |
| **Streaming** | `agent.stream()` | `query()` (async generator) | Already async generator |
| **MCP Integration** | `@mastra/mcp` | Built-in `mcpServers` option | Same protocol, different config |
| **Prompt Caching** | Broken (bug) | Works natively | **Major improvement** |
| **Provider Switching** | Runtime | Requires restart | Set env var + restart |
| **Session Management** | LibSQLStore automatic | Manual via continue/resume | Build SessionManager (WS11) |

---

## Common Pitfalls

### Pitfall 1: Forgetting to Pass Environment Variables

**Problem**: MCP subprocess can't access API keys

```typescript
// ❌ Wrong
const mcpConfig = {
  type: 'stdio',
  command: 'node',
  args: ['../omni-api-mcp/dist/index.js'],
  // Missing env!
};

// ✅ Correct
const mcpConfig = {
  type: 'stdio',
  command: 'node',
  args: ['../omni-api-mcp/dist/index.js'],
  env: process.env, // Critical!
};
```

---

### Pitfall 2: Not Collecting All Chunks

**Problem**: Only getting partial responses

```typescript
// ❌ Wrong
const result = query({ ... });
const firstChunk = await result.next();
// Missing rest of chunks!

// ✅ Correct
const chunks = [];
for await (const chunk of result) {
  chunks.push(chunk);
}
const finalMessage = chunks[chunks.length - 1];
```

---

### Pitfall 3: Expecting Runtime Provider Switching

**Problem**: Trying to change provider without restart

```typescript
// ❌ Won't work
function switchProvider(newProvider) {
  process.env.ANTHROPIC_BASE_URL = getURL(newProvider);
  // Restart required!
}

// ✅ Correct approach
// 1. User changes SELECTED_PROVIDER in .env.local
// 2. Application restarts
// 3. Provider loaded at startup
```

---

## Testing Checklist

After each phase, verify:

**WS8 (Foundation)**:
- [ ] Claude SDK installed
- [ ] MCP server connects
- [ ] Tools callable
- [ ] No rate limit errors

**WS9 (Agents)**:
- [ ] All 3 agents migrated
- [ ] Chat interface works
- [ ] Tool calls execute
- [ ] Multi-step investigations complete

**WS10 (Gateway)**:
- [ ] ANTHROPIC_BASE_URL configured
- [ ] Can use Azure/AWS/GCP
- [ ] Responses correct format

**WS11 (Sessions)**:
- [ ] Conversations persist
- [ ] Context preserved
- [ ] LibSQL integration works

**WS12 (UI)**:
- [ ] Markdown renders
- [ ] Code highlighting works
- [ ] Streaming smooth

**WS13 (Distribution)**:
- [ ] Electron app builds
- [ ] omni-api-mcp bundled
- [ ] Installers work

---

## Rollback Plan

If migration fails, rollback steps:

1. **Git**: `git checkout <last-working-commit>`
2. **Dependencies**: `npm install` (restores Mastra packages)
3. **Database**: LibSQL data persists (no migration needed)
4. **Config**: Restore .env.local from backup

**Recommended**: Complete each WS fully before moving to next. Don't mix Mastra + Claude SDK in same branch.

---

## Support Resources

**Documentation**:
- Parity Analysis: [docs/MASTRA_PARITY_ANALYSIS.md](./MASTRA_PARITY_ANALYSIS.md)
- Workstream Checkpoints: `.claude-code/checkpoints/checkpoint-ws8-*.md` through `ws13`

**Claude SDK Docs**:
- Overview: https://docs.claude.com/en/api/agent-sdk/overview
- TypeScript API: https://docs.claude.com/en/api/agent-sdk/typescript
- Hooks: https://docs.claude.com/en/docs/claude-code/hooks

**Debugging**:
- Enable verbose logging: `DEBUG=claude-sdk:* npm run dev`
- Check MCP logs: Console output from subprocess
- Monitor cache headers: Look for `cache_creation_input_tokens` in API responses

---

**Last Updated**: 2025-10-31
**Status**: Ready for Implementation
**Next Action**: Begin WS8 (Foundation & MCP Integration)
