'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/components/store/cart-provider';
import { CartItemRow } from '@/components/store/cart-item-row';
import { formatPrice } from '@/lib/currency';

export default function CartPage() {
  const { items, itemCount, loading } = useCart();

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.product.price + (item.variant?.price_override ?? 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-ink-900 mb-8">Your Cart</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-ink-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Your cart is empty</h1>
        <p className="text-ink-500 mb-6">Browse our store and add some items!</p>
        <Link
          href="/store"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-ink-900 mb-8">
        Your Cart <span className="text-ink-400 text-lg font-normal">({itemCount} items)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface-50 p-6 h-fit space-y-4">
          <h2 className="font-semibold text-ink-900">Order Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Shipping</span>
            <span className="text-ink-400">Calculated at checkout</span>
          </div>
          <hr className="border-surface-200" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/store/checkout"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition"
          >
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/store"
            className="block text-center text-sm text-brand-600 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
