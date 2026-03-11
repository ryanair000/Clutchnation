import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Download } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { OrderStatusBadge } from '@/components/store/order-status-badge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Confirmed | ClutchNation Store' };

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber) redirect('/store');

  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name, images, product_type))')
    .eq('order_number', orderNumber)
    .single();

  if (!order) redirect('/store');

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-ink-900 mb-2">Order Confirmed!</h1>
      <p className="text-ink-500 mb-1">Thank you for your purchase</p>
      <p className="text-sm text-ink-400 mb-8">Order #{order.order_number}</p>

      <div className="rounded-xl border border-surface-200 bg-surface-50 p-6 text-left space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Order Details</h2>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.items?.map((item: { id: string; quantity: number; unit_price: number; product: { name: string; images: string[] | null; product_type: string } | null }) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-ink-600">
              {item.product?.name ?? 'Product'} × {item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
          </div>
        ))}

        <hr className="border-surface-200" />

        {order.shipping_cost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Shipping</span>
            <span>{formatPrice(order.shipping_cost)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        {order.shipping_method && order.shipping_method !== 'digital' && (
          <div className="flex items-center gap-2 text-sm text-ink-500 pt-2">
            <Package className="h-4 w-4" />
            <span>Shipping via {order.shipping_method.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-ink-400 mb-6">
        A confirmation email has been sent to <strong>{order.email}</strong>
      </p>

      <div className="flex gap-4 justify-center">
        <Link
          href="/store"
          className="rounded-lg border border-surface-200 px-6 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-100 transition"
        >
          Continue Shopping
        </Link>
        <Link
          href="/store/orders"
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}
