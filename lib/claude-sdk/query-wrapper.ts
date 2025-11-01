/**
 * Query Wrapper for Claude Agent SDK
 *
 * Provides a simplified interface to the Claude Agent SDK's query() function
 * with automatic MCP server configuration and result collection.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { mcpServers } from '../mcp/claude-sdk-mcp-config';
import type { QueryOptions, QueryResult } from './types';

/**
 * Execute a query with Claude Agent SDK
 *
 * This wrapper:
 * - Automatically configures omni-api-mcp MCP server
 * - Collects all streaming chunks into an array
 * - Returns both chunks and final message for easy access
 * - Supports session resumption via sessionId
 *
 * @param prompt - The user's query or instruction
 * @param options - Optional configuration (system prompt, max turns, allowed tools, session ID)
 * @returns Query result with all chunks and final message
 *
 * @example
 * ```typescript
 * // Simple query
 * const result = await queryAgent('What APIs are available?');
 * console.log(result.finalMessage.text);
 *
 * // With options
 * const result = await queryAgent(
 *   'Find Bitcoin price',
 *   {
 *     systemPrompt: 'You are a crypto analyst.',
 *     maxTurns: 5,
 *     allowedTools: ['discover_datasets', 'call_rest_api']
 *   }
 * );
 *
 * // Resume session
 * const result = await queryAgent(
 *   'What was that price again?',
 *   { sessionId: previousResult.sessionId }
 * );
 * ```
 */
export async function queryAgent(
  prompt: string,
  options?: QueryOptions
): Promise<QueryResult> {
  // Build query options
  const queryOptions: any = {
    systemPrompt: options?.systemPrompt || {
      type: 'preset',
      preset: 'claude_code'
    },
    maxTurns: options?.maxTurns || 10,
    mcpServers
  };

  // Add optional configurations
  if (options?.allowedTools) {
    queryOptions.allowedTools = options.allowedTools;
  }

  if (options?.sessionId) {
    queryOptions.resume = options.sessionId;
  }

  // Execute query
  const result = query({
    prompt,
    options: queryOptions
  });

  // Collect all chunks
  const chunks: any[] = [];
  for await (const chunk of result) {
    chunks.push(chunk);
  }

  // Extract final message (usually the last chunk with type 'text')
  const finalMessage = chunks[chunks.length - 1];

  return {
    chunks,
    finalMessage,
    sessionId: options?.sessionId // Return session ID for continuation
  };
}

/**
 * Stream query with callback for each chunk
 *
 * Alternative to queryAgent() that allows processing chunks as they arrive
 * instead of collecting them all first.
 *
 * @param prompt - The user's query or instruction
 * @param onChunk - Callback function called for each chunk
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * await streamQuery(
 *   'Find Bitcoin price',
 *   (chunk) => {
 *     if (chunk.type === 'text') {
 *       console.log(chunk.text);
 *     } else if (chunk.type === 'tool_use') {
 *       console.log(`Calling tool: ${chunk.name}`);
 *     }
 *   }
 * );
 * ```
 */
export async function streamQuery(
  prompt: string,
  onChunk: (chunk: any) => void,
  options?: QueryOptions
): Promise<void> {
  // Build query options (same as queryAgent)
  const queryOptions: any = {
    systemPrompt: options?.systemPrompt || {
      type: 'preset',
      preset: 'claude_code'
    },
    maxTurns: options?.maxTurns || 10,
    mcpServers
  };

  if (options?.allowedTools) {
    queryOptions.allowedTools = options.allowedTools;
  }

  if (options?.sessionId) {
    queryOptions.resume = options.sessionId;
  }

  // Execute query and stream chunks
  const result = query({
    prompt,
    options: queryOptions
  });

  for await (const chunk of result) {
    onChunk(chunk);
  }
}
