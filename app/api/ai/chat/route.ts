import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { buildCompanyContext, AI_SYSTEM_PROMPT } from "@/lib/data/ai-context";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    // The UI falls back to its scripted answers when the key isn't configured,
    // so this is a normal state on a deployment without AI enabled.
    return new Response(JSON.stringify({ error: "not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let history: ChatMessage[];
  try {
    const body = await request.json();
    history = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const turns = history
    .filter((m) => typeof m?.text === "string" && m.text.trim())
    .slice(-12)
    .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.text }));

  if (!turns.length || turns[turns.length - 1].role !== "user") {
    return new Response("Expected a trailing user message", { status: 400 });
  }

  const store = await getStore();
  const context = buildCompanyContext(store);
  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    system: [
      {
        type: "text",
        // Prompt and company briefing are stable across turns, so cache them —
        // only the conversation itself varies request to request.
        text: `${AI_SYSTEM_PROMPT}\n\n${context}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: turns,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n(I wasn't able to answer that one — try rephrasing the question.)"));
        }
      } catch (error) {
        console.error("AI chat stream failed:", error);
        controller.enqueue(encoder.encode("\n\n(The assistant hit an error mid-answer. Please try again.)"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
