/**
 * Mobile Activity Drawer
 *
 * Drawer version of ActivityPanel for mobile/tablet
 */

'use client';

import { useActivityStore } from '@/lib/stores/activity-store';
import { X, Loader2, Globe, Code, Database, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useEffect, useRef, useState } from 'react';

interface MobileActivityDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileActivityDrawer({ open, onOpenChange }: MobileActivityDrawerProps) {
  const [isOpen, setIsOpen] = useState(open || false);
  const { isOpen: activityOpen, steps } = useActivityStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activityOpen) {
      setIsOpen(true);
    }
  }, [activityOpen]);

  // Auto-scroll to bottom when new steps are added
  useEffect(() => {
    if (scrollRef.current && lastStepRef.current) {
      requestAnimationFrame(() => {
        lastStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [steps.length, steps[steps.length - 1]?.status]);

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getRunningDuration = () => {
    const runningStep = steps.find((s) => s.status === 'running');
    if (!runningStep) return null;
    return Date.now() - runningStep.timestamp;
  };

  const runningDuration = getRunningDuration();

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>Investigation Progress</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="space-y-3 p-4">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isRunning = step.status === 'running';

              return (
                <div key={idx} ref={isLast ? lastStepRef : null} className="space-y-2">
                  {/* Step timeline dot and title */}
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="pt-1 shrink-0">
                      {isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : step.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : step.status === 'failed' ? (
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-muted" />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-medium text-foreground leading-tight">
                        {step.title}
                      </h4>

                      {/* Sub-steps */}
                      {step.subSteps && step.subSteps.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          {step.subSteps.map((sub, subIdx) => (
                            <li key={subIdx} className="truncate">
                              {sub}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Step status and duration */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {isRunning ? 'Running' : step.status === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                        {(step.duration || isRunning) && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(isRunning ? runningDuration : step.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector line (except last) */}
                  {!isLast && (
                    <div className="ml-2 h-4 border-l-2 border-muted" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
