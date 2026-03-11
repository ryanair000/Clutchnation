export default function StreamsLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-40 rounded bg-surface-200" />
          <div className="mt-2 h-4 w-72 rounded bg-surface-200" />
        </div>
        <div className="h-10 w-64 rounded-lg bg-surface-200" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-200 bg-white overflow-hidden">
            <div className="aspect-video bg-surface-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-surface-200" />
              <div className="h-3 w-1/2 rounded bg-surface-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
