/**
 * Stream Parser for Claude Agent SDK
 *
 * Parses SSE chunks from Claude SDK query() function and extracts
 * meaningful information for UI display.
 */

export interface ParsedTextChunk {
  type: 'text';
  content: string;
  accumulatedText: string; // Full text so far
}

export interface ParsedToolUseChunk {
  type: 'tool_use';
  id: string;
  name: string;
  displayName: string; // Cleaned name without mcp__ prefix
  input: Record<string, any>;
}

export interface ParsedToolResultChunk {
  type: 'tool_result';
  toolUseId: string;
  name: string;
  result: any;
  isError: boolean;
}

export interface ParsedSystemChunk {
  type: 'system';
  subtype: 'init' | 'status' | 'complete';
  message?: string;
  sessionId?: string;
}

export interface ParsedThinkingChunk {
  type: 'thinking';
  content: string;
}

export interface ParsedErrorChunk {
  type: 'error';
  message: string;
  details?: any;
}

export type ParsedChunk =
  | ParsedTextChunk
  | ParsedToolUseChunk
  | ParsedToolResultChunk
  | ParsedSystemChunk
  | ParsedThinkingChunk
  | ParsedErrorChunk;

/**
 * Stream parser state to track accumulated content
 */
export class StreamParser {
  private accumulatedText = '';
  private activeToolCalls = new Map<string, ParsedToolUseChunk>();

  /**
   * Parse a raw SSE chunk from Claude SDK
   */
  parseChunk(rawChunk: any): ParsedChunk | null {
    if (!rawChunk || typeof rawChunk !== 'object') {
      return null;
    }

    // System chunks (initialization, status)
    if (rawChunk.type === 'system') {
      return this.parseSystemChunk(rawChunk);
    }

    // Assistant message chunks (text + tool calls)
    if (rawChunk.type === 'assistant' && rawChunk.message?.content) {
      return this.parseAssistantChunk(rawChunk);
    }

    // Tool result chunk (tool execution completed)
    if (rawChunk.type === 'tool_result') {
      return this.parseToolResultChunk(rawChunk);
    }

    // Result chunk (final response)
    if (rawChunk.type === 'result') {
      return this.parseResultChunk(rawChunk);
    }

    // Thinking chunks (extended thinking mode)
    if (rawChunk.type === 'thinking') {
      return this.parseThinkingChunk(rawChunk);
    }

    // Error chunks
    if (rawChunk.type === 'error') {
      return this.parseErrorChunk(rawChunk);
    }

    return null;
  }

  /**
   * Parse system chunks (init, status, complete)
   */
  private parseSystemChunk(chunk: any): ParsedSystemChunk {
    return {
      type: 'system',
      subtype: chunk.subtype || 'status',
      message: chunk.message,
      sessionId: chunk.session_id,
    };
  }

  /**
   * Parse assistant message chunk (contains text and tool calls)
   */
  private parseAssistantChunk(chunk: any): ParsedChunk | null {
    const content = chunk.message.content;

    // Extract tool results first (they come before new tool uses)
    const toolResults = content.filter((c: any) => c.type === 'tool_result');
    if (toolResults.length > 0) {
      // Return first tool result (we'll get called again for others)
      const toolResult = toolResults[0];
      const toolUseId = toolResult.tool_use_id;
      const toolCall = this.activeToolCalls.get(toolUseId);

      console.log(`[PARSER] Found tool_result for toolUseId: ${toolUseId}, toolName: ${toolCall?.name || 'unknown'}`);

      return {
        type: 'tool_result',
        toolUseId: toolUseId,
        name: toolCall?.name || 'unknown',
        result: toolResult.content,
        isError: toolResult.is_error || false,
      };
    }

    // Extract text content
    const textParts = content.filter((c: any) => c.type === 'text');
    if (textParts.length > 0) {
      const newText = textParts.map((t: any) => t.text).join('');
      this.accumulatedText += newText; // Append to accumulated, don't replace
      return {
        type: 'text',
        content: newText,
        accumulatedText: this.accumulatedText,
      };
    }

    // Extract tool uses
    const toolUses = content.filter((c: any) => c.type === 'tool_use');
    if (toolUses.length > 0) {
      // Return first tool use (we'll get called again for others)
      const toolUse = toolUses[0];
      const parsed: ParsedToolUseChunk = {
        type: 'tool_use',
        id: toolUse.id,
        name: toolUse.name,
        displayName: this.cleanToolName(toolUse.name),
        input: toolUse.input,
      };
      this.activeToolCalls.set(toolUse.id, parsed);
      return parsed;
    }

    return null;
  }

  /**
   * Parse tool result chunk (tool execution completed)
   */
  private parseToolResultChunk(chunk: any): ParsedToolResultChunk {
    const toolUseId = chunk.tool_use_id || chunk.toolUseId || chunk.id;
    const toolCall = this.activeToolCalls.get(toolUseId);

    return {
      type: 'tool_result',
      toolUseId: toolUseId,
      name: toolCall?.name || 'unknown',
      result: chunk.result || chunk.content,
      isError: chunk.is_error || chunk.isError || false,
    };
  }

  /**
   * Parse result chunk (final response)
   */
  private parseResultChunk(chunk: any): ParsedSystemChunk {
    return {
      type: 'system',
      subtype: 'complete',
      message: 'Response complete',
    };
  }

  /**
   * Parse thinking chunk (extended thinking)
   */
  private parseThinkingChunk(chunk: any): ParsedThinkingChunk {
    return {
      type: 'thinking',
      content: chunk.thinking || chunk.content || '',
    };
  }

  /**
   * Parse error chunk
   */
  private parseErrorChunk(chunk: any): ParsedErrorChunk {
    return {
      type: 'error',
      message: chunk.error || chunk.message || 'Unknown error',
      details: chunk.details,
    };
  }

  /**
   * Clean tool name for display (remove mcp__ prefix)
   */
  private cleanToolName(name: string): string {
    // Remove MCP prefix (e.g., mcp__omni-api__discover_datasets → discover_datasets)
    return name.replace(/^mcp__[^_]+__/, '');
  }

  /**
   * Get accumulated text
   */
  getAccumulatedText(): string {
    return this.accumulatedText;
  }

  /**
   * Get active tool calls
   */
  getActiveToolCalls(): ParsedToolUseChunk[] {
    return Array.from(this.activeToolCalls.values());
  }

  /**
   * Reset parser state (for new conversation)
   */
  reset() {
    this.accumulatedText = '';
    this.activeToolCalls.clear();
  }
}

/**
 * Helper function to create a hint message from parsed chunk
 */
export function getHintFromChunk(chunk: ParsedChunk): string | null {
  switch (chunk.type) {
    case 'system':
      if (chunk.subtype === 'init') {
        return 'Agent initialized, processing query...';
      }
      if (chunk.subtype === 'complete') {
        return null; // Clear hint on completion
      }
      return chunk.message || null;

    case 'tool_use':
      return `Calling tool: ${chunk.displayName}`;

    case 'thinking':
      return 'Thinking...';

    case 'error':
      return `Error: ${chunk.message}`;

    default:
      return null;
  }
}
