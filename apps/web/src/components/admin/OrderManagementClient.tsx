'use client';

import { OrderTrackingTimeline } from '../order/OrderTrackingTimeline';
import { OrderTimeline } from '../order/OrderTimeline';
import { useI18n } from '../providers/I18nProvider';
import { useOrderStatus } from './orders/hooks/useOrderStatus';
import { useShippingUpdate } from './orders/hooks/useShippingUpdate';
import { getStatusOptions } from './orders/utils';
import { StatusSection } from './orders/StatusSection';
import { OrderItemsSection } from './orders/OrderItemsSection';
import { ShippingSection } from './orders/ShippingSection';
import { CustomerSection } from './orders/CustomerSection';
import { PaymentSection } from './orders/PaymentSection';
import { MessageDisplay } from './orders/MessageDisplay';
import type { OrderData } from './orders/types';

interface OrderManagementClientProps {
  order: OrderData;
}

export function OrderManagementClient({ order }: OrderManagementClientProps) {
  const { dict } = useI18n();
  
  const {
    currentStatus,
    selectedStatus,
    setSelectedStatus,
    isUpdating,
    message: statusMessage,
    handleStatusUpdate,
    validNextStatuses,
    allStatuses,
  } = useOrderStatus(order.id, order.status, dict);

  const {
    message: shippingMessage,
    handleShippingUpdate,
  } = useShippingUpdate(order.id, dict);

  const statusOptions = getStatusOptions(currentStatus, validNextStatuses);
  const displayMessage = statusMessage || shippingMessage;

  return (
    <div className="space-y-6">
      <MessageDisplay message={displayMessage} dict={dict} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StatusSection
            currentStatus={currentStatus}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            onUpdate={handleStatusUpdate}
            isUpdating={isUpdating}
            statusOptions={statusOptions}
            updatedAt={order.updatedAt}
            dict={dict}
          />

          <OrderItemsSection order={order} dict={dict} />

          {order.shipping && (
            <ShippingSection
              shipping={order.shipping}
              onUpdate={handleShippingUpdate}
              dict={dict}
            />
          )}
        </div>

        <div className="space-y-6">
          <CustomerSection user={order.user} dict={dict} />

          <PaymentSection payments={order.payments} dict={dict} />

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
