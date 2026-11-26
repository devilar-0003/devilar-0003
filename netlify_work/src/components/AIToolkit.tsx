import Link from "next/link";
import { ArrowRight, Brain, FileText, Image as ImageIcon, ListChecks, Sparkles, Target, Wand2 } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";

const TOOLS = [
  {
    icon: FileText,
    title: "PDF → flashcards",
    body: "Upload a chapter and the server extracts the text, then drafts exam-ready cards from it.",
    tag: "Extract + generate",
  },
  {
    icon: Sparkles,
    title: "Gemini generation",
    body: "Structured flashcards, answers and explanations authored from your own source material.",
    tag: "AI authoring",
  },
  {
    icon: Wand2,
    title: "Cloze deletions",
    body: "Fill-the-blank recall built straight from key sentences — the fastest retention format there is.",
    tag: "Active recall",
  },
  {
    icon: ImageIcon,
    title: "Image-based learning",
    body: "Snap a diagram, slide or handwritten page and turn the visual itself into scheduled cards.",
    tag: "Vision",
  },
  {
    icon: ListChecks,
    title: "AI quizzes",
    body: "MCQs written from your deck, scored instantly, with the reasoning behind every answer.",
    tag: "Record pace",
  },
  {
    icon: Target,
    title: "Weak-topic analysis",
    body: "Mastery per subject from your real review history, with a daily plan that attacks the gaps.",
    tag: "Smart planning",
  },
];

export default function AIToolkit() {
  return (
    <section className="relative border-y border-hairline bg-ink-2/40 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb left-[8%] top-[10%] h-64 w-64 bg-acid/15" />
        <div className="glow-orb bottom-[0%] right-[5%] h-72 w-72 bg-ember/10" />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          tag="AI toolkit"
          title={
            <>
              Any source. <span className="italic text-acid">Any subject.</span> Cards in seconds.
            </>
          }
          lede="A full AI study loop: extract, generate, quiz, analyse and ask — grounded in your own material."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => (
            <Reveal key={tool.title} delay={i * 70}>
              <div className="group surface h-full p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-acid/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-acid/12 text-acid transition-colors duration-500 group-hover:bg-acid group-hover:text-ink">
                    <tool.icon className="size-5" />
                  </div>
                  <span className="rounded-full border border-hairline-strong px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-cream-faint">
                    {tool.tag}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-medium text-cream">{tool.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-dim">{tool.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/generate"
            className="press inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-bold text-ink hover:bg-cream"
          >
            <Brain className="size-4" /> Generate a deck now
            <ArrowRight className="size-4" />
          </Link>
          <span className="text-xs text-cream-faint">Gemini-powered when connected · offline engine otherwise</span>
        </Reveal>
      </div>
    </section>
  );
}
