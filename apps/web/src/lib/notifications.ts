import { prisma } from './db';
import { NotificationType } from '@prisma/client';
import { getCleanupService } from './notification-cleanup';
import { PAGINATION_DEFAULTS, type OffsetPaginationResult } from './pagination-utils';

/**
 * Get the first product ID from an order
 */
// async function getFirstProductIdFromOrder(orderId: string): Promise<string | null> {
//   try {
//     const order = await prisma.order.findUnique({
//       where: { id: orderId },
//       include: {
//         items: {
//           take: 1,
//           orderBy: { id: 'asc' }
//         }
//       }
//     });
//     
//     return order?.items[0]?.productId || null;
//   } catch (error) {
//     console.error('Error getting first product ID from order:', error);
//     return null;
//   }
// }

/**
 * Get the first product slug from an order
 */
async function getFirstProductSlugFromOrder(orderId: string): Promise<string | null> {
  try {
    // First get the first order item
    const firstOrderItem = await prisma.orderItem.findFirst({
      where: { orderId },
      orderBy: { id: 'asc' },
      select: { productId: true }
    });
    
    if (!firstOrderItem) return null;
    
    // Then get the product slug
    const product = await prisma.product.findUnique({
      where: { id: firstOrderItem.productId },
      select: { slug: true }
    });
    
    return product?.slug || null;
  } catch (error) {
    console.error('Error getting first product slug from order:', error);
    return null;
  }
}

/**
 * Get user email from user ID
 */
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    
    return user?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

export interface NotificationData {
  orderId?: string;
  productId?: string;
  productSlug?: string;
  productName?: string;
  orderStatus?: string;
  trackingNumber?: string;
  userEmail?: string | null;
  firstProductId?: string | null;
  firstProductSlug?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Create a notification for a specific user
 */
export async function createUserNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : undefined,
    },
  });
}

/**
 * Create a system-wide notification (for all users)
 */
export async function createSystemNotification(
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  return await prisma.notification.create({
    data: {
      userId: null, // null = system-wide
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : undefined,
    },
  });
}

/**
 * Get notifications for a user with pagination
 */
export async function getUserNotificationsPaginated(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
): Promise<OffsetPaginationResult<any>> {
  const { 
    page = 1, 
    limit = PAGINATION_DEFAULTS.PAGE_SIZE, 
    unreadOnly = false, 
    type 
  } = options;

  // Trigger lazy cleanup (runs automatically if needed)
  const cleanupService = getCleanupService(prisma);
  cleanupService.lazyCleanup().catch(console.error); // Don't wait for it

  // Get user signup date
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true }
  });

  if (!user) {
    return {
      items: [],
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  // Calculate date range: from user signup date, but not older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const startDate = user.createdAt > thirtyDaysAgo ? user.createdAt : thirtyDaysAgo;

  const where: any = {
    AND: [
      {
        OR: [
          { userId }, // User-specific notifications
          { userId: null }, // System-wide notifications
        ],
      },
      {
        createdAt: {
          gte: startDate, // Only notifications from user signup date or last 30 days
        },
      },
    ],
  };

  if (unreadOnly) {
    where.AND.push({ read: false });
  }

  if (type) {
    where.AND.push({ type });
  }

  // Get total count for pagination
  const totalCount = await prisma.notification.count({ where });

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Get paginated results
  const items = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  return {
    items,
    currentPage: page,
    totalPages,
    totalCount,
    hasNext,
    hasPrev,
  };
}

/**
 * Get notifications for a user (legacy function for backward compatibility)
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
) {
  const result = await getUserNotificationsPaginated(userId, options);
  return result.items;
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
) {
  // Get user signup date
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true }
  });

  if (!user) {
    return { count: 0 };
  }

  // Calculate date range: from user signup date, but not older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const startDate = user.createdAt > thirtyDaysAgo ? user.createdAt : thirtyDaysAgo;

  return await prisma.notification.updateMany({
    where: {
      AND: [
        { id: { in: notificationIds } },
        {
          OR: [
            { userId },
            { userId: null }, // System-wide notifications
          ],
        },
        {
          createdAt: {
            gte: startDate, // Only notifications from user signup date or last 30 days
          },
        },
      ],
    },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  // Get user signup date
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true }
  });

  if (!user) {
    return { count: 0 };
  }

  // Calculate date range: from user signup date, but not older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const startDate = user.createdAt > thirtyDaysAgo ? user.createdAt : thirtyDaysAgo;

  return await prisma.notification.updateMany({
    where: {
      AND: [
        {
          OR: [
            { userId },
            { userId: null }, // System-wide notifications
          ],
        },
        {
          createdAt: {
            gte: startDate, // Only notifications from user signup date or last 30 days
          },
        },
        { read: false },
      ],
    },
    data: { read: true },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  // Get user signup date
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true }
  });

  if (!user) {
    return 0;
  }

  // Calculate date range: from user signup date, but not older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const startDate = user.createdAt > thirtyDaysAgo ? user.createdAt : thirtyDaysAgo;

  return await prisma.notification.count({
    where: {
      AND: [
        {
          OR: [
            { userId },
            { userId: null }, // System-wide notifications
          ],
        },
        {
          createdAt: {
            gte: startDate, // Only notifications from user signup date or last 30 days
          },
        },
        { read: false },
      ],
    },
  });
}

/**
 * Delete old notifications (cleanup)
 * Preserves ORDER_UPDATE notifications (status changes) as they are important for order history
 */
export async function deleteOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await prisma.notification.deleteMany({
    where: {
      AND: [
        { createdAt: { lt: cutoffDate } },
        { read: true }, // Only delete read notifications
        { type: { not: 'ORDER_UPDATE' } }, // Preserve order status changes
      ],
    },
  });
}

/**
 * Remove duplicate notifications from database
 * This function identifies and removes duplicate notifications based on:
 * - Same type, title, and timestamp (within 5 seconds)
 * - For PRODUCT_ALERT, also considers productId
 * - Keeps the database version (preferring the one with more complete data)
 */
export async function removeDuplicateNotifications() {
  console.log('🔍 Starting duplicate notification cleanup...');
  
  try {
    // Get all notifications grouped by potential duplicates
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const duplicatesToDelete: string[] = [];
    const processed = new Set<string>();

    for (const notification of notifications) {
      // Create a key for grouping potential duplicates
      let key = `${notification.type}-${notification.title}-${Math.floor(notification.createdAt.getTime() / 5000)}`;
      
      // For product alerts, include productId to distinguish different products
      if (notification.type === 'PRODUCT_ALERT' && notification.data && typeof notification.data === 'object') {
        const data = notification.data as any;
        if (data.productId) {
          key += `-${data.productId}`;
        }
      }

      if (processed.has(key)) {
        // This is a duplicate - mark for deletion
        duplicatesToDelete.push(notification.id);
        console.log(`🗑️ Marking duplicate for deletion: ${notification.id} (${notification.type})`);
      } else {
        processed.add(key);
      }
    }

    if (duplicatesToDelete.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: duplicatesToDelete },
        },
      });
      
      console.log(`✅ Removed ${result.count} duplicate notifications`);
      return result.count;
    } else {
      console.log('✅ No duplicate notifications found');
      return 0;
    }
  } catch (error) {
    console.error('❌ Failed to remove duplicate notifications:', error);
    throw error;
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  ORDER_STATUS_UPDATE: async (orderId: string, status: string, userId: string) => {
    const [userEmail, firstProductSlug] = await Promise.all([
      getUserEmail(userId),
      getFirstProductSlugFromOrder(orderId)
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
      getFirstProductSlugFromOrder(orderId)
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
      getFirstProductSlugFromOrder(orderId)
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
      getFirstProductSlugFromOrder(orderId)
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
