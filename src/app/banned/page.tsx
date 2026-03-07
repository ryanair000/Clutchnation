import Link from 'next/link';

export default function BannedPage() {
  return (
    <div className="container-app flex flex-col items-center justify-center py-32 text-center">
      <div className="rounded-xl border border-red-200 bg-red-50 p-10">
        <span className="text-5xl">🚫</span>
        <h1 className="mt-4 font-heading text-2xl font-bold text-red-700">Account Suspended</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          Your account has been suspended for violating community guidelines.
          If you believe this is a mistake, please contact the admin team.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-lg border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
