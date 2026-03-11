export default function StoreLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="h-9 w-36 bg-surface-200 rounded animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-surface-200 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-200 overflow-hidden">
            <div className="aspect-square bg-surface-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-2/3 bg-surface-200 rounded animate-pulse" />
              <div className="h-5 w-1/3 bg-surface-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
