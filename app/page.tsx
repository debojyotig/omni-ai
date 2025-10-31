'use client'

import { useViewStore } from '@/lib/stores/view-store'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full flex items-center justify-center">
      {activeView === 'chat' && (
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Chat View</h1>
          <p className="text-muted-foreground">Chat interface coming in WS4</p>
        </div>
      )}
      {activeView === 'settings' && (
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Settings View</h1>
          <p className="text-muted-foreground">Settings panel coming in WS2</p>
        </div>
      )}
    </div>
  )
}
