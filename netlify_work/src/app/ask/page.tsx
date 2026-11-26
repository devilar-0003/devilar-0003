import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AppTabs from "@/components/AppTabs";
import AskApp from "@/components/ask/AskApp";

export const metadata: Metadata = {
  title: "Ask AI — Retain",
  description: "AI explanations and doubt solving grounded in your own flashcards and notes.",
};

export default async function AskPage({ searchParams }: { searchParams: Promise<{ deck?: string }> }) {
  const { deck } = await searchParams;
  const deckId = Number(deck);

  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <AskApp deckId={Number.isInteger(deckId) && deckId > 0 ? deckId : undefined} />
      <Footer />
    </main>
  );
}
