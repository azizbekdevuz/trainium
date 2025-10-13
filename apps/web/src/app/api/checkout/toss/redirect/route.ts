import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import { sendOrderConfirmationEmail } from "../../../../../lib/email";
import { generateTrackingNumber, generateCarrier } from "../../../../../lib/tracking-generator";
import { createUserNotification, NotificationTemplates, NotificationData } from "../../../../../lib/notifications";
import { sendSocketOrderUpdate } from "../../../../../lib/socket-server";
import { checkAndNotifyLowStockForProduct } from "../../../../../lib/product-notifications";

export const runtime = "nodejs";

// Handle form-based payment redirect
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  try {
    const formData = await req.formData();
    const cartId = formData.get('cartId') as string;
    const addressParam = formData.get('address') as string;
    const method = formData.get('method') as string;
    const orderId = formData.get('orderId') as string;
    const amount = formData.get('amount') as string;
    const orderName = formData.get('orderName') as string;
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;

    console.log('Toss Payments POST redirect received:', {
      cartId, method, orderId, amount, orderName, customerName, customerEmail
    });

    if (!cartId || !addressParam || !method || !orderId) {
      return NextResponse.redirect(new URL('/checkout?error=missing_params', req.url));
    }

    const address = JSON.parse(addressParam);
    
    // Verify the order exists (it should have been created in create-intent)
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipping: true },
    });

    if (!existingOrder) {
      console.error('Order not found:', orderId);
      return NextResponse.redirect(new URL('/checkout?error=order_not_found', req.url));
    }

    if (existingOrder.status !== 'PENDING') {
      console.error('Order not in pending status:', existingOrder.status);
      return NextResponse.redirect(new URL('/checkout?error=order_already_processed', req.url));
    }

    // Update the order to paid and decrement inventory in test mode
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paymentRef: `toss_${method}_${Date.now()}`,
        shipping: {
          upsert: {
            create: {
              fullName: address.fullName,
              phone: address.phone,
              address1: address.address1,
              address2: address.address2 || null,
              city: address.city,
              state: address.state || null,
              postalCode: address.postalCode,
              country: address.country || 'KR',
              carrier: generateCarrier(),
              trackingNo: generateTrackingNumber(),
              status: "Preparing",
            },
            update: {
              fullName: address.fullName,
              phone: address.phone,
              address1: address.address1,
              address2: address.address2 || null,
              city: address.city,
              state: address.state || null,
              postalCode: address.postalCode,
              country: address.country || 'KR',
              carrier: generateCarrier(),
              trackingNo: generateTrackingNumber(),
              status: "Preparing",
            }
          }
        },
      },
      include: { items: true, shipping: true },
    });

    // Record payment row
    try {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: 'TOSS',
          providerRef: order.paymentRef || `toss_${method}_${Date.now()}`,
          amountCents: order.totalCents,
          currency: order.currency,
          status: 'SUCCEEDED',
        },
      });
    } catch (error) {
      console.error('Failed to record TOSS payment row:', error);
    }

    // Decrement inventory
    for (const it of order.items) {
      const inv = await prisma.inventory.findUnique({ where: { productId: it.productId } });
      if (inv) {
        const newQty = Math.max(0, inv.inStock - it.qty);
        await prisma.inventory.update({ where: { productId: it.productId }, data: { inStock: newQty } });
      }
    }

    // Check only ordered products for low stock notifications
    try {
      for (const it of order.items) {
        await checkAndNotifyLowStockForProduct(it.productId);
      }
    } catch (error) {
      console.error('Failed to check low stock for ordered products:', error);
    }
    
    console.log('Updated order status to PAID:', {
      orderId: order.id,
      status: order.status,
      paymentRef: order.paymentRef,
      method
    });

    // Clear the cart
    await prisma.cartItem.deleteMany({ where: { cartId } });

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail({
        orderId: order.id,
        customerName: customerName || session.user.name || 'Customer',
        customerEmail: customerEmail || session.user.email!,
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

    // Create DB notification and push real-time update
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

        await sendSocketOrderUpdate(
          session.user.id,
          order.id,
          {
            orderId: order.id,
            status: 'PAID',
            trackingNumber: order.shipping?.trackingNo || undefined,
            message: notificationTemplate.message,
          }
        );
      }
    } catch (error) {
      console.error('Failed to create/send order notification:', error);
    }

    // In test mode, directly redirect to success page
    // In production, this would redirect to actual Toss Payments with the payment method
    const successUrl = new URL('/checkout/success', req.url);
    successUrl.searchParams.set('test', 'true');
    successUrl.searchParams.set('method', 'toss');
    successUrl.searchParams.set('paymentMethod', method);
    
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Toss payment POST error:', error);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', req.url));
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const { searchParams } = new URL(req.url);
  const cartId = searchParams.get('cartId');
  const addressParam = searchParams.get('address');
  
  if (!cartId || !addressParam) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const address = JSON.parse(decodeURIComponent(addressParam));
    
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.redirect(new URL('/checkout?error=cart_empty', req.url));
    }

    // Calculate total amount
    const subtotal = cart.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
    const currency = cart.items[0].product.currency;

    // Create or find user
    const user = await prisma.user.upsert({
      where: { email: session.user.email! },
      update: {},
      create: { email: session.user.email!, name: session.user.name ?? null },
    });

    // Create the order + items + shipping snapshot
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: "PAID", // In test mode, simulate successful payment
        subtotalCents: subtotal,
        totalCents: subtotal,
        currency,
        paymentRef: `toss_test_${Date.now()}`,
        items: {
          create: cart.items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId ?? null,
            name: it.product.name + (it.variant ? ` (${it.variant.name})` : ""),
            sku: it.variant?.sku ?? null,
            qty: it.qty,
            priceCents: it.priceCents,
          })),
        },
        shipping: address ? {
          create: {
            fullName: address.fullName,
            phone: address.phone,
            address1: address.address1,
            address2: address.address2 || null,
            city: address.city,
            state: address.state || null,
            postalCode: address.postalCode,
            country: address.country || "KR",
            carrier: generateCarrier(),
            trackingNo: generateTrackingNumber(),
            status: "Preparing",
          },
        } : undefined,
      },
      include: { items: true, shipping: true },
    });

    // Clear the cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

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
      const notificationTemplate = await NotificationTemplates.ORDER_CONFIRMED(order.id, user.id);

      await createUserNotification(
        user.id,
        notificationTemplate.type,
        notificationTemplate.title,
        notificationTemplate.message,
        notificationTemplate.data as NotificationData
      );
    } catch (error) {
      console.error('Failed to send order confirmation notification:', error);
      // Don't fail the order creation if notification fails
    }

    // In test mode, directly redirect to success page
    // In production, this would be handled by Toss Payments callback
    return NextResponse.redirect(new URL('/checkout/success?test=true&method=toss', req.url));

  } catch (error) {
    console.error('Toss payment error:', error);
    return NextResponse.redirect(new URL('/checkout?error=payment_failed', req.url));
  }
}