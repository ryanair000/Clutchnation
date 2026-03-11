import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { OrderStatusBadge } from '@/components/store/order-status-badge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Orders | ClutchNation Store' };

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink-900 mb-4">My Orders</h1>
        <p className="text-ink-500 mb-6">Sign in to view your order history</p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, currency, created_at, items:order_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-ink-900 mb-8">My Orders</h1>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/store/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-surface-200 p-4 hover:border-brand-400 hover:shadow-sm transition"
            >
              <div>
                <p className="font-semibold text-ink-900">{order.order_number}</p>
                <p className="text-sm text-ink-400">
                  {new Date(order.created_at).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right flex items-center gap-4">
                <OrderStatusBadge status={order.status} />
                <span className="font-bold text-ink-900">{formatPrice(order.total, order.currency)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-ink-400 text-lg mb-4">No orders yet</p>
          <Link
            href="/store"
            className="inline-flex rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
