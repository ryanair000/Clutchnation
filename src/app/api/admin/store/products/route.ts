import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  const admin = await checkAdminApi();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Validate required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
  }
  if (!body.slug || typeof body.slug !== 'string') {
    return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
  }
  if (typeof body.price !== 'number' || body.price < 0) {
    return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
  }

  // Allowlist insertable fields
  const allowed = {
    name: body.name.trim(),
    slug: body.slug.trim(),
    description: body.description ?? null,
    price: body.price,
    compare_at_price: body.compare_at_price ?? null,
    product_type: body.product_type ?? 'physical',
    category_id: body.category_id ?? null,
    stock_quantity: body.stock_quantity ?? null,
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    images: body.images ?? null,
    digital_file_url: body.digital_file_url ?? null,
  };

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('products')
    .insert(allowed)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
