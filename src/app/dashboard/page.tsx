import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { StatsGrid } from '@/components/shared/stats-grid';
import { TournamentStatusBadge } from '@/components/tournaments/status-badge';
import { formatDate, formatTime, formatDateTime } from '@/lib/utils';
import { InviteButton } from '@/components/shared/invite-button';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.username) redirect('/onboarding');

  // Parallel data fetching
  const [
    participationsRes,
    upcomingMatchesRes,
    notificationsRes,
    openReportsRes,
  ] = await Promise.all([
    supabase
      .from('tournament_participants')
      .select('tournament_id')
      .eq('user_id', user.id),
    supabase
      .from('matches')
      .select(`
        id, round, bracket_position, scheduled_at, status,
        tournament:tournaments(id, title),
        player_home:profiles!matches_player_home_id_fkey(username),
        player_away:profiles!matches_player_away_id_fkey(username)
      `)
      .or(`player_home_id.eq.${user.id},player_away_id.eq.${user.id}`)
      .in('status', ['pending_acceptance', 'scheduled', 'in_progress'])
      .order('scheduled_at', { ascending: true })
      .limit(5),
    supabase
      .from('notifications')
      .select('id, type, title, body, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reported_user_id', user.id)
      .eq('status', 'actioned'),
  ]);

  const tournamentIds = (participationsRes.data ?? []).map((p) => p.tournament_id);
  const upcomingMatches = upcomingMatchesRes.data;
  const notifications = notificationsRes.data ?? [];
  const actionedReports = openReportsRes.count ?? 0;

  // Fetch tournaments
  const { data: tournaments } = tournamentIds.length > 0
    ? await supabase
        .from('tournaments')
        .select('id, title, status, mode, size, starts_at')
        .or(`id.in.(${tournamentIds.join(',')}),host_id.eq.${user.id}`)
        .order('starts_at', { ascending: true })
        .limit(6)
    : await supabase
        .from('tournaments')
        .select('id, title, status, mode, size, starts_at')
        .eq('host_id', user.id)
        .order('starts_at', { ascending: true })
        .limit(6);

  const pendingCount = (upcomingMatches ?? []).filter((m) => m.status === 'pending_acceptance').length;

  return (
    <div className="container-app py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Welcome back, {profile.username}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Your ClutchNation dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/tournaments/create"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Host Tournament
          </Link>
          <Link
            href="/matches/create"
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
          >
            1v1 Challenge
          </Link>
          <InviteButton />
        </div>
      </div>

      {/* Alerts */}
      {(pendingCount > 0 || actionedReports > 0) && (
        <div className="mt-4 space-y-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-medium text-amber-800">
                You have {pendingCount} pending match {pendingCount === 1 ? 'challenge' : 'challenges'} awaiting your response.
              </p>
            </div>
          )}
          {actionedReports > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <span className="text-lg">🛡️</span>
              <p className="text-sm font-medium text-red-800">
                A report against your account has been actioned. Please review community guidelines.
              </p>
            </div>
          )}
        </div>
      )}

      <StatsGrid profile={profile} />

      {/* Upcoming matches */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Upcoming Matches</h2>
        {upcomingMatches && upcomingMatches.length > 0 ? (
          <div className="mt-4 space-y-3">
            {upcomingMatches.map((m) => {
              const home = Array.isArray(m.player_home) ? m.player_home[0] : m.player_home;
              const away = Array.isArray(m.player_away) ? m.player_away[0] : m.player_away;
              const tourn = Array.isArray(m.tournament) ? m.tournament[0] : m.tournament;
              return (
                <Link
                  key={m.id}
                  href={tourn ? `/tournaments/${tourn.id}` : `/matches/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-4 hover:border-brand/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {home?.username ?? 'TBD'} vs {away?.username ?? 'TBD'}
                    </p>
                    {tourn && (
                      <p className="text-xs text-ink-muted">
                        {tourn.title} · Round {m.round}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-ink-muted">
                    <p>{formatDate(m.scheduled_at!)}</p>
                    <p>{formatTime(m.scheduled_at!)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            No upcoming matches. Browse tournaments or challenge someone to a 1v1!
          </div>
        )}
      </section>

      {/* Active tournaments */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Your Tournaments</h2>
          <Link href="/tournaments" className="text-sm text-brand hover:underline">
            Browse all
          </Link>
        </div>
        {tournaments && tournaments.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="rounded-lg border border-surface-200 bg-white p-4 hover:border-brand/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold truncate">{t.title}</h3>
                  <TournamentStatusBadge status={t.status} />
                </div>
                <div className="mt-2 flex gap-3 text-xs text-ink-muted">
                  <span>🎮 {t.mode}</span>
                  <span>👥 {t.size}</span>
                </div>
                <p className="mt-1 text-xs text-ink-light">
                  {formatDate(t.starts_at)} at {formatTime(t.starts_at)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            You haven&apos;t joined any tournaments yet.{' '}
            <Link href="/tournaments" className="font-medium text-brand hover:underline">
              Browse tournaments
            </Link>
          </div>
        )}
      </section>

      {/* Notifications */}
      {notifications.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">Notifications</h2>
          <div className="mt-4 space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border p-3 ${
                  n.is_read
                    ? 'border-surface-200 bg-white'
                    : 'border-brand/20 bg-brand/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-xs text-ink-muted">{formatDateTime(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-1 text-xs text-ink-muted">{n.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
