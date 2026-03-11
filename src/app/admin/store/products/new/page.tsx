import { createServiceClient } from '@/lib/supabase/service';
import { ProductForm } from '../product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const supabase = createServiceClient();
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name')
    .order('sort_order');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">New Product</h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
