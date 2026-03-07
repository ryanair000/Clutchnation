import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdminApi();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, admin_notes } = body as { status: string; admin_notes?: string };

  if (!['reviewed', 'actioned', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: report } = await supabase
    .from('reports')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const updateData: Record<string, string> = {
    status,
    resolved_by: admin.userId,
  };
  if (admin_notes) {
    updateData.admin_notes = admin_notes;
  }

  const { error: updateError } = await supabase
    .from('reports')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: admin.userId,
    action: `report_${status}`,
    target_type: 'report',
    target_id: id,
    metadata: { admin_notes: admin_notes ?? null },
  });

  return NextResponse.json({ success: true });
}
