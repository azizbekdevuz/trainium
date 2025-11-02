import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
// import { finalizeOrderFromCart } from "../../../../../lib/order-finalize";
import { sendOrderConfirmationEmail } from "../../../../../lib/email";
import { generateTrackingNumber, generateCarrier } from "../../../../../lib/tracking-generator";
import { createUserNotification, NotificationTemplates, NotificationData } from "../../../../../lib/notifications";
import { checkLowStockProducts } from "../../../../../lib/product-notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const { searchParams } = new URL(req.url);
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');
  const orderId = searchParams.get('orderId');

  if (!paymentKey || !amount || !orderId) {
    return NextResponse.redirect(new URL('/checkout?error=missing_parameters', req.url));
  }

  try {
    // Find the order in our database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipping: true },
    });

    if (!order) {
      return NextResponse.redirect(new URL('/checkout?error=order_not_found', req.url));
    }

    // Verify amount hasn't been tampered with (as per official docs)
    // Convert expected amount to KRW display based on currency minor digits and FX
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
    const fxRate = order.currency.toUpperCase() === 'USD' ? 1300 : 1; // placeholder FX
    const expectedAmount = Math.round((order.totalCents / Math.pow(10, minorDigits(order.currency))) * fxRate);
    if (parseInt(amount) !== expectedAmount) {
      console.error('Amount mismatch:', { received: amount, expected: expectedAmount });
      return NextResponse.redirect(new URL('/checkout?error=amount_mismatch', req.url));
    }

    // Authorize payment with Toss Payments API following official docs
    // https://docs.tosspayments.com/en/integration-widget#3-authorize-the-payment
    const tossSecretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R'; // Test secret key
    const authHeader = Buffer.from(`${tossSecretKey}:`).toString('base64');

    const authResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'en', // Get responses in English as per docs
      },
      body: JSON.stringify({
        paymentKey,
        amount: parseInt(amount),
        orderId,
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      console.error('Toss Payments authorization failed:', errorData);
      return NextResponse.redirect(new URL('/checkout?error=authorization_failed', req.url));
    }

    const paymentData = await authResponse.json();
    
    // Verify payment method and status as per docs
    if (paymentData.status !== 'DONE') {
      console.error('Payment not completed:', paymentData);
      return NextResponse.redirect(new URL('/checkout?error=payment_incomplete', req.url));
    }

    // Update order to PAID, upsert shipping if missing, record payment, decrement inventory
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: 'PAID', paymentRef: `toss_${paymentKey}` } });
      if (!order.shipping) {
        const fullName = typeof session?.user?.name === 'string' && session.user.name.trim() ? session.user.name : 'Customer';
        await tx.shipping.create({
          data: {
            orderId: orderId,
            fullName,
            phone: '',
            address1: '',
            address2: null,
            city: '',
            state: null,
            postalCode: '',
            country: order.currency.toUpperCase() === 'KRW' ? 'KR' : 'US',
            carrier: generateCarrier(),
            trackingNo: generateTrackingNumber(),
            status: 'Preparing',
          },
        });
      }
      await tx.payment.create({
        data: {
          orderId: orderId,
          provider: 'TOSS',
          providerRef: `toss_${paymentKey}`,
          amountCents: order.totalCents,
          currency: order.currency,
          status: 'SUCCEEDED',
        },
      });
      for (const it of order.items) {
        const inv = await tx.inventory.findUnique({ where: { productId: it.productId } });
        if (inv) {
          const newQty = Math.max(0, inv.inStock - it.qty);
          await tx.inventory.update({ where: { productId: it.productId }, data: { inStock: newQty } });
        }
      }
    });

    // Check for low stock notifications after inventory update
    try {
      await checkLowStockProducts();
    } catch (error) {
      console.error('Failed to check low stock notifications:', error);
      // Don't fail the order if low stock check fails
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail({
        orderId: order.id,
        customerName: session.user.name || 'Customer',
        customerEmail: session.user.email!,
        orderDate: order.createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        items: order.items.map((it) => ({
          name: it.name,
          sku: it.sku ?? undefined,
          qty: it.qty,
          priceCents: it.priceCents,
        })),
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
        currency: order.currency,
        shippingAddress: order.shipping ? {
          fullName: order.shipping.fullName,
          phone: order.shipping.phone,
          address1: order.shipping.address1,
          address2: order.shipping.address2,
          city: order.shipping.city,
          state: order.shipping.state,
          postalCode: order.shipping.postalCode,
          country: order.shipping.country,
        } : undefined,
        paymentMethod: 'Toss Payments',
        trackingNumber: order.shipping?.trackingNo || undefined,
        carrier: order.shipping?.carrier || undefined,
      });
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      // Don't fail the order creation if email fails
    }

    // Send order confirmation notification
    try {
      if (session.user?.id) {
        const notificationTemplate = await NotificationTemplates.ORDER_CONFIRMED(order.id, session.user.id);

        await createUserNotification(
          session.user.id,
          notificationTemplate.type,
          notificationTemplate.title,
          notificationTemplate.message,
          notificationTemplate.data as NotificationData
        );
      }
    } catch (error) {
      console.error('Failed to send order confirmation notification:', error);
      // Don't fail the order creation if notification fails
    }

    // Redirect to success page with proper parameters
    {
      const origin = req.headers.get('origin') ?? req.nextUrl.origin;
      return NextResponse.redirect(new URL('/checkout/success?method=toss&test=true', origin));
    }

  } catch (error) {
    console.error('Toss Payments success handler error:', error);
    return NextResponse.redirect(new URL('/checkout?error=server_error', req.url));
  }
}
