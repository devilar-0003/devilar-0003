"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUp, BookOpen, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { stripCloze } from "@/components/Cloze";

interface Source {
  front: string;
  back: string;
  subject: string;
}

interface Message {
  id: string;
  role: "user" | "tutor";
  text: string;
  sources?: Source[];
  generatedBy?: "gemini" | "deterministic";
}

const SUGGESTIONS = [
  "Explain the difference between speed and velocity with an exam example",
  "Why does pH decrease when H⁺ concentration rises?",
  "Give me a 3-step method to solve projectile motion questions",
  "What are the most common mistakes in balancing chemical equations?",
];

export default function AskApp({ deckId }: { deckId?: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilled) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setInput(q);
    setPrefilled(true);
  }, [prefilled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 4 || loading) return;
    setError(null);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), question: trimmed, deckId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "The tutor is unavailable right now.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          role: "tutor",
          text: data.answer as string,
          sources: data.sources as Source[],
          generatedBy: data.generatedBy,
        },
      ]);
    } catch {
      setError("The tutor is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">Doubt solving</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,5.2vw,3.2rem)] font-medium leading-[1.02] text-cream">
            Ask. <span className="italic text-acid">Understand.</span> Retain.
          </h1>
          <p className="mt-3 max-w-xl text-cream-dim">
            Grounded in your own cards and notes — answers come back with the exact material they rely on.
          </p>
        </div>
        {deckId && (
          <Link
            href={`/decks/${deckId}`}
            className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-xs font-semibold text-cream hover:border-acid/60 hover:text-acid"
          >
            <BookOpen className="size-3.5" /> Back to deck
          </Link>
        )}
      </div>

      <div
        ref={scrollRef}
        className="surface mt-6 max-h-[27rem] min-h-[16rem] overflow-y-auto p-5"
        aria-live="polite"
      >
        {messages.length === 0 && !loading ? (
          <div className="flex h-full min-h-[13rem] flex-col items-center justify-center text-center">
            <div className="grid size-14 place-items-center rounded-full bg-acid/15 text-acid">
              <MessageCircleQuestion className="size-7" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-dim">
              Stuck on a step? Ask it plainly. You'll get the direct answer, why it works, and the exam trap to avoid.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-acid text-ink"
                      : "border border-hairline bg-ink-3/70 text-cream-dim"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.role === "tutor" && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 border-t border-hairline pt-3">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-cream-faint">From your material</p>
                      <ul className="mt-2 space-y-1.5">
                        {m.sources.map((s, i) => (
                          <li key={i} className="text-[0.72rem] leading-snug text-cream-dim">
                            <span className="text-acid">•</span> {stripCloze(s.front).slice(0, 110)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.role === "tutor" && (
                    <p className="mt-2 text-[0.6rem] uppercase tracking-[0.16em] text-cream-faint">
                      {m.generatedBy === "gemini" ? "Gemini tutor" : "Offline tutor"}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-ink-3/70 px-4 py-3 text-sm text-cream-dim">
                <Loader2 className="size-4 animate-spin text-acid" /> Working through it…
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-3 text-xs text-cream-dim">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" /> {error}
        </p>
      )}

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="press rounded-full border border-hairline-strong px-3.5 py-1.5 text-left text-[0.72rem] text-cream-dim transition-colors hover:border-acid/50 hover:text-acid"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-4 flex items-end gap-2 rounded-2xl border border-hairline bg-ink-2 p-2 focus-within:border-acid/60"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          placeholder="Type your doubt…"
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-cream placeholder:text-cream-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length < 4}
          className="press grid size-10 shrink-0 place-items-center rounded-xl bg-acid text-ink transition-colors hover:bg-cream disabled:opacity-40"
          aria-label="Ask"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </button>
      </form>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.68rem] text-cream-faint">
        <Sparkles className="size-3" /> Answers are grounded in your deck and notes; add GEMINI_API_KEY for full worked reasoning.
      </p>
    </div>
  );
}
