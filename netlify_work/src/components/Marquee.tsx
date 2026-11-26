import { Asterisk } from "lucide-react";

const ITEMS = [
  "SPACED REPETITION",
  "RECORD-PACE QUIZZES",
  "EXAM COUNTDOWNS",
  "PROOF OF MASTERY",
  "ZERO CRAMMING",
  "SHARP RECALL",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee-mask relative overflow-hidden border-y border-hairline bg-ink-2/60 py-4">
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-8" aria-hidden={half === 1}>
            {row.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-8 text-xs font-semibold tracking-[0.32em] text-cream-dim">
                {item}
                <Asterisk className="size-4 text-acid" aria-hidden />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
