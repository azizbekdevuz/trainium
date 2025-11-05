'use client';

import { useState } from 'react';
import { formatCurrency } from '../../lib/format';
import { getNextValidStatuses, getShippingStatusForOrder, ORDER_STATUS, type OrderStatus } from '../../lib/order-status';
import { useRouter } from 'next/navigation';
import { OrderTrackingTimeline } from '../order/OrderTrackingTimeline';
import { OrderTimeline } from '../order/OrderTimeline';
import { useI18n } from '../providers/I18nProvider';

interface OrderData {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  paymentRef: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    sku: string | null;
    qty: number;
    priceCents: number;
  }>;
  shipping: {
    id: string;
    fullName: string;
    phone: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    carrier: string | null;
    trackingNo: string | null;
    status: string | null;
  } | null;
  payments: Array<{
    id: string;
    provider: string;
    providerRef: string | null;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

interface OrderManagementClientProps {
  order: OrderData;
}

export function OrderManagementClient({ order }: OrderManagementClientProps) {
  const { dict } = useI18n();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const validNextStatuses = getNextValidStatuses(currentStatus);
  const allStatuses = Object.values(ORDER_STATUS) as OrderStatus[];
  
  const statusOptions: { value: OrderStatus; label: string; color: string; disabled?: boolean }[] = 
    allStatuses.map(status => ({
      value: status,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      color: status === currentStatus 
        ? 'bg-cyan-100 text-cyan-800' 
        : validNextStatuses.includes(status)
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-gray-50 text-gray-400',
      disabled: !validNextStatuses.includes(status) && status !== currentStatus
    }));

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const shippingStatus = getShippingStatusForOrder(selectedStatus);
      
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: selectedStatus,
          shippingStatus: shippingStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setCurrentStatus(selectedStatus);
      setMessage(dict.admin?.orders?.detail?.updateSuccess ?? 'Order status updated successfully!');
      
      router.refresh();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(dict.admin?.orders?.detail?.updateError ?? 'Failed to update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShippingUpdate = async (field: string, value: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update shipping information');
      }

      setMessage(dict.admin?.orders?.detail?.shippingUpdated ?? 'Shipping information updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(dict.admin?.orders?.detail?.shippingUpdateError ?? 'Failed to update shipping information. Please try again.');
    }
  };

  const currentStatusConfig = statusOptions.find(s => s.value === currentStatus);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') || message === (dict.admin?.orders?.detail?.updateSuccess ?? '') || message === (dict.admin?.orders?.detail?.shippingUpdated ?? '')
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.statusHeader ?? 'Order Status'}</h2>
            <div className="flex items-center gap-4 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusConfig?.color}`}>
                {currentStatusConfig?.label}
              </span>
              <span className="text-sm text-gray-500">
                {(dict.admin?.orders?.detail?.updated ?? 'Updated')} {new Date(order.updatedAt).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="h-10 rounded-lg border px-3 flex-1 max-w-xs"
                disabled={isUpdating}
              >
                {statusOptions.map((status) => (
                  <option 
                    key={status.value} 
                    value={status.value}
                    disabled={status.disabled}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || selectedStatus === currentStatus}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isUpdating ? (dict.common?.updating ?? 'Updating...') : (dict.admin?.orders?.detail?.updateCta ?? 'Update Status')}
              </button>
            </div>
            {selectedStatus !== currentStatus && (
              <p className="text-sm text-blue-600 mt-2">
                {(dict.admin?.orders?.detail?.willChange ?? 'Status will change from')} <strong>{currentStatus}</strong> {(dict.admin?.orders?.detail?.to ?? 'to')} <strong>{selectedStatus}</strong>
              </p>
            )}
          </section>

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

          {order.shipping && (
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.shippingHeader ?? 'Shipping Information'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.fullName ?? 'Full Name'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.fullName}
                    onBlur={(e) => e.target.value !== order.shipping!.fullName && handleShippingUpdate('fullName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.phone ?? 'Phone'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.phone}
                    onBlur={(e) => e.target.value !== order.shipping!.phone && handleShippingUpdate('phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.address1 ?? 'Address Line 1'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.address1}
                    onBlur={(e) => e.target.value !== order.shipping!.address1 && handleShippingUpdate('address1', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                {order.shipping.address2 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.address2 ?? 'Address Line 2'}</label>
                    <input
                      type="text"
                      defaultValue={order.shipping.address2}
                      onBlur={(e) => e.target.value !== order.shipping!.address2 && handleShippingUpdate('address2', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.city ?? 'City'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.city}
                    onBlur={(e) => e.target.value !== order.shipping!.city && handleShippingUpdate('city', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.postalCode ?? 'Postal Code'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.postalCode}
                    onBlur={(e) => e.target.value !== order.shipping!.postalCode && handleShippingUpdate('postalCode', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.country ?? 'Country'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.country}
                    onBlur={(e) => e.target.value !== order.shipping!.country && handleShippingUpdate('country', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.carrier ?? 'Carrier'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.carrier || ''}
                    onBlur={(e) => e.target.value !== (order.shipping!.carrier || '') && handleShippingUpdate('carrier', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={dict.admin?.orders?.detail?.carrierPh ?? 'e.g., CJ대한통운, DHL'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.trackingNo ?? 'Tracking Number'}</label>
                  <input
                    type="text"
                    defaultValue={order.shipping.trackingNo || ''}
                    onBlur={(e) => e.target.value !== (order.shipping!.trackingNo || '') && handleShippingUpdate('trackingNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={dict.admin?.orders?.detail?.trackingNoPh ?? 'Enter tracking number'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.shippingStatus ?? 'Shipping Status'}</label>
                  <select
                    defaultValue={order.shipping.status || 'Preparing'}
                    onChange={(e) => handleShippingUpdate('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Preparing">{dict.timeline?.preparing ?? 'Preparing'}</option>
                    <option value="In Transit">{dict.timeline?.onWay ?? 'In Transit'}</option>
                    <option value="Delivered">{dict.timeline?.delivered ?? 'Delivered'}</option>
                    <option value="Exception">{dict.admin?.orders?.detail?.exception ?? 'Exception'}</option>
                  </select>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.customerHeader ?? 'Customer Information'}</h2>
            {order.user ? (
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">{dict.admin?.orders?.detail?.name ?? 'Name'}:</span>
                  <div className="text-sm">{order.user.name || (dict.admin?.orders?.detail?.notProvided ?? 'Not provided')}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{dict.admin?.orders?.detail?.email ?? 'Email'}:</span>
                  <div className="text-sm">{order.user.email}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{dict.admin?.orders?.detail?.customerSince ?? 'Customer Since'}:</span>
                  <div className="text-sm">{new Date(order.user.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">{dict.admin?.orders?.detail?.guest ?? 'Guest order'}</div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.paymentHeader ?? 'Payment Information'}</h2>
            {order.payments.length > 0 ? (
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">{payment.provider}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {(dict.admin?.orders?.detail?.amount ?? 'Amount')}: {formatCurrency(payment.amountCents, payment.currency)}
                    </div>
                    {payment.providerRef && (
                      <div className="text-xs text-gray-500 font-mono">
                        {(dict.admin?.orders?.detail?.ref ?? 'Ref')}: {payment.providerRef}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">{dict.admin?.orders?.detail?.noPayment ?? 'No payment information available'}</div>
            )}
          </section>

          <OrderTimeline
            orderStatus={currentStatus}
            shippingStatus={order.shipping?.status}
            trackingNo={order.shipping?.trackingNo}
            createdAt={new Date(order.createdAt)}
          />

          <OrderTrackingTimeline
            orderStatus={currentStatus}
            shippingStatus={order.shipping?.status}
            trackingNo={order.shipping?.trackingNo}
            carrier={order.shipping?.carrier}
            createdAt={new Date(order.createdAt)}
          />
        </div>
      </div>
    </div>
  );
}
