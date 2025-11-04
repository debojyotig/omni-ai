/**
 * Conversation Store
 *
 * Manages multiple conversations with hybrid persistence:
 * - In-memory Zustand store for fast access
 * - LibSQL database for cross-browser persistence
 * - Async methods for database operations
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getConversationDBStore } from '@/lib/storage/conversation-db-store'

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

  // Sync actions (in-memory only)
  createConversation: () => string
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateConversationTitle: (id: string, title: string) => void
  getActiveConversation: () => Conversation | null
  clearAllConversations: () => void
  setConversations: (conversations: Conversation[]) => void

  // Async database methods
  loadFromDatabase: (resourceId?: string) => Promise<void>
  syncCreateConversation: (id: string, title: string, resourceId?: string) => Promise<void>
  syncDeleteConversation: (id: string, resourceId?: string) => Promise<void>
  syncAddMessage: (conversationId: string, message: Message, resourceId?: string) => Promise<void>
  syncUpdateConversationTitle: (id: string, title: string, resourceId?: string) => Promise<void>
}

interface ConversationStoreWithRehydrate extends ConversationStore {
  _hasHydrated?: boolean
  setHasHydrated?: (state: boolean) => void
}

export const useConversationStore = create<ConversationStoreWithRehydrate>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

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

      setConversations: (conversations: Conversation[]) => {
        set({ conversations })
      },

      loadFromDatabase: async (resourceId: string = 'default-user') => {
        try {
          const db = getConversationDBStore()
          const dbConversations = await db.getConversations(resourceId)
          const conversations: Conversation[] = []

          for (const dbConv of dbConversations) {
            const result = await db.getConversation(dbConv.id, resourceId)
            if (result) {
              conversations.push({
                id: result.conversation.id,
                title: result.conversation.title,
                messages: result.messages.map((msg) => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp,
                })),
                createdAt: new Date(result.conversation.createdAt).getTime(),
                updatedAt: new Date(result.conversation.updatedAt).getTime(),
              })
            }
          }

          set({ conversations })
        } catch (error) {
          console.error('[ConversationStore] Failed to load from database:', error)
        }
      },

      syncCreateConversation: async (id: string, title: string, resourceId: string = 'default-user') => {
        try {
          const db = getConversationDBStore()
          await db.createConversation(id, title, resourceId)
        } catch (error) {
          console.error('[ConversationStore] Failed to sync create:', error)
        }
      },

      syncDeleteConversation: async (id: string, resourceId: string = 'default-user') => {
        try {
          const db = getConversationDBStore()
          await db.deleteConversation(id, resourceId)
        } catch (error) {
          console.error('[ConversationStore] Failed to sync delete:', error)
        }
      },

      syncAddMessage: async (
        conversationId: string,
        message: Message,
        resourceId: string = 'default-user'
      ) => {
        try {
          const db = getConversationDBStore()
          await db.addMessage(
            conversationId,
            message.id,
            message.role,
            message.content,
            message.timestamp,
            resourceId
          )
        } catch (error) {
          console.error('[ConversationStore] Failed to sync message:', error)
        }
      },

      syncUpdateConversationTitle: async (
        id: string,
        title: string,
        resourceId: string = 'default-user'
      ) => {
        try {
          const db = getConversationDBStore()
          await db.updateConversationTitle(id, title, resourceId)
        } catch (error) {
          console.error('[ConversationStore] Failed to sync title update:', error)
        }
      },
    }),
    {
      name: 'omni-ai-conversations',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true
        }
      },
    }
  )
)
