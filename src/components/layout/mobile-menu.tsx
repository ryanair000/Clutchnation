'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/tournaments', label: 'Tournaments' },
    { href: '/leaderboards', label: 'Leaderboards' },
    ...(isLoggedIn
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/messages', label: 'Messages' },
        ]
      : []),
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-50 transition-colors"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 top-16 z-40 bg-black/20" onClick={() => setOpen(false)} />

          {/* Panel */}
          <nav className="fixed inset-x-0 top-16 z-50 border-b border-surface-200 bg-white shadow-lg">
            <div className="container-app divide-y divide-surface-100 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block px-2 py-3 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-brand'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!isLoggedIn && (
                <div className="flex gap-3 px-2 py-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-surface-300 px-4 py-2 text-center text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
