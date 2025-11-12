import { prisma } from '../database/db';
import { sendOrderConfirmationEmail } from '../email/email';
import { generateTrackingNumber, generateCarrier } from '../order/tracking-generator';
import { createUserNotification, NotificationTemplates, NotificationData } from '..//notifications';
import { checkAndNotifyLowStockForProduct } from '../product/product-notifications';
import { RecommendationCacheInvalidation } from '../services/recommendations/cache-invalidation';

type Address = {
  fullName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export async function finalizeOrderFromCart(params: {
  cartId: string;
  userEmail: string;
  userName?: string | null;
  address?: Address | null;
  paymentProvider: 'STRIPE' | 'TOSS';
  providerRef: string; // e.g. payment_intent id or toss order id
}): Promise<{ orderId: string }> {
  const { cartId, userEmail, userName, address, paymentProvider, providerRef } = params;

  // Idempotency: if we already recorded this payment, return associated order
  const existingPayment = await prisma.payment.findFirst({ where: { provider: paymentProvider, providerRef } });
  if (existingPayment?.orderId) {
    return { orderId: existingPayment.orderId };
  }

  // Load cart snapshot
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!cart || cart.items.length === 0) throw new Error('Cart not found or empty');

  // Validate inventory before creating the order
  for (const it of cart.items) {
    const inv = await prisma.inventory.findUnique({ where: { productId: it.productId } });
    const available = inv?.inStock ?? 0;
    if (it.qty > available) {
      throw new Error(`Insufficient stock for ${it.product.name}`);
    }
  }

  const subtotal = cart.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
  const currency = cart.items[0].product.currency;

  // Ensure user exists
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { email: userEmail, name: userName ?? undefined },
  });

  // Create order and items
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: 'PAID',
      subtotalCents: subtotal,
      totalCents: subtotal,
      currency,
      paymentRef: providerRef,
      items: {
        create: cart.items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId ?? null,
          name: it.product.name + (it.variant ? ` (${it.variant.name})` : ''),
          sku: it.variant?.sku ?? null,
          qty: it.qty,
          priceCents: it.priceCents,
        })),
      },
      shipping: address
        ? {
            create: {
              fullName: address.fullName ?? '',
              phone: address.phone ?? '',
              address1: address.address1 ?? '',
              address2: address.address2 ?? null,
              city: address.city ?? '',
              state: address.state ?? null,
              postalCode: address.postalCode ?? '',
              country: address.country ?? 'KR',
              carrier: generateCarrier(),
              trackingNo: generateTrackingNumber(),
              status: 'Preparing',
            },
          }
        : undefined,
    },
  });

  // Record payment (idempotent reference)
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: paymentProvider,
      providerRef,
      amountCents: subtotal,
      currency,
      status: 'SUCCEEDED',
    },
  });

  // Decrement inventory
  for (const it of cart.items) {
    const inv = await prisma.inventory.findUnique({ where: { productId: it.productId } });
    if (inv) {
      const newQty = Math.max(0, inv.inStock - it.qty);
      await prisma.inventory.update({ where: { productId: it.productId }, data: { inStock: newQty } });
    }
  }

  // Low stock check only for ordered products
  try {
    for (const it of cart.items) {
      await checkAndNotifyLowStockForProduct(it.productId);
    }
  } catch (error) {
    console.error('Failed to check low stock for ordered products:', error);
  }

  // Clear cart items
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  // Send order confirmation email
  try {
    // Fetch the order with shipping details to get tracking info
    const orderWithShipping = await prisma.order.findUnique({
      where: { id: order.id },
      include: { shipping: true }
    });

    await sendOrderConfirmationEmail({
      orderId: order.id,
      customerName: userName || 'Customer',
      customerEmail: userEmail,
      orderDate: order.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      items: cart.items.map((it) => ({
        name: it.product.name + (it.variant ? ` (${it.variant.name})` : ''),
        sku: it.variant?.sku ?? undefined,
        qty: it.qty,
        priceCents: it.priceCents,
      })),
      subtotalCents: subtotal,
      totalCents: subtotal,
      currency,
      shippingAddress: address ? {
        fullName: address.fullName || '',
        phone: address.phone || '',
        address1: address.address1 || '',
        address2: address.address2,
        city: address.city || '',
        state: address.state,
        postalCode: address.postalCode || '',
        country: address.country || 'KR',
      } : undefined,
      paymentMethod: paymentProvider === 'STRIPE' ? 'Credit Card' : 'Toss Payments',
      trackingNumber: orderWithShipping?.shipping?.trackingNo || undefined,
      carrier: orderWithShipping?.shipping?.carrier || undefined,
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

  // Invalidate recommendation cache after successful purchase
  try {
    await RecommendationCacheInvalidation.onPurchase(user.id);
  } catch (error) {
    console.error('Failed to invalidate recommendation cache:', error);
    // Don't fail the order creation if cache invalidation fails
  }

  return { orderId: order.id };
}


