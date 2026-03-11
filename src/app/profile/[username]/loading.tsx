export default function ProfileLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      {/* Profile header skeleton */}
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 shrink-0 rounded-full bg-surface-200" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 rounded bg-surface-200" />
          <div className="flex gap-2">
            <div className="h-5 w-28 rounded-full bg-surface-200" />
            <div className="h-5 w-16 rounded bg-surface-200" />
          </div>
          <div className="h-4 w-56 rounded bg-surface-200" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="mt-6 flex gap-1 border-b border-surface-200">
        {['w-20', 'w-28', 'w-24', 'w-24'].map((w, i) => (
          <div key={i} className={`h-10 ${w} rounded-t bg-surface-200/50`} />
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="mt-6">
        <div className="h-20 rounded-lg border border-surface-200 bg-white" />
        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-surface-200 bg-white" />
          ))}
        </div>
      </div>

      {/* Matches skeleton */}
      <div className="mt-8">
        <div className="h-6 w-40 rounded bg-surface-200" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-surface-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
