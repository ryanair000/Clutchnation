import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/product-card';
import { CategoryFilter } from '@/components/store/category-filter';
import { SearchBar } from '@/components/store/search-bar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Store | ClutchNation',
  description: 'Official ClutchNation merch, gaming accessories, collectibles, and more.',
};

export const revalidate = 60;

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function StorePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .order('sort_order');

  if (catError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-ink-900">Store</h1>
        <p className="text-ink-400 mt-4">The store is being set up. Check back soon!</p>
      </div>
    );
  }

  // Build product query
  let query = supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (params.category) {
    const cat = categories?.find((c) => c.slug === params.category);
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`);
  }

  const { data: products } = await query;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Store</h1>
        <p className="text-ink-500 mt-1">Official ClutchNation gear and accessories</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <CategoryFilter
          categories={categories ?? []}
          selected={params.category ?? null}
          onChange={() => {}}
        />
        <SearchBar />
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-ink-400 text-lg">No products found</p>
          {params.q && <p className="text-ink-300 mt-1">Try a different search term</p>}
        </div>
      )}
    </div>
  );
}
