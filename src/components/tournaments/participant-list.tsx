interface Participant {
  id: string;
  user_id: string;
  seed: number | null;
  status: string;
  user: { username: string | null; psn_online_id: string | null; avatar_url: string | null } | null;
}

interface Props {
  participants: Participant[];
}

export function ParticipantList({ participants }: Props) {
  if (participants.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
        No participants yet.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {participants.map((p) => {
        const user = Array.isArray(p.user) ? p.user[0] : p.user;
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg border border-surface-200 bg-white p-3"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {(user?.username ?? '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.username ?? 'Unknown'}</p>
              {user?.psn_online_id && (
                <p className="truncate text-xs text-ink-muted">🎮 {user.psn_online_id}</p>
              )}
            </div>
            {p.seed && (
              <span className="ml-auto text-xs text-ink-light">#{p.seed}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
