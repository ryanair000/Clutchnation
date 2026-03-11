import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const admin = await checkAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Allowlist updatable fields
  const allowedKeys = [
    'name', 'slug', 'description', 'price', 'compare_at_price',
    'product_type', 'category_id', 'stock_quantity',
    'is_active', 'is_featured', 'images', 'digital_file_url',
  ] as const;
  const updateData: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in body) updateData[key] = body[key];
  }
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const admin = await checkAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
