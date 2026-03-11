import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPsnAuthContext } from '@/lib/psn/auth';

/**
 * POST /api/psn/bootstrap
 *
 * Admin-only endpoint that triggers the initial NPSSO → access/refresh token
 * exchange and stores the result in Supabase.  After this is called once the
 * server can renew tokens automatically using the stored refresh token.
 *
 * Requires:
 *  - Authenticated admin user
 *  - PSN_SERVICE_NPSSO env var with a *fresh* NPSSO cookie value
 */
export async function POST() {
  // Auth + admin check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    // getPsnAuthContext will use NPSSO if no stored refresh token exists,
    // and automatically persist the resulting tokens to Supabase.
    await getPsnAuthContext();
    return NextResponse.json({ ok: true, message: 'PSN tokens bootstrapped and stored.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
