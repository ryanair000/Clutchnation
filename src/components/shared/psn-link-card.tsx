'use client';

import { useState } from 'react';
import type {
  PsnVerifiedStatus,
  PsnSyncStatus,
  NormalizedPsnProfile,
} from '@/types';
import { PsnPreviewCard } from './psn-preview-card';
import { PSN_ID_REGEX } from '@/lib/constants';

interface PsnLinkCardProps {
  psnOnlineId: string | null;
  psnAccountId: string | null;
  verifiedStatus: PsnVerifiedStatus;
  syncStatus: PsnSyncStatus;
  lastSyncedAt: string | null;
  onLinked: () => void;
  onUnlinked: () => void;
}

export function PsnLinkCard({
  psnOnlineId,
  psnAccountId,
  verifiedStatus,
  syncStatus,
  lastSyncedAt,
  onLinked,
  onUnlinked,
}: PsnLinkCardProps) {
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] =
    useState<NormalizedPsnProfile | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const isLinked =
    verifiedStatus === 'confirmed_by_user' && psnAccountId;

  async function handleVerify() {
    if (!PSN_ID_REGEX.test(lookupId)) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupNotFound(false);
    setLookupResult(null);

    try {
      const res = await fetch(
        `/api/psn/lookup/${encodeURIComponent(lookupId)}`,
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
      const res = await fetch('/api/psn/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: lookupResult.accountId,
          onlineId: lookupResult.onlineId,
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
      const res = await fetch('/api/psn/unlink', { method: 'POST' });
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
            <h3 className="text-sm font-semibold text-ink">
              PlayStation Network
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                ✓ Verified
              </span>
              <span className="text-sm text-ink-light">
                🎮 {psnOnlineId}
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
      <h3 className="text-sm font-semibold text-ink">
        PlayStation Network
      </h3>
      <p className="mt-1 text-xs text-ink-light">
        Verify your PlayStation account to add trust to your profile and
        help opponents find you.
      </p>

      {!showVerify ? (
        <button
          onClick={() => setShowVerify(true)}
          className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Link PlayStation Account
        </button>
      ) : (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Enter PSN Online ID"
              maxLength={16}
              className="flex-1 rounded-lg border border-surface-300 px-3 py-1.5 text-sm focus:border-brand focus:ring-brand"
            />
            <button
              onClick={handleVerify}
              disabled={
                lookupLoading || !PSN_ID_REGEX.test(lookupId)
              }
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {lookupLoading ? 'Searching...' : 'Verify'}
            </button>
          </div>

          <PsnPreviewCard
            profile={lookupResult}
            loading={lookupLoading}
            error={lookupError}
            notFound={lookupNotFound}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}
