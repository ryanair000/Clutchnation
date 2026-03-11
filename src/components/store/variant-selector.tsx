'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types/store';
import { formatPrice } from '@/lib/currency';

interface Props {
  variants: ProductVariant[];
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function VariantSelector({ variants, selectedId, onChange }: Props) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-700">Options</label>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const outOfStock = v.stock_quantity <= 0;
          return (
            <button
              key={v.id}
              disabled={outOfStock}
              onClick={() => onChange(v.id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition',
                v.id === selectedId
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-surface-200 hover:border-brand-300 text-ink-700',
                outOfStock && 'opacity-40 cursor-not-allowed line-through'
              )}
            >
              {v.name}
              {v.price_override !== null && v.price_override !== 0 && (
                <span className="ml-1 text-xs text-ink-400">
                  {formatPrice(v.price_override)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
