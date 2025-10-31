'use client'

import { useViewStore } from '@/lib/stores/view-store'
import { SettingsPanel } from '@/components/settings-panel'
import { ChatHeader } from '@/components/chat-header'
import { ChatInterface } from '@/components/chat-interface'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full flex flex-col">
      {activeView === 'chat' && (
        <>
          <ChatHeader />
          <ChatInterface />
        </>
      )}
      {activeView === 'settings' && <SettingsPanel />}
    </div>
  )
}
