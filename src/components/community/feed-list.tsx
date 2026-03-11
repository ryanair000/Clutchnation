'use client';

import { useState, useCallback } from 'react';
import type { FeedItem } from '@/types';
import { ActivityCard } from './activity-card';
import { PostCard } from './post-card';

interface FeedListProps {
  initialItems: FeedItem[];
  userId: string;
  groupId?: string;
}

export function FeedList({ initialItems, userId, groupId }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(
    initialItems.length > 0
      ? initialItems[initialItems.length - 1].data.created_at
      : null
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ cursor });
      if (groupId) {
        // Fetch group posts directly
        params.set('group_id', groupId);
        const res = await fetch(`/api/community/posts?${params}`);
        if (res.ok) {
          const data = await res.json();
          const newItems: FeedItem[] = (data.posts ?? []).map(
            (p: FeedItem['data']) => ({ type: 'post' as const, data: p })
          );
          setItems((prev) => [...prev, ...newItems]);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        }
      } else {
        const res = await fetch(`/api/community/feed?${params}`);
        if (res.ok) {
          const data = await res.json();
          setItems((prev) => [...prev, ...(data.items ?? [])]);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        }
      }
    } catch {
      // Silently fail, user can retry
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, groupId]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-10 text-center">
        <p className="text-ink-muted">No activity yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        if (item.type === 'activity') {
          return (
            <ActivityCard
              key={`a-${item.data.id}`}
              event={item.data}
              userId={userId}
            />
          );
        }
        return (
          <PostCard
            key={`p-${item.data.id}`}
            post={item.data}
            userId={userId}
          />
        );
      })}

      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-surface-300 bg-white px-6 py-2 text-sm font-medium text-ink hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
