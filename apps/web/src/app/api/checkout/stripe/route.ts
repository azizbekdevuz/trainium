import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cartId, address } = await req.json();

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Cart empty" }, { status: 400 });
  }

  // Validate single-currency cart
  const currencies = new Set(cart.items.map((i) => i.product.currency.toLowerCase()));
  if (currencies.size !== 1) {
    return NextResponse.json({ error: "Cart has mixed currencies" }, { status: 400 });
  }
  const currency = [...currencies][0];

  // IMPORTANT: Treat priceCents as "minor units" across all currencies.
  // KRW, JPY, VND are zero-decimal; our DB already stores the correct minor unit numbers.
  const amountMinor = cart.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  // Create a PaymentIntent (idempotency per cart)
  // You can store the PI id on the cart to reuse; for speed we create a new one each time.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountMinor,           // already minor units
    currency: currency,           // e.g. "krw"
    automatic_payment_methods: { enabled: true },
    metadata: {
      cartId: cart.id,
      userEmail: session.user.email!,
      address: JSON.stringify(address ?? {}),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    paymentIntentId: paymentIntent.id,
  });
}

