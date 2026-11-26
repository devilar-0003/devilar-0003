"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/session";

interface ExamInfo {
  name: string;
  date: string; // YYYY-MM-DD
}

function targetFrom(exam: ExamInfo | null): Date {
  if (exam) {
    const d = new Date(`${exam.date}T23:59:59`);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 45);
  fallback.setHours(23, 59, 59, 0);
  return fallback;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Countdown({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = getSessionId();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/exam?sessionId=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setExam(data.exam ?? null);
        }
      } catch {
        // fall back to a default horizon
      } finally {
        if (!cancelled) setReady(true);
        if (!cancelled) setNow(Date.now());
      }
    })();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!ready || now === null) {
    return (
      <span className={compact ? "inline-flex items-center gap-2 text-xs text-cream-dim" : "inline-block h-20 w-full animate-pulse rounded-2xl bg-ink-3"} />
    );
  }

  const target = targetFrom(exam);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-acid/30 bg-acid/10 px-3 py-1.5 text-xs font-semibold text-acid">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-acid" />
        </span>
        {exam ? exam.name : "Exam"} in {days}d {pad(hours)}h
      </span>
    );
  }

  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-cream-faint">
        {exam ? exam.name : "Exam horizon"}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Days", value: String(days).padStart(2, "0") },
          { label: "Hours", value: pad(hours) },
          { label: "Mins", value: pad(mins) },
          { label: "Secs", value: pad(secs) },
        ].map((u) => (
          <div key={u.label} className="rounded-2xl border border-hairline bg-ink-3/80 px-2 py-3 text-center sm:py-4">
            <div className="font-display text-2xl font-semibold tabular-nums text-cream sm:text-3xl">{u.value}</div>
            <div className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-cream-faint">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
