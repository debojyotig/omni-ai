/**
 * Create a new conversation
 * POST /api/conversations/create
 */

import { getConversationDBStore } from '@/lib/storage/conversation-db-store'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { id, title, resourceId } = await request.json()

    if (!id || !title) {
      return NextResponse.json(
        { error: 'Missing id or title' },
        { status: 400 }
      )
    }

    const db = getConversationDBStore()
    await db.createConversation(id, title, resourceId || 'default-user')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to create conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
