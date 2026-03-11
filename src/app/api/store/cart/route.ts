import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CART_SESSION_COOKIE } from '@/lib/constants';
import {
  getOrCreateCart,
  getCartWithItems,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
} from '@/lib/cart';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookies = (await import('next/headers')).cookies;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId && !user) {
    return NextResponse.json({ items: [] });
  }

  try {
    const cart = await getOrCreateCart(sessionId, user?.id);
    const items = await getCartWithItems(cart.id);
    return NextResponse.json({ items, cartId: cart.id });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, variantId, quantity } = body;

  if (!productId || !quantity) {
    return NextResponse.json({ error: 'Missing productId or quantity' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookies = (await import('next/headers')).cookies;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId && !user) {
    return NextResponse.json({ error: 'No cart session' }, { status: 400 });
  }

  try {
    const cart = await getOrCreateCart(sessionId, user?.id);
    await addToCart(cart.id, productId, variantId ?? null, quantity);
    const items = await getCartWithItems(cart.id);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add item' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { cartItemId, quantity } = await req.json();
  if (!cartItemId) {
    return NextResponse.json({ error: 'Missing cartItemId' }, { status: 400 });
  }

  try {
    await updateCartItemQuantity(cartItemId, quantity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { cartItemId } = await req.json();
  if (!cartItemId) {
    return NextResponse.json({ error: 'Missing cartItemId' }, { status: 400 });
  }

  try {
    await removeCartItem(cartItemId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to remove' },
      { status: 400 }
    );
  }
}
