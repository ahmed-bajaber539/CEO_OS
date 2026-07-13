// @ts-nocheck — Deno Edge Function (separate runtime from main TS build)

/**
 * Executive AI — Supabase Edge Function
 *
 * Thin proxy between the frontend and DeepSeek API.
 * Responsibilities:
 *  - Receive messages, context, and tool definitions from frontend
 *  - Call DeepSeek API with streaming enabled
 *  - Parse DeepSeek's SSE chunks and re-emit as our SSEEvent format
 *  - API key stored as Supabase secret (DEEPSEEK_API_KEY)
 *
 * NO business logic. NO database access. Pure proxy.
 */

const DEEPSEEK_BASE = "https://api.deepseek.com";

interface RequestPayload {
  model: string;
  systemPrompt: string;
  messages: Array<{
    role: string;
    content: string | null;
    tool_calls?: unknown[];
    tool_call_id?: string;
    name?: string;
  }>;
  context: unknown;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  maxTokens: number;
}

// ─── SSE Helpers ───────────────────────────────────────────────

function sseToken(content: string): string {
  return `data: ${JSON.stringify({ type: "token", content })}\n\n`;
}

function sseToolCall(toolCall: unknown): string {
  return `data: ${JSON.stringify({ type: "tool_call", toolCall })}\n\n`;
}

function sseError(error: string): string {
  return `data: ${JSON.stringify({ type: "error", error })}\n\n`;
}

function sseDone(): string {
  return `data: [DONE]\n\n`;
}

// ─── DeepSeek Message Builder ──────────────────────────────────

function buildMessages(payload: RequestPayload) {
  const messages: Array<Record<string, unknown>> = [];

  // System message
  messages.push({ role: "system", content: payload.systemPrompt });

  // Conversation messages
  for (const msg of payload.messages) {
    const m: Record<string, unknown> = { role: msg.role };

    if (msg.content !== undefined && msg.content !== null) {
      m.content = msg.content;
    } else if (msg.role === "assistant" && msg.tool_calls) {
      // Assistant messages with tool_calls must have content (can be null)
      m.content = null;
    }

    if (msg.tool_calls) {
      m.tool_calls = msg.tool_calls;
    }

    // tool_call_id is required by DeepSeek for tool messages
    if (msg.tool_call_id) {
      m.tool_call_id = msg.tool_call_id;
    } else if (msg.role === "tool" && msg.name) {
      m.tool_call_id = msg.name;
    }

    if (msg.name) {
      m.name = msg.name;
    }

    messages.push(m);
  }

  return messages;
}

// ─── DeepSeek Stream Parser ────────────────────────────────────

async function streamDeepSeek(
  body: ReadableStream<Uint8Array>,
  controller: ReadableStreamDefaultController,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Tool call accumulation state
  const toolCalls: Map<number, {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }> = new Map();
  const encoder = new TextEncoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      // Keep the last incomplete line in buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);

        // Done sentinel
        if (data === "[DONE]") {
          // Emit any accumulated tool calls
          for (const tc of toolCalls.values()) {
            if (tc.function.name) {
              controller.enqueue(encoder.encode(sseToolCall(tc)));
            }
          }
          controller.enqueue(encoder.encode(sseDone()));
          controller.close();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;
          if (!delta) continue;

          // Content token
          if (delta.content) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(sseToken(delta.content)));
          }

          // Tool call delta
          if (delta.tool_calls) {
            for (const tcDelta of delta.tool_calls) {
              const idx = tcDelta.index ?? 0;

              if (!toolCalls.has(idx)) {
                toolCalls.set(idx, {
                  id: tcDelta.id ?? "",
                  type: "function",
                  function: { name: "", arguments: "" },
                });
              }

              const tc = toolCalls.get(idx)!;
              if (tcDelta.id) tc.id = tcDelta.id;
              if (tcDelta.function?.name) tc.function.name += tcDelta.function.name;
              if (tcDelta.function?.arguments) tc.function.arguments += tcDelta.function.arguments;
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    // End of stream without [DONE]
    controller.enqueue(encoder.encode(sseDone()));
    controller.close();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stream error";
    controller.enqueue(encoder.encode(sseError(message)));
    controller.close();
  }
}

// ─── CORS Helper ───────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ─── Main Handler ──────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let payload: RequestPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Build messages
  const messages = buildMessages(payload);

  // Build request body for DeepSeek
  const deepseekBody: Record<string, unknown> = {
    model: payload.model || "deepseek-chat",
    messages,
    stream: true,
    max_tokens: payload.maxTokens || 4000,
  };

  if (payload.tools && payload.tools.length > 0) {
    deepseekBody.tools = payload.tools;
  }

  // Call DeepSeek
  const response = await fetch(`${DEEPSEEK_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(deepseekBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `DeepSeek API error: ${response.status}`, detail: errorText }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!response.body) {
    return new Response(
      JSON.stringify({ error: "No response body from DeepSeek" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Stream back as SSE
  const stream = new ReadableStream({
    start(controller) {
      streamDeepSeek(response.body!, controller);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
