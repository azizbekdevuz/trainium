import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@prisma/client';
import { getNextValidStatuses, getShippingStatusForOrder, ORDER_STATUS } from '../../../../lib/order-status';
import type { Dictionary } from '../../../../lib/i18n';

export function useOrderStatus(
  orderId: string,
  initialStatus: OrderStatus,
  dict: Dictionary
) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(initialStatus);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validNextStatuses = getNextValidStatuses(currentStatus);
  const allStatuses = Object.values(ORDER_STATUS) as OrderStatus[];

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const shippingStatus = getShippingStatusForOrder(selectedStatus);
      
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
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

  return {
    currentStatus,
    selectedStatus,
    setSelectedStatus,
    isUpdating,
    message,
    setMessage,
    handleStatusUpdate,
    validNextStatuses,
    allStatuses,
  };
}

