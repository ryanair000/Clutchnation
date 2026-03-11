'use client';

import { useState } from 'react';
import { REACTION_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ReactionBarProps {
  targetType: 'post' | 'activity';
  targetId: string;
  reactionCount: number;
  commentCount: number;
  userId: string;
}

export function ReactionBar({
  targetType,
  targetId,
  reactionCount,
  commentCount,
  userId,
}: ReactionBarProps) {
  const [count, setCount] = useState(reactionCount);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReaction(reactionType: string) {
    if (loading) return;
    setLoading(true);

    const wasActive = activeReaction === reactionType;

    // Optimistic update
    setActiveReaction(wasActive ? null : reactionType);
    setCount((prev) => prev + (wasActive ? -1 : 1));

    try {
      const res = await fetch('/api/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType,
        }),
      });

      if (!res.ok) {
        // Revert optimistic update
        setActiveReaction(wasActive ? reactionType : null);
        setCount((prev) => prev + (wasActive ? 1 : -1));
      } else {
        const data = await res.json();
        setCount(data.new_count);
      }
    } catch {
      setActiveReaction(wasActive ? reactionType : null);
      setCount((prev) => prev + (wasActive ? 1 : -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        {REACTION_TYPES.map((rt) => (
          <button
            key={rt.value}
            onClick={() => handleReaction(rt.value)}
            disabled={loading}
            title={rt.label}
            className={cn(
              'rounded-lg px-2 py-1 text-sm transition-colors',
              activeReaction === rt.value
                ? 'bg-brand/10 text-brand'
                : 'text-ink-muted hover:bg-surface-50'
            )}
          >
            {rt.emoji}
          </button>
        ))}
      </div>

      {count > 0 && (
        <span className="text-xs font-medium text-ink-muted">{count}</span>
      )}

      <span className="text-xs text-ink-light">
        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </span>
    </div>
  );
}
