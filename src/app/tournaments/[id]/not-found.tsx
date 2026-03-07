import Link from 'next/link';

export default function TournamentNotFound() {
  return (
    <div className="container-app flex flex-col items-center justify-center py-32 text-center">
      <span className="text-5xl">🏆</span>
      <h1 className="mt-4 font-heading text-2xl font-bold">Tournament Not Found</h1>
      <p className="mt-2 text-ink-muted">
        This tournament doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/tournaments"
        className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
      >
        Browse Tournaments
      </Link>
    </div>
  );
}
