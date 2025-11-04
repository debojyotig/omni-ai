/**
 * Add a message to a conversation
 * POST /api/conversations/message
 */

import { getConversationDBStore } from '@/lib/storage/conversation-db-store'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, messageId, role, content, timestamp, resourceId } = await request.json()

    if (!conversationId || !messageId || !role || !content || timestamp === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = getConversationDBStore()
    await db.addMessage(
      conversationId,
      messageId,
      role,
      content,
      timestamp,
      resourceId || 'default-user'
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to add message:', error)
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}
