import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cartId, address } = await req.json();

  // load cart
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart empty" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  // Build line items for checkout session
  const line_items = cart.items.map((it) => ({
    quantity: it.qty,
    price_data: {
      currency: it.product.currency.toLowerCase(),
      unit_amount: it.priceCents,
      product_data: {
        name: it.product.name + (it.variant ? ` (${it.variant.name})` : ""),
      },
    },
  }));

  const origin = req.headers.get("origin") ?? "http://72.61.149.55:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    customer_email: session.user.email,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
    metadata: {
      cartId: cart.id,
      address: JSON.stringify(address ?? {}),
    },
  });

  // Return the session id as "clientSecret" for our simple redirect flow
  return NextResponse.json({
    clientSecret: checkout.id,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  });
}
