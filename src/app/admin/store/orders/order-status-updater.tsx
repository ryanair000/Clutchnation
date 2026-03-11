'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ORDER_STATUSES } from '@/lib/constants';
import type { OrderStatus } from '@/types/store';

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function update() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/store/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button
        onClick={update}
        disabled={saving || status === currentStatus}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
      >
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        Update
      </button>
    </div>
  );
}
