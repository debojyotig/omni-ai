# Third-Party Provider Integration for Omni-AI

**Research Document**: How to integrate Amazon Bedrock and Google Vertex AI into Omni-AI using Claude Agent SDK's native support.

**Key Finding**: Claude Agent SDK has **built-in native support** for both Amazon Bedrock and Google Vertex AI via simple environment variables.

---

## Executive Summary

Claude Agent SDK natively supports three provider pathways:

1. **Direct Anthropic API** (current default)
   - Environment: `ANTHROPIC_API_KEY`
   - No special setup needed

2. **Amazon Bedrock** (new)
   - Environment: `CLAUDE_CODE_USE_BEDROCK=1`
   - Requires: AWS credentials + IAM permissions
   - Models: Claude Sonnet, Opus, Haiku via AWS

3. **Google Vertex AI** (new)
   - Environment: `CLAUDE_CODE_USE_VERTEX=1`
   - Requires: GCP credentials + service account
   - Models: Claude models via Google Cloud

The SDK handles all authentication, API calls, and model routing internally.

---

## Current Architecture vs. Future

### Current State
```
Omni-AI (Next.js)
    ↓
Claude Agent SDK
    ↓
Anthropic API
```

**Provider Config**: `lib/config/server-provider-config.ts`
```typescript
SELECTED_PROVIDER = 'anthropic' | 'azure' | 'aws' | 'gcp'
// Only 'anthropic' is fully functional
```

**Limitation**: Custom providers (aws/gcp) are incomplete placeholders.

### Future State (After Integration)
```
Omni-AI (Next.js)
    ↓
Claude Agent SDK
    ├─→ Anthropic API (ANTHROPIC_API_KEY)
    ├─→ Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK=1)
    └─→ Google Vertex AI (CLAUDE_CODE_USE_VERTEX=1)
```

**All provider switching handled by SDK** based on environment variables.

---

## How Claude Agent SDK Native Support Works

### Amazon Bedrock

When `CLAUDE_CODE_USE_BEDROCK=1` is set:

1. SDK detects environment variable
2. Loads AWS credentials from default chain
3. Initializes Bedrock client
4. Routes all `query()` calls to Bedrock service
5. Returns responses in same format as Anthropic API

**Environment Variables Required**:
```bash
CLAUDE_CODE_USE_BEDROCK=1           # Enable Bedrock
AWS_REGION=us-east-1                # Required (not read from .aws config)
AWS_ACCESS_KEY_ID=...               # Option 1: Direct keys
AWS_SECRET_ACCESS_KEY=...           # Option 1: Direct keys
# OR
AWS_PROFILE=profile-name            # Option 2: AWS CLI profile
# OR
AWS_BEARER_TOKEN_BEDROCK=...        # Option 3: Bedrock API key
```

**Optional Configuration**:
```bash
ANTHROPIC_MODEL='global.anthropic.claude-sonnet-4-5-20250929-v1:0'
ANTHROPIC_SMALL_FAST_MODEL='us.anthropic.claude-haiku-4-5-20251001-v1:0'
ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION=us-west-2  # Different region for fast model
CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
MAX_THINKING_TOKENS=1024
DISABLE_PROMPT_CACHING=1  # If needed
```

**Required IAM Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowModelAndInferenceProfileAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListInferenceProfiles"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*",
        "arn:aws:bedrock:*:*:foundation-model/*"
      ]
    },
    {
      "Sid": "AllowMarketplaceSubscription",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:CalledViaLast": "bedrock.amazonaws.com"
        }
      }
    }
  ]
}
```

**Model Names in Bedrock**:
- `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `us.anthropic.claude-opus-4-1-20250514-v1:0`
- `us.anthropic.claude-haiku-4-5-20251001-v1:0`

### Google Vertex AI

When `CLAUDE_CODE_USE_VERTEX=1` is set:

1. SDK detects environment variable
2. Loads GCP credentials from default chain
3. Initializes Vertex AI client
4. Routes all `query()` calls to Vertex AI service
5. Returns responses compatible with Anthropic API

**Environment Variables Required**:
```bash
CLAUDE_CODE_USE_VERTEX=1                    # Enable Vertex AI
GOOGLE_CLOUD_PROJECT=my-project-id          # GCP project ID
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json  # Service account key
# OR
GOOGLE_CLOUD_PROJECT=my-project-id          # If using default gcloud credentials
# Run: gcloud auth application-default login
```

**Optional Configuration**:
```bash
ANTHROPIC_MODEL='claude-3-5-sonnet@20241022'
ANTHROPIC_SMALL_FAST_MODEL='claude-3-5-haiku@20241022'
```

**Required IAM Roles**:
```
roles/aiplatform.user
roles/serviceusage.serviceConsumer
```

Or create custom role with:
```
aiplatform.endpoints.predict
aiplatform.publishers.default
```

**Model Names in Vertex AI**:
- `claude-3-5-sonnet@20241022`
- `claude-3-opus@20240229`
- `claude-3-haiku@20240307`

---

## Integration Strategy

### Strategy Overview

Since Claude Agent SDK handles provider selection natively, our integration is simple:

1. **Create a provider configuration layer** that manages environment variables
2. **Support runtime switching** by updating environment before each query
3. **Integrate with settings UI** to select provider
4. **Manage credentials** via OAuth2 gateway for enterprise auth

### Implementation Approach

#### Phase 1: Fix Provider Configuration (2-3 hours)

**Create missing config file**:
```typescript
// lib/config/provider-config.ts
export interface ProviderConfig {
  id: string;
  name: string;
  nativeSupport: boolean;  // True if SDK handles it directly
  environmentVariable: string;
  requiredEnvVars: string[];
  credentialType: 'api-key' | 'aws-credentials' | 'gcp-credentials';
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Direct)',
    nativeSupport: true,
    environmentVariable: 'ANTHROPIC_API_KEY',
    requiredEnvVars: ['ANTHROPIC_API_KEY'],
    credentialType: 'api-key'
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    nativeSupport: true,
    environmentVariable: 'CLAUDE_CODE_USE_BEDROCK',
    requiredEnvVars: ['CLAUDE_CODE_USE_BEDROCK', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    credentialType: 'aws-credentials'
  },
  vertex: {
    id: 'vertex',
    name: 'Google Vertex AI',
    nativeSupport: true,
    environmentVariable: 'CLAUDE_CODE_USE_VERTEX',
    requiredEnvVars: ['CLAUDE_CODE_USE_VERTEX', 'GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS'],
    credentialType: 'gcp-credentials'
  }
};

export function getProviderConfig(providerId: string): ProviderConfig | null {
  return PROVIDERS[providerId] || null;
}
```

#### Phase 2: Create Provider Manager (2-3 hours)

**Runtime provider switching logic**:
```typescript
// lib/providers/provider-manager.ts
export class ProviderManager {
  /**
   * Configure environment for given provider
   * Must be called before each query
   */
  static configureProvider(providerId: string): void {
    const config = getProviderConfig(providerId);

    if (!config) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    // Clear previous provider env vars
    delete process.env.CLAUDE_CODE_USE_BEDROCK;
    delete process.env.CLAUDE_CODE_USE_VERTEX;
    delete process.env.ANTHROPIC_API_KEY;

    switch (providerId) {
      case 'anthropic':
        process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
        break;

      case 'bedrock':
        process.env.CLAUDE_CODE_USE_BEDROCK = '1';
        process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
        // AWS credentials sourced from default chain
        break;

      case 'vertex':
        process.env.CLAUDE_CODE_USE_VERTEX = '1';
        process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || '';
        // GCP credentials from GOOGLE_APPLICATION_CREDENTIALS
        break;
    }
  }

  /**
   * Get available providers based on configured credentials
   */
  static getAvailableProviders(): string[] {
    const available = ['anthropic']; // Always available if API key set

    if (process.env.AWS_REGION &&
        (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE || process.env.AWS_BEARER_TOKEN_BEDROCK)) {
      available.push('bedrock');
    }

    if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      available.push('vertex');
    }

    return available;
  }

  /**
   * Validate provider credentials
   */
  static validateProvider(providerId: string): { valid: boolean; errors: string[] } {
    const config = PROVIDERS[providerId];
    if (!config) return { valid: false, errors: ['Unknown provider'] };

    const errors: string[] = [];

    switch (providerId) {
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          errors.push('ANTHROPIC_API_KEY not set');
        }
        break;

      case 'bedrock':
        if (!process.env.AWS_REGION) {
          errors.push('AWS_REGION not set');
        }
        if (!process.env.AWS_ACCESS_KEY_ID &&
            !process.env.AWS_PROFILE &&
            !process.env.AWS_BEARER_TOKEN_BEDROCK) {
          errors.push('AWS credentials not configured (use AWS_ACCESS_KEY_ID, AWS_PROFILE, or AWS_BEARER_TOKEN_BEDROCK)');
        }
        break;

      case 'vertex':
        if (!process.env.GOOGLE_CLOUD_PROJECT) {
          errors.push('GOOGLE_CLOUD_PROJECT not set');
        }
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          errors.push('GOOGLE_APPLICATION_CREDENTIALS not set');
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }
}
```

#### Phase 3: Update Chat Route Handler (1-2 hours)

**Integrate provider manager into query flow**:
```typescript
// app/api/chat/route.ts
import { ProviderManager } from '@/lib/providers/provider-manager';

export async function POST(request: Request) {
  const body = await request.json();
  const { message, agent = 'smart', provider = 'anthropic' } = body;

  // Validate and configure selected provider
  const validation = ProviderManager.validateProvider(provider);
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
  ProviderManager.configureProvider(provider);

  try {
    // Claude Agent SDK will use configured provider
    const result = query({
      prompt: message,
      options: {
        systemPrompt: agentConfig.systemPrompt,
        agents: agentConfig.agents,
        mcpServers,
        maxTurns: 10,
      }
    });

    // Stream response...
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } catch (error) {
    // Handle provider-specific errors
    if (error.code === 'AccessDeniedException') {
      return handleAuthError(provider, error);
    }
    throw error;
  }
}
```

#### Phase 4: Update Provider Store (1 hour)

**Fix imports and add provider selection**:
```typescript
// lib/stores/provider-store.ts
import { PROVIDERS } from '@/lib/config/provider-config';
import { ProviderManager } from '@/lib/providers/provider-manager';

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      selectedProviderId: 'anthropic',
      selectedModelId: null,

      getAvailableProviders: () => {
        return ProviderManager.getAvailableProviders().map(id => ({
          id,
          name: PROVIDERS[id]?.name || id,
          description: PROVIDERS[id]?.name || id
        }));
      },

      setProvider: (providerId: string) => {
        const available = ProviderManager.getAvailableProviders();
        if (available.includes(providerId)) {
          set({ selectedProviderId: providerId });
        }
      },

      setModel: (modelId: string) => {
        set({ selectedModelId: modelId });
      }
    }),
    { name: 'omni-ai-provider-storage' }
  )
);
```

#### Phase 5: Update Settings Panel (2-3 hours)

**Add provider selector with credential management**:
```typescript
// components/settings-panel.tsx
import { ProviderManager } from '@/lib/providers/provider-manager';
import { useProviderStore } from '@/lib/stores/provider-store';

export function SettingsPanel() {
  const { selectedProviderId, setProvider, getAvailableProviders } = useProviderStore();
  const [validation, setValidation] = useState<Record<string, any>>({});

  const availableProviders = getAvailableProviders();

  const handleProviderChange = (providerId: string) => {
    const validation = ProviderManager.validateProvider(providerId);
    setValidation(validation);

    if (validation.valid) {
      setProvider(providerId);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">AI Provider</label>

        <select
          value={selectedProviderId}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full rounded border p-2"
        >
          {availableProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>

        {!validation.valid && (
          <div className="mt-2 text-sm text-red-600">
            <p className="font-medium">Configuration issues:</p>
            <ul className="list-disc ml-4">
              {validation.errors?.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selectedProviderId === 'bedrock' && (
        <div className="bg-blue-50 p-3 rounded text-sm">
          <p className="font-medium mb-1">AWS Bedrock Configuration</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>AWS Region: {process.env.AWS_REGION || 'not set'}</li>
            <li>Using credentials from: AWS CLI / Environment / IAM Role</li>
            <li>Required IAM: bedrock:InvokeModel, bedrock:InvokeModelWithResponseStream</li>
          </ul>
        </div>
      )}

      {selectedProviderId === 'vertex' && (
        <div className="bg-blue-50 p-3 rounded text-sm">
          <p className="font-medium mb-1">Google Vertex AI Configuration</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Project: {process.env.GOOGLE_CLOUD_PROJECT || 'not set'}</li>
            <li>Service Account: {process.env.GOOGLE_APPLICATION_CREDENTIALS?.split('/').pop() || 'not set'}</li>
            <li>Required IAM: aiplatform.user, serviceusage.serviceConsumer</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Environment Variables Reference

### Development Setup

**.env.local** (for local development):

```bash
# Choose ONE of these provider setups:

# === Option 1: Anthropic (Direct API) ===
ANTHROPIC_API_KEY=sk-ant-...

# === Option 2: AWS Bedrock ===
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...  # Optional, for temporary credentials

# === Option 3: Google Vertex AI ===
CLAUDE_CODE_USE_VERTEX=1
GOOGLE_CLOUD_PROJECT=my-project-id
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json

# Optional: Model configuration
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
MAX_THINKING_TOKENS=1024

# MCP (required)
OMNI_API_MCP_PATH=../omni-api-mcp/dist/index.js
```

### Production Setup

**Using AWS Secrets Manager** (recommended for Bedrock):
```bash
# In deployment environment (EC2, ECS, Lambda)
# Attach IAM role with bedrock:InvokeModel permissions
# No environment variables needed - SDK uses role credentials

export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
# AWS credentials from IAM role
```

**Using GCP Secret Manager** (recommended for Vertex):
```bash
# In GCP environment (Cloud Run, GKE, etc.)
# Use Workload Identity
# Service account has aiplatform.user role

export CLAUDE_CODE_USE_VERTEX=1
export GOOGLE_CLOUD_PROJECT=my-project
# GCP credentials from Workload Identity
```

---

## Authentication Details

### Amazon Bedrock

**Available credential methods** (in order of precedence):

1. **Bedrock API Key** (simplest)
   ```bash
   export AWS_BEARER_TOKEN_BEDROCK=your-bedrock-api-key
   ```

2. **AWS CLI configuration**
   ```bash
   aws configure
   # Creates ~/.aws/credentials and ~/.aws/config
   export AWS_PROFILE=your-profile
   ```

3. **Environment variables**
   ```bash
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   export AWS_SESSION_TOKEN=...  # Optional
   ```

4. **IAM role** (production, no credentials needed)
   - Attach role to EC2/ECS/Lambda
   - SDK automatically assumes role

5. **Corporate SSO** (with refresh)
   ```bash
   # Configure in settings
   awsAuthRefresh: "aws-azure-login"  # or custom command
   awsCredentialExport: "aws sts get-caller-identity"
   ```

**Important**: `AWS_REGION` must be explicitly set - it's not read from `.aws/config`

### Google Vertex AI

**Available credential methods**:

1. **Service account JSON key** (development)
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   export GOOGLE_CLOUD_PROJECT=my-project
   ```

2. **gcloud CLI** (development)
   ```bash
   gcloud auth application-default login
   export GOOGLE_CLOUD_PROJECT=my-project
   ```

3. **Workload Identity** (production on GKE)
   - No credentials needed
   - Pod service account automatically authorized

4. **Compute Engine default service account** (production on Compute Engine)
   - No configuration needed
   - Instance automatically has credentials

---

## Testing Provider Setup

### Test 1: Verify Anthropic (Baseline)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
unset CLAUDE_CODE_USE_BEDROCK
unset CLAUDE_CODE_USE_VERTEX

npm run dev
# Should work immediately
```

### Test 2: Set up Bedrock Access

**Initial Bedrock setup** (one-time):
1. Go to AWS Bedrock console
2. Select Chat/Text playground
3. Choose Claude model to complete use case form

**Then test**:
```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...

npm run dev
# Should route through Bedrock
```

**Verify with AWS CLI**:
```bash
aws bedrock list-inference-profiles --region us-east-1
# Should show Claude models available
```

### Test 3: Set up Vertex AI Access

**Enable Vertex AI** (one-time):
```bash
gcloud services enable aiplatform.googleapis.com
```

**Create service account**:
```bash
gcloud iam service-accounts create omni-ai-vertex
gcloud projects add-iam-policy-binding my-project \
  --member="serviceAccount:omni-ai-vertex@my-project.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud iam service-accounts keys create service-account.json \
  --iam-account=omni-ai-vertex@my-project.iam.gserviceaccount.com
```

**Then test**:
```bash
export CLAUDE_CODE_USE_VERTEX=1
export GOOGLE_CLOUD_PROJECT=my-project
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/service-account.json

npm run dev
# Should route through Vertex AI
```

---

## Runtime Provider Switching

### Current Limitation

Currently, provider switching requires **app restart** because:
- Environment variables set in module initialization
- Claude Agent SDK reads at startup

### Potential Solutions

#### Solution A: Request-scoped provider (Best for Omni-AI)

```typescript
// Modify chat route to support per-request provider
export async function POST(request: Request) {
  const { provider } = await request.json();

  // Before calling query()
  ProviderManager.configureProvider(provider);

  // In subprocess or isolated context
  const result = query(...);
}
```

**Limitation**: SDK may cache provider at module load

#### Solution B: Child process per provider

```typescript
// Spawn isolated child process for each query
import { spawn } from 'child_process';

const child = spawn('node', ['worker.js'], {
  env: { ...process.env, CLAUDE_CODE_USE_BEDROCK: provider === 'bedrock' ? '1' : '' }
});

// Less efficient but guarantees isolation
```

#### Solution C: Deploy separate instances

```bash
# Instance 1: Anthropic
npm run dev  # ANTHROPIC_API_KEY set

# Instance 2: Bedrock
npm run dev  # CLAUDE_CODE_USE_BEDROCK=1 set

# Instance 3: Vertex
npm run dev  # CLAUDE_CODE_USE_VERTEX=1 set

# Load balancer routes based on provider header
```

**Recommended approach**: Instance 1 (Anthropic) for development, Instance 3 (Bedrock or Vertex) for production based on infrastructure.

---

## Cost Comparison

| Provider | Pricing Model | Cost per 1M input tokens |
|----------|---------------|------------------------|
| **Anthropic Direct** | Per-token | $3.00 |
| **AWS Bedrock** | Per-token | $3.00 (similar to direct) |
| **Google Vertex AI** | Per 1K tokens | $3.00 (similar) |

**Use Case Recommendation**:
- **Development**: Anthropic (lower overhead)
- **High-volume production**: Bedrock (consolidated AWS billing)
- **GCP-native deployment**: Vertex AI (integration benefits)

---

## IAM Permissions Checklists

### For AWS Bedrock

Create an IAM policy and attach to user/role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowModelAndInferenceProfileAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListInferenceProfiles"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*",
        "arn:aws:bedrock:*:*:foundation-model/*"
      ]
    },
    {
      "Sid": "AllowMarketplaceSubscription",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:CalledViaLast": "bedrock.amazonaws.com"
        }
      }
    }
  ]
}
```

### For Google Vertex AI

Assign these IAM roles:
- `roles/aiplatform.user` - For model invocation
- `roles/serviceusage.serviceConsumer` - For API access

Or create custom role with these permissions:
- `aiplatform.endpoints.predict`
- `aiplatform.publishers.default`

---

## Implementation Timeline

| Phase | Task | Effort | Duration |
|-------|------|--------|----------|
| 1 | Create provider-config.ts | 1-2h | 1h |
| 2 | Create provider-manager.ts | 2-3h | 2h |
| 3 | Update chat route handler | 1-2h | 1h |
| 4 | Update provider store | 1h | 1h |
| 5 | Update settings panel UI | 2-3h | 2h |
| 6 | Testing & documentation | 3-4h | 2h |
| **Total** | | **10-15h** | **~9h** |

---

## Key Insights

1. **SDK Handles It All**: Claude Agent SDK natively supports Bedrock/Vertex - no proxy needed
2. **Environment Variable Switching**: Simple env vars control which provider is used
3. **Authentication Flexibility**: Multiple credential methods for each provider
4. **No Breaking Changes**: Existing Anthropic API flow unchanged
5. **Production Ready**: All three providers have IAM/security controls built-in

---

## Next Steps

1. **Review this document** with team
2. **Choose primary provider** for production (likely Bedrock for AWS shops)
3. **Set up credentials** in dev environment
4. **Implement changes** following Phase 1-5 above
5. **Test provider switching** with real queries
6. **Deploy to production** with chosen provider

---

## References

- [Claude Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk/overview.md)
- [Amazon Bedrock Setup](https://docs.claude.com/en/docs/claude-code/amazon-bedrock.md)
- [Google Vertex AI Setup](https://docs.claude.com/en/docs/claude-code/amazon-bedrock.md)
- [AWS Bedrock IAM Permissions](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)
- [GCP Vertex AI Roles](https://cloud.google.com/iam/docs/understanding-roles)
