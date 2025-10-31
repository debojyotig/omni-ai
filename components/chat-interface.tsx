/**
 * Chat Interface
 *
 * Main chat UI with header and message area.
 * Full implementation coming in WS4 (Agents + Workflows).
 */

'use client'

import { ChatHeader } from '@/components/chat-header'
import { MessageSquare } from 'lucide-react'

export function ChatInterface() {
  return (
    <div className="h-full flex flex-col">
      {/* Header with model selector */}
      <ChatHeader />

      {/* Message area (placeholder for WS4) */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Ready to Chat</h2>
            <p className="text-muted-foreground max-w-md">
              Chat interface with agents, workflows, and MCP integration coming in WS4.
              <br />
              For now, you can switch models in the header above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
