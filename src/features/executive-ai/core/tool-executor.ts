import type {
  IToolExecutor,
  ToolCall,
  ToolResult,
  ToolDefinition,
  AgentManifest,
} from './types'
import type { ToolRegistry } from './tool-registry'

/**
 * ToolExecutor — safe wrapper around the Tool Registry + Service Layer.
 *
 * Responsibilities:
 *  1. Look up the tool in the frozen registry
 *  2. Parse JSON arguments from the ToolCall
 *  3. Check Manifest policies (confirmation-required tools)
 *  4. Execute with try/catch — always returns structured ToolResult
 *  5. Never throws — errors are returned inline so the LLM can adapt
 */
export class ToolExecutor implements IToolExecutor {
  private registry: ToolRegistry
  private manifest: AgentManifest

  constructor(registry: ToolRegistry, manifest: AgentManifest) {
    this.registry = registry
    this.manifest = manifest
  }

  /**
   * Check whether a tool requires user confirmation before execution.
   * Reads from the Manifest's policies.requireConfirmation list.
   */
  requiresConfirmation(toolName: string): boolean {
    return this.manifest.policies.requireConfirmation.includes(toolName)
  }

  /**
   * Execute a single tool call.
   *
   * @returns ToolResult — always structured, never throws.
   *   On success: { name, result, error: null }
   *   On failure: { name, result: null, error: message }
   */
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const toolName = toolCall.function.name

    try {
      // 1. Look up the tool
      const tool = this.registry.getTool(toolName)
      if (!tool) {
        return {
          name: toolName,
          result: null,
          error: `Unknown tool: "${toolName}". Available tools: ${this.registry
            .getAll()
            .map((t) => t.name)
            .join(', ')}`,
        }
      }

      // 2. Parse arguments
      let args: Record<string, unknown>
      try {
        args = JSON.parse(toolCall.function.arguments || '{}')
      } catch {
        return {
          name: toolName,
          result: null,
          error: `Failed to parse arguments for tool "${toolName}". Received: ${toolCall.function.arguments}`,
        }
      }

      // 3. Validate required schema fields (basic)
      const validationError = this.validateArgs(tool, args)
      if (validationError) {
        return {
          name: toolName,
          result: null,
          error: validationError,
        }
      }

      // 4. Execute via the Service Layer (all domain logic lives in Services)
      const result = await tool.execute(args)

      return {
        name: toolName,
        result,
        error: null,
      }
    } catch (error) {
      console.error(`[AI Tool] ${toolName} failed:`, error)
      return {
        name: toolName,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Execute multiple tool calls in parallel (respects maxToolsPerTurn policy).
   */
  async executeBatch(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const limit = this.manifest.policies.maxToolsPerTurn
    const batch = toolCalls.slice(0, limit)

    const results = await Promise.all(batch.map((tc) => this.execute(tc)))

    // If truncated, add a warning result
    if (toolCalls.length > limit) {
      results.push({
        name: '_batch_truncated',
        result: null,
        error: `Truncated: ${toolCalls.length - limit} tool calls skipped (max ${limit} per turn).`,
      })
    }

    return results
  }

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Basic validation: checks that required arguments (from schema) are present.
   * Services do their own deeper validation — this is just a first line of defense.
   */
  private validateArgs(tool: ToolDefinition, args: Record<string, unknown>): string | null {
    const schema = tool.schema as { required?: string[]; properties?: Record<string, unknown> }
    if (!schema?.required?.length) return null

    for (const field of schema.required) {
      if (args[field] === undefined || args[field] === null) {
        return `Missing required argument "${field}" for tool "${tool.name}". Required: ${schema.required.join(', ')}`
      }
    }

    return null
  }
}
