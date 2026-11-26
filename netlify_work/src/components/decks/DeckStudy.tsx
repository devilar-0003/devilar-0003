"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import { ClozeText, KIND_LABEL, stripCloze } from "@/components/Cloze";
import { formatInterval, projectInterval, RATING, type Rating } from "@/lib/sm2";
import type { DeckDetail, StudyCard } from "@/lib/ai-types";

type Queue = "due" | "all";

export default function DeckStudy({ deckId }: { deckId: number }) {
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Queue>("due");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const busy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/decks/${deckId}?sessionId=${encodeURIComponent(getSessionId())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load this deck.");
        return;
      }
      setDeck(data.deck as DeckDetail);
      setIndex(0);
      setFlipped(false);
      setDone(false);
    } catch {
      setError("Could not load this deck.");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  const dueCards = useMemo(() => {
    if (!deck) return [];
    const now = Date.now();
    return deck.cards.filter((c) => new Date(c.dueAt).getTime() <= now);
  }, [deck]);

  const cards = queue === "due" ? dueCards : (deck?.cards ?? []);
  const position = Math.min(index, Math.max(0, cards.length - 1));
  const card = cards[position] as StudyCard | undefined;
  const reviewedInDeck = deck?.cards.filter((c) => c.reps > 0).length ?? 0;

  function advance() {
    if (position + 1 >= cards.length) {
      setDone(true);
      return;
    }
    setIndex(position + 1);
    setFlipped(false);
  }

  async function rate(rating: Rating) {
    if (!card || busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`/api/decks/${deckId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), cardId: card.id, rating }),
      });
      if (res.ok) {
        const next = await res.json();
        setDeck((prev) =>
          prev
            ? {
                ...prev,
                cards: prev.cards.map((c) =>
                  c.id === card.id
                    ? { ...c, ease: next.ease, interval: next.interval, reps: next.reps, lapses: next.lapses, dueAt: next.dueAt }
                    : c
                ),
              }
            : prev
        );
        setReviewedCount((n) => n + 1);
      }
    } finally {
      busy.current = false;
      advance();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !card) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "1") rate(RATING.AGAIN);
      else if (e.key === "2") rate(RATING.HARD);
      else if (e.key === "3") rate(RATING.GOOD);
      else if (e.key === "4") rate(RATING.EASY);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-10 md:px-8">
        <div className="h-96 animate-pulse rounded-3xl bg-ink-2" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-10 text-center md:px-8">
        <p className="text-cream-dim">{error ?? "Deck not found."}</p>
        <Link href="/decks" className="press mt-5 inline-block rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-ink">
          Back to library
        </Link>
      </div>
    );
  }

  const imageUrl = card?.imageId ? `/api/media/${card.imageId}?sessionId=${encodeURIComponent(getSessionId())}` : null;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/decks" className="press inline-flex items-center gap-2 text-sm font-semibold text-cream-dim hover:text-acid">
          <ArrowLeft className="size-4" /> Library
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/ask?deck=${deck.id}`}
            className="press inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-3.5 py-2 text-xs font-semibold text-cream hover:border-acid/60 hover:text-acid"
          >
            <MessageCircleQuestion className="size-3.5" /> Ask AI
          </Link>
          <Link
            href={`/quiz?deck=${deck.id}`}
            className="press inline-flex items-center gap-1.5 rounded-full bg-acid px-3.5 py-2 text-xs font-bold text-ink hover:bg-cream"
          >
            <ListChecks className="size-3.5" /> Quiz deck
          </Link>
        </div>
      </div>

      <h1 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] font-medium leading-tight text-cream">{deck.title}</h1>
      <p className="mt-2 text-sm text-cream-dim">
        {deck.subject} · {deck.cards.length} cards · {dueCards.length} due · {reviewedInDeck} started
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setQueue("due");
            setIndex(0);
            setDone(false);
            setFlipped(false);
          }}
          className={`press rounded-full px-4 py-2 text-xs font-semibold ${
            queue === "due" ? "bg-acid text-ink" : "border border-hairline-strong text-cream-dim hover:text-cream"
          }`}
        >
          Due now ({dueCards.length})
        </button>
        <button
          onClick={() => {
            setQueue("all");
            setIndex(0);
            setDone(false);
            setFlipped(false);
          }}
          className={`press rounded-full px-4 py-2 text-xs font-semibold ${
            queue === "all" ? "bg-acid text-ink" : "border border-hairline-strong text-cream-dim hover:text-cream"
          }`}
        >
          All cards ({deck.cards.length})
        </button>
        {reviewedCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-acid">
            <Check className="size-3.5" /> {reviewedCount} reviewed this session
          </span>
        )}
      </div>

      {done || !card ? (
        <div className="surface mt-6 flex flex-col items-center justify-center p-12 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-acid/15 text-acid">
            {cards.length === 0 ? <Sparkles className="size-8" /> : <Check className="size-8" />}
          </div>
          <h2 className="mt-5 font-display text-2xl font-medium text-cream">
            {cards.length === 0 ? "Nothing due right now" : "Deck cleared"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-cream-dim">
            {cards.length === 0
              ? "Every card in this deck is scheduled for a future date. Switch to “All cards” for an early pass."
              : "Every card has been rescheduled based on how you rated it."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setQueue("all");
                setIndex(0);
                setDone(false);
                setFlipped(false);
              }}
              className="press inline-flex items-center gap-2 rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-ink hover:bg-cream"
            >
              <RotateCcw className="size-4" /> Study all cards
            </button>
            <Link
              href={`/quiz?deck=${deck.id}`}
              className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-2.5 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid"
            >
              <ListChecks className="size-4" /> Take the quiz
            </Link>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setFlipped((f) => !f)}
            className={`flip-scene mt-6 block w-full select-none text-left ${flipped ? "is-flipped" : ""}`}
            style={{ height: "22rem" }}
            aria-pressed={flipped}
          >
            <div className="flip-inner">
              <div className="flip-face surface bg-gradient-to-br from-ink-2 via-ink-3 to-ink p-6 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-acid">
                    {KIND_LABEL[card.kind] ?? "Card"} · {card.subject}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[0.18em] text-cream-faint">
                    {position + 1}/{cards.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Study material" className="max-h-36 rounded-xl border border-hairline object-contain" />
                  )}
                  <p className="max-w-xl font-display text-[clamp(1.35rem,3.2vw,1.95rem)] font-medium leading-[1.3] text-cream">
                    <ClozeText text={card.front} revealed={false} />
                  </p>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cream-faint">
                    <span className="size-1.5 rounded-full bg-cream-faint" /> Tap / Space to reveal
                  </p>
                </div>
              </div>
              <div className="flip-face flip-back flex flex-col justify-between border border-acid/25 bg-gradient-to-br from-acid/[0.14] via-ink-2 to-ink p-6 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-acid">Answer</span>
                  <span className="text-[0.65rem] uppercase tracking-[0.18em] text-cream-faint">
                    {card.reps > 0 ? `${formatInterval(card.interval)} · ${card.reps} reps` : "New card"}
                  </span>
                </div>
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Study material" className="mx-auto mt-3 max-h-32 rounded-xl border border-hairline object-contain" />
                )}
                <p className="max-w-xl font-display text-[clamp(1.05rem,2.6vw,1.45rem)] font-medium leading-[1.5] text-cream">
                  <ClozeText text={card.back} revealed />
                </p>
                <div className="flex items-center justify-between text-[0.65rem] text-cream-faint">
                  <span>{stripCloze(card.front).slice(0, 70)}</span>
                  <span className="font-mono uppercase tracking-[0.16em]">Rate 1–4</span>
                </div>
              </div>
            </div>
          </button>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { r: RATING.AGAIN as Rating, label: "Again", tone: "border-ember/40 text-ember hover:bg-ember hover:text-ink" },
              { r: RATING.HARD as Rating, label: "Hard", tone: "border-acid-dim/50 text-acid hover:bg-acid-dim hover:text-ink" },
              { r: RATING.GOOD as Rating, label: "Good", tone: "border-acid/45 text-acid hover:bg-acid hover:text-ink" },
              { r: RATING.EASY as Rating, label: "Easy", tone: "border-cream/25 text-cream hover:bg-cream hover:text-ink" },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => rate(b.r)}
                className={`press rounded-2xl border bg-ink-2 px-4 py-4 text-center transition-all ${b.tone}`}
              >
                <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.2em] opacity-70">{b.label}</span>
                <span className="mt-1 block font-display text-xl font-semibold tabular-nums">
                  {formatInterval(
                    projectInterval(
                      { ease: card.ease, interval: card.interval, reps: card.reps, lapses: card.lapses },
                      b.r
                    )
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* deck contents */}
      <div className="surface mt-8 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cream-faint">Deck contents</p>
          <span className="text-[0.65rem] uppercase tracking-[0.16em] text-cream-faint">{deck.cards.length} cards</span>
        </div>
        <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {deck.cards.map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-xl border border-hairline bg-ink-3/40 px-3.5 py-2.5">
              <span className="mt-0.5 shrink-0 rounded-md bg-acid/12 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-acid">
                {KIND_LABEL[c.kind] ?? "Q&A"}
              </span>
              <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-cream-dim">{stripCloze(c.front)}</p>
              <span className="shrink-0 font-mono text-[0.6rem] text-cream-faint">{formatInterval(c.interval)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-ink-2/60 px-5 py-4">
        <p className="flex items-center gap-2 text-xs text-cream-dim">
          <Wand2 className="size-4 text-acid" /> Want more cards from the same source?
        </p>
        <Link href="/generate" className="press inline-flex items-center gap-1.5 text-xs font-bold text-acid hover:text-cream">
          Open AI Studio <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-cream-faint">
        <Brain className="mr-1 inline size-3.5" /> SM-2 intervals recalculated from your ratings.
      </p>
    </div>
  );
}
