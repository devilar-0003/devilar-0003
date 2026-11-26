import Reveal from "@/components/Reveal";

export default function SectionHeading({
  tag,
  title,
  lede,
}: {
  tag: string;
  title: React.ReactNode;
  lede?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-acid">{tag}</p>
      <h2 className="mt-4 font-display text-[clamp(2rem,5.4vw,3.4rem)] font-medium leading-[1.06] tracking-[-0.01em] text-cream">
        {title}
      </h2>
      {lede && <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream-dim sm:text-lg">{lede}</p>}
    </Reveal>
  );
}
