import { formatCurrency } from '../../../lib/format';
import type { OrderData } from './types';
import type { Dictionary } from '../../../lib/i18n';

interface OrderItemsSectionProps {
  order: OrderData;
  dict: Dictionary;
}

export function OrderItemsSection({ order, dict }: OrderItemsSectionProps) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.itemsHeader ?? 'Order Items'}</h2>
      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div>
              <div className="font-medium">{item.name}</div>
              {item.sku && <div className="text-sm text-gray-500">SKU: {item.sku}</div>}
              <div className="text-sm text-gray-500">{(dict.admin?.orders?.detail?.qty ?? 'Qty')}: {item.qty}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(item.priceCents * item.qty, order.currency)}</div>
              <div className="text-sm text-gray-500">{formatCurrency(item.priceCents, order.currency)} {(dict.admin?.orders?.detail?.each ?? 'each')}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm mb-2">
          <span>{dict.admin?.orders?.detail?.subtotal ?? 'Subtotal'}:</span>
          <span>{formatCurrency(order.subtotalCents, order.currency)}</span>
        </div>
        {order.discountCents > 0 && (
          <div className="flex justify-between text-sm mb-2 text-green-600">
            <span>{dict.admin?.orders?.detail?.discount ?? 'Discount'}:</span>
            <span>-{formatCurrency(order.discountCents, order.currency)}</span>
          </div>
        )}
        {order.shippingCents > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span>{dict.admin?.orders?.detail?.shipping ?? 'Shipping'}:</span>
            <span>{formatCurrency(order.shippingCents, order.currency)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg">
          <span>{dict.admin?.orders?.detail?.total ?? 'Total'}:</span>
          <span>{formatCurrency(order.totalCents, order.currency)}</span>
        </div>
      </div>
    </section>
  );
}

