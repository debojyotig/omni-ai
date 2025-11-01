import { create } from 'zustand'

export interface ActivityStep {
  id: string
  type: 'thinking' | 'tool_call' | 'search' | 'analysis' | 'complete'
  title: string
  description?: string
  status: 'running' | 'done' | 'error'
  timestamp: number
  duration?: number
  sources?: Array<{
    name: string
    url: string
  }>
  metadata?: Record<string, any>
}

interface ActivityState {
  isOpen: boolean
  currentThreadId: string | null
  steps: ActivityStep[]

  // Actions
  setOpen: (open: boolean) => void
  setThreadId: (threadId: string) => void
  addStep: (step: Omit<ActivityStep, 'id' | 'timestamp'>) => void
  updateStep: (id: string, updates: Partial<ActivityStep>) => void
  completeStep: (id: string, duration: number) => void
  clearSteps: () => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  isOpen: false, // Closed by default - toggle via thinking indicator
  currentThreadId: null,
  steps: [],

  setOpen: (open) => set({ isOpen: open }),

  setThreadId: (threadId) => set({
    currentThreadId: threadId,
    steps: [] // Clear steps when switching threads
  }),

  addStep: (step) => set((state) => ({
    steps: [
      ...state.steps,
      {
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      }
    ]
  })),

  updateStep: (id, updates) => set((state) => ({
    steps: state.steps.map(step =>
      step.id === id ? { ...step, ...updates } : step
    )
  })),

  completeStep: (id, duration) => set((state) => ({
    steps: state.steps.map(step =>
      step.id === id
        ? { ...step, status: 'done' as const, duration }
        : step
    )
  })),

  clearSteps: () => set({ steps: [] }),
}))
