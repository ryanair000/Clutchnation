export default function TournamentsLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-surface-200" />
          <div className="mt-2 h-4 w-64 rounded bg-surface-200" />
        </div>
        <div className="h-10 w-40 rounded-lg bg-surface-200" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl border border-surface-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
