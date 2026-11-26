import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AppTabs from "@/components/AppTabs";
import DeckStudy from "@/components/decks/DeckStudy";

export const metadata: Metadata = {
  title: "Study deck — Retain",
};

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deckId = Number(id);

  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      {Number.isInteger(deckId) ? (
        <DeckStudy deckId={deckId} />
      ) : (
        <div className="mx-auto max-w-3xl px-5 py-20 text-center text-cream-dim">Invalid deck.</div>
      )}
      <Footer />
    </main>
  );
}
