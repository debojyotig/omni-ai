import { create } from 'zustand'
import type { ToolCall } from '@/components/tool-call-card'

/**
 * Tool Call Store
 *
 * Manages tool call history for UI visualization.
 * Used to track MCP tool invocations and their results in real-time.
 *
 * Features:
 * - Add new tool calls
 * - Update tool call status/results
 * - Clear history
 * - No persistence (resets on page refresh)
 */
interface ToolCallState {
  toolCalls: ToolCall[]
  addToolCall: (toolCall: ToolCall) => void
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void
  clearToolCalls: () => void
  getToolCall: (id: string) => ToolCall | undefined
}

export const useToolCallStore = create<ToolCallState>((set, get) => ({
  toolCalls: [],

  /**
   * Add a new tool call to the history
   */
  addToolCall: (toolCall) =>
    set((state) => ({
      toolCalls: [...state.toolCalls, toolCall]
    })),

  /**
   * Update an existing tool call
   * Used to update status, results, or error messages
   */
  updateToolCall: (id, updates) =>
    set((state) => ({
      toolCalls: state.toolCalls.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc))
    })),

  /**
   * Clear all tool calls from history
   */
  clearToolCalls: () => set({ toolCalls: [] }),

  /**
   * Get a specific tool call by ID
   */
  getToolCall: (id) => {
    return get().toolCalls.find((tc) => tc.id === id)
  }
}))

/**
 * Helper function to create a new tool call object
 */
export function createToolCall(
  name: string,
  args: Record<string, any>,
  status: ToolCall['status'] = 'pending'
): ToolCall {
  return {
    id: `tool-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    arguments: args,
    status,
    startTime: Date.now()
  }
}

/**
 * Helper function to mark a tool call as running
 */
export function markToolCallRunning(id: string) {
  useToolCallStore.getState().updateToolCall(id, {
    status: 'running'
  })
}

/**
 * Helper function to mark a tool call as success
 */
export function markToolCallSuccess(id: string, result: any) {
  useToolCallStore.getState().updateToolCall(id, {
    status: 'success',
    result,
    endTime: Date.now()
  })
}

/**
 * Helper function to mark a tool call as error
 */
export function markToolCallError(id: string, error: string) {
  useToolCallStore.getState().updateToolCall(id, {
    status: 'error',
    error,
    endTime: Date.now()
  })
}
