"use client"

import * as React from "react"
import { MessageSquare, Plus, Search, Trash2 } from "lucide-react"
import { useConversationStore } from "@/lib/stores/conversation-store"
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { NavUser } from "@/components/nav-user"
import { SearchChatsModal } from "@/components/search-chats-modal"

export function OmniSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchOpen, setSearchOpen] = React.useState(false)
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
        <div className="flex gap-2 px-2 py-2">
          <Button
            variant="outline"
            size="icon"
            className="flex-1"
            onClick={() => createConversation()}
            title="New chat"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="flex-1"
            onClick={() => setSearchOpen(true)}
            title="Search chats"
          >
            <Search className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sortedConversations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8 px-4">
              No chats yet. Click the + button to start a new chat.
            </div>
          ) : (
            sortedConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton
                  isActive={activeConversationId === conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  tooltip={conversation.title}
                >
                  <MessageSquare className="size-4" />
                  <span className="flex-1 truncate">{conversation.title}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  showOnHover
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conversation.id)
                  }}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete conversation</span>
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: "User",
            email: "user@example.com",
            avatar: "/avatars/user.png"
          }}
        />
      </SidebarFooter>

      <SidebarRail />

      {/* Search Modal */}
      <SearchChatsModal open={searchOpen} onOpenChange={setSearchOpen} />
    </Sidebar>
  )
}
