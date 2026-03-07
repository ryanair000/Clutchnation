'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEADERBOARD_MODES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const MODE_LABELS: Record<string, string> = {
  all: 'Overall',
  '1v1': '1v1',
  '2v2': '2v2',
  pro_clubs: 'Pro Clubs',
};

export function ModeFilter({ currentMode }: { currentMode: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1">
      {LEADERBOARD_MODES.map((mode) => (
        <Link
          key={mode}
          href={`${pathname}?mode=${mode}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            currentMode === mode
              ? 'bg-white text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {MODE_LABELS[mode] ?? mode}
        </Link>
      ))}
    </div>
  );
}
