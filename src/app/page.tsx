import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { CURRENT_SEASON } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Trophy, Swords, BarChart3, MessageSquare, ShieldCheck, Globe, UserPlus, Gamepad2, TrendingUp } from 'lucide-react';
import { AnimatedStats } from '@/components/home/animated-counter';
import { FeaturesGrid } from '@/components/home/features-grid';
import { TournamentStatusBadge } from '@/components/tournaments/status-badge';

export const metadata: Metadata = {
  title: 'ClutchNation — Competitive FC26 on PlayStation in Kenya',
  description:
    'Host and join FC26 tournaments, challenge rivals to 1v1 matches, and climb the leaderboard. The home of competitive PlayStation gaming in Kenya.',
  openGraph: {
    title: 'ClutchNation — Competitive FC26 on PlayStation in Kenya',
    description:
      'Host and join FC26 tournaments, challenge rivals to 1v1 matches, and climb the leaderboard.',
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  // Parallel data fetching — stats + dynamic content
  const [
    usersRes,
    matchesRes,
    tournsRes,
    openTournamentsRes,
    leaderboardRes,
    liveStreamsRes,
    recentMatchesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('username', 'is', null),
    supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('tournaments')
      .select('id', { count: 'exact', head: true }),
    // Open tournaments
    supabase
      .from('tournaments')
      .select(`
        id, title, mode, size, status, starts_at,
        host:profiles!tournaments_host_id_fkey(username),
        tournament_participants(id)
      `)
      .eq('status', 'registration')
      .order('starts_at', { ascending: true })
      .limit(3),
    // Top 5 leaderboard
    supabase
      .from('leaderboard_snapshots')
      .select(`
        rank, points,
        profile:profiles!leaderboard_snapshots_user_id_fkey(username, avatar_url)
      `)
      .eq('season', CURRENT_SEASON)
      .eq('mode', 'all')
      .order('rank', { ascending: true, nullsFirst: false })
      .limit(5),
    // Live streams
    supabase
      .from('user_stream_channels')
      .select(`
        id, platform, channel_name, viewer_count,
        profile:profiles!user_stream_channels_user_id_fkey(username)
      `)
      .eq('is_live', true)
      .order('viewer_count', { ascending: false })
      .limit(3),
    // Recent completed matches
    supabase
      .from('matches')
      .select(`
        id, score_home, score_away, completed_at,
        player_home:profiles!matches_player_home_id_fkey(username),
        player_away:profiles!matches_player_away_id_fkey(username)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: 'Players', value: usersRes.count ?? 0 },
    { label: 'Matches Played', value: matchesRes.count ?? 0 },
    { label: 'Tournaments', value: tournsRes.count ?? 0 },
  ];

  const openTournaments = openTournamentsRes.data ?? [];
  const leaderboard = leaderboardRes.data ?? [];
  const liveStreams = liveStreamsRes.data ?? [];
  const recentMatches = recentMatchesRes.data ?? [];

  const features = [
    {
      icon: <Trophy className="h-5 w-5" />,
      title: 'Tournaments',
      desc: 'Create and join single-elimination brackets for 2–32 players. 1v1, 2v2, or Pro Clubs.',
    },
    {
      icon: <Swords className="h-5 w-5" />,
      title: '1v1 Challenges',
      desc: 'Challenge any player to a standalone match. Report scores, upload evidence, settle disputes.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Leaderboards',
      desc: 'Climb the seasonal rankings. Earn points from wins, tournament placements, and streaks.',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Messaging',
      desc: 'Direct message opponents. Coordinate match times and talk strategy in real time.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Fair Play',
      desc: 'Evidence-based score disputes. Admin moderation. Report cheaters and toxic players.',
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Built for Kenya',
      desc: 'East Africa timezone, local community focus. Designed for the Kenyan FC26 PlayStation scene.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand/5 via-white to-surface-50 py-24 sm:py-32" aria-label="Hero">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

        <div className="container-app relative text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-brand">Clutch</span>
              <span className="text-ink">Nation</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
              The home of competitive FC26 on PlayStation in Kenya. Host tournaments,
              challenge rivals, climb the leaderboard, and prove you&apos;re the best.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-600 transition-all hover:shadow-xl sm:w-auto"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/matches/create"
                    className="w-full rounded-xl border border-surface-300 bg-white px-8 py-3.5 text-base font-semibold text-ink shadow-sm hover:bg-surface-50 transition-all sm:w-auto"
                  >
                    Create Match
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="w-full rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-600 transition-all hover:shadow-xl sm:w-auto"
                  >
                    Start Competing
                  </Link>
                  <Link
                    href="/tournaments"
                    className="w-full rounded-xl border border-surface-300 bg-white px-8 py-3.5 text-base font-semibold text-ink shadow-sm hover:bg-surface-50 transition-all sm:w-auto"
                  >
                    Browse Tournaments
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Animated platform stats */}
      <AnimatedStats stats={stats} />

      {/* How It Works */}
      <section className="py-16 bg-surface-50" aria-label="How it works">
        <div className="container-app">
          <h2 className="text-center font-heading text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: 1, icon: <UserPlus className="h-6 w-6" />, title: 'Sign up free', desc: 'Create your account and link your PlayStation Network ID in seconds.' },
              { step: 2, icon: <Gamepad2 className="h-6 w-6" />, title: 'Challenge or join', desc: 'Enter a tournament bracket or send a 1v1 challenge to any player.' },
              { step: 3, icon: <TrendingUp className="h-6 w-6" />, title: 'Climb the ranks', desc: 'Win matches, earn points, and rise up the seasonal leaderboard.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  {item.icon}
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-brand">Step {item.step}</p>
                <h3 className="mt-2 font-heading text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" aria-label="Features">
        <div className="container-app">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Everything you need to compete
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-muted">
              From casual 1v1s to organized tournaments, ClutchNation has the tools for every level of play.
            </p>
          </div>

          <FeaturesGrid features={features} />
        </div>
      </section>

      {/* Live Streams (conditional) */}
      {liveStreams.length > 0 && (
        <section className="border-y border-surface-200 bg-white py-12" aria-label="Live streams">
          <div className="container-app">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <h2 className="font-heading text-xl font-bold">Live Now</h2>
              </div>
              <Link href="/streams" className="text-sm font-medium text-brand hover:text-brand-600 transition-colors">
                Watch all &rarr;
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {liveStreams.map((stream) => {
                const profile = Array.isArray(stream.profile) ? stream.profile[0] : stream.profile;
                return (
                  <div
                    key={stream.id}
                    className="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5"
                  >
                    <span className="text-sm font-medium">{profile?.username ?? stream.channel_name}</span>
                    <span className="rounded-full bg-surface-200 px-2 py-0.5 text-xs text-ink-muted">
                      {stream.platform}
                    </span>
                    {stream.viewer_count > 0 && (
                      <span className="text-xs text-ink-muted">{stream.viewer_count} watching</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Open Tournaments */}
      {openTournaments.length > 0 && (
        <section className="py-16" aria-label="Open tournaments">
          <div className="container-app">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold">Open Tournaments</h2>
              <Link href="/tournaments" className="text-sm font-medium text-brand hover:text-brand-600 transition-colors">
                View all &rarr;
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openTournaments.map((t) => {
                const participantCount = t.tournament_participants?.length ?? 0;
                const host = Array.isArray(t.host) ? t.host[0] : t.host;
                return (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    className="group rounded-lg border border-surface-200 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-heading font-semibold group-hover:text-brand transition-colors line-clamp-1">
                        {t.title}
                      </h3>
                      <TournamentStatusBadge status={t.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
                      <span className="rounded-full bg-surface-100 px-2 py-0.5 font-medium">{t.mode}</span>
                      <span className="rounded-full bg-surface-100 px-2 py-0.5">{participantCount}/{t.size} players</span>
                      <span>{formatDate(t.starts_at)}</span>
                    </div>
                    <p className="mt-3 text-xs text-ink-light">Hosted by {host?.username ?? 'Unknown'}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Top Players + Recent Results  — side by side */}
      {(leaderboard.length > 0 || recentMatches.length > 0) && (
        <section className="bg-surface-50 py-16" aria-label="Leaderboard and recent results">
          <div className="container-app">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Top Players */}
              {leaderboard.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-xl font-bold">Top Players</h2>
                    <Link href="/leaderboards" className="text-sm font-medium text-brand hover:text-brand-600 transition-colors">
                      Full leaderboard &rarr;
                    </Link>
                  </div>
                  <div className="mt-4 rounded-xl border border-surface-200 bg-white">
                    {leaderboard.map((entry, i) => {
                      const profile = Array.isArray(entry.profile) ? entry.profile[0] : entry.profile;
                      return (
                        <div
                          key={entry.rank}
                          className={`flex items-center gap-4 px-5 py-3 ${i > 0 ? 'border-t border-surface-100' : ''}`}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                            {entry.rank}
                          </span>
                          {profile?.avatar_url ? (
                            <Image
                              src={profile.avatar_url}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-surface-200" />
                          )}
                          <span className="flex-1 text-sm font-medium">{profile?.username ?? '—'}</span>
                          <span className="text-sm font-semibold text-brand">{entry.points} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Results */}
              {recentMatches.length > 0 && (
                <div>
                  <h2 className="font-heading text-xl font-bold">Recent Results</h2>
                  <div className="mt-4 rounded-xl border border-surface-200 bg-white">
                    {recentMatches.map((m, i) => {
                      const home = Array.isArray(m.player_home) ? m.player_home[0] : m.player_home;
                      const away = Array.isArray(m.player_away) ? m.player_away[0] : m.player_away;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? 'border-t border-surface-100' : ''}`}
                        >
                          <span className="flex-1 text-right text-sm font-medium">{home?.username ?? '—'}</span>
                          <span className="rounded-md bg-surface-100 px-2.5 py-1 text-sm font-bold tabular-nums">
                            {m.score_home ?? 0} – {m.score_away ?? 0}
                          </span>
                          <span className="flex-1 text-sm font-medium">{away?.username ?? '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand py-16" aria-label="Call to action">
        <div className="container-app text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Ready to prove yourself?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-100">
            Join the growing community of FC26 competitors in Kenya. Sign up free and start playing today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoggedIn ? (
              <>
                <Link
                  href="/tournaments/create"
                  className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand shadow-lg hover:bg-surface-50 transition-colors sm:w-auto"
                >
                  Host a Tournament
                </Link>
                <Link
                  href="/leaderboards"
                  className="w-full rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors sm:w-auto"
                >
                  View Your Stats
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand shadow-lg hover:bg-surface-50 transition-colors sm:w-auto"
                >
                  Create Account
                </Link>
                <Link
                  href="/leaderboards"
                  className="w-full rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors sm:w-auto"
                >
                  View Leaderboards
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
