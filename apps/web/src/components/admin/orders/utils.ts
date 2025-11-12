import { ORDER_STATUS } from '../../../lib/order/order-status';
import type { OrderStatus } from '@prisma/client';
import type { StatusOption } from './types';

export function getStatusOptions(
  currentStatus: OrderStatus,
  validNextStatuses: OrderStatus[]
): StatusOption[] {
  const allStatuses = Object.values(ORDER_STATUS) as OrderStatus[];
  
  return allStatuses.map(status => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    color: status === currentStatus 
      ? 'bg-cyan-100 text-cyan-800' 
      : validNextStatuses.includes(status)
        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        : 'bg-gray-50 text-gray-400',
    disabled: !validNextStatuses.includes(status) && status !== currentStatus
  }));
}

