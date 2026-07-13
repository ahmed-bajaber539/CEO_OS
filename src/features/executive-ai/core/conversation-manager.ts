import type {
  AgentManifest,
  AgentCapability,
  AIMessage,
  ToolCall,
  ToolResult,
  SSEEvent,
  IIntentResolver,
  IContextProvider,
  IMemoryStore,
} from './types'
import type { ToolRegistry } from './tool-registry'
import type { ToolExecutor } from './tool-executor'
import type { DeepSeekLLMProvider } from './llm-provider'

// ─── Conversation Event ────────────────────────────────────────

/**
 * Events emitted by the ConversationManager during message processing.
 * The UI (chat hook) consumes these to update the store and render.
 */
export type ConversationEvent =
  | { type: 'intent'; intent: { capability: string; confidence: number; isAmbiguous: boolean } }
  | { type: 'context' }
  | { type: 'token'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'tool_confirmation_needed'; toolName: string; args: Record<string, unknown> }
  | { type: 'done'; suggestedActions: string[] }
  | { type: 'error'; error: string }

// ─── Conversation Manager ──────────────────────────────────────

/**
 * ConversationManager — stateless orchestrator.
 *
 * Orchestrates the full pipeline for a single user message:
 *   Intent → Context → Tools → Memory → Prompt → LLM Stream → Memory
 *
 * Stateless design: all state lives in MemoryStore + the UI store.
 * The manager is a pure pipeline — receives deps in constructor, processes in method.
 */
export class ConversationManager {
  private manifest: AgentManifest
  private capabilities: AgentCapability[]
  private intentResolver: IIntentResolver
  private contextBuilder: IContextProvider
  private toolRegistry: ToolRegistry
  private toolExecutor: ToolExecutor
  private llmProvider: DeepSeekLLMProvider
  private memory: IMemoryStore

  constructor(deps: {
    manifest: AgentManifest
    capabilities: AgentCapability[]
    intentResolver: IIntentResolver
    contextBuilder: IContextProvider
    toolRegistry: ToolRegistry
    toolExecutor: ToolExecutor
    llmProvider: DeepSeekLLMProvider
    memory: IMemoryStore
  }) {
    this.manifest = deps.manifest
    this.capabilities = deps.capabilities
    this.intentResolver = deps.intentResolver
    this.contextBuilder = deps.contextBuilder
    this.toolRegistry = deps.toolRegistry
    this.toolExecutor = deps.toolExecutor
    this.llmProvider = deps.llmProvider
    this.memory = deps.memory
  }

  /**
   * Process a user message through the full AI pipeline.
   *
   * @returns AsyncGenerator of ConversationEvents — consume with `for await`
   */
  async *processMessage(
    conversationId: string,
    userMessage: string,
  ): AsyncGenerator<ConversationEvent> {
    // ── 1. Recall conversation history ───────────────────────
    const history: AIMessage[] = this.memory.recallMessages(conversationId) ?? []

    // ── 2. Resolve intent ───────────────────────────────────
    const resolved = await this.intentResolver.resolve(userMessage, history)
    yield {
      type: 'intent',
      intent: {
        capability: resolved.capability,
        confidence: resolved.confidence,
        isAmbiguous: resolved.isAmbiguous,
      },
    }

    // ── 3. Build context ────────────────────────────────────
    const context = await this.contextBuilder.build(resolved.contextScope)
    yield { type: 'context' }

    // ── 4. Get capability-scoped tools ──────────────────────
    const tools = this.toolRegistry.getForCapability(resolved.capability)

    // ── 5. Build system prompt ──────────────────────────────
    const capability = this.getCapability(resolved.capability)
    const systemPrompt = this.buildSystemPrompt(capability, context)

    // ── 6. Add user message to history ──────────────────────
    const userMsg: AIMessage = { role: 'user', content: userMessage }
    const workingHistory = [...history, userMsg]

    // ── 7. LLM conversation loop (handles tool calls) ───────
    let turnCount = 0
    const maxTurns = this.manifest.policies.maxConversationTurns

    try {
      while (turnCount < maxTurns) {
        turnCount++

        // Stream from LLM
        const stream = this.llmProvider.chat(systemPrompt, workingHistory, context, tools)
        let assistantContent = ''
        let assistantToolCalls: ToolCall[] = []

        for await (const event of stream) {
          switch (event.type) {
            case 'token':
              assistantContent += event.content
              yield { type: 'token', content: event.content }
              break

            case 'tool_call':
              assistantToolCalls.push(event.toolCall)
              yield { type: 'tool_call', toolCall: event.toolCall }
              break

            case 'error':
              yield { type: 'error', error: event.error }
              return // Stop on stream error

            case 'done':
              break
          }
        }

        // ── If assistant had content, add it to history ────
        if (assistantContent || assistantToolCalls.length > 0) {
          const assistantMsg: AIMessage = {
            role: 'assistant',
            content: assistantContent || null,
            tool_calls: assistantToolCalls.length > 0 ? assistantToolCalls : undefined,
          }
          workingHistory.push(assistantMsg)
        }

        // ── If no tool calls, we're done ───────────────────
        if (assistantToolCalls.length === 0) {
          break
        }

        // ── Execute tool calls (with confirmation check) ───
        const toolResults: ToolResult[] = []

        for (const tc of assistantToolCalls) {
          const toolName = tc.function.name

          // Check if confirmation is needed (human-in-the-loop)
          if (this.toolExecutor.requiresConfirmation(toolName)) {
            let args: Record<string, unknown> = {}
            try {
              args = JSON.parse(tc.function.arguments || '{}')
            } catch { /* keep empty args */ }

            yield {
              type: 'tool_confirmation_needed',
              toolName,
              args,
            }
            // In v1.0, auto-deny destructive actions that weren't pre-approved.
            // The UI layer can intercept this event for confirmation UI.
            // For now, skip the tool call and continue.
            toolResults.push({
              name: toolName,
              result: null,
              error: 'User confirmation required. Action skipped.',
            })
            continue
          }

          // Execute the tool
          const result = await this.toolExecutor.execute(tc)
          toolResults.push(result)
          yield { type: 'tool_result', result }
        }

        // ── Add tool results to history ────────────────────
        for (let i = 0; i < toolResults.length; i++) {
          const result = toolResults[i]
          const toolCall = assistantToolCalls[i]
          const toolMsg: AIMessage = {
            role: 'tool',
            content: JSON.stringify(result.result ?? result.error),
            tool_call_id: toolCall?.id || result.name,
            name: result.name,
          }
          workingHistory.push(toolMsg)
        }

        // Continue the loop — LLM will process tool results
      }

      // ── 8. Save updated history ──────────────────────────
      // Truncate to max messages per conversation
      const maxMsgs = this.manifest.memory.maxMessagesPerConversation
      const truncated = workingHistory.slice(-maxMsgs)
      this.memory.rememberMessages(conversationId, truncated)

      // ── 9. Yield done with suggested actions ─────────────
      yield {
        type: 'done',
        suggestedActions: capability?.suggestedActions ?? [],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[ConversationManager] Error:', err)
      yield { type: 'error', error: message }
    }
  }

  /**
   * Abort the current LLM stream. Safe to call at any time.
   */
  abort(): void {
    this.llmProvider.abort()
  }

  // ── Helpers ──────────────────────────────────────────────────

  private getCapability(id: string): AgentCapability | undefined {
    return this.capabilities.find((c) => c.id === id)
  }

  /**
   * Build the full system prompt: base prompt + capability extension + context.
   */
  private buildSystemPrompt(capability: AgentCapability | undefined, context: AIContext): string {
    let prompt = this.manifest.system.basePrompt

    // Append capability-specific instructions
    if (capability?.promptExtension) {
      prompt += '\n\n' + capability.promptExtension
    }

    // Append current system context
    prompt += `\n\n## Current System State\n`
    prompt += `- Date: ${context.date} (${context.dayOfWeek})\n`
    prompt += `- Active Projects: ${context.dashboard.activeProjects}\n`
    prompt += `- Today's Tasks: ${context.dashboard.todayTasksDone}/${context.dashboard.todayTasksTotal} done\n`
    prompt += `- Annual Goals: ${context.dashboard.annualGoals}\n`

    if (context.goals) {
      prompt += `- Goals data is available (use goals.list tool for details)\n`
    }
    if (context.activeProjects) {
      prompt += `- Projects data is available (use projects.list tool for details)\n`
    }
    if (context.dailyPlan) {
      const dp = context.dailyPlan as any
      const tasks = dp?.daily_tasks ?? []
      const pending = tasks.filter((t: any) => !t.done)
      prompt += `- Daily Plan: ${tasks.length} tasks (${pending.length} pending)\n`
    }

    prompt += `\n## Instructions\n`
    prompt += `- Always respond in Arabic unless the user explicitly uses English\n`
    prompt += `- Be concise and action-oriented — suggest next steps after each response\n`
    prompt += `- Use tools to read/write data when needed — don't ask the user to do things you can do\n`

    return prompt
  }
}
