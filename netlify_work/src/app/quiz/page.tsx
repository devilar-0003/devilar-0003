import QuizApp from "@/components/quiz/QuizApp";
import Nav from "@/components/Nav";
import AppTabs from "@/components/AppTabs";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz — Retain",
  description: "Timed record-pace MCQ runs — 60 seconds to prove you retained it.",
};

export default function QuizPage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <QuizApp />
      <Footer />
    </main>
  );
}
