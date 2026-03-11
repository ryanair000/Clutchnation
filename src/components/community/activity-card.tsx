'use client';

import Link from 'next/link';
import type { ActivityEvent } from '@/types';
import { ReactionBar } from './reaction-bar';
import { CommentSection } from './comment-section';
import { formatDateTime } from '@/lib/utils';

function getEventContent(event: ActivityEvent): { icon: string; text: string; href: string | null } {
  const meta = event.metadata;
  const actor = event.actor?.username ?? 'Someone';

  switch (event.event_type) {
    case 'match_completed': {
      const score = `${meta.score_home ?? 0}-${meta.score_away ?? 0}`;
      return {
        icon: '⚔️',
        text: `${actor} won a match ${score}`,
        href: meta.match_id ? `/matches/${meta.match_id}` : null,
      };
    }
    case 'tournament_created':
      return {
        icon: '🏆',
        text: `${actor} created tournament "${meta.title ?? 'Untitled'}"`,
        href: meta.tournament_id ? `/tournaments/${meta.tournament_id}` : null,
      };
    case 'tournament_won':
      return {
        icon: '👑',
        text: `${actor} won "${meta.title ?? 'a tournament'}"!`,
        href: meta.tournament_id ? `/tournaments/${meta.tournament_id}` : null,
      };
    case 'player_joined':
      return {
        icon: '👋',
        text: `${actor} joined ClutchNation`,
        href: actor !== 'Someone' ? `/profile/${actor}` : null,
      };
    case 'streak_milestone':
      return {
        icon: '🔥',
        text: `${actor} is on a ${meta.streak_count ?? '?'}-match win streak!`,
        href: actor !== 'Someone' ? `/profile/${actor}` : null,
      };
    case 'rank_achieved':
      return {
        icon: '📊',
        text: `${actor} reached #${meta.rank ?? '?'} on the leaderboard`,
        href: '/leaderboards',
      };
    default:
      return { icon: '📌', text: `${actor} did something`, href: null };
  }
}

interface ActivityCardProps {
  event: ActivityEvent;
  userId: string;
}

export function ActivityCard({ event, userId }: ActivityCardProps) {
  const { icon, text, href } = getEventContent(event);

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-relaxed">
            {href ? (
              <Link href={href} className="hover:text-brand transition-colors">
                {text}
              </Link>
            ) : (
              text
            )}
          </p>
          <p className="mt-1 text-xs text-ink-light">
            {formatDateTime(event.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-surface-100 pt-3">
        <ReactionBar
          targetType="activity"
          targetId={event.id}
          reactionCount={event.reaction_count}
          commentCount={event.comment_count}
          userId={userId}
        />
      </div>

      <CommentSection
        targetType="activity"
        targetId={event.id}
        commentCount={event.comment_count}
        userId={userId}
      />
    </div>
  );
}
