// Standalone order status definitions; avoid coupling to Prisma client types

// Unified order status system - single source of truth
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID', 
  FULFILLING: 'FULFILLING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELED',
  REFUNDED: 'REFUNDED',
} as const;

// Shipping status mapping - automatically synced with order status
export const SHIPPING_STATUS = {
  PREPARING: 'Preparing',
  IN_TRANSIT: 'In Transit', 
  DELIVERED: 'Delivered',
  EXCEPTION: 'Exception',
} as const;

// Status progression rules - defines valid transitions
export const STATUS_PROGRESSION = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.FULFILLING, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.FULFILLING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [], // Final state
  [ORDER_STATUS.CANCELED]: [ORDER_STATUS.REFUNDED], // Can still refund canceled orders
  [ORDER_STATUS.REFUNDED]: [], // Final state
} as const;

// Order status to shipping status mapping
export const ORDER_TO_SHIPPING_STATUS = {
  [ORDER_STATUS.PENDING]: null, // No shipping yet
  [ORDER_STATUS.PAID]: SHIPPING_STATUS.PREPARING,
  [ORDER_STATUS.FULFILLING]: SHIPPING_STATUS.PREPARING,
  [ORDER_STATUS.SHIPPED]: SHIPPING_STATUS.IN_TRANSIT,
  [ORDER_STATUS.DELIVERED]: SHIPPING_STATUS.DELIVERED,
  [ORDER_STATUS.CANCELED]: null, // No shipping for canceled
  [ORDER_STATUS.REFUNDED]: null, // No shipping for refunded
} as const;

// Status display configuration
export const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: {
    label: 'Pending',
    description: 'Order received, awaiting payment',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
    priority: 1,
  },
  [ORDER_STATUS.PAID]: {
    label: 'Paid',
    description: 'Payment confirmed, preparing order',
    color: 'bg-blue-100 text-blue-800',
    icon: '💳',
    priority: 2,
  },
  [ORDER_STATUS.FULFILLING]: {
    label: 'Fulfilling',
    description: 'Order being prepared for shipment',
    color: 'bg-purple-100 text-purple-800',
    icon: '📦',
    priority: 3,
  },
  [ORDER_STATUS.SHIPPED]: {
    label: 'Shipped',
    description: 'Order is on its way',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '🚚',
    priority: 4,
  },
  [ORDER_STATUS.DELIVERED]: {
    label: 'Delivered',
    description: 'Order has been delivered',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    priority: 5,
  },
  [ORDER_STATUS.CANCELED]: {
    label: 'Canceled',
    description: 'Order has been canceled',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    priority: 0,
  },
  [ORDER_STATUS.REFUNDED]: {
    label: 'Refunded',
    description: 'Order has been refunded',
    color: 'bg-gray-100 text-gray-800',
    icon: '↩️',
    priority: 0,
  },
} as const;

// Timeline event configuration
export const TIMELINE_EVENTS = [
  {
    status: ORDER_STATUS.PENDING,
    label: 'Order Placed',
    description: 'Your order has been received and is being processed',
    icon: '📝',
    required: true,
  },
  {
    status: ORDER_STATUS.PAID,
    label: 'Payment Confirmed',
    description: 'Payment has been processed successfully',
    icon: '💳',
    required: true,
  },
  {
    status: ORDER_STATUS.FULFILLING,
    label: 'Order Fulfilling',
    description: 'Your order is being prepared for shipment',
    icon: '📦',
    required: true,
  },
  {
    status: ORDER_STATUS.SHIPPED,
    label: 'Order Shipped',
    description: 'Your order is on its way',
    icon: '🚚',
    required: true,
  },
  {
    status: ORDER_STATUS.DELIVERED,
    label: 'Delivered',
    description: 'Your order has been delivered successfully',
    icon: '✅',
    required: true,
  },
] as const;

// Utility functions
export type OrderStatus = keyof typeof ORDER_STATUS;

export function getStatusConfig(status: OrderStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG[ORDER_STATUS.PENDING];
}

export function getShippingStatusForOrder(orderStatus: OrderStatus) {
  return ORDER_TO_SHIPPING_STATUS[orderStatus];
}

export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  const validTransitions = STATUS_PROGRESSION[from] as ReadonlyArray<OrderStatus> | undefined;
  return validTransitions ? validTransitions.includes(to) : false;
}

export function getTimelineEventsForStatus(currentStatus: OrderStatus) {
  const currentPriority = getStatusConfig(currentStatus).priority;
  
  return TIMELINE_EVENTS.map(event => {
    const eventPriority = getStatusConfig(event.status as OrderStatus).priority;
    const isCompleted = eventPriority <= currentPriority;
    const isCurrent = eventPriority === currentPriority;
    
    return {
      ...event,
      completed: isCompleted,
      current: isCurrent,
    };
  });
}

export function getNextValidStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return [...(STATUS_PROGRESSION[currentStatus] || [])];
}

// Type exports for TypeScript
export type OrderStatusType = keyof typeof ORDER_STATUS;
export type ShippingStatusType = keyof typeof SHIPPING_STATUS;

// i18n helpers
// These helpers do not fetch dictionaries themselves to keep this file environment-agnostic.
// Pass in a dictionary section shaped like locales.timeline + admin.orders status keys.
export function getLocalizedStatusLabel(status: OrderStatus, dict?: any): { label: string; description: string } {
  const base = STATUS_CONFIG[status] || STATUS_CONFIG[ORDER_STATUS.PENDING];
  if (!dict) return { label: base.label, description: base.description };
  switch (status) {
    case ORDER_STATUS.PENDING:
      return { label: dict?.timeline?.orderPlaced ?? base.label, description: dict?.timeline?.orderPlacedDesc ?? base.description };
    case ORDER_STATUS.PAID:
      return { label: dict?.timeline?.paymentConfirmed ?? base.label, description: dict?.timeline?.paymentConfirmedDesc ?? base.description };
    case ORDER_STATUS.FULFILLING:
      return { label: dict?.timeline?.orderFulfilling ?? base.label, description: dict?.timeline?.orderFulfillingDesc ?? base.description };
    case ORDER_STATUS.SHIPPED:
      return { label: dict?.timeline?.orderShipped ?? base.label, description: dict?.timeline?.onWay ?? base.description };
    case ORDER_STATUS.DELIVERED:
      return { label: dict?.timeline?.delivered ?? base.label, description: dict?.timeline?.deliveredDesc ?? base.description };
    case ORDER_STATUS.CANCELED:
      return { label: dict?.timeline?.canceled ?? base.label, description: dict?.timeline?.canceledDesc ?? base.description };
    case ORDER_STATUS.REFUNDED:
      return { label: dict?.timeline?.refunded ?? base.label, description: dict?.timeline?.refundedDesc ?? base.description };
    default:
      return { label: base.label, description: base.description };
  }
}

export function getLocalizedTimelineEvents(dict?: any) {
  return TIMELINE_EVENTS.map((e) => {
    const { label, description } = getLocalizedStatusLabel(e.status as OrderStatus, dict);
    return { ...e, label, description };
  });
}