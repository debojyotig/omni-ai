# Provider Configuration Guide

**WS10: Enterprise Gateway & Multi-LLM Support**

This guide explains how to configure omni-ai to use different LLM providers via enterprise OAuth2 gateways.

---

## Architecture

```
omni-ai → ANTHROPIC_BASE_URL → Enterprise Gateway → Azure/AWS/GCP
```

**Key Concepts**:

1. **Provider Selection**: Set once in `.env.local`, requires restart to change
2. **Enterprise Gateway**: Handles OAuth2 authentication and routes to correct LLM
3. **Anthropic-Compatible API**: All providers return responses in Anthropic format
4. **Claude Agent SDK**: Uses `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` environment variables

---

## Quick Start

### 1. Choose Your Provider

Edit `.env.local` and set `SELECTED_PROVIDER`:

```bash
# Options: anthropic, azure, aws, gcp
SELECTED_PROVIDER=anthropic
```

### 2. Configure Provider Credentials

Add the required environment variables for your chosen provider (see sections below).

### 3. Restart the Application

```bash
npm run dev
```

### 4. Verify Configuration

1. Open http://localhost:3000
2. Click **Settings** in the Activity Bar
3. Check **Provider & Model** tab
4. Verify provider shows as "Configured" with green checkmark

---

## Provider Configuration

### Option 1: Anthropic (Direct API)

**Use When**: You have direct Anthropic API access

**Configuration**:

```bash
# .env.local
SELECTED_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Features**:
- Direct access to Anthropic API
- No gateway required
- Fastest response times
- Full Claude model lineup

**Available Models**:
- `claude-sonnet-4-5-20250929` (Latest)
- `claude-opus-4-1-20250805`
- `claude-haiku-4-5-20251001`
- `claude-3-7-sonnet-20250219`
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

---

### Option 2: Azure OpenAI (via Enterprise Gateway)

**Use When**: Your organization uses Azure OpenAI with OAuth2 gateway

**Configuration**:

```bash
# .env.local
SELECTED_PROVIDER=azure
AZURE_GATEWAY_URL=https://enterprise-gateway.company.com/azure
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
```

**Gateway Requirements**:
- Must accept Anthropic API request format
- Must handle Azure OAuth2 token refresh
- Must return Anthropic-compatible responses
- Must route to Azure OpenAI Claude models

**Available Models** (via gateway):
- `claude-sonnet-4-5-20250929`
- `claude-opus-4-1-20250805`
- `claude-haiku-4-5-20251001`

**Validation**:

```bash
# Test gateway health
curl -H "Authorization: Bearer $AZURE_CLIENT_SECRET" \
     $AZURE_GATEWAY_URL/health
```

---

### Option 3: AWS Bedrock (via Enterprise Gateway)

**Use When**: Your organization uses AWS Bedrock with OAuth2 gateway

**Configuration**:

```bash
# .env.local
SELECTED_PROVIDER=aws
AWS_GATEWAY_URL=https://enterprise-gateway.company.com/aws
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

**Gateway Requirements**:
- Must accept Anthropic API request format
- Must handle AWS credentials (IAM or STS tokens)
- Must return Anthropic-compatible responses
- Must route to AWS Bedrock Claude models

**Available Models** (via gateway):
- `claude-sonnet-4-5-20250929`
- `claude-opus-4-1-20250805`
- `claude-haiku-4-5-20251001`

**Validation**:

```bash
# Test gateway health
curl -H "Authorization: Bearer $AWS_SECRET_ACCESS_KEY" \
     $AWS_GATEWAY_URL/health
```

---

### Option 4: GCP Vertex AI (via Enterprise Gateway)

**Use When**: Your organization uses GCP Vertex AI with OAuth2 gateway

**Configuration**:

```bash
# .env.local
SELECTED_PROVIDER=gcp
GCP_GATEWAY_URL=https://enterprise-gateway.company.com/gcp
GCP_PROJECT_ID=your-gcp-project-id
GCP_SERVICE_ACCOUNT_KEY=your-service-account-key-json
```

**Gateway Requirements**:
- Must accept Anthropic API request format
- Must handle GCP service account authentication
- Must return Anthropic-compatible responses
- Must route to GCP Vertex AI Claude models

**Available Models** (via gateway):
- `claude-sonnet-4-5-20250929`
- `claude-opus-4-1-20250805`
- `claude-haiku-4-5-20251001`

**Validation**:

```bash
# Test gateway health
curl -H "Authorization: Bearer $GCP_SERVICE_ACCOUNT_KEY" \
     $GCP_GATEWAY_URL/health
```

---

## How It Works

### Provider Selection Flow

1. **Startup**: omni-ai reads `SELECTED_PROVIDER` from `.env.local`
2. **Configuration**: `getProviderConfig()` returns correct `baseURL` and `apiKey`
3. **API Route**: Chat API sets `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL`
4. **Claude SDK**: SDK reads environment variables and routes requests
5. **Gateway**: Enterprise gateway handles authentication and forwards to LLM

### Environment Variable Mapping

| Provider   | `ANTHROPIC_BASE_URL`                    | `ANTHROPIC_API_KEY`          |
|------------|-----------------------------------------|------------------------------|
| anthropic  | `undefined` (default)                   | `ANTHROPIC_API_KEY`          |
| azure      | `AZURE_GATEWAY_URL`                     | `AZURE_CLIENT_SECRET`        |
| aws        | `AWS_GATEWAY_URL`                       | `AWS_SECRET_ACCESS_KEY`      |
| gcp        | `GCP_GATEWAY_URL`                       | `GCP_SERVICE_ACCOUNT_KEY`    |

---

## Enterprise Gateway Setup

### Gateway Requirements

Your enterprise gateway must:

1. **Accept Anthropic API Format**:
   ```
   POST /v1/messages
   Content-Type: application/json
   X-API-Key: <api-key>

   { "model": "claude-sonnet-4-5-20250929", ... }
   ```

2. **Handle OAuth2 Authentication**:
   - Accept API key in headers
   - Refresh tokens automatically
   - Handle token expiration

3. **Route to Correct LLM**:
   - Azure: Forward to Azure OpenAI endpoint
   - AWS: Forward to AWS Bedrock
   - GCP: Forward to GCP Vertex AI

4. **Return Anthropic-Compatible Responses**:
   ```json
   {
     "id": "msg_123",
     "type": "message",
     "role": "assistant",
     "content": [{ "type": "text", "text": "..." }],
     "model": "claude-sonnet-4-5-20250929",
     "stop_reason": "end_turn"
   }
   ```

### Example Gateway Configuration

**Nginx Reverse Proxy**:

```nginx
server {
    listen 443 ssl;
    server_name enterprise-gateway.company.com;

    location /azure {
        proxy_pass https://your-azure-endpoint.openai.azure.com;
        proxy_set_header Authorization "Bearer $http_x_api_key";
    }

    location /aws {
        proxy_pass https://bedrock-runtime.us-east-1.amazonaws.com;
        proxy_set_header Authorization "AWS4-HMAC-SHA256 ...";
    }

    location /gcp {
        proxy_pass https://us-central1-aiplatform.googleapis.com;
        proxy_set_header Authorization "Bearer $http_x_api_key";
    }
}
```

---

## Troubleshooting

### Provider Not Configured

**Symptom**: Settings shows "Not configured" for provider

**Solution**:
1. Check `.env.local` has correct environment variables
2. Restart application: `npm run dev`
3. Verify in Settings → Provider & Model tab

### Authentication Errors

**Symptom**: 401 Unauthorized errors in console

**Solution**:
1. Verify API keys are correct in `.env.local`
2. Check gateway health endpoint
3. Test gateway authentication with curl
4. Review gateway logs for errors

### Gateway Timeout

**Symptom**: Requests hang or timeout

**Solution**:
1. Check gateway is reachable: `curl $AZURE_GATEWAY_URL/health`
2. Verify firewall rules allow outbound traffic
3. Check gateway response time with curl `-w "@curl-format.txt"`
4. Review gateway resource limits

### Model Not Available

**Symptom**: "Model not found" error

**Solution**:
1. Verify model name matches provider's supported models
2. Check gateway supports requested model
3. Review provider's model availability by region

---

## Testing Provider Configuration

### 1. Verify Environment Variables

```bash
# Check .env.local is loaded
node -e "console.log(process.env.SELECTED_PROVIDER)"
# Should output: anthropic, azure, aws, or gcp
```

### 2. Test Provider API

```bash
# Test current provider configuration
npm run dev

# In browser:
# 1. Navigate to http://localhost:3000
# 2. Click Settings
# 3. Check Provider & Model tab
# 4. Verify green checkmark for current provider
```

### 3. Test Chat Functionality

```bash
# Send test query
# In chat interface:
"What is 2+2?"

# Check console for:
# [CHAT] Using gateway: <gateway-url> (if using gateway)
# [CHAT] Using direct Anthropic API (if using anthropic)
```

---

## Best Practices

### Security

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Rotate credentials regularly** - Update gateway keys monthly
3. **Use environment-specific gateways** - Separate dev/staging/prod
4. **Monitor gateway access** - Review logs for unauthorized attempts

### Performance

1. **Use regional gateways** - Minimize latency
2. **Enable caching** - Gateway should cache responses when appropriate
3. **Monitor rate limits** - Track API usage per provider

### Reliability

1. **Health checks** - Implement `/health` endpoint on gateway
2. **Failover** - Configure backup provider in gateway
3. **Logging** - Enable detailed logging for debugging

---

## API Reference

### Server-Side Functions

#### `getProviderConfig()`

Returns provider configuration based on `SELECTED_PROVIDER`.

```typescript
import { getProviderConfig } from '@/lib/config/server-provider-config';

const config = getProviderConfig();
// { provider: 'anthropic', baseURL: undefined, apiKey: '...', models: [...] }
```

#### `getAnthropicConfig()`

Returns configuration for Claude Agent SDK.

```typescript
import { getAnthropicConfig } from '@/lib/config/server-provider-config';

const config = getAnthropicConfig();
// { apiKey: '...', baseURL: 'https://...' }
```

#### `getCurrentProviderName()`

Returns human-readable provider name.

```typescript
import { getCurrentProviderName } from '@/lib/config/server-provider-config';

const name = getCurrentProviderName();
// 'Anthropic (Direct)' or 'Azure OpenAI (via Gateway)'
```

#### `validateProviderConfig()`

Validates current provider configuration.

```typescript
import { validateProviderConfig } from '@/lib/config/server-provider-config';

const result = validateProviderConfig();
// { valid: true, errors: [] }
```

### Client-Side API

#### `GET /api/provider`

Returns current provider configuration.

**Response**:
```json
{
  "current": {
    "id": "anthropic",
    "name": "Anthropic (Direct)",
    "models": ["claude-sonnet-4-5-20250929", ...],
    "valid": true
  },
  "available": [
    { "id": "anthropic", "name": "Anthropic (Direct)", "configured": true },
    { "id": "azure", "name": "Azure OpenAI (via Gateway)", "configured": false },
    ...
  ],
  "validation": {
    "valid": true,
    "errors": []
  },
  "message": "Provider configured correctly"
}
```

---

## Migration from Mastra Provider System

**Old System** (Mastra-based, runtime switching):
- Provider selection in UI dropdown
- Runtime switching without restart
- Mastra provider classes

**New System** (Claude SDK, restart required):
- Provider selection in `.env.local`
- Restart required to change provider
- Claude SDK environment variables

**Migration Steps**:

1. **Remove old provider selection** from UI (already done in WS10)
2. **Set `SELECTED_PROVIDER`** in `.env.local`
3. **Configure gateway URLs** (if using Azure/AWS/GCP)
4. **Restart application**
5. **Verify in Settings** that provider is configured

---

## Support

**Questions?**
- Check [CHECKPOINT.md](../.claude-code/CHECKPOINT.md) for current implementation status
- Review [WS10 Checkpoint](../.claude-code/checkpoints/checkpoint-ws10-enterprise-gateway.md) for detailed tasks

**Issues?**
- Verify `.env.local` configuration
- Check gateway health endpoint
- Review browser console for errors
- Test with curl commands in this guide
