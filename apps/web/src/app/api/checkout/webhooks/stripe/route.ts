import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { finalizeOrderFromCart } from '../../../../../lib/order/order-finalize';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Allow disabling this webhook when using Elements + server finalize only
  if (!process.env.STRIPE_WEBHOOK_ENABLED || process.env.STRIPE_WEBHOOK_ENABLED === 'false') {
    return NextResponse.json({ disabled: true }, { status: 204 });
  }
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const rawBody = await req.text();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const cartId = (session.metadata?.cartId as string) ?? '';
    const address = session.metadata?.address ? JSON.parse(session.metadata.address) : null;
    const email = session.customer_email ?? '';
    if (cartId && email) {
      await finalizeOrderFromCart({
        cartId,
        userEmail: email,
        address,
        paymentProvider: 'STRIPE',
        providerRef: session.payment_intent as string,
      });
    }
  }

  return NextResponse.json({ received: true });
}


