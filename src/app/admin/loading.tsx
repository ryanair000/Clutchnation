export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-40 rounded bg-surface-200" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-surface-200 bg-white" />
        ))}
      </div>
      <div className="mt-8">
        <div className="h-6 w-32 rounded bg-surface-200" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-surface-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
