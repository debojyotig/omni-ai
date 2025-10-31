import { create } from 'zustand'

export interface IterationStep {
  step: number
  total: number
  description: string
  status: 'pending' | 'running' | 'complete' | 'error'
}

interface ProgressState {
  isRunning: boolean
  currentStep: IterationStep | null
  hint: string | null
  setRunning: (running: boolean) => void
  setStep: (step: IterationStep) => void
  setHint: (hint: string | null) => void
  reset: () => void
}

export const useProgressStore = create<ProgressState>((set) => ({
  isRunning: false,
  currentStep: null,
  hint: null,
  setRunning: (running) => set({ isRunning: running }),
  setStep: (step) => set({ currentStep: step }),
  setHint: (hint) => set({ hint }),
  reset: () => set({ isRunning: false, currentStep: null, hint: null })
}))
