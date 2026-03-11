'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

export function FeaturesGrid({ features }: { features: Feature[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('animate-in');
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="features-grid mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {features.map((f, i) => (
        <div
          key={f.title}
          className="feature-card rounded-xl border border-surface-200 bg-white p-6 transition-all hover:shadow-md"
          style={{ '--delay': `${i * 100}ms` } as React.CSSProperties}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
            {f.icon}
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
