/**
 * Add a message to a conversation
 * POST /api/conversations/message
 *
 * Retries on FOREIGN KEY constraint errors to handle async conversation creation
 */

import { getConversationDBStore } from '@/lib/storage/conversation-db-store'
import { NextRequest, NextResponse } from 'next/server'

async function addMessageWithRetry(
  conversationId: string,
  messageId: string,
  role: string,
  content: string,
  timestamp: number,
  resourceId: string,
  retries: number = 3,
  delay: number = 100
): Promise<void> {
  const db = getConversationDBStore()

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await db.addMessage(conversationId, messageId, role, content, timestamp, resourceId)
      return // Success
    } catch (error: any) {
      // If it's a FOREIGN KEY constraint error and we have retries left, wait and retry
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' && attempt < retries - 1) {
        console.log(`[API] Conversation not yet in DB, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      // Otherwise, throw the error
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, messageId, role, content, timestamp, resourceId } = await request.json()

    if (!conversationId || !messageId || !role || !content || timestamp === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await addMessageWithRetry(conversationId, messageId, role, content, timestamp, resourceId || 'default-user')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to add message:', error)
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}
