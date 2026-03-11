'use client';

import { useState } from 'react';
import { InviteFriendModal } from '@/components/shared/invite-friend-modal';

interface InviteButtonProps {
  variant?: 'primary' | 'outline' | 'nav';
  className?: string;
}

export function InviteButton({ variant = 'outline', className = '' }: InviteButtonProps) {
  const [open, setOpen] = useState(false);

  const baseStyles = 'text-sm font-medium transition-colors';
  const variants = {
    primary: `rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent/90 ${baseStyles}`,
    outline: `rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-accent hover:bg-accent/10 ${baseStyles}`,
    nav: `block w-full px-4 py-2 text-left text-ink hover:bg-surface-50 ${baseStyles}`,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${variants[variant]} ${className}`}
      >
        {variant === 'nav' ? 'Invite Friends' : '👋 Invite Friend'}
      </button>
      {open && <InviteFriendModal onClose={() => setOpen(false)} />}
    </>
  );
}
