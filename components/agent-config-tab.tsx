/**
 * Agent Config Tab
 *
 * Dynamic configuration UI for agent token limits, temperature, and iterations.
 * Settings are stored per provider/model combination.
 */

'use client'

import { useEffect, useState } from 'react'
import { useProviderStore } from '@/lib/stores/provider-store'
import {
  useAgentConfigStore,
  type AgentConfig,
  getAllDefaultConfigs,
} from '@/lib/stores/agent-config-store'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, RotateCcw, Info } from 'lucide-react'

export function AgentConfigTab() {
  const { selectedProviderId, selectedModelId, getAllModels } =
    useProviderStore()
  const { getConfig, setConfig, resetConfig } = useAgentConfigStore()

  const [selectedConfigProviderId, setSelectedConfigProviderId] = useState<
    string | null
  >(null)
  const [selectedConfigModelId, setSelectedConfigModelId] = useState<
    string | null
  >(null)

  // Local state for sliders
  const [maxOutputTokens, setMaxOutputTokens] = useState(8192)
  const [temperature, setTemperature] = useState(0.7)
  const [maxIterations, setMaxIterations] = useState(15)

  const [showSavedIndicator, setShowSavedIndicator] = useState(false)

  // Initialize with current provider/model
  useEffect(() => {
    if (selectedProviderId && selectedModelId) {
      setSelectedConfigProviderId(selectedProviderId)
      setSelectedConfigModelId(selectedModelId)
    }
  }, [selectedProviderId, selectedModelId])

  // Load config when selection changes
  useEffect(() => {
    if (selectedConfigProviderId && selectedConfigModelId) {
      const config = getConfig(selectedConfigProviderId, selectedConfigModelId)
      setMaxOutputTokens(config.maxOutputTokens)
      setTemperature(config.temperature)
      setMaxIterations(config.maxIterations)
    }
  }, [selectedConfigProviderId, selectedConfigModelId, getConfig])

  const handleSave = () => {
    if (!selectedConfigProviderId || !selectedConfigModelId) return

    const config: AgentConfig = {
      providerId: selectedConfigProviderId,
      modelId: selectedConfigModelId,
      maxOutputTokens,
      temperature,
      maxIterations,
    }

    setConfig(config)
    setShowSavedIndicator(true)

    // Hide indicator after 2 seconds
    setTimeout(() => setShowSavedIndicator(false), 2000)
  }

  const handleReset = () => {
    if (!selectedConfigProviderId || !selectedConfigModelId) return

    resetConfig(selectedConfigProviderId, selectedConfigModelId)

    // Reload default config
    const defaultConfig = getConfig(
      selectedConfigProviderId,
      selectedConfigModelId
    )
    setMaxOutputTokens(defaultConfig.maxOutputTokens)
    setTemperature(defaultConfig.temperature)
    setMaxIterations(defaultConfig.maxIterations)
  }

  const allModels = getAllModels()
  const defaultConfigs = getAllDefaultConfigs()

  // Get default config for selected provider
  const defaultConfig = selectedConfigProviderId
    ? defaultConfigs[selectedConfigProviderId] || {
        maxOutputTokens: 4096,
        temperature: 0.7,
        maxIterations: 10,
      }
    : null

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Agent Configuration</h2>
        <p className="text-muted-foreground">
          Configure token limits, temperature, and iterations per provider/model
          combination
        </p>
      </div>

      {/* Provider/Model Selection */}
      <div className="space-y-3 p-4 rounded-lg border bg-card">
        <Label htmlFor="config-model-select" className="text-base">
          Select Provider/Model to Configure
        </Label>
        <Select
          value={
            selectedConfigModelId
              ? `${selectedConfigProviderId}:${selectedConfigModelId}`
              : undefined
          }
          onValueChange={(value) => {
            const [providerId, modelId] = value.split(':')
            setSelectedConfigProviderId(providerId)
            setSelectedConfigModelId(modelId)
          }}
        >
          <SelectTrigger id="config-model-select" className="w-full">
            <SelectValue placeholder="Select a provider/model" />
          </SelectTrigger>
          <SelectContent>
            {allModels.map((model) => (
              <SelectItem
                key={`${model.provider}:${model.id}`}
                value={`${model.provider}:${model.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.provider}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{model.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {defaultConfig && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground p-3 rounded bg-muted/50">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Default for {selectedConfigProviderId}:</span>{' '}
              {defaultConfig.maxOutputTokens?.toLocaleString() || 4096} tokens, temp {defaultConfig.temperature || 0.7}, max {defaultConfig.maxIterations || 10} iterations
            </div>
          </div>
        )}
      </div>

      {/* Configuration Sliders */}
      {selectedConfigProviderId && selectedConfigModelId ? (
        <div className="space-y-6">
          {/* Max Output Tokens */}
          <div className="space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-base">Max Output Tokens</Label>
              <span className="text-sm font-mono font-medium">
                {maxOutputTokens.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[maxOutputTokens]}
              onValueChange={([value]) => setMaxOutputTokens(value)}
              min={1024}
              max={100000}
              step={512}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Controls memory pruning via TokenLimiter processor. Lower values reduce rate limit risk.
              Recommended: Anthropic 8k, OpenAI 16k, OAuth2 4k.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-base">Temperature</Label>
              <span className="text-sm font-mono font-medium">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[temperature * 10]}
              onValueChange={([value]) => setTemperature(value / 10)}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Controls response randomness. Lower (0.0-0.5) = more focused, higher (0.8-2.0) = more creative.
              Recommended: 0.7 for balanced behavior.
            </p>
          </div>

          {/* Max Iterations */}
          <div className="space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-base">Max Iterations</Label>
              <span className="text-sm font-mono font-medium">
                {maxIterations}
              </span>
            </div>
            <Slider
              value={[maxIterations]}
              onValueChange={([value]) => setMaxIterations(value)}
              min={1}
              max={25}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Maximum reasoning loops for multi-step investigations. Higher values allow deeper analysis
              but increase token usage. Recommended: 15 for general use, 10 for rate-limited providers.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="flex-1">
              Save Configuration
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Save Indicator */}
          {showSavedIndicator && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4" />
              Configuration saved successfully
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a provider/model combination to configure</p>
        </div>
      )}

      {/* Info Panel */}
      <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
        <h3 className="font-medium">How It Works</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Each provider/model can have different settings</li>
          <li>• Settings are saved to localStorage automatically</li>
          <li>• Agents use these settings when generating responses</li>
          <li>• TokenLimiter prevents rate limit errors by pruning conversation history</li>
          <li>• Adjust values based on your provider&apos;s rate limits</li>
        </ul>
      </div>
    </div>
  )
}
