/**
 * Chat Header
 *
 * Displays agent selector and model selector for runtime switching.
 * Shows provider and model information without requiring page reload.
 * Only displays models from configured providers.
 */

'use client'

import { useState, useEffect } from 'react'
import { useProviderStore } from '@/lib/stores/provider-store'
import { useAgentStore, AGENTS } from '@/lib/stores/agent-store'
import { PROVIDERS } from '@/lib/config/provider-config'
import type { RuntimeSettings } from '@/lib/stores/provider-store'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Bot } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'

interface ProviderStatus {
  id: string
  name: string
  configured: boolean
}

export function ChatHeader() {
  const { selectedProviderId, selectedModelId, setModel, getAllModels, getModelSettings } = useProviderStore()
  const { selectedAgent, setAgent } = useAgentStore()
  const [availableProviders, setAvailableProviders] = useState<ProviderStatus[]>([])
  const [modelSettings, setModelSettingsState] = useState<RuntimeSettings | null>(null)

  // Fetch configured providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/provider')
        if (response.ok) {
          const data = await response.json()
          setAvailableProviders(data.available || [])
        }
      } catch (error) {
        console.error('[CHAT-HEADER] Failed to fetch provider info:', error)
      }
    }
    fetchProviders()
  }, [])

  // Load settings when model selection changes
  useEffect(() => {
    if (selectedProviderId && selectedModelId) {
      const settings = getModelSettings(selectedProviderId, selectedModelId)
      setModelSettingsState(settings)
    }
  }, [selectedProviderId, selectedModelId, getModelSettings])

  const allModels = getAllModels()

  // Get configured provider IDs
  const configuredProviderIds = new Set(
    availableProviders.filter(p => p.configured).map(p => p.id)
  )

  // Filter models to only show from configured providers
  const filteredModels = allModels.filter(model =>
    configuredProviderIds.has(model.provider)
  )

  // Group filtered models by provider for better UX
  const modelsByProvider = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, typeof filteredModels>)

  const currentModel = allModels.find(m => m.id === selectedModelId)
  const currentAgent = AGENTS.find(a => a.id === selectedAgent)

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Agent and Model selectors */}
      <div className="flex items-center gap-6">
        {/* Agent selector */}
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedAgent}
            onValueChange={setAgent}
          >
            <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0">
              <SelectValue>
                {currentAgent && (
                  <span className="font-medium">{currentAgent.name}</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {agent.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedModelId || ''}
            onValueChange={setModel}
            disabled={allModels.length === 0}
          >
            <SelectTrigger className="w-[320px] border-0 shadow-none focus:ring-0">
              <SelectValue placeholder="Select a model">
                {currentModel && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currentModel.name}</span>
                    {modelSettings && (
                      <span className="text-xs text-muted-foreground">
                        ({modelSettings.maxOutputTokens}t, {modelSettings.temperature.toFixed(1)}°)
                      </span>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modelsByProvider).map(([providerId, models]) => (
                <SelectGroup key={providerId}>
                  <SelectLabel>{PROVIDERS[providerId]?.name || providerId}</SelectLabel>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.maxTokens && (
                          <span className="text-xs text-muted-foreground">
                            {(model.maxTokens / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: Theme switcher */}
      <ThemeSwitcher />
    </div>
  )
}
