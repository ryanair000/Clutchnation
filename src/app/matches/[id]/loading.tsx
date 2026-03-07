export default function MatchDetailLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="h-6 w-32 rounded bg-surface-200" />
      <div className="mt-6 rounded-xl border border-surface-200 bg-white p-8">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-surface-200" />
            <div className="h-4 w-24 rounded bg-surface-200" />
          </div>
          <div className="h-10 w-20 rounded bg-surface-200" />
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-surface-200" />
            <div className="h-4 w-24 rounded bg-surface-200" />
          </div>
        </div>
      </div>
      <div className="mt-6 h-32 rounded-xl border border-surface-200 bg-white" />
      <div className="mt-4 h-48 rounded-xl border border-surface-200 bg-white" />
    </div>
  );
}
