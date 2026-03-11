'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: Props) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-surface-100 flex items-center justify-center text-ink-300">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-100">
        <Image
          src={images[selected]}
          alt={`${productName} — image ${selected + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                'relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition',
                i === selected ? 'border-brand-500' : 'border-transparent hover:border-surface-300'
              )}
            >
              <Image src={src} alt={`Thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
