import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";

const VOICES = [
  {
    quote:
      "Forty hours of watching tutorials became twelve minutes of flipping cards. I forgot that panic on the morning of the test.",
    name: "Ayesha R.",
    exam: "MCAT — studying for the 18th",
    metric: "+34 pts lift",
  },
  {
    quote:
      "The quiz pace is genuinely record-time. I finished in less than a minute and still retained the physics — it feels impossible until your own results show it.",
    name: "Daniel M.",
    exam: "JEE Foundation",
    metric: "92% avg",
  },
  {
    quote:
      "The countdown is honest. It doesn't pretend you're ready — it shows you the number, and the week you keep moving on it.",
    name: "Priya S.",
    exam: "MBBS entrance",
    metric: "9-day streak",
  },
];

export default function Voices() {
  return (
    <section id="voices" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          tag="Voices"
          title={
            <>
              They stopped cramming. <span className="italic text-acid">Now they retain.</span>
            </>
          }
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {VOICES.map((v, i) => (
            <Reveal key={v.name} delay={i * 110}>
              <figure className="surface group flex h-full flex-col p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-acid/40">
                <span className="font-display text-5xl leading-none text-acid/80">“</span>
                <blockquote className="-mt-3 flex-1 leading-relaxed text-cream-dim">{v.quote}</blockquote>
                <figcaption className="mt-7 flex items-center justify-between gap-3 border-t border-hairline pt-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acid/70 to-ember/60 font-bold text-ink">
                      {v.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-cream">{v.name}</p>
                      <p className="text-xs text-cream-faint">{v.exam}</p>
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-acid/35 bg-acid/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-acid">
                    {v.metric}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
