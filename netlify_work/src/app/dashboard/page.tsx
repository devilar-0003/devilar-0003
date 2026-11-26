import Nav from "@/components/Nav";
import AppTabs from "@/components/AppTabs";
import Footer from "@/components/Footer";
import DashboardApp from "@/components/dashboard/DashboardApp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Retain",
  description: "Your live study command center: countdown, streak, due cards and quiz proof.",
};

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <AppTabs />
      <DashboardApp />
      <Footer />
    </main>
  );
}
