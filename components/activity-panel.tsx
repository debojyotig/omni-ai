/**
 * Activity Panel - ChatGPT Style
 *
 * Right sidebar showing vertical timeline of agent activity
 * Simple dots with text, matching ChatGPT's clean UI
 */

'use client'

import { useActivityStore } from '@/lib/stores/activity-store'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef } from 'react'

export function ActivityPanel() {
  const { isOpen, setOpen, steps } = useActivityStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [steps])

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
    <div className="w-80 border-l bg-background flex flex-col h-full">
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
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              {/* Steps */}
              <div className="space-y-3 relative">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    {/* Dot indicator */}
                    <div className="relative z-10 flex-shrink-0 mt-1.5">
                      {step.status === 'running' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-foreground" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-sm leading-relaxed">
                        {step.title}
                      </div>

                      {/* Show duration for completed steps */}
                      {step.status === 'done' && step.duration && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDuration(step.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
