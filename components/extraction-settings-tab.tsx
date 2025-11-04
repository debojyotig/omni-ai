/**
 * Extraction Settings Tab
 *
 * Configuration UI for data extraction settings (pattern-based vs LLM-based).
 * Settings are saved to localStorage automatically.
 */

'use client'

import { useEffect, useState } from 'react'
import { useExtractionSettingsStore } from '@/lib/stores/extraction-settings-store'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { CheckCircle2, RotateCcw, Info, Zap } from 'lucide-react'

export function ExtractionSettingsTab() {
  const { enableLLMExtraction, setEnableLLMExtraction, resetToDefaults } =
    useExtractionSettingsStore()

  const [localEnabled, setLocalEnabled] = useState(enableLLMExtraction)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Update local state when store changes
  useEffect(() => {
    setLocalEnabled(enableLLMExtraction)
    setHasChanges(false)
  }, [enableLLMExtraction])

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalEnabled(e.target.checked)
    setHasChanges(true)
  }

  const handleSave = () => {
    setEnableLLMExtraction(localEnabled)
    setShowSavedIndicator(true)
    setTimeout(() => setShowSavedIndicator(false), 2000)
  }

  const handleReset = () => {
    resetToDefaults()
  }

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Data Extraction</h2>
        <p className="text-muted-foreground">
          Configure how the system extracts structured data from agent responses
        </p>
      </div>

      {/* Extraction Methods Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pattern-Based */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Pattern-Based</h3>
              <p className="text-sm text-muted-foreground">
                Fast, regex-based extraction using predefined patterns
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>✓ Instant extraction</div>
                <div>✓ Zero cost</div>
                <div>✓ ~90% accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* LLM-Based */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🧠</div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">LLM-Based (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Claude-based extraction for complex/irregular formats
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• Fallback for low-confidence patterns</div>
                <div>• ~$0.001 per extraction</div>
                <div>• ~98% accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Explanation */}
      <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Info className="w-4 h-4" />
          Extraction Strategy
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1">
            <li>Always try pattern-based extraction first (instant, free)</li>
            <li>If confidence &lt; 75% and LLM enabled, use Claude fallback</li>
            <li>Return best result or null if both fail</li>
          </ol>
          <p className="pt-2">
            <strong>Cost:</strong> Only LLM fallback uses API credits (~$0.001 per use)
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {/* LLM Extraction Toggle */}
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <Toggle
            label="Enable LLM Extraction Fallback"
            description="Use Claude to extract data when patterns have low confidence. Adds ~0.5-1s latency and ~$0.001 cost per extraction."
            checked={localEnabled}
            onChange={handleToggleChange}
          />
        </div>

        {/* Configuration Info */}
        <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
          <h3 className="font-medium">Current Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Primary Method:</span>
              <span className="font-medium">Pattern-Based</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fallback Method:</span>
              <span className="font-medium">
                {localEnabled ? 'LLM (Claude)' : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cost per Extraction:</span>
              <span className="font-medium">
                $0 {localEnabled && '+ ~$0.001 (fallback only)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">Configured Provider</span>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
          <h3 className="font-medium">When to Enable</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Handling complex, unstructured data formats</li>
            <li>✓ When accuracy is critical (&gt;90% required)</li>
            <li>✓ Parsing non-standard table layouts</li>
            <li>✗ For simple, well-formatted data (disable to save costs)</li>
            <li>✗ When latency matters (&lt;100ms required)</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 sticky bottom-0 bg-background pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex-1"
        >
          Save Settings
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Save Indicator */}
      {showSavedIndicator && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 sticky bottom-20">
          <CheckCircle2 className="w-4 h-4" />
          Settings saved successfully
        </div>
      )}
    </div>
  )
}
