export default function DashboardLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 rounded bg-surface-200" />
          <div className="mt-2 h-4 w-40 rounded bg-surface-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-lg bg-surface-200" />
          <div className="h-10 w-32 rounded-lg bg-surface-200" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-surface-200 bg-white p-4">
            <div className="h-3 w-20 rounded bg-surface-200" />
            <div className="mt-2 h-6 w-16 rounded bg-surface-200" />
          </div>
        ))}
      </div>

      {/* Matches skeleton */}
      <div className="mt-8">
        <div className="h-6 w-40 rounded bg-surface-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-surface-200 bg-white" />
          ))}
        </div>
      </div>

      {/* Tournaments skeleton */}
      <div className="mt-8">
        <div className="h-6 w-40 rounded bg-surface-200" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border border-surface-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
