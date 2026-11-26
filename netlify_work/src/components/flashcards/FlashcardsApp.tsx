"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { SUBJECTS } from "@/lib/content";
import { computeNextState, projectInterval, formatInterval, RATING, type Rating } from "@/lib/sm2";

interface CardState {
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  dueAt: string | null;
}

interface Card {
  id: number;
  subject: string;
  front: string;
  back: string;
  state: CardState | null;
}

type Filter = "All" | (typeof SUBJECTS)[number];

function isDue(card: Card, now = new Date()): boolean {
  if (!card.state) return true;
  if (!card.state.dueAt) return true;
  return new Date(card.state.dueAt).getTime() <= now.getTime();
}

function projectedLabel(card: Card, rating: Rating): string {
  const input = {
    ease: card.state?.ease ?? 2.5,
    interval: card.state?.interval ?? 0,
    reps: card.state?.reps ?? 0,
    lapses: card.state?.lapses ?? 0,
  };
  return formatInterval(projectInterval(input, rating));
}

export default function FlashcardsApp() {
  const [cards, setCards] = useState<Card[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<Rating | null>(null);
  const [done, setDone] = useState(false);
  const busy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const id = getSessionId();
      const res = await fetch(`/api/flashcards?sessionId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        const merged: Card[] = (data.cards as Card[]).map((c) => ({ ...c, state: c.state ?? null }));
        merged.sort((a, b) => {
          const ad = a.state?.dueAt ? new Date(a.state.dueAt).getTime() : 0;
          const bd = b.state?.dueAt ? new Date(b.state.dueAt).getTime() : 0;
          return ad - bd;
        });
        setCards(merged);
        setIndex(0);
        setFlipped(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === "All" ? cards : cards.filter((c) => c.subject === filter)),
    [cards, filter]
  );

  const position = useMemo(() => {
    // Keep index stable across filter changes by matching card ids
    if (filtered.length === 0) return 0;
    return Math.min(index, filtered.length - 1);
  }, [filtered, index]);

  const card = filtered[position] as Card | undefined;

  const reviewed = useMemo(() => cards.filter((c) => c.state && c.state.reps > 0).length, [cards]);
  const progress = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;

  function advance() {
    const nextIndex = position + 1;
    if (nextIndex >= filtered.length) {
      setDone(true);
      return;
    }
    setIndex(nextIndex);
    setFlipped(false);
  }

  async function rate(r: Rating) {
    if (!card || busy.current) return;
    busy.current = true;
    setRating(r);
    setFlipped(true);
    const id = getSessionId();
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, flashcardId: card.id, rating: r }),
      });
      if (res.ok) {
        const next = await res.json();
        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? {
                  ...c,
                  state: {
                    ease: next.ease,
                    interval: next.interval,
                    reps: next.reps,
                    lapses: next.lapses,
                    dueAt: next.dueAt,
                  },
                }
              : c
          )
        );
      }
    } finally {
      busy.current = false;
      setTimeout(() => {
        setRating(null);
        advance();
      }, 780);
    }
  }

  // keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (loading || done || !card) return;
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

  const allSubjects: ("All" | (typeof SUBJECTS)[number])[] = ["All", ...SUBJECTS];

  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-24 md:px-8">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="press inline-flex items-center gap-2 text-sm font-semibold text-cream-dim transition-colors hover:text-acid"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cream-faint">
            {reviewed}/{cards.length} reviewed
          </span>
        </div>
      </div>

      <div className="mt-6">
        <h1 className="font-display text-[clamp(2rem,5.4vw,3.2rem)] font-medium leading-[1.04] text-cream">
          Spaced-repetition <span className="italic text-acid">deck</span>
        </h1>
        <p className="mt-3 max-w-xl text-cream-dim">
          Flip the card, rate yourself honestly, move on. The schedule is rebuilt in the background.
        </p>
      </div>

      {/* filter chips + progress */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {allSubjects.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s);
              setIndex(0);
              setFlipped(false);
              setDone(false);
            }}
            className={`press rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
              filter === s
                ? "bg-acid text-ink shadow-[0_6px_20px_rgba(207,240,76,0.3)]"
                : "border border-hairline-strong text-cream-dim hover:border-acid/50 hover:text-cream"
            }`}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink-3">
            <div className="h-full rounded-full bg-acid transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold tabular-nums text-cream-dim">{progress}%</span>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 h-80 animate-pulse rounded-3xl bg-ink-2" />
      ) : done || filtered.length === 0 ? (
        <div className="surface mt-8 flex flex-col items-center justify-center p-14 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-acid/15 text-acid">
            <Check className="size-8" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-medium text-cream">All clear.</h2>
          <p className="mt-3 max-w-sm text-cream-dim">
            You've reviewed everything currently due. Cards will resurface per their schedule.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setDone(false);
                setIndex(0);
                setFlipped(false);
              }}
              className="press inline-flex items-center gap-2 rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-ink hover:bg-cream"
            >
              <RotateCcw className="size-4" /> Browse again
            </button>
            <Link
              href="/quiz"
              className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-2.5 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid"
            >
              <Sparkles className="size-4" /> Take the quiz
            </Link>
          </div>
        </div>
      ) : card ? (
        <div className="mt-8">
          {/* progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {filtered.map((c, i) => (
              <button
                key={c.id}
                aria-label={`Go to card ${i + 1}`}
                onClick={() => {
                  setIndex(i);
                  setFlipped(false);
                }}
                className={`size-1.5 rounded-full transition-all duration-300 ${
                  i === position ? "w-6 bg-acid" : c.state && c.state.reps > 0 ? "bg-acid/50" : "bg-cream/20"
                }`}
              />
            ))}
          </div>

          {/* card */}
          <button
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            className={`flip-scene group mt-6 block w-full select-none text-left ${flipped ? "is-flipped" : ""}`}
            style={{ height: "21rem" }}
          >
            <div className="flip-inner">
              {/* front */}
              <div className="flip-face surface bg-gradient-to-br from-ink-2 via-ink-3 to-ink p-7 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-acid">
                    {card.subject}
                  </span>
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cream-faint">
                    {card.state && card.state.reps > 0 ? `Interval ${formatInterval(card.state.interval)} · ${card.state.reps} reps` : "New card"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <p className="max-w-xl font-display text-[clamp(1.4rem,3.4vw,2rem)] font-medium leading-[1.3] text-cream">
                    {card.front}
                  </p>
                  <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cream-faint transition-colors group-hover:text-acid">
                    <span className="size-1.5 rounded-full bg-cream-faint group-hover:bg-acid" />
                    Tap to reveal
                  </p>
                </div>
              </div>
              {/* back */}
              <div className="flip-face flip-back flex flex-col justify-between border border-acid/25 bg-gradient-to-br from-acid/[0.14] via-ink-2 to-ink p-7 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-acid">Answer</span>
                  <span className="text-[0.68rem] uppercase tracking-[0.18em] text-cream-faint">Breathe · remember</span>
                </div>
                <p className="max-w-xl font-display text-[clamp(1.15rem,2.8vw,1.6rem)] font-medium leading-[1.45] text-cream">
                  {card.back}
                </p>
                <div className="flex items-center justify-between text-[0.68rem] text-cream-faint">
                  <span>{isDue(card) ? "Due now" : `Due ${card.state?.dueAt ? new Date(card.state.dueAt).toLocaleDateString() : "soon"}`}</span>
                  <span className="font-mono uppercase tracking-[0.18em]">Space to flip back</span>
                </div>
              </div>
            </div>
          </button>

          {/* rating controls */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { r: RATING.AGAIN as Rating, label: "Again", tone: "border-ember/40 text-ember hover:bg-ember hover:text-ink" },
              { r: RATING.HARD as Rating, label: "Hard", tone: "border-acid-dim/50 text-acid hover:bg-acid-dim hover:text-ink" },
              { r: RATING.GOOD as Rating, label: "Good", tone: "border-acid/45 text-acid hover:bg-acid hover:text-ink" },
              { r: RATING.EASY as Rating, label: "Easy", tone: "border-cream/25 text-cream hover:bg-cream hover:text-ink" },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => rate(b.r)}
                disabled={Boolean(rating)}
                className={`press rounded-2xl border bg-ink-2 px-4 py-4 text-center transition-all disabled:opacity-50 ${b.tone}`}
              >
                <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.2em] opacity-70">{b.label}</span>
                <span className="mt-1 block font-display text-xl font-semibold tabular-nums">{projectedLabel(card, b.r)}</span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-cream-faint">
            Keys: <kbd className="rounded-md border border-hairline-strong bg-ink-3 px-1.5 py-0.5 font-mono text-[0.62rem] text-cream-dim">Space</kbd> flip ·{" "}
            <kbd className="rounded-md border border-hairline-strong bg-ink-3 px-1.5 py-0.5 font-mono text-[0.62rem] text-cream-dim">1–4</kbd> rate
          </p>
        </div>
      ) : null}
    </div>
  );
}
