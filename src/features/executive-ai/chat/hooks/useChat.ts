import { useRef, useCallback, useEffect } from 'react'
import { bootstrapExecutiveAI } from '../../core/index'
import { SupabaseMemoryStore } from '../../core/supabase-memory-store'
import { useExecutiveAIStore } from '../../stores/executive-ai'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '../../core/types'

/**
 * useChat — the bridge between React UI and the AI Core Layer.
 *
 * Responsibilities:
 *  - Initialize AI Core with Supabase memory when authenticated
 *  - Load/save conversations from Supabase (per-user isolation)
 *  - Handle auth state changes: reload memory on login, clear on logout
 *  - Expose sendMessage, stopGeneration, switchConversation, etc.
 */
export function useChat() {
  const store = useExecutiveAIStore()
  const coreRef = useRef<ReturnType<typeof bootstrapExecutiveAI> | null>(null)
  const loadedRef = useRef(false)

  // Lazy-init the AI Core (once)
  function getCore() {
    if (!coreRef.current) {
      coreRef.current = bootstrapExecutiveAI(supabase)
    }
    return coreRef.current
  }

  // Load conversations from Supabase on mount & auth changes
  useEffect(() => {
    const loadConversations = async () => {
      const core = getCore()
      if (core.memory instanceof SupabaseMemoryStore) {
        const saved = await core.memory.recallConversations()
        if (saved.length > 0) {
          store.setConversations(saved)
        }
        loadedRef.current = true
      } else {
        const saved = await core.memory.recall<Conversation[]>('conversations') ?? []
        if (saved.length > 0) {
          store.setConversations(saved)
        }
        loadedRef.current = true
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        coreRef.current = null
        await loadConversations()
      } else if (event === 'SIGNED_OUT') {
        coreRef.current = null
        store.setConversations([])
        store.setMessages([])
        store.setActiveConversation(null)
        loadedRef.current = false
      }
    })

    if (!loadedRef.current) {
      loadConversations()
    }

    return () => subscription.unsubscribe()
  }, [])

  // ── Send Message ──────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || store.isStreaming) return

      const core = getCore()

      let conversationId: string
      if (!store.activeConversationId) {
        conversationId = store.newConversation()
        if (core.memory instanceof SupabaseMemoryStore) {
          await core.memory.createConversation(conversationId, 'محادثة جديدة')
        }
      } else {
        conversationId = store.activeConversationId
      }

      store.addMessage({ role: 'user', content })
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
              break
            case 'tool_call':
              break
            case 'tool_result':
              break
            case 'tool_confirmation_needed':
              store.setPendingConfirmation({
                toolName: event.toolName,
                toolArgs: event.args,
              })
              break
            case 'done':
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
        if (core.memory instanceof SupabaseMemoryStore) {
          await core.memory.rememberConversations(store.conversations)
        } else {
          await core.memory.remember('conversations', store.conversations)
        }
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
    async (id: string) => {
      const core = getCore()
      store.setActiveConversation(id)
      const messages = await core.memory.recallMessages(id)
      store.setMessages(messages ?? [])
      store.clearStreamingContent()
      store.setSuggestedActions([])
      store.setCurrentIntent(null)
    },
    [],
  )

  const newConversation = useCallback(async () => {
    const core = getCore()
    const id = store.newConversation()
    if (core.memory instanceof SupabaseMemoryStore) {
      await core.memory.createConversation(id, 'محادثة جديدة')
      await core.memory.rememberConversations(store.conversations)
    } else {
      await core.memory.remember('conversations', store.conversations)
    }
    return id
  }, [store.conversations])

  const clearConversation = useCallback(async () => {
    const core = getCore()
    const id = store.activeConversationId
    if (id) {
      await core.memory.forgetMessages(id)
      store.clearMessages()
    }
  }, [store.activeConversationId])

  const deleteConversation = useCallback(
    async (id: string) => {
      const core = getCore()
      if (core.memory instanceof SupabaseMemoryStore) {
        await core.memory.deleteConversation(id)
      } else {
        await core.memory.forgetMessages(id)
      }
      const updated = store.conversations.filter((c) => c.id !== id)
      store.setConversations(updated)
      if (core.memory instanceof SupabaseMemoryStore) {
        await core.memory.rememberConversations(updated)
      } else {
        await core.memory.remember('conversations', updated)
      }
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

  return {
    conversations: store.conversations,
    activeConversationId: store.activeConversationId,
    messages: store.messages,
    isStreaming: store.isStreaming,
    streamingContent: store.streamingContent,
    currentIntent: store.currentIntent,
    suggestedActions: store.suggestedActions,
    pendingConfirmation: store.pendingConfirmation,
    sendMessage,
    stopGeneration,
    switchConversation,
    newConversation,
    clearConversation,
    deleteConversation,
    setPendingConfirmation: store.setPendingConfirmation,
  }
}
