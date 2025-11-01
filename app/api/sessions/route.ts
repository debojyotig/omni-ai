/**
 * Session Management API
 *
 * Provides endpoints to list and delete session mappings.
 */

import { NextRequest } from 'next/server';
import { getSessionStore } from '@/lib/session/simple-session-store';

/**
 * GET /api/sessions?resourceId=<id>
 *
 * List all sessions for a resource (user)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return new Response(
        JSON.stringify({ error: 'resourceId query parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionStore = getSessionStore();
    const sessions = await sessionStore.listSessions(resourceId);

    return new Response(
      JSON.stringify({ sessions, count: sessions.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[SESSIONS] GET error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/sessions
 *
 * Delete a specific session mapping
 */
export async function DELETE(req: NextRequest) {
  try {
    const { threadId, resourceId } = await req.json();

    if (!threadId || !resourceId) {
      return new Response(
        JSON.stringify({ error: 'threadId and resourceId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionStore = getSessionStore();
    await sessionStore.deleteSession(threadId, resourceId);

    console.log(`[SESSIONS] Deleted session: ${threadId} (${resourceId})`);

    return new Response(
      JSON.stringify({ success: true, threadId, resourceId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[SESSIONS] DELETE error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/sessions/metadata
 *
 * Get metadata for a specific session
 */
export async function POST(req: NextRequest) {
  try {
    const { threadId, resourceId } = await req.json();

    if (!threadId || !resourceId) {
      return new Response(
        JSON.stringify({ error: 'threadId and resourceId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionStore = getSessionStore();
    const metadata = await sessionStore.getSessionMetadata(threadId, resourceId);

    if (!metadata) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ session: metadata }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[SESSIONS] POST metadata error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
