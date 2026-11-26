import Link from "next/link";
import { NAV_LINKS } from "@/lib/content";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Retain home">
      <span
        className="grid place-items-center rounded-xl bg-acid text-ink font-extrabold shadow-[0_0_28px_rgba(207,240,76,0.35)] transition-transform duration-300 group-hover:-rotate-6"
        style={{ width: size, height: size, fontSize: size * 0.54 }}
      >
        R
      </span>
      <span className="text-[1.3rem] font-bold tracking-tight text-cream">
        retain<span className="text-acid">.</span>
      </span>
    </Link>
  );
}

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-cream-dim transition-colors hover:text-cream"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/generate"
            className="press hidden items-center gap-1.5 rounded-full border border-hairline-strong px-4 py-2 text-sm font-medium text-cream transition-colors hover:border-acid/60 hover:text-acid sm:inline-flex"
          >
            <span className="text-acid">✦</span> AI Studio
          </Link>
          <Link
            href="/decks"
            className="press hidden rounded-full border border-hairline-strong px-4 py-2 text-sm font-medium text-cream transition-colors hover:border-acid/60 hover:text-acid md:inline-flex"
          >
            Decks
          </Link>
          <Link
            href="/dashboard"
            className="press inline-flex items-center gap-2 rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink shadow-[0_4px_24px_rgba(207,240,76,0.25)] hover:bg-cream"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
