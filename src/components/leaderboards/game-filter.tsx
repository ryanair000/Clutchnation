'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface GameInfo {
  id: string;
  name: string;
  slug: string;
}

export function GameFilter({
  games,
  currentGame,
}: {
  games: GameInfo[];
  currentGame: string;
}) {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') ?? 'all';

  return (
    <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1 overflow-x-auto">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/leaderboards?game=${game.id}&mode=${mode}`}
          className={cn(
            'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            currentGame === game.id
              ? 'bg-white text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {game.name}
        </Link>
      ))}
    </div>
  );
}
