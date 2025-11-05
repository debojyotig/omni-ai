# Model and Provider Configuration System Analysis

## Executive Summary

The omni-ai system currently has a **two-tier configuration system**:

1. **Provider/Model Selection** (Runtime-switchable via Zustand store)
   - Client-side selection of provider and model
   - Persisted to localStorage
   - Used to determine which LLM API to call

2. **Agent Configuration** (Per Provider/Model - Runtime-settable)
   - Max Output Tokens (memory pruning control)
   - Temperature (response randomness)
   - Max Iterations (reasoning loop limit)
   - Per-provider defaults (Anthropic: 4k tokens, OpenAI: 16k, OAuth2: 4k)
   - **Currently stored but NOT USED in the actual agent execution**

---

## Current Architecture

### 1. Provider/Model Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Client (Browser)                                               │
│                                                                  │
│  Chat Header (chat-header.tsx)                                 │
│  ├─ Model Selector (dropdown)                                 │
│  │  └─ Uses: useProviderStore.setModel()                      │
│  │     └─ Updates: selectedModelId & selectedProviderId       │
│  └─ Stores to localStorage via Zustand persist()              │
│                                                                  │
│  Settings Panel (agent-config-tab.tsx)                        │
│  ├─ Max Output Tokens Slider                                  │
│  ├─ Temperature Slider                                        │
│  ├─ Max Iterations Slider                                     │
│  └─ Stores to localStorage via useAgentConfigStore persist() │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTP POST /api/chat
                    with message only
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Server (Next.js API)                                           │
│                                                                  │
│  /api/chat/route.ts                                           │
│  ├─ Receives: { message, agent, threadId, resourceId }       │
│  ├─ Does NOT receive: selectedModelId, AgentConfig            │
│  ├─ Calls getAnthropicConfig() → returns ANTHROPIC_API_KEY   │
│  └─ Creates agent with:                                        │
│     ├─ systemPrompt                                           │
│     ├─ mcpServers                                             │
│     ├─ maxTurns: 10 (HARDCODED)                              │
│     └─ ❌ NO temperature, NO maxOutputTokens from config      │
│                                                                  │
│  Claude Agent SDK query()                                      │
│  └─ Uses Claude SDK defaults (not app defaults)              │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Key Files and Their Responsibilities

#### Client-Side Configuration Files

**File: `/lib/stores/provider-store.ts`**
- Manages: `selectedProviderId`, `selectedModelId`
- Persists to: localStorage (`omni-ai-provider-storage`)
- Functions:
  - `setProvider(providerId)` - changes provider
  - `setModel(modelId)` - changes model
  - `getAvailableProviders()` - lists all available providers
  - `getAvailableModels()` - lists models for selected provider
  - `getCurrentModel()` - returns current ModelConfig

**File: `/lib/stores/agent-config-store.ts`**
- Manages: Per-provider/model AgentConfig objects
- Persists to: localStorage (`omni-ai-agent-config-storage`)
- Storage key format: `providerId:modelId` (e.g., `anthropic:claude-sonnet-4-5-20250929`)
- Default configs by provider:
  ```
  anthropic: { maxOutputTokens: 4096, temperature: 0.7, maxIterations: 15 }
  openai:    { maxOutputTokens: 16384, temperature: 0.7, maxIterations: 15 }
  oauth2:    { maxOutputTokens: 4096, temperature: 0.7, maxIterations: 10 }
  ```
- Functions:
  - `getConfig(providerId, modelId)` - retrieve config (or default if not found)
  - `setConfig(config)` - save config to localStorage
  - `resetConfig(providerId, modelId)` - delete custom config, revert to default

**File: `/lib/config/provider-config.ts`**
- Metadata about providers and models (client-safe, no Mastra imports)
- Exports:
  - `PROVIDERS` - provider metadata (id, name, type, envVars)
  - `MODELS` - model metadata (id, name, provider, maxTokens)
  - Helper functions for querying providers/models
- Models defined for: OpenAI, Anthropic, Azure OpenAI, AWS Bedrock, GCP Vertex

#### Server-Side Configuration Files

**File: `/lib/config/server-provider-config.ts`**
- Environment-based provider configuration
- Selected via `process.env.SELECTED_PROVIDER` (set in .env.local)
- Returns: `ProviderConfig` with apiKey and baseURL for gateway routing
- **Note: This file is about enterprise gateways (Azure, AWS, GCP), NOT runtime model switching**

**File: `/lib/agents/subagent-configs.ts`**
- Sub-agent configurations with system prompts
- Exports: `subAgentConfigs` with 3 agents:
  - `datadog-champion` - DataDog error analysis
  - `api-correlator` - cross-service correlation
  - `general-investigator` - general API exploration
- **Currently: Agent system prompts are static, no runtime configuration**

#### UI Components

**File: `/components/settings-panel.tsx`**
- Main settings view displayed in activity bar
- Tabs:
  1. Provider & Model (read-only display + how to change)
  2. Agent Config (delegates to AgentConfigTab)
  3. Data Extraction (delegates to ExtractionSettingsTab)

**File: `/components/agent-config-tab.tsx`**
- Configurable UI for Max Output Tokens, Temperature, Max Iterations
- Allows selecting provider/model combination
- Shows defaults for each provider
- Has Save/Reset buttons
- **Currently: Settings are saved to localStorage but never used**

**File: `/components/chat-header.tsx`**
- Model selector dropdown (runtime switching works)
- Agent selector dropdown
- Shows currently selected model and agent
- Filters models by configured providers only

#### API Routes

**File: `/app/api/chat/route.ts`**
- Main chat endpoint
- Request body: `{ message, agent, threadId, resourceId }`
- **Gap: Does NOT receive selectedModelId or AgentConfig**
- Uses Claude Agent SDK `query()` function:
  - `maxTurns: 10` (hardcoded)
  - No temperature, maxOutputTokens, or other agent config
  - Uses SDK defaults

**File: `/app/api/provider/route.ts`**
- Returns current provider info (read-only)
- Used by settings panel and chat header

---

## Data Flow: Complete Picture

### Model Selection Flow (Works)
```
User selects model in chat-header.tsx
  ↓
useProviderStore.setModel(modelId)
  ↓
Zustand updates state + persists to localStorage
  ↓
Next message → /api/chat endpoint
  ↓
Server reads process.env.SELECTED_PROVIDER (❌ ignores model selection)
  ↓
Uses wrong provider if user switched model!
```

**Issue**: The chat endpoint doesn't know which model the user selected!

### Agent Configuration Flow (Doesn't Work)
```
User adjusts settings in agent-config-tab.tsx
  ↓
useAgentConfigStore.setConfig(config)
  ↓
Zustand updates state + persists to localStorage
  ↓
Next message → /api/chat endpoint
  ↓
Agent created with hardcoded settings:
  - maxTurns: 10
  - temperature: (Claude SDK default - likely 1.0)
  - maxOutputTokens: (Claude SDK default - likely 4096)
  ↓
User's settings are IGNORED ❌
```

**Issue**: The chat endpoint has no way to access the user's configured settings!

---

## Current Model/Provider Configuration System

### Where Model List Comes From

1. **File: `/lib/config/provider-config.ts`**
   ```typescript
   export const MODELS: Record<string, ModelConfig[]> = {
     openai: [...],
     anthropic: [...],
     'azure-openai': [...],
     'aws-bedrock': [...],
     'gcp-vertex': [...]
   }
   ```
   - Static list of all available models across all providers
   - Includes metadata: id, name, provider, maxTokens

2. **File: `/lib/stores/provider-store.ts`**
   ```typescript
   getAllModels() // returns all models across all providers
   getAvailableModels() // returns models for selected provider
   ```

3. **File: `/components/chat-header.tsx`**
   - Fetches `/api/provider` to get configured providers
   - Filters models to only show from configured providers
   - Groups by provider in dropdown

### Where Agent Configuration Comes From

1. **Default configs in `/lib/stores/agent-config-store.ts`**
   ```typescript
   const DEFAULT_CONFIGS: Record<string, Partial<AgentConfig>> = {
     anthropic: { maxOutputTokens: 4096, temperature: 0.7, maxIterations: 15 },
     openai: { maxOutputTokens: 16384, temperature: 0.7, maxIterations: 15 },
     oauth2: { maxOutputTokens: 4096, temperature: 0.7, maxIterations: 10 }
   }
   ```

2. **User custom configs in localStorage**
   - Key format: `omni-ai-agent-config-storage`
   - Stores custom AgentConfig per provider/model

3. **Currently NOT used** - settings are saved but never applied

---

## How Settings Currently Flow to Chat Endpoint

### What DOES Flow
1. **Agent selection** ✓
   - User selects agent in chat-header
   - Zustand stores selection
   - User sends: `{ message, agent, threadId, resourceId }`
   - Server reads `agent` parameter

2. **Provider selection** ✗ (Partially)
   - User selects model in chat-header (works)
   - Zustand stores selection (works)
   - But `/api/chat` doesn't receive selected model
   - Server uses `process.env.SELECTED_PROVIDER` instead (environment-level only)

### What DOESN'T Flow
1. **Selected model ID**
   - Client has it: `useProviderStore.selectedModelId`
   - NOT sent to server in POST request
   - Server doesn't know which model user selected

2. **Agent configuration**
   - Client has it: `useAgentConfigStore.getConfig(providerId, modelId)`
   - NOT sent to server in POST request
   - Settings are saved to localStorage but NEVER used

---

## How These Settings Are Currently Managed

### Provider/Model Management (Settings Panel)
- **View**: Settings Panel → "Provider & Model" tab
- **Read-only display** of current provider
- Shows instructions to change via `.env.local`
- No runtime provider switching (requires app restart)

### Agent Configuration Management (Settings Panel)
- **View**: Settings Panel → "Agent Config" tab
- **UI**: Sliders for max tokens, temperature, iterations
- **Storage**: Zustand → localStorage
- **Format**: Per provider/model combination
- **Application**: 🔴 NOT IMPLEMENTED (settings stored but not used)

### Settings Storage Details
```
localStorage: {
  "omni-ai-provider-storage": {
    selectedProviderId: "anthropic",
    selectedModelId: "claude-sonnet-4-5-20250929"
  },
  "omni-ai-agent-config-storage": {
    configs: {
      "anthropic:claude-sonnet-4-5-20250929": {
        providerId: "anthropic",
        modelId: "claude-sonnet-4-5-20250929",
        maxOutputTokens: 8192,
        temperature: 0.7,
        maxIterations: 15
      }
    }
  }
}
```

---

## Required Changes for Chat-Level Model Switching with Custom Settings

### 1. Update Chat Request Payload

**Current:** `/api/chat` receives
```json
{
  "message": "string",
  "agent": "smart|datadog|correlator",
  "threadId": "string",
  "resourceId": "string"
}
```

**Required:** Add model selection and config
```json
{
  "message": "string",
  "agent": "smart|datadog|correlator",
  "threadId": "string",
  "resourceId": "string",
  "modelConfig": {
    "providerId": "anthropic",
    "modelId": "claude-sonnet-4-5-20250929",
    "temperature": 0.7,
    "maxOutputTokens": 4096,
    "maxIterations": 15
  }
}
```

### 2. Update Chat API Route

**File: `/app/api/chat/route.ts`**

Changes needed:
1. Extract `modelConfig` from request body
2. If `modelConfig` not provided, fetch from client's localStorage (unlikely - client should send it)
3. Use `modelConfig.providerId` and `modelConfig.modelId` to determine which LLM API to use
4. Pass `temperature` and `maxOutputTokens` to Claude SDK `query()` options
5. Pass `maxIterations` to Claude SDK `query()` options as `maxTurns`

```typescript
export async function POST(req: NextRequest) {
  const { message, agent, threadId, resourceId, modelConfig } = await req.json();

  // Get or use provided model config
  let config = modelConfig;
  if (!config) {
    // Fallback - shouldn't happen if client sends it
    config = {
      providerId: 'anthropic',
      modelId: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      maxOutputTokens: 4096,
      maxIterations: 15
    };
  }

  // Configure provider based on modelConfig.providerId
  const providerConfig = getAnthropicConfigForProvider(config.providerId);
  process.env.ANTHROPIC_API_KEY = providerConfig.apiKey;
  if (providerConfig.baseURL) {
    process.env.ANTHROPIC_BASE_URL = providerConfig.baseURL;
  }

  // Pass settings to Claude SDK
  const result = query({
    prompt: message,
    options: {
      resume: sessionId || undefined,
      systemPrompt: agentConfig.systemPrompt,
      agents: agentConfig.agents,
      mcpServers,
      maxTurns: config.maxIterations,        // NEW: from modelConfig
      temperature: config.temperature,        // NEW: from modelConfig
      maxOutputTokens: config.maxOutputTokens, // NEW: from modelConfig
      // ... rest of options
    }
  });
}
```

### 3. Update Chat Component

**File: Wherever messages are sent (likely in chat-interface.tsx)**

Changes needed:
1. When sending message, fetch current config from stores
2. Include modelConfig in POST request

```typescript
const { selectedProviderId, selectedModelId } = useProviderStore();
const { getConfig } = useAgentConfigStore();

// Get current config
const modelConfig = getConfig(selectedProviderId, selectedModelId);

// Send message with config
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message,
    agent,
    threadId,
    resourceId,
    modelConfig  // NEW: include configuration
  })
});
```

### 4. Update Server Provider Config

**File: `/lib/config/server-provider-config.ts`**

New function needed:
```typescript
/**
 * Get Anthropic config based on model provider
 * This allows runtime switching between providers
 */
export function getAnthropicConfigForProvider(providerId: string): {
  apiKey: string;
  baseURL?: string;
} {
  // Map providerId to environment variables
  // (similar to existing getAnthropicConfig but per-provider)
  
  switch (providerId) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: undefined
      };
    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseURL: process.env.ANTHROPIC_BASE_URL
      };
    case 'azure-openai':
      return {
        apiKey: process.env.AZURE_CLIENT_SECRET || '',
        baseURL: process.env.AZURE_GATEWAY_URL
      };
    // ... other providers
  }
}
```

---

## Summary of Configuration Points

### What Can Be Configured Per Model
1. **Max Output Tokens** - Controls memory pruning and response length (range: 1024-100000, recommended: 4k-16k)
2. **Temperature** - Controls response randomness (range: 0.0-2.0, recommended: 0.7)
3. **Max Iterations** - Controls reasoning loop depth (range: 1-25, recommended: 10-15)

### What Cannot Currently Be Configured
- **Model ID** - Hardcoded via `process.env.SELECTED_PROVIDER`
- **Provider** - Requires app restart
- **System prompts** - Static per agent type
- **Tool access** - All MCP tools always available

### Where Defaults Come From
- Provider-specific defaults in `agent-config-store.ts`
- Overridable per provider/model via UI (but not applied)

---

## Architecture Diagram: Information Flow

```
┌──────────────────────────────────────────┐
│ Browser / Client                          │
│                                            │
│ ┌────────────────────────────────────┐   │
│ │ Chat Header                        │   │
│ │ - Model Selector (dynamic)         │   │
│ │ - Agent Selector (dynamic)         │   │
│ │ useProviderStore: store model      │   │
│ │ useAgentStore: store agent         │   │
│ └────────────────────────────────────┘   │
│ ↓                                         │
│ ┌────────────────────────────────────┐   │
│ │ Chat Interface                     │   │
│ │ - Message input                    │   │
│ │ - Send button (POST /api/chat)     │   │
│ │ MISSING: Send modelConfig!         │   │
│ └────────────────────────────────────┘   │
│ ↓                                         │
│ ┌────────────────────────────────────┐   │
│ │ Settings Panel                     │   │
│ │ ├─ Agent Config Tab:               │   │
│ │ │  - Max Output Tokens (slider)   │   │
│ │ │  - Temperature (slider)         │   │
│ │ │  - Max Iterations (slider)      │   │
│ │ │  useAgentConfigStore: store cfg │   │
│ │ │  Saves to localStorage ✓        │   │
│ │ │  But NEVER SENT to server ❌    │   │
│ │ └─ Provider Tab (read-only)        │   │
│ └────────────────────────────────────┘   │
│ ↓                                         │
│ localStorage: {                           │
│   "omni-ai-provider-storage": {...},    │
│   "omni-ai-agent-config-storage": {...} │
│ }                                         │
└──────────────────────────────────────────┘
         │ POST /api/chat
         │ {
         │   message,
         │   agent,
         │   threadId,
         │   resourceId
         │   ❌ missing: modelConfig
         │ }
         ▼
┌──────────────────────────────────────────┐
│ Server / API                              │
│                                            │
│ /api/chat/route.ts                       │
│ - Receives message, agent only           │
│ - Ignores user's model selection         │
│ - Uses process.env.SELECTED_PROVIDER     │
│ - Creates agent with hardcoded settings: │
│   - maxTurns: 10                         │
│   - temperature: (SDK default)           │
│   - maxOutputTokens: (SDK default)       │
│ ❌ User config is inaccessible           │
│                                            │
│ Claude Agent SDK query()                  │
│ - Uses default SDK settings               │
│ - Returns streaming response              │
└──────────────────────────────────────────┘
```

---

## Key Findings

### 1. Configuration System is Partially Implemented
- ✓ UI for configuring settings exists (sliders, dropdowns)
- ✓ Settings are persisted to localStorage
- ✓ Per-provider defaults are defined
- ❌ Settings are NEVER sent to the server
- ❌ Settings are NEVER applied to the agents

### 2. Model Selection is Partially Implemented
- ✓ Client-side model selector works
- ✓ Model selection persisted to localStorage
- ❌ Server doesn't know which model was selected
- ❌ Uses environment variable instead of user selection
- ✓ Model list comes from static config in provider-config.ts

### 3. Provider Configuration is Environment-Based
- Uses `process.env.SELECTED_PROVIDER` (set in .env.local)
- Requires app restart to change
- Supports multiple providers (Anthropic, OpenAI, Azure, AWS, GCP)
- Gateway-based routing for enterprise providers

### 4. Agent Configuration is Not Applied
- Settings are configured per provider/model
- Stored in localStorage
- **Never loaded or used in the chat API**
- Default provider-specific values are defined but only used if no custom config exists

---

## Next Steps to Enable Chat-Level Model Switching

1. **Update `/app/api/chat/route.ts`** to accept and use `modelConfig`
2. **Update chat interface** to send `modelConfig` in request
3. **Update `/lib/config/server-provider-config.ts`** to support per-provider configuration
4. **Test** that selected model and settings are properly applied
5. **Consider** whether settings should fallback to defaults or require explicit sending
