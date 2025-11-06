/**
 * Context Manager - Handles conversation context window limits
 *
 * Manages token counting, context window awareness, and conversation
 * compaction to prevent "Input too long" errors.
 */

export interface ModelContextWindow {
  model: string
  contextWindow: number // Total tokens available
  maxInputTokens: number // Max tokens for input
}

// Claude model context windows (as of knowledge cutoff)
const MODEL_CONTEXT_WINDOWS: Record<string, ModelContextWindow> = {
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet-20241022',
    contextWindow: 200000,
    maxInputTokens: 200000,
  },
  'claude-3-5-haiku-20241022': {
    model: 'claude-3-5-haiku-20241022',
    contextWindow: 200000,
    maxInputTokens: 200000,
  },
  'claude-3-opus-20250219': {
    model: 'claude-3-opus-20250219',
    contextWindow: 200000,
    maxInputTokens: 200000,
  },
  'claude-3-sonnet-20240229': {
    model: 'claude-3-sonnet-20240229',
    contextWindow: 200000,
    maxInputTokens: 200000,
  },
  'gpt-4': {
    model: 'gpt-4',
    contextWindow: 8192,
    maxInputTokens: 8192,
  },
  'gpt-4-turbo': {
    model: 'gpt-4-turbo',
    contextWindow: 128000,
    maxInputTokens: 128000,
  },
}

export function getContextWindowForModel(modelId: string): ModelContextWindow {
  // Try exact match first
  if (MODEL_CONTEXT_WINDOWS[modelId]) {
    return MODEL_CONTEXT_WINDOWS[modelId]
  }

  // Try partial match for versioned models
  for (const [key, config] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (modelId.includes(key)) {
      return config
    }
  }

  // Default to Claude 3.5 Sonnet (most common)
  return MODEL_CONTEXT_WINDOWS['claude-3-5-sonnet-20241022']
}

/**
 * Rough token estimation (not exact, but close for English text)
 * Average: ~1.3 tokens per word for English
 */
export function estimateTokenCount(text: string): number {
  const words = text.split(/\s+/).length
  return Math.ceil(words * 1.3)
}

export interface ConversationContextAnalysis {
  totalTokens: number
  messageCount: number
  contextWindowPercentage: number
  isNearLimit: boolean // > 75% of context used
  isAtRiskLimit: boolean // > 90% of context used
  shouldCompact: boolean // > 85% of context used
  recommendedAction: 'none' | 'warn' | 'compact' | 'clear'
  tokenSuggestion: string
}

export function analyzeConversationContext(
  conversationHistory: string,
  modelId: string
): ConversationContextAnalysis {
  const config = getContextWindowForModel(modelId)
  const estimatedTokens = estimateTokenCount(conversationHistory)
  const percentage = (estimatedTokens / config.maxInputTokens) * 100

  return {
    totalTokens: estimatedTokens,
    messageCount: conversationHistory.split('\n\n').length,
    contextWindowPercentage: percentage,
    isNearLimit: percentage > 75,
    isAtRiskLimit: percentage > 90,
    shouldCompact: percentage > 85,
    recommendedAction:
      percentage > 90
        ? 'clear'
        : percentage > 85
          ? 'compact'
          : percentage > 75
            ? 'warn'
            : 'none',
    tokenSuggestion: `Using ~${estimatedTokens.toLocaleString()} of ${config.maxInputTokens.toLocaleString()} tokens (${percentage.toFixed(1)}%)`,
  }
}

export function isContextExhaustedError(error: any): boolean {
  const message = error?.message || error?.toString() || ''
  return (
    message.includes('Input is too long') ||
    message.includes('context window') ||
    message.includes('maximum context length') ||
    message.includes('token limit')
  )
}

export const ContextMessages = {
  warn: (analysis: ConversationContextAnalysis) =>
    `⚠️ Context window approaching limit: ${analysis.tokenSuggestion}. Consider compacting conversation if it gets longer.`,

  compact:
    '🔄 Compacting conversation history to make room. This will summarize older messages while preserving important context.',

  clear:
    '⚠️ Context window full. For best results, start a fresh conversation. Current conversation history will be preserved in the sidebar.',

  error: (modelId: string) =>
    `❌ Conversation context too long for ${modelId}. To continue, you can:\n1. Start a new conversation, or\n2. Use \`/compact\` to summarize older messages`,

  compactSuccess:
    '✅ Conversation history compacted. Older messages have been summarized.',
}
