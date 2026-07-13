import { create } from 'zustand'
import type { AIMessage, Conversation, ResolvedIntent, ToolCall } from '../core/types'

// ─── ID Generator ──────────────────────────────────────────────

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ─── Store Interface ───────────────────────────────────────────

interface ExecutiveAIState {
  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null

  // Messages for active conversation
  messages: AIMessage[]

  // Streaming state
  isStreaming: boolean
  streamingContent: string

  // Current intent (for UI transparency)
  currentIntent: ResolvedIntent | null

  // Suggested actions (shown after assistant response)
  suggestedActions: string[]

  // Pending tool confirmation (human-in-the-loop)
  pendingConfirmation: {
    toolName: string
    toolArgs: Record<string, unknown>
  } | null

  // ── Actions ──────────────────────────────────────────────────

  /** Set the full conversations list (from memory) */
  setConversations: (conversations: Conversation[]) => void

  /** Switch to a conversation and load its messages */
  setActiveConversation: (id: string | null) => void

  /** Add a single message to the active conversation */
  addMessage: (message: AIMessage) => void

  /** Replace all messages (e.g., on conversation switch) */
  setMessages: (messages: AIMessage[]) => void

  /** Append a streaming token to the current assistant message */
  appendStreamingContent: (token: string) => void

  /** Start/stop streaming mode */
  setStreaming: (streaming: boolean) => void

  /** Reset streaming content (called at start of new response) */
  clearStreamingContent: () => void

  /** Set the resolved intent for the current message */
  setCurrentIntent: (intent: ResolvedIntent | null) => void

  /** Set suggested action chips */
  setSuggestedActions: (actions: string[]) => void

  /** Queue a tool call that needs user confirmation */
  setPendingConfirmation: (
    confirmation: { toolName: string; toolArgs: Record<string, unknown> } | null,
  ) => void

  /** Create a new conversation and make it active */
  newConversation: () => string

  /** Clear messages for the active conversation */
  clearMessages: () => void
}

// ─── Store ─────────────────────────────────────────────────────

export const useExecutiveAIStore = create<ExecutiveAIState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  currentIntent: null,
  suggestedActions: [],
  pendingConfirmation: null,

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) => set({ messages }),

  appendStreamingContent: (token) =>
    set((state) => ({ streamingContent: state.streamingContent + token })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setCurrentIntent: (intent) => set({ currentIntent: intent }),

  setSuggestedActions: (actions) => set({ suggestedActions: actions }),

  setPendingConfirmation: (confirmation) => set({ pendingConfirmation: confirmation }),

  newConversation: () => {
    const id = generateId()
    const now = new Date().toISOString()
    const conv: Conversation = {
      id,
      title: 'محادثة جديدة',
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: id,
      messages: [],
      streamingContent: '',
      suggestedActions: [],
      currentIntent: null,
    }))
    return id
  },

  clearMessages: () =>
    set({ messages: [], streamingContent: '', suggestedActions: [] }),
}))
