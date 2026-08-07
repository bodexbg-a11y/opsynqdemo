"use client";

import { useRef, useState } from "react";
import { Sparkles, Send, Bot } from "lucide-react";
import type { PresetQA } from "@/lib/data/ai";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function AiChat({ presets }: { presets: PresetQA[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi Vlad — I'm your OPSYNQ AI assistant. I can analyze every project, invoice, team and task in real time. Ask me anything, or pick a question below.",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function ask(question: string) {
    const lower = question.toLowerCase();
    const match =
      presets.find((p) => p.question.toLowerCase() === lower) ??
      presets.find((p) => p.keywords.some((k) => lower.includes(k)));
    const answer =
      match?.answer ??
      "I can answer questions about project profitability, schedule risk, team performance, overdue invoices, and daily priorities. Try one of the suggested questions below, or ask about a specific project, team, or client by name.";
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "assistant", text: answer }]);
    setInput("");
    scrollDown();
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 card-surface rounded-2xl flex flex-col h-[640px]">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-ink-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13.5px] font-semibold text-ink-900">OPSYNQ AI</p>
            <p className="text-[11px] text-success-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success-500" />Live on company data</p>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", m.role === "assistant" ? "bg-blue-600 text-white" : "bg-ink-200 text-ink-600")}>
                {m.role === "assistant" ? <Bot className="w-3.5 h-3.5" /> : <span className="text-[10px] font-semibold">VM</span>}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-line",
                  m.role === "assistant" ? "bg-ink-50 text-ink-700 rounded-tl-sm" : "bg-blue-600 text-white rounded-tr-sm"
                )}
              >
                {m.text}
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
            placeholder="Ask about projects, teams, invoices…"
            className="flex-1 bg-ink-50 rounded-lg px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button type="submit" className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <p className="text-[11.5px] font-semibold text-ink-400 uppercase tracking-wide px-1">Suggested Questions</p>
        {presets.map((p) => (
          <button
            key={p.question}
            onClick={() => ask(p.question)}
            className="w-full text-left card-surface rounded-xl px-4 py-3 text-[12.5px] text-ink-700 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          >
            {p.question}
          </button>
        ))}
      </div>
    </div>
  );
}
