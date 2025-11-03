'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useConversationStore, type Conversation } from '@/lib/stores/conversation-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchChatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchChatsModal({ open, onOpenChange }: SearchChatsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { conversations, activeConversationId, setActiveConversation, createConversation } = useConversationStore()

  // Group conversations by date
  const groupedResults = useMemo(() => {
    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const groups: Record<string, Conversation[]> = {}
    filtered.forEach(conv => {
      const label = formatTimestamp(conv.updatedAt)
      if (!groups[label]) {
        groups[label] = []
      }
      groups[label].push(conv)
    })

    return groups
  }, [conversations, searchQuery])

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Chats</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* New Chat Button */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-left"
              onClick={() => {
                const id = createConversation()
                setActiveConversation(id)
                onOpenChange(false)
              }}
            >
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold">+</span>
              </div>
              <span>New chat</span>
            </Button>
          </div>

          {/* Grouped Chat Results */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedResults).length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </div>
            ) : (
              Object.entries(groupedResults).map(([label, chats]) => (
                <div key={label}>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">{label}</h3>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          setActiveConversation(chat.id)
                          onOpenChange(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeConversationId === chat.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <p className="truncate">{chat.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
