import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductGallery } from '@/components/store/product-gallery';
import { PriceDisplay } from '@/components/store/price-display';
import { VariantSelector } from '@/components/store/variant-selector';
import { AddToCartButton } from '@/components/store/add-to-cart-button';
import { ProductDetailClient } from './product-detail-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('name, description, images')
    .eq('slug', slug)
    .single();

  if (!data) return { title: 'Product Not Found' };

  return {
    title: `${data.name} | ClutchNation Store`,
    description: data.description?.slice(0, 160) ?? undefined,
    openGraph: data.images?.[0] ? { images: [data.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, category:product_categories(name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.images ?? []} productName={product.name} />

        <div className="space-y-6">
          {product.category && (
            <p className="text-sm font-medium text-brand-500">{product.category.name}</p>
          )}
          <h1 className="text-3xl font-bold text-ink-900">{product.name}</h1>

          <PriceDisplay price={product.price} compareAtPrice={product.compare_at_price} />

          {product.description && (
            <div className="prose prose-sm text-ink-600 max-w-none">
              <p>{product.description}</p>
            </div>
          )}

          <ProductDetailClient
            productId={product.id}
            variants={variants ?? []}
            productType={product.product_type}
          />
        </div>
      </div>
    </div>
  );
}
