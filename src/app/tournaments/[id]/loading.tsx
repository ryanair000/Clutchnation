export default function TournamentDetailLoading() {
  return (
    <div className="container-app py-8 animate-pulse">
      <div className="h-8 w-64 rounded bg-surface-200" />
      <div className="mt-2 h-4 w-40 rounded bg-surface-200" />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-xl border border-surface-200 bg-white" />
          <div className="h-64 rounded-xl border border-surface-200 bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-xl border border-surface-200 bg-white" />
          <div className="h-48 rounded-xl border border-surface-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
