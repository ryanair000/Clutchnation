import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Products</h1>
        <Link
          href="/admin/store/products/new"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="rounded-xl border border-surface-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-100 text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {products?.map((product) => (
              <tr key={product.id} className="hover:bg-surface-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-surface-100 shrink-0">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt="" fill sizes="40px" className="object-cover" />
                      ) : null}
                    </div>
                    <span className="font-medium text-ink-900 truncate max-w-[200px]">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-500">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="capitalize text-ink-500">{product.product_type}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(product.price)}</td>
                <td className="px-4 py-3 text-center">{product.stock_quantity ?? '∞'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block h-2 w-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/store/products/${product.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline text-xs"
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <div className="text-center py-12 text-ink-400">No products yet</div>
        )}
      </div>
    </div>
  );
}
