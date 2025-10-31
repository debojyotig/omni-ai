# WS7: Token Optimization with Dynamic Settings UI (Mastra Way)

**Priority**: P0 (CRITICAL - Blocker)
**Duration**: 2-3 days
**Dependencies**: WS4 (Agents + Workflows)
**Status**: 🚧 In Progress (2025-10-31)

---

## Objective

Prevent rate limit errors using **Mastra's built-in TokenLimiter** with **user-configurable settings** that work for ALL provider/model combinations.

**Problem**: Rate limit errors (40,000 tokens/min) after 2-3 iterations.

**Root Cause**: Different providers/models have different:
- Token limits (Anthropic: 40k/min, OpenAI: varies by tier)
- Context windows (Claude: 200k, GPT-4o: 128k)
- Optimal token usage patterns

**Mastra Way**: Use TokenLimiter processor with **dynamic configuration per provider/model**.

---

## Research First: Mastra Memory Management

### Task 1: Check Mastra Docs for Memory & Context Features

**Query Mastra docs for**:
- [x] Memory retention policies (how to limit conversation history)
- [x] Context window management in Mastra Memory
- [x] Message pruning strategies
- [x] Token budget configuration for agents

**Paths to check**:
- `reference/memory/`
- `memory/` (guides)
- Agent configuration docs

**Action**: Find Mastra's recommended approach before writing custom code.

---

## Implementation (After Research)

### Task 2: Configure Mastra Memory with Retention Policy

**Expected Mastra Pattern**:
```typescript
// src/mastra/agents/smart-agent.ts
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

export async function createSmartAgent(providerId: string, modelId: string) {
  // ...

  return new Agent({
    name: 'Smart Agent',
    model: getProvider(),
    tools: tools,
    memory: new Memory({
      storage: new LibSQLStore({
        url: `file:${dbPath}`,
      }),
      // Mastra's retention policy (if available)
      retentionPolicy: {
        maxMessages: 20,        // Keep last 20 messages
        maxAge: 30 * 60 * 1000, // 30 minutes
      },
      // Or context window config
      contextWindow: {
        maxTokens: 8000,  // If Mastra supports this
      },
    }),
  });
}
```

**Subtasks**:
- [x] Query Mastra docs for Memory configuration options
- [x] Implement retention policy using Mastra's API
- [x] Test with long conversations
- [x] Verify no rate limit errors

---

### Task 3: Use Mastra's Agent maxTokens Configuration

**Check if Mastra Agent supports token limits**:
```typescript
return new Agent({
  name: 'Smart Agent',
  model: getProvider(),
  tools: tools,
  memory: memory,
  // Mastra's token management (if available)
  maxTokens: 4096,           // Response token limit
  maxContextTokens: 8000,    // Context window limit
});
```

**Subtasks**:
- [ ] Check Agent constructor options in Mastra docs
- [ ] Configure token limits at agent level
- [ ] Test with streaming responses

---

### Task 4: Fallback - Simple Message Windowing (Only if Mastra Doesn't Provide)

**If Mastra doesn't have built-in retention**:
```typescript
// lib/memory/simple-windowing.ts
export async function getRecentMessages(
  memory: Memory,
  threadId: string,
  maxMessages: number = 20
) {
  const allMessages = await memory.getThread(threadId);
  return allMessages.messages.slice(-maxMessages);
}
```

**Use in agents**:
```typescript
const recentMessages = await getRecentMessages(
  selectedAgent.memory,
  threadId,
  20
);
```

**Only implement if**: Mastra docs confirm no built-in retention policy.

---

## Acceptance Criteria

- [x] Mastra docs consulted for memory/token management
- [x] Retention policy configured using Mastra's API (preferred)
- [x] TokenLimiter processor implemented (32k token limit)
- [x] Dev server verified working with new configuration
- [x] All 3 agents updated with memory optimization

---

## Files to Modify

**Files Modified**:
- [x] `src/mastra/agents/smart-agent.ts` - Added TokenLimiter + lastMessages: 20
- [x] `src/mastra/agents/datadog-champion.ts` - Added TokenLimiter + lastMessages: 20
- [x] `src/mastra/agents/api-correlator.ts` - Added TokenLimiter + lastMessages: 20

---

## Solution Architecture

### Dynamic Settings UI (Agent Config Tab)

**UI Components**:
1. **Provider/Model Selector** - Choose which provider/model to configure
2. **Max Output Tokens Slider** - Control TokenLimiter limit (1k-100k range)
3. **Temperature Slider** - Control randomness (0.0-2.0 range)
4. **Max Iterations Slider** - Control reasoning loops (1-25 range)
5. **Save Button** - Persist to localStorage per provider/model

**Settings Storage**:
```typescript
// lib/stores/agent-config-store.ts
interface AgentConfig {
  providerId: string;
  modelId: string;
  maxOutputTokens: number;    // For TokenLimiter
  temperature: number;         // For Agent
  maxIterations: number;       // For Agent
}

// Stored in localStorage as:
// agent-config-anthropic-claude-3-7-sonnet = { maxOutputTokens: 8192, ... }
// agent-config-openai-gpt-4o = { maxOutputTokens: 16384, ... }
```

**Agent Implementation**:
```typescript
// src/mastra/agents/smart-agent.ts
export async function createSmartAgent(
  providerId: string,
  modelId: string,
  config: AgentConfig  // ← NEW: Dynamic config parameter
) {
  return new Agent({
    name: 'Smart Agent',
    model: getProvider(),
    tools: tools,
    temperature: config.temperature,           // ← Dynamic
    maxIterations: config.maxIterations,       // ← Dynamic
    memory: new Memory({
      storage: new LibSQLStore({ url: `file:${dbPath}` }),
      options: {
        lastMessages: 10,
      },
      processors: [
        new TokenLimiter(config.maxOutputTokens),  // ← Dynamic
      ],
    }),
  });
}
```

### Default Configurations (Safe Defaults)

**Anthropic Claude Models**:
```typescript
{
  maxOutputTokens: 8192,   // Safe for 40k/min rate limit
  temperature: 0.7,
  maxIterations: 15
}
```

**OpenAI GPT-4o Models**:
```typescript
{
  maxOutputTokens: 16384,  // Higher limit, faster rate limits
  temperature: 0.7,
  maxIterations: 15
}
```

**Custom Enterprise OAuth2 Providers**:
```typescript
{
  maxOutputTokens: 4096,   // Conservative default
  temperature: 0.7,
  maxIterations: 10
}
```

### Why This Works for ALL Providers

1. **Provider-Agnostic**: TokenLimiter counts tokens, works with any provider
2. **User Control**: User can adjust based on their specific rate limits
3. **Per-Model Tuning**: Different models in same provider can have different configs
4. **Enterprise Ready**: Custom OAuth2 providers use same mechanism
5. **Mastra Native**: Uses TokenLimiter processor (not custom code)

---

## Implementation Tasks

### Phase 1: Settings Store & Defaults
- [ ] Create `lib/stores/agent-config-store.ts` with Zustand
- [ ] Define default configs for each provider/model
- [ ] Implement localStorage persistence
- [ ] Add helper functions to get/set config

### Phase 2: Settings UI
- [ ] Create Agent Config tab in Settings panel
- [ ] Build provider/model selector dropdown
- [ ] Add Max Output Tokens slider (1k-100k, step: 512)
- [ ] Add Temperature slider (0.0-2.0, step: 0.1)
- [ ] Add Max Iterations slider (1-25, step: 1)
- [ ] Show current values and descriptions
- [ ] Implement save functionality

### Phase 3: Agent Integration
- [ ] Update all 3 agent creation functions to accept config parameter
- [ ] Modify `app/api/chat/route.ts` to load config before creating agent
- [ ] Pass dynamic config to agents
- [ ] Test with multiple provider/model combinations

### Phase 4: Validation
- [ ] Test Anthropic Claude with 8k token limit (no rate limits)
- [ ] Test OpenAI GPT-4o with 16k token limit
- [ ] Test with rapid message succession (5-10 messages)
- [ ] Verify TokenLimiter actually prunes messages
- [ ] Document validation results

---

## Acceptance Criteria

- [ ] Settings UI exists in Agent Config tab
- [ ] User can configure tokens/temperature/iterations per provider/model
- [ ] Configurations persist across page reloads
- [ ] Agents use dynamic config (not hardcoded values)
- [ ] Works with Anthropic, OpenAI, and custom OAuth2 providers
- [ ] No rate limit errors with default configurations
- [ ] User validation confirms it works in real usage

---

**Created**: 2025-10-31
**Updated**: 2025-10-31 (Changed to dynamic Settings UI approach)
**Status**: 🚧 In Progress
**Mastra-First Approach**: ✅ Using TokenLimiter with dynamic user configuration
