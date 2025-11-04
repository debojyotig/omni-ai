/**
 * Update conversation title
 * POST /api/conversations/title
 */

import { getConversationDBStore } from '@/lib/storage/conversation-db-store'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, title, resourceId } = await request.json()

    if (!conversationId || !title) {
      return NextResponse.json(
        { error: 'Missing conversationId or title' },
        { status: 400 }
      )
    }

    const db = getConversationDBStore()
    await db.updateConversationTitle(conversationId, title, resourceId || 'default-user')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to update conversation title:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation title' },
      { status: 500 }
    )
  }
}
