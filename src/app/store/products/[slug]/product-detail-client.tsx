'use client';

import { useState } from 'react';
import { VariantSelector } from '@/components/store/variant-selector';
import { AddToCartButton } from '@/components/store/add-to-cart-button';
import type { ProductVariant, ProductType } from '@/types/store';

interface Props {
  productId: string;
  variants: ProductVariant[];
  productType: ProductType;
}

export function ProductDetailClient({ productId, variants, productType }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  );

  const requiresVariant = variants.length > 0;
  const isDigital = productType === 'digital';

  return (
    <div className="space-y-4">
      {requiresVariant && (
        <VariantSelector
          variants={variants}
          selectedId={selectedVariant}
          onChange={setSelectedVariant}
        />
      )}

      <AddToCartButton
        productId={productId}
        variantId={selectedVariant}
        disabled={requiresVariant && !selectedVariant}
        label={isDigital ? 'Buy Now' : 'Add to Cart'}
      />

      {isDigital && (
        <p className="text-xs text-ink-400 text-center">
          Digital product — delivered via email after purchase
        </p>
      )}
    </div>
  );
}
