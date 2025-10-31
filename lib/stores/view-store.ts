import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type View = 'chat' | 'settings'

interface ViewState {
  activeView: View
  setActiveView: (view: View) => void
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      setActiveView: (view) => set({ activeView: view })
    }),
    {
      name: 'omni-ai-view-storage'
    }
  )
)
