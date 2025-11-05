# Configuration System Quick Reference

## Files Overview

| File | Purpose | Type | Client/Server | Current Status |
|------|---------|------|---------------|----------------|
| `/lib/config/provider-config.ts` | Model and provider metadata | Config | Both | ✓ Working |
| `/lib/stores/provider-store.ts` | Selected provider/model state | Store | Client | ✓ Working |
| `/lib/stores/agent-config-store.ts` | Agent settings (tokens, temp, iterations) | Store | Client | ⚠ Stored but not used |
| `/lib/config/server-provider-config.ts` | Server-side provider auth config | Config | Server | ✓ Working (env-based) |
| `/lib/agents/subagent-configs.ts` | Agent system prompts | Config | Server | ✓ Static prompts |
| `/components/settings-panel.tsx` | Settings UI (main view) | Component | Client | ✓ Working |
| `/components/agent-config-tab.tsx` | Agent config sliders UI | Component | Client | ⚠ UI works, not applied |
| `/components/chat-header.tsx` | Model/agent selectors | Component | Client | ✓ Working |
| `/app/api/chat/route.ts` | Main chat endpoint | API Route | Server | ⚠ Ignores model config |
| `/app/api/provider/route.ts` | Provider info endpoint | API Route | Server | ✓ Working |

## Configuration Flow Matrix

### Provider/Model Selection
```
User Action:        Select model in chat-header dropdown
Client Storage:     useProviderStore → localStorage
Server Usage:       ❌ NOT USED (uses process.env instead)
Applied To Agent:   ❌ NO (hardcoded to env provider)
Result:             Model selector visible but ignored
```

### Agent Settings (Max Output Tokens, Temperature, Max Iterations)
```
User Action:        Adjust sliders in agent-config-tab
Client Storage:     useAgentConfigStore → localStorage
Server Usage:       ❌ NOT ACCESSED
Applied To Agent:   ❌ NO (uses SDK defaults)
Result:             Settings saved but never used
```

### System Prompts
```
User Action:        Select agent in chat-header
Client Storage:     useAgentStore → localStorage
Server Usage:       ✓ READ (from subAgentConfigs)
Applied To Agent:   ✓ YES (passed to Claude SDK)
Result:             Agent selection works correctly
```

## Settings Storage Format

### localStorage Keys

```javascript
// Model/Provider Selection
{
  "omni-ai-provider-storage": {
    selectedProviderId: "anthropic",
    selectedModelId: "claude-sonnet-4-5-20250929"
  }
}

// Agent Configuration
{
  "omni-ai-agent-config-storage": {
    configs: {
      "anthropic:claude-sonnet-4-5-20250929": {
        providerId: "anthropic",
        modelId: "claude-sonnet-4-5-20250929",
        maxOutputTokens: 8192,
        temperature: 0.7,
        maxIterations: 15
      },
      "openai:gpt-4-turbo": {
        providerId: "openai",
        modelId: "gpt-4-turbo",
        maxOutputTokens: 16384,
        temperature: 0.7,
        maxIterations: 15
      }
    }
  }
}

// Agent Selection
{
  "omni-ai-agent-store": {
    selectedAgent: "smart"
  }
}
```

## Per-Provider Default Settings

### From `/lib/stores/agent-config-store.ts`

| Provider | Max Output Tokens | Temperature | Max Iterations |
|----------|-------------------|-------------|----------------|
| Anthropic | 4,096 | 0.7 | 15 |
| OpenAI | 16,384 | 0.7 | 15 |
| OAuth2 (Azure/AWS/GCP) | 4,096 | 0.7 | 10 |

## Request/Response Format

### Current /api/chat Request
```json
{
  "message": "string",
  "agent": "smart|datadog|correlator",
  "threadId": "string",
  "resourceId": "string"
}
```

### Required /api/chat Request (After Fix)
```json
{
  "message": "string",
  "agent": "smart|datadog|correlator",
  "threadId": "string",
  "resourceId": "string",
  "modelConfig": {
    "providerId": "anthropic|openai|azure-openai|aws-bedrock|gcp-vertex",
    "modelId": "model-id-string",
    "temperature": 0.0-2.0,
    "maxOutputTokens": 1024-100000,
    "maxIterations": 1-25
  }
}
```

## Model List Source

All models defined statically in `/lib/config/provider-config.ts`:

### Available Providers
- **openai**: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **anthropic**: Claude Sonnet 4.5, Claude Opus 4.1, Claude Haiku 4.5 (+ older versions)
- **azure-openai**: Azure-hosted GPT models
- **aws-bedrock**: Claude via AWS Bedrock
- **gcp-vertex**: Claude via GCP Vertex AI

### Model Metadata Fields
- `id`: Model identifier (e.g., "claude-sonnet-4-5-20250929")
- `name`: Display name (e.g., "Claude Sonnet 4.5 (Latest)")
- `provider`: Provider ID (e.g., "anthropic")
- `maxTokens`: Context window size (e.g., 200000)

## Current Gaps

### Gap 1: Model Selection Not Passed to Server
- ✓ UI allows selecting different models
- ✓ Selection stored in localStorage
- ❌ Server always uses `process.env.SELECTED_PROVIDER` (requires app restart to change)
- **Impact**: User can't switch models at runtime

### Gap 2: Agent Configuration Not Used
- ✓ UI allows configuring maxOutputTokens, temperature, maxIterations
- ✓ Settings stored per provider/model in localStorage
- ❌ Never sent to server or applied to agents
- ❌ Claude SDK uses its own defaults instead
- **Impact**: User settings are completely ignored

### Gap 3: Provider Config is Environment-Only
- ✓ Server can read provider from environment variable
- ❌ No runtime switching between providers
- ❌ Requires app restart to change
- **Impact**: Switching between Anthropic, OpenAI, Azure, etc. requires restart

## Implementation Checklist

To enable chat-level model switching with custom settings:

- [ ] Update `/app/api/chat/route.ts` to receive `modelConfig`
- [ ] Extract and use `modelConfig.providerId` to select API keys
- [ ] Pass `temperature` and `maxOutputTokens` to Claude SDK `query()` options
- [ ] Pass `maxIterations` to Claude SDK as `maxTurns`
- [ ] Update chat interface to read from stores and include `modelConfig` in request
- [ ] Update `/lib/config/server-provider-config.ts` with `getAnthropicConfigForProvider()`
- [ ] Test model switching during conversation
- [ ] Test settings application (tokens, temperature, iterations)
- [ ] Document the flow in code comments

