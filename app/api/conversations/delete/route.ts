/**
 * Delete a conversation
 * POST /api/conversations/delete
 */

import { getConversationDBStore } from '@/lib/storage/conversation-db-store'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, resourceId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    const db = getConversationDBStore()
    await db.deleteConversation(conversationId, resourceId || 'default-user')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
