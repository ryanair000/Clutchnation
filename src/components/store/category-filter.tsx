'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Props {
  categories: { id: string; name: string; slug: string }[];
  selected: string | null;
  onChange?: (slug: string | null) => void;
}

export function CategoryFilter({ categories, selected, onChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleClick(slug: string | null) {
    if (onChange) {
      onChange(slug);
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={cn(
          'rounded-full px-4 py-1.5 text-sm font-medium transition',
          !selected
            ? 'bg-brand-600 text-white'
            : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
        )}
        onClick={() => handleClick(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition',
            selected === cat.slug
              ? 'bg-brand-600 text-white'
              : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
          )}
          onClick={() => handleClick(cat.slug)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
