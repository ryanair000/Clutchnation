'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import Link from 'next/link';
import {
  ProfileProvider,
  type ProfileRow,
  type PsnCacheRow,
  type MatchRow,
  type RecentMatchRow,
  type TournamentRow,
} from '@/components/profile/profile-context';
import { ProfileHeader } from '@/components/shared/profile-header';
import { PlayerStatsPanel } from '@/components/shared/player-stats-panel';
import { ReportUserButton } from '@/components/shared/report-user-button';
import { TournamentStatusBadge } from '@/components/tournaments/status-badge';
import { formatDate } from '@/lib/utils';
import type { PlayerDetailedStats } from '@/types';

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Match History' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'psn', label: 'PSN Profile' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ProfileTabsProps {
  profile: ProfileRow;
  stats: PlayerDetailedStats;
  allMatches: MatchRow[];
  recentMatches: RecentMatchRow[];
  tournaments: TournamentRow[];
  isOwnProfile: boolean;
  currentUserId: string | null;
  psnCache: PsnCacheRow | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProfileTabs({
  profile,
  stats,
  allMatches,
  recentMatches,
  tournaments,
  isOwnProfile,
  currentUserId,
  psnCache,
}: ProfileTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get('tab');
  const activeTab: TabId =
    TABS.some((t) => t.id === raw) ? (raw as TabId) : 'overview';

  const setTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <ProfileProvider
      value={{
        profile,
        stats,
        allMatches,
        recentMatches,
        tournaments,
        isOwnProfile,
        currentUserId,
        psnCache,
      }}
    >
      {/* Header — always visible */}
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      {!isOwnProfile && currentUserId && (
        <div className="mt-2 flex justify-end">
          <ReportUserButton
            reportedUserId={profile.id}
            reportedUsername={profile.username ?? 'User'}
          />
        </div>
      )}

      {/* Tab bar */}
      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-surface-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-brand text-brand'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels — allMatches is passed via context for future phases (charts, filters) */}
      <div role="tabpanel" className="mt-6">
        {activeTab === 'overview' && (
          <OverviewPanel
            profile={profile}
            stats={stats}
            recentMatches={recentMatches}
            tournaments={tournaments}
          />
        )}
        {activeTab === 'matches' && <MatchHistoryPlaceholder />}
        {activeTab === 'tournaments' && <TournamentsPlaceholder />}
        {activeTab === 'psn' && <PsnPlaceholder />}
      </div>
    </ProfileProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview panel (extracted from original page.tsx)                   */
/* ------------------------------------------------------------------ */

function OverviewPanel({
  profile,
  stats,
  recentMatches,
  tournaments,
}: {
  profile: ProfileRow;
  stats: PlayerDetailedStats;
  recentMatches: RecentMatchRow[];
  tournaments: TournamentRow[];
}) {
  return (
    <>
      <PlayerStatsPanel stats={stats} />

      {/* Recent matches */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Recent Matches</h2>
        {recentMatches.length > 0 ? (
          <div className="mt-4 space-y-2">
            {recentMatches.map((m) => {
              const home = Array.isArray(m.player_home)
                ? m.player_home[0]
                : m.player_home;
              const away = Array.isArray(m.player_away)
                ? m.player_away[0]
                : m.player_away;
              const won = m.winner_id === profile.id;
              const lost =
                m.winner_id !== null && m.winner_id !== profile.id;
              return (
                <Link
                  key={m.id}
                  href={
                    m.tournament_id
                      ? `/tournaments/${m.tournament_id}`
                      : `/matches/${m.id}`
                  }
                  className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-3 hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {m.status === 'completed' && (
                      <span
                        className={`text-xs font-bold ${
                          won
                            ? 'text-accent'
                            : lost
                              ? 'text-red-500'
                              : 'text-ink-muted'
                        }`}
                      >
                        {won ? 'W' : lost ? 'L' : 'D'}
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {home?.username ?? 'TBD'} vs {away?.username ?? 'TBD'}
                    </span>
                    {m.status === 'completed' && (
                      <span className="text-xs text-ink-muted">
                        {m.score_home} - {m.score_away}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatDate(m.scheduled_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            No matches played yet. Join a tournament or create a 1v1 match to
            get started!
          </div>
        )}
      </section>

      {/* Tournament history */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">
          Tournament History
        </h2>
        {tournaments.length > 0 ? (
          <div className="mt-4 space-y-2">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-3 hover:border-brand/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold">{t.title}</h3>
                  <TournamentStatusBadge status={t.status} />
                  {t.winner_id === profile.id && (
                    <span className="text-xs font-bold text-accent">
                      🏆 Winner
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-muted">
                  {t.mode} · {formatDate(t.starts_at)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            No tournaments yet. Browse upcoming tournaments to compete!
          </div>
        )}
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Placeholder panels (Phase 4-6)                                     */
/* ------------------------------------------------------------------ */

function MatchHistoryPlaceholder() {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-12 text-center">
      <p className="text-ink-muted text-sm">
        Full match history with filters coming soon.
      </p>
    </div>
  );
}

function TournamentsPlaceholder() {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-12 text-center">
      <p className="text-ink-muted text-sm">
        Detailed tournament history coming soon.
      </p>
    </div>
  );
}

function PsnPlaceholder() {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-12 text-center">
      <p className="text-ink-muted text-sm">
        Full PSN profile details coming soon.
      </p>
    </div>
  );
}
