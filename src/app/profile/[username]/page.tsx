import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { computePlayerStats } from '@/lib/stats';
import { CURRENT_SEASON } from '@/lib/constants';
import type { PlatformAccount } from '@/types';

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

  // Fetch PSN cache data if user has a linked PSN account
  let psnCache = null;
  if (profile.psn_account_id) {
    const { data } = await supabase
      .from('psn_profile_cache')
      .select('*')
      .eq('psn_account_id', profile.psn_account_id)
      .maybeSingle();
    psnCache = data;
  }

  // Fetch platform accounts
  const serviceClient = createServiceClient();
  const { data: platformAccountsRaw } = await serviceClient
    .from('platform_accounts')
    .select('*')
    .eq('user_id', profile.id);
  const platformAccounts = (platformAccountsRaw ?? []) as PlatformAccount[];

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
      <Suspense>
      <ProfileTabs
        profile={profile}
        stats={detailedStats}
        allMatches={allMatches ?? []}
        recentMatches={(recentMatches ?? []).map((m) => ({
          ...m,
          player_home: Array.isArray(m.player_home) ? m.player_home[0] : m.player_home,
          player_away: Array.isArray(m.player_away) ? m.player_away[0] : m.player_away,
        }))}
        tournaments={tournaments}
        isOwnProfile={isOwnProfile}
        currentUserId={user?.id ?? null}
        psnCache={psnCache}
        platformAccounts={platformAccounts}
      />
      </Suspense>
    </div>
  );
}
