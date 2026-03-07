export default function LeaderboardsLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="h-8 w-48 rounded bg-surface-200" />
      <div className="mt-2 h-4 w-72 rounded bg-surface-200" />

      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-lg bg-surface-200" />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-surface-200 bg-white">
        <div className="h-12 border-b border-surface-200 bg-surface-50" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-surface-100 px-4 py-3">
            <div className="h-5 w-8 rounded bg-surface-200" />
            <div className="h-8 w-8 rounded-full bg-surface-200" />
            <div className="h-4 w-32 rounded bg-surface-200" />
            <div className="ml-auto h-4 w-16 rounded bg-surface-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
