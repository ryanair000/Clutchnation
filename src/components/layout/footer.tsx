import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white py-10">
      <div className="container-app">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="font-heading text-lg font-bold">
              <span className="text-brand">Clutch</span>
              <span className="text-ink">Nation</span>
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              FC26 tournaments &amp; matches for PlayStation gamers in Kenya.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-ink">Platform</h4>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/tournaments" className="text-sm text-ink-muted hover:text-ink transition-colors">Tournaments</Link>
              <Link href="/leaderboards" className="text-sm text-ink-muted hover:text-ink transition-colors">Leaderboards</Link>
              <Link href="/store" className="text-sm text-ink-muted hover:text-ink transition-colors">Store</Link>
              <Link href="/streams" className="text-sm text-ink-muted hover:text-ink transition-colors">Streams</Link>
              <Link href="/signup" className="text-sm text-ink-muted hover:text-ink transition-colors">Sign Up</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-ink">Legal</h4>
            <p className="mt-3 text-xs text-ink-light">
              Not affiliated with Sony Interactive Entertainment or EA Sports.
            </p>
            <p className="mt-2 text-xs text-ink-light">
              &copy; {new Date().getFullYear()} ClutchNation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
