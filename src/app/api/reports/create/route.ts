import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { REPORT_REASONS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { reported_user_id, reason, details, context_type, context_id } = body as {
    reported_user_id: string;
    reason: string;
    details?: string;
    context_type?: string;
    context_id?: string;
  };

  if (!reported_user_id || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!REPORT_REASONS.includes(reason as typeof REPORT_REASONS[number])) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }

  if (reported_user_id === user.id) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
  }

  // Check for duplicate open report
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_user_id', reported_user_id)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You already have an open report for this user' }, { status: 409 });
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id,
    reason,
    details: details?.slice(0, 1000) ?? null,
    context_type: context_type ?? null,
    context_id: context_id ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
