"use client"

import * as React from "react"
import { MessageSquare, Plus, Search, Trash2, ChevronDown, Settings } from "lucide-react"
import { useConversationStore } from "@/lib/stores/conversation-store"
import { useViewStore } from "@/lib/stores/view-store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { SearchChatsModal } from "@/components/search-chats-modal"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

export function OmniSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [chatsOpen, setChatsOpen] = React.useState(true)
  const { state } = useSidebar()
  const { setActiveView } = useViewStore()
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useConversationStore()

  // Sort conversations by updated date (most recent first)
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [conversations])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Omni AI</span>
                  <span className="text-xs">Intelligent Investigation</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 px-2 py-2">
          <Button
            variant="ghost"
            size={state === "collapsed" ? "icon" : "default"}
            className={state === "collapsed" ? "" : "w-full justify-start"}
            onClick={() => createConversation()}
            title="New conversation"
          >
            <Plus className="size-4" />
            {state !== "collapsed" && <span className="ml-2">New conversation</span>}
          </Button>
          <Button
            variant="ghost"
            size={state === "collapsed" ? "icon" : "default"}
            className={state === "collapsed" ? "" : "w-full justify-start"}
            onClick={() => setSearchOpen(true)}
            title="Search chats"
          >
            <Search className="size-4" />
            {state !== "collapsed" && <span className="ml-2">Search chats</span>}
          </Button>
        </div>
      </SidebarHeader>

      {/* Only show Chat section when sidebar is expanded */}
      {state !== "collapsed" && (
        <SidebarContent>
          <SidebarMenu>
            <Collapsible open={chatsOpen} onOpenChange={setChatsOpen} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="gap-2">
                    <span>Chats</span>
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="gap-1 px-2">
                    {sortedConversations.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-4">
                        No chats yet
                      </div>
                    ) : (
                      sortedConversations.map((conversation) => (
                        <SidebarMenuItem key={conversation.id}>
                          <SidebarMenuButton
                            isActive={activeConversationId === conversation.id}
                            onClick={() => setActiveConversation(conversation.id)}
                            tooltip={conversation.title}
                            className="gap-2 pl-2"
                          >
                            <span className="flex-1 truncate text-sm">{conversation.title}</span>
                          </SidebarMenuButton>
                          <SidebarMenuAction
                            showOnHover
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversation(conversation.id)
                            }}
                          >
                            <Trash2 className="size-3" />
                          </SidebarMenuAction>
                        </SidebarMenuItem>
                      ))
                    )}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarContent>
      )}

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                className={state === "collapsed" ? "" : "w-full justify-start"}
                title="Settings"
                onClick={() => setActiveView("settings")}
              >
                <Settings className="size-4" />
                {state !== "collapsed" && <span className="ml-2">Settings</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      {/* Search Modal */}
      <SearchChatsModal open={searchOpen} onOpenChange={setSearchOpen} />
    </Sidebar>
  )
}
