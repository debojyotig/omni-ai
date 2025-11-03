/**
 * Activity Panel - ChatGPT Style
 *
 * Right sidebar showing vertical timeline of agent activity
 * Shows planning gist, web icons, dots, and completion summary
 */

'use client'

import { useActivityStore } from '@/lib/stores/activity-store'
import { X, Loader2, Globe, Code, Database, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef } from 'react'

export function ActivityPanel() {
  const { isOpen, setOpen, steps } = useActivityStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastStepRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new steps are added or status changes
  useEffect(() => {
    if (scrollRef.current && lastStepRef.current) {
      // Use requestAnimationFrame to ensure DOM has painted
      requestAnimationFrame(() => {
        lastStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
  }, [steps.length, steps[steps.length - 1]?.status])

  if (!isOpen) return null

  const formatDuration = (ms?: number) => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getRunningDuration = () => {
    const runningStep = steps.find(s => s.status === 'running')
    if (!runningStep) return null
    return Date.now() - runningStep.timestamp
  }

  const runningDuration = getRunningDuration()

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full overflow-hidden self-stretch">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Activity</h3>
          {runningDuration !== null && (
            <span className="text-xs text-muted-foreground">
              · {formatDuration(runningDuration)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-muted"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4">
          {steps.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No activity yet
            </div>
          ) : (
            <div className="relative">
              {/* Steps */}
              <div className="space-y-3 relative">
                {steps.map((step, index) => {
                  const isLast = index === steps.length - 1

                  // Determine icon to show
                  const renderIcon = () => {
                    if (step.status === 'running') {
                      return <Loader2 className="h-3 w-3 animate-spin text-foreground" />
                    }

                    // Use step.icon property if available
                    if (step.icon === 'web') {
                      return <Globe className="h-3 w-3 text-foreground" />
                    }

                    if (step.icon === 'api') {
                      return <Code className="h-3 w-3 text-foreground" />
                    }

                    if (step.icon === 'graphql') {
                      return <Database className="h-3 w-3 text-foreground" />
                    }

                    if (step.icon === 'check') {
                      return <CheckCircle className="h-3 w-3 text-foreground" />
                    }

                    if (step.icon === 'spinner') {
                      return (
                        <div className="h-3 w-3 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        </div>
                      )
                    }

                    // Default dot - smaller and centered
                    return (
                      <div className="h-3 w-3 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                      </div>
                    )
                  }

                  return (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 relative"
                      ref={isLast ? lastStepRef : null}
                    >
                      {/* Vertical line segments - only if not last step */}
                      {!isLast && (
                        <div className="absolute left-[5.5px] top-4 bottom-0 w-px bg-border" />
                      )}

                      {/* Icon indicator with background to create gap in line */}
                      <div className="relative z-10 flex-shrink-0 bg-background">
                        {renderIcon()}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-sm leading-relaxed">
                          {step.title}
                        </div>

                        {/* Show description for planning steps */}
                        {step.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {step.description}
                          </div>
                        )}

                        {/* Show duration for completed steps */}
                        {step.status === 'done' && step.duration && !step.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDuration(step.duration)}
                          </div>
                        )}

                        {/* Show "Done" for completion summary */}
                        {step.type === 'complete' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Done
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
