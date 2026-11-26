import Link from "next/link";
import { Logo } from "@/components/Nav";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-6 text-center text-cream">
      <div className="glow-orb left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 bg-acid/15" />
      <div className="relative">
        <Logo />
        <p className="mt-10 font-display text-[clamp(3rem,10vw,5.5rem)] font-medium italic leading-none text-acid">404</p>
        <h1 className="mt-4 font-display text-2xl font-medium text-cream">This page slipped the schedule.</h1>
        <p className="mt-3 text-cream-dim">The route doesn't exist — but the deck does.</p>
        <Link
          href="/"
          className="press mt-8 inline-flex items-center gap-2 rounded-full bg-acid px-7 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-cream"
        >
          Back to the front door
        </Link>
      </div>
    </main>
  );
}
