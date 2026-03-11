import { createServiceClient } from '@/lib/supabase/service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { OrderStatusBadge } from '@/components/store/order-status-badge';
import { OrderStatusUpdater } from '../order-status-updater';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name, slug, images))')
    .eq('id', id)
    .single();

  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/store/orders" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{order.order_number}</h1>
          <p className="text-sm text-ink-400">{order.email}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-surface-200 p-4 space-y-2">
          <p className="text-sm font-medium text-ink-700">Customer</p>
          <p className="text-sm text-ink-500">{order.email}</p>
          {order.shipping_address && (
            <>
              <p className="text-sm text-ink-500">{(order.shipping_address as Record<string, string>).fullName}</p>
              <p className="text-sm text-ink-500">{(order.shipping_address as Record<string, string>).phone}</p>
            </>
          )}
        </div>
        <div className="rounded-xl border border-surface-200 p-4 space-y-2">
          <p className="text-sm font-medium text-ink-700">Update Status</p>
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="rounded-xl border border-surface-200 divide-y divide-surface-200">
        {order.items?.map((item: { id: string; product_name: string; variant_name: string | null; quantity: number; unit_price: number }) => (
          <div key={item.id} className="flex justify-between items-center p-4">
            <div>
              <p className="font-medium text-ink-900">{item.product_name}</p>
              {item.variant_name && <p className="text-sm text-ink-500">{item.variant_name}</p>}
              <p className="text-sm text-ink-400">Qty: {item.quantity}</p>
            </div>
            <p className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Shipping</span>
          <span>{formatPrice(order.shipping_cost)}</span>
        </div>
        <hr className="border-surface-200" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {order.shipping_tracking_id && (
        <div className="rounded-xl border border-surface-200 p-4">
          <p className="text-sm font-medium text-ink-700">Tracking</p>
          <p className="text-sm text-ink-500">ID: {order.shipping_tracking_id}</p>
        </div>
      )}
    </div>
  );
}
