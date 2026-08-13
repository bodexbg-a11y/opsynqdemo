"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Bot, Loader2 } from "lucide-react";
import type { PresetQA } from "@/lib/data/ai";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const GREETING =
  "Hi — I'm your OPSYNQ AI assistant. I can analyze every project, invoice, crew, task and warehouse in real time. Ask me anything, or pick a question below.";

/** Scripted answer used when the live model isn't configured or a request fails. */
function presetAnswer(question: string, presets: PresetQA[]): string {
  const lower = question.toLowerCase();
  const match =
    presets.find((p) => p.question.toLowerCase() === lower) ??
    presets.find((p) => p.keywords.some((k) => lower.includes(k)));
  return (
    match?.answer ??
    "I can answer questions about project profitability, schedule risk, team performance, overdue invoices, inventory and daily priorities. Try one of the suggested questions below, or ask about a specific project, crew or client by name."
  );
}

export function AiChat({ presets, userName }: { presets: PresetQA[]; userName: string }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveModel, setLiveModel] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    if (busy) return;
    const history: Message[] = [...messages, { role: "user", text: question }];
    setMessages([...history, { role: "assistant", text: "" }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok || !response.body) {
        // 503 means no API key is configured — fall back to the scripted answers
        // permanently rather than retrying the endpoint on every question.
        if (response.status === 503) setLiveModel(false);
        setMessages([...history, { role: "assistant", text: presetAnswer(question, presets) }]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", text }]);
      }
      if (!text.trim()) {
        setMessages([...history, { role: "assistant", text: presetAnswer(question, presets) }]);
      }
    } catch {
      setMessages([...history, { role: "assistant", text: presetAnswer(question, presets) }]);
    } finally {
      setBusy(false);
    }
  }

  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 card-surface rounded-2xl flex flex-col h-[640px]">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-ink-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13.5px] font-semibold text-ink-900">OPSYNQ AI</p>
            {liveModel ? (
              <p className="text-[11px] text-success-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                Claude, live on company data
              </p>
            ) : (
              <p className="text-[11px] text-ink-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-300" />
                Offline mode — set ANTHROPIC_API_KEY for live answers
              </p>
            )}
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                  m.role === "assistant" ? "bg-blue-600 text-white" : "bg-ink-200 text-ink-600"
                )}
              >
                {m.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <span className="text-[10px] font-semibold">{initials}</span>}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-line",
                  m.role === "assistant" ? "bg-ink-50 text-ink-700 rounded-tl-sm" : "bg-blue-600 text-white rounded-tr-sm"
                )}
              >
                {m.text || (busy && i === messages.length - 1 ? <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-400" /> : m.text)}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) ask(input.trim());
          }}
          className="flex items-center gap-2 px-4 py-3 border-t border-ink-100"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder={busy ? "Thinking…" : "Ask about projects, crews, invoices, stock…"}
            className="flex-1 bg-ink-50 rounded-lg px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-ink-300 text-white flex items-center justify-center shrink-0 transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <p className="text-[11.5px] font-semibold text-ink-400 uppercase tracking-wide px-1">Suggested Questions</p>
        {presets.map((p) => (
          <button
            key={p.question}
            onClick={() => ask(p.question)}
            disabled={busy}
            className="w-full text-left card-surface rounded-xl px-4 py-3 text-[12.5px] text-ink-700 hover:border-blue-300 hover:bg-blue-50/40 transition-colors disabled:opacity-50"
          >
            {p.question}
          </button>
        ))}
      </div>
    </div>
  );
}
