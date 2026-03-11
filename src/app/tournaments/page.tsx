import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import { TournamentStatusBadge } from '@/components/tournaments/status-badge';

export const metadata: Metadata = { title: 'Tournaments' };

export default async function TournamentsPage() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      id, title, description, mode, size, status, starts_at,
      registration_closes_at, created_at,
      host:profiles!tournaments_host_id_fkey(username, avatar_url),
      tournament_participants(id)
    `)
    .order('starts_at', { ascending: false })
    .limit(50);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container-app py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Tournaments</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Browse and join tournaments
          </p>
        </div>
        {user && (
          <Link
            href="/tournaments/create"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Host Tournament
          </Link>
        )}
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <div className="mt-8 rounded-lg border border-surface-200 bg-white p-12 text-center text-sm text-ink-muted">
          No tournaments yet. Be the first to host one!
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => {
            const participantCount = t.tournament_participants?.length ?? 0;
            const host = Array.isArray(t.host) ? t.host[0] : t.host;
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group rounded-lg border border-surface-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-heading font-semibold group-hover:text-brand transition-colors line-clamp-1">
                    {t.title}
                  </h2>
                  <TournamentStatusBadge status={t.status} />
                </div>
                {t.description && (
                  <p className="mt-1 text-sm text-ink-muted line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
                  <span className="rounded-full bg-surface-100 px-2 py-0.5 font-medium">
                    {t.mode}
                  </span>
                  <span className="rounded-full bg-surface-100 px-2 py-0.5">
                    {participantCount}/{t.size} players
                  </span>
                  <span>{formatDate(t.starts_at)}</span>
                </div>
                <p className="mt-3 text-xs text-ink-light">
                  Hosted by {host?.username ?? 'Unknown'}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
