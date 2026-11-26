"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarClock,
  Flame,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import type { StudyPlan, WeakSubject } from "@/lib/ai-types";

interface PlanResponse {
  daysLeft: number;
  examName: string;
  dueToday: number;
  cardsTotal: number;
  reviewedToday: number;
  quizAvg: number | null;
  weakSubjects: WeakSubject[];
  plan: StudyPlan;
  generatedBy: "gemini" | "deterministic";
  warning?: string;
  aiEnabled: boolean;
  decks: { id: number; title: string; subject: string }[];
}

export default function PlanApp() {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
      if (!res.ok) throw new Error("failed");
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalMinutes = data?.plan.days.reduce((a, d) => a + d.minutes, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">Smart planning</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,5.4vw,3.4rem)] font-medium leading-[1.02] text-cream">
            The week, <span className="italic text-acid">planned.</span>
          </h1>
          <p className="mt-3 max-w-xl text-cream-dim">
            Built from your countdown, your due cards and your real quiz accuracy — not a generic timetable.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-3 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Rebuild plan
        </button>
      </div>

      {loading && !data ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-ink-2" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="surface mt-10 p-8 text-center">
          <p className="text-cream-dim">Could not build your plan right now.</p>
          <button onClick={load} className="press mt-4 rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-ink">
            Retry
          </button>
        </div>
      ) : (
        <>
          {data.warning && (
            <p className="mt-6 flex items-start gap-2 rounded-2xl border border-hairline bg-ink-2/70 p-4 text-xs leading-relaxed text-cream-dim">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-acid" /> {data.warning}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: CalendarClock, label: "Days left", value: String(data.daysLeft), hint: data.examName },
              { icon: Layers, label: "Due today", value: String(data.dueToday), hint: `${data.cardsTotal} AI cards` },
              { icon: Flame, label: "Reviewed today", value: String(data.reviewedToday), hint: "honest reps only" },
              { icon: TrendingUp, label: "Quiz average", value: data.quizAvg !== null ? `${data.quizAvg}%` : "—", hint: "all attempts" },
            ].map((s) => (
              <div key={s.label} className="surface p-4">
                <s.icon className="size-4 text-acid" />
                <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-cream">{s.value}</p>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream-dim">{s.label}</p>
                <p className="mt-1 text-[0.62rem] text-cream-faint">{s.hint}</p>
              </div>
            ))}
          </div>

          {/* plan */}
          <div className="surface mt-5 overflow-hidden">
            <div className="border-b border-hairline bg-acid/[0.07] p-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-acid">
                <Sparkles className="size-3" /> {data.generatedBy === "gemini" ? "Gemini coach" : "Offline coach"}
              </span>
              <h2 className="mt-4 font-display text-2xl font-medium leading-snug text-cream sm:text-3xl">{data.plan.headline}</h2>
              {data.plan.rationale && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream-dim">{data.plan.rationale}</p>}
              <p className="mt-3 flex items-center gap-2 text-xs text-cream-faint">
                <Timer className="size-3.5" /> {data.plan.days.length} days · {totalMinutes} minutes total
              </p>
            </div>

            <ol className="divide-y divide-hairline">
              {data.plan.days.map((day, i) => (
                <li key={`${day.day}-${i}`} className="flex gap-4 p-5">
                  <div className="flex w-14 shrink-0 flex-col items-center">
                    <span className="grid size-9 place-items-center rounded-full bg-acid/12 font-display text-sm font-bold text-acid">
                      {i + 1}
                    </span>
                    <span className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-cream-faint">{day.day}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-cream">{day.focus}</p>
                      <span className="rounded-full border border-hairline-strong px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-cream-dim">
                        {day.minutes} min
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-cream-dim">{day.task}</p>
                  </div>
                </li>
              ))}
            </ol>

            {data.plan.tips.length > 0 && (
              <div className="border-t border-hairline p-5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-cream-faint">Coach notes</p>
                <ul className="mt-3 space-y-2">
                  {data.plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-cream-dim">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid" /> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* weak topics */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="surface p-6">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-acid" />
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cream-faint">Weak-topic analysis</p>
              </div>
              {data.weakSubjects.length === 0 ? (
                <p className="mt-4 text-sm leading-relaxed text-cream-dim">
                  No review history yet. Rate a few cards as Again or Hard and this panel will rank your weakest subjects.
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {data.weakSubjects.map((w) => (
                    <li key={w.subject}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-cream">{w.subject}</span>
                        <span className={`font-mono text-xs font-bold ${w.mastery < 60 ? "text-ember" : w.mastery < 80 ? "text-acid-dim" : "text-acid"}`}>
                          {w.mastery}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                        <div
                          className={`h-full rounded-full ${w.mastery < 60 ? "bg-ember" : w.mastery < 80 ? "bg-acid-dim" : "bg-acid"}`}
                          style={{ width: `${Math.max(4, w.mastery)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[0.66rem] text-cream-faint">
                        {w.attempts} reviews · {w.lapses} lapses · {w.due} due
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="surface flex flex-col justify-between gap-4 p-6">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cream-faint">Next action</p>
                <p className="mt-3 text-sm leading-relaxed text-cream-dim">
                  {data.dueToday > 0
                    ? `${data.dueToday} cards are already due. Clear those first — schedule beats enthusiasm.`
                    : "Nothing is due. Generate a deck from the chapter you've been avoiding."}
                </p>
              </div>
              <div className="space-y-2">
                {data.decks.length > 0 ? (
                  data.decks.slice(0, 2).map((d) => (
                    <Link
                      key={d.id}
                      href={`/decks/${d.id}`}
                      className="press flex items-center justify-between gap-2 rounded-xl border border-hairline bg-ink-3/50 px-3.5 py-2.5 text-xs font-semibold text-cream hover:border-acid/50 hover:text-acid"
                    >
                      <span className="truncate">{d.title}</span>
                      <ArrowRight className="size-3.5 shrink-0" />
                    </Link>
                  ))
                ) : (
                  <Link
                    href="/generate"
                    className="press flex items-center justify-center gap-2 rounded-full bg-acid px-4 py-2.5 text-xs font-bold text-ink hover:bg-cream"
                  >
                    <Brain className="size-3.5" /> Generate a deck
                  </Link>
                )}
                <Link
                  href="/ask"
                  className="press flex items-center justify-center gap-2 rounded-full border border-hairline-strong px-4 py-2.5 text-xs font-semibold text-cream hover:border-acid/60 hover:text-acid"
                >
                  Ask about a weak topic
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
