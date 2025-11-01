/**
 * Settings Panel (WS10: Enterprise Gateway)
 *
 * Displays current provider configuration (READ-ONLY).
 * Provider changes require app restart.
 */

'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'
import { AgentConfigTab } from '@/components/agent-config-tab'

interface ProviderInfo {
  id: string
  name: string
  models: string[]
  valid: boolean
}

interface AvailableProvider {
  id: string
  name: string
  configured: boolean
}

interface ProviderData {
  current: ProviderInfo
  available: AvailableProvider[]
  validation: {
    valid: boolean
    errors: string[]
  }
  message: string
}

export function SettingsPanel() {
  const [providerData, setProviderData] = useState<ProviderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch provider info on mount
  useEffect(() => {
    fetchProviderInfo()
  }, [])

  async function fetchProviderInfo() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/provider')
      if (!response.ok) {
        throw new Error('Failed to fetch provider info')
      }
      const data = await response.json()
      setProviderData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load provider configuration')
      console.error('[SETTINGS] Error fetching provider info:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            View provider configuration and manage agent behavior
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mb-8 p-4 rounded-lg border bg-card">
            <p className="text-muted-foreground">Loading provider information...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Indicator */}
        {!loading && !error && providerData && (
          <div className="mb-8 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              {providerData.validation.valid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Provider Configured</span>
                  <span className="text-muted-foreground">
                    · {providerData.current.name}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Configuration Error</span>
                  <span className="text-muted-foreground">
                    · Check environment variables
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="provider">Provider & Model</TabsTrigger>
            <TabsTrigger value="agent-config">Agent Config</TabsTrigger>
          </TabsList>

          {/* Provider & Model Tab */}
          <TabsContent value="provider" className="space-y-6 mt-6">
            {!loading && !error && providerData && (
              <>
                {/* Current Provider (Read-Only) */}
                <div className="space-y-3">
                  <Label className="text-base">Current Provider</Label>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{providerData.current.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Provider ID: {providerData.current.id}
                        </div>
                      </div>
                      {providerData.validation.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {!providerData.validation.valid && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuration Issues</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        {providerData.validation.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Available Models */}
                <div className="space-y-3">
                  <Label className="text-base">Available Models</Label>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="space-y-2 text-sm">
                      {providerData.current.models.map((model) => (
                        <div key={model} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="font-mono">{model}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* How to Change Provider */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Changing Providers</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      <p>
                        To change providers, update <code className="px-1 py-0.5 rounded bg-muted">SELECTED_PROVIDER</code> in{' '}
                        <code className="px-1 py-0.5 rounded bg-muted">.env.local</code> and restart the application.
                      </p>
                      <div className="mt-3 space-y-1 text-xs font-mono bg-muted p-3 rounded">
                        <div># Set one of: anthropic, azure, aws, gcp</div>
                        <div>SELECTED_PROVIDER=anthropic</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Available Providers List */}
                <div className="space-y-3">
                  <Label className="text-base">Available Providers</Label>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="space-y-3">
                      {providerData.available.map((provider) => (
                        <div
                          key={provider.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {provider.configured ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span
                              className={
                                provider.configured
                                  ? 'font-medium'
                                  : 'text-muted-foreground'
                              }
                            >
                              {provider.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {provider.configured ? 'Configured' : 'Not configured'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configuration Guide */}
                <div className="p-4 rounded-lg border bg-muted/50">
                  <h3 className="font-medium mb-2">Environment Variables</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configure providers in{' '}
                    <code className="px-1 py-0.5 rounded bg-muted">.env.local</code>:
                  </p>
                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <div className="text-muted-foreground mb-1"># Anthropic (Direct)</div>
                      <div className="bg-muted p-2 rounded">ANTHROPIC_API_KEY=sk-ant-...</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1"># Azure via Gateway</div>
                      <div className="bg-muted p-2 rounded space-y-0.5">
                        <div>AZURE_GATEWAY_URL=https://gateway.company.com/azure</div>
                        <div>AZURE_CLIENT_ID=...</div>
                        <div>AZURE_CLIENT_SECRET=...</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1"># AWS via Gateway</div>
                      <div className="bg-muted p-2 rounded space-y-0.5">
                        <div>AWS_GATEWAY_URL=https://gateway.company.com/aws</div>
                        <div>AWS_ACCESS_KEY_ID=...</div>
                        <div>AWS_SECRET_ACCESS_KEY=...</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1"># GCP via Gateway</div>
                      <div className="bg-muted p-2 rounded space-y-0.5">
                        <div>GCP_GATEWAY_URL=https://gateway.company.com/gcp</div>
                        <div>GCP_PROJECT_ID=...</div>
                        <div>GCP_SERVICE_ACCOUNT_KEY=...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Agent Config Tab */}
          <TabsContent value="agent-config" className="mt-6">
            <AgentConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
