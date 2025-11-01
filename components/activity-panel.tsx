/**
 * Activity Panel
 *
 * Right sidebar showing active tool calls and agent activity.
 * Closable, shows real-time updates during investigations.
 */

'use client'

import { useState } from 'react'
import { X, Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolCallCard, type ToolCall } from '@/components/tool-call-card'
import { Separator } from '@/components/ui/separator'

interface ActivityPanelProps {
  toolCalls: ToolCall[]
  isRunning: boolean
  hint: string | null
}

export function ActivityPanel({ toolCalls, isRunning, hint }: ActivityPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) {
    return (
      <div className="w-12 bg-background border-l flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          title="Show activity"
        >
          <Activity className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-80 bg-background border-l flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h2 className="font-semibold text-sm">Activity</h2>
          {isRunning && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Status */}
      {hint && (
        <>
          <div className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground">Current Status</p>
            <p className="text-sm mt-1">{hint}</p>
          </div>
          <Separator />
        </>
      )}

      {/* Tool Calls */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {toolCalls.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active tool calls</p>
              <p className="text-xs mt-1">Tool calls will appear here</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                {toolCalls.length} tool call{toolCalls.length !== 1 ? 's' : ''}
              </p>
              {toolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
