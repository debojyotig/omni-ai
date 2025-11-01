'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle2, Loader2, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

/**
 * Tool Call Data Structure
 *
 * Represents a single MCP tool invocation with its status and results.
 */
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  startTime: number
  endTime?: number
}

interface ToolCallCardProps {
  toolCall: ToolCall
}

/**
 * Tool Call Card Component
 *
 * Displays a single MCP tool call with its status, arguments, and results.
 * Matches omni-agent styling with status icons and color coding.
 *
 * Status Icons:
 * - pending/running: Animated spinner (blue)
 * - success: Check circle (green)
 * - error: X circle (red)
 */
export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const duration = toolCall.endTime
    ? `${toolCall.endTime - toolCall.startTime}ms`
    : 'Running...'

  const StatusIcon = {
    pending: Loader2,
    running: Loader2,
    success: CheckCircle2,
    error: XCircle
  }[toolCall.status]

  const statusColor = {
    pending: 'text-muted-foreground',
    running: 'text-blue-500',
    success: 'text-green-500',
    error: 'text-red-500'
  }[toolCall.status]

  const ChevronIcon = isOpen ? ChevronDown : ChevronRight

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-3">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <StatusIcon
                    className={`w-4 h-4 ${statusColor} ${
                      toolCall.status === 'running' ? 'animate-spin' : ''
                    }`}
                  />
                  {toolCall.name}
                  <ChevronIcon className="w-4 h-4 text-muted-foreground ml-1" />
                </CardTitle>
                <CardDescription className="text-xs">{duration}</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                MCP Tool
              </Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pb-3 pt-0">
            {/* Arguments */}
            {Object.keys(toolCall.arguments).length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-1.5 text-muted-foreground">Input:</p>
                <pre className="text-xs bg-muted p-2.5 rounded overflow-x-auto max-h-40 overflow-y-auto border border-border/50">
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </pre>
              </div>
            )}

            {/* Result */}
            {toolCall.status === 'success' && toolCall.result && (
              <div>
                <p className="text-xs font-medium mb-1.5 text-muted-foreground">Output:</p>
                <pre className="text-xs bg-muted p-2.5 rounded overflow-x-auto max-h-60 overflow-y-auto border border-border/50">
                  {JSON.stringify(toolCall.result, null, 2)}
                </pre>
              </div>
            )}

            {/* Error */}
            {toolCall.status === 'error' && toolCall.error && (
              <div>
                <p className="text-xs font-medium mb-1.5 text-red-500">Error:</p>
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200 dark:border-red-900">
                  {toolCall.error}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
