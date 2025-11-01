'use client'

import { OmniSidebar } from '@/components/omni-sidebar'
import { ChatHeader } from '@/components/chat-header'
import { ChatInterface } from '@/components/chat-interface'
import { IterationProgress } from '@/components/iteration-progress'
import { ActivityPanel } from '@/components/activity-panel'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default function Home() {
  return (
    <SidebarProvider>
      <OmniSidebar />
      <SidebarInset className="flex flex-row">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14">
            <div className="flex w-full items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1">
                <ChatHeader />
              </div>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <IterationProgress />
            <ChatInterface />
          </div>
        </div>

        {/* Right Activity Panel */}
        <ActivityPanel />
      </SidebarInset>
    </SidebarProvider>
  )
}
