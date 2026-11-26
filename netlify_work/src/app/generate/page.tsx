import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AppTabs from "@/components/AppTabs";
import GenerateStudio from "@/components/generate/GenerateStudio";
import { aiEnabled } from "@/lib/gemini";

export const metadata: Metadata = {
  title: "AI Studio — Retain",
  description: "Generate flashcards from a topic, a PDF chapter or a photo of your notes.",
};

export const dynamic = "force-dynamic";

export default function GeneratePage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <GenerateStudio aiEnabled={aiEnabled()} />
      <Footer />
    </main>
  );
}
