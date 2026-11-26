import Link from "next/link";
import { Logo } from "@/components/Nav";
import { NAV_LINKS } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-ink-2/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-faint">
            Exam preparation in record time — spaced-repetition flashcards, record-pace quizzes and a live countdown,
            built for the week everything matters.
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-cream-faint">Explore</p>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-cream-dim transition-colors hover:text-acid">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/flashcards" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Flashcards
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-cream-faint">App</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/generate" className="text-sm text-cream-dim transition-colors hover:text-acid">
                AI Studio
              </Link>
            </li>
            <li>
              <Link href="/decks" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Deck library
              </Link>
            </li>
            <li>
              <Link href="/plan" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Smart plan
              </Link>
            </li>
            <li>
              <Link href="/ask" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Ask AI
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/quiz" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Quiz mode
              </Link>
            </li>
            <li>
              <Link href="/api/health" className="text-sm text-cream-dim transition-colors hover:text-acid">
                Health check
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-cream-faint md:px-8">
          <span>© {new Date().getFullYear()} Retain — Exam preparation in record time.</span>
          <span className="font-mono uppercase tracking-[0.22em]">v1.0 · Built for remembering</span>
        </div>
      </div>
    </footer>
  );
}
