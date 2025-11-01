/**
 * Conversation Sidebar
 *
 * Left sidebar showing conversation history.
 * Collapsible, shows list of conversations with timestamps.
 */

'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useConversationStore } from '@/lib/stores/conversation-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function ConversationSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useConversationStore()

  const handleNewConversation = () => {
    createConversation()
  }

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this conversation?')) {
      deleteConversation(id)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return new Date(timestamp).toLocaleDateString()
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-background border-r flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNewConversation}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-64 bg-background border-r flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Conversations</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'w-full p-2.5 rounded-lg transition-colors group cursor-pointer',
                  'hover:bg-accent',
                  activeConversationId === conversation.id
                    ? 'bg-accent'
                    : 'bg-transparent'
                )}
                onClick={() => setActiveConversation(conversation.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveConversation(conversation.id)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(conversation.updatedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
