/**
 * Load all conversations for a user
 * GET /api/conversations/load?resourceId=default-user
 */

import { getConversationDBStore } from '@/lib/storage/conversation-db-store'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const resourceId = request.nextUrl.searchParams.get('resourceId') || 'default-user'

    const db = getConversationDBStore()
    const dbConversations = await db.getConversations(resourceId)

    // Load full conversations with messages
    const conversations = []
    for (const dbConv of dbConversations) {
      const result = await db.getConversation(dbConv.id, resourceId)
      if (result) {
        conversations.push({
          id: result.conversation.id,
          title: result.conversation.title,
          messages: result.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          createdAt: new Date(result.conversation.createdAt).getTime(),
          updatedAt: new Date(result.conversation.updatedAt).getTime(),
        })
      }
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('[API] Failed to load conversations:', error)
    return NextResponse.json(
      { error: 'Failed to load conversations' },
      { status: 500 }
    )
  }
}
