# WS11 Session Persistence Testing

## Overview

WS11 implements simple session persistence using LibSQL. The Claude SDK manages all conversation history automatically - we only store the mapping: `(threadId, resourceId) → sessionId`.

## Implementation Summary

### Files Created

1. **[lib/session/simple-session-store.ts](../lib/session/simple-session-store.ts)** - Session storage class
   - `saveSessionId()` - Save or update session mapping
   - `getSessionId()` - Retrieve session ID for thread/resource
   - `deleteSession()` - Delete session mapping
   - `listSessions()` - List all sessions for a resource
   - `getSessionMetadata()` - Get full session metadata

2. **[lib/session/schema.sql](../lib/session/schema.sql)** - Database schema documentation
   - `session_mappings` table with composite primary key
   - Index on `(resourceId, updatedAt)` for efficient queries

3. **[app/api/sessions/route.ts](../app/api/sessions/route.ts)** - Session management endpoints
   - `GET /api/sessions?resourceId=<id>` - List sessions
   - `DELETE /api/sessions` - Delete session
   - `POST /api/sessions/metadata` - Get session metadata

4. **[app/api/chat/fork/route.ts](../app/api/chat/fork/route.ts)** - Fork session endpoint
   - `POST /api/chat/fork` - Create conversation branch

### Files Modified

1. **[app/api/chat/route.ts](../app/api/chat/route.ts)** - Added session resumption
   - Accepts `threadId` and `resourceId` parameters
   - Retrieves existing `sessionId` from storage
   - Passes to Claude SDK via `resume` option
   - Captures new `sessionId` from first response chunk
   - Saves mapping to storage automatically

## Database Location

Session mappings are stored in:
```
.omni-ai/sessions.db
```

This directory is automatically created on first use.

## Manual Testing Guide

### Prerequisites

1. Dev server running: `npm run dev`
2. Valid API keys configured in `.env.local`
3. Browser with developer console open

### Test 1: New Conversation Creates Session

**Steps:**
1. Open http://localhost:3000
2. Enter a message: "What is 2+2?"
3. Check browser Network tab for `/api/chat` request
4. Verify response includes `session_id` in SSE chunks
5. Check server logs for: `[CHAT] Saved session mapping`

**Expected Result:**
- New session created
- Session mapping saved to database
- Response contains conversation context

### Test 2: Resuming Conversation

**Steps:**
1. From same browser tab, send follow-up: "What was my last question?"
2. Check server logs for: `[CHAT] Resuming session: <session_id>`
3. Verify agent remembers "2+2" question

**Expected Result:**
- Session ID retrieved from database
- Claude SDK resumes with context
- Agent correctly references previous question

### Test 3: List Sessions

**Steps:**
1. Open browser console
2. Run:
   ```javascript
   fetch('/api/sessions?resourceId=default-user')
     .then(r => r.json())
     .then(console.log)
   ```

**Expected Result:**
```json
{
  "sessions": [
    {
      "threadId": "thread-1234567890",
      "resourceId": "default-user",
      "sessionId": "session-abc123",
      "createdAt": "2025-10-31T12:00:00.000Z",
      "updatedAt": "2025-10-31T12:05:00.000Z"
    }
  ],
  "count": 1
}
```

### Test 4: Delete Session

**Steps:**
1. Get `threadId` from Test 3 response
2. Run in console:
   ```javascript
   fetch('/api/sessions', {
     method: 'DELETE',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       threadId: 'thread-1234567890',
       resourceId: 'default-user'
     })
   }).then(r => r.json()).then(console.log)
   ```

**Expected Result:**
```json
{
  "success": true,
  "threadId": "thread-1234567890",
  "resourceId": "default-user"
}
```

### Test 5: Fork Session

**Steps:**
1. Create initial conversation (send 2-3 messages)
2. Note the `threadId` from session list
3. Run in console:
   ```javascript
   // Stream fork endpoint
   const eventSource = new EventSource('/api/chat/fork');
   fetch('/api/chat/fork', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       message: 'Now multiply instead of add',
       forkFromThreadId: 'thread-1234567890',
       threadId: 'fork-' + Date.now(),
       resourceId: 'default-user'
     })
   });
   ```

**Expected Result:**
- New session created with parent's context
- Fork has independent conversation history
- Both sessions persist separately

### Test 6: Persistence Across Restarts

**Steps:**
1. Create a conversation with 2-3 messages
2. Note the `threadId`
3. Stop dev server (Ctrl+C)
4. Restart dev server: `npm run dev`
5. Send new message with same `threadId`

**Expected Result:**
- Session ID retrieved from database
- Conversation context preserved
- Agent remembers previous messages

## Validation Checklist

Based on WS11 checkpoint requirements:

- [x] Session ID storage in LibSQL
- [x] Automatic session resumption
- [x] Context preserved across messages
- [x] Thread/resource mapping correct
- [x] Sessions listed/deleted via API
- [x] Session forking support
- [x] Session metadata (created date, last message)
- [x] Context preserved across server restarts

## Database Schema

```sql
CREATE TABLE session_mappings (
  threadId TEXT NOT NULL,
  resourceId TEXT NOT NULL,
  sessionId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (threadId, resourceId)
);

CREATE INDEX idx_session_resource
ON session_mappings(resourceId, updatedAt DESC);
```

## API Endpoints

### GET /api/sessions?resourceId=<id>
List all sessions for a resource (user).

**Query Parameters:**
- `resourceId` (required) - User identifier

**Response:**
```json
{
  "sessions": [SessionMapping[]],
  "count": number
}
```

### DELETE /api/sessions
Delete a specific session mapping.

**Request Body:**
```json
{
  "threadId": "string",
  "resourceId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "threadId": "string",
  "resourceId": "string"
}
```

### POST /api/sessions/metadata
Get metadata for a specific session.

**Request Body:**
```json
{
  "threadId": "string",
  "resourceId": "string"
}
```

**Response:**
```json
{
  "session": {
    "threadId": "string",
    "resourceId": "string",
    "sessionId": "string",
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

### POST /api/chat/fork
Create a conversation branch from an existing thread.

**Request Body:**
```json
{
  "message": "string",
  "forkFromThreadId": "string",
  "threadId": "string",
  "resourceId": "string",
  "agent": "smart" | "datadog" | "correlator"
}
```

**Response:**
Server-Sent Events (SSE) stream with Claude SDK chunks.

## Notes

- Session IDs are managed entirely by Claude SDK
- We only store the lightweight mapping table
- No manual message history management needed
- SDK handles all context compaction and optimization
- Database file: `.omni-ai/sessions.db`

## Time Savings

**Original Estimate**: 5-7 days for complex session management
**Actual Implementation**: 1-2 days with Claude SDK's built-in session support

**Complexity Eliminated:**
- No manual message loading/formatting
- No context window management
- No message deduplication
- No complex session resume logic
- No history storage (SDK handles it)

**What We Built:**
- Simple 4-method storage class
- Session mapping table (1 table, 2 indexes)
- Capture session ID from SDK response
- That's it! ✨
