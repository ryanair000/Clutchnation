'use client';

import Image from 'next/image';
import { Trash2, Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useCart } from './cart-provider';

interface Props {
  item: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      images: string[] | null;
    };
    variant: {
      id: string;
      name: string;
      price_override: number | null;
    } | null;
  };
}

export function CartItemRow({ item }: Props) {
  const { updateQuantity, removeItem } = useCart();
  const unitPrice = item.product.price + (item.variant?.price_override ?? 0);
  const image = item.product.images?.[0];

  return (
    <div className="flex gap-4 py-4 border-b border-surface-200 last:border-0">
      <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-surface-100">
        {image ? (
          <Image src={image} alt={item.product.name} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300 text-xs">
            No img
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-ink-900 truncate">{item.product.name}</h4>
        {item.variant && (
          <p className="text-sm text-ink-500">{item.variant.name}</p>
        )}
        <p className="text-sm font-semibold text-ink-700 mt-1">{formatPrice(unitPrice)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => removeItem(item.id)}
          className="p-1 text-ink-400 hover:text-red-500 transition"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 rounded-lg border border-surface-200">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-1.5 hover:bg-surface-100 transition rounded-l-lg"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="p-1.5 hover:bg-surface-100 transition rounded-r-lg"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
