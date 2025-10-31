# Mastra → Claude Agent SDK: Parity Analysis

**Purpose**: Comprehensive feature mapping and migration strategy for transitioning omni-ai from Mastra to Claude Agent SDK.

**Date**: 2025-10-31
**Status**: Research Complete → Implementation Planning

---

## Executive Summary

**Migration Viability**: ✅ **HIGHLY VIABLE** for bundled local application use case

**Key Trade-offs**:
- ✅ **Gain**: Native prompt caching, production stability, built-in tools
- ✅ **Gain**: No Mastra bugs (providerOptions issue resolved)
- ❌ **Lose**: Runtime provider switching (acceptable for local app)
- ✅ **Neutral**: Different but equivalent session management

**Overall Assessment**: Claude Agent SDK is superior for omni-ai's use case as a bundled local developer tool.

---

## Feature Parity Matrix

### 1. Agent System

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Agent Definition** | `new Agent({ name, instructions, model, tools })` | `query({ prompt, options: { systemPrompt, allowedTools } })` | Replace Agent class with query() wrapper |
| **System Instructions** | `instructions` field (string/array/CoreSystemMessage) | `systemPrompt` option (string or preset) | Map instructions to systemPrompt |
| **Model Selection** | `model` field (AI SDK providers) | Implicit (uses Anthropic) | Use ANTHROPIC_BASE_URL for custom |
| **Tool Definition** | `tools` object (Mastra tools) | Built-in + MCP tools | Use MCP for omni-api-mcp tools |
| **Agent Nesting** | `agents` field (sub-agents) | `agents` option (programmatically defined) | Equivalent - direct mapping |

**Recommendation**: Create a thin wrapper around `query()` that mimics Mastra's Agent API for minimal code changes.

---

### 2. Execution Methods

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Non-streaming** | `agent.generate(messages, options)` | `await query({ prompt })` then iterate | Collect all chunks into final result |
| **Streaming** | `agent.stream(messages, options)` | `query({ prompt })` returns async generator | Direct mapping - already async generator |
| **Multi-step** | `maxSteps` option | `maxTurns` option | Rename parameter |
| **Tool Control** | `toolChoice`, `activeTools` | `allowedTools`, `canUseTool` | Map to allowedTools/disallowedTools |
| **Abort** | `abortSignal` | Built-in `interrupt()` on query | Use query.interrupt() method |

**Recommendation**: Streaming is native in Claude SDK - easier than Mastra. Non-streaming requires collecting chunks.

---

### 3. Memory & Session Management

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Storage** | LibSQLStore (.mastra/data.db) | Session-based (can use custom storage) | Keep LibSQLStore, sync with sessions |
| **Thread Management** | `memory: { thread, resource }` | `continue` or `resume` with session ID | Map thread ID to session ID |
| **Message History** | Automatic via LibSQLStore | `continue` includes history | Fetch from LibSQL, pass to query |
| **Context Persistence** | Automatic via storage | Manual session resume | Build session manager layer |
| **Working Memory** | Per-resource working memory | Not built-in | Store separately in LibSQL |

**Recommendation**: Build a `SessionManager` class that bridges LibSQLStore and Claude SDK sessions.

**Implementation**:
```typescript
class SessionManager {
  async createSession(threadId: string, resourceId: string): Promise<string>
  async resumeSession(sessionId: string): Promise<Message[]>
  async saveMessage(sessionId: string, message: Message): Promise<void>
}
```

---

### 4. Tool Integration

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **MCP Protocol** | @mastra/mcp package | Built-in stdio support | Direct migration - same protocol |
| **Tool Definition** | Mastra tool format | MCP tool format | Already MCP - no changes needed |
| **Built-in Tools** | None | Read, Write, Bash, WebSearch, Grep | Use built-in tools as-is |
| **Custom Tools** | createTool() | MCP server | Keep omni-api-mcp as-is |
| **Tool Execution** | Automatic during generate | Automatic during query | Equivalent |

**Recommendation**: omni-api-mcp works out-of-the-box with Claude SDK. No migration needed.

**Example MCP Configuration**:
```typescript
const result = query({
  prompt: "Investigate DataDog errors",
  options: {
    mcpServers: {
      'omni-api': {
        type: 'stdio',
        command: 'node',
        args: ['../omni-api-mcp/dist/index.js'],
        env: process.env // Pass all env vars
      }
    }
  }
});
```

---

### 5. Workflow Orchestration

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Workflow Definition** | `createWorkflow({ steps })` | No built-in workflows | Build workflow layer on top |
| **Step Definition** | `createStep({ id, execute })` | Use hooks (PreToolUse, PostToolUse) | Implement via hooks |
| **Step Control Flow** | `after`, `when` conditions | Manual orchestration | Build orchestrator |
| **Suspend/Resume** | Built-in | Use session resume | Leverage sessions |

**Recommendation**: Build a lightweight `WorkflowOrchestrator` that uses Claude SDK hooks.

**Implementation Pattern**:
```typescript
class WorkflowOrchestrator {
  constructor(private steps: WorkflowStep[]) {}

  async execute(initialPrompt: string) {
    let currentStep = 0;

    while (currentStep < this.steps.length) {
      const step = this.steps[currentStep];

      const result = await query({
        prompt: step.prompt,
        options: {
          hooks: {
            PostToolUse: async (input) => {
              // Decide next step based on tool result
              currentStep = this.determineNextStep(input);
            }
          }
        }
      });

      // Handle step result
    }
  }
}
```

---

### 6. Provider Management

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Standard Providers** | AI SDK providers (OpenAI, Anthropic) | Anthropic only | Use ANTHROPIC_BASE_URL |
| **Custom Providers** | Custom providers via AI SDK | `ANTHROPIC_BASE_URL` env var | Point to enterprise gateway |
| **Runtime Switching** | Yes (RuntimeContext) | No (requires restart) | **Acceptable for local app** |
| **OAuth2 Gateway** | Custom implementation | Set base URL to gateway | Simpler - just env var |
| **Multi-LLM Support** | Via provider switching | Via gateway routing | Gateway handles routing |

**Recommendation**: Use enterprise OAuth2 gateway with `ANTHROPIC_BASE_URL`. Gateway routes to Azure/AWS/GCP based on configuration.

**Environment Configuration**:
```bash
# Standard Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Enterprise Gateway (Azure/AWS/GCP)
ANTHROPIC_BASE_URL=https://enterprise-gateway.company.com/anthropic
ANTHROPIC_API_KEY=gateway-token-123

# Gateway handles routing to actual LLM providers
```

---

### 7. Token Optimization

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Prompt Caching** | ❌ Broken (providerOptions bug) | ✅ Works natively | **Major improvement** |
| **Memory Retention** | Manual via retention policies | Automatic via sessions | Use session continue |
| **Context Compaction** | Not built-in | Automatic compaction | **Major improvement** |
| **Token Limits** | Manual via maxTokens | Automatic management | **Major improvement** |

**Recommendation**: Prompt caching and context management work out-of-the-box in Claude SDK.

---

### 8. Observability & Telemetry

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **AI Tracing** | observability.default.enabled | Not built-in | Use hooks to emit traces |
| **Telemetry** | Built-in telemetry system | Not built-in | Build custom via hooks |
| **Logging** | PinoLogger integration | Not built-in | Keep PinoLogger, wire via hooks |
| **Debugging** | Via logs and traces | Via hooks and transcripts | Build observability layer |

**Recommendation**: Build `ObservabilityLayer` using Claude SDK hooks.

**Implementation**:
```typescript
const logger = new PinoLogger({ name: 'omni-ai' });

const result = query({
  prompt,
  options: {
    hooks: {
      PreToolUse: async (input) => {
        logger.info({ tool: input.toolName, args: input.toolInput }, 'Tool call start');
      },
      PostToolUse: async (input) => {
        logger.info({ tool: input.toolName, result: input.result }, 'Tool call complete');
      }
    }
  }
});
```

---

### 9. UI Integration

| Feature | Mastra | Claude Agent SDK | Migration Strategy |
|---------|--------|------------------|-------------------|
| **Streaming to UI** | SSE via agent.stream() | Async generator chunks | Map chunks to SSE events |
| **Progress Tracking** | Custom via stream chunks | Use chunk types | Parse chunk.type for progress |
| **Tool Call Display** | Custom parsing | Built-in tool call chunks | Use chunk data directly |
| **Error Handling** | Try/catch on stream | Error chunks in stream | Handle error chunk type |

**Recommendation**: Claude SDK streaming is more structured - easier to parse for UI updates.

---

## Migration Complexity Assessment

### Low Complexity (1-2 days)

1. **MCP Integration** - Works out of the box
2. **Basic Query Execution** - Simple wrapper around query()
3. **Tool Calling** - No changes needed
4. **Environment Variables** - Just ANTHROPIC_BASE_URL

### Medium Complexity (3-5 days)

1. **Session Management** - Build SessionManager bridge
2. **Agent Wrapper** - Create Mastra-like API
3. **Streaming to SSE** - Map async generator to SSE
4. **UI Updates** - Parse chunks for progress/tool calls

### High Complexity (1-2 weeks)

1. **Workflow Orchestration** - Build WorkflowOrchestrator
2. **Observability Layer** - Implement tracing via hooks
3. **Multi-Agent Coordination** - Replicate agent.network()
4. **Testing & Validation** - End-to-end testing

---

## Critical Gaps

### Gap 1: No Built-in Workflow System

**Mastra**: `createWorkflow()` with declarative steps
**Claude SDK**: No equivalent

**Solution**: Build `WorkflowOrchestrator` class using hooks
- Use PostToolUse hook to determine next step
- Use sessions to suspend/resume workflows
- Store workflow state in LibSQL

**Effort**: 5-7 days

---

### Gap 2: No Native Multi-Provider Support

**Mastra**: Runtime provider switching
**Claude SDK**: Single provider (Anthropic)

**Solution**: Enterprise OAuth2 gateway
- Gateway accepts Anthropic API format
- Routes to Azure/AWS/GCP based on config
- Single ANTHROPIC_BASE_URL for all providers

**Effort**: Already implemented in WS2 (gateway exists)

---

### Gap 3: No Built-in Telemetry

**Mastra**: observability.default.enabled
**Claude SDK**: No equivalent

**Solution**: Build observability layer via hooks
- PreToolUse: Log tool calls
- PostToolUse: Log results and latency
- SessionStart/SessionEnd: Track sessions
- Export to OTLP (OpenTelemetry)

**Effort**: 3-4 days

---

## Key Advantages of Claude Agent SDK

### 1. Native Prompt Caching ✅

**Current Mastra Issue**: providerOptions not passed to AI SDK
**Claude SDK**: Works natively, no workarounds

**Impact**: 90% token cost reduction, solves rate limit errors

---

### 2. Automatic Context Management ✅

**Current Mastra**: Manual memory retention policies
**Claude SDK**: Automatic compaction

**Impact**: No more manual token tracking

---

### 3. Production Stability ✅

**Current Mastra**: Community project, bugs exist
**Claude SDK**: Built and maintained by Anthropic

**Impact**: Fewer bugs, better support

---

### 4. Rich Built-in Tools ✅

**Current Mastra**: Only custom tools
**Claude SDK**: Read, Write, Bash, WebSearch, Grep, Glob

**Impact**: Can use built-in tools for file ops, web search

---

### 5. Structured Streaming ✅

**Current Mastra**: Custom chunk parsing
**Claude SDK**: Well-defined chunk types

**Impact**: Easier UI integration

---

## Recommended Migration Path

### Phase 1: Foundation (WS8)

**Duration**: 3-4 days
**Goal**: Basic query execution + MCP integration

1. Install @anthropic-ai/claude-agent-sdk
2. Configure MCP server (omni-api-mcp)
3. Create basic agent wrapper
4. Test tool calling end-to-end

**Deliverable**: Can execute queries with omni-api-mcp tools

---

### Phase 2: Agent Layer (WS9)

**Duration**: 5-7 days
**Goal**: Migrate 3 agents to Claude SDK

1. Build Agent wrapper class (Mastra-compatible API)
2. Migrate Smart Agent
3. Migrate DataDog Champion
4. Migrate API Correlator
5. Test all agents

**Deliverable**: 3 agents working with Claude SDK

---

### Phase 3: Provider & Gateway (WS10)

**Duration**: 2-3 days
**Goal**: Multi-LLM support via enterprise gateway

1. Configure ANTHROPIC_BASE_URL
2. Test with Azure/AWS/GCP gateways
3. Update Settings UI (remove runtime switching)
4. Test provider switching (via restart)

**Deliverable**: Can use Azure, AWS, GCP LLMs

---

### Phase 4: Session & Persistence (WS11)

**Duration**: 5-7 days
**Goal**: Session management + LibSQL integration

1. Build SessionManager class
2. Integrate LibSQLStore
3. Implement session resume
4. Test conversation persistence

**Deliverable**: Conversations persist across restarts

---

### Phase 5: UI Polish (WS12)

**Duration**: 5-7 days
**Goal**: Smart message display + streaming UI

1. Parse Claude SDK chunks
2. Update chat message components
3. Add code block rendering
4. Improve tool call visualization
5. Test streaming UI

**Deliverable**: Polished chat interface

---

### Phase 6: Distribution (WS13)

**Duration**: 3-5 days
**Goal**: Bundle omni-ai + omni-api-mcp

1. Package as Electron app
2. Bundle omni-api-mcp
3. Create installer
4. Test end-to-end

**Deliverable**: Installable desktop app

---

## Total Timeline

**Research**: 2-3 days ✅ (Complete)
**WS8**: 3-4 days
**WS9**: 5-7 days
**WS10**: 2-3 days
**WS11**: 5-7 days
**WS12**: 5-7 days
**WS13**: 3-5 days

**Total**: 25-36 days (5-7 weeks)

---

## References

**Claude Agent SDK**:
- Overview: https://docs.claude.com/en/api/agent-sdk/overview
- TypeScript API: https://docs.claude.com/en/api/agent-sdk/typescript
- Hooks: https://docs.claude.com/en/docs/claude-code/hooks
- Migration Guide: https://docs.claude.com/en/docs/claude-code/sdk/migration-guide

**Mastra Documentation**:
- Agent API: See `reference/agents/` folder
- Workflows: See `reference/workflows/` folder
- Memory: See `memory/` folder

**omni-ai Context**:
- CLAUDE.md: Project overview and architecture
- CHECKPOINT.md: Current status (WS7 complete)
- WS1-WS7 checkpoints: Foundation work complete

---

**Last Updated**: 2025-10-31
**Status**: Analysis Complete → Ready for WS8-WS13 Planning
