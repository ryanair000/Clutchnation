import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatTime } from '@/lib/utils';
import { TournamentStatusBadge } from '@/components/tournaments/status-badge';
import { JoinLeaveButton } from '@/components/tournaments/join-leave-button';
import { StartTournamentButton } from '@/components/tournaments/start-tournament-button';
import { BracketView } from '@/components/tournaments/bracket-view';
import { ParticipantList } from '@/components/tournaments/participant-list';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('tournaments')
    .select('title')
    .eq('id', id)
    .single();
  return { title: data?.title ?? 'Tournament' };
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      *,
      host:profiles!tournaments_host_id_fkey(username, avatar_url),
      tournament_participants(
        id, user_id, seed, status,
        user:profiles!tournament_participants_user_id_fkey(username, psn_online_id, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (!tournament) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isHost = user?.id === tournament.host_id;
  const isParticipant = tournament.tournament_participants?.some(
    (p: { user_id: string }) => p.user_id === user?.id
  );
  const participantCount = tournament.tournament_participants?.length ?? 0;
  const isFull = participantCount >= tournament.size;
  const isRegistrationOpen =
    tournament.status === 'registration' &&
    new Date(tournament.registration_closes_at) > new Date();
  const canStart =
    isHost &&
    tournament.status === 'registration' &&
    participantCount >= 2;

  // Fetch matches if tournament has started
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let matches: any[] | null = null;
  if (tournament.status === 'in_progress' || tournament.status === 'completed') {
    const { data: m } = await supabase
      .from('matches')
      .select(`
        *,
        player_home:profiles!matches_player_home_id_fkey(username, avatar_url),
        player_away:profiles!matches_player_away_id_fkey(username, avatar_url)
      `)
      .eq('tournament_id', id)
      .order('round')
      .order('bracket_position');
    matches = m;
  }

  const host = Array.isArray(tournament.host) ? tournament.host[0] : tournament.host;

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{tournament.title}</h1>
            <TournamentStatusBadge status={tournament.status} />
          </div>
          {tournament.description && (
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">{tournament.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-muted">
            <span>🎮 {tournament.mode}</span>
            <span>👥 {participantCount}/{tournament.size}</span>
            <span>📅 {formatDate(tournament.starts_at)} at {formatTime(tournament.starts_at)}</span>
            <span>⏱️ {tournament.rules_half_length_min}-min halves</span>
          </div>
          <p className="mt-2 text-xs text-ink-light">
            Hosted by {host?.username ?? 'Unknown'}
          </p>
        </div>

        <div className="flex gap-2">
          {user && isRegistrationOpen && !isHost && !isParticipant && !isFull && (
            <JoinLeaveButton tournamentId={id} action="join" />
          )}
          {user && isRegistrationOpen && isParticipant && !isHost && (
            <JoinLeaveButton tournamentId={id} action="leave" />
          )}
          {canStart && (
            <StartTournamentButton tournamentId={id} />
          )}
        </div>
      </div>

      {/* Registration info */}
      {tournament.status === 'registration' && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Registration {new Date(tournament.registration_closes_at) > new Date() ? 'closes' : 'closed'}{' '}
          {formatDate(tournament.registration_closes_at)} at{' '}
          {formatTime(tournament.registration_closes_at)}
          {isFull && ' — Tournament is full!'}
        </div>
      )}

      {/* Winner banner */}
      {tournament.status === 'completed' && tournament.winner_id && (
        <div className="mt-6 rounded-lg border border-accent/30 bg-accent-50 p-4 text-center">
          <p className="text-sm font-semibold text-accent-700">🏆 Tournament Complete!</p>
        </div>
      )}

      {/* Bracket */}
      {matches && matches.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">Bracket</h2>
          <BracketView matches={matches} />
        </section>
      )}

      {/* Participants */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">
          Participants ({participantCount}/{tournament.size})
        </h2>
        <ParticipantList participants={tournament.tournament_participants ?? []} />
      </section>
    </div>
  );
}
