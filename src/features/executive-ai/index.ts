// ─── Core Layer ────────────────────────────────────────────────
export {
  bootstrapExecutiveAI,
  executiveManifest,
  AGENT_CAPABILITIES,
  KeywordIntentResolver,
  ToolRegistry,
  createToolRegistry,
  ToolExecutor,
  LocalStorageMemoryStore,
  SupabaseMemoryStore,
  SmartContextBuilder,
  DeepSeekLLMProvider,
  ConversationManager,
} from './core/index'

export type {
  CapabilityId,
  AgentManifest,
  AgentCapability,
  AIMessage,
  ToolCall,
  ToolResult,
  ToolDefinition,
  ContextScope,
  AIContext,
  ResolvedIntent,
  SSEEvent,
  Conversation,
  IIntentResolver,
  IContextProvider,
  IToolRegistry,
  IToolExecutor,
  ILLMProvider,
  IMemoryStore,
  ConversationEvent,
} from './core/index'

// ─── Chat UI ───────────────────────────────────────────────────
export { useChat } from './chat/hooks/useChat'
export { useExecutiveAIStore } from './stores/executive-ai'
export { default as ExecutiveAIPage } from './chat/ExecutiveAIPage'
