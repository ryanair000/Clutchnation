'use client';

import Link from 'next/link';
import type { CommunityPost } from '@/types';
import { ReactionBar } from './reaction-bar';
import { CommentSection } from './comment-section';
import { formatDateTime, getInitials } from '@/lib/utils';

interface PostCardProps {
  post: CommunityPost;
  userId: string;
}

export function PostCard({ post, userId }: PostCardProps) {
  const author = post.author;
  const username = author?.username ?? 'Unknown';

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5">
      {/* Author header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${username}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-sm font-semibold text-ink-muted"
        >
          {getInitials(username)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${username}`}
            className="text-sm font-semibold hover:text-brand transition-colors"
          >
            {username}
          </Link>
          <p className="text-xs text-ink-light">{formatDateTime(post.created_at)}</p>
        </div>
        {post.is_pinned && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Pinned
          </span>
        )}
      </div>

      {/* Title (discussions) */}
      {post.title && (
        <h3 className="mt-3 font-heading text-base font-semibold">{post.title}</h3>
      )}

      {/* Content */}
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
        {post.content}
      </p>

      {/* Media */}
      {post.media_urls.length > 0 && (
        <div className="mt-3 grid gap-2 grid-cols-2">
          {post.media_urls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="relative aspect-video overflow-hidden rounded-lg bg-surface-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Media ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="mt-3 border-t border-surface-100 pt-3">
        <ReactionBar
          targetType="post"
          targetId={post.id}
          reactionCount={post.reaction_count}
          commentCount={post.comment_count}
          userId={userId}
        />
      </div>

      <CommentSection
        targetType="post"
        targetId={post.id}
        commentCount={post.comment_count}
        userId={userId}
      />
    </div>
  );
}
