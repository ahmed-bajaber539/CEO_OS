// ─── Types ────────────────────────────────────────────────────
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
} from './types'

// ─── Manifest ─────────────────────────────────────────────────
export { executiveManifest } from './agent-manifest'

// ─── Capabilities ─────────────────────────────────────────────
export { AGENT_CAPABILITIES } from './agent-config'

// ─── Intent Resolver ──────────────────────────────────────────
export { KeywordIntentResolver } from './intent-resolver'

// ─── Tool Registry ────────────────────────────────────────────
export { ToolRegistry, createToolRegistry } from './tool-registry'

// ─── Tool Executor ────────────────────────────────────────────
export { ToolExecutor } from './tool-executor'

// ─── Memory Store ─────────────────────────────────────────────
export { LocalStorageMemoryStore } from './memory-store'

// ─── Context Builder ──────────────────────────────────────────
export { SmartContextBuilder } from './context-builder'

// ─── LLM Provider ─────────────────────────────────────────────
export { DeepSeekLLMProvider } from './llm-provider'

// ─── Conversation Manager ─────────────────────────────────────
export { ConversationManager } from './conversation-manager'
export type { ConversationEvent } from './conversation-manager'

// ─── Bootstrap ────────────────────────────────────────────────

import { executiveManifest } from './agent-manifest'
import { AGENT_CAPABILITIES } from './agent-config'
import { KeywordIntentResolver } from './intent-resolver'
import { createToolRegistry } from './tool-registry'
import { ToolExecutor } from './tool-executor'
import { LocalStorageMemoryStore } from './memory-store'
import { SmartContextBuilder } from './context-builder'
import { DeepSeekLLMProvider } from './llm-provider'
import { ConversationManager } from './conversation-manager'

/**
 * Bootstrap the full AI Core stack.
 *
 * This is the single entry point for initializing the Executive AI.
 * Every dependency is wired here — the rest of the app just calls `bootstrapExecutiveAI()`.
 *
 * For multi-agent future: call `bootstrapExecutiveAI()` with a different manifest.
 */
export function bootstrapExecutiveAI() {
  const manifest = executiveManifest
  const capabilities = AGENT_CAPABILITIES
  const intentResolver = new KeywordIntentResolver()
  const toolRegistry = createToolRegistry()
  const toolExecutor = new ToolExecutor(toolRegistry, manifest)
  const memory = new LocalStorageMemoryStore()
  const contextBuilder = new SmartContextBuilder(manifest)
  const llmProvider = new DeepSeekLLMProvider(manifest)

  const conversationManager = new ConversationManager({
    manifest,
    capabilities,
    intentResolver,
    contextBuilder,
    toolRegistry,
    toolExecutor,
    llmProvider,
    memory,
  })

  return {
    manifest,
    capabilities,
    intentResolver,
    toolRegistry,
    toolExecutor,
    memory,
    contextBuilder,
    llmProvider,
    conversationManager,
  }
}
