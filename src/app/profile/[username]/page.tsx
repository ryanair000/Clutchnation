import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProfileHeader } from '@/components/shared/profile-header';
import { PlayerStatsPanel } from '@/components/shared/player-stats-panel';
import { ReportUserButton } from '@/components/shared/report-user-button';
import { TournamentStatusBadge } from '@/components/tournaments/status-badge';
import { formatDate } from '@/lib/utils';
import { computePlayerStats } from '@/lib/stats';
import { CURRENT_SEASON } from '@/lib/constants';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}'s Profile` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;

  // Fetch ALL completed matches for stats computation
  const { data: allMatches } = await supabase
    .from('matches')
    .select('id, player_home_id, player_away_id, score_home, score_away, winner_id, status, scheduled_at, match_type, tournament_id')
    .or(`player_home_id.eq.${profile.id},player_away_id.eq.${profile.id}`)
    .order('scheduled_at', { ascending: true });

  // Fetch recent matches (for display list, with profiles joined)
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      id, match_type, tournament_id, status, score_home, score_away, winner_id, scheduled_at,
      player_home:profiles!matches_player_home_id_fkey(username),
      player_away:profiles!matches_player_away_id_fkey(username)
    `)
    .or(`player_home_id.eq.${profile.id},player_away_id.eq.${profile.id}`)
    .in('status', ['completed', 'in_progress', 'scheduled'])
    .order('scheduled_at', { ascending: false })
    .limit(10);

  // Fetch tournament participations
  const { data: participations } = await supabase
    .from('tournament_participants')
    .select('tournament_id')
    .eq('user_id', profile.id);

  const tIds = (participations ?? []).map((p) => p.tournament_id);
  let tournaments: { id: string; title: string; status: string; mode: string; size: number; starts_at: string; winner_id: string | null }[] = [];
  if (tIds.length > 0) {
    const { data } = await supabase
      .from('tournaments')
      .select('id, title, status, mode, size, starts_at, winner_id')
      .in('id', tIds)
      .order('starts_at', { ascending: false })
      .limit(10);
    tournaments = data ?? [];
  }

  const tournsPlayed = tIds.length;
  const tournsWon = tournaments.filter((t) => t.winner_id === profile.id).length;

  // Fetch leaderboard rank
  const { data: leaderboardEntry } = await supabase
    .from('leaderboard_snapshots')
    .select('rank, points')
    .eq('user_id', profile.id)
    .eq('season', CURRENT_SEASON)
    .eq('mode', 'all')
    .maybeSingle();

  // Compute stats
  const detailedStats = computePlayerStats(
    profile.id,
    allMatches ?? [],
    tournsPlayed,
    tournsWon,
    leaderboardEntry?.rank ?? null
  );

  return (
    <div className="container-app py-8">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
      {!isOwnProfile && user && (
        <div className="mt-2 flex justify-end">
          <ReportUserButton reportedUserId={profile.id} reportedUsername={profile.username ?? 'User'} />
        </div>
      )}
      <PlayerStatsPanel stats={detailedStats} />

      {/* Recent matches */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Recent Matches</h2>
        {recentMatches && recentMatches.length > 0 ? (
          <div className="mt-4 space-y-2">
            {recentMatches.map((m) => {
              const home = Array.isArray(m.player_home) ? m.player_home[0] : m.player_home;
              const away = Array.isArray(m.player_away) ? m.player_away[0] : m.player_away;
              const won = m.winner_id === profile.id;
              const lost = m.winner_id !== null && m.winner_id !== profile.id;
              return (
                <Link
                  key={m.id}
                  href={m.tournament_id ? `/tournaments/${m.tournament_id}` : `/matches/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-3 hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {m.status === 'completed' && (
                      <span className={`text-xs font-bold ${won ? 'text-accent' : lost ? 'text-red-500' : 'text-ink-muted'}`}>
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
                  <div className="text-xs text-ink-muted">{formatDate(m.scheduled_at)}</div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            No matches played yet. Join a tournament or create a 1v1 match to get started!
          </div>
        )}
      </section>

      {/* Tournament history */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Tournament History</h2>
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
                    <span className="text-xs font-bold text-accent">🏆 Winner</span>
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
    </div>
  );
}
