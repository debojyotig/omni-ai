/**
 * Streaming Input Mode Support
 *
 * Implements both Streaming Input Mode (recommended) and Single Message Mode
 * for Claude Agent SDK query() function.
 *
 * Feature Flag: USE_STREAMING_INPUT_MODE (default: true - recommended)
 * - When enabled: Uses AsyncGenerator for prompt (long-lived, stateful)
 * - When disabled: Uses string for prompt (stateless, single message)
 *
 * Reference: https://docs.claude.com/en/api/agent-sdk/streaming-vs-single-mode.md
 */

/**
 * Check if streaming input mode is enabled
 * Default: false (Single Message Mode - appropriate for stateless API)
 *
 * Note: Streaming Input Mode is designed for long-lived CLI applications
 * with persistent connections. For stateless Next.js API routes, Single
 * Message Mode is more appropriate.
 */
export function isStreamingInputModeEnabled(): boolean {
  const mode = process.env.USE_STREAMING_INPUT_MODE;
  // Default to false (Single Message Mode) - more suitable for stateless APIs
  return mode === 'true';
}

/**
 * Create an async generator for streaming input mode
 *
 * Yields a single user message in the format expected by the Claude Agent SDK.
 * The generator yields once and completes cleanly, allowing the SDK to process
 * the message and any tool calls that follow.
 *
 * Note: Return type is 'any' due to SDK's internal type definitions.
 * The yielded object follows the SDKUserMessage structure exactly.
 */
export async function* createStreamingPromptGenerator(
  userMessage: string,
  sessionId: string | null | undefined
): AsyncGenerator<any> {
  yield {
    type: 'user',
    ...(sessionId && { session_id: sessionId }),
    message: {
      role: 'user',
      content: userMessage
    },
    parent_tool_use_id: null
  };
  // Generator completes after yielding the single message
}

/**
 * Get the appropriate prompt format based on feature flag
 *
 * Streaming Input Mode (recommended):
 * - Returns AsyncIterable for long-lived, stateful processing
 * - Supports interruptions, permission requests, dynamic message queuing
 * - Better for interactive chat applications
 *
 * Single Message Mode (fallback):
 * - Returns string for stateless processing
 * - Better for lambda/serverless functions
 */
export function getPromptInput(
  userMessage: string,
  sessionId: string | null | undefined
): string | AsyncGenerator<any> {
  if (isStreamingInputModeEnabled()) {
    return createStreamingPromptGenerator(userMessage, sessionId);
  }

  // Single Message Mode (stateless)
  return userMessage;
}

/**
 * Log the current input mode for debugging
 */
export function logInputMode(): void {
  if (isStreamingInputModeEnabled()) {
    console.log('[STREAMING] Streaming Input Mode: ENABLED (long-lived, stateful)');
  } else {
    console.log('[STREAMING] Streaming Input Mode: DISABLED (single message mode)');
  }
}
