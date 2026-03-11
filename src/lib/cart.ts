/**
 * Cart utilities — server-only.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { MAX_CART_ITEM_QUANTITY } from '@/lib/constants';

const supabase = createServiceClient();

export async function getOrCreateCart(sessionId?: string, userId?: string) {
  if (!sessionId && !userId) throw new Error('Cart requires sessionId or userId');

  // Try to find existing cart
  let query = supabase.from('carts').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('session_id', sessionId!);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) return existing;

  // Create new cart
  const { data: created, error } = await supabase
    .from('carts')
    .insert(userId ? { user_id: userId } : { session_id: sessionId! })
    .select()
    .single();

  if (error) throw new Error(`Failed to create cart: ${error.message}`);
  return created;
}

export async function getCartWithItems(cartId: string) {
  const { data: items, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*),
      variant:product_variants(*)
    `)
    .eq('cart_id', cartId);

  if (error) throw new Error(`Failed to fetch cart items: ${error.message}`);
  return items ?? [];
}

export async function addToCart(
  cartId: string,
  productId: string,
  variantId: string | null,
  quantity: number
) {
  // Validate stock
  if (variantId) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();
    if (variant && variant.stock_quantity < quantity) {
      throw new Error(`Only ${variant.stock_quantity} available`);
    }
  } else {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();
    if (product && product.stock_quantity !== null && product.stock_quantity < quantity) {
      throw new Error(`Only ${product.stock_quantity} available`);
    }
  }

  // Check existing item
  let existingQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId);

  if (variantId) {
    existingQuery = existingQuery.eq('variant_id', variantId);
  } else {
    existingQuery = existingQuery.is('variant_id', null);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, MAX_CART_ITEM_QUANTITY);
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id);
    if (error) throw new Error(`Failed to update cart item: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId,
        quantity: Math.min(quantity, MAX_CART_ITEM_QUANTITY),
      });
    if (error) throw new Error(`Failed to add to cart: ${error.message}`);
  }
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeCartItem(cartItemId);
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: Math.min(quantity, MAX_CART_ITEM_QUANTITY) })
    .eq('id', cartItemId);
  if (error) throw new Error(`Failed to update quantity: ${error.message}`);
}

export async function removeCartItem(cartItemId: string) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  if (error) throw new Error(`Failed to remove item: ${error.message}`);
}

export async function getCartItemCount(cartId: string): Promise<number> {
  const { count } = await supabase
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('cart_id', cartId);
  return count ?? 0;
}

export async function clearCart(cartId: string) {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (error) throw new Error(`Failed to clear cart: ${error.message}`);
}

export async function mergeGuestCartIntoUser(sessionId: string, userId: string) {
  const guestCart = await supabase
    .from('carts')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!guestCart.data) return;

  const userCart = await getOrCreateCart(undefined, userId);

  // Get guest items
  const { data: guestItems } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', guestCart.data.id);

  if (guestItems && guestItems.length > 0) {
    for (const item of guestItems) {
      await addToCart(userCart.id, item.product_id, item.variant_id, item.quantity);
    }
  }

  // Delete guest cart
  await supabase.from('carts').delete().eq('id', guestCart.data.id);
}
