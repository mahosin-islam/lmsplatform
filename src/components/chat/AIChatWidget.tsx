"use client";

import * as React from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Mentora, your AI study assistant. Ask me anything about the platform, courses, batches, assignments, certificates or payments.",
};

export function AIChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  React.useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages, loading, scrollToBottom]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const payload = (await res.json()) as {
        success: boolean;
        message?: string;
        data?: { text: string } | null;
      };

      if (!res.ok || !payload.success || !payload.data) {
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content:
              payload.message ?? "Sorry, something went wrong. Try again.",
          },
        ]);
        return;
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: payload.data.text },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed right-4 bottom-4 z-50 flex h-[min(560px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">Mentora</p>
                <p className="text-xs text-white/70 leading-tight">
                  AI Study Assistant
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 transition-colors hover:bg-white/15"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800"
                  )}
                >
                  <span className="whitespace-pre-wrap">{message.content}</span>
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex w-full justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask me anything..."
              aria-label="Chat message"
              className="h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open AI chat assistant"
        className="fixed right-4 bottom-4 z-50 inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105"
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <div className="relative">
            <Bot className="size-6" />
            <span className="absolute -top-1 -right-1 inline-flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-emerald-400"></span>
            </span>
          </div>
        )}
      </button>
    </>
  );
}