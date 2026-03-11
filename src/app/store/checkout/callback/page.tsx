import { createClient } from '@/lib/supabase/server';
import { verifyTransaction } from '@/lib/paystack';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Processing Payment | ClutchNation Store' };

interface Props {
  searchParams: Promise<{ reference?: string }>;
}

export default async function CheckoutCallbackPage({ searchParams }: Props) {
  const { reference } = await searchParams;
  if (!reference) redirect('/store');

  try {
    const result = await verifyTransaction(reference);

    if (result.data.status === 'success') {
      // Update order status
      const supabase = await createClient();
      const { data: order } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          paystack_reference: reference,
          paid_at: result.data.paid_at,
        })
        .eq('paystack_reference', reference)
        .select('order_number')
        .single();

      redirect(`/store/order-confirmation?order=${order?.order_number ?? reference}`);
    }

    redirect(`/store/checkout?error=payment_failed`);
  } catch {
    redirect(`/store/checkout?error=verification_failed`);
  }
}
