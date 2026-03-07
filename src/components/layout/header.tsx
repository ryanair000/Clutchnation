import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { UserNav } from './user-nav';
import { MobileMenu } from './mobile-menu';

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const isLoggedIn = !!user && !!profile?.username;

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold">
          <span className="text-brand">Clutch</span>
          <span className="text-ink">Nation</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/tournaments" className="text-ink-muted hover:text-ink transition-colors">
            Tournaments
          </Link>
          <Link href="/leaderboards" className="text-ink-muted hover:text-ink transition-colors">
            Leaderboards
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <UserNav
                username={profile!.username}
                avatarUrl={profile!.avatar_url ?? undefined}
                isAdmin={profile!.is_admin}
              />
              <MobileMenu isLoggedIn />
            </>
          ) : (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  Sign up
                </Link>
              </div>
              <MobileMenu isLoggedIn={false} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
