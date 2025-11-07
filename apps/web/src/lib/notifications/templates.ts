import { NotificationType } from '@prisma/client';
import { getFirstProductSlugFromOrder, getUserEmail } from './helpers';
import type { NotificationData } from './types';

export const NotificationTemplates = {
  ORDER_STATUS_UPDATE: async (orderId: string, status: string, userId: string) => {
    const [userEmail, firstProductSlug] = await Promise.all([
      getUserEmail(userId),
      getFirstProductSlugFromOrder(orderId),
    ]);

    return {
      type: 'ORDER_UPDATE' as NotificationType,
      title: 'i18n.notification.orderStatusUpdated',
      message: `i18n.notification.orderStatusUpdatedMsg|${orderId.slice(0, 8).toUpperCase()}|${status}`,
      data: { orderId, orderStatus: status, userEmail, firstProductSlug } as NotificationData,
    };
  },

  ORDER_SHIPPED: async (orderId: string, trackingNumber: string | undefined, userId: string) => {
    const [userEmail, firstProductSlug] = await Promise.all([
      getUserEmail(userId),
      getFirstProductSlugFromOrder(orderId),
    ]);

    return {
      type: 'ORDER_UPDATE' as NotificationType,
      title: 'i18n.notification.orderShipped',
      message: `i18n.notification.orderShippedMsg|${orderId.slice(0, 8).toUpperCase()}|${trackingNumber ?? ''}`,
      data: { orderId, orderStatus: 'SHIPPED', trackingNumber, userEmail, firstProductSlug } as NotificationData,
    };
  },

  ORDER_DELIVERED: async (orderId: string, userId: string) => {
    const [userEmail, firstProductSlug] = await Promise.all([
      getUserEmail(userId),
      getFirstProductSlugFromOrder(orderId),
    ]);

    return {
      type: 'ORDER_UPDATE' as NotificationType,
      title: 'i18n.notification.orderDelivered',
      message: `i18n.notification.orderDeliveredMsg|${orderId.slice(0, 8).toUpperCase()}`,
      data: { orderId, orderStatus: 'DELIVERED', userEmail, firstProductSlug } as NotificationData,
    };
  },

  ORDER_CONFIRMED: async (orderId: string, userId: string) => {
    const [userEmail, firstProductSlug] = await Promise.all([
      getUserEmail(userId),
      getFirstProductSlugFromOrder(orderId),
    ]);

    return {
      type: 'ORDER_UPDATE' as NotificationType,
      title: 'i18n.notification.orderConfirmed',
      message: `i18n.notification.orderConfirmedMsg|${orderId.slice(0, 8).toUpperCase()}`,
      data: { orderId, orderStatus: 'PAID', userEmail, firstProductSlug } as NotificationData,
    };
  },

  LOW_STOCK_ALERT: (productName: string, productSlug: string) => ({
    type: 'PRODUCT_ALERT' as NotificationType,
    title: 'i18n.notification.lowStock',
    message: `i18n.notification.lowStockMsg|${productName}`,
    data: { productSlug, productName },
  }),

  NEW_PRODUCT: (productName: string, productSlug: string) => ({
    type: 'PRODUCT_ALERT' as NotificationType,
    title: 'i18n.notification.newProduct',
    message: `i18n.notification.newProductMsg|${productName}`,
    data: { productSlug, productName },
  }),

  SYSTEM_MAINTENANCE: (message: string) => ({
    type: 'SYSTEM_ALERT' as NotificationType,
    title: 'i18n.notification.systemNotice',
    message,
    data: {},
  }),
};

