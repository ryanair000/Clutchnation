import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { OrderStatusBadge } from '@/components/store/order-status-badge';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('orders')
    .select('id, order_number, email, status, total, currency, shipping_method, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/store/orders' : `/admin/store/orders?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              (s === 'all' && !params.status) || params.status === s
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-ink-500 hover:bg-surface-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-surface-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-100 text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Shipping</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-surface-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/store/orders/${order.id}`} className="font-medium text-brand-600 hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-500">{order.email}</td>
                <td className="px-4 py-3 text-center">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-ink-500 capitalize">{order.shipping_method?.replace(/_/g, ' ') ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(order.total, order.currency)}</td>
                <td className="px-4 py-3 text-ink-400">
                  {new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <div className="text-center py-12 text-ink-400">No orders found</div>
        )}
      </div>
    </div>
  );
}
