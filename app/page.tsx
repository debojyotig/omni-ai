'use client'

import { useViewStore } from '@/lib/stores/view-store'
import { SettingsPanel } from '@/components/settings-panel'
import { ChatHeader } from '@/components/chat-header'
import { ChatInterface } from '@/components/chat-interface'
import { IterationProgress } from '@/components/iteration-progress'
import { ConversationSidebar } from '@/components/conversation-sidebar'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full flex">
      {activeView === 'chat' && (
        <>
          {/* Conversation sidebar on the left */}
          <ConversationSidebar />

          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            <ChatHeader />
            <IterationProgress />
            <ChatInterface />
          </div>
        </>
      )}
      {activeView === 'settings' && <SettingsPanel />}
    </div>
  )
}
