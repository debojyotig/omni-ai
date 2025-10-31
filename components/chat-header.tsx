/**
 * Chat Header
 *
 * Displays current model and allows runtime model switching.
 * Shows provider and model information without requiring page reload.
 */

'use client'

import { useProviderStore } from '@/lib/stores/provider-store'
import { PROVIDERS } from '@/lib/config/provider-config'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings, Sparkles } from 'lucide-react'
import { useViewStore } from '@/lib/stores/view-store'

export function ChatHeader() {
  const { selectedProviderId, selectedModelId, setModel, getAllModels } = useProviderStore()
  const { setActiveView } = useViewStore()

  const allModels = getAllModels()

  // Group models by provider for better UX
  const modelsByProvider = allModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, typeof allModels>)

  const currentModel = allModels.find(m => m.id === selectedModelId)

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Model selector */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <Select
          value={selectedModelId || undefined}
          onValueChange={setModel}
          disabled={allModels.length === 0}
        >
          <SelectTrigger className="w-[280px] border-0 shadow-none focus:ring-0">
            <SelectValue placeholder="Select a model">
              {currentModel && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentModel.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedProviderId})
                  </span>
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

      {/* Right: Settings button */}
      <button
        onClick={() => setActiveView('settings')}
        className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Open settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  )
}
