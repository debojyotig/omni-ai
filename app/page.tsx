'use client'

import { useViewStore } from '@/lib/stores/view-store'
import { SettingsPanel } from '@/components/settings-panel'
import { ChatInterface } from '@/components/chat-interface'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full">
      {activeView === 'chat' && <ChatInterface />}
      {activeView === 'settings' && <SettingsPanel />}
    </div>
  )
}
