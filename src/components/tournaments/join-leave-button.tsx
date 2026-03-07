'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  tournamentId: string;
  action: 'join' | 'leave';
}

export function JoinLeaveButton({ tournamentId, action }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (action === 'join') {
      await supabase.from('tournament_participants').insert({
        tournament_id: tournamentId,
        user_id: user.id,
      });
    } else {
      await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id);
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
        action === 'join'
          ? 'bg-brand text-white hover:bg-brand-600'
          : 'border border-red-300 text-red-600 hover:bg-red-50'
      }`}
    >
      {loading
        ? action === 'join'
          ? 'Joining…'
          : 'Leaving…'
        : action === 'join'
          ? 'Join Tournament'
          : 'Leave Tournament'}
    </button>
  );
}
