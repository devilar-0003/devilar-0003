"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LayoutDashboard, Layers, ListChecks, MessageCircleQuestion, Sparkles } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "AI Studio", icon: Sparkles },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/flashcards", label: "Cards", icon: Brain },
  { href: "/quiz", label: "Quiz", icon: ListChecks },
  { href: "/plan", label: "Plan", icon: Sparkles },
  { href: "/ask", label: "Ask AI", icon: MessageCircleQuestion },
];

export default function AppTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-hairline bg-ink/60">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(`${tab.href}/`));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                active ? "bg-acid text-ink" : "text-cream-dim hover:bg-ink-3 hover:text-cream"
              }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
