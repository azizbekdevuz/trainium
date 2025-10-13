import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";

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
    return NextResponse.json({ error: "Cart not found or empty" }, { status: 404 });
  }

  // Calculate total in cart currency from minor units
  const totalMinor = cart.items.reduce((sum, item) => sum + item.qty * item.priceCents, 0);

  // Determine product currency (assume single-currency cart)
  const productCurrency = cart.items[0]?.product.currency || 'KRW';

  // Convert minor units to major amount for the product currency
  const minorDigits = (cur: string) => {
    switch (cur.toUpperCase()) {
      case 'KRW':
      case 'JPY':
      case 'VND':
        return 0;
      default:
        return 2;
    }
  };

  const majorAmount = totalMinor / Math.pow(10, minorDigits(productCurrency));

  // Convert to KRW major amount (integer) using a placeholder FX rate for USD; adjust as needed in production
  const fxRate = productCurrency === 'USD' ? 1300 : 1; // TODO: replace with live FX
  const totalKRW = Math.round(majorAmount * fxRate);
  
  console.log('Price calculation:', {
    totalMinor,
    productCurrency,
    totalKRW,
    calculation: productCurrency === 'KRW' ? 'KRW cents → KRW' : `${productCurrency} → KRW`
  });

  // Create order name in Korean
  const firstProduct = cart.items[0];
  const orderName = cart.items.length === 1 
    ? firstProduct.product.name
    : `${firstProduct.product.name} 외 ${cart.items.length - 1}건`;

  // Generate unique order ID
  const orderId = `toss_${cartId}_${Date.now()}`;

  // In production, you would:
  // 1. Create a payment intent with Toss Payments API
  // 2. Store the payment intent in your database
  // 3. Return the payment data for frontend processing

  // Get user ID from session
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  // Store order information in database for later verification
  await prisma.order.create({
    data: {
      id: orderId,
      userId: user?.id,
      subtotalCents: totalMinor,
      totalCents: totalMinor,
      currency: productCurrency,
      status: "PENDING",
      // embed cartId for later reconciliation in success handler
      paymentRef: `toss_pending_${orderId}_${cartId}`,
      items: {
        create: cart.items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          sku: item.variant?.sku || item.product.id,
          qty: item.qty,
          priceCents: item.priceCents,
        })),
      },
      // Do NOT create shipping yet; we will write the final address at redirect step
    },
  });

  return NextResponse.json({
    success: true,
    amount: totalKRW,
    orderId: orderId,
    orderName: orderName,
    customerName: address.fullName || "고객",
    customerEmail: session.user.email || "customer@example.com",
    currency: "KRW",
    testMode: true,
    // Toss Payments Widget configuration following official docs
    tossConfig: {
      clientKey: "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq", // Official test key from docs
      successUrl: `${req.nextUrl.origin}/api/checkout/toss/success`,
      failUrl: `${req.nextUrl.origin}/checkout?error=payment_failed`,
    }
  });
}