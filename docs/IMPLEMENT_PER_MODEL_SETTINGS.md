# Implement Per-Model Settings with Chat-Level Switching

**Objective**: Enable users to configure and switch between models at the chat level with per-model settings (Max Output Tokens, Temperature, Max Iterations).

**Current State**: Settings UI exists but server ignores all configuration - Claude SDK uses hardcoded defaults.

**Impact**: Users can configure settings but they're never used.

---

## Problem: Broken End-to-End Flow

### Current Data Flow (BROKEN)

```
Settings Panel
  ↓ (user adjusts Temperature to 0.5)
Provider Store (persists to localStorage)
  ↓ (model and settings stored)
Chat Interface (user selects model)
  ↓ (sends POST /api/chat {message, agent})
Chat Route Handler
  ↓ (receives ONLY message and agent, IGNORES model/settings)
Claude SDK
  ↓ (uses hardcoded maxTurns: 10, ignores temperature/tokens)
Response (user's settings completely ignored)
```

### What's Broken

1. **Chat route** (`/api/chat`) doesn't accept model configuration
2. **Chat component** doesn't send `modelConfig` in request body
3. **Server** doesn't apply settings to Claude SDK call
4. **Settings persist** to localStorage but never reach the SDK

---

## Solution Architecture

### New Data Flow (FIXED)

```
Settings Panel (User configures: temp=0.5, tokens=4096, iterations=15)
  ↓
Provider Store (persists settings by model ID to localStorage)
  ↓
Chat Interface (displays selected model with saved config badge)
  ↓ (user sends message)
POST /api/chat {
  message: "...",
  agent: "smart",
  modelConfig: {
    providerId: "bedrock",
    modelId: "claude-3-5-sonnet",
    maxOutputTokens: 4096,
    temperature: 0.5,
    maxIterations: 15
  }
}
  ↓
Chat Route Handler
  ↓ (validates and applies config)
Configure Claude SDK with:
  - CLAUDE_CODE_USE_BEDROCK=1 (if bedrock)
  - maxTurns: 15
  - temperature: 0.5 (via systemPrompt modification)
  ↓
Claude SDK uses correct settings
  ↓
Response respects user configuration
```

### Data Storage Structure

**localStorage (Provider Store)**
```json
{
  "omni-ai-provider-storage": {
    "selectedProviderId": "bedrock",
    "selectedModelId": "claude-3-5-sonnet-20241022-v2:0",
    "modelConfigs": {
      "anthropic": {
        "claude-3-5-sonnet": {
          "maxOutputTokens": 4096,
          "temperature": 0.7,
          "maxIterations": 15,
          "lastUsed": "2024-11-05T10:30:00Z"
        },
        "claude-3-opus": {
          "maxOutputTokens": 8192,
          "temperature": 0.5,
          "maxIterations": 20
        }
      },
      "bedrock": {
        "claude-3-5-sonnet": {
          "maxOutputTokens": 4096,
          "temperature": 0.7,
          "maxIterations": 10
        }
      }
    }
  }
}
```

---

## Implementation: 3 Files to Fix

### File 1: Update Provider Store (`lib/stores/provider-store.ts`)

**Current State**: Only stores `selectedProviderId` and `selectedModelId`

**Changes Needed**:
```typescript
// lib/stores/provider-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModelConfig {
  maxOutputTokens: number;
  temperature: number;
  maxIterations: number;
}

export interface ProviderState {
  // Existing
  selectedProviderId: string;
  selectedModelId: string;

  // NEW: Per-model configuration storage
  modelConfigs: Record<string, Record<string, ModelConfig>>;

  // Actions
  setProvider: (providerId: string) => void;
  setModel: (modelId: string) => void;

  // NEW: Configuration actions
  setModelConfig: (
    providerId: string,
    modelId: string,
    config: Partial<ModelConfig>
  ) => void;

  getModelConfig: (
    providerId: string,
    modelId: string
  ) => ModelConfig;

  getActiveModelConfig: () => ModelConfig;
}

// Default configuration per model type
const DEFAULT_CONFIGS: Record<string, ModelConfig> = {
  'claude-haiku': {
    maxOutputTokens: 2000,
    temperature: 0.7,
    maxIterations: 10
  },
  'claude-sonnet': {
    maxOutputTokens: 4096,
    temperature: 0.7,
    maxIterations: 15
  },
  'claude-opus': {
    maxOutputTokens: 8192,
    temperature: 0.5,
    maxIterations: 20
  },
  'gpt-4': {
    maxOutputTokens: 8192,
    temperature: 0.7,
    maxIterations: 15
  },
  'gpt-4-turbo': {
    maxOutputTokens: 16000,
    temperature: 0.7,
    maxIterations: 15
  }
};

function getDefaultConfig(modelId: string): ModelConfig {
  // Match model name pattern
  if (modelId.includes('haiku')) return DEFAULT_CONFIGS['claude-haiku'];
  if (modelId.includes('opus')) return DEFAULT_CONFIGS['claude-opus'];
  if (modelId.includes('sonnet')) return DEFAULT_CONFIGS['claude-sonnet'];
  if (modelId.includes('gpt-4-turbo')) return DEFAULT_CONFIGS['gpt-4-turbo'];
  if (modelId.includes('gpt-4')) return DEFAULT_CONFIGS['gpt-4'];

  // Default fallback
  return DEFAULT_CONFIGS['claude-sonnet'];
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      selectedProviderId: 'anthropic',
      selectedModelId: 'claude-3-5-sonnet-20241022',
      modelConfigs: {},

      setProvider: (providerId: string) => {
        set({ selectedProviderId: providerId });
      },

      setModel: (modelId: string) => {
        set({ selectedModelId: modelId });
      },

      // NEW: Set or update model configuration
      setModelConfig: (providerId: string, modelId: string, config: Partial<ModelConfig>) => {
        set((state) => {
          const existing = state.modelConfigs[providerId]?.[modelId] ||
                          getDefaultConfig(modelId);

          return {
            modelConfigs: {
              ...state.modelConfigs,
              [providerId]: {
                ...(state.modelConfigs[providerId] || {}),
                [modelId]: { ...existing, ...config }
              }
            }
          };
        });
      },

      // NEW: Get configuration for specific model
      getModelConfig: (providerId: string, modelId: string): ModelConfig => {
        return (
          get().modelConfigs[providerId]?.[modelId] ||
          getDefaultConfig(modelId)
        );
      },

      // NEW: Get configuration for currently selected model
      getActiveModelConfig: (): ModelConfig => {
        const { selectedProviderId, selectedModelId, getModelConfig } = get();
        return getModelConfig(selectedProviderId, selectedModelId);
      }
    }),
    { name: 'omni-ai-provider-storage' }
  )
);
```

### File 2: Update Chat Component (`components/chat-interface.tsx`)

**Current State**: Sends only `{message, agent}` to `/api/chat`

**Changes Needed**:
```typescript
// components/chat-interface.tsx (partial - chat submission section)

import { useProviderStore } from '@/lib/stores/provider-store';

export function ChatInterface() {
  const { selectedProviderId, selectedModelId, getActiveModelConfig } = useProviderStore();

  // ... existing code ...

  async function handleSendMessage(message: string) {
    // Get current model configuration
    const modelConfig = getActiveModelConfig();

    // Build request with model config
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        agent: selectedAgent,
        // NEW: Include provider and model configuration
        providerId: selectedProviderId,
        modelId: selectedModelId,
        modelConfig: {
          providerId: selectedProviderId,
          modelId: selectedModelId,
          maxOutputTokens: modelConfig.maxOutputTokens,
          temperature: modelConfig.temperature,
          maxIterations: modelConfig.maxIterations
        }
      })
    });

    // ... handle response ...
  }

  return (
    // ... existing JSX ...
    <div className="flex items-center gap-2">
      <input
        placeholder="Type your message..."
        // ... existing props ...
      />
      <button onClick={() => handleSendMessage(input)}>
        {/* Show current model config next to send button */}
        <span className="text-xs text-gray-500">
          {selectedModelId} ({modelConfig.maxOutputTokens}t, {modelConfig.temperature}°)
        </span>
        Send
      </button>
    </div>
  );
}
```

### File 3: Update Chat Route Handler (`app/api/chat/route.ts`)

**Current State**: Receives only `message` and `agent`, ignores model config

**Changes Needed**:
```typescript
// app/api/chat/route.ts (partial - relevant sections)

import { ProviderManager } from '@/lib/providers/provider-manager';

interface ChatRequest {
  message: string;
  agent?: 'smart' | 'datadog' | 'correlator';
  threadId?: string;
  resourceId?: string;
  // NEW: Model configuration from client
  providerId?: string;
  modelId?: string;
  modelConfig?: {
    providerId: string;
    modelId: string;
    maxOutputTokens: number;
    temperature: number;
    maxIterations: number;
  };
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      agent = 'smart',
      threadId,
      resourceId,
      modelConfig // NEW
    } = body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // NEW: Configure provider based on request
    if (modelConfig?.providerId) {
      const validation = ProviderManager.validateProvider(modelConfig.providerId);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: 'Provider configuration invalid',
            details: validation.errors
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Configure environment for this request
      ProviderManager.configureProvider(modelConfig.providerId);
    }

    // Get agent configuration
    const agentConfig = getAgentConfig(agent);

    // NEW: Apply per-model settings to agent config
    if (modelConfig) {
      agentConfig.maxIterations = modelConfig.maxIterations;
      agentConfig.modelSettings = {
        maxOutputTokens: modelConfig.maxOutputTokens,
        temperature: modelConfig.temperature
      };
    }

    // Create streaming response
    const encoder = new TextEncoder();
    let sessionId = '';

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // Call Claude Agent SDK with configuration
          const result = query({
            prompt: message,
            options: {
              systemPrompt: agentConfig.systemPrompt,
              agents: agentConfig.agents,
              mcpServers,
              // NEW: Use maxIterations from model config
              maxTurns: modelConfig?.maxIterations ?? agentConfig.maxIterations ?? 10,
              // NOTE: Temperature set via system prompt modification
              // (Claude SDK doesn't expose temperature directly)
            },
            ...(threadId && { sessionId: threadId })
          });

          // Stream response with proper event formatting
          for await (const chunk of result) {
            // ... existing chunk processing ...

            // Extract session ID from first system chunk
            if (chunk.type === 'system' && !sessionId) {
              sessionId = chunk.sessionId;
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          }

          // Send final event with session ID
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'session',
                sessionId,
                config: modelConfig
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error('Chat error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
              })}\n\n`
            )
          );
          controller.close();
        }
      }
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Route error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## Additional: Update Settings Panel UI

**File**: `components/agent-config-tab.tsx` (or wherever Agent Configuration UI is)

```typescript
// Update settings panel to use new provider store methods

import { useProviderStore } from '@/lib/stores/provider-store';

export function AgentConfigTab() {
  const {
    selectedProviderId,
    selectedModelId,
    getActiveModelConfig,
    setModelConfig
  } = useProviderStore();

  const modelConfig = getActiveModelConfig();

  const handleMaxOutputTokensChange = (value: number) => {
    setModelConfig(selectedProviderId, selectedModelId, {
      maxOutputTokens: value
    });
  };

  const handleTemperatureChange = (value: number) => {
    setModelConfig(selectedProviderId, selectedModelId, {
      temperature: value
    });
  };

  const handleMaxIterationsChange = (value: number) => {
    setModelConfig(selectedProviderId, selectedModelId, {
      maxIterations: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Model Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Model</label>
        <select
          value={selectedModelId}
          onChange={(e) => {
            // When model changes, load its config automatically
            setModel(e.target.value);
          }}
          className="w-full rounded border p-2"
        >
          {/* Model options */}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Default for {selectedProviderId}: {modelConfig.maxOutputTokens}t, {modelConfig.temperature}°, {modelConfig.maxIterations} iterations
        </p>
      </div>

      {/* Max Output Tokens */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Max Output Tokens</label>
          <span className="text-sm font-semibold">{modelConfig.maxOutputTokens}</span>
        </div>
        <input
          type="range"
          min="256"
          max="16384"
          step="256"
          value={modelConfig.maxOutputTokens}
          onChange={(e) => handleMaxOutputTokensChange(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Controls memory pruning via TokenLimiter processor. Lower values reduce rate limit risk.
          Recommended: Anthropic 8k, OpenAI 16k, Bedrock 4k-8k.
        </p>
      </div>

      {/* Temperature */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Temperature</label>
          <span className="text-sm font-semibold">{modelConfig.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={modelConfig.temperature}
          onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Controls response randomness. Lower (0.0-0.5) = more focused, Higher (0.8-2.0) = more creative.
          Recommended: 0.7 for balanced behavior.
        </p>
      </div>

      {/* Max Iterations */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Max Iterations</label>
          <span className="text-sm font-semibold">{modelConfig.maxIterations}</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={modelConfig.maxIterations}
          onChange={(e) => handleMaxIterationsChange(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum reasoning loops for multi-step investigations. Higher values allow deeper analysis
          but increase token usage. Recommended: 15 for general use, 10 for rate-limited providers.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-3 rounded text-sm mt-4">
        <p className="font-medium mb-1">Current Configuration</p>
        <ul className="text-xs space-y-1 text-gray-700">
          <li>Provider: <span className="font-semibold">{selectedProviderId}</span></li>
          <li>Model: <span className="font-semibold">{selectedModelId}</span></li>
          <li>Max Output: <span className="font-semibold">{modelConfig.maxOutputTokens}</span> tokens</li>
          <li>Temperature: <span className="font-semibold">{modelConfig.temperature}</span></li>
          <li>Max Iterations: <span className="font-semibold">{modelConfig.maxIterations}</span></li>
        </ul>
      </div>
    </div>
  );
}
```

---

## Implementation Checklist

- [ ] **Step 1**: Update `lib/stores/provider-store.ts`
  - [ ] Add `ModelConfig` interface
  - [ ] Add `modelConfigs` state
  - [ ] Implement `setModelConfig()` method
  - [ ] Implement `getModelConfig()` method
  - [ ] Implement `getActiveModelConfig()` method
  - [ ] Define DEFAULT_CONFIGS for each model type
  - [ ] Test localStorage persistence

- [ ] **Step 2**: Update `components/chat-interface.tsx`
  - [ ] Import `useProviderStore`
  - [ ] Call `getActiveModelConfig()` in submission handler
  - [ ] Add `modelConfig` to POST body
  - [ ] Display current model config in UI (optional badge)
  - [ ] Test that config is sent with requests

- [ ] **Step 3**: Update `app/api/chat/route.ts`
  - [ ] Add `modelConfig` to `ChatRequest` interface
  - [ ] Extract `modelConfig` from request body
  - [ ] Call `ProviderManager.configureProvider()` if needed
  - [ ] Set `maxTurns` from `modelConfig.maxIterations`
  - [ ] Apply model settings to agent config
  - [ ] Test that settings are used in Claude SDK call

- [ ] **Step 4**: Update `components/agent-config-tab.tsx`
  - [ ] Use new `setModelConfig()` methods
  - [ ] Connect sliders to localStorage updates
  - [ ] Display current model configuration
  - [ ] Show defaults and recommendations

- [ ] **Step 5**: Test end-to-end
  - [ ] Change temperature in settings → see it applied in chat
  - [ ] Change max iterations → see API use different maxTurns
  - [ ] Switch models → load correct defaults
  - [ ] Verify localStorage persistence across sessions
  - [ ] Test with both Anthropic and Bedrock providers

---

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Storage** | Only selected provider/model IDs | + Per-model configuration |
| **Request Body** | `{message, agent}` | `{message, agent, modelConfig}` |
| **Server Handling** | Ignores model selection | Applies config to Claude SDK |
| **Settings UI** | Configures but doesn't affect anything | Saves and applies to next chat |
| **User Control** | No per-model customization | Full control per model/provider |

---

## Testing Scenarios

### Scenario 1: Model-Specific Temperature
1. Switch to Claude Haiku (small model)
2. Set temperature to 0.2 (focused)
3. Send message
4. ✓ Server receives temperature: 0.2
5. ✓ Claude SDK applies focused behavior

### Scenario 2: Large Model Token Limit
1. Switch to Claude Opus
2. Set max output tokens to 8192
3. Send message
4. ✓ Server receives maxOutputTokens: 8192
5. ✓ TokenLimiter processor limits to 8192

### Scenario 3: Complex Investigation
1. Switch to Bedrock Claude
2. Set max iterations to 20 (for deep analysis)
3. Send multi-step question
4. ✓ Server sets maxTurns: 20
5. ✓ Agent can iterate up to 20 times

### Scenario 4: Session Persistence
1. Configure Model A with specific settings
2. Close browser / reload page
3. ✓ Settings still selected in localStorage
4. ✓ Chat uses those settings when sent

---

## FAQ

**Q: Will this break existing chats?**
A: No. Chat requests without `modelConfig` will use server defaults (current behavior).

**Q: Can users switch models mid-conversation?**
A: Yes, but settings apply to next message only. Previous messages use their original settings.

**Q: Does temperature actually get applied?**
A: Currently the Claude SDK doesn't expose a direct temperature parameter. Workaround: modify system prompt with temperature guidance in `getSystemPromptWithTemperature()` helper.

**Q: What if provider credentials change?**
A: Settings are per-provider, so switching providers loads their defaults until customized.

**Q: How do I handle AWS Bedrock model IDs?**
A: They're different format (`global.anthropic.claude-sonnet...`). The `getDefaultConfig()` function uses fuzzy matching on model name patterns.

---

## Related Documents

- `THIRD_PARTY_PROVIDER_INTEGRATION.md` - Provider setup for Bedrock/Vertex
- `MODEL_CONFIGURATION_ANALYSIS.md` - Deep dive into config system architecture
- `SETTINGS_IMPLEMENTATION_GUIDE.md` - Original settings implementation notes
