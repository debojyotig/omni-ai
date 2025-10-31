# WS7: Token Optimization (Mastra Way)

**Priority**: P0 (CRITICAL - Blocker)
**Duration**: 2-3 days
**Dependencies**: WS4 (Agents + Workflows)
**Status**: Not Started

---

## Objective

Prevent rate limit errors using **Mastra's built-in memory and context management features**.

**Problem**: 40,000 tokens/min rate limit after 2-3 iterations.

**Mastra Way**: Use Mastra's Memory retention policies and context window management instead of custom token counting.

---

## Research First: Mastra Memory Management

### Task 1: Check Mastra Docs for Memory & Context Features

**Query Mastra docs for**:
- [ ] Memory retention policies (how to limit conversation history)
- [ ] Context window management in Mastra Memory
- [ ] Message pruning strategies
- [ ] Token budget configuration for agents

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
- [ ] Query Mastra docs for Memory configuration options
- [ ] Implement retention policy using Mastra's API
- [ ] Test with long conversations
- [ ] Verify no rate limit errors

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

- [ ] Mastra docs consulted for memory/token management
- [ ] Retention policy configured using Mastra's API (preferred)
- [ ] OR simple windowing implemented (fallback)
- [ ] No rate limit errors for 50+ message conversations
- [ ] Conversations stay under 20,000 total tokens

---

## Files to Modify

**If using Mastra features**:
- [ ] `src/mastra/agents/*.ts` - Update Memory configuration

**If fallback needed**:
- [ ] `lib/memory/simple-windowing.ts` - Lightweight windowing
- [ ] `app/api/chat/route.ts` - Apply windowing before generate()

---

**Created**: 2025-10-31
**Status**: Ready - Start by querying Mastra docs
**Mastra-First Approach**: ✅ Use Mastra's Memory features, not custom token counting
