import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/paystack';
import { createServiceClient } from '@/lib/supabase/service';
import { sendOrderConfirmation, sendDigitalDelivery } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';

  const valid = await verifyWebhookSignature(body, signature);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const reference = event.data.reference as string;
    const supabase = createServiceClient();

    // Verify with Paystack API
    const verified = await verifyTransaction(reference);
    if (verified.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    // Update order
    const { data: order } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: verified.data.paid_at,
      })
      .eq('paystack_reference', reference)
      .eq('status', 'pending')
      .select('*, items:order_items(*, product:products(name, images, product_type, digital_file_url))')
      .single();

    if (order) {
      // Send confirmation email
      await sendOrderConfirmation({
        orderNumber: order.order_number,
        email: order.email,
        total: order.total,
        currency: order.currency,
        items: order.items?.map((i: { product: { name: string; images: string[] | null }; quantity: number; unit_price: number }) => ({
          name: i.product?.name ?? 'Product',
          quantity: i.quantity,
          unitPrice: i.unit_price,
          image: i.product?.images?.[0],
        })) ?? [],
        shippingMethod: order.shipping_method,
      });

      // Handle digital products
      const digitalItems = order.items?.filter(
        (i: { product: { product_type: string; digital_file_url: string | null } | null }) =>
          i.product?.product_type === 'digital' && i.product?.digital_file_url
      );

      if (digitalItems && digitalItems.length > 0) {
        await sendDigitalDelivery({
          email: order.email,
          orderNumber: order.order_number,
          items: digitalItems.map((i: { product: { name: string; digital_file_url: string } }) => ({
            name: i.product.name,
            downloadUrl: i.product.digital_file_url,
          })),
        });

        // Mark as delivered if all items are digital
        const allDigital = order.items?.every(
          (i: { product: { product_type: string } | null }) => i.product?.product_type === 'digital'
        );
        if (allDigital) {
          await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', order.id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
