import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AppTabs from "@/components/AppTabs";
import PlanApp from "@/components/plan/PlanApp";

export const metadata: Metadata = {
  title: "Smart study plan — Retain",
  description: "A daily plan built from your countdown, due cards and quiz accuracy, plus weak-topic analysis.",
};

export default function PlanPage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <PlanApp />
      <Footer />
    </main>
  );
}
