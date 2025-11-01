/**
 * Activity Panel - ChatGPT Style
 *
 * Right sidebar showing vertical timeline of agent activity
 * Matches ChatGPT's activity tracking UI
 */

'use client'

import { useActivityStore } from '@/lib/stores/activity-store'
import { X, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

export function ActivityPanel() {
  const { isOpen, setOpen, steps } = useActivityStore()
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const toggleStep = (id: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSteps(newExpanded)
  }

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
      <div className="flex items-center justify-between px-4 py-3 border-b">
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
      <ScrollArea className="flex-1">
        <div className="p-4">
          {steps.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isExpanded = expandedSteps.has(step.id)
                const hasDetails = step.description || (step.sources && step.sources.length > 0)

                return (
                  <div key={step.id} className="space-y-2">
                    {/* Step title */}
                    <div className="flex items-start gap-2.5">
                      {/* Status indicator */}
                      {step.status === 'running' ? (
                        <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-foreground flex-shrink-0" />
                      ) : (
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-foreground flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        {hasDetails ? (
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="flex items-start gap-1.5 text-left w-full group"
                          >
                            <ChevronRight
                              className={`h-4 w-4 mt-0.5 transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                            <span className="text-sm font-normal leading-relaxed">
                              {step.title}
                            </span>
                          </button>
                        ) : (
                          <span className="text-sm font-normal leading-relaxed block">
                            {step.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && hasDetails && (
                      <div className="ml-[22px] pl-4 border-l border-border space-y-3">
                        {step.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        )}

                        {step.sources && step.sources.length > 0 && (
                          <div className="space-y-1.5">
                            {step.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs hover:underline group"
                              >
                                <div className="h-1 w-1 rounded-full bg-current opacity-50 flex-shrink-0" />
                                <span className="text-foreground/60 group-hover:text-foreground truncate">
                                  {source.name}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status footer */}
                    {step.status === 'done' && (
                      <div className="ml-[22px] flex items-center gap-2 text-xs text-muted-foreground">
                        {step.duration && (
                          <>
                            <span>Thought for {formatDuration(step.duration)}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>Done</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
