'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/community', label: 'Feed' },
  { href: '/community/players', label: 'Players' },
  { href: '/community/groups', label: 'Groups' },
];

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container-app py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Community</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Activity feed, players, and groups
        </p>
      </div>

      <nav className="mb-6 flex gap-1 border-b border-surface-200">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/community'
              ? pathname === '/community'
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
