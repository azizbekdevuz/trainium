import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { finalizeOrderFromCart } from "../../../../lib/order/order-finalize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cartId, paymentIntentId, address } = await req.json();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== "succeeded") {
    return NextResponse.json({ error: "Payment not successful yet" }, { status: 400 });
  }

  // Finalize order (idempotent across repeated calls)
  const result = await finalizeOrderFromCart({
    cartId,
    userEmail: session.user.email!,
    userName: session.user.name ?? null,
    address,
    paymentProvider: 'STRIPE',
    providerRef: paymentIntentId,
  });

  return NextResponse.json({ ok: true, orderId: result.orderId });
}