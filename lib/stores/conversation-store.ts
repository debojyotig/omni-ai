/**
 * Conversation Store
 *
 * Manages multiple conversations with persistence to localStorage.
 * Supports creating, switching, deleting conversations.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface ConversationStore {
  conversations: Conversation[]
  activeConversationId: string | null

  // Actions
  createConversation: () => string
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateConversationTitle: (id: string, title: string) => void
  getActiveConversation: () => Conversation | null
  clearAllConversations: () => void
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: () => {
        const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
        const newConversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }))

        return id
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          const newActiveId =
            state.activeConversationId === id
              ? filtered[0]?.id ?? null
              : state.activeConversationId

          return {
            conversations: filtered,
            activeConversationId: newActiveId,
          }
        })
      },

      setActiveConversation: (id: string) => {
        set({ activeConversationId: id })
      },

      addMessage: (conversationId: string, message: Message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: Date.now(),
                  // Auto-generate title from first user message
                  title:
                    conv.messages.length === 0 && message.role === 'user'
                      ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                      : conv.title,
                }
              : conv
          ),
        }))
      },

      updateConversationTitle: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, title, updatedAt: Date.now() }
              : conv
          ),
        }))
      },

      getActiveConversation: () => {
        const state = get()
        return (
          state.conversations.find((c) => c.id === state.activeConversationId) ?? null
        )
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null })
      },
    }),
    {
      name: 'omni-ai-conversations',
    }
  )
)
