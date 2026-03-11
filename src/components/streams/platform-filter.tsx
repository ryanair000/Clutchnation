'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STREAM_PLATFORMS, STREAM_PLATFORM_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All' },
  ...STREAM_PLATFORMS.map((p) => ({ key: p, label: STREAM_PLATFORM_LABELS[p] })),
];

export function PlatformFilter({ currentPlatform }: { currentPlatform: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1">
      {FILTERS.map(({ key, label }) => (
        <Link
          key={key}
          href={key === 'all' ? pathname : `${pathname}?platform=${key}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            currentPlatform === key
              ? 'bg-white text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
