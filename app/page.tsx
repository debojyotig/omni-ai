'use client'

import { useViewStore } from '@/lib/stores/view-store'
import { OmniSidebar } from '@/components/omni-sidebar'
import { ChatHeader } from '@/components/chat-header'
import { ChatInterface } from '@/components/chat-interface'
import { IterationProgress } from '@/components/iteration-progress'
import { ActivityPanel } from '@/components/activity-panel'
import { SettingsPanel } from '@/components/settings-panel'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default function Home() {
  const activeView = useViewStore((state) => state.activeView)

  console.log('[PAGE] Home component rendered with activeView:', activeView)

  return (
    <SidebarProvider>
      <OmniSidebar />
      <SidebarInset className="flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header with sidebar trigger */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14">
            <div className="flex w-full items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1">
                {activeView === 'chat' && <ChatHeader />}
                {activeView === 'settings' && <h2 className="text-lg font-semibold">Settings</h2>}
              </div>
            </div>
          </header>

          {/* Main content area - isolated scroll container */}
          <div className="flex flex-1 flex-col overflow-hidden min-h-0">
            {activeView === 'chat' && (
              <>
                <IterationProgress />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ChatInterface />
                </div>
              </>
            )}
            {activeView === 'settings' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <SettingsPanel />
              </div>
            )}
          </div>
        </div>

        {/* Right Activity Panel - isolated scroll container (only show during chat) */}
        {activeView === 'chat' && <ActivityPanel />}
      </SidebarInset>
    </SidebarProvider>
  )
}
