# AWS Bedrock Model Switching at Chat Level

**Quick Guide**: Enable model selection and per-model settings with AWS Bedrock support.

---

## What Users Will See

### Settings Panel
```
┌─────────────────────────────────────────┐
│ Agent Configuration                      │
├─────────────────────────────────────────┤
│                                         │
│ Select Provider/Model to Configure      │
│ ┌─────────────────────────────────────┐ │
│ │ AWS Bedrock - Claude 3.5 Sonnet   ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⓘ Default for bedrock: 4,096 tokens,   │
│   temp 0.7, max 15 iterations          │
│                                         │
│ Max Output Tokens          4096         │
│ ├─────●─────────────────────────────┤  │
│ Lower = reduce rate limit risk          │
│                                         │
│ Temperature                0.7          │
│ ├──────────────●──────────────────────┤ │
│ 0.0-0.5 = focused, 0.8-2.0 = creative  │
│                                         │
│ Max Iterations             15           │
│ ├──────────────────────●────────────────┤ │
│ Deeper analysis = more tokens           │
│                                         │
│ Current Configuration                   │
│ Provider: AWS Bedrock                   │
│ Model: claude-3-5-sonnet               │
│ Max Output: 4096 tokens                │
│ Temperature: 0.7                        │
│ Max Iterations: 15                      │
│                                         │
└─────────────────────────────────────────┘
```

### Chat Interface
```
┌─────────────────────────────────────────┐
│ Agent Selection: Smart Agent            │
│ Model: claude-3-5-sonnet (4096t, 0.7°) │
├─────────────────────────────────────────┤
│                                         │
│ [Assistant]: What can I help you with?  │
│                                         │
│ [User Input Box]                        │
│ claude-3-5-sonnet (4096t, 0.7°) | Send │
│                                         │
└─────────────────────────────────────────┘
```

---

## Complete Data Flow with Bedrock

### Scenario: User switches to Bedrock Opus and adjusts settings

#### Step 1: User Configures in Settings
```typescript
// User actions in Agent Configuration tab:
1. Select dropdown "AWS Bedrock - Claude 3.5 Sonnet"
   → selectedProviderId = "bedrock"
   → selectedModelId = "claude-3-5-sonnet"

2. Adjust Max Output Tokens slider to 8192
   → modelConfigs["bedrock"]["claude-3-5-sonnet"].maxOutputTokens = 8192

3. Adjust Temperature slider to 0.5
   → modelConfigs["bedrock"]["claude-3-5-sonnet"].temperature = 0.5

// All saved to localStorage
```

**localStorage result**:
```json
{
  "omni-ai-provider-storage": {
    "selectedProviderId": "bedrock",
    "selectedModelId": "claude-3-5-sonnet",
    "modelConfigs": {
      "bedrock": {
        "claude-3-5-sonnet": {
          "maxOutputTokens": 8192,
          "temperature": 0.5,
          "maxIterations": 15
        }
      }
    }
  }
}
```

#### Step 2: User Sends Message in Chat

**Chat Component Action**:
```typescript
// user types message and clicks Send

// Get current config from store
const modelConfig = useProviderStore().getActiveModelConfig();
// Returns: {maxOutputTokens: 8192, temperature: 0.5, maxIterations: 15}

// Send to server
POST /api/chat {
  message: "Why are payment latencies spiking?",
  agent: "datadog",  // User selected DataDog Champion agent
  providerId: "bedrock",
  modelId: "claude-3-5-sonnet",
  modelConfig: {
    providerId: "bedrock",
    modelId: "claude-3-5-sonnet",
    maxOutputTokens: 8192,
    temperature: 0.5,
    maxIterations: 15
  }
}
```

#### Step 3: Server Configures Bedrock

**Chat Route Handler** (`/api/chat`):
```typescript
// Receive request with modelConfig
const { modelConfig, agent } = body;

// Step 1: Configure provider (Bedrock)
ProviderManager.configureProvider(modelConfig.providerId);
// Sets: process.env.CLAUDE_CODE_USE_BEDROCK = '1'

// Step 2: Get agent configuration
const agentConfig = getAgentConfig(agent);

// Step 3: Apply model settings
agentConfig.maxIterations = modelConfig.maxIterations;  // 15
agentConfig.modelSettings = {
  maxOutputTokens: 8192,      // Limit response tokens
  temperature: 0.5             // More focused responses
};

// Step 4: Call Claude Agent SDK with settings
const result = query({
  prompt: message,
  options: {
    systemPrompt: agentConfig.systemPrompt,
    agents: agentConfig.agents,
    mcpServers,
    maxTurns: 15,  // From modelConfig.maxIterations
    // temperature applied via system prompt modification
  }
});

// Claude Agent SDK:
// - Detects CLAUDE_CODE_USE_BEDROCK=1
// - Uses AWS Bedrock endpoint
// - Calls Claude 3.5 Sonnet via Bedrock
// - Respects maxTurns=15
// - Returns 8192 tokens max
```

#### Step 4: Stream Response Back to Chat

```typescript
// Stream events with metadata
data: {type: "thinking", content: "..."}
data: {type: "tool_use", toolName: "mcp__omni-api__build_query", ...}
data: {type: "tool_result", content: "..."}
data: {type: "text", content: "The payment latency spike is caused by..."}
data: {type: "session", sessionId: "...", config: {...}}
```

---

## Bedrock Model IDs

When using AWS Bedrock, model IDs are different from direct Anthropic API:

### Bedrock Model Name Mapping

| Anthropic API | Bedrock Global | Bedrock Regional |
|---------------|----------------|------------------|
| `claude-3-5-sonnet-20241022` | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | `us.anthropic.claude-sonnet...` |
| `claude-3-opus-20240229` | `global.anthropic.claude-opus-4-1-20250514-v1:0` | `us.anthropic.claude-opus...` |
| `claude-3-haiku-20240307` | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | `us.anthropic.claude-haiku...` |

**In Provider Store**:
```typescript
// User sees friendly names
selectedModelId: "claude-3-5-sonnet"

// When sent to Bedrock, map to full ID
const bedrockModelId = mapToBedrockId(selectedModelId);
// Returns: "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
```

**Implementation in chat route**:
```typescript
function mapToBedrockId(modelId: string): string {
  if (modelId.includes('sonnet')) {
    return 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';
  }
  if (modelId.includes('opus')) {
    return 'global.anthropic.claude-opus-4-1-20250514-v1:0';
  }
  if (modelId.includes('haiku')) {
    return 'global.anthropic.claude-haiku-4-5-20251001-v1:0';
  }
  return 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';  // default
}
```

---

## Bedrock Setup (Prerequisites)

### AWS Account Setup

```bash
# 1. Enable Bedrock in AWS Console
# https://console.aws.amazon.com/bedrock

# 2. Request model access (one-time)
# - Go to Model Catalog
# - Click "Manage model access"
# - Enable Claude Sonnet, Opus, Haiku

# 3. Configure AWS credentials (development)
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...

# 4. Verify access
aws bedrock list-inference-profiles --region us-east-1
```

### Omni-AI Environment Setup

```bash
# .env.local
SELECTED_PROVIDER=bedrock  # Or dynamically set in request
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream"
    ],
    "Resource": "arn:aws:bedrock:*:*:foundation-model/*"
  }]
}
```

---

## Testing Checklist

### ✅ Local Development Testing

- [ ] **Model Selection**
  - [ ] Settings panel shows Bedrock models
  - [ ] Selecting model persists to localStorage
  - [ ] Chat header displays selected model name

- [ ] **Settings Configuration**
  - [ ] Can adjust Max Output Tokens slider
  - [ ] Can adjust Temperature slider
  - [ ] Can adjust Max Iterations slider
  - [ ] Changes persist in localStorage
  - [ ] Changes show in "Current Configuration" summary

- [ ] **Chat Integration**
  - [ ] Send message includes modelConfig in body
  - [ ] Server logs received modelConfig
  - [ ] Claude Agent SDK called with maxTurns from config
  - [ ] Bedrock receives request (check AWS CloudTrail)
  - [ ] Response respects token limit

- [ ] **Provider Switching**
  - [ ] Switch from Anthropic to Bedrock in settings
  - [ ] Send message → uses Bedrock
  - [ ] Switch back to Anthropic
  - [ ] Send message → uses Anthropic API

- [ ] **Session Persistence**
  - [ ] Close browser / refresh page
  - [ ] Model selection and settings are restored
  - [ ] Correct model config used in next chat

### ✅ Production Testing

- [ ] Deploy with Bedrock credentials in environment
- [ ] Monitor CloudTrail for InvokeModel calls
- [ ] Verify token usage matches configuration
- [ ] Monitor costs in AWS Billing Console
- [ ] Test with real multi-step investigations

---

## File Changes Summary

```
lib/stores/provider-store.ts
  + ModelConfig interface
  + modelConfigs state
  + setModelConfig() method
  + getModelConfig() method
  + getActiveModelConfig() method

components/chat-interface.tsx
  + Import useProviderStore
  + Extract modelConfig in submission
  + Send modelConfig in POST body
  + Display config badge in UI

app/api/chat/route.ts
  + ChatRequest accepts modelConfig
  + Call ProviderManager.configureProvider()
  + Set maxTurns from modelConfig
  + Apply model settings to agent config

components/agent-config-tab.tsx
  + Connect sliders to setModelConfig()
  + Display current configuration
  + Show model-specific defaults
```

---

## Cost Optimization Tips

### Bedrock vs Direct API
- Both charge ~$3 per million input tokens
- Bedrock benefits: consolidated AWS billing, VPC endpoints, audit logging
- Direct API benefits: simpler setup, no AWS account needed

### Token Limits Strategy
- **Haiku**: 2000 tokens (fast, cheap, exploration)
- **Sonnet**: 4096-8192 tokens (balanced, most common)
- **Opus**: 8192+ tokens (powerful, for complex analysis)

### Temperature Tuning
- **Investigations**: 0.5 (focused, deterministic)
- **Explorations**: 0.7 (balanced)
- **Creative tasks**: 0.9-1.0 (varied)

### Iteration Limits
- **Simple queries**: 10 iterations (API, cheap)
- **Medium investigations**: 15 iterations (default)
- **Deep analysis**: 20 iterations (Bedrock, AWS billing)

---

## Troubleshooting

### Issue: Model dropdown shows only Anthropic models
**Solution**: Verify `CLAUDE_CODE_USE_BEDROCK=1` is set and AWS credentials configured

### Issue: Settings changes don't apply to chat
**Solution**: Verify chat component is calling `getActiveModelConfig()` and sending in request body

### Issue: "Invalid model ID" error from Bedrock
**Solution**: Check that model ID mapping in `mapToBedrockId()` matches Bedrock's current model IDs

### Issue: Rate limit errors from Bedrock
**Solution**: Reduce Max Output Tokens or Max Iterations in settings

### Issue: AWS credentials not found
**Solution**: Ensure AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env.local

---

## Related Documents

1. **IMPLEMENT_PER_MODEL_SETTINGS.md** - Detailed implementation guide
2. **THIRD_PARTY_PROVIDER_INTEGRATION.md** - Provider setup and configuration
3. **MODEL_CONFIGURATION_ANALYSIS.md** - Deep architecture analysis

---

## Next Steps

1. Implement `lib/stores/provider-store.ts` changes
2. Update `components/chat-interface.tsx` to send modelConfig
3. Update `/api/chat` route handler to apply settings
4. Update settings UI to use new methods
5. Test end-to-end with Bedrock
6. Deploy with Bedrock credentials in production
