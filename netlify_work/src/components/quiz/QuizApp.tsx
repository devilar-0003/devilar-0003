"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Flame,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { getSessionId } from "@/lib/session";
import { QUIZ_QUESTIONS, type QuizQuestion } from "@/lib/content";

type Phase = "start" | "playing" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function QuizApp() {
  const [phase, setPhase] = useState<Phase>("start");
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => QUIZ_QUESTIONS);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [selectedDeck, setSelectedDeck] = useState(0);
  const [deckOptions, setDeckOptions] = useState<{ id: number; title: string; subject: string; totalCards: number; dueCards: number }[]>([]);
  const [deckLabel, setDeckLabel] = useState("Core Science Mastery");
  const [quizWarning, setQuizWarning] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [buildingQuiz, setBuildingQuiz] = useState(false);
  const [finalPct, setFinalPct] = useState(0);
  const [best, setBest] = useState<{ pct: number; timeMs: number } | null>(null);
  const startTime = useRef(0);
  const postedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("retain:best-quiz");
      if (raw) setBest(JSON.parse(raw));
    } catch {}

    const deckParam = Number(new URLSearchParams(window.location.search).get("deck"));
    if (Number.isInteger(deckParam) && deckParam > 0) setSelectedDeck(deckParam);

    fetch(`/api/decks?sessionId=${encodeURIComponent(getSessionId())}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.decks) setDeckOptions(data.decks);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setElapsed(Date.now() - startTime.current), 250);
    return () => clearInterval(t);
  }, [phase]);

  async function start() {
    setQuizError(null);
    setQuizWarning(null);
    let picked: QuizQuestion[] = shuffle(QUIZ_QUESTIONS);
    let label = "Core Science Mastery";

    if (selectedDeck > 0) {
      setBuildingQuiz(true);
      try {
        const res = await fetch("/api/quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: getSessionId(), deckId: selectedDeck, count: 10 }),
        });
        const data = await res.json();
        if (!res.ok) {
          setQuizError(data.error ?? "Could not build a quiz from that deck.");
          return;
        }
        const generated: QuizQuestion[] = (data.questions as QuizQuestion[]).map((q, i) => ({
          ...q,
          id: `ai-${data.deckId}-${i}`,
        }));
        if (generated.length === 0) {
          setQuizError("That deck didn't produce any questions.");
          return;
        }
        picked = generated;
        label = (data.deckTitle as string) ?? "AI deck";
        setQuizWarning((data.warning as string) ?? null);
      } catch {
        setQuizError("Could not build a quiz right now. Try again.");
        return;
      } finally {
        setBuildingQuiz(false);
      }
    }

    setDeckLabel(label);
    setQuestions(picked);
    setQIndex(0);
    setSelected(null);
    setAnswers(new Array(picked.length).fill(null));
    setElapsed(0);
    setPhase("playing");
    setFinalScore(0);
    setFinalPct(0);
    postedRef.current = false;
    startTime.current = Date.now();
  }

  function choose(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  }

  function next() {
    if (qIndex + 1 >= questions.length) {
      finish();
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
  }

  function finish() {
    const elapsedMs = Date.now() - startTime.current;
    const final: number[] = questions.map((q, i) => (answers[i] === q.correctIndex ? 1 : 0));
    const score = final.reduce((a, b) => a + b, 0);
    const pct = Math.round((score / questions.length) * 100);

    setFinalScore(score);
    setFinalPct(pct);
    setElapsed(elapsedMs);
    setPhase("result");

    try {
      const raw = window.localStorage.getItem("retain:best-quiz");
      const prev = raw ? (JSON.parse(raw) as { pct: number; timeMs: number }) : null;
      const improved = !prev || pct > prev.pct || (pct === prev.pct && elapsedMs < prev.timeMs);
      const nextBest = improved ? { pct, timeMs: elapsedMs } : prev;
      if (improved) window.localStorage.setItem("retain:best-quiz", JSON.stringify(nextBest));
      setBest(nextBest);
    } catch {}

    if (!postedRef.current) {
      postedRef.current = true;
      const id = getSessionId();
      fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          deck: deckLabel,
          score,
          total: questions.length,
          durationMs: elapsedMs,
        }),
      }).catch(() => {});
    }
  }

  const question = questions[qIndex] as QuizQuestion | undefined;
  const progress = phase === "playing" ? ((qIndex + 1) / questions.length) * 100 : phase === "result" ? 100 : 0;

  const subjectBreakdown = useMemo(() => {
    const bySubject = new Map<string, { correct: number; total: number }>();
    questions.forEach((q, i) => {
      const cur = bySubject.get(q.subject) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (answers[i] != null && answers[i] === q.correctIndex) cur.correct += 1;
      bySubject.set(q.subject, cur);
    });
    return [...bySubject.entries()];
  }, [questions, answers]);

  const ring = 2 * Math.PI * 52;
  const ringPct = finalPct / 100;

  // ---------- START ----------
  if (phase === "start") {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 md:px-8">
        <Link href="/dashboard" className="press inline-flex items-center gap-2 text-sm font-semibold text-cream-dim transition-colors hover:text-acid">
          ← Dashboard
        </Link>

        <div className="mt-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-ink-2/80 px-4 py-1.5 text-xs font-semibold text-cream-dim">
            <Flame className="size-3.5 text-acid" /> Record-pace quiz
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.02em] text-cream">
            The <span className="italic text-acid">60-second</span> exam.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream-dim">
            One run, twelve questions, zero mercy for hesitation. Speed is meaningless —{" "}
            <span className="text-cream">retention is proof</span>.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Questions", value: String(questions.length), icon: Target },
            { label: "Target pace", value: "< 75s", icon: Timer },
            { label: "Scoring", value: "Instant", icon: Zap },
          ].map((s) => (
            <div key={s.label} className="surface p-5">
              <s.icon className="size-5 text-acid" />
              <p className="mt-4 font-display text-2xl font-semibold text-cream">{s.value}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-cream-faint">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cream-faint">
            <Layers className="size-3.5 text-acid" /> Question source
          </p>
          <div className="mt-3 grid gap-2">
            <button
              onClick={() => setSelectedDeck(0)}
              className={`press flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                selectedDeck === 0 ? "border-acid/60 bg-acid/10" : "border-hairline bg-ink-2/60 hover:border-hairline-strong"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold text-cream">Core Science Mastery</span>
                <span className="text-xs text-cream-faint">Built-in deck · {QUIZ_QUESTIONS.length} curated questions</span>
              </span>
              <span className={`text-[0.62rem] font-bold uppercase tracking-wider ${selectedDeck === 0 ? "text-acid" : "text-cream-faint"}`}>
                built-in
              </span>
            </button>
            {deckOptions.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDeck(d.id)}
                className={`press flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                  selectedDeck === d.id ? "border-acid/60 bg-acid/10" : "border-hairline bg-ink-2/60 hover:border-hairline-strong"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-cream">{d.title}</span>
                  <span className="text-xs text-cream-faint">
                    {d.subject} · {d.totalCards} cards · {d.dueCards} due
                  </span>
                </span>
                <span className={`shrink-0 text-[0.62rem] font-bold uppercase tracking-wider ${selectedDeck === d.id ? "text-acid" : "text-cream-faint"}`}>
                  AI deck
                </span>
              </button>
            ))}
            {deckOptions.length === 0 && (
              <Link
                href="/generate"
                className="press inline-flex items-center justify-between gap-2 rounded-2xl border border-dashed border-hairline-strong px-4 py-3 text-sm text-cream-dim hover:border-acid/50 hover:text-acid"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4 text-acid" /> Generate a deck to unlock AI quizzes
                </span>
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>

        {selectedDeck > 0 && (
          <p className="mt-3 flex items-center gap-2 text-xs text-cream-faint">
            <Sparkles className="size-3.5 text-acid" /> Questions are generated from your deck's cards, with instantly scored explanations.
          </p>
        )}

        {quizWarning && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-ink-2/70 p-3 text-xs text-cream-dim">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-acid" /> {quizWarning}
          </p>
        )}
        {quizError && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-ember/30 bg-ember/10 p-3 text-xs text-cream-dim">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ember" /> {quizError}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={start}
            disabled={buildingQuiz}
            className="press inline-flex items-center gap-3 rounded-full bg-acid px-8 py-4 text-base font-bold text-ink shadow-[0_10px_40px_rgba(207,240,76,0.35)] transition-all hover:bg-cream disabled:opacity-60"
          >
            {buildingQuiz ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
            {buildingQuiz ? "Building your quiz…" : "Start the run"}
          </button>
          {best && (
            <span className="text-sm text-cream-dim">
              Best so far: <span className="font-bold text-cream">{best.pct}%</span> in {formatTime(best.timeMs)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ---------- PLAYING ----------
  if (phase === "playing" && question) {
    const isAnswered = selected !== null;
    const correct = selected === question.correctIndex;

    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 md:px-8">
        {/* top bar */}
        <div className="flex items-center justify-between gap-4">
          <span className="max-w-[70%] truncate rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-acid">
            {question.subject}
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-sm tabular-nums text-cream-dim">
            <Timer className="size-4 text-acid" /> {formatTime(elapsed)}
          </span>
        </div>

        {/* progress */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-3">
          <div
            className="h-full rounded-full bg-acid transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-right font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cream-faint">
          {qIndex + 1} / {questions.length}
        </p>

        <h2 className="mt-6 font-display text-[clamp(1.5rem,4vw,2.3rem)] font-medium leading-[1.25] text-cream">
          {question.question}
        </h2>

        <div className="mt-7 grid gap-3">
          {question.options.map((opt, i) => {
            const show = isAnswered;
            const isSel = selected === i;
            const isCorrect = i === question.correctIndex;
            let cls = "border-hairline-strong bg-ink-2 text-cream hover:border-acid/60 hover:bg-ink-3";
            if (show && isCorrect) cls = "border-acid bg-acid/15 text-cream shadow-[0_0_30px_rgba(207,240,76,0.18)]";
            else if (show && isSel && !isCorrect) cls = "border-ember bg-ember/15 text-cream";
            else if (show) cls = "border-hairline bg-ink-2/60 text-cream-faint opacity-60";

            return (
              <button
                key={i}
                disabled={isAnswered}
                onClick={() => choose(i)}
                className={`press group flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all disabled:cursor-default ${cls}`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg border text-sm font-bold transition-colors ${
                    show && isCorrect
                      ? "border-acid bg-acid text-ink"
                      : show && isSel
                        ? "border-ember bg-ember text-ink"
                        : "border-hairline-strong text-cream-dim group-hover:border-acid/60 group-hover:text-acid"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 font-medium">{opt}</span>
                {show && isCorrect && <span className="text-xs font-bold uppercase tracking-[0.18em] text-acid">Correct</span>}
                {show && isSel && !isCorrect && (
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-ember">Try again</span>
                )}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-5 rounded-2xl border border-hairline bg-ink-2/70 p-5">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-cream-dim">
              <Brain className="mt-0.5 size-4 shrink-0 text-acid" />
              <span>
                <span className={correct ? "font-semibold text-acid" : "font-semibold text-ember"}>
                  {correct ? "Sharp. " : "Not quite. "}
                </span>
                {question.explanation}
              </span>
            </p>
            <button
              onClick={next}
              className="press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-cream"
            >
              {qIndex + 1 >= questions.length ? "See the results" : "Next question"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- RESULT ----------
  const grade = finalPct >= 85 ? "Record-time mastery" : finalPct >= 60 ? "Nearly sharp" : "Keep retaining";

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 md:px-8">
      <div className="surface relative overflow-hidden p-8 text-center">
        <div className="glow-orb left-1/2 top-[-40%] h-64 w-64 -translate-x-1/2 bg-acid/25" />
        <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.3em] text-cream-faint">Run complete</p>

        <div className="relative mx-auto mt-6 size-44">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(244,239,228,0.09)" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#cff04c"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - ringPct)}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-semibold tabular-nums text-cream">{finalPct}%</span>
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-cream-faint">score</span>
          </div>
        </div>

        <h2 className="relative mt-6 font-display text-[clamp(1.8rem,4.6vw,2.8rem)] font-medium leading-tight text-cream">
          {grade}
        </h2>
        <p className="relative mt-2 text-sm text-cream-dim">
          {finalScore}/{questions.length} correct · ran in {formatTime(elapsed)}
        </p>
        <p className="relative mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-cream-faint">{deckLabel}</p>

        <div className="relative mt-6 flex flex-wrap justify-center gap-2">
          {subjectBreakdown.map(([subj, v]) => (
            <span
              key={subj}
              className="rounded-full border border-hairline-strong bg-ink-3 px-3 py-1.5 text-[0.68rem] font-semibold text-cream-dim"
            >
              {subj} <span className="text-acid">{v.correct}/{v.total}</span>
            </span>
          ))}
        </div>

        {best && (
          <p className="relative mt-5 text-xs text-cream-faint">
            Personal best: <span className="font-bold text-acid">{best.pct}%</span> in {formatTime(best.timeMs)}
          </p>
        )}

        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={start}
            className="press inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-cream"
          >
            <RotateCcw className="size-4" /> Retake the run
          </button>
          <Link
            href="/dashboard"
            className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-acid/60 hover:text-acid"
          >
            Back to dashboard
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
