import { useRef, useCallback } from 'react'
import { bootstrapExecutiveAI } from '../../core/index'
import { useExecutiveAIStore } from '../../stores/executive-ai'
import type { Conversation } from '../../core/types'

/**
 * useChat — the bridge between React UI and the AI Core Layer.
 *
 * Responsibilities:
 *  - Initialize the AI Core once (via ref)
 *  - Expose `sendMessage`, `stopGeneration`, `switchConversation`, `newConversation`
 *  - Handle the streaming event loop and update the Zustand store
 *  - Load/save conversations from MemoryStore
 */
export function useChat() {
  const store = useExecutiveAIStore()
  const coreRef = useRef<ReturnType<typeof bootstrapExecutiveAI> | null>(null)

  // Lazy-init the AI Core (once)
  function getCore() {
    if (!coreRef.current) {
      coreRef.current = bootstrapExecutiveAI()
      // Load saved conversations from memory
      const saved = coreRef.current.memory.recall<Conversation[]>('conversations') ?? []
      if (saved.length > 0) {
        store.setConversations(saved)
      }
    }
    return coreRef.current
  }

  // ── Send Message ──────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || store.isStreaming) return

      const core = getCore()

      // Auto-create conversation if none active
      const conversationId: string = store.activeConversationId ?? store.newConversation()

      // Add user message to UI
      store.addMessage({ role: 'user', content })

      // Start streaming
      store.setStreaming(true)
      store.clearStreamingContent()
      store.setSuggestedActions([])
      store.setCurrentIntent(null)

      try {
        const stream = core.conversationManager.processMessage(conversationId, content)
        let assistantContent = ''

        for await (const event of stream) {
          switch (event.type) {
            case 'intent':
              store.setCurrentIntent({
                capability: event.intent.capability as any,
                confidence: event.intent.confidence,
                contextScope: { include: [] },
                isAmbiguous: event.intent.isAmbiguous,
              })
              break

            case 'token':
              assistantContent += event.content
              store.appendStreamingContent(event.content)
              break

            case 'context':
              // Context built — transparent to user, could show loading state
              break

            case 'tool_call':
              // Tool calls handled invisibly — LLM processes results internally
              break

            case 'tool_result':
              // Tool results are internal — skip UI for now
              break

            case 'tool_confirmation_needed':
              // Destructive action needs user approval (human-in-the-loop)
              store.setPendingConfirmation({
                toolName: event.toolName,
                toolArgs: event.args,
              })
              break

            case 'done':
              // Add the complete assistant message
              if (assistantContent) {
                store.addMessage({ role: 'assistant', content: assistantContent })
              }
              store.clearStreamingContent()
              store.setSuggestedActions(event.suggestedActions)
              break

            case 'error':
              store.addMessage({
                role: 'assistant',
                content: `⚠️ عذراً، حدث خطأ: ${event.error}`,
              })
              store.clearStreamingContent()
              break
          }
        }
      } catch (err: any) {
        store.addMessage({
          role: 'assistant',
          content: `⚠️ عذراً، حدث خطأ غير متوقع: ${err.message}`,
        })
        store.clearStreamingContent()
      } finally {
        store.setStreaming(false)
        // Persist conversations list
        core.memory.remember('conversations', store.conversations)
      }
    },
    [store.isStreaming, store.activeConversationId],
  )

  // ── Stop Generation ───────────────────────────────────────

  const stopGeneration = useCallback(() => {
    const core = coreRef.current
    if (core) {
      core.conversationManager.abort()
    }
    store.setStreaming(false)
    store.clearStreamingContent()
  }, [])

  // ── Conversation Management ───────────────────────────────

  const switchConversation = useCallback(
    (id: string) => {
      const core = getCore()
      store.setActiveConversation(id)
      const messages = core.memory.recallMessages(id)
      store.setMessages(messages ?? [])
      store.clearStreamingContent()
      store.setSuggestedActions([])
      store.setCurrentIntent(null)
    },
    [],
  )

  const newConversation = useCallback(() => {
    const core = getCore()
    const id = store.newConversation()
    core.memory.remember('conversations', store.conversations)
    return id
  }, [store.conversations])

  const clearConversation = useCallback(() => {
    const core = getCore()
    const id = store.activeConversationId
    if (id) {
      core.memory.forgetMessages(id)
      store.clearMessages()
    }
  }, [store.activeConversationId])

  const deleteConversation = useCallback(
    (id: string) => {
      const core = getCore()
      core.memory.forgetMessages(id)
      const updated = store.conversations.filter((c) => c.id !== id)
      store.setConversations(updated)
      core.memory.remember('conversations', updated)
      if (store.activeConversationId === id) {
        const next = updated[0]
        if (next) {
          switchConversation(next.id)
        } else {
          store.setActiveConversation(null)
          store.setMessages([])
          store.setSuggestedActions([])
          store.setCurrentIntent(null)
        }
      }
    },
    [store.activeConversationId, store.conversations],
  )

  // ── Return ────────────────────────────────────────────────

  return {
    // State (from store)
    conversations: store.conversations,
    activeConversationId: store.activeConversationId,
    messages: store.messages,
    isStreaming: store.isStreaming,
    streamingContent: store.streamingContent,
    currentIntent: store.currentIntent,
    suggestedActions: store.suggestedActions,
    pendingConfirmation: store.pendingConfirmation,

    // Actions
    sendMessage,
    stopGeneration,
    switchConversation,
    newConversation,
    clearConversation,
    deleteConversation,

    // Direct store access for simple updates
    setPendingConfirmation: store.setPendingConfirmation,
  }
}
