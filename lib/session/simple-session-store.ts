/**
 * Simple Session Store
 *
 * Stores session ID mappings for Claude SDK conversation persistence.
 * Mapping: (threadId, resourceId) → sessionId
 *
 * The Claude SDK manages all conversation history automatically.
 * We only need to store the mapping between our thread IDs and SDK session IDs.
 */

import { createClient, type Client } from '@libsql/client';
import path from 'path';

export interface SessionMapping {
  threadId: string;
  resourceId: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simple session storage using LibSQL
 */
export class SimpleSessionStore {
  private client: Client;
  private initialized: boolean = false;

  constructor(dbPath?: string) {
    // Default to .omni-ai/sessions.db in the project root
    const defaultPath = path.join(process.cwd(), '.omni-ai', 'sessions.db');
    const finalPath = dbPath || defaultPath;

    this.client = createClient({
      url: `file:${finalPath}`,
    });
  }

  /**
   * Initialize database schema
   */
  private async init(): Promise<void> {
    if (this.initialized) return;

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS session_mappings (
        threadId TEXT NOT NULL,
        resourceId TEXT NOT NULL,
        sessionId TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (threadId, resourceId)
      )
    `);

    await this.client.execute(`
      CREATE INDEX IF NOT EXISTS idx_session_resource
      ON session_mappings(resourceId, updatedAt DESC)
    `);

    this.initialized = true;
  }

  /**
   * Save or update a session mapping
   */
  async saveSessionId(
    threadId: string,
    resourceId: string,
    sessionId: string
  ): Promise<void> {
    await this.init();

    await this.client.execute({
      sql: `
        INSERT INTO session_mappings (threadId, resourceId, sessionId, updatedAt)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT (threadId, resourceId)
        DO UPDATE SET
          sessionId = excluded.sessionId,
          updatedAt = datetime('now')
      `,
      args: [threadId, resourceId, sessionId],
    });
  }

  /**
   * Get session ID for a thread/resource combination
   */
  async getSessionId(
    threadId: string,
    resourceId: string
  ): Promise<string | null> {
    await this.init();

    const result = await this.client.execute({
      sql: `
        SELECT sessionId
        FROM session_mappings
        WHERE threadId = ? AND resourceId = ?
      `,
      args: [threadId, resourceId],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].sessionId as string;
  }

  /**
   * Delete a session mapping
   */
  async deleteSession(threadId: string, resourceId: string): Promise<void> {
    await this.init();

    await this.client.execute({
      sql: `
        DELETE FROM session_mappings
        WHERE threadId = ? AND resourceId = ?
      `,
      args: [threadId, resourceId],
    });
  }

  /**
   * List all sessions for a resource (user)
   */
  async listSessions(resourceId: string): Promise<SessionMapping[]> {
    await this.init();

    const result = await this.client.execute({
      sql: `
        SELECT threadId, resourceId, sessionId, createdAt, updatedAt
        FROM session_mappings
        WHERE resourceId = ?
        ORDER BY updatedAt DESC
      `,
      args: [resourceId],
    });

    return result.rows.map((row) => ({
      threadId: row.threadId as string,
      resourceId: row.resourceId as string,
      sessionId: row.sessionId as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));
  }

  /**
   * Get session metadata
   */
  async getSessionMetadata(
    threadId: string,
    resourceId: string
  ): Promise<SessionMapping | null> {
    await this.init();

    const result = await this.client.execute({
      sql: `
        SELECT threadId, resourceId, sessionId, createdAt, updatedAt
        FROM session_mappings
        WHERE threadId = ? AND resourceId = ?
      `,
      args: [threadId, resourceId],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      threadId: row.threadId as string,
      resourceId: row.resourceId as string,
      sessionId: row.sessionId as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }

  /**
   * Close database connection (call when shutting down)
   */
  async close(): Promise<void> {
    // LibSQL client doesn't require explicit close in file mode
    // but we provide this for API consistency
  }
}

// Singleton instance
let storeInstance: SimpleSessionStore | null = null;

/**
 * Get or create the session store singleton
 */
export function getSessionStore(): SimpleSessionStore {
  if (!storeInstance) {
    storeInstance = new SimpleSessionStore();
  }
  return storeInstance;
}
