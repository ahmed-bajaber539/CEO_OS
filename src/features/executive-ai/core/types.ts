// ─── Domain Types ───────────────────────────────────────────────

export type CapabilityId =
  | 'planning'
  | 'reflection'
  | 'prioritization'
  | 'strategy'
  | 'analysis'
  | 'general'

export interface AgentManifest {
  name: string
  version: string
  description: string
  provider: {
    type: 'deepseek'
    model: string
    edgeFunction: string
  }
  system: {
    basePrompt: string
    personality: string
    tone: 'formal' | 'professional' | 'friendly'
    language: 'ar' | 'en' | 'bilingual'
  }
  policies: {
    requireConfirmation: string[]
    maxToolsPerTurn: number
    maxConversationTurns: number
    allowDestructiveActions: boolean
  }
  memory: {
    store: 'localStorage' | 'supabase'
    maxMessagesPerConversation: number
    persistPreferences: boolean
  }
  context: {
    defaultScope: CapabilityId
    maxContextTokens: number
    includeTimestamp: boolean
  }
  constraints: {
    maxResponseLength: number
    allowedDomains: string[]
  }
}

export interface AgentCapability {
  id: CapabilityId
  name: string
  description: string
  promptExtension: string
  suggestedActions: string[]
  dependsOn?: CapabilityId[]
}

// ─── Message Types ────────────────────────────────────────────

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface ToolResult {
  name: string
  result: unknown | null
  error: string | null
}

export interface ToolDefinition {
  name: string
  category: string
  capabilities: CapabilityId[]
  description: string
  requiresConfirmation?: boolean
  schema: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<unknown>
}

// ─── Context Types ────────────────────────────────────────────

export interface ContextScope {
  include: string[]
  timeRange?: 'current' | 'week' | 'month' | 'all'
}

export interface AIContext {
  timestamp: string
  date: string
  dayOfWeek: string
  dashboard: {
    activeProjects: number
    todayTasksDone: number
    todayTasksTotal: number
    annualGoals: number
    totalDecisions: number
  }
  goals?: unknown
  activeProjects?: unknown[]
  dailyPlan?: unknown
  ideas?: unknown
  decisions?: unknown[]
  metrics?: unknown[]
  recentActivity?: unknown[]
  progressSummary?: unknown
}

// ─── Intent Types ─────────────────────────────────────────────

export interface ResolvedIntent {
  capability: CapabilityId
  confidence: number
  contextScope: ContextScope
  isAmbiguous: boolean
}

// ─── SSE Types ────────────────────────────────────────────────

export type SSEEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall }
  | { type: 'done' }
  | { type: 'error'; error: string }

// ─── Conversation Types ───────────────────────────────────────

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

// ─── Core Interfaces ──────────────────────────────────────────

export interface IIntentResolver {
  resolve(message: string, history?: AIMessage[]): Promise<ResolvedIntent>
}

export interface IContextProvider {
  build(scope: ContextScope): Promise<AIContext>
}

export interface IToolRegistry {
  register(tool: ToolDefinition): void
  freeze(): void
  getAll(): ToolDefinition[]
  getByCategory(category: string): ToolDefinition[]
  getForCapability(capability: CapabilityId): ToolDefinition[]
  getTool(name: string): ToolDefinition | undefined
}

export interface IToolExecutor {
  execute(toolCall: ToolCall): Promise<ToolResult>
}

export interface ILLMProvider {
  chat(
    systemPrompt: string,
    messages: AIMessage[],
    context: AIContext,
    tools: ToolDefinition[],
  ): AsyncIterable<SSEEvent>
}

export interface IMemoryStore {
  remember(key: string, value: unknown): Promise<void>
  recall<T>(key: string): Promise<T | undefined>
  forget(key: string): Promise<void>
  getAll(): Promise<Record<string, unknown>>
  clear(): Promise<void>

  /** Store conversation messages by ID */
  rememberMessages(conversationId: string, messages: AIMessage[]): Promise<void>
  /** Retrieve conversation messages by ID */
  recallMessages(conversationId: string): Promise<AIMessage[]>
  /** Delete all messages for a conversation */
  forgetMessages(conversationId: string): Promise<void>
}
