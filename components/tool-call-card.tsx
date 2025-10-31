'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

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

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon
                className={`w-4 h-4 ${statusColor} ${
                  toolCall.status === 'running' ? 'animate-spin' : ''
                }`}
              />
              {toolCall.name}
            </CardTitle>
            <CardDescription className="text-xs">{duration}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            MCP Tool
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Arguments */}
        {Object.keys(toolCall.arguments).length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium mb-1 text-muted-foreground">Arguments:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
        )}

        {/* Result */}
        {toolCall.status === 'success' && toolCall.result && (
          <div>
            <p className="text-xs font-medium mb-1 text-muted-foreground">Result:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {toolCall.status === 'error' && toolCall.error && (
          <div>
            <p className="text-xs font-medium mb-1 text-red-500">Error:</p>
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
              {toolCall.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
