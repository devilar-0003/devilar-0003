import FlashcardsApp from "@/components/flashcards/FlashcardsApp";
import Nav from "@/components/Nav";
import AppTabs from "@/components/AppTabs";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flashcards — Retain",
  description: "Spaced-repetition flashcards, tuned to your schedule.",
};

export default function FlashcardsPage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <FlashcardsApp />
      <Footer />
    </main>
  );
}
