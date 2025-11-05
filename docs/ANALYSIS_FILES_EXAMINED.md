# Files Examined During Configuration System Analysis

This document lists all the files reviewed and their relationships in the analysis.

## Core Configuration Files (Primary Sources)

### Client-Side Configuration
1. **/lib/stores/provider-store.ts** (148 lines)
   - Zustand store managing selected provider and model
   - Persists to localStorage: `omni-ai-provider-storage`
   - Functions: setModel, setProvider, getAvailableModels, getAllModels

2. **/lib/stores/agent-config-store.ts** (190 lines)
   - Zustand store managing agent settings (tokens, temp, iterations)
   - Persists to localStorage: `omni-ai-agent-config-storage`
   - Key format: `providerId:modelId`
   - Default configs per provider defined here

3. **/lib/config/provider-config.ts** (215+ lines)
   - Static provider and model metadata (client-safe)
   - Exports: PROVIDERS, MODELS, helper functions
   - Defines models for: OpenAI, Anthropic, Azure, AWS, GCP

4. **/lib/stores/agent-store.ts** (Not fully examined)
   - Manages selected agent (datadog/correlator/smart)
   - Referenced in chat-header.tsx for agent selection

5. **/lib/stores/extraction-settings-store.ts** (49 lines)
   - Manages LLM extraction settings (enable/disable)
   - Simpler store, similar to agent-config pattern

### Server-Side Configuration
6. **/lib/config/server-provider-config.ts** (178 lines)
   - Environment-based provider configuration
   - Selected via process.env.SELECTED_PROVIDER
   - Returns: ProviderConfig with API keys and gateway URLs
   - Functions for validation and provider listing

7. **/lib/agents/subagent-configs.ts** (296 lines)
   - Sub-agent system prompts (static)
   - Exports: subAgentConfigs for 3 agents
   - Each agent has description and MCP tools list
   - Includes hallucination reduction and visualization hints

---

## UI Components

### Settings Components
8. **/components/settings-panel.tsx** (294 lines)
   - Main settings view in activity bar
   - Tabs: Provider/Model, Agent Config, Data Extraction
   - Reads from /api/provider endpoint
   - Provider tab is read-only, shows instructions for changing

9. **/components/agent-config-tab.tsx** (331 lines)
   - Configurable sliders for max tokens, temperature, iterations
   - Provider/model selector for configuration
   - Save/Reset buttons
   - Fetches current values from useAgentConfigStore
   - Shows defaults for selected provider

10. **/components/extraction-settings-tab.tsx** (189 lines)
    - LLM extraction toggle
    - Reads/writes to useExtractionSettingsStore
    - Simple pattern-based vs LLM fallback explanation

### Chat Components
11. **/components/chat-header.tsx** (159 lines)
    - Agent selector dropdown
    - Model selector dropdown (grouped by provider)
    - Filters models to show only from configured providers
    - Uses useProviderStore for model selection
    - Uses useAgentStore for agent selection

---

## API Routes

12. **/app/api/chat/route.ts** (220+ lines)
    - Main chat endpoint
    - Uses Claude Agent SDK query() function
    - Request: message, agent, threadId, resourceId
    - MISSING: modelConfig in request
    - Creates agent with hardcoded settings (maxTurns: 10)
    - System prompt varies by agent type

13. **/app/api/provider/route.ts** (49 lines)
    - GET endpoint returning provider configuration
    - Used by settings panel and chat header
    - Returns: current provider, available providers, validation

### Other API Routes (Not Fully Examined)
14. **/app/api/sessions/route.ts** - Session management
15. **/app/api/conversations/** - Conversation management
16. **/app/api/extract/route.ts** - Data extraction endpoint

---

## Related Files (References)

17. **/lib/session/simple-session-store.ts** (Referenced in chat/route.ts)
18. **/lib/mcp/claude-sdk-mcp-config.ts** (Referenced in chat/route.ts)
19. **/lib/agents/hallucination-reduction.ts** (Referenced in subagent-configs)
20. **/lib/agents/standardized-response-format.ts** (Referenced in subagent-configs)
21. **/lib/agents/visualization-hints.ts** (Referenced in subagent-configs)

---

## Total Coverage

Files Examined in Detail: 13
Files Referenced: 8
Total Configuration System Footprint: ~2,000 lines of code

---

## Key Relationships

```
useProviderStore (selected model)
    ↓
    Used by: chat-header.tsx, agent-config-tab.tsx
    Persisted to: localStorage
    Used in API: ❌ NOT PASSED TO SERVER

useAgentConfigStore (token/temp/iteration settings)
    ↓
    Used by: agent-config-tab.tsx
    Persisted to: localStorage
    Used in API: ❌ NOT PASSED TO SERVER

/lib/config/provider-config.ts (model list)
    ↓
    Used by: provider-store.ts, chat-header.tsx, agent-config-tab.tsx
    Status: Working correctly

/lib/config/server-provider-config.ts (server auth)
    ↓
    Used by: /app/api/chat/route.ts, /app/api/provider/route.ts
    Status: Works but ignores client selection

/app/api/chat/route.ts (main endpoint)
    ↓
    Uses: server-provider-config.ts
    Passes to SDK: maxTurns (hardcoded), systemPrompt, agents
    Missing: temperature, maxOutputTokens, selectedModelId

subAgentConfigs (agent prompts)
    ↓
    Used by: /app/api/chat/route.ts
    Status: Working correctly
```

---

## Analysis Documents Created

1. **MODEL_CONFIGURATION_ANALYSIS.md**
   - Comprehensive 600+ line analysis
   - Architecture diagrams
   - Data flow complete picture
   - Gap analysis

2. **MODEL_CONFIG_QUICK_REFERENCE.md**
   - Quick lookup tables
   - File overview matrix
   - Configuration flow matrix
   - Format specifications

3. **SETTINGS_IMPLEMENTATION_GUIDE.md**
   - Problem statement
   - Step-by-step solution
   - Code examples
   - Implementation checklist
   - Testing strategy

---

## How to Use This Analysis

1. **For Architecture Understanding**: Read MODEL_CONFIGURATION_ANALYSIS.md
2. **For Quick Lookups**: Refer to MODEL_CONFIG_QUICK_REFERENCE.md
3. **For Implementation**: Follow SETTINGS_IMPLEMENTATION_GUIDE.md
4. **For File Details**: Check sections below and examine individual files

---

## File Size Summary

| Category | Files | Lines |
|----------|-------|-------|
| Stores | 5 | ~850 |
| Config | 2 | ~400 |
| Components | 3 | ~800 |
| API Routes | 2 | ~270 |
| **Total** | **12** | **~2,320** |

---

## Code Examples from Each File

### Provider Store
```typescript
const { selectedProviderId, selectedModelId, setModel } = useProviderStore()
// Provides: selected model information, setters, getters
```

### Agent Config Store
```typescript
const config = useAgentConfigStore.getState().getConfig(providerId, modelId)
// Returns: { maxOutputTokens, temperature, maxIterations }
```

### Provider Config
```typescript
export const MODELS: Record<string, ModelConfig[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-5-20250929', name: '...', maxTokens: 200000 }
  ]
}
```

### Chat API
```typescript
// Current - broken
const result = query({
  prompt: message,
  options: { maxTurns: 10 } // Hardcoded!
});

// Required - fixed
const result = query({
  prompt: message,
  options: {
    maxTurns: modelConfig.maxIterations,
    temperature: modelConfig.temperature,
    maxOutputTokens: modelConfig.maxOutputTokens
  }
});
```

---

## Next Steps

1. Read MODEL_CONFIGURATION_ANALYSIS.md for full context
2. Review SETTINGS_IMPLEMENTATION_GUIDE.md for implementation plan
3. Implement changes to /app/api/chat/route.ts first
4. Then update chat component to send modelConfig
5. Test each change individually
6. Document any new findings

