# WS6: Environment Variable & MCP Configuration (Mastra Way)

**Priority**: P0 (CRITICAL - Blocker)
**Duration**: 1-2 days
**Dependencies**: WS3 (MCP Integration)
**Status**: Not Started

---

## Objective

Fix omni-api-mcp subprocess environment variable loading using **Mastra's MCP configuration patterns**.

**Problem**: omni-api-mcp started by @mastra/mcp's MCPClient doesn't inherit environment variables.

**Mastra Way**: Use Mastra's server configuration with proper env handling.

---

## Research First: Mastra MCP Patterns

### Task 1: Check Mastra Documentation for MCP Environment Handling

**Use Mastra MCP docs server**:
```typescript
// Query the Mastra docs MCP server we have configured
// Check paths: reference/tools/, tools-mcp/
```

**Questions to answer**:
- [ ] Does @mastra/mcp MCPClient support `env` in server config?
- [ ] How does Mastra recommend passing env vars to MCP servers?
- [ ] Are there examples in Mastra docs/examples for MCP + environment?
- [ ] Should we use Mastra's tool configuration instead of raw MCPClient?

**Action**: Query Mastra docs before writing any code.

---

## Implementation (After Research)

### Task 2: Implement Mastra's Recommended Pattern

**Option A: If Mastra has built-in env support**
```typescript
// lib/mcp/mcp-client.ts - Update to use Mastra's pattern
import { MCPClient } from '@mastra/mcp';

const client = new MCPClient({
  id: 'omni-api-mcp',
  servers: {
    'omni-api-mcp': {
      command: 'node',
      args: [process.env.OMNI_API_MCP_PATH!],
      env: process.env,  // If supported by Mastra
    },
  },
});
```

**Option B: If we need to configure at Mastra instance level**
```typescript
// src/mastra/index.ts - Configure in main Mastra instance
import { Mastra } from '@mastra/core';

export const mastra = new Mastra({
  tools: {
    mcp: {
      servers: {
        'omni-api-mcp': {
          command: 'node',
          args: [process.env.OMNI_API_MCP_PATH!],
          env: process.env,
        },
      },
    },
  },
});
```

**Subtasks**:
- [ ] **First**: Query Mastra docs MCP server for env patterns
- [ ] Implement the Mastra-recommended approach
- [ ] Test that env vars are passed to subprocess
- [ ] Verify with simple API call

---

### Task 3: Test with Real API Calls

**Simple test via chat API**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Discover available datasets",
    "agent": "smart",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }'
```

**Expected**: Should see services with auth status (not "missing credentials")

---

## Acceptance Criteria

- [ ] Mastra docs consulted for recommended pattern
- [ ] Environment variables passed to omni-api-mcp using Mastra's approach
- [ ] `discover_datasets` shows services with auth
- [ ] `call_rest_api` to authenticated endpoints works

---

## Files to Modify

- [ ] `lib/mcp/mcp-client.ts` - Update with Mastra pattern
- [ ] OR `src/mastra/index.ts` - If env config belongs at Mastra level
- [ ] `.env.example` - Document required env vars

---

**Created**: 2025-10-31
**Status**: Ready - Start by querying Mastra docs
**Mastra-First Approach**: ✅ Research Mastra patterns before custom code
