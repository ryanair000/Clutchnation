import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import { ProductForm } from '../product-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [productRes, categoriesRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_categories').select('id, name').order('sort_order'),
  ]);

  if (!productRes.data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Edit Product</h1>
      <ProductForm product={productRes.data} categories={categoriesRes.data ?? []} />
    </div>
  );
}
