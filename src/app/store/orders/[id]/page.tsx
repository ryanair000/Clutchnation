import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { OrderStatusBadge } from '@/components/store/order-status-badge';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Details | ClutchNation Store' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name, slug, images, product_type))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!order) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/store/orders" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{order.order_number}</h1>
          <p className="text-sm text-ink-400">
            Placed {new Date(order.created_at).toLocaleDateString('en-KE', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-xl border border-surface-200 divide-y divide-surface-200">
        {order.items?.map((item: { id: string; quantity: number; unit_price: number; variant_name: string | null; product: { name: string; slug: string; images: string[] | null; product_type: string } | null }) => (
          <div key={item.id} className="flex gap-4 p-4">
            <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-surface-100">
              {item.product?.images?.[0] ? (
                <Image src={item.product.images[0]} alt={item.product.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink-300">No img</div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-ink-900">{item.product?.name ?? 'Product'}</p>
              {item.variant_name && <p className="text-sm text-ink-500">{item.variant_name}</p>}
              <p className="text-sm text-ink-400">Qty: {item.quantity}</p>
            </div>
            <p className="font-semibold text-ink-900">{formatPrice(item.unit_price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-surface-200 bg-surface-50 p-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Subtotal</span>
          <span>{formatPrice(order.total - order.shipping_cost)}</span>
        </div>
        {order.shipping_cost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Shipping</span>
            <span>{formatPrice(order.shipping_cost)}</span>
          </div>
        )}
        <hr className="border-surface-200" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total, order.currency)}</span>
        </div>
      </div>

      {order.shipping_tracking_id && (
        <div className="mt-6 rounded-xl border border-surface-200 bg-surface-50 p-4">
          <p className="text-sm font-medium text-ink-700">Tracking ID</p>
          <p className="text-sm text-ink-500">{order.shipping_tracking_id}</p>
        </div>
      )}
    </div>
  );
}
