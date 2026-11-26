"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, started: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);
  return value;
}

function Stat({
  value,
  suffix,
  prefix,
  label,
  started,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  started: boolean;
  decimals?: number;
}) {
  const v = useCountUp(value, started);
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-semibold tabular-nums text-cream sm:text-5xl">
        {prefix}
        {v.toFixed(decimals)}
        <span className="text-acid">{suffix}</span>
      </div>
      <div className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-cream-faint">{label}</div>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative border-y border-hairline bg-ink-2/50">
      <div ref={ref} className="mx-auto grid max-w-6xl grid-cols-2 gap-y-12 px-5 py-16 sm:grid-cols-4 md:px-8">
        <Stat started={started} value={40} suffix="K+" label="Learners retain" />
        <Stat started={started} value={3.2} suffix="×" decimals={1} label="Faster recall" />
        <Stat started={started} value={92} suffix="%" label="Pass-rate lift" />
        <Stat started={started} value={2.1} suffix="M" decimals={1} prefix="" label="Cards retained" />
      </div>
    </section>
  );
}
