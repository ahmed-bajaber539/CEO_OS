import type { IMemoryStore, AIMessage } from './types'

const STORAGE_PREFIX = 'executive_ai_'

/**
 * LocalStorageMemoryStore — v1.0 implementation.
 *
 * Stores conversation messages, preferences, and session context in localStorage.
 * Designed to be swapped with SupabaseMemoryStore later via the same IMemoryStore interface.
 *
 * Stored data categories:
 *  - messages.<conversationId>  → AIMessage[]
 *  - conversations              → Conversation[]
 *  - preferences                → User preferences (language, tone)
 *  - session                    → Recent context (last actions, patterns)
 */
export class LocalStorageMemoryStore implements IMemoryStore {
  private prefix: string

  constructor(prefix?: string) {
    this.prefix = prefix ?? STORAGE_PREFIX
  }

  private key(k: string): string {
    return `${this.prefix}${k}`
  }

  async remember(key: string, value: unknown): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(this.key(key), serialized)
    } catch (err) {
      console.error(`[MemoryStore] Failed to store "${key}":`, err)
    }
  }

  async recall<T>(key: string): Promise<T | undefined> {
    try {
      const raw = localStorage.getItem(this.key(key))
      if (raw === null) return undefined
      return JSON.parse(raw) as T
    } catch (err) {
      console.error(`[MemoryStore] Failed to recall "${key}":`, err)
      return undefined
    }
  }

  async forget(key: string): Promise<void> {
    localStorage.removeItem(this.key(key))
  }

  async getAll(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(this.prefix)) {
        const shortKey = k.slice(this.prefix.length)
        result[shortKey] = await this.recall(shortKey)
      }
    }
    return result
  }

  async clear(): Promise<void> {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(this.prefix)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  }

  // ── Convenience Methods ──────────────────────────────────────

  /** Store conversation messages */
  async rememberMessages(conversationId: string, messages: AIMessage[]): Promise<void> {
    await this.remember(`messages.${conversationId}`, messages)
  }

  /** Recall conversation messages */
  async recallMessages(conversationId: string): Promise<AIMessage[]> {
    return (await this.recall<AIMessage[]>(`messages.${conversationId}`)) ?? []
  }

  /** Forget conversation messages */
  async forgetMessages(conversationId: string): Promise<void> {
    await this.forget(`messages.${conversationId}`)
  }

  /** Store user preferences */
  async rememberPreferences(prefs: Record<string, unknown>): Promise<void> {
    await this.remember('preferences', prefs)
  }

  /** Recall user preferences */
  async recallPreferences(): Promise<Record<string, unknown>> {
    return (await this.recall<Record<string, unknown>>('preferences')) ?? {}
  }

  /** Store session context (last N actions) */
  async rememberSessionContext(context: unknown[]): Promise<void> {
    await this.remember('session_context', context)
  }

  /** Recall session context */
  async recallSessionContext(): Promise<unknown[]> {
    return (await this.recall<unknown[]>('session_context')) ?? []
  }
}
