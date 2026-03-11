import { createClient } from '@/lib/supabase/server';

export async function CommunityStats() {
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [membersRes, matchesWeekRes, tournamentsMonthRes, topPlayersRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('username', 'is', null),
      supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', weekAgo.toISOString()),
      supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString()),
      supabase
        .from('leaderboard_snapshots')
        .select('points, rank, profile:profiles!leaderboard_snapshots_user_id_fkey(username, avatar_url)')
        .order('points', { ascending: false })
        .limit(3),
    ]);

  const stats = [
    { label: 'Total Members', value: membersRes.count ?? 0 },
    { label: 'Matches This Week', value: matchesWeekRes.count ?? 0 },
    { label: 'Tournaments This Month', value: tournamentsMonthRes.count ?? 0 },
  ];

  const topPlayers = (topPlayersRes.data ?? []).map((entry) => {
    const profile = Array.isArray(entry.profile) ? entry.profile[0] : entry.profile;
    return {
      points: entry.points as number,
      rank: entry.rank as number | null,
      profile: profile as { username: string | null; avatar_url: string | null } | null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="rounded-xl border border-surface-200 bg-white p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Community Stats
        </h3>
        <div className="mt-4 space-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">{s.label}</span>
              <span className="text-sm font-semibold">{s.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Players */}
      {topPlayers.length > 0 && (
        <div className="rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Top Players
          </h3>
          <div className="mt-4 space-y-3">
            {topPlayers.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {i + 1}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-xs font-semibold text-ink-muted">
                  {p.profile?.username?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.profile?.username ?? 'Unknown'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand">
                  {p.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
