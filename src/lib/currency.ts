import { CURRENCY_SYMBOL } from './constants';

/**
 * Format a price in cents to a display string.
 * e.g. formatPrice(150000) => "KSh 1,500"
 */
export function formatPrice(amountCents: number, currency = 'KES'): string {
  const amount = amountCents / 100;
  const symbols: Record<string, string> = {
    KES: 'KSh',
    USD: '$',
    NGN: '₦',
    GHS: 'GH₵',
    ZAR: 'R',
  };
  const symbol = symbols[currency] ?? currency + ' ';

  if (currency === 'USD') {
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Generate a unique order number: CN-20260311-XXXX
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CN-${y}${m}${d}-${rand}`;
}
