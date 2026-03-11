'use client';

import { useState, useCallback } from 'react';
import type { Comment } from '@/types';
import { formatDateTime, getInitials } from '@/lib/utils';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';
import Link from 'next/link';

interface CommentSectionProps {
  targetType: 'post' | 'activity';
  targetId: string;
  commentCount: number;
  userId: string;
}

export function CommentSection({
  targetType,
  targetId,
  commentCount,
  userId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(commentCount);

  const loadComments = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        target_type: targetType,
        target_id: targetId,
      });
      const res = await fetch(`/api/community/comments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [loading, targetType, targetId]);

  function handleExpand() {
    if (!expanded) {
      setExpanded(true);
      loadComments();
    } else {
      setExpanded(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          body: trimmed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setBody('');
        setCount((c) => c + 1);
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/community/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <div className="mt-2">
      {count > 0 && (
        <button
          onClick={handleExpand}
          className="text-xs font-medium text-ink-muted hover:text-brand transition-colors"
        >
          {expanded ? 'Hide comments' : `View ${count} comment${count !== 1 ? 's' : ''}`}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-xs text-ink-light">Loading comments…</p>
          ) : (
            comments.map((comment) => {
              const username = comment.author?.username ?? 'Unknown';
              return (
                <div key={comment.id} className="flex gap-2">
                  <Link
                    href={`/profile/${username}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[10px] font-semibold text-ink-muted"
                  >
                    {getInitials(username)}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <Link
                        href={`/profile/${username}`}
                        className="text-xs font-semibold hover:text-brand transition-colors"
                      >
                        {username}
                      </Link>
                      <span className="text-[10px] text-ink-light">
                        {formatDateTime(comment.created_at)}
                      </span>
                      {comment.author_id === userId && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-[10px] text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {comment.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Comment form — always visible when expanded or count is 0 */}
      {(expanded || count === 0) && (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="Write a comment…"
            className="flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {submitting ? '…' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}
