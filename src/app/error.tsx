'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-app flex flex-col items-center justify-center py-32 text-center">
      <div className="rounded-xl border border-red-200 bg-red-50 p-10">
        <span className="text-4xl">⚠️</span>
        <h2 className="mt-4 font-heading text-2xl font-bold text-ink">Something went wrong</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          An unexpected error occurred. Please try again, or return to the homepage if the problem persists.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-light">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
