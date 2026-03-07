export default function ProfileLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      {/* Profile header skeleton */}
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-surface-200" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-surface-200" />
          <div className="h-4 w-32 rounded bg-surface-200" />
          <div className="h-4 w-56 rounded bg-surface-200" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-surface-200 bg-white" />
        ))}
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
