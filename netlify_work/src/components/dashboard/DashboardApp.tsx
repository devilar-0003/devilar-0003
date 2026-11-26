"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  CalendarDays,
  Flame,
  Layers,
  ListChecks,
  RefreshCw,
  Save,
  Sparkles,
  Trophy,
  Zap,
  ChevronRight,
  FolderOpen,
  MessageCircleQuestion,
  Target,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import Countdown from "@/components/Countdown";

interface WeeklyBucket {
  label: string;
  count: number;
}

interface RecentItem {
  kind: "review" | "quiz";
  id: string;
  at: string;
  title: string;
  subject: string;
  meta: string;
}

interface Stats {
  dueCount: number;
  reviewedToday: number;
  totalReviews: number;
  streak: number;
  weekly: WeeklyBucket[];
  attempts: {
    total: number;
    avgPercent: number | null;
    bestPercent: number | null;
    totalQuestionsAnswered: number;
    totalQuestionsTotal: number;
  };
  recent: RecentItem[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardApp() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [examName, setExamName] = useState("My exam");
  const [examDate, setExamDate] = useState(() => defaultDate());
  const [savingExam, setSavingExam] = useState(false);
  const [examSaved, setExamSaved] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  function defaultDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().slice(0, 10);
  }

  const load = useCallback(async () => {
    const id = getSessionId();
    setLoading(true);
    setError(false);
    try {
      const [statsRes, examRes] = await Promise.all([
        fetch(`/api/stats?sessionId=${encodeURIComponent(id)}`),
        fetch(`/api/exam?sessionId=${encodeURIComponent(id)}`),
      ]);
      if (!statsRes.ok) throw new Error("stats");
      const statsData = await statsRes.json();
      setStats(statsData);
      if (examRes.ok) {
        const examData = await examRes.json();
        const found = examData.exam as { name: string; date: string } | null;
        if (found) {
          setExamName(found.name);
          setExamDate(found.date);
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveExam() {
    const id = getSessionId();
    setSavingExam(true);
    setExamSaved(false);
    try {
      const res = await fetch("/api/exam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, name: examName, date: examDate }),
      });
      if (res.ok) {
        const data = await res.json();
        setExamSaved(true);
        setTimeout(() => setExamSaved(false), 2400);
      }
    } finally {
      setSavingExam(false);
    }
  }

  const streak = stats?.streak ?? 0;
  const avg = stats?.attempts.avgPercent;
  const best = stats?.attempts.bestPercent;

  const statsCards = [
    { icon: Layers, label: "Cards due now", value: stats ? String(stats.dueCount) : "—", hint: "ready for review" },
    { icon: Flame, label: "Day streak", value: stats ? `${streak}d` : "—", hint: streak > 0 ? "keep the flame alive" : "start today" },
    { icon: Trophy, label: "Quiz average", value: avg !== null && avg !== undefined ? `${avg}%` : "—", hint: best !== null && best !== undefined ? `best ${best}%` : "no attempts yet" },
    { icon: ListChecks, label: "Reviewed today", value: stats ? String(stats.reviewedToday) : "—", hint: stats ? `${stats.totalReviews} all-time` : "" },
  ];

  const maxWeekly = stats ? Math.max(1, ...stats.weekly.map((w) => w.count)) : 1;

  return (
    <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-24 md:px-8 sm:pt-28">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">Command center</p>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,5.6vw,3.6rem)] font-medium leading-[1.02] text-cream">
            Your study, <span className="italic text-acid">on record.</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/generate"
            className="press inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink shadow-[0_8px_30px_rgba(207,240,76,0.28)] hover:bg-cream"
          >
            <Sparkles className="size-4" /> AI Studio
          </Link>
          <Link
            href="/flashcards"
            className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-3 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid"
          >
            <Brain className="size-4" /> Review
          </Link>
          <Link
            href="/quiz"
            className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-3 text-sm font-semibold text-cream hover:border-acid/60 hover:text-acid"
          >
            <Zap className="size-4" /> Quiz
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-3xl bg-ink-2 lg:col-span-1" />
          <div className="grid gap-5 lg:col-span-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-ink-2" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="surface mt-10 p-10 text-center">
          <p className="text-cream-dim">We couldn't reach the database — the board is offline.</p>
          <button
            onClick={load}
            className="press mt-5 inline-flex items-center gap-2 rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-ink"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* countdown + exam editor */}
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="surface glow-orb relative overflow-hidden bg-ink-2 p-6 lg:col-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-acid/20 blur-3xl" />
              <Countdown />
            </div>

            <div className="surface flex flex-col justify-between gap-5 p-6">
              <div>
                <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.26em] text-cream-faint">
                  <CalendarDays className="size-4 text-acid" />
                  Exam settings
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-medium text-cream-dim">Name</span>
                    <input
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="My exam"
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-ink-3 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream-faint focus:border-acid/60 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-cream-dim">Date</span>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-hairline bg-ink-3 px-3.5 py-2.5 text-sm text-cream focus:border-acid/60 focus:outline-none [color-scheme:dark]"
                    />
                  </label>
                </div>
              </div>
              <button
                onClick={saveExam}
                disabled={savingExam}
                className="press inline-flex items-center justify-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-cream disabled:opacity-60"
              >
                {savingExam ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : examSaved ? (
                  <ListChecks className="size-4" />
                ) : (
                  <Save className="size-4" />
                )}
                {examSaved ? "Locked in" : "Save exam date"}
              </button>
            </div>
          </div>

          {/* stat cards */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((c) => (
              <div key={c.label} className="surface group p-5">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-acid/12 text-acid transition-colors group-hover:bg-acid group-hover:text-ink">
                    <c.icon className="size-4.5" />
                  </div>
                </div>
                <p className="mt-4 font-display text-3xl font-semibold tabular-nums text-cream">{c.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-cream-dim">{c.label}</p>
                <p className="mt-2 text-[0.68rem] text-cream-faint">{c.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {/* weekly volume */}
            <div className="surface p-6 lg:col-span-1">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.26em] text-cream-faint">Last 7 days</p>
              <div className="mt-6 flex h-36 items-end gap-2.5">
                {stats?.weekly.map((w, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[0.6rem] font-bold tabular-nums text-cream-dim">{w.count > 0 ? w.count : ""}</span>
                    <div className="flex h-24 w-full items-end rounded-lg bg-ink-3/70 p-1">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-acid-dim to-acid transition-all duration-700"
                        style={{ height: `${w.count > 0 ? Math.max(16, (w.count / maxWeekly) * 100) : 6}%` }}
                      />
                    </div>
                    <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-cream-faint">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* activity feed */}
            <div className="surface flex max-h-[26rem] flex-col p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.26em] text-cream-faint">Recent activity</p>
                <Sparkles className="size-4 text-cream-faint" />
              </div>
              {stats && stats.recent.length > 0 ? (
                <ul className="mt-4 divide-y divide-hairline overflow-y-auto pr-1">
                  {stats.recent.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-3.5">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                          item.kind === "quiz" ? "bg-ember/15 text-ember" : "bg-acid/12 text-acid"
                        }`}
                      >
                        {item.kind === "quiz" ? <Zap className="size-4" /> : <Brain className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-cream">{item.title}</p>
                        <p className="mt-0.5 text-xs text-cream-faint">
                          {item.kind === "quiz" ? "Quiz attempt · " : item.subject + " · "}
                          {item.meta}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-cream-faint">{timeAgo(item.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-strong p-8 text-center">
                  <Brain className="size-7 text-cream-faint" />
                  <p className="mt-3 max-w-xs text-sm text-cream-dim">
                    No activity yet. Flip your first card to start the feed.
                  </p>
                  <Link
                    href="/flashcards"
                    className="press mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-acid hover:text-cream"
                  >
                    Open flashcards <ChevronRight className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* AI quick actions */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/generate", icon: Sparkles, title: "AI Studio", body: "PDF, image or topic → deck", accent: true },
              { href: "/decks", icon: FolderOpen, title: "Deck library", body: "Every generated deck" },
              { href: "/plan", icon: Target, title: "Smart plan", body: "Weak topics + daily focus" },
              { href: "/ask", icon: MessageCircleQuestion, title: "Ask AI", body: "Doubt solving in context" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`press group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${
                  a.accent
                    ? "border-acid/40 bg-acid/10 hover:border-acid/70"
                    : "border-hairline bg-ink-2/60 hover:border-acid/40"
                }`}
              >
                <a.icon className="size-4.5 text-acid" />
                <p className="mt-3 text-sm font-semibold text-cream">{a.title}</p>
                <p className="mt-0.5 text-xs text-cream-faint">{a.body}</p>
              </Link>
            ))}
          </div>

          {/* insight strip */}
          <div className="mt-5 flex items-center justify-between gap-4 rounded-3xl border border-hairline bg-ink-2/60 px-6 py-4">
            <p className="text-sm text-cream-dim">
              {stats && stats.attempts.total > 0
                ? `You've logged ${stats.attempts.total} quiz attempt${stats.attempts.total > 1 ? "s" : ""} — ${stats.attempts.totalQuestionsAnswered}/${stats.attempts.totalQuestionsTotal} questions right.`
                : "Every retained point starts with one honest review."}
            </p>
            <Link href="/quiz" className="press shrink-0 text-sm font-semibold text-acid hover:text-cream">
              Beat the clock
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
