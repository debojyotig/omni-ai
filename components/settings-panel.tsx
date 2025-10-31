/**
 * Settings Panel
 *
 * Provides UI for selecting LLM providers and models.
 * Supports both standard (OpenAI, Anthropic) and custom OAuth2 providers (Azure, AWS, GCP).
 */

'use client'

import { useEffect } from 'react'
import { useProviderStore } from '@/lib/stores/provider-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle } from 'lucide-react'

export function SettingsPanel() {
  const {
    selectedProviderId,
    selectedModelId,
    setProvider,
    setModel,
    initializeDefaults,
    getAvailableProviders,
    getAvailableModels,
    isReady
  } = useProviderStore()

  // Initialize defaults on mount
  useEffect(() => {
    initializeDefaults()
  }, [initializeDefaults])

  const availableProviders = getAvailableProviders()
  const availableModels = getAvailableModels()

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your LLM provider and model preferences
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mb-8 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            {isReady() ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-medium">Ready</span>
                <span className="text-muted-foreground">
                  · {selectedProviderId} · {selectedModelId}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Not Configured</span>
                <span className="text-muted-foreground">
                  · Select a provider and model to get started
                </span>
              </>
            )}
          </div>
        </div>

        {/* Provider Selection */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="provider-select" className="text-base">
              Provider
            </Label>
            <Select
              value={selectedProviderId || undefined}
              onValueChange={setProvider}
            >
              <SelectTrigger id="provider-select" className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({provider.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableProviders.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No providers configured. Add API keys to .env.local
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <Label htmlFor="model-select" className="text-base">
              Model
            </Label>
            <Select
              value={selectedModelId || undefined}
              onValueChange={setModel}
              disabled={!selectedProviderId || availableModels.length === 0}
            >
              <SelectTrigger id="model-select" className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProviderId && availableModels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No models available for this provider
              </p>
            )}
          </div>
        </div>

        {/* Provider Information */}
        <div className="mt-8 p-4 rounded-lg border bg-muted/50">
          <h3 className="font-medium mb-2">Available Providers</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Standard:</span>
              <span className="text-muted-foreground">
                OpenAI, Anthropic (via Mastra)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Enterprise:</span>
              <span className="text-muted-foreground">
                Azure OpenAI, AWS Bedrock, GCP Vertex (OAuth2)
              </span>
            </div>
          </div>
        </div>

        {/* Environment Variables Info */}
        <div className="mt-4 p-4 rounded-lg border bg-muted/50">
          <h3 className="font-medium mb-2">Configuration</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Add these environment variables to <code className="px-1 py-0.5 rounded bg-muted">.env.local</code>:
          </p>
          <div className="space-y-1 text-xs font-mono text-muted-foreground">
            <div>OPENAI_API_KEY=sk-...</div>
            <div>ANTHROPIC_API_KEY=sk-ant-...</div>
            <div>AZURE_OPENAI_ENDPOINT=https://...</div>
            <div>AZURE_TOKEN_ENDPOINT=https://...</div>
            <div>AZURE_CLIENT_ID=...</div>
            <div>AZURE_CLIENT_SECRET=...</div>
          </div>
        </div>
      </div>
    </div>
  )
}
