import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/store';

const STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', className: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', className: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700' },
};

interface Props {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: Props) {
  const config = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  );
}
