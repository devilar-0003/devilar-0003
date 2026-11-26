import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AppTabs from "@/components/AppTabs";
import DeckLibrary from "@/components/decks/DeckLibrary";
import { aiEnabled } from "@/lib/gemini";

export const metadata: Metadata = {
  title: "Deck library — Retain",
  description: "Every AI-generated deck in your workspace, scheduled for spaced repetition.",
};

export const dynamic = "force-dynamic";

export default function DecksPage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <DeckLibrary aiEnabled={aiEnabled()} />
      <Footer />
    </main>
  );
}
