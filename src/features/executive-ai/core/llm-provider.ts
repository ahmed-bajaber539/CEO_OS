import type { ILLMProvider, AIMessage, AIContext, ToolDefinition, SSEEvent, AgentManifest } from './types'
import { supabase } from '@/lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * DeepSeekLLMProvider — SSE streaming client for the Supabase Edge Function proxy.
 *
 * Responsibilities:
 *  1. Convert ToolDefinition[] → OpenAI/DeepSeek function-calling format
 *  2. Build the full message payload (system prompt + context + history)
 *  3. Stream SSE events from the Edge Function → AsyncIterable<SSEEvent>
 *  4. Parse SSE wire format into strongly-typed SSEEvent discriminated union
 */
export class DeepSeekLLMProvider implements ILLMProvider {
  private manifest: AgentManifest
  private edgeFunctionUrl: string
  private abortController: AbortController | null = null

  constructor(manifest: AgentManifest) {
    this.manifest = manifest
    // Edge function URL: https://<project>.supabase.co/functions/v1/<name>
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/${manifest.provider.edgeFunction}`
  }

  /**
   * Abort an in-progress stream. Safe to call multiple times.
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * Main entry point: stream chat completion from DeepSeek via Edge Function.
   *
   * @returns AsyncIterable<SSEEvent> — iterate with `for await (const event of provider.chat(...))`
   */
  async *chat(
    systemPrompt: string,
    messages: AIMessage[],
    context: AIContext,
    tools: ToolDefinition[],
  ): AsyncIterable<SSEEvent> {
    // Convert tools to OpenAI function-calling format
    const openaiTools = tools.length > 0 ? this.toOpenAITools(tools) : undefined

    // Build the payload for the Edge Function
    const payload = {
      model: this.manifest.provider.model,
      systemPrompt,
      messages,
      context,
      tools: openaiTools,
      maxTokens: this.manifest.constraints.maxResponseLength,
    }

    // Create a new AbortController for this request
    this.abortController = new AbortController()

    let response: Response
    try {
      response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        yield { type: 'done' }
        this.abortController = null
        return
      }
      yield { type: 'error', error: `Failed to connect to AI service: ${err.message}` }
      this.abortController = null
      return
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      yield {
        type: 'error',
        error: `AI service error (${response.status}): ${errorText}`,
      }
      this.abortController = null
      return
    }

    if (!response.body) {
      yield { type: 'error', error: 'No response body from AI service' }
      this.abortController = null
      return
    }

    // Stream SSE events
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse complete SSE events from buffer
        const events = this.parseSSEBuffer(buffer)
        // Keep the last incomplete chunk in the buffer
        const lastNewline = buffer.lastIndexOf('\n\n')
        buffer = lastNewline >= 0 ? buffer.slice(lastNewline + 2) : buffer

        for (const event of events) {
          if (event.type === 'done') {
            // Consume any remaining buffer as error if unexpected
            yield { type: 'done' }
            this.abortController = null
            return
          }
          yield event
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const remaining = this.parseSSEBuffer(buffer + '\n\n')
        for (const event of remaining) {
          yield event
        }
      }

      yield { type: 'done' }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stream was aborted — clean exit
        yield { type: 'done' }
      } else {
        yield { type: 'error', error: `Stream error: ${err.message}` }
      }
    } finally {
      reader.releaseLock()
      this.abortController = null
    }
  }

  // ── SSE Parsing ──────────────────────────────────────────────

  /**
   * Parse SSE buffer into SSEEvent array.
   * SSE format: "data: <json>\n\n"
   */
  private parseSSEBuffer(buffer: string): SSEEvent[] {
    const events: SSEEvent[] = []
    const lines = buffer.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const jsonStr = trimmed.slice(6) // Strip "data: " prefix

      // Handle "[DONE]" sentinel
      if (jsonStr === '[DONE]') {
        events.push({ type: 'done' })
        continue
      }

      try {
        const parsed = JSON.parse(jsonStr)

        // Route to correct SSEEvent type
        if (parsed.type === 'token') {
          events.push({ type: 'token', content: parsed.content as string })
        } else if (parsed.type === 'tool_call') {
          events.push({
            type: 'tool_call',
            toolCall: parsed.toolCall,
          })
        } else if (parsed.type === 'error') {
          events.push({ type: 'error', error: parsed.error as string })
        } else if (parsed.type === 'done') {
          events.push({ type: 'done' })
        }
        // Unknown event types are silently ignored
      } catch {
        // Skip malformed JSON lines
        console.warn('[LLMProvider] Failed to parse SSE line:', trimmed)
      }
    }

    return events
  }

  // ── Tool Format Conversion ───────────────────────────────────

  /**
   * Convert our ToolDefinition[] to OpenAI/DeepSeek function-calling format.
   *
   * DeepSeek API expects:
   * [{ type: "function", function: { name, description, parameters } }]
   */
  private toOpenAITools(
    tools: ToolDefinition[],
  ): Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      },
    }))
  }
}
