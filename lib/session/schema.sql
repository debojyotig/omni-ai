-- Session Mappings Table
-- Maps (threadId, resourceId) to Claude SDK sessionId
--
-- The Claude SDK manages all conversation history internally.
-- This table only stores the mapping between our identifiers and SDK session IDs.

CREATE TABLE IF NOT EXISTS session_mappings (
  threadId TEXT NOT NULL,
  resourceId TEXT NOT NULL,
  sessionId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (threadId, resourceId)
);

-- Index for efficient lookup by resource
CREATE INDEX IF NOT EXISTS idx_session_resource
ON session_mappings(resourceId, updatedAt DESC);

-- Example queries:
--
-- Get session ID for a thread:
-- SELECT sessionId FROM session_mappings WHERE threadId = ? AND resourceId = ?;
--
-- List all sessions for a user:
-- SELECT * FROM session_mappings WHERE resourceId = ? ORDER BY updatedAt DESC;
--
-- Delete a session:
-- DELETE FROM session_mappings WHERE threadId = ? AND resourceId = ?;
