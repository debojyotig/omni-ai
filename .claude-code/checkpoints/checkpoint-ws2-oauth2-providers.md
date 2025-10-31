# Checkpoint WS2: OAuth2 Hybrid Providers

**Project**: omni-ai
**Duration**: 3-4 days
**Priority**: Critical Path
**Dependencies**: WS1 (Mastra + Next.js Setup)

## Overview

Implement hybrid provider system that combines Mastra's built-in providers (OpenAI, Anthropic) with custom OAuth2 providers (Azure OpenAI, AWS Bedrock, GCP Vertex). Enable runtime switching of providers and models without app restart.

## Goals

1. Configure Mastra built-in providers (OpenAI, Anthropic)
2. Implement custom OAuth2 gateway for enterprise providers (Azure, AWS, GCP)
3. Create HybridProviderManager to unify both systems
4. Build Settings panel with provider selector
5. Build Chat header with model selector
6. Persist provider/model selections in localStorage
7. Enable runtime switching via Mastra RuntimeContext

## Prerequisites

- [ ] WS1 complete (Activity Bar, layout, Zustand stores)
- [ ] Access to omni-agent OAuth2 logic: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/auth/oauth2-manager.ts`
- [ ] Environment variables configured (`.env.local`)

## Tasks

### Task 1: Configure Mastra Built-in Providers

**File**: `lib/mastra/providers.ts` (new)

**Implementation**:
```typescript
import { Anthropic, OpenAI } from '@mastra/core'

/**
 * Standard providers using Mastra's built-in support
 */
export const standardProviders = {
  openai: new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  }),
  anthropic: new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  })
}

/**
 * Model configurations for standard providers
 */
export const standardModels = {
  openai: [
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' }
  ]
}
```

**Environment Variables** (`.env.local`):
```env
# Standard Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Acceptance Criteria**:
- [ ] OpenAI provider configured
- [ ] Anthropic provider configured
- [ ] Model lists defined
- [ ] Environment variables loaded

### Task 2: Implement OAuth2 Gateway for Enterprise Providers

**File**: `lib/auth/oauth2-gateway.ts` (new)

**Reference**: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/auth/oauth2-manager.ts`

**Implementation**:
```typescript
interface OAuth2Config {
  tokenEndpoint: string
  clientId: string
  clientSecret: string
  scope?: string
}

interface OAuth2Token {
  access_token: string
  expires_in: number
  token_type: string
  expires_at: number  // Calculated timestamp
}

/**
 * OAuth2 Gateway for enterprise LLM providers
 * Handles token acquisition, refresh, and injection
 */
export class OAuth2Gateway {
  private tokens: Map<string, OAuth2Token> = new Map()

  constructor(private configs: Record<string, OAuth2Config>) {}

  /**
   * Get valid access token (auto-refresh if expired)
   */
  async getAccessToken(provider: string): Promise<string> {
    const token = this.tokens.get(provider)

    // Check if token exists and is still valid (with 5min buffer)
    if (token && token.expires_at > Date.now() + 5 * 60 * 1000) {
      return token.access_token
    }

    // Token expired or doesn't exist, fetch new one
    return await this.fetchAccessToken(provider)
  }

  /**
   * Fetch new access token from OAuth2 endpoint
   */
  private async fetchAccessToken(provider: string): Promise<string> {
    const config = this.configs[provider]
    if (!config) {
      throw new Error(`OAuth2 config not found for provider: ${provider}`)
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...(config.scope && { scope: config.scope })
    })

    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error(`OAuth2 token fetch failed: ${response.statusText}`)
    }

    const data = await response.json()
    const token: OAuth2Token = {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      expires_at: Date.now() + data.expires_in * 1000
    }

    this.tokens.set(provider, token)
    return token.access_token
  }

  /**
   * Create authenticated fetch function for LLM API calls
   */
  createAuthenticatedFetch(provider: string): typeof fetch {
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      const token = await this.getAccessToken(provider)

      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`
        }
      })
    }
  }
}
```

**Environment Variables** (`.env.local`):
```env
# Azure OpenAI OAuth2
AZURE_OPENAI_ENDPOINT=https://your-gateway.openai.azure.com
AZURE_TOKEN_ENDPOINT=https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_SCOPE=https://cognitiveservices.azure.com/.default

# AWS Bedrock OAuth2 (if needed)
AWS_BEDROCK_ENDPOINT=https://your-bedrock-endpoint.amazonaws.com
AWS_TOKEN_ENDPOINT=...
AWS_CLIENT_ID=...
AWS_CLIENT_SECRET=...

# GCP Vertex OAuth2 (if needed)
GCP_VERTEX_ENDPOINT=https://your-vertex-endpoint.googleapis.com
GCP_TOKEN_ENDPOINT=https://oauth2.googleapis.com/token
GCP_CLIENT_ID=...
GCP_CLIENT_SECRET=...
```

**Acceptance Criteria**:
- [ ] OAuth2Gateway class implemented
- [ ] Token caching works
- [ ] Auto-refresh with 5min buffer
- [ ] Authenticated fetch function created
- [ ] Environment variables configured

### Task 3: Create Custom LLM Provider Wrapper

**File**: `lib/mastra/custom-providers.ts` (new)

**Purpose**: Wrap OAuth2-authenticated endpoints to work with Mastra's Agent class

**Implementation**:
```typescript
import { OAuth2Gateway } from '@/lib/auth/oauth2-gateway'

/**
 * Custom provider wrapper for Azure OpenAI
 * Uses OAuth2 gateway for authentication
 */
export class AzureOpenAIProvider {
  constructor(
    private gateway: OAuth2Gateway,
    private endpoint: string
  ) {}

  /**
   * Generate chat completion (compatible with Mastra Agent)
   */
  async generate(params: {
    model: string
    messages: Array<{ role: string; content: string }>
    temperature?: number
    max_tokens?: number
  }) {
    const authenticatedFetch = this.gateway.createAuthenticatedFetch('azure')

    const response = await authenticatedFetch(
      `${this.endpoint}/openai/deployments/${params.model}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.max_tokens ?? 4096
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`)
    }

    return await response.json()
  }
}

/**
 * Model configurations for custom providers
 */
export const customModels = {
  azure: [
    { id: 'gpt-4-deployment', name: 'GPT-4 (Azure)', provider: 'azure' },
    { id: 'gpt-35-turbo-deployment', name: 'GPT-3.5 (Azure)', provider: 'azure' }
  ]
  // Add AWS Bedrock, GCP Vertex models as needed
}
```

**Acceptance Criteria**:
- [ ] AzureOpenAIProvider wrapper created
- [ ] Compatible with Mastra Agent interface
- [ ] OAuth2 authentication integrated
- [ ] Model list defined

### Task 4: Create Hybrid Provider Manager

**File**: `lib/mastra/hybrid-provider-manager.ts` (new)

**Purpose**: Unified interface for both standard and custom providers

**Implementation**:
```typescript
import { standardProviders, standardModels } from './providers'
import { AzureOpenAIProvider, customModels } from './custom-providers'
import { OAuth2Gateway } from '@/lib/auth/oauth2-gateway'

export type ProviderType = 'openai' | 'anthropic' | 'azure' | 'aws' | 'gcp'

export interface ModelInfo {
  id: string
  name: string
  provider: ProviderType
}

/**
 * Hybrid Provider Manager
 * Manages both Mastra built-in providers and custom OAuth2 providers
 */
export class HybridProviderManager {
  private oauth2Gateway: OAuth2Gateway
  private customProviders: Record<string, any> = {}

  constructor() {
    // Initialize OAuth2 gateway
    this.oauth2Gateway = new OAuth2Gateway({
      azure: {
        tokenEndpoint: process.env.AZURE_TOKEN_ENDPOINT!,
        clientId: process.env.AZURE_CLIENT_ID!,
        clientSecret: process.env.AZURE_CLIENT_SECRET!,
        scope: process.env.AZURE_SCOPE
      }
      // Add AWS, GCP configs as needed
    })

    // Initialize custom providers
    this.customProviders.azure = new AzureOpenAIProvider(
      this.oauth2Gateway,
      process.env.AZURE_OPENAI_ENDPOINT!
    )
  }

  /**
   * Get provider instance (standard or custom)
   */
  getProvider(providerType: ProviderType) {
    // Check standard providers first
    if (providerType in standardProviders) {
      return standardProviders[providerType as keyof typeof standardProviders]
    }

    // Check custom providers
    if (providerType in this.customProviders) {
      return this.customProviders[providerType]
    }

    throw new Error(`Provider not found: ${providerType}`)
  }

  /**
   * Get all available models across all providers
   */
  getAllModels(): ModelInfo[] {
    return [
      ...standardModels.openai,
      ...standardModels.anthropic,
      ...customModels.azure
    ]
  }

  /**
   * Get models for specific provider
   */
  getModelsForProvider(providerType: ProviderType): ModelInfo[] {
    if (providerType === 'openai') return standardModels.openai
    if (providerType === 'anthropic') return standardModels.anthropic
    if (providerType === 'azure') return customModels.azure
    return []
  }
}

// Singleton instance
export const providerManager = new HybridProviderManager()
```

**Acceptance Criteria**:
- [ ] Hybrid manager unifies standard and custom providers
- [ ] getProvider() returns correct provider instance
- [ ] getAllModels() aggregates all models
- [ ] Singleton pattern implemented

### Task 5: Create Provider Store (Zustand)

**File**: `lib/stores/provider-store.ts` (new)

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderType, ModelInfo } from '@/lib/mastra/hybrid-provider-manager'

interface ProviderState {
  selectedProvider: ProviderType
  selectedModel: string  // model ID
  setProvider: (provider: ProviderType) => void
  setModel: (modelId: string) => void
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set) => ({
      selectedProvider: 'anthropic',
      selectedModel: 'claude-3-5-sonnet-20241022',
      setProvider: (provider) => set({ selectedProvider: provider }),
      setModel: (modelId) => set({ selectedModel: modelId })
    }),
    {
      name: 'omni-ai-provider-storage'
    }
  )
)
```

**Acceptance Criteria**:
- [ ] Provider store created
- [ ] Default provider: Anthropic
- [ ] Default model: Claude 3.5 Sonnet
- [ ] localStorage persistence works

### Task 6: Build Settings Panel UI

**File**: `components/settings-panel.tsx` (new)

**Implementation**:
```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProviderStore } from '@/lib/stores/provider-store'

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure', label: 'Azure OpenAI' }
]

export function SettingsPanel() {
  const { selectedProvider, setProvider } = useProviderStore()

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure LLM providers and models
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>LLM Provider</CardTitle>
            <CardDescription>
              Select your preferred LLM provider. Model selection will update based on this choice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={selectedProvider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Configure API keys and OAuth2 credentials in .env.local
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-mono text-muted-foreground">OPENAI_API_KEY</p>
              <p className="font-mono text-muted-foreground">ANTHROPIC_API_KEY</p>
              <p className="font-mono text-muted-foreground">AZURE_TOKEN_ENDPOINT</p>
              <p className="font-mono text-muted-foreground">AZURE_CLIENT_ID</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Settings panel renders
- [ ] Provider selector works
- [ ] Selection persists
- [ ] UI matches omni-agent styling

### Task 7: Build Chat Header with Model Selector

**File**: `components/chat-header.tsx` (new)

**Implementation**:
```typescript
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProviderStore } from '@/lib/stores/provider-store'
import { providerManager } from '@/lib/mastra/hybrid-provider-manager'

export function ChatHeader() {
  const { selectedProvider, selectedModel, setModel } = useProviderStore()

  const availableModels = providerManager.getModelsForProvider(selectedProvider)

  return (
    <div className="h-14 border-b flex items-center justify-between px-4">
      <h2 className="font-semibold">Chat</h2>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Model:</span>
        <Select value={selectedModel} onValueChange={setModel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Chat header renders
- [ ] Model selector shows available models for selected provider
- [ ] Model selection persists
- [ ] Updates when provider changes in Settings

### Task 8: Update Page to Use Settings and Chat Header

**File**: `app/page.tsx` (update)

**Implementation**:
```typescript
'use client'

import { useViewStore } from '@/lib/stores/view-store'
import { SettingsPanel } from '@/components/settings-panel'
import { ChatHeader } from '@/components/chat-header'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full flex flex-col">
      {activeView === 'chat' && (
        <>
          <ChatHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Chat Interface</h1>
              <p className="text-muted-foreground">Coming in WS4</p>
            </div>
          </div>
        </>
      )}
      {activeView === 'settings' && <SettingsPanel />}
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Settings panel appears when Settings view active
- [ ] Chat header appears when Chat view active
- [ ] View switching works correctly

### Task 9: Test Runtime Provider Switching

**Manual Testing**:

1. **Provider Switch Test**:
   - Open Settings
   - Change provider from Anthropic → OpenAI
   - Go to Chat view
   - Verify model selector shows OpenAI models
   - Change provider back to Anthropic
   - Verify model selector shows Anthropic models

2. **Model Switch Test**:
   - In Chat view, select different model
   - Verify selection persists after page refresh

3. **Persistence Test**:
   - Select specific provider and model
   - Refresh page
   - Verify selections are preserved

**Acceptance Criteria**:
- [ ] Provider switching updates model list immediately
- [ ] Model selection persists across refreshes
- [ ] No console errors during switching

## Testing

### Unit Tests

**File**: `lib/auth/oauth2-gateway.test.ts`

```typescript
import { OAuth2Gateway } from './oauth2-gateway'

describe('OAuth2Gateway', () => {
  it('should fetch access token', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'test-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      })
    ) as jest.Mock

    const gateway = new OAuth2Gateway({
      test: {
        tokenEndpoint: 'https://example.com/token',
        clientId: 'test-client',
        clientSecret: 'test-secret'
      }
    })

    const token = await gateway.getAccessToken('test')
    expect(token).toBe('test-token')
  })

  it('should cache and reuse valid tokens', async () => {
    // Test token caching logic
  })

  it('should refresh expired tokens', async () => {
    // Test token refresh with 5min buffer
  })
})
```

### Integration Tests

**Manual Testing** (with real credentials in `.env.local`):

1. Test Azure OpenAI authentication
2. Test OpenAI standard authentication
3. Test Anthropic standard authentication
4. Verify token refresh works after expiry

## Documentation

**File**: `docs/OAUTH2_HYBRID_DESIGN.md` (new)

Document:
1. Architecture diagram (standard vs custom providers)
2. How OAuth2Gateway works
3. How to add new enterprise providers
4. Token refresh mechanism
5. Environment variable requirements

## Acceptance Criteria (Summary)

- [ ] Mastra standard providers configured (OpenAI, Anthropic)
- [ ] OAuth2Gateway implemented with token caching and refresh
- [ ] Custom provider wrappers created (Azure OpenAI)
- [ ] HybridProviderManager unifies both systems
- [ ] Provider store with localStorage persistence
- [ ] Settings panel with provider selector
- [ ] Chat header with model selector
- [ ] Runtime switching works (no restart required)
- [ ] Model list updates when provider changes
- [ ] Selections persist across page refreshes
- [ ] Unit tests pass
- [ ] Manual testing complete

## Next Workstream

After completing WS2, proceed to:
- **WS3: MCP Integration** - Connect to omni-api-mcp via @mastra/mcp

## Notes

- **OAuth2 is feasible but medium complexity** - Follow omni-agent's OAuth2Manager pattern
- **Token refresh is critical** - Implement 5min buffer to avoid mid-call expiry
- **Environment variables** - Never commit real credentials, use .env.local (in .gitignore)
- **Testing** - Use mock credentials for automated tests, real credentials for manual tests
- **Future enhancement** - Add UI for OAuth2 credential management (not in MVP)

## Common Issues

**Issue**: OAuth2 token fetch fails with 401
**Solution**: Verify CLIENT_ID, CLIENT_SECRET, and TOKEN_ENDPOINT in .env.local

**Issue**: Model selector not updating when provider changes
**Solution**: Ensure useProviderStore is reactive, check that getModelsForProvider() is called on provider change

**Issue**: Token expires mid-conversation
**Solution**: OAuth2Gateway should refresh tokens proactively (5min buffer before expiry)
