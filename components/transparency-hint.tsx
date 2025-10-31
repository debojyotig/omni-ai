'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useProgressStore } from '@/lib/stores/progress-store'
import { Sparkles } from 'lucide-react'

export function TransparencyHint() {
  const { hint } = useProgressStore()

  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="px-4 pb-2"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>{hint}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
