# WS10: Enterprise OAuth2 Gateway & Multi-LLM Support

**Status**: Not Started
**Duration**: 2-3 days
**Dependencies**: WS9 complete
**Priority**: P1 (HIGH)

---

## Objective

Enable multi-LLM support (Azure, AWS Bedrock, GCP Vertex) via enterprise OAuth2 gateway using Claude SDK's `ANTHROPIC_BASE_URL` configuration.

---

## Context

**No Runtime Switching**: Claude SDK requires restart to change providers (acceptable for bundled local app).

**Gateway Architecture**:
```
omni-ai → ANTHROPIC_BASE_URL → Enterprise Gateway → Azure/AWS/GCP
```

Enterprise gateway:
- Accepts Anthropic API format
- Handles OAuth2 token refresh
- Routes to correct LLM provider
- Returns Anthropic-compatible responses

---

## Tasks

### Task 1: Configure ANTHROPIC_BASE_URL (1 day)

**Environment Variables**:

```bash
# .env.local

# Standard Anthropic (default)
ANTHROPIC_API_KEY=sk-ant-...

# Azure via Gateway
AZURE_GATEWAY_URL=https://enterprise-gateway.company.com/azure
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...

# AWS Bedrock via Gateway
AWS_GATEWAY_URL=https://enterprise-gateway.company.com/aws
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# GCP Vertex via Gateway
GCP_GATEWAY_URL=https://enterprise-gateway.company.com/gcp
GCP_PROJECT_ID=...
GCP_SERVICE_ACCOUNT_KEY=...
```

**Provider Selection**:
```typescript
// lib/config/provider-config.ts
export const getProviderConfig = () => {
  const provider = process.env.SELECTED_PROVIDER || 'anthropic';

  switch (provider) {
    case 'azure':
      return {
        baseURL: process.env.AZURE_GATEWAY_URL,
        apiKey: process.env.AZURE_CLIENT_SECRET
      };
    case 'aws':
      return {
        baseURL: process.env.AWS_GATEWAY_URL,
        apiKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    case 'gcp':
      return {
        baseURL: process.env.GCP_GATEWAY_URL,
        apiKey: process.env.GCP_SERVICE_ACCOUNT_KEY
      };
    default:
      return {
        baseURL: undefined, // Use default Anthropic
        apiKey: process.env.ANTHROPIC_API_KEY
      };
  }
};
```

**Validation**:
- [ ] Environment variables load correctly
- [ ] Provider selection works
- [ ] Base URL configured correctly

---

### Task 2: Update Settings UI (1 day)

**Remove Runtime Switching**:
```typescript
// components/settings-panel.tsx

// Before: Runtime switching dropdown
// After: Display current provider + restart instructions

<div className="space-y-4">
  <div>
    <label>Current Provider</label>
    <div className="text-sm text-muted-foreground">
      {currentProvider}
    </div>
  </div>

  <Alert>
    <AlertDescription>
      To change providers, update SELECTED_PROVIDER in .env.local and restart the application.
    </AlertDescription>
  </Alert>

  <div>
    <label>Available Providers</label>
    <ul className="text-sm space-y-1">
      <li>✓ Anthropic (default)</li>
      <li>✓ Azure OpenAI (via gateway)</li>
      <li>✓ AWS Bedrock (via gateway)</li>
      <li>✓ GCP Vertex AI (via gateway)</li>
    </ul>
  </div>
</div>
```

**Validation**:
- [ ] Settings panel shows current provider
- [ ] Restart instructions clear
- [ ] Available providers listed

---

### Task 3: Test with Enterprise Gateway (1 day)

**Test Script**:
```typescript
// temp-test-ws10-gateway.ts
import { queryAgent } from './lib/claude-sdk/query-wrapper';

async function testGateway() {
  console.log('Testing with gateway:', process.env.ANTHROPIC_BASE_URL);

  const result = await queryAgent(
    'What is 2+2?', // Simple query
    { maxTurns: 1 }
  );

  console.log('Result:', result.finalMessage);
}

testGateway().catch(console.error);
```

**Validation**:
- [ ] Azure gateway works
- [ ] AWS gateway works
- [ ] GCP gateway works
- [ ] Responses match Anthropic format

---

## Success Criteria

**Must Have**:
- ✅ ANTHROPIC_BASE_URL configuration works
- ✅ Can use Azure/AWS/GCP via gateway
- ✅ Settings UI updated (no runtime switching)
- ✅ Gateway tested end-to-end

**Nice to Have**:
- ✅ Gateway health checks
- ✅ Failover support
- ✅ Provider usage analytics

---

## References

- Gateway Documentation: (enterprise-specific)
- Claude SDK Environment Variables: https://docs.claude.com/en/api/agent-sdk/typescript
