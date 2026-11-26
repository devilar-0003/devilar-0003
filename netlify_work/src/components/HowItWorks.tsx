import { BookOpenCheck, Timer, Trophy } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";

const STEPS = [
  {
    n: "01",
    icon: BookOpenCheck,
    title: "Pick the subject",
    body: "Choose Physics, Chemistry, Biology or General — or set your exam and let the clock do the steering.",
  },
  {
    n: "02",
    icon: Timer,
    title: "Retain in 60 seconds",
    body: "Flip the card, rate your confidence, move on. The engine reschedules what you keep — and resurfaces what you don't.",
  },
  {
    n: "03",
    icon: Trophy,
    title: "Crush the exam",
    body: "Quiz on record pace, then check the proof: streaks, weekly volume and quiz averages that tell the truth.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          tag="How it works"
          title={
            <>
              Three moves. <span className="italic text-acid">Zero procrastination.</span>
            </>
          }
          lede="Retention is a system, not a mood. Every session is a run, every result a receipt."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-hairline bg-ink-2/70 p-7 transition-all duration-500 hover:border-acid/40">
                <div className="absolute -right-6 -top-8 select-none font-display text-[7.5rem] font-semibold italic leading-none text-cream/[0.045] transition-colors duration-500 group-hover:text-acid/10">
                  {s.n}
                </div>
                <div className="relative">
                  <div className="grid size-12 place-items-center rounded-2xl bg-acid/12 text-acid transition-colors duration-500 group-hover:bg-acid group-hover:text-ink">
                    <s.icon className="size-5" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-medium text-cream">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-cream-dim">{s.body}</p>
                  <div className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.26em] text-cream-faint">
                    Step {s.n} / 03
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
