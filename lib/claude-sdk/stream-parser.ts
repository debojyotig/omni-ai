/**
 * Stream Parser for Claude Agent SDK
 *
 * Parses SSE chunks from Claude SDK query() function and extracts
 * meaningful information for UI display.
 */

export interface ParsedTextChunk {
  type: 'text';
  content: string;
  accumulatedText: string; // Full text so far (including planning)
  displayedText: string; // Filtered text for display (planning removed)
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

export interface ParsedTodoChunk {
  type: 'todo';
  todos: Array<{
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
  }>;
}

export type ParsedChunk =
  | ParsedTextChunk
  | ParsedToolUseChunk
  | ParsedToolResultChunk
  | ParsedSystemChunk
  | ParsedThinkingChunk
  | ParsedErrorChunk
  | ParsedTodoChunk;

/**
 * Stream parser state to track accumulated content
 */
export class StreamParser {
  private accumulatedText = ''; // Full text including planning/reasoning
  private displayedText = ''; // Only final response text (planning filtered out)
  private activeToolCalls = new Map<string, ParsedToolUseChunk>();
  private inPlanningPhrase = false; // Track if we're in the middle of a planning phrase across chunks
  private planningBuffer = ''; // Buffer to accumulate text while in planning phrase

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
      this.accumulatedText += newText; // Keep full text internally

      // Filter out planning/reasoning text (show only in Activity Panel, not in chat)
      // Planning text is typically intermediate steps like "I'll check...", "Let me try...", etc.
      const filteredText = this.filterPlanningText(newText);

      // Only add filtered text to display (planning removed)
      if (filteredText.length > 0) {
        this.displayedText += filteredText;
      }

      return {
        type: 'text',
        content: filteredText, // Filtered content for this chunk
        accumulatedText: this.accumulatedText, // Full text internally (for reference)
        displayedText: this.displayedText, // Filtered accumulated text for display
      };
    }

    // Extract tool uses (check for TodoWrite first)
    const toolUses = content.filter((c: any) => c.type === 'tool_use');
    if (toolUses.length > 0) {
      // Check if any tool use is TodoWrite (native SDK task tracking)
      const todoUse = toolUses.find((t: any) => t.name === 'TodoWrite');
      if (todoUse) {
        return this.parseTodoChunk(todoUse);
      }

      // Return first non-TodoWrite tool use (we'll get called again for others)
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
   * Filter planning/reasoning text from chunks
   * Handles phrases that span multiple chunks using stateful tracking
   *
   * Stateful approach:
   * 1. If not in planning phrase: check if chunk starts with planning pattern
   * 2. If yes: accumulate text until sentence boundary (. ! ?) then skip it
   * 3. If in planning phrase: look for sentence boundary, skip until found
   */
  private filterPlanningText(text: string): string {
    if (!text || text.length === 0) {
      return '';
    }

    const planningPatterns = [
      /^I'll\s+(check|get|try|look|fetch|query|retrieve|search|explore|update)/i,
      /^Let me\s+(check|try|look|get|fetch|query|search|also|update|mark)/i,
      /^Now\s+(let me|I'll|that I|let's)/i,
      /^First,\s+(let me|I'll|I need)/i,
      /^To\s+(answer|help|investigate|find|continue)/i,
      /^Let me\s+also\s+(check|look|fetch|try|update)/i,
      /^Now that I\s+(understand|have|identified|see|know)/i,
      /^I should\s+(check|update|try|fetch)/i,
      /^Based on.*I (can|will|should|see)/i,
      /^Let's\s+(try|check|see|explore|get|fetch|update)/i,
      /^I need\s+to\s+(check|try|look|fetch|continue)/i,
      /^I apologize/i,
      /^The\s+(build_query|API|system)/i, // Skip explanation text
    ];

    // If we're already in a planning phrase, look for the end (sentence boundary)
    if (this.inPlanningPhrase) {
      this.planningBuffer += text;

      // Check if we've hit a sentence boundary (. ! ?)
      const sentenceEndMatch = this.planningBuffer.match(/[.!?]/);
      if (sentenceEndMatch) {
        // Found end of planning phrase
        const endIndex = this.planningBuffer.indexOf(sentenceEndMatch[0]) + 1;
        const planning = this.planningBuffer.substring(0, endIndex);
        const remaining = this.planningBuffer.substring(endIndex);

        console.log(`[PARSER] Filtering planning (continued): "${planning.substring(0, 60)}..."`);

        this.inPlanningPhrase = false;
        this.planningBuffer = '';

        // Recursively process the remaining text after the planning phrase
        if (remaining.trim().length > 0) {
          return this.filterPlanningText(remaining);
        }
        return '';
      }

      // Still in planning phrase, no sentence boundary yet
      return '';
    }

    // Check if this chunk starts with a planning pattern
    const trimmed = text.trim();
    const startsWithPlanning = planningPatterns.some(pattern => pattern.test(trimmed));

    if (startsWithPlanning) {
      // Check if the planning phrase ends in this chunk
      const sentenceEndMatch = text.match(/[.!?]/);

      if (sentenceEndMatch) {
        // Planning phrase ends in this chunk
        const endIndex = text.indexOf(sentenceEndMatch[0]) + 1;
        const planning = text.substring(0, endIndex);
        const remaining = text.substring(endIndex);

        console.log(`[PARSER] Filtering planning: "${planning.substring(0, 60)}..."`);

        // Recursively process remaining text after the planning phrase
        if (remaining.trim().length > 0) {
          return this.filterPlanningText(remaining);
        }
        return '';
      } else {
        // Planning phrase continues into next chunk
        console.log(`[PARSER] Filtering planning (spans chunks): "${trimmed.substring(0, 60)}..."`);
        this.inPlanningPhrase = true;
        this.planningBuffer = text;
        return '';
      }
    }

    // Not planning text, return as-is
    return text;
  }

  /**
   * Clean tool name for display (remove mcp__ prefix)
   */
  private cleanToolName(name: string): string {
    // Remove MCP prefix (e.g., mcp__omni-api__discover_datasets → discover_datasets)
    return name.replace(/^mcp__[^_]+__/, '');
  }

  /**
   * Get displayed text (planning/reasoning filtered out)
   * This is what shows in the chat
   */
  getDisplayedText(): string {
    return this.displayedText;
  }

  /**
   * Get accumulated text (includes all text, including planning)
   * Used for internal reference and debugging
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
    this.displayedText = '';
    this.activeToolCalls.clear();
    this.inPlanningPhrase = false;
    this.planningBuffer = '';
  }

  /**
   * Parse todo chunk from TodoWrite tool use
   */
  private parseTodoChunk(todoUse: any): ParsedTodoChunk {
    const todos = todoUse.input?.todos || [];
    return {
      type: 'todo',
      todos: todos.map((todo: any) => ({
        content: todo.content || '',
        status: (todo.status || 'pending') as 'pending' | 'in_progress' | 'completed',
        activeForm: todo.activeForm || todo.content || '',
      })),
    };
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

    case 'todo':
      const inProgress = chunk.todos.filter(t => t.status === 'in_progress').length;
      return inProgress > 0 ? `Executing step: ${chunk.todos.find(t => t.status === 'in_progress')?.activeForm}` : null;

    case 'error':
      return `Error: ${chunk.message}`;

    default:
      return null;
  }
}
