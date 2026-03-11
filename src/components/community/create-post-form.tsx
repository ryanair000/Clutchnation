'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_POST_LENGTH } from '@/lib/constants';

interface CreatePostFormProps {
  userId: string;
  groupId?: string;
}

export function CreatePostForm({ userId, groupId }: CreatePostFormProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [postType, setPostType] = useState<'text' | 'discussion'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: postType,
          title: postType === 'discussion' ? title.trim() || null : null,
          content: trimmed,
          media_urls: [],
          group_id: groupId ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create post');
        return;
      }

      // Reset form and refresh
      setContent('');
      setTitle('');
      setExpanded(false);
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl border border-surface-200 bg-white p-4 text-left text-sm text-ink-muted hover:border-surface-300 transition-colors"
      >
        What&apos;s on your mind?
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surface-200 bg-white p-5"
    >
      {/* Post type toggle */}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setPostType('text')}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            postType === 'text'
              ? 'bg-brand/10 text-brand'
              : 'text-ink-muted hover:bg-surface-50'
          }`}
        >
          Post
        </button>
        <button
          type="button"
          onClick={() => setPostType('discussion')}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            postType === 'discussion'
              ? 'bg-brand/10 text-brand'
              : 'text-ink-muted hover:bg-surface-50'
          }`}
        >
          Discussion
        </button>
      </div>

      {/* Title (discussions only) */}
      {postType === 'discussion' && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          placeholder="Discussion title"
          className="mb-3 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm font-medium focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      )}

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_POST_LENGTH}
        rows={3}
        placeholder={
          postType === 'discussion'
            ? 'Start a discussion…'
            : "What's on your mind?"
        }
        className="w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-light">
          {content.length}/{MAX_POST_LENGTH}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setContent('');
              setTitle('');
              setError('');
            }}
            className="rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </form>
  );
}
