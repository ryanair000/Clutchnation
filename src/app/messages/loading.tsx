export default function MessagesLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded bg-surface-200" />
        <div className="h-10 w-32 rounded-lg bg-surface-200" />
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-surface-200 bg-white p-4">
            <div className="h-10 w-10 rounded-full bg-surface-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-surface-200" />
              <div className="h-3 w-48 rounded bg-surface-200" />
            </div>
            <div className="h-3 w-16 rounded bg-surface-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
