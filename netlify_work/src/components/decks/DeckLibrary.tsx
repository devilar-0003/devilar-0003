"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileText,
  Flame,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import type { DeckSummary } from "@/lib/ai-types";

const SOURCE_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  prompt: Wand2,
};

export default function DeckLibrary({ aiEnabled }: { aiEnabled: boolean }) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/decks?sessionId=${encodeURIComponent(getSessionId())}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setDecks(data.decks ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!window.confirm("Delete this deck and all of its cards? This can't be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/decks/${id}?sessionId=${encodeURIComponent(getSessionId())}`, {
        method: "DELETE",
      });
      if (res.ok) setDecks((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const totalDue = decks.reduce((a, d) => a + d.dueCards, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">Deck library</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,5.4vw,3.4rem)] font-medium leading-[1.02] text-cream">
            Your <span className="italic text-acid">generated</span> decks
          </h1>
          <p className="mt-3 max-w-xl text-cream-dim">
            {decks.length > 0
              ? `${decks.length} deck${decks.length > 1 ? "s" : ""} · ${totalDue} card${totalDue === 1 ? "" : "s"} due now`
              : "Nothing generated yet. Turn a chapter or a topic into cards in the AI Studio."}
          </p>
        </div>
        <Link
          href="/generate"
          className="press inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink hover:bg-cream"
        >
          <Plus className="size-4" /> New AI deck
        </Link>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-ink-2" />
          ))}
        </div>
      ) : error ? (
        <div className="surface mt-10 p-8 text-center">
          <p className="text-cream-dim">Could not load your decks.</p>
          <button onClick={load} className="press mt-4 rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-ink">
            Retry
          </button>
        </div>
      ) : decks.length === 0 ? (
        <div className="surface mt-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-acid/15 text-acid">
            <Sparkles className="size-8" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-medium text-cream">No decks yet</h2>
          <p className="mt-2 max-w-sm text-sm text-cream-dim">
            Upload a PDF, snap your notes, or describe a topic — you'll have a scheduled deck in seconds.
          </p>
          <Link href="/generate" className="press mt-6 inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3 text-sm font-bold text-ink">
            Open AI Studio <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const Icon = SOURCE_ICON[deck.sourceType] ?? Layers;
            return (
              <div key={deck.id} className="surface group flex flex-col p-5 transition-all hover:-translate-y-1 hover:border-acid/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-acid/12 text-acid">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {deck.dueCards > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-acid/15 px-2.5 py-1 text-[0.62rem] font-bold text-acid">
                        <Flame className="size-3" /> {deck.dueCards} due
                      </span>
                    )}
                    <button
                      onClick={() => remove(deck.id)}
                      disabled={deleting === deck.id}
                      aria-label={`Delete ${deck.title}`}
                      className="press grid size-8 place-items-center rounded-full border border-hairline text-cream-faint hover:border-ember/50 hover:text-ember"
                    >
                      {deleting === deck.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <h2 className="mt-4 line-clamp-2 font-display text-xl font-medium leading-snug text-cream">{deck.title}</h2>
                <p className="mt-1 text-xs text-cream-faint">
                  {deck.subject} · {deck.totalCards} cards · {deck.masteredCards} mastered
                </p>
                <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-cream-dim">{deck.summary}</p>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/decks/${deck.id}`}
                    className="press inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-acid px-4 py-2.5 text-xs font-bold text-ink hover:bg-cream"
                  >
                    <Brain className="size-3.5" /> Study
                  </Link>
                  <Link
                    href={`/quiz?deck=${deck.id}`}
                    className="press inline-flex items-center justify-center gap-1.5 rounded-full border border-hairline-strong px-4 py-2.5 text-xs font-semibold text-cream hover:border-acid/60 hover:text-acid"
                  >
                    <ListChecks className="size-3.5" /> Quiz
                  </Link>
                </div>
                <p className="mt-3 text-[0.6rem] uppercase tracking-[0.18em] text-cream-faint">
                  {deck.generatedBy === "gemini" ? "Gemini generated" : aiEnabled ? "Offline fallback" : "Offline engine"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
