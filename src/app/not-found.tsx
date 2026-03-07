import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-app flex flex-col items-center justify-center py-32 text-center">
      <h1 className="text-8xl font-bold text-brand">404</h1>
      <p className="mt-4 font-heading text-xl font-semibold text-ink">Page not found</p>
      <p className="mt-2 text-sm text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/tournaments"
          className="rounded-lg border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
        >
          Browse Tournaments
        </Link>
      </div>
    </div>
  );
}
