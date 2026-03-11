'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { PRODUCT_TYPES } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
}

interface Props {
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    product_type: string;
    category_id: string | null;
    stock_quantity: number | null;
    is_active: boolean;
    is_featured: boolean;
    images: string[] | null;
    digital_file_url: string | null;
  };
  categories: Category[];
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price / 100) : '');
  const [compareAt, setCompareAt] = useState(product && product.compare_at_price != null ? String(product.compare_at_price / 100) : '');
  const [productType, setProductType] = useState(product?.product_type ?? 'physical');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '');
  const [stock, setStock] = useState(product?.stock_quantity != null ? String(product.stock_quantity) : '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [digitalUrl, setDigitalUrl] = useState(product?.digital_file_url ?? '');

  // Auto-generate slug from name
  useEffect(() => {
    if (!product) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  }, [name, product]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      price: Math.round(parseFloat(price) * 100),
      compare_at_price: compareAt ? Math.round(parseFloat(compareAt) * 100) : null,
      product_type: productType,
      category_id: categoryId || null,
      stock_quantity: stock ? parseInt(stock, 10) : null,
      is_active: isActive,
      is_featured: isFeatured,
      digital_file_url: digitalUrl.trim() || null,
    };

    try {
      const url = product
        ? `/api/admin/store/products/${product.id}`
        : '/api/admin/store/products';
      const res = await fetch(url, {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }

      router.push('/admin/store/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink-700 mb-1">Slug</label>
          <input
            type="text" required value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
          <textarea
            rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Category</label>
          <select
            value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
          >
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Product Type</label>
          <select
            value={productType} onChange={(e) => setProductType(e.target.value)}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
          >
            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Price (KES)</label>
          <input
            type="number" required step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Compare at Price (KES)</label>
          <input
            type="number" step="0.01" min="0" value={compareAt} onChange={(e) => setCompareAt(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Stock Quantity</label>
          <input
            type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
            placeholder="Leave empty for unlimited"
            className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        {productType === 'digital' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-700 mb-1">Digital File URL</label>
            <input
              type="url" value={digitalUrl} onChange={(e) => setDigitalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-surface-300" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded border-surface-300" />
          Featured
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
