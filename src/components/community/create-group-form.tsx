'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_GROUP_MEMBERS, GROUP_NAME_REGEX } from '@/lib/constants';

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || submitting) return;

    if (!GROUP_NAME_REGEX.test(trimmedName)) {
      setError('Group name must be 3-50 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/community/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          is_public: isPublic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create group');
        return;
      }

      router.push(`/community/groups/${data.group.slug}`);
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-surface-200 bg-white p-6"
    >
      {/* Name */}
      <div>
        <label
          htmlFor="group-name"
          className="mb-1 block text-sm font-medium"
        >
          Group Name
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="e.g. Nairobi FC Legends"
          className="w-full rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          required
        />
        <p className="mt-1 text-xs text-ink-light">3-50 characters</p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="group-desc"
          className="mb-1 block text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id="group-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What's this group about?"
          className="w-full resize-none rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <p className="mt-1 text-xs text-ink-light">
          {description.length}/500
        </p>
      </div>

      {/* Visibility */}
      <div>
        <label className="mb-2 block text-sm font-medium">Visibility</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="text-brand focus:ring-brand"
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="text-brand focus:ring-brand"
            />
            Private
          </label>
        </div>
        <p className="mt-1 text-xs text-ink-light">
          {isPublic
            ? 'Anyone can find and join this group.'
            : 'Only invited members can join.'}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Group'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-surface-300 px-6 py-2.5 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
