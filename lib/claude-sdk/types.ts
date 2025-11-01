/**
 * TypeScript types for Claude Agent SDK wrapper
 */

/**
 * Options for queryAgent() function
 */
export interface QueryOptions {
  /**
   * System prompt to set agent behavior.
   * Can be a string or use preset 'claude_code'.
   */
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code' };

  /**
   * Maximum number of agent turns (tool use + response cycles).
   * Default: 10
   */
  maxTurns?: number;

  /**
   * Restrict which tools the agent can use.
   * If not specified, all tools from MCP servers are available.
   */
  allowedTools?: string[];

  /**
   * Session ID to resume previous conversation.
   * The SDK automatically manages conversation history.
   */
  sessionId?: string;
}

/**
 * Result from queryAgent() call
 */
export interface QueryResult {
  /**
   * All chunks received from the streaming response
   */
  chunks: any[];

  /**
   * The final message chunk (usually contains final text response)
   */
  finalMessage: any;

  /**
   * Session ID for resuming this conversation later
   */
  sessionId?: string;
}

/**
 * Chunk types from Claude Agent SDK streaming
 */
export type ChunkType =
  | 'text'
  | 'tool_use'
  | 'tool_result'
  | 'thinking'
  | 'error';

/**
 * Base chunk interface
 */
export interface BaseChunk {
  type: ChunkType;
}

/**
 * Text chunk (agent response)
 */
export interface TextChunk extends BaseChunk {
  type: 'text';
  text: string;
}

/**
 * Tool use chunk (agent calling a tool)
 */
export interface ToolUseChunk extends BaseChunk {
  type: 'tool_use';
  name: string;
  input: Record<string, any>;
  id: string;
}

/**
 * Tool result chunk (tool execution result)
 */
export interface ToolResultChunk extends BaseChunk {
  type: 'tool_result';
  toolUseId: string;
  content: any;
  isError: boolean;
}

/**
 * Thinking chunk (agent's internal reasoning)
 */
export interface ThinkingChunk extends BaseChunk {
  type: 'thinking';
  thinking: string;
}

/**
 * Error chunk
 */
export interface ErrorChunk extends BaseChunk {
  type: 'error';
  error: string;
}

/**
 * Union type of all chunk types
 */
export type Chunk =
  | TextChunk
  | ToolUseChunk
  | ToolResultChunk
  | ThinkingChunk
  | ErrorChunk;
