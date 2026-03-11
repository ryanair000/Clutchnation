import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CART_SESSION_COOKIE } from '@/lib/constants';
import { initializeTransaction, generateReference } from '@/lib/paystack';
import { generateOrderNumber } from '@/lib/currency';
import { getOrCreateCart, getCartWithItems, clearCart } from '@/lib/cart';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, fullName, phone, shippingMethod, receiverAgentId, doorstepDestinationId } = body;

  if (!email || !fullName || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validShippingMethods = ['digital', 'pum_agent', 'pum_doorstep'];
  if (shippingMethod && !validShippingMethods.includes(shippingMethod)) {
    return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookies = (await import('next/headers')).cookies;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId && !user) {
    return NextResponse.json({ error: 'No cart session' }, { status: 400 });
  }

  try {
    const cart = await getOrCreateCart(sessionId, user?.id);
    const items = await getCartWithItems(cart.id);

    if (items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      const unitPrice = item.product.price + (item.variant?.price_override ?? 0);
      return sum + unitPrice * item.quantity;
    }, 0);

    // Fetch shipping cost if applicable
    let shippingCost = 0;
    if (shippingMethod === 'pum_agent' && receiverAgentId) {
      const { getAgentDeliveryCharge } = await import('@/lib/pickupmtaani');
      const senderAgentId = parseInt(process.env.PICKUPMTAANI_SENDER_AGENT_ID ?? '0', 10);
      shippingCost = await getAgentDeliveryCharge(senderAgentId, parseInt(receiverAgentId, 10));
    } else if (shippingMethod === 'pum_doorstep' && doorstepDestinationId) {
      const { getDoorstepDeliveryCharge } = await import('@/lib/pickupmtaani');
      const senderAgentId = parseInt(process.env.PICKUPMTAANI_SENDER_AGENT_ID ?? '0', 10);
      shippingCost = await getDoorstepDeliveryCharge(senderAgentId, parseInt(doorstepDestinationId, 10));
    }

    const total = subtotal + shippingCost;
    const orderNumber = generateOrderNumber();
    const paystackRef = generateReference();

    // Create order
    const { data: order, error: orderErr } = await serviceClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        email,
        status: 'pending',
        subtotal,
        shipping_cost: shippingCost,
        total,
        currency: 'KES',
        shipping_method: shippingMethod ?? 'digital',
        shipping_address: { fullName, phone, receiverAgentId, doorstepDestinationId },
        paystack_reference: paystackRef,
      })
      .select()
      .single();

    if (orderErr) throw new Error(`Order creation failed: ${orderErr.message}`);

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      variant_id: item.variant?.id ?? null,
      variant_name: item.variant?.name ?? null,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price + (item.variant?.price_override ?? 0),
    }));

    await serviceClient.from('order_items').insert(orderItems);

    // Clear cart
    await clearCart(cart.id);

    // Initialize Paystack
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const paystackResult = await initializeTransaction({
      email,
      amount: total, // already in cents from DB
      currency: 'KES',
      reference: paystackRef,
      metadata: { orderId: order.id, orderNumber },
      callback_url: `${origin}/store/checkout/callback`,
    });

    return NextResponse.json({
      authorizationUrl: paystackResult.data.authorization_url,
      reference: paystackRef,
      orderNumber,
    });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
