'use client';

import { ShoppingCart, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './cart-provider';

interface Props {
  productId: string;
  variantId: string | null;
  disabled?: boolean;
  label?: string;
}

export function AddToCartButton({ productId, variantId, disabled, label }: Props) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await addItem(productId, variantId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      {added ? 'Added!' : label ?? 'Add to Cart'}
    </button>
  );
}
