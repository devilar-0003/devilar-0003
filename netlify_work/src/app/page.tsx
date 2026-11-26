import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Features from "@/components/Features";
import AIToolkit from "@/components/AIToolkit";
import Stats from "@/components/Stats";
import HowItWorks from "@/components/HowItWorks";
import Voices from "@/components/Voices";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <AIToolkit />
      <Stats />
      <HowItWorks />
      <Voices />
      <FinalCTA />
      <Footer />
    </main>
  );
}
