'use client';

import { useState } from 'react';
import type {
  PlatformType,
  PlatformVerifiedStatus,
  PlatformSyncStatus,
  NormalizedPlatformProfile,
} from '@/types';
import { PlatformPreviewCard } from './platform-preview-card';
import {
  PLATFORM_LABELS,
  PLATFORM_ICONS,
  PLATFORM_ID_REGEX,
  PLATFORM_ID_PLACEHOLDERS,
  PLATFORM_HAS_LOOKUP,
} from '@/lib/constants';

interface PlatformLinkCardProps {
  platform: PlatformType;
  username: string | null;
  accountId: string | null;
  verifiedStatus: PlatformVerifiedStatus;
  syncStatus: PlatformSyncStatus;
  lastSyncedAt: string | null;
  onLinked: () => void;
  onUnlinked: () => void;
}

export function PlatformLinkCard({
  platform,
  username,
  accountId,
  verifiedStatus,
  syncStatus,
  lastSyncedAt,
  onLinked,
  onUnlinked,
}: PlatformLinkCardProps) {
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] =
    useState<NormalizedPlatformProfile | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const label = PLATFORM_LABELS[platform];
  const icon = PLATFORM_ICONS[platform];
  const placeholder = PLATFORM_ID_PLACEHOLDERS[platform];
  const regex = PLATFORM_ID_REGEX[platform];
  const hasLookup = PLATFORM_HAS_LOOKUP[platform];

  const isLinked = verifiedStatus === 'confirmed_by_user' && accountId;

  async function handleVerify() {
    if (!regex.test(lookupId)) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupNotFound(false);
    setLookupResult(null);

    if (!hasLookup) {
      // Manual entry — create a fake profile for confirmation
      setLookupResult({
        platform,
        accountId: lookupId.toLowerCase(),
        username: lookupId,
        avatarUrl: null,
        aboutMe: null,
        shareUrl: null,
        presence: null,
        profileData: {},
        availability: 'public',
        fetchedAt: new Date().toISOString(),
      });
      setLookupLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/platforms/${platform}/lookup/${encodeURIComponent(lookupId)}`,
      );
      const data = await res.json();

      if (res.status === 404 || data.reason === 'not_found') {
        setLookupNotFound(true);
      } else if (!res.ok || !data.found) {
        setLookupError(data.error || 'Lookup failed');
      } else {
        setLookupResult(data.data);
      }
    } catch {
      setLookupError('Network error');
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleConfirm() {
    if (!lookupResult) return;
    try {
      const res = await fetch(`/api/platforms/${platform}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: lookupResult.accountId,
          username: lookupResult.username,
        }),
      });
      if (res.ok) {
        setShowVerify(false);
        setLookupResult(null);
        onLinked();
      } else {
        const data = await res.json();
        setLookupError(data.error || 'Failed to link');
      }
    } catch {
      setLookupError('Network error');
    }
  }

  async function handleUnlink() {
    setUnlinking(true);
    try {
      const res = await fetch(`/api/platforms/${platform}/unlink`, {
        method: 'POST',
      });
      if (res.ok) onUnlinked();
    } catch {
      // Silent fail
    } finally {
      setUnlinking(false);
    }
  }

  function handleCancel() {
    setLookupResult(null);
    setLookupError(null);
    setLookupNotFound(false);
    setShowVerify(false);
  }

  if (isLinked) {
    return (
      <div className="rounded-lg border border-surface-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">{label}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                ✓ Verified
              </span>
              <span className="text-sm text-ink-light">
                {icon} {username}
              </span>
            </div>
            {syncStatus === 'error' && (
              <p className="mt-1 text-xs text-amber-600">
                Sync issue — your profile details may be outdated
              </p>
            )}
            {lastSyncedAt && (
              <p className="mt-1 text-xs text-ink-light">
                Last synced:{' '}
                {new Date(lastSyncedAt).toLocaleDateString('en-KE')}
              </p>
            )}
          </div>
          <button
            onClick={handleUnlink}
            disabled={unlinking}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {unlinking ? 'Unlinking...' : 'Unlink'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-200 p-4">
      <h3 className="text-sm font-semibold text-ink">{label}</h3>
      <p className="mt-1 text-xs text-ink-light">
        {hasLookup
          ? `Verify your ${label} account to add trust to your profile and help opponents find you.`
          : `Enter your ${label} display name. This is manual entry — no verification available.`}
      </p>

      {!showVerify ? (
        <button
          onClick={() => setShowVerify(true)}
          className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Link {label} Account
        </button>
      ) : (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder={placeholder}
              maxLength={32}
              className="flex-1 rounded-lg border border-surface-300 px-3 py-1.5 text-sm focus:border-brand focus:ring-brand"
            />
            <button
              onClick={handleVerify}
              disabled={lookupLoading || !regex.test(lookupId)}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {lookupLoading ? 'Searching...' : hasLookup ? 'Verify' : 'Add'}
            </button>
          </div>

          {hasLookup ? (
            <PlatformPreviewCard
              platform={platform}
              profile={lookupResult}
              loading={lookupLoading}
              error={lookupError}
              notFound={lookupNotFound}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          ) : (
            lookupResult && (
              <div className="mt-3 rounded-xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <p className="font-bold text-ink">{lookupResult.username}</p>
                </div>
                <p className="mt-1 text-xs text-ink-light">
                  Manual entry — no online verification available for {label}.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
                  >
                    Confirm &amp; Link
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-surface-300 px-4 py-2 text-xs font-medium text-ink-light transition-colors hover:bg-surface-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
