'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';

interface UserNavProps {
  username: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export function UserNav({ username, avatarUrl, isAdmin }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-surface-200 p-1 pr-3 hover:bg-surface-50 transition-colors"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {getInitials(username)}
          </div>
        )}
        <span className="hidden text-sm font-medium sm:block">{username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-surface-200 bg-white py-1 shadow-lg">
          <Link
            href={`/profile/${username}`}
            className="block px-4 py-2 text-sm text-ink hover:bg-surface-50"
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
          <Link
            href="/settings/profile"
            className="block px-4 py-2 text-sm text-ink hover:bg-surface-50"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-ink hover:bg-surface-50"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/messages"
            className="block px-4 py-2 text-sm text-ink hover:bg-surface-50"
            onClick={() => setOpen(false)}
          >
            Messages
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm font-medium text-accent hover:bg-surface-50"
              onClick={() => setOpen(false)}
            >
              Admin Panel
            </Link>
          )}
          <hr className="my-1 border-surface-200" />
          <button
            onClick={handleSignOut}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-surface-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
