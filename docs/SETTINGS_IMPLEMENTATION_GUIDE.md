# Settings Implementation Guide: Making Configuration Actually Work

## Problem Statement

The omni-ai system has a sophisticated configuration system **that doesn't work end-to-end**:

1. Users can select different models in the chat header
2. Users can configure agent settings (tokens, temperature, iterations) in the settings panel
3. Everything is saved to localStorage
4. **But the chat endpoint ignores all of it and uses hardcoded/environment-based settings**

This guide explains how to make the settings actually flow through to the Claude Agent SDK.

---

## Current Broken Flows

### Flow 1: Model Selection

```
┌─ Chat Header: User selects Claude Sonnet 4.5
│
├─ useProviderStore.setModel('claude-sonnet-4-5-20250929')
│
├─ Zustand updates selectedModelId + persists to localStorage
│
├─ POST /api/chat {
│    message: "...",
│    agent: "smart"
│    // ❌ MISSING: modelConfig
│  }
│
├─ Server receives request but has NO knowledge of selected model
│
└─ Server uses process.env.SELECTED_PROVIDER (hardcoded in .env.local)
   └─ If .env says SELECTED_PROVIDER=openai but user selected Claude → WRONG API KEY!
```

### Flow 2: Agent Settings

```
┌─ Settings Panel: User adjusts Temperature slider to 0.9
│
├─ useAgentConfigStore.setConfig({
│    providerId: 'anthropic',
│    modelId: 'claude-sonnet-4-5-20250929',
│    maxOutputTokens: 8192,
│    temperature: 0.9,  // ← User's custom value
│    maxIterations: 12
│  })
│
├─ Zustand saves to localStorage: "omni-ai-agent-config-storage"
│
├─ POST /api/chat {
│    message: "...",
│    agent: "smart"
│    // ❌ MISSING: modelConfig with custom settings
│  }
│
├─ Server has NO way to access localStorage
│
└─ Claude SDK query() uses defaults instead
   └─ temperature: 1.0 (SDK default), NOT user's 0.9
   └─ maxOutputTokens: 4096 (SDK default), NOT user's 8192
```

---

## The Fix: Making Settings Flow Work

### Step 1: Understand the Data Flow We Need

```
Browser                                Server
├─ useProviderStore.selectedModelId   
├─ useProviderStore.selectedProviderId
├─ useAgentConfigStore.getConfig()    
│  
└─ POST /api/chat with modelConfig ──→ 
                                       ├─ Extract modelConfig
                                       ├─ Use providerId to select API key
                                       ├─ Pass temperature, maxOutputTokens to SDK
                                       └─ Return streaming response
```

### Step 2: Key Changes Required

#### A. Chat API Route (`/app/api/chat/route.ts`)

**Current:**
```typescript
export async function POST(req: NextRequest) {
  const { message, agent, threadId, resourceId } = await req.json();
  // ❌ No modelConfig received
  
  const providerConfig = getAnthropicConfig();
  // ❌ This uses process.env.SELECTED_PROVIDER (hardcoded)
  
  const result = query({
    prompt: message,
    options: {
      maxTurns: 10,  // ❌ Hardcoded
      // ❌ No temperature, maxOutputTokens passed
      systemPrompt: agentConfig.systemPrompt,
      agents: agentConfig.agents,
      mcpServers,
    }
  });
}
```

**Required Changes:**
```typescript
export async function POST(req: NextRequest) {
  // 1. Extract modelConfig from request
  const { message, agent, threadId, resourceId, modelConfig } = await req.json();
  
  // 2. Validate modelConfig
  if (!modelConfig) {
    return new Response(
      JSON.stringify({ error: 'modelConfig is required' }),
      { status: 400 }
    );
  }
  
  // 3. Use providerId from modelConfig to get correct API key
  const providerConfig = getAnthropicConfigForProvider(modelConfig.providerId);
  process.env.ANTHROPIC_API_KEY = providerConfig.apiKey;
  if (providerConfig.baseURL) {
    process.env.ANTHROPIC_BASE_URL = providerConfig.baseURL;
  }
  
  // 4. Pass all settings to Claude SDK
  const result = query({
    prompt: message,
    options: {
      resume: sessionId || undefined,
      systemPrompt: agentConfig.systemPrompt,
      agents: agentConfig.agents,
      mcpServers,
      maxTurns: modelConfig.maxIterations,           // NEW: from modelConfig
      temperature: modelConfig.temperature,           // NEW: from modelConfig
      maxOutputTokens: modelConfig.maxOutputTokens,  // NEW: from modelConfig
      canUseTool: async (toolName: string, input: any) => {
        if (toolName.startsWith('mcp__omni-api__')) {
          return { behavior: 'allow' as const, updatedInput: input };
        }
        return { behavior: 'deny' as const, message: 'Only omni-api tools are allowed' };
      }
    }
  });
}
```

#### B. Chat Interface Component (`components/chat-interface.tsx` or similar)

**Current:**
```typescript
async function handleSendMessage(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      agent,
      threadId,
      resourceId
      // ❌ modelConfig not sent
    })
  });
}
```

**Required Changes:**
```typescript
import { useProviderStore } from '@/lib/stores/provider-store'
import { useAgentConfigStore } from '@/lib/stores/agent-config-store'

export function ChatInterface() {
  const { selectedProviderId, selectedModelId } = useProviderStore()
  const { getConfig } = useAgentConfigStore()
  
  async function handleSendMessage(message: string) {
    // 1. Get current selections
    if (!selectedProviderId || !selectedModelId) {
      alert('Please select a model first');
      return;
    }
    
    // 2. Get configuration for this provider/model
    const modelConfig = getConfig(selectedProviderId, selectedModelId);
    
    // 3. Send with modelConfig
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        agent,
        threadId,
        resourceId,
        modelConfig  // ← NEW: include configuration
      })
    });
    
    // ... handle response
  }
}
```

#### C. Server Provider Config (`/lib/config/server-provider-config.ts`)

**New Function:**
```typescript
/**
 * Get Anthropic SDK config based on provider ID
 * This enables runtime switching between providers and gateways
 */
export function getAnthropicConfigForProvider(providerId: string): {
  apiKey: string;
  baseURL?: string;
} {
  switch (providerId) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: undefined  // Use OpenAI's default
      };
      
    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseURL: process.env.ANTHROPIC_BASE_URL  // Optional gateway
      };
      
    case 'azure-openai':
      return {
        apiKey: process.env.AZURE_CLIENT_SECRET || '',
        baseURL: process.env.AZURE_GATEWAY_URL
      };
      
    case 'aws-bedrock':
      return {
        apiKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        baseURL: process.env.AWS_GATEWAY_URL
      };
      
    case 'gcp-vertex':
      return {
        apiKey: process.env.GCP_SERVICE_ACCOUNT_KEY || '',
        baseURL: process.env.GCP_GATEWAY_URL
      };
      
    default:
      // Fallback to environment-based provider
      return getAnthropicConfig();
  }
}
```

---

## Implementation Checklist

### Phase 1: Modify Chat API Route
- [ ] Add `modelConfig` to request body type definition
- [ ] Extract `modelConfig` in POST handler
- [ ] Create new function `getAnthropicConfigForProvider(providerId)`
- [ ] Use provider-specific API key configuration
- [ ] Pass `temperature`, `maxOutputTokens`, `maxIterations` to Claude SDK

### Phase 2: Update Chat Component
- [ ] Import `useProviderStore` and `useAgentConfigStore`
- [ ] In message send handler, get current selections and config
- [ ] Include `modelConfig` in `/api/chat` POST request

### Phase 3: Test
- [ ] Test selecting different models → verify correct API key is used
- [ ] Test changing temperature → verify temperature passed to SDK
- [ ] Test changing max tokens → verify token limit applied
- [ ] Test changing max iterations → verify maxTurns passed to SDK
- [ ] Test saving/resetting to defaults → verify settings persist

### Phase 4: Documentation
- [ ] Add code comments explaining the flow
- [ ] Document the request/response format
- [ ] Update any API documentation

---

## Type Definitions

Add to your types file or directly in the API route:

```typescript
/**
 * Model configuration sent from client to server
 * Allows runtime switching of models and their settings
 */
export interface ModelConfig {
  providerId: 'anthropic' | 'openai' | 'azure-openai' | 'aws-bedrock' | 'gcp-vertex';
  modelId: string;
  temperature: number;        // 0.0 - 2.0
  maxOutputTokens: number;    // 1024 - 100000
  maxIterations: number;      // 1 - 25
}

/**
 * Chat API request body
 */
export interface ChatRequest {
  message: string;
  agent: 'smart' | 'datadog' | 'correlator';
  threadId: string;
  resourceId: string;
  modelConfig: ModelConfig;
}
```

---

## Debugging

### Verify Settings Are Being Sent

1. Open browser DevTools → Network tab
2. Send a message
3. Click on POST `/api/chat` request
4. Check "Request Payload" → should include `modelConfig` with all fields

Expected payload:
```json
{
  "message": "What is 2+2?",
  "agent": "smart",
  "threadId": "thread-1234567890",
  "resourceId": "default-user",
  "modelConfig": {
    "providerId": "anthropic",
    "modelId": "claude-sonnet-4-5-20250929",
    "temperature": 0.7,
    "maxOutputTokens": 8192,
    "maxIterations": 15
  }
}
```

### Verify Settings Are Applied

1. Add temporary logging to `/app/api/chat/route.ts`:
```typescript
console.log('[CHAT] Model Config:', modelConfig);
console.log('[CHAT] Query options:', {
  maxTurns: modelConfig.maxIterations,
  temperature: modelConfig.temperature,
  maxOutputTokens: modelConfig.maxOutputTokens
});
```

2. Send a message and check server logs
3. Verify all values are correctly extracted and logged

---

## Edge Cases to Handle

### What if modelConfig is missing?

**Option A: Require it (recommended)**
```typescript
if (!modelConfig) {
  return new Response(
    JSON.stringify({ error: 'modelConfig is required' }),
    { status: 400 }
  );
}
```

**Option B: Fallback to defaults**
```typescript
const config = modelConfig || {
  providerId: 'anthropic',
  modelId: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  maxOutputTokens: 4096,
  maxIterations: 15
};
```

### What if selectedModelId is null on client?

```typescript
if (!selectedProviderId || !selectedModelId) {
  // Prevent send or use defaults
  showError('Please select a model');
  return;
}
```

### What if provided temperature is invalid?

Validate in API route:
```typescript
if (modelConfig.temperature < 0 || modelConfig.temperature > 2) {
  return new Response(
    JSON.stringify({ 
      error: 'Temperature must be between 0 and 2' 
    }),
    { status: 400 }
  );
}
```

---

## Benefits After Implementation

1. **Model Switching Works**
   - Users can switch between Claude, GPT-4, Azure, etc. mid-conversation
   - No app restart required
   - Correct API keys used automatically

2. **Settings Matter**
   - User can optimize token usage per model
   - Adjust temperature for different use cases
   - Control reasoning depth with max iterations

3. **Per-Model Optimization**
   - Anthropic: Use 4k tokens (rate limit conscious)
   - OpenAI: Use 16k tokens (higher limits)
   - Custom: Tune based on specific needs

4. **Better UX**
   - Model selector is no longer a lie
   - Settings are actually applied
   - Users have full control

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `/app/api/chat/route.ts` | Extract + use modelConfig, pass settings to SDK |
| `/lib/config/server-provider-config.ts` | Add getAnthropicConfigForProvider() |
| `components/chat-interface.tsx` | Fetch + send modelConfig |
| Documentation | Add code comments + this guide |

---

## Rollback Plan

If something breaks:

1. Revert modelConfig in POST request (remove it, send only message/agent)
2. Revert API route to use hardcoded getAnthropicConfig()
3. Settings will silently be ignored (current state)
4. App continues to work with environment-based provider selection

---

## Testing Strategy

### Unit Tests
```typescript
// Test getAnthropicConfigForProvider
test('should return OpenAI key for openai provider', () => {
  process.env.OPENAI_API_KEY = 'sk-test-123';
  const config = getAnthropicConfigForProvider('openai');
  expect(config.apiKey).toBe('sk-test-123');
});
```

### Integration Tests
```typescript
// Test full request flow
test('should apply temperature to agent', async () => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Test',
      agent: 'smart',
      threadId: 'test',
      resourceId: 'test',
      modelConfig: {
        providerId: 'anthropic',
        modelId: 'claude-sonnet-4-5-20250929',
        temperature: 0.9,
        maxOutputTokens: 8192,
        maxIterations: 15
      }
    })
  });
  
  // Verify response is successful
  expect(response.ok).toBe(true);
  // Could add spy to verify SDK received correct temperature
});
```

### Manual Testing
1. Set different temperatures, verify output randomness
2. Set low max tokens, verify length constraint
3. Switch models mid-conversation, verify API changes
4. Save config, refresh page, verify persistence
5. Reset to defaults, verify values change back

---

## Related Documentation

- `MODEL_CONFIGURATION_ANALYSIS.md` - Full architecture analysis
- `MODEL_CONFIG_QUICK_REFERENCE.md` - Quick lookup reference
- Agent configuration details in `/lib/stores/agent-config-store.ts`
- Provider configuration in `/lib/config/provider-config.ts`

