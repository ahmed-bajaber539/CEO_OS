import type { SupabaseClient } from '@supabase/supabase-js'
import type { IMemoryStore, AIMessage, Conversation } from './types'

/**
 * SupabaseMemoryStore — v1.3 implementation.
 *
 * Stores conversation messages, preferences, and session context in Supabase.
 * Each user's data is isolated via RLS (auth.uid() = user_id).
 *
 * This replaces LocalStorageMemoryStore for authenticated users, enabling:
 *  - Cross-device conversation sync
 *  - Per-account data isolation
 *  - Server-side persistence
 */
export class SupabaseMemoryStore implements IMemoryStore {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // ── Key-Value (used for conversations list, preferences, session) ──

  async remember(key: string, value: unknown): Promise<void> {
    const { error } = await this.supabase
      .from('settings')
      .upsert({ settings: { [key]: value } as any }, { onConflict: 'user_id' } as any)

    if (error) {
      console.error(`[SupabaseMemoryStore] Failed to store "${key}":`, error)
    }
  }

  async recall<T>(key: string): Promise<T | undefined> {
    const { data, error } = await this.supabase
      .from('settings')
      .select('settings')
      .single()

    if (error || !data?.settings) return undefined

    const settings = data.settings as Record<string, unknown>
    return settings[key] as T | undefined
  }

  async forget(key: string): Promise<void> {
    const current = await this.recall<Record<string, unknown>>('__all__') ?? {}
    delete current[key]
    await this.supabase
      .from('settings')
      .upsert({ settings: current as any }, { onConflict: 'user_id' } as any)
  }

  async getAll(): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .from('settings')
      .select('settings')
      .single()

    if (error || !data?.settings) return {}
    return data.settings as Record<string, unknown>
  }

  async clear(): Promise<void> {
    const keys = await this.supabase
      .from('settings')
      .select('user_id')
      .single()

    if (keys.data) {
      await this.supabase
        .from('settings')
        .update({ settings: {} as any })
        .eq('user_id', keys.data.user_id)
    }
  }

  // ── Conversation Methods ──────────────────────────────────────

  async rememberMessages(conversationId: string, messages: AIMessage[]): Promise<void> {
    // Validate conversation belongs to user (RLS handles this)
    const { data: conv } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single()

    if (!conv) return // Conversation doesn't exist or doesn't belong to user

    // Delete old messages for this conversation
    await this.supabase
      .from('conversation_messages')
      .delete()
      .eq('conversation_id', conversationId)

    // Insert new messages
    const rows = messages.map((msg, i) => ({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      tool_calls: msg.tool_calls ?? null,
      tool_call_id: msg.tool_call_id ?? null,
      name: msg.name ?? null,
      sort_order: i,
    }))

    const { error } = await this.supabase
      .from('conversation_messages')
      .insert(rows as any)

    if (error) {
      console.error(`[SupabaseMemoryStore] Failed to store messages:`, error)
    }

    // Update conversation's updated_at
    await this.supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }

  async recallMessages(conversationId: string): Promise<AIMessage[]> {
    const { data, error } = await this.supabase
      .from('conversation_messages')
      .select('role, content, tool_calls, tool_call_id, name')
      .eq('conversation_id', conversationId)
      .order('sort_order', { ascending: true })

    if (error || !data) return []

    return data.map((row: any) => ({
      role: row.role,
      content: row.content,
      tool_calls: row.tool_calls ?? undefined,
      tool_call_id: row.tool_call_id ?? undefined,
      name: row.name ?? undefined,
    }))
  }

  async forgetMessages(conversationId: string): Promise<void> {
    await this.supabase
      .from('conversation_messages')
      .delete()
      .eq('conversation_id', conversationId)
  }

  // ── Conversation List (backed by conversations table) ─────────

  async rememberConversations(conversations: Conversation[]): Promise<void> {
    // Store the conversations list in settings for now
    // Individual conversations are managed by the store/user via rememberMessages
    await this.remember('conversations', conversations)
  }

  async recallConversations(): Promise<Conversation[]> {
    // First try the conversations table (new approach)
    const { data, error } = await this.supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    }

    // Fallback to settings key
    return (await this.recall<Conversation[]>('conversations')) ?? []
  }

  async createConversation(id: string, title: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session) return

    const { error } = await this.supabase
      .from('conversations')
      .insert({ id, title, user_id: session.user.id })

    if (error) {
      console.error(`[SupabaseMemoryStore] Failed to create conversation:`, error)
    }
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    await this.supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  async deleteConversation(id: string): Promise<void> {
    // Messages are cascade-deleted via FK
    await this.supabase
      .from('conversations')
      .delete()
      .eq('id', id)
  }
}
