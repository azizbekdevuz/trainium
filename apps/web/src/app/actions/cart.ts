'use server';

import { addToCart, updateItemQty, removeItem } from '../../lib/cart/cart';
// import { redirect } from 'next/navigation';
import { setCartId } from '../../lib/utils/cookies';

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get('productId') ?? '');
  const variantIdRaw = formData.get('variantId');
  const variantId = variantIdRaw === null || variantIdRaw === undefined || variantIdRaw === ''
    ? ''
    : String(variantIdRaw);
  const qty = Number(formData.get('qty') ?? '1');
  if (!productId || Number.isNaN(qty)) return;

  try {
    await addToCart(productId, variantId || '', qty);
    // No redirect; client UI handles feedback and mini-cart update
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    const m = msg.match(/^STOCK_EXCEEDED:(\d+)/);
    if (m) {
      // Do nothing: client-side pre-check shows toast and blocks submission.
      // If race condition, we silently no-op here so no redirect/404 occurs.
      return;
    }
    throw e;
  }
}

export async function updateQtyAction(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  const qty = Number(formData.get('qty') ?? '1');
  if (!itemId || Number.isNaN(qty)) return;
  
  try {
    await updateItemQty(itemId, qty);
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    const m = msg.match(/^STOCK_EXCEEDED:(\d+)/);
    if (m) {
      // Do nothing: client-side pre-check shows toast and blocks submission.
      // If race condition, we silently no-op here so no redirect/404 occurs.
      return;
    }
    throw e;
  }
}

export async function removeItemAction(formData: FormData) {
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;
  await removeItem(itemId);
}

export async function syncCartCookie(cartId: string) {
  await setCartId(cartId);
}