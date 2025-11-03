import { create } from 'zustand'

export type View = 'chat' | 'settings'

interface ViewState {
  activeView: View
  setActiveView: (view: View) => void
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: 'chat',
  setActiveView: (view) => set({ activeView: view })
}))
