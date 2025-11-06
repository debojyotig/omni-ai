'use client'

import { useState } from 'react'
import { useViewStore } from '@/lib/stores/view-store'
import { OmniSidebar } from '@/components/omni-sidebar'
import { ChatHeader } from '@/components/chat-header'
import { ChatInterface } from '@/components/chat-interface'
import { IterationProgress } from '@/components/iteration-progress'
import { ActivityPanel } from '@/components/activity-panel'
import { MobileActivityDrawer } from '@/components/mobile-activity-drawer'
import { SettingsPanel } from '@/components/settings-panel'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

export default function Home() {
  const activeView = useViewStore((state) => state.activeView)
  const setActiveView = useViewStore((state) => state.setActiveView)
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false)

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

              {/* Mobile activity button (visible on lg and below) */}
              {activeView === 'chat' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setActivityDrawerOpen(true)}
                  title="Show activity"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              )}

              {/* Mobile settings toggle */}
              {activeView !== 'settings' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setActiveView('settings')}
                  title="Settings"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </Button>
              )}
            </div>
          </header>

          {/* Main content area - isolated scroll container */}
          <div className="flex flex-1 flex-col overflow-hidden min-h-0">
            {/* Progress bar always visible if work is running (persists across views) */}
            <IterationProgress />

            {/* Keep ChatInterface mounted but hidden to preserve SSE stream during navigation */}
            <div className={`flex-1 min-h-0 overflow-hidden ${activeView === 'chat' ? 'block' : 'hidden'}`}>
              <ChatInterface />
            </div>

            {activeView === 'settings' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <SettingsPanel />
              </div>
            )}
          </div>
        </div>

        {/* Right Activity Panel - always present, visible during active work (persists across views) */}
        <>
          {/* Desktop: show activity panel on large screens */}
          <div className="hidden lg:block">
            <ActivityPanel />
          </div>
          {/* Mobile/Tablet: show activity drawer - only in chat view */}
          {activeView === 'chat' && (
            <div className="lg:hidden">
              <MobileActivityDrawer open={activityDrawerOpen} onOpenChange={setActivityDrawerOpen} />
            </div>
          )}
        </>
      </SidebarInset>
    </SidebarProvider>
  )
}
