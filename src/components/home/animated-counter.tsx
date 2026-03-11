'use client';

import { useEffect, useRef, useState } from 'react';

interface StatItem {
  label: string;
  value: number;
}

export function AnimatedStats({ stats }: { stats: StatItem[] }) {
  return (
    <section className="border-y border-surface-200 bg-white py-10" aria-label="Platform statistics">
      <div className="container-app">
        <div className="grid grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <CountUp value={s.value} />
              <p className="mt-1 text-sm font-medium text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();

    function animate() {
      const duration = 1200;
      const start = performance.now();

      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }
  }, [value]);

  return (
    <p ref={ref} className="text-3xl font-bold text-brand sm:text-4xl">
      {display.toLocaleString()}
    </p>
  );
}
