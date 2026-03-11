import { formatPrice } from '@/lib/currency';

interface Props {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
}

export function PriceDisplay({ price, compareAtPrice, className }: Props) {
  return (
    <div className={className}>
      <span className="text-2xl font-bold text-ink-900">{formatPrice(price)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="ml-2 text-lg text-ink-400 line-through">{formatPrice(compareAtPrice)}</span>
      )}
    </div>
  );
}
