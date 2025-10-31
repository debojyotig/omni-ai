# Gap Analysis: omni-ai vs omni-agent

**Date**: 2025-10-31
**Status**: Critical gaps identified after WS1-WS5 completion
**Purpose**: Identify missing features and create remediation workstreams

---

## Executive Summary

While WS1-WS5 established the foundation (Mastra integration, UI structure, agents), **omni-ai lacks critical production features from omni-agent**:

1. **Environment Variables**: omni-api-mcp subprocess can't access .env values (API keys, endpoints)
2. **Token Optimization**: No token management → rate limits after 2-3 iterations (40K tokens/min exceeded)
3. **UI Features**: Missing investigation panel, streaming UX, memory management UI

**Impact**: omni-ai is not production-ready. Basic chat works, but fails on complex multi-step investigations.

---

## Issue 1: Environment Variable Loading for omni-api-mcp ❌

### Problem

When omni-ai starts omni-api-mcp via MCPClient, the subprocess **cannot access environment variables** from `.env` or `.env.local`:

```typescript
// lib/mcp/mcp-client.ts
new MCPClient({
  id: 'omni-api-mcp',
  servers: {
    'omni-api-mcp': {
      command: 'node',
      args: [mcpPath],
      // ❌ No env passed - subprocess doesn't inherit .env.local
    },
  },
});
```

**Consequence**:
- omni-api-mcp can't authenticate to external APIs (DataDog, GitHub, Stripe, etc.)
- All `call_rest_api` and `call_graphql` tools fail with auth errors
- Agents can't perform actual investigations

### How omni-agent Solved This

**omni-agent approach** (Electron):
```typescript
// src/lib/mcp/orchestrator.ts
const child = spawn('node', [mcpPath], {
  env: {
    ...process.env,                    // ✅ Inherit all env vars
    DATADOG_API_KEY: credentials.datadog,
    GITHUB_TOKEN: credentials.github,
    // ...all API keys from settings
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});
```

**Why it worked**:
1. Explicitly passes all environment variables to subprocess
2. Credentials from settings UI merged into env
3. omni-api-mcp subprocess has full access to API keys

### Gap in omni-ai

**Missing**: @mastra/mcp's MCPClient doesn't provide `env` option in server config.

**Required Fix**:
1. Check if @mastra/mcp supports `env` in server config (check Mastra docs)
2. If not, fork MCPClient or use Node's `spawn()` directly
3. Pass environment variables from `.env.local` to omni-api-mcp subprocess

### Success Criteria

- [ ] omni-api-mcp subprocess receives all .env variables
- [ ] `discover_datasets` returns services with auth status
- [ ] `call_rest_api` to DataDog succeeds with API key

---

## Issue 2: Token Optimization Missing ❌

### Problem

After 2-3 agent iterations, rate limit error:
```
rate_limit_error: This request would exceed 40,000 input tokens per minute
```

**Root Causes**:
1. **No conversation truncation** - Full chat history sent every time
2. **No tool result summarization** - Large API responses included verbatim
3. **No memory compression** - Mastra Memory stores everything, no pruning
4. **No context window management** - No tracking of tokens used

### How omni-agent Solved This

**omni-agent token optimization** (`src/lib/agents/token-optimizer.ts`):

1. **Conversation Windowing** (sliding window):
```typescript
function truncateHistory(messages: Message[], maxTokens: number = 8000) {
  // Keep system prompt + last N messages that fit in budget
  const systemMsg = messages[0];
  const recentMsgs = messages.slice(-10); // Last 10 messages

  let tokenCount = estimateTokens(systemMsg);
  const result = [systemMsg];

  for (const msg of recentMsgs.reverse()) {
    const msgTokens = estimateTokens(msg);
    if (tokenCount + msgTokens <= maxTokens) {
      result.unshift(msg);
      tokenCount += msgTokens;
    }
  }

  return result;
}
```

2. **Tool Result Compression**:
```typescript
function compressToolResult(result: any): any {
  if (Array.isArray(result)) {
    return {
      type: 'array',
      length: result.length,
      sample: result.slice(0, 5),  // Only first 5 items
      truncated: result.length > 5,
    };
  }

  if (typeof result === 'object') {
    return {
      type: 'object',
      keys: Object.keys(result),
      sampleFields: Object.fromEntries(
        Object.entries(result).slice(0, 10)  // Only first 10 fields
      ),
    };
  }

  return result;
}
```

3. **Token Budget Allocation**:
```typescript
const TOKEN_BUDGET = {
  systemPrompt: 2000,      // Agent instructions
  conversationHistory: 8000, // Sliding window
  toolResults: 4000,       // Compressed results
  response: 4000,          // Model response
  buffer: 2000,            // Safety margin
  // Total: 20,000 tokens (well under 40K limit)
};
```

4. **Memory Cleanup**:
```typescript
async function pruneMemory(threadId: string) {
  // Remove old messages beyond retention window
  const cutoffDate = Date.now() - 30 * 60 * 1000; // 30 minutes
  await db.execute(
    'DELETE FROM messages WHERE threadId = ? AND timestamp < ?',
    [threadId, cutoffDate]
  );
}
```

### Gap in omni-ai

**Missing**:
- No token counting/estimation
- No conversation truncation
- No tool result compression
- No memory pruning strategy

**Current Behavior** (app/api/chat/route.ts):
```typescript
// ❌ Sends ALL messages every time
const result = await selectedAgent.generate(
  [{ role: 'user', content: message }],  // Only new message, but Mastra Memory loads ALL history
  {
    threadId: threadId || 'default',
    resourceId: 'default-user',
  }
);
```

Mastra Memory automatically loads **entire conversation history** from LibSQL, no truncation.

### Success Criteria

- [ ] Token estimation function implemented
- [ ] Conversation history truncated to last 10 messages or 8K tokens
- [ ] Tool results compressed (arrays/objects summarized)
- [ ] No rate limit errors for 20+ iteration conversations
- [ ] Memory pruning after 30 minutes or 50 messages

---

## Issue 3: Missing UI Features ❌

### Problem

omni-ai has **basic chat interface** but lacks omni-agent's **investigation-focused UX**:

| Feature | omni-agent | omni-ai | Status |
|---------|-----------|---------|--------|
| **Investigation Panel** | ✅ Dedicated panel showing step-by-step progress | ❌ Just messages | Missing |
| **Streaming UX** | ✅ Real-time tool calls, status updates | ❌ Simulated hints | Missing |
| **Tool Call Visualization** | ✅ Collapsible cards with duration, args, results | ✅ Basic card | Partial |
| **Memory Management UI** | ✅ View/clear threads, export history | ❌ No UI | Missing |
| **Error Recovery** | ✅ Retry button, error details | ❌ Just shows error | Missing |
| **Investigation Logs** | ✅ Export investigation to JSON/MD | ❌ None | Missing |
| **Token Usage Display** | ✅ Shows tokens used/remaining | ❌ None | Missing |
| **Stop Button** | ✅ Works | ✅ Works | Complete |
| **Progress Bar** | ✅ Real-time | ✅ Simulated | Partial |

### How omni-agent Solved This

**Investigation Panel** (`src/renderer/src/components/investigation-panel.tsx`):
```tsx
<div className="investigation-panel">
  <InvestigationHeader investigation={current} />

  {/* Step-by-step progress */}
  <div className="steps">
    {investigation.steps.map(step => (
      <StepCard
        key={step.id}
        step={step}
        status={step.status}  // pending | running | success | error
        duration={step.duration}
        toolCalls={step.toolCalls}
      />
    ))}
  </div>

  {/* Actions */}
  <div className="actions">
    <Button onClick={exportToJSON}>Export JSON</Button>
    <Button onClick={exportToMarkdown}>Export MD</Button>
    <Button onClick={retryFailed}>Retry Failed Steps</Button>
  </div>
</div>
```

**Streaming Integration** (`src/lib/agents/stream-handler.ts`):
```typescript
agent.on('step-start', (step) => {
  updateProgress({ currentStep: step.id, status: 'running' });
});

agent.on('tool-call-start', (tool) => {
  addToolCall({ id: tool.id, name: tool.name, status: 'running' });
});

agent.on('tool-call-end', (tool, result) => {
  updateToolCall(tool.id, { status: 'success', result, duration });
});

agent.on('error', (error) => {
  updateProgress({ status: 'error', error });
});
```

**Memory Management UI** (`src/renderer/src/components/memory-panel.tsx`):
```tsx
<div className="memory-panel">
  <h3>Conversation Threads</h3>

  <div className="threads">
    {threads.map(thread => (
      <ThreadCard
        key={thread.id}
        thread={thread}
        messageCount={thread.messageCount}
        lastActivity={thread.updatedAt}
        onView={() => switchThread(thread.id)}
        onClear={() => clearThread(thread.id)}
        onExport={() => exportThread(thread.id)}
      />
    ))}
  </div>

  <Button onClick={clearAllThreads}>Clear All</Button>
</div>
```

### Gap in omni-ai

**Missing**:
1. Investigation Panel - no step-by-step visualization
2. Real streaming - TransparencyHint is simulated, not connected to Mastra events
3. Memory UI - no way to view/manage threads
4. Export functionality - can't save investigation results
5. Token usage display - no visibility into token consumption

**Current State**:
- Only basic chat messages
- No investigation workflow visualization
- No thread management UI

### Success Criteria

- [ ] Investigation Panel shows step-by-step progress
- [ ] Real-time streaming connected to Mastra agent events
- [ ] Memory Management UI (view threads, clear, export)
- [ ] Export investigation to JSON/Markdown
- [ ] Token usage display in chat header
- [ ] Retry button for failed steps

---

## Additional Gaps Identified

### 4. Error Handling & Resilience

**omni-agent**:
- Auto-retry with exponential backoff for API failures
- Fallback to alternative tools if primary fails
- Error categorization (retryable vs permanent)
- User-friendly error messages

**omni-ai**:
- ❌ No retry logic
- ❌ No fallback strategies
- ❌ Raw error messages exposed

### 5. Configuration Management

**omni-agent**:
- Settings UI for API keys (encrypted storage)
- Service enable/disable toggles
- Custom endpoint configuration
- Import/export settings

**omni-ai**:
- ❌ Only .env.local (no UI)
- ❌ No service management
- ❌ No settings import/export

### 6. Performance Monitoring

**omni-agent**:
- Tool call latency tracking
- Investigation duration metrics
- Success rate analytics
- Performance dashboard

**omni-ai**:
- ❌ No metrics
- ❌ No performance tracking
- ❌ No analytics

---

## Recommended New Workstreams (Mastra-First Approach)

**Philosophy**: Use Mastra's built-in capabilities instead of custom implementations.

### WS6: Environment Variable & MCP Configuration (CRITICAL) 🚀
**Priority**: P0 (Blocker)
**Duration**: 1-2 days
**Goal**: Fix omni-api-mcp environment variable loading

**Mastra-First Approach**:
- [ ] Query Mastra docs MCP server for env patterns
- [ ] Use Mastra's server config with `env` option (if available)
- [ ] Test with DataDog authenticated API calls

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws6-env-mcp-config.md`

---

### WS7: Token Optimization (CRITICAL) 🚀
**Priority**: P0 (Blocker)
**Duration**: 2-3 days
**Goal**: Prevent rate limit errors using Mastra Memory features

**Mastra-First Approach**:
- [ ] Query Mastra docs for Memory retention policies
- [ ] Use Mastra's `maxMessages`, `maxAge` configuration (if available)
- [ ] Configure agent token limits via Mastra Agent API
- [ ] Fallback: Simple message windowing (only if Mastra doesn't provide)

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws7-token-optimization.md`

---

### WS8: Real Streaming & Investigation UI (HIGH) 🚀
**Priority**: P1
**Duration**: 3-4 days
**Goal**: Connect UI to Mastra's agent streaming events

**Mastra-First Approach**:
- [ ] Query Mastra docs for agent streaming API
- [ ] Switch from `agent.generate()` to `agent.stream()`
- [ ] Return Server-Sent Events (SSE) to client
- [ ] Connect TransparencyHint/IterationProgress to real events
- [ ] Optional: Add InvestigationPanel component

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws8-streaming-ui.md`

---

### WS9-WS11: Future Enhancements (DEFERRED)
**Priority**: P2-P3 (Nice to have, not blockers)
**Status**: Deferred until WS6-WS8 complete

These will be revisited after core functionality is working:
- Memory Management UI (thread list, export)
- Error Handling & Resilience (retry, fallbacks)
- Configuration Management (Settings UI v2)

---

## Success Criteria (Post WS6-WS8)

**Must Have (P0-P1)**:
- [ ] omni-api-mcp receives environment variables (WS6)
- [ ] No rate limit errors for 50+ message investigations (WS7)
- [ ] Real-time streaming UI connected to Mastra events (WS8)
- [ ] Agents can perform authenticated API calls (WS6 + WS7)

**Nice to Have (Deferred)**:
- [ ] Investigation export to JSON/MD
- [ ] Memory management UI
- [ ] Auto-retry on failures

---

## Timeline (Mastra-First)

**WS6 (Env Config)**: 1-2 days
**WS7 (Token Optimization)**: 2-3 days
**WS8 (Streaming UI)**: 3-4 days

**Total**: ~2 weeks to production readiness

**Key Advantage**: By using Mastra's features, we avoid building custom token counting, memory pruning, and streaming infrastructure.

---

**Created**: 2025-10-31
**Status**: Awaiting approval to proceed with WS6-WS11
