'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface GameInfo {
  id: string;
  name: string;
  modes: string[] | string;
}

const MODE_LABELS: Record<string, string> = {
  all: 'Overall',
  '1v1': '1v1',
  '2v2': '2v2',
  '3v3': '3v3',
  pro_clubs: 'Pro Clubs',
  pro_am: 'Pro-Am',
  team_deathmatch: 'TDM',
  search_and_destroy: 'S&D',
};

export function ModeFilter({
  currentMode,
  gameId,
  games,
}: {
  currentMode: string;
  gameId: string;
  games: GameInfo[];
}) {
  const modes = useMemo(() => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return ['all', '1v1'];
    const gameModes = Array.isArray(game.modes) ? game.modes as string[] : JSON.parse(game.modes as string);
    return ['all', ...gameModes];
  }, [games, gameId]);

  return (
    <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1">
      {modes.map((mode) => (
        <Link
          key={mode}
          href={`/leaderboards?game=${gameId}&mode=${mode}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            currentMode === mode
              ? 'bg-white text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          {MODE_LABELS[mode] ?? mode.replace(/_/g, ' ')}
        </Link>
      ))}
    </div>
  );
}
