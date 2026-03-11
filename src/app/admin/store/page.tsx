import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function AdminStorePage() {
  const supabase = createServiceClient();

  const [products, orders, revenue] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('total')
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
  ]);

  const totalRevenue = revenue.data?.reduce((sum, o) => sum + o.total, 0) ?? 0;
  const pendingOrders = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['paid', 'processing']);

  const stats = [
    { label: 'Products', value: products.count ?? 0, icon: Package, href: '/admin/store/products' },
    { label: 'Total Orders', value: orders.count ?? 0, icon: ShoppingCart, href: '/admin/store/orders' },
    { label: 'Revenue', value: formatPrice(totalRevenue), icon: DollarSign, href: '/admin/store/orders' },
    { label: 'Pending', value: pendingOrders.count ?? 0, icon: TrendingUp, href: '/admin/store/orders?status=paid' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Store Management</h1>
        <Link
          href="/admin/store/products/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          Add Product
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-surface-200 bg-surface-50 p-5 hover:border-brand-400 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-brand-500" />
              <span className="text-sm text-ink-500">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
