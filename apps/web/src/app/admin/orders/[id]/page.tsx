import { auth } from '../../../../auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '../../../../lib/db';
import Link from 'next/link';
import { OrderManagementClient } from '../../../../components/admin/OrderManagementClient';
import { negotiateLocale, getDictionary } from '../../../../lib/i18n';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
      items: true,
      shipping: true,
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  return order;
}

export default async function AdminOrderPage({ params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);

  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const orderData = {
    id: order.id,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    currency: order.currency,
    paymentRef: order.paymentRef,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    user: order.user ? {
      id: order.user.id,
      email: order.user.email,
      name: order.user.name,
      createdAt: order.user.createdAt.toISOString(),
    } : null,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      sku: item.sku,
      qty: item.qty,
      priceCents: item.priceCents,
    })),
    shipping: order.shipping ? {
      id: order.shipping.id,
      fullName: order.shipping.fullName,
      phone: order.shipping.phone,
      address1: order.shipping.address1,
      address2: order.shipping.address2,
      city: order.shipping.city,
      state: order.shipping.state,
      postalCode: order.shipping.postalCode,
      country: order.shipping.country,
      carrier: order.shipping.carrier,
      trackingNo: order.shipping.trackingNo,
      status: order.shipping.status,
    } : null,
    payments: order.payments.map(payment => ({
      id: payment.id,
      provider: payment.provider,
      providerRef: payment.providerRef,
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">{dict.admin?.orders?.detail?.title ?? 'Order Management'}</h1>
          <p className="text-gray-600">
            {(dict.admin?.orders?.detail?.orderPrefix ?? 'Order')} {order.id.slice(0, 8).toUpperCase()} • {order.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </p>
        </div>
        <Link 
          href={`/${lang}/admin/orders`} 
          className="text-sm text-cyan-700 hover:underline"
        >
          {dict.admin?.orders?.detail?.back ?? '← Back to Orders'}
        </Link>
      </div>

      <OrderManagementClient order={orderData} />
    </div>
  );
}
