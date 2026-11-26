import { Layers, Zap, Hourglass, BarChart3, ArrowUpRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";

const FEATURES = [
  {
    icon: Layers,
    title: "Spaced-repetition engine",
    body: "Cards resurface exactly when you're about to forget — not one minute sooner or late. SM-2 intervals, tuned per card.",
    foot: "12 seeded cards · infinite decks",
  },
  {
    icon: Zap,
    title: "Record-pace quizzes",
    body: "Timed MCQ bursts with instant scoring. Make wrong answers loud, correct ones crisp. Retention by repetition, not repetition by boredom.",
    foot: "12 questions · <90 sec",
  },
  {
    icon: Hourglass,
    title: "Exam countdown lock",
    body: "One live clock, honest numbers. Your horizon, set once, never argued with — with daily windows that respect your rhythm.",
    foot: "Persistent per device",
  },
  {
    icon: BarChart3,
    title: "Proof of mastery",
    body: "Streak, weekly volume, quiz average, and the best score of your run — the evidence that you actually retained it.",
    foot: "Live from your session",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          tag="The engine"
          title={
            <>
              Four mechanisms.<br />
              <span className="italic text-acid">One outcome</span> — retention.
            </>
          }
          lede="No fluff, no funnels. Just the mechanics of making a memory stick, wired together."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="group surface relative h-full p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-acid/40 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                <div className="flex items-start justify-between">
                  <div className="grid size-13 place-items-center rounded-2xl bg-acid/12 text-acid transition-colors duration-500 group-hover:bg-acid group-hover:text-ink">
                    <f.icon className="size-6" />
                  </div>
                  <ArrowUpRight className="size-5 text-cream-faint transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-acid" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-medium text-cream">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-cream-dim">{f.body}</p>
                <p className="mt-5 border-t border-hairline pt-4 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-cream-faint">
                  {f.foot}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
