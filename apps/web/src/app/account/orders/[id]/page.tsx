import { auth } from '../../../../auth';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '../../../../lib/database/db';
import { formatCurrency } from '../../../../lib/utils/format';
import { OrderTimeline } from '../../../../components/order/OrderTimeline';
import { OrderTrackingTimeline } from '../../../../components/order/OrderTrackingTimeline';
import { getDictionary, negotiateLocale } from '../../../../lib/i18n/i18n';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailsPage({ params }: Params) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | null)?.id;
  const lang = await negotiateLocale();
  const dict = await getDictionary(lang);
  if (!userId) redirect(`/${lang}/auth/signin?callbackUrl=/${lang}/account`);

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shipping: true, user: { select: { id: true, email: true } } },
  });
  if (!order || order.user?.id !== userId) return notFound();

  const total = order.items.reduce((s, it) => s + it.priceCents * it.qty, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl">{dict.orderPage?.order ?? 'Order'}
          {(() => {
            const short = order.id.includes('_') ? order.id.slice(-6) : order.id.slice(0, 8);
            return `${short.toUpperCase()}`;
          })()}
        </h1>
        <p className="text-sm text-gray-500">{dict.orderPage?.placed ?? 'Placed'} {order.createdAt.toLocaleString(lang, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })}</p>
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-3">{dict.orderPage?.items ?? 'Items'}</h2>
        <ul className="divide-y">
          {order.items.map((it) => (
            <li key={it.id} className="py-3 flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="truncate">{it.name}{it.sku ? ` (${it.sku})` : ''}</div>
                <div className="text-gray-500">{dict.orderPage?.qty ?? 'Qty'}: {it.qty}</div>
              </div>
              <div className="font-medium whitespace-nowrap">{formatCurrency(it.priceCents * it.qty, order.currency)}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t pt-3 flex justify-between font-semibold">
          <span>{dict.orderPage?.total ?? 'Total'}</span>
          <span>{formatCurrency(total, order.currency)}</span>
        </div>
      </section>

      <OrderTimeline 
        orderStatus={order.status}
        shippingStatus={order.shipping?.status}
        trackingNo={order.shipping?.trackingNo}
        createdAt={order.createdAt}
      />

          <OrderTrackingTimeline
            orderStatus={order.status}
            shippingStatus={order.shipping?.status}
            trackingNo={order.shipping?.trackingNo}
            carrier={order.shipping?.carrier}
            createdAt={order.createdAt}
          />

      {order.shipping && (
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-medium mb-3">{dict.orderPage?.shippingDetails ?? 'Shipping Details'}</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-medium">{dict.orderPage?.name ?? 'Name'}:</span> {order.shipping.fullName}</div>
            <div><span className="font-medium">{dict.orderPage?.phone ?? 'Phone'}:</span> {order.shipping.phone}</div>
            <div><span className="font-medium">{dict.orderPage?.address ?? 'Address'}:</span> {order.shipping.address1}</div>
            {order.shipping.address2 && (<div className="ml-16">{order.shipping.address2}</div>)}
            <div className="ml-16">{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}</div>
            <div className="ml-16">{order.shipping.country}</div>
            {order.shipping.status && (
              <div><span className="font-medium">{dict.orderPage?.status ?? 'Status'}:</span> <span className="ml-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{order.shipping.status}</span></div>
            )}
            {order.shipping.trackingNo && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-900">{dict.orderPage?.trackingNumber ?? 'Tracking Number'}</div>
                    <div className="font-mono text-lg font-bold text-blue-700">{order.shipping.trackingNo}</div>
                    {order.shipping.carrier && (
                      <div className="text-xs text-blue-600">{dict.orderPage?.carrier ?? 'Carrier'}: {order.shipping.carrier}</div>
                    )}
                  </div>
                  <a 
                    href={`/${lang}/track/${order.shipping.trackingNo}?email=${order?.user?.email ?? ''}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    {dict.orderPage?.trackPackage ?? 'Track Package'}
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}


