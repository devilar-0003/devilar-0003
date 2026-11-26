import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-hairline-strong bg-ink-2/70 px-6 py-16 text-center shadow-[0_40px_120px_rgba(0,0,0,0.5)] sm:px-14 sm:py-20">
            <div className="glow-orb left-[12%] top-[-40%] h-72 w-72 bg-acid/25" />
            <div className="glow-orb bottom-[-45%] right-[8%] h-80 w-80 bg-ember/20" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, rgba(207,240,76,0.35) 0 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            />
            <div className="relative">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">The clock is ticking</p>
              <h2 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.3rem)] font-medium leading-[1.02] tracking-[-0.02em] text-cream">
                Retain it.
                <br />
                <span className="italic text-acid">Not just memorize it.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-cream-dim">
                Set your exam date, flip one card, take one quiz. The record-time result is already on the table.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="press inline-flex items-center gap-2.5 rounded-full bg-acid px-8 py-4 text-base font-bold text-ink shadow-[0_10px_44px_rgba(207,240,76,0.35)] transition-all hover:bg-cream"
                >
                  Open the dashboard
                  <ArrowRight className="size-5" />
                </Link>
                <Link
                  href="/flashcards"
                  className="press inline-flex items-center rounded-full border border-hairline-strong px-8 py-4 text-base font-semibold text-cream transition-colors hover:border-acid/70 hover:text-acid"
                >
                  Start with flashcards
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
