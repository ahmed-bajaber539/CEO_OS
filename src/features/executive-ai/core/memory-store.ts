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

  remember(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(this.key(key), serialized)
    } catch (err) {
      console.error(`[MemoryStore] Failed to store "${key}":`, err)
    }
  }

  recall<T>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(this.key(key))
      if (raw === null) return undefined
      return JSON.parse(raw) as T
    } catch (err) {
      console.error(`[MemoryStore] Failed to recall "${key}":`, err)
      return undefined
    }
  }

  forget(key: string): void {
    localStorage.removeItem(this.key(key))
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(this.prefix)) {
        const shortKey = k.slice(this.prefix.length)
        result[shortKey] = this.recall(shortKey)
      }
    }
    return result
  }

  clear(): void {
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
  rememberMessages(conversationId: string, messages: AIMessage[]): void {
    // Truncate to max (policy managed by caller or config)
    this.remember(`messages.${conversationId}`, messages)
  }

  /** Recall conversation messages */
  recallMessages(conversationId: string): AIMessage[] {
    return this.recall<AIMessage[]>(`messages.${conversationId}`) ?? []
  }

  /** Forget conversation messages */
  forgetMessages(conversationId: string): void {
    this.forget(`messages.${conversationId}`)
  }

  /** Store user preferences */
  rememberPreferences(prefs: Record<string, unknown>): void {
    this.remember('preferences', prefs)
  }

  /** Recall user preferences */
  recallPreferences(): Record<string, unknown> {
    return this.recall<Record<string, unknown>>('preferences') ?? {}
  }

  /** Store session context (last N actions) */
  rememberSessionContext(context: unknown[]): void {
    this.remember('session_context', context)
  }

  /** Recall session context */
  recallSessionContext(): unknown[] {
    return this.recall<unknown[]>('session_context') ?? []
  }
}
