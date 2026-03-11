'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { CART_SESSION_COOKIE, CART_SESSION_MAX_AGE_DAYS } from '@/lib/constants';

interface CartContextType {
  items: CartDisplayItem[];
  itemCount: number;
  loading: boolean;
  addItem: (productId: string, variantId: string | null, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface CartDisplayItem {
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
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

function getSessionId(): string {
  if (typeof document === 'undefined') return '';
  const cookies = document.cookie.split(';').map((c) => c.trim());
  const match = cookies.find((c) => c.startsWith(`${CART_SESSION_COOKIE}=`));
  if (match) return match.split('=')[1];

  const id = crypto.randomUUID();
  const maxAge = CART_SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CART_SESSION_COOKIE}=${id}; path=/; max-age=${maxAge}; samesite=lax`;
  return id;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/store/cart');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getSessionId(); // ensure cookie exists
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId: string, variantId: string | null, quantity: number) => {
    await fetch('/api/store/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    await refresh();
  }, [refresh]);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    await fetch('/api/store/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItemId, quantity }),
    });
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (cartItemId: string) => {
    await fetch('/api/store/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItemId }),
    });
    await refresh();
  }, [refresh]);

  return (
    <CartContext.Provider value={{ items, itemCount: items.reduce((s, i) => s + i.quantity, 0), loading, addItem, updateQuantity, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}
