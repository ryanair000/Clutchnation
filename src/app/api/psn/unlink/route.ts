import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const serviceClient = createServiceClient();

  // Get current psn_account_id for audit log
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('psn_account_id')
    .eq('id', user.id)
    .single();

  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({
      psn_account_id: null,
      psn_verified_status: 'none',
      psn_sync_status: 'never',
      psn_profile_url: null,
      psn_public_last_synced_at: null,
      psn_last_lookup_error: null,
    })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: 'Failed to unlink PSN account' },
      { status: 500 },
    );
  }

  // Log event
  await serviceClient.from('psn_link_events').insert({
    user_id: user.id,
    psn_account_id: profile?.psn_account_id ?? null,
    event_type: 'user_unlinked',
  });

  return NextResponse.json({ success: true });
}
