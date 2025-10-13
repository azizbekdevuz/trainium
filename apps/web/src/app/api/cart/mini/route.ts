import { NextRequest, NextResponse } from 'next/server';
import { getCart } from '../../../../lib/cart';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ items: [], subtotal: 0, total: 0, count: 0, currency: 'KRW' });
  }

  const items = cart.items.map((it) => ({
    id: it.id,
    name: it.product.name,
    variantName: it.variant?.name ?? null,
    qty: it.qty,
    priceCents: it.priceCents,
    currency: it.product.currency,
    image: (Array.isArray(it.product.images) && (it.product.images as any[])[0]?.src) || null,
  }));

  const subtotal = cart.items.reduce((s, it) => s + it.priceCents * it.qty, 0);
  const currency = cart.items[0]?.product.currency ?? 'KRW';
  const count = cart.items.reduce((s, it) => s + it.qty, 0);

  return NextResponse.json({ items, subtotal, total: subtotal, count, currency });
}


