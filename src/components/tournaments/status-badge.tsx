interface Props {
  status: string;
}

const colors: Record<string, string> = {
  registration: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-surface-200 text-ink-muted',
};

const labels: Record<string, string> = {
  registration: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function TournamentStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-surface-100 text-ink-muted'}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
