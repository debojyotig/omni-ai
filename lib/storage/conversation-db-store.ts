/**
 * Conversation Database Store
 *
 * Persists conversations to LibSQL for cross-browser/cross-device support.
 * Replaces localStorage with server-side SQLite storage.
 *
 * Schema:
 * - conversations: id, title, createdAt, updatedAt, resourceId
 * - messages: id, conversationId, role, content, timestamp
 */

import { createClient, type Client } from '@libsql/client';
import path from 'path';

export interface ConversationRow {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  resourceId: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Database store for conversations using LibSQL
 */
export class ConversationDBStore {
  private client: Client;
  private initialized: boolean = false;

  constructor(dbPath?: string) {
    // Default to .omni-ai/conversations.db in the project root
    const defaultPath = path.join(process.cwd(), '.omni-ai', 'conversations.db');
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

    // Create conversations table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        resourceId TEXT DEFAULT 'default-user'
      )
    `);

    // Create messages table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for fast queries
    await this.client.execute(`
      CREATE INDEX IF NOT EXISTS idx_conversations_resource
      ON conversations(resourceId, updatedAt DESC)
    `);

    await this.client.execute(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversationId, timestamp ASC)
    `);

    this.initialized = true;
  }

  /**
   * Get all conversations for a resource (user)
   */
  async getConversations(resourceId: string = 'default-user'): Promise<ConversationRow[]> {
    await this.init();

    const result = await this.client.execute({
      sql: `
        SELECT id, title, createdAt, updatedAt, resourceId
        FROM conversations
        WHERE resourceId = ?
        ORDER BY updatedAt DESC
      `,
      args: [resourceId],
    });

    return result.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      resourceId: row.resourceId as string,
    }));
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(
    conversationId: string,
    resourceId: string = 'default-user'
  ): Promise<{ conversation: ConversationRow; messages: MessageRow[] } | null> {
    await this.init();

    // Get conversation
    const convResult = await this.client.execute({
      sql: `
        SELECT id, title, createdAt, updatedAt, resourceId
        FROM conversations
        WHERE id = ? AND resourceId = ?
      `,
      args: [conversationId, resourceId],
    });

    if (convResult.rows.length === 0) {
      return null;
    }

    const row = convResult.rows[0];
    const conversation: ConversationRow = {
      id: row.id as string,
      title: row.title as string,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      resourceId: row.resourceId as string,
    };

    // Get messages
    const msgResult = await this.client.execute({
      sql: `
        SELECT id, conversationId, role, content, timestamp
        FROM messages
        WHERE conversationId = ?
        ORDER BY timestamp ASC
      `,
      args: [conversationId],
    });

    const messages = msgResult.rows.map((row) => ({
      id: row.id as string,
      conversationId: row.conversationId as string,
      role: row.role as 'user' | 'assistant',
      content: row.content as string,
      timestamp: row.timestamp as number,
    }));

    return { conversation, messages };
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    id: string,
    title: string,
    resourceId: string = 'default-user'
  ): Promise<void> {
    await this.init();

    const now = new Date().toISOString();
    await this.client.execute({
      sql: `
        INSERT INTO conversations (id, title, createdAt, updatedAt, resourceId)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [id, title, now, now, resourceId],
    });
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    title: string,
    resourceId: string = 'default-user'
  ): Promise<void> {
    await this.init();

    const now = new Date().toISOString();
    await this.client.execute({
      sql: `
        UPDATE conversations
        SET title = ?, updatedAt = ?
        WHERE id = ? AND resourceId = ?
      `,
      args: [title, now, conversationId, resourceId],
    });
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    messageId: string,
    role: 'user' | 'assistant',
    content: string,
    timestamp: number,
    resourceId: string = 'default-user'
  ): Promise<void> {
    await this.init();

    // Update conversation's updatedAt timestamp
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `
        UPDATE conversations
        SET updatedAt = ?
        WHERE id = ? AND resourceId = ?
      `,
      args: [now, conversationId, resourceId],
    });

    // Insert message
    await this.client.execute({
      sql: `
        INSERT INTO messages (id, conversationId, role, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [messageId, conversationId, role, content, timestamp],
    });
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(
    conversationId: string,
    resourceId: string = 'default-user'
  ): Promise<void> {
    await this.init();

    await this.client.execute({
      sql: `
        DELETE FROM conversations
        WHERE id = ? AND resourceId = ?
      `,
      args: [conversationId, resourceId],
    });
    // Messages are automatically deleted due to ON DELETE CASCADE
  }

  /**
   * Clear all conversations and messages for a resource
   */
  async clearAllConversations(resourceId: string = 'default-user'): Promise<void> {
    await this.init();

    await this.client.execute({
      sql: `
        DELETE FROM conversations
        WHERE resourceId = ?
      `,
      args: [resourceId],
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    // LibSQL client doesn't require explicit close in file mode
    // but we provide this for API consistency
  }
}

// Singleton instance
let storeInstance: ConversationDBStore | null = null;

/**
 * Get or create the conversation database store singleton
 */
export function getConversationDBStore(): ConversationDBStore {
  if (!storeInstance) {
    storeInstance = new ConversationDBStore();
  }
  return storeInstance;
}
