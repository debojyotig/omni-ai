'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProgressStore } from '@/lib/stores/progress-store'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export function IterationProgress() {
  const { isRunning, currentStep } = useProgressStore()

  if (!isRunning || !currentStep) return null

  const progress = (currentStep.step / currentStep.total) * 100

  const StatusIcon = {
    pending: Loader2,
    running: Loader2,
    complete: CheckCircle2,
    error: XCircle
  }[currentStep.status]

  const iconColor = {
    pending: 'text-muted-foreground',
    running: 'text-blue-500',
    complete: 'text-green-500',
    error: 'text-red-500'
  }[currentStep.status]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="border-b bg-muted/50 px-4 py-2"
      >
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <StatusIcon
              className={`w-4 h-4 ${iconColor} ${
                currentStep.status === 'running' ? 'animate-spin' : ''
              }`}
            />
            <span className="font-medium">
              Step {currentStep.step} of {currentStep.total}
            </span>
            <span className="text-muted-foreground">—</span>
            <span>{currentStep.description}</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
