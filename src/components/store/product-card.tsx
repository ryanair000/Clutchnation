'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import type { Product } from '@/types/store';

interface Props {
  product: Product & { category?: { name: string } | null };
}

export function ProductCard({ product }: Props) {
  const mainImage = product.images?.[0];

  return (
    <Link
      href={`/store/products/${product.slug}`}
      className="group block rounded-xl border border-surface-200 bg-surface-50 overflow-hidden transition hover:shadow-lg hover:border-brand-400"
    >
      <div className="relative aspect-square bg-surface-100">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            No image
          </div>
        )}
        {!product.is_active && (
          <span className="absolute top-2 left-2 rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            Sold Out
          </span>
        )}
        {product.compare_at_price && product.compare_at_price > product.price && (
          <span className="absolute top-2 right-2 rounded bg-accent-500 px-2 py-0.5 text-xs font-semibold text-white">
            Sale
          </span>
        )}
      </div>
      <div className="p-4">
        {product.category && (
          <p className="text-xs font-medium text-brand-500 mb-1">{product.category.name}</p>
        )}
        <h3 className="font-semibold text-ink-900 group-hover:text-brand-600 line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink-900">{formatPrice(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-ink-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
