export default function CommunityLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Feed skeleton */}
      <div className="space-y-4 lg:col-span-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-surface-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-200" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-surface-200" />
                <div className="h-3 w-20 rounded bg-surface-100" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-surface-100" />
              <div className="h-4 w-3/4 rounded bg-surface-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Stats sidebar skeleton */}
      <div className="hidden lg:block">
        <div className="animate-pulse rounded-xl border border-surface-200 bg-white p-5">
          <div className="h-5 w-32 rounded bg-surface-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-surface-100" />
                <div className="h-4 w-10 rounded bg-surface-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
