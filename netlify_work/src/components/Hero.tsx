import Link from "next/link";
import { ArrowRight, Zap, Brain, Timer } from "lucide-react";
import Reveal from "@/components/Reveal";
import Countdown from "@/components/Countdown";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32">
      {/* atmosphere */}
      <div className="glow-orb left-[-10%] top-[-20%] h-[34rem] w-[34rem] bg-acid/25" />
      <div className="glow-orb right-[-14%] top-[28%] h-[30rem] w-[30rem] bg-ember/15" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,239,228,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,228,0.09) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black 30%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        {/* Copy */}
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-ink-2/80 px-4 py-1.5 text-xs font-semibold tracking-wide text-cream-dim">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-acid opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-acid" />
              </span>
              For exam-ready minds
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-7 font-display text-[clamp(3.2rem,8.4vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.02em] text-cream">
              Retain
              <br />
              <span className="italic text-acid">everything.</span>
              <br />
              <span className="italic squiggle">In record&nbsp;time.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-cream-dim">
              A spaced-repetition engine and record-pace quiz that turns cramming into retention —
              built for the 48 hours before everything matters.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="press group inline-flex items-center gap-2.5 rounded-full bg-acid px-7 py-4 text-base font-bold text-ink shadow-[0_10px_40px_rgba(207,240,76,0.35)] transition-all hover:bg-cream hover:shadow-[0_10px_48px_rgba(244,239,228,0.3)]"
              >
                Start retaining
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/quiz"
                className="press inline-flex items-center gap-2 rounded-full border border-hairline-strong px-7 py-4 text-base font-semibold text-cream transition-colors hover:border-acid/70 hover:text-acid"
              >
                <Zap className="size-5 text-acid" />
                60-second quiz
              </Link>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-hairline pt-6">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl border border-hairline bg-ink-2">
                  <Brain className="size-5 text-acid" />
                </div>
                <div className="text-sm leading-tight text-cream-dim">
                  <div className="font-semibold text-cream">12 cards</div>
                  <div className="text-xs text-cream-faint">seeded & ready</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl border border-hairline bg-ink-2">
                  <Timer className="size-5 text-acid" />
                </div>
                <div className="text-sm leading-tight text-cream-dim">
                  <div className="font-semibold text-cream">2.1M+</div>
                  <div className="text-xs text-cream-faint">cards retained</div>
                </div>
              </div>
              <Countdown compact />
            </div>
          </Reveal>
        </div>

        {/* Deck visual */}
        <Reveal delay={220} className="relative">
          <div className="relative mx-auto max-w-sm">
            <div className="animate-float-late absolute -left-6 top-10 hidden rotate-[-9deg] sm:block">
              <div className="surface w-48 rotate-[-10deg] p-5 opacity-80 shadow-2xl backdrop-blur-sm">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-cream-faint">Physics</p>
                <p className="mt-3 font-display text-lg font-medium leading-snug text-cream">
                  v = u + a·t
                </p>
              </div>
            </div>

            <div className="animate-float relative z-10">
              <div className="surface relative overflow-hidden p-7 pt-6 shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-acid/40 bg-acid/10 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-acid">
                    Chemistry
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cream-faint">Due · now</span>
                </div>
                <p className="mt-8 font-display text-[1.9rem] font-medium leading-[1.15] text-cream">
                  Which gas is produced when a metal reacts with a strong acid?
                </p>
                <div className="mt-10 flex items-center justify-between gap-4">
                  <span className="text-xs text-cream-dim">Tap to flip</span>
                  <span className="grid size-10 place-items-center rounded-full border border-hairline-strong text-acid">
                    <Zap className="size-4" />
                  </span>
                </div>
                <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-acid/20 blur-3xl" />
              </div>
            </div>

            <div className="animate-float-late absolute -right-4 bottom-6 hidden rotate-[7deg] sm:block">
              <div className="surface w-40 p-4 rotate-[8deg] shadow-2xl">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-cream-faint">Biology</p>
                <p className="mt-2 font-display text-base font-medium text-cream">Mitochondrion</p>
              </div>
            </div>

            <div className="animate-pulse-soft absolute -bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-hairline-strong bg-ink-3 px-4 py-2 text-xs font-semibold text-cream shadow-xl">
              <span className="size-2 rounded-full bg-acid" />
              12 cards due right now
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
