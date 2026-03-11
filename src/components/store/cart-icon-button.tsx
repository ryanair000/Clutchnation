'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from './cart-provider';

export function CartIconButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/store/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-50 hover:text-ink transition-colors"
      aria-label={`Cart (${itemCount} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
